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
    origin: "http://localhost:3000",
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
      return res.redirect(302, "http://localhost:3000");
      console.log("User Created Successfully");
    }
  } catch (error) {
    console.log(error);
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
          expiresIn: 6000,
        });
        res.cookie("jwt", jwToken, { httpOnly: true });
        res.redirect(302, "http://localhost:3000");
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
    console.log(error);
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
    console.log(token);
  
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
      res.json({ isLoggedIn: true});
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
    const products = await Product.find({});
    res.send(products);
  } catch (error) {
    console.error("Error fetching products: ", error);
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
