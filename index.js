const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const bcrypt = require("bcrypt");
const app = express();
const dotenv = require("dotenv");
const path = require("path");
const PORT = process.env.PORT || 3500;
dotenv.config();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("./public"));

const User = require("./models/user.js");




app.get("/health", (req, res) => {
  res.json({ message: "All good!" });
});


app.post("/api/signup", async (req, res) => {
    try {
      const { name, mobile, email, password } = req.body;
      if (!password) {
        return res.status(400).json({ message: 'Password is required' });
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
      return res.status(500).json({ message: "An error occurred", error: error.message });
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
