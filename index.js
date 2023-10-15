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
    origin: `${process.env.REACT_URL}`,
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

//signup api
app.post("/api/signup", async (req, res) => {
  try {
    const { name, mobile, email, password } = req.body;
    if (!password) {
      return res.status(400).json({ message: "Password is required" });
    }
    const hashedPassword = await bcrypt.hash(password, 10);

    let user = await User.findOne({ email });
    if (user) {
      return res.json({ message: "User already exists" });
    } else {
      const newUser = new User({
        name,
        mobile,
        email,
        password: hashedPassword,
      });
      await newUser.save();

      // Generate JWT
      const jwToken = jwt.sign(newUser.toJSON(), process.env.JWT_SECRET, {
        expiresIn: "1h",
      });

      // Assign JWT to Cookie
      res.cookie("jwt", jwToken, { httpOnly: true });

      // Redirect to the desired URL
      return res.redirect(302, `${process.env.REACT_URL}`);
    }
  } catch (error) {
    // console.log(error);
    return res
      .status(500)
      .json({ message: "An error occurred", error: error.message });
  }
});

//login api
app.post("/api/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (user) {
      const passwordMatched = await bcrypt.compare(password, user.password);
      if (passwordMatched) {
        const jwToken = jwt.sign(user.toJSON(), process.env.JWT_SECRET, {
          expiresIn: "1h",
        });
        res.cookie("jwt", jwToken, { httpOnly: true });
        res.redirect(302, `${process.env.REACT_URL}`);
        return;
      } else {
        res.json({
          status: "FAIL",
          message: "Incorrect password",
        });
      }
    } else {
      res.json({
        status: "FAIL",
        message: "User does not exist",
      });
    }
  } catch (error) {
    // console.log(error);
    res.json({
      status: "FAIL",
      message: "Something went wrong",
      error,
    });
  }
});

//Middlewares
const isAuthenticated = (req, res, next) => {
  const token = req.cookies.jwt;
  // console.log("Token from Cookie:", token);
  // console.log("Request Headers:", req.headers);

  if (!token) {
    return res.sendStatus(401);
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.sendStatus(403);
    }

    req.user = user;

    next();
  });
};

//isloggedin api
app.get("/api/isloggedin", isAuthenticated, (req, res) => {
  // Check if the user is logged in and include the user's firstName in the response
  if (req.user) {
    res.json({ isLoggedIn: true });
  } else {
    res.json({ isLoggedIn: false });
  }
});

//logout api
app.post("/api/logout", (req, res) => {
  // Clear the JWT token from cookies by setting an expired token
  res.cookie("jwt", "", { expires: new Date(0) });

  res.status(200).json({ message: "Logged out successfully" });
});

app.get("/products", async (req, res) => {
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

app.get("/products/search", async (req, res) => {
  try {
    const searchText = req.query.search;
    const { type, color, company, price_gte, price_lte } = req.query;
    let query = {};

    if (searchText) {
      query.name = { $regex: searchText, $options: "i" };
    }
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
      products = await Product.find({
        name: { $regex: searchText, $options: "i" },
      }).limit(15);
    } else {
      products = await Product.find(query).limit(15);
    }
    res.send(products);
  } catch (error) {
    // console.error("Error fetching products: ", error);
    res.status(500).send("Internal Server Error");
  }
});

app.get("/product/:productId", async (req, res) => {
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

app.listen(PORT, () => {
  mongoose
    .connect(process.env.MONGODB_URL, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    })
    .then(() => console.log(`Server running on http://localhost:${PORT}`))
    .catch((error) => console.error(error));
});
