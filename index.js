const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const path = require("path");
const PORT = process.env.PORT || 3500;
dotenv.config();

const app = express();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("./public"));
app.use(cookieParser());

app.use(
  cors({
    // origin: `${process.env.REACT_URL}`,
    origin: "*",
    credentials: true,
  })
);

const User = require("./models/user.js");
const Product = require("./models/product.js");

// APIs------------------------------------------

//health api
app.get("/health", (req, res) => {
  res.json({ message: "All good!" });
});

const authRoutes = require("./routes/authRoutes");
const productRoutes = require("./routes/productRoutes");

app.use("/api", authRoutes);
app.use("/", productRoutes);

app.listen(PORT, () => {
  mongoose
    .connect(process.env.MONGODB_URL, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    })
    .then(() => console.log(`Server running on http://localhost:${PORT}`))
    .catch((error) => console.error(error));
});
