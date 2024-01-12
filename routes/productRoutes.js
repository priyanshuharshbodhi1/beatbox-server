// productRoutes.js
const express = require("express");
const Product = require("../models/product.js");

const router = express.Router();

router.get("/products", async (req, res) => {
  try {
    const { type, color, company, price_gte, price_lte } = req.query;
    let query = {};

    if (type && type !== "Headphone type") {
      query.type = type;
    }
    if (color && color !== "Color") {
      query.color = color;
    }
    if (company && company !== "Company") {
      query.company = company;
    }
    if (price_gte && price_lte) {
      query.price = { $gte: parseInt(price_gte), $lte: parseInt(price_lte) };
    }

    let products = [];
    if (Object.keys(query).length === 0) {
      products = await Product.find({});
    } else {
      products = await Product.find(query);
    }

    res.send(products);
  } catch (error) {
    // console.error("Error fetching products: ", error);
    res.status(500).send("Internal Server Error");
  }
});

router.get("/products/search", async (req, res) => {
  try {
    const searchText = req.query.search;
    const { type, color, company, price_gte, price_lte } = req.query;
    const searchQuery = { name: { $regex: searchText, $options: "i" } };

    const dropdownQuery = {};
    if (type && type !== "Headphone type") {
      dropdownQuery.type = type;
    }
    if (color && color !== "Color") {
      dropdownQuery.color = color;
    }
    if (company && company !== "Company") {
      dropdownQuery.company = company;
    }
    if (price_gte && price_lte) {
      dropdownQuery.price = {
        $gte: parseInt(price_gte),
        $lte: parseInt(price_lte),
      };
    }

    const query = {
      $or: [searchQuery, dropdownQuery],
    };

    let products = [];
    if (searchText || Object.keys(dropdownQuery).length > 0) {
      products = await Product.find(query).limit(15);
    } else {
      products = await Product.find({}).limit(15);
    }
    res.send(products);
  } catch (error) {
    console.error("Error fetching products: ", error);
    res.status(500).send("Internal Server Error");
  }
});

router.get("/product/:productId", async (req, res) => {
  try {
    const productId = req.params.productId;
    const product = await Product.findById(productId).exec();
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }
    res.json(product);
  } catch (error) {
    console.error("Error fetching product: ", error);
    res.status(500).send("Internal Server Error");
  }
});

module.exports = router;
