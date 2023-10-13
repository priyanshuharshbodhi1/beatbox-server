const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  company: { type: String, required: true },
  type: { type: String, required: true },
  price: { type: Number, required: true },
  color: { type: String, required: true },
  rating: { type: Number, required: true },
  totalReviews: { type: Number, required: true },
  tagLine: { type: String, required: true },
  about: { type: String, required: true },
  stock: { type: String, required: true },
  images: [{ type: String, required: true }],
  featured: { type: Boolean, required: true},
});

module.exports = mongoose.model("Product", productSchema);
