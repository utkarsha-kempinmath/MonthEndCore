const mongoose = require('mongoose')

const calendarSchema = new mongoose.Schema({

    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },

    eventName: {
        type: String,
        required: true,
        trim: true
    },

    startDate: {
        type: Date,
        required: true
    },

    endDate: Date,

    eventType: {
        type: String,
        enum: ['academic', 'social', 'personal', 'financial', 'other'],
        default: 'other'
    },

    isRecurring: {
        type: Boolean,
        default: false
    },


    expectedImpact: {
        type: String,
        enum: ['low', 'medium', 'high'],
        default: 'medium'
    }

}, { timestamps: true })

module.exports = mongoose.model('calendar', calendarSchema)

