const BehaviorProfile = require('../models/behaviorProfileModel')
const { buildBehaviorProfile } = require('../services/behaviorProfile')
const Calendar = require('../models/calendarModel')
const Goal = require('../models/goalModel')

exports.completeOnboarding = async (req, res) => {
  try {
    const userId = req.user._id

    const { profileAnswers, eventAnswers, goalData } = req.body

    // 1. SAVE BEHAVIOR PROFILE
    const traits = buildBehaviorProfile(profileAnswers)

    await BehaviorProfile.findOneAndUpdate(
      { user: userId },
      { traits, version: 1 },
      { upsert: true, new: true }
    )

    // 2. SAVE EVENTS
    if (eventAnswers && Array.isArray(eventAnswers)) {
      const eventsToInsert = eventAnswers.map(event => ({
        user: userId,
        eventName: event.eventName || "New Event",
        startDate: event.startDate || new Date(),
        endDate: event.endDate || null,
        eventType: event.eventType || "personal",
        // Dynamically capture the impact selected by the user, fallback to medium
        expectedImpact: event.expectedImpact || "medium" 
      }));

      if (eventsToInsert.length > 0) {
        await Calendar.insertMany(eventsToInsert);
      }
    }
    
    // 3. SAVE GOAL
    if (goalData) {
      await Goal.create({
        user: userId,
        name: goalData.name,
        targetAmount: goalData.targetAmount,
        timelineMonths: goalData.timelineMonths
      })
    }

    res.json({ success: true })

  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}