const mongoose = require("mongoose")

const goalSchema = mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    name: {
        type: String,
        required: true
    },
    targetAmount: {
        type: Number,
        required: true
    },
    timelineMonths: {
        type: Number,
        required: true
    },
    savedAmount: {
        type: Number,
        default: 0
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
})

module.exports = mongoose.model("goal", goalSchema)
