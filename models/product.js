const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  company: { type: String, required: true },
  type: { type: String, required: true },
  price: { type: String, required: true },
  color: { type: String, required: true },
  rating: { type: String, required: true },
  reviews: { type: String, required: true },
  tagline: { type: String, required: true },
  about: { type: String, required: true },
  stock: { type: String, required: true },
  images: { type: Object, required: true },
  featured: { type: String, required: true},
});

module.exports = mongoose.model("Product", productSchema);
