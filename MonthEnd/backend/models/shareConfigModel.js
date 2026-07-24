const mongoose = require("mongoose");

const shareConfigSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    unique: true,
  },

  parentEmail: {
    type: String,
    required: true,
  },

  sharingDate: {
    type: Number,
    required: true,
    default: 1, // Defaults to the 1st of the month
    min: 1,
    max: 28, // Max 28 prevents the "February Bug" (explained below)
  },

  isSharingEnabled: {
    type: Boolean,
    default: false,
  },

  sharingPreferences: {
  monthlySummary: { type: Boolean, default: true },
  categorySplit: { type: Boolean, default: true },
  goalsProgress: { type: Boolean, default: true },
  reflections: { type: Boolean, default: true },
  emotionalInsights: { type: Boolean, default: false },
  events: { type: Boolean, default: true } // 🔥 added
},

  tone: {
    type: String,
    enum: ["strict", "neutral", "supportive"],
    default: "supportive",
  },

  lastSentAt: Date,
}, { timestamps: true });

module.exports = mongoose.model("ShareConfig", shareConfigSchema);