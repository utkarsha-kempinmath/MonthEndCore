const Expense = require("../models/expensesModel")

const allowedEmotions = [
  "stressed",
  "sad",
  "happy",
  "excited",
  "neutral",
  "celebrating",
  "anxious"
]

exports.addExpense = async (req, res) => {
  try {
    const { amount, category, note, emotion } = req.body

    if (!amount || !category || !emotion?.primary) {
      return res.status(400).json({
        success: false,
        message: "Amount, category and emotion.primary are required"
      })
    }

    if (amount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Amount must be greater than 0"
      })
    }

    if (!allowedEmotions.includes(emotion.primary)) {
      return res.status(400).json({
        success: false,
        message: "Invalid emotion type"
      })
    }

    const expense = await Expense.create({
      user: req.user._id,
      amount,
      category,
      date: new Date(),
      note: note || "",
      emotion: {
        primary: emotion.primary
      }
    })

    return res.status(201).json({
      success: true,
      expense
    })

  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message
    })
  }
}

exports.updateExpense = async (req, res) => {
  try {
    const { id } = req.params
    const { amount, category, date, note, emotion } = req.body

    const expense = await Expense.findOne({
      _id: id,
      user: req.user._id
    })

    if (!expense) {
      return res.status(404).json({
        success: false,
        message: "Expense not found"
      })
    }

    if (amount !== undefined) {
      if (amount <= 0) {
        return res.status(400).json({
          success: false,
          message: "Amount must be greater than 0"
        })
      }
      expense.amount = amount
    }

    if (category !== undefined) expense.category = category
    if (note !== undefined) expense.note = note

    if (date !== undefined) {
      expense.date = new Date(date)
    }

    if (emotion?.primary) {
      if (!allowedEmotions.includes(emotion.primary)) {
        return res.status(400).json({
          success: false,
          message: "Invalid emotion type"
        })
      }
      expense.emotion.primary = emotion.primary
      expense.emotion.version += 1
    }

    await expense.save()

    return res.status(200).json({
      success: true,
      expense
    })

  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message
    })
  }
}

exports.deleteExpense = async (req, res) => {
  try {
    const { id } = req.params

    const expense = await Expense.findOneAndDelete({
      _id: id,
      user: req.user._id
    })

    if (!expense) {
      return res.status(404).json({
        success: false,
        message: "Expense not found"
      })
    }

    return res.status(200).json({
      success: true,
      message: "Expense deleted successfully"
    })

  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message
    })
  }
}

exports.getExpenses = async (req, res) => {
  try {
    const expenses = await Expense.find({
      user: req.user._id
    }).sort({ date: -1 })

    return res.status(200).json({
      success: true,
      count: expenses.length,
      expenses
    })

  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message
    })
  }
}