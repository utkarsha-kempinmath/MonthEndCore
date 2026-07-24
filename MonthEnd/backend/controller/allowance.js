const { ErrorHandler } = require('../errors/error.js');
const User = require('../models/userModel.js');
const dotenv = require('dotenv')
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken')
dotenv.config({path: './config/config.env'});
const Allowance = require("../models/allowanceModel");

const getAllowances = async (req, res) => {
  try {
    const allowances = await Allowance.find({ user: req.user._id });
    console.log("req.user →", req.user)


    res.status(200).json({
      success: true,
      allowances
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const addAllowance = async (req, res) => {
  try {
    const { amount, source, period, startDate } = req.body;

    if (!amount) {
      return res.status(400).json({ message: "Amount required" });
    }

    const newAllowance = await Allowance.create({
      user: req.user._id,  
      amount,
      source,
      period, // keep it opts not for the user to add manually
      startDate
    });

    res.status(201).json({
      success: true,
      allowance: newAllowance
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const updateAllowance = async (req, res) => {
  try {
    const allowance = await Allowance.findOneAndUpdate(
      {
        _id: req.params.id,
        user: req.user._id 
      },
      req.body,
      { new: true }
    );

    res.status(200).json({
      success: true,
      allowance
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const deleteAllowance = async (req, res) => {
  try {
    await Allowance.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id
    });

    res.status(200).json({
      success: true,
      message: "Deleted successfully"
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};



module.exports = {
  getAllowances,
  addAllowance,
  updateAllowance,
  deleteAllowance
};
