const mongoose = require('mongoose')

const behaviorProfileSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },

  traits: {
    impulsivity: { type: Number, default: 0 },
    planning: { type: Number, default: 0 },
    emotionalSpending: { type: Number, default: 0 },
    socialInfluence: { type: Number, default: 0 }
  },

  version: {
    type: Number,
    default: 1
  }

}, { timestamps: true })

module.exports = mongoose.model('BehaviorProfile', behaviorProfileSchema)