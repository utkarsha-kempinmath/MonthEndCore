const mongoose = require('mongoose')

const planningSchema = new mongoose.Schema({

    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },

    month: {
        type: String, // "2026-02"
        required: true
    },

    categories: [
        {
            name: String,
            amount: Number
        }
    ],

    total: {
        type: Number,
        default: 0
    }

}, { timestamps: true })

module.exports = mongoose.model('planning', planningSchema)
