const mongoose = require('mongoose')

const allowanceSchema = mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    amount: Number,
    source: String,
    period: String,
    startDate: {
        type: Date,
        default: Date.now
    }
})

module.exports = mongoose.model('allowance', allowanceSchema)