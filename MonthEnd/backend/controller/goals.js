const Goal = require('../models/goalModel')

exports.getAllGoals = async (req, res) => {
    try {

        const userId = req.user._id

        const goals = await Goal.find({ user: userId })

        res.json({
            success: true,
            goals
        })

    } catch (err) {
        res.status(500).json({ error: err.message })
    }
}

exports.createGoal = async (req, res) => {
    try {

        const userId = req.user._id
        const { name, targetAmount, timelineMonths } = req.body

        const goal = await Goal.create({
            user: userId,
            name,
            targetAmount,
            timelineMonths
        })

        res.status(201).json({
            success: true,
            goal
        })

    } catch (err) {
        res.status(500).json({ error: err.message })
    }
}

exports.getGoalAnalysis = async (req, res) => {
    try {

        const goal = await Goal.findOne({
            _id: req.params.goalId,
            user: req.user._id
        })

        if (!goal)
            return res.status(404).json({ message: "Goal not found" })

        const remaining = goal.targetAmount - goal.savedAmount

        const percentComplete = Math.min(
            (goal.savedAmount / goal.targetAmount) * 100,
            100
        )

        const now = new Date()

        const monthsPassed =
            (now.getFullYear() - goal.createdAt.getFullYear()) * 12 +
            (now.getMonth() - goal.createdAt.getMonth()) + 1

        const avgMonthlySavings =
            monthsPassed > 0
                ? goal.savedAmount / monthsPassed
                : goal.savedAmount

        const projectedMonths =
            avgMonthlySavings > 0
                ? Math.ceil(remaining / avgMonthlySavings)
                : null

        const insights = []

        if (projectedMonths)
            insights.push(
                `At your current pace, this goal completes in ${projectedMonths} months.`
            )

        if (remaining > 0)
            insights.push(
                `You need ₹${remaining.toLocaleString()} more to reach this goal.`
            )

        res.json({
            success: true,
            goal,
            percentComplete,
            remaining,
            projectedMonths,
            insights
        })

    } catch (err) {
        res.status(500).json({ error: err.message })
    }
}

exports.updateGoal = async (req, res) => {
    try {

        const { name, targetAmount, timelineMonths, savedAmount } = req.body

        const goal = await Goal.findOneAndUpdate(
            {
                _id: req.params.goalId,
                user: req.user._id
            },
            {
                name,
                targetAmount,
                timelineMonths,
                savedAmount
            },
            { new: true }
        )

        if (!goal)
            return res.status(404).json({ message: "Goal not found" })

        res.json({
            success: true,
            goal
        })

    } catch (err) {
        res.status(500).json({ error: err.message })
    }
}

exports.deleteGoal = async (req, res) => {
    try {

        const goal = await Goal.findOneAndDelete({
            _id: req.params.goalId,
            user: req.user._id
        })

        if (!goal)
            return res.status(404).json({ message: "Goal not found" })

        res.json({
            success: true,
            message: "Goal deleted successfully"
        })

    } catch (err) {
        res.status(500).json({ error: err.message })
    }
}
