// authRoutes.js
const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/user.js");
const { isAuthenticated } = require("../middlewares/isAuthenticated.js"); 

const router = express.Router();

router.post("/signup", async (req, res) => {
    try {
        const { name, mobile, email, password } = req.headers;
        console.log(name)
        // console.log(req.headers)
        if (!password) {
            return res.status(400).json({ message: "Password is required" });
        }
        const hashedPassword = await bcrypt.hash(password, 10);

        let user = await User.findOne({ email });
        console.log("user:",user)
        if (user) {
            return res.json({ message: "User already exists" });
        } else {
            const newUser = new User({
                name,
                mobile,
                email,
                password: hashedPassword,
            });
            console.log("newUser:",newUser)
            await newUser.save();

            // Generate JWT
            const jwToken = jwt.sign(newUser.toJSON(), process.env.JWT_SECRET, {
                expiresIn: "10h",
            });

            // Send JWT to frontend
            return res.status(200).json({ token: jwToken });
        }
    } catch (error) {
        // console.log(error);
        return res
            .status(500)
            .json({ message: "An error occurred", error: error.message });
    }
});

router.post("/login", async (req, res) => {
    try {
        const { email, password } = req.headers;
        const user = await User.findOne({ email });
        console.log(req.headers);
        if (user) {
            const passwordMatched = await bcrypt.compare(password, user.password);
            if (passwordMatched) {
                const token = jwt.sign(user.toJSON(), process.env.JWT_SECRET, {
                    expiresIn: "1h",
                });
                res.status(200).json({ token: token });
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

router.get("/isloggedin", isAuthenticated, (req, res) => {
    // Check if the user is logged in and include the user's firstName in the response
    if (req.user) {
        res.json({ isLoggedIn: true });
    } else {
        res.json({ isLoggedIn: false });
    }
});

module.exports = router;
