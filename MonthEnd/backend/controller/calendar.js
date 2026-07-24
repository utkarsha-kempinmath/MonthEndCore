const Calendar = require('../models/calendarModel')

exports.addEvent = async (req, res) => {
    try {

        const allowedTypes = ['academic', 'social', 'personal', 'financial', 'other']

        if (req.body.eventType && !allowedTypes.includes(req.body.eventType)) {
            return res.status(400).json({ error: "Invalid eventType" })
        }

        if (!req.body.expectedImpact) {
            req.body.expectedImpact = "medium"
        }

        const event = await Calendar.create({
            ...req.body,
            user: req.user._id
        })

        res.status(201).json({
            success: true,
            event
        })
    } catch (err) {
        res.status(500).json({ error: err.message })
    }
}

exports.getEvents = async (req, res) => {
    try {
        const events = await Calendar.find({ user: req.user._id })
            .sort({ startDate: 1 })

        res.json({
            success: true,
            events
        })
    } catch (err) {
        res.status(500).json({ error: err.message })
    }
}

exports.updateEvent = async (req, res) => {
    try {

        const event = await Calendar.findOneAndUpdate(
            { _id: req.params.id, user: req.user._id },
            req.body,
            { new: true }
        )

        if (!event) {
            return res.status(404).json({ error: "Event not found" })
        }

        res.json({
            success: true,
            event
        })
    } catch (err) {
        res.status(500).json({ error: err.message })
    }
}

exports.deleteEvent = async (req, res) => {
    try {

        const deleted = await Calendar.findOneAndDelete({
            _id: req.params.id,
            user: req.user._id
        })

        if (!deleted) {
            return res.status(404).json({ error: "Event not found" })
        }

        res.json({ success: true })
    } catch (err) {
        res.status(500).json({ error: err.message })
    }
}