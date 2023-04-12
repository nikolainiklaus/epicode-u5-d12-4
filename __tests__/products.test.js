// By default Jest does not work with the import syntax
// If you want to use import syntax you should add NODE_OPTIONS=--experimental-vm-modules to the test script in package.json
// On Windows you cannot use NODE_OPTIONS (as well as other env vars in scripts) from the command line --> solution is to use cross-env in order to be able to pass
// env vars to command line scripts on all operative systems!
import supertest from "supertest";
import dotenv from "dotenv";
import mongoose from "mongoose";
import server from "../src/server.js";
import ProductsModel from "../src/api/products/model.js";

dotenv.config(); // This command forces .env vars to be loaded into process.env. This is the way to go when you can't use -r dotenv/config

// supertest is capable of running server.listen from our Express app if we pass the server to it
// It will give us back an object (client) that can be used to run http requests on that server
const client = supertest(server);

const validProduct = {
  name: "iPhone",
  description: "Good phone",
  price: 10000,
};

const notValidProduct = {
  description: "Good phone",
  price: 10000,
};

beforeAll(async () => {
  await mongoose.connect(process.env.MONGO_TEST_URL);
  const product = new ProductsModel(validProduct);
  await product.save();
}); // beforeAll is a Jest hook which will be ran before all tests, usually this is used to connect to db and to do some initial setup like adding some mock data to the db

afterAll(async () => {
  await ProductsModel.deleteMany();
  await mongoose.connection.close();
}); // afterAll hook could to clean up the situation (close the connection to Mongo gently and clean up db/collections)

describe("Test Products APIs", () => {
  // it("Should test that GET /test endpoint returns 200 and a body containing a message", async () => {
  //   const response = await client.get("/test")
  //   expect(response.status).toBe(200)
  //   expect(response.body.message).toEqual("TEST SUCCESSFULL")
  // })
  it("Should test that env vars are loaded correctly", () => {
    expect(process.env.MONGO_TEST_URL).toBeDefined();
  });

  it("Should test that POST /products returns 201 and an _id if a valid product is provided in req.body", async () => {
    const response = await client
      .post("/products")
      .send(validProduct)
      .expect(201);
    expect(response.body._id).toBeDefined();
  });

  it("Should test that POST /products returns 400 if a not valid product is provided in req.body", async () => {
    await client.post("/products").send(notValidProduct).expect(400);
  });

  it("Should test that GET /products returns 200 and a body", async () => {
    const response = await client.get("/products").expect(200);
    // console.log(response.body);
  });

  it("/products/:id endpoint should return 404 with non-existing ids, or return product if valid", async () => {
    // Test with a non-existing id
    const nonExistingId = "123456123456123456123456"; // Non-existing id, 24 characters
    const response404 = await client
      .get(`/products/${nonExistingId}`)
      .expect(404);

    // Test with a valid id
    const product = new ProductsModel(validProduct);
    await product.save();
    const response200 = await client
      .get(`/products/${product._id}`)
      .expect(200);
  });

  it("DELETE /products/:id should return 204 if successful, or return 404 with non-existing ID", async () => {
    const nonExistingId = "123456123456123456123456";
    const response404 = await client
      .delete(`/products/${nonExistingId}`)
      .expect(404);

    const product = new ProductsModel(validProduct);
    const response204 = client.delete(`/products/${product._id}`).expect(204);
  });

  it("Should update product with new data, or return 404 with non-existing id, and check that response is correct", async () => {
    const product = new ProductsModel(validProduct);
    await product.save();

    // Define new data to update the product with
    const newData = {
      name: "iPhone",
      description: "A great updated phone",
      price: 15000,
    };

    // Test with a valid id and new data
    const response = await client
      .put(`/products/${product._id}`)
      .send(newData)
      .expect(200);

    expect(response.body.name).toEqual(newData.name);
    expect(typeof response.body.name).toEqual("string");

    // Test with a non-existing id
    const nonExistingId = "123456123456123456123456"; // Non-existing id, 24 characters
    const response404 = await client
      .put(`/products/${nonExistingId}`)
      .send(newData)
      .expect(404);
  });

  it("Should return all products when no query parameters are provided", async () => {
    const products = [
      { name: "iPhone", description: "A good phone", price: 10000 },
      {
        name: "Samsung Galaxy S21",
        description: "A great phone",
        price: 15000,
      },
      { name: "OnePlus 9 Pro", description: "A powerful phone", price: 12000 },
    ];
    await ProductsModel.insertMany(products);

    const response = await client.get("/products");
    expect(response.status).toBe(200);
    expect(response.body.length).toBe(7);
  });

  it("Should return products with a name containing the query parameter ?search=Samsung", async () => {
    const response = await client.get("/products?search=Samsung");
    console.log(response.body);
    expect(response.status).toBe(200);
    expect(response.body.length).toBe(1);
  });

  it("GET /products should return all products in alphabetical order", async () => {
    const response = await client.get("/products");
    expect(response.status).toBe(200);

    const sortedProducts = response.body.sort((a, b) =>
      a.name.localeCompare(b.name)
    );

    expect(response.body).toEqual(sortedProducts);
  });
});
