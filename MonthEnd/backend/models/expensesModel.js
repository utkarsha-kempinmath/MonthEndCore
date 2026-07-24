const mongoose = require('mongoose')

const expenseSchema = new mongoose.Schema({

    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },

    amount: {
        type: Number,
        required: true
    },

    date: {
        type: Date,
        default: Date.now
    },

    category: {
        type: String,
        required: true
    },

    note: String,

    emotion: {
    primary: {
        type: String,
        required: true,
        enum: [
            "stressed",
            "sad",
            "happy",
            "excited",
            "neutral",
            "celebrating",
            "anxious"
        ]
    },
    version: {
        type: Number,
        default: 1
    }
}

}, { timestamps: true })

module.exports = mongoose.model('Expense', expenseSchema)
