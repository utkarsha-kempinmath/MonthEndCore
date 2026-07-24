const BehaviorProfile = require('../models/behaviorProfileModel')
const { buildBehaviorProfile } = require('../services/behaviorProfile')

exports.saveProfile = async (req, res) => {
  try {
    const userId = req.user._id
    const answers = req.body

    const traits = buildBehaviorProfile(answers)

    const profile = await BehaviorProfile.findOneAndUpdate(
      { user: userId },
      { traits, version: 1 },
      { upsert: true, new: true }
    )

    res.status(200).json({
      success: true,
      profile
    })

  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

exports.getProfile = async (req, res) => {
  try {
    const profile = await BehaviorProfile.findOne({
      user: req.user._id
    })

    res.json({
      success: true,
      profile
    })

  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}