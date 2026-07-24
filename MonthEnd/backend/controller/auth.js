const { ErrorHandler } = require('../errors/error.js');
const User = require('../models/userModel.js');
const dotenv = require('dotenv')
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken')
dotenv.config({ path: './config/config.env' });

const createdUser = async (req, res, next) => {

  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return next(new ErrorHandler("Please fill the required information!", 400));
  }

  try {
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User already registered, Try Login!!"
      });
    }
    
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await User.create({
      username,
      email,
      password: hashedPassword
    });

    const token = jwt.sign(
      { _id: newUser._id },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES }
    );

    return res.status(201).json({
      success: true,
      token,
      user: newUser
    });

  } catch (err) {
    next(err);
  }
};

const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password required"
      });
    }

    // Add .select("+password") here to retrieve the hashed password
    const user = await User.findOne({ email }).select("+password");

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid credentials"
      });
    }

    // Now user.password will exist for the comparison
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: "Invalid credentials"
      });
    }

    const token = jwt.sign(
      { _id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES || "7d" }
    );

    return res.json({
      success: true,
      token,
      user
    });

  } catch (err) {
    next(err);
  }
};

module.exports = { createdUser, loginUser };