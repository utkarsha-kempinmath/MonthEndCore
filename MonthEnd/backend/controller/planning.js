const Planning = require('../models/planningModel')

exports.savePlan = async (req, res) => {
    try {
        const { categories, month } = req.body

        if (!categories || !month) {
            return res.status(400).json({ error: 'categories and month are required' })
        }

        const safeCategories = categories.map(c => ({
            name: c.name,
            amount: Number(c.amount) || 0
        }))

        const total = safeCategories.reduce((sum, c) => sum + c.amount, 0)

        const plan = await Planning.findOneAndUpdate(
            { user: req.user._id, month },
            { categories: safeCategories, total },
            { upsert: true, new: true }
        )

        res.json({
            success: true,
            plan
        })

    } catch (err) {
        res.status(500).json({ error: err.message })
    }
}

exports.getPlan = async (req, res) => {
    try {
        const month = req.query.month || new Date().toISOString().slice(0, 7)

        const plan = await Planning.findOne({
            user: req.user._id,
            month
        })

        res.json({
            success: true,
            plan: plan || { categories: [], total: 0, month }
        })

    } catch (err) {
        res.status(500).json({ error: err.message })
    }
}