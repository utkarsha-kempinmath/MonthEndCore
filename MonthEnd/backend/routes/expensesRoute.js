const express = require("express")
const router = express.Router()

const isLoggedIn = require("../middleware/auth")

const {
  addExpense,
  updateExpense,
  deleteExpense,
  getExpenses
} = require("../controller/expenses")

router.post("/add", isLoggedIn, addExpense)
router.put("/:id", isLoggedIn, updateExpense)
router.delete("/:id", isLoggedIn, deleteExpense)
router.get("/", isLoggedIn, getExpenses)

module.exports = router
