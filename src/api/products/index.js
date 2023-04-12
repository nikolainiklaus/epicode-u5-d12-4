import express from "express";
import createError from "http-errors";
import ProductsRouter from "./model.js";

const productsRouter = express.Router();

productsRouter.post("/", async (req, res, next) => {
  try {
    const newResource = new ProductsRouter(req.body);
    const { _id } = await newResource.save();
    res.status(201).send({ _id });
  } catch (error) {
    next(error);
  }
});

// productsRouter.get("/", async (req, res, next) => {
//   try {
//     const resources = await ProductsRouter.find();
//     res.send(resources);
//   } catch (error) {
//     next(error);
//   }
// });

productsRouter.get("/:id", async (req, res, next) => {
  try {
    const resource = await ProductsRouter.findById(req.params.id);
    if (resource) {
      res.send(resource);
    } else {
      next(createError(404, `Resource with id ${req.params.id} not found!`));
    }
  } catch (error) {
    next(error);
  }
});

productsRouter.get("/", async (req, res, next) => {
  try {
    const searchQuery = req.query.search;
    let products = await ProductsRouter.find();
    if (searchQuery) {
      products = products.filter((product) =>
        product.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    res.send(products);
  } catch (error) {
    next(error);
  }
});

productsRouter.put("/:id", async (req, res, next) => {
  try {
    const updatedResource = await ProductsRouter.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (updatedResource) {
      res.send(updatedResource);
    } else {
      next(createError(404, `Resource with id ${req.params.id} not found!`));
    }
  } catch (error) {
    next(error);
  }
});

productsRouter.delete("/:id", async (req, res, next) => {
  try {
    const deletedResource = await ProductsRouter.findByIdAndUpdate(
      req.params.id
    );
    if (deletedResource) {
      res.status(204).send();
    } else {
      next(createError(404, `Resource with id ${req.params.id} not found!`));
    }
  } catch (error) {
    next(error);
  }
});

export default productsRouter;
