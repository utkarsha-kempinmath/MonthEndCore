const mongoose = require('mongoose')

const userSchema = mongoose.Schema({
    username: String, // Changed from fullname
    email: {
        type: String,
        unique: true,
        required: true
    },
    password: { // Changed from passwordHash
        type: String,
        select: false // This hides it from queries by default
    },
    authProvider: {
        type: String,
        enum: ["local", "google"],
        default: "local"
    },
    calander: {
        type: Array,
        default: []
    },
    allowance: {
        type: Array,
        default: []
    },
    planning: {
        type: Array,
        default: []
    },
    expenses: {
        type: Array,
        default: []
    },
    goal: {
        type: Array,
        default: []
    }
})

module.exports = mongoose.model('User', userSchema)