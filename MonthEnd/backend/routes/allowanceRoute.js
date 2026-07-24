const express = require("express");
const {
  getAllowances,
  addAllowance,
  updateAllowance,
  deleteAllowance
} = require("../controller/allowance");

const  isLoggedIn  = require("../middleware/auth");

const router = express.Router();
router.get("/", isLoggedIn, getAllowances);
router.post("/", isLoggedIn, addAllowance);
router.put("/:id", isLoggedIn, updateAllowance);
router.delete("/:id", isLoggedIn, deleteAllowance);

module.exports = router;
