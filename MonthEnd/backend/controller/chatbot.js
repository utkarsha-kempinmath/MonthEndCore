const BehaviorSnapshot = require("../models/behaviorSnapshotModel");
const Expense = require("../models/expensesModel");
const Goal = require("../models/goalModel");
const Allowance = require("../models/allowanceModel");
const Planning = require("../models/planningModel");
const Calendar = require("../models/calendarModel"); // <-- Added Calendar
const { runChatbot } = require("../services/mlBridge");

exports.handleChatQuery = async (req, res) => {
  try {
    const userId = req.user._id;
    const { question } = req.body;

    const now = new Date();
    const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    // 1. Fetch live real-time data including Calendar!
    const [snapshot, expenses, goals, allowance, plan, events] = await Promise.all([
        BehaviorSnapshot.findOne({ user: userId, month }).lean(),
        Expense.find({ user: userId, date: { $gte: start, $lt: end } }).lean(),
        Goal.find({ user: userId }).lean(),
        Allowance.findOne({ user: userId }).lean(),
        Planning.findOne({ user: userId, month }).lean(),
        Calendar.find({
            user: userId,
            $or: [
                { startDate: { $lte: end }, endDate: { $gte: start } },
                { startDate: { $lte: end }, endDate: null }
            ]
        }).lean()
    ]);

    if (!snapshot) {
      return res.status(200).json({
        success: true,
        message: "I don't have your financial profile loaded yet! Please open the 'Month Track' page once so I can analyze your data — then I'll be ready to help."
      });
    }

    // 2. Calculate real-time stats & projections
    const totalSpent = expenses.reduce((sum, e) => sum + e.amount, 0);
    const monthlyAllowance = allowance ? allowance.amount : 0;
    const remaining = monthlyAllowance - totalSpent;

    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const daysLeft = Math.max(1, daysInMonth - now.getDate());
    const daysSpent = Math.max(1, now.getDate());
    const avgDailySpend = totalSpent / daysSpent;

    const totalTarget = goals.reduce((sum, g) => sum + g.targetAmount, 0);
    const totalSaved = goals.reduce((sum, g) => sum + g.savedAmount, 0);
    const goalCount = goals.length;
    const pressureScore = totalTarget ? (totalTarget - totalSaved) / totalTarget : 0;
    const avgTimeline = goals.length ? goals.reduce((sum, g) => sum + g.timelineMonths, 0) / goals.length : 1;
    const monthlyTargetSavings = totalTarget / avgTimeline;
    const onTrack = (totalSaved / Math.max(1, avgTimeline)) >= (monthlyTargetSavings * 0.8);

    const categoryMap = {};
    expenses.forEach(e => {
        const cat = e.category.toLowerCase().trim();
        categoryMap[cat] = (categoryMap[cat] || 0) + e.amount;
    });

    // 3. Calculate Live Events
    const upcomingEvents = events.filter(e => new Date(e.startDate) >= now);
    const activeEvents = events.filter(e => new Date(e.startDate) <= now && (e.endDate ? new Date(e.endDate) >= now : true));

    // 4. Patch mlOutput
    let mlOutput = snapshot?.mlOutput || {};
    
    mlOutput.financialPosition = {
        ...(mlOutput.financialPosition || {}),
        spent: totalSpent,
        budget: monthlyAllowance,
        remaining: remaining,
        avgDailySpend: avgDailySpend,
        daysLeft: daysLeft
    };

    mlOutput.goalStatus = {
        ...(mlOutput.goalStatus || {}),
        totalTarget,
        totalSaved,
        goalCount,
        pressureScore,
        onTrack
    };

    // Inject the calendar context
    mlOutput.liveEvents = {
        active: activeEvents.length,
        upcoming: upcomingEvents.length
    };

    mlOutput.summary = categoryMap;
    mlOutput.anomalies = mlOutput.anomalies || [];

    const planCategories = plan ? plan.categories : [];

    // 5. Run Python Bot
    const botResponse = await runChatbot(
      mlOutput,
      question,
      planCategories
    );

    res.json({
      success: true,
      message: botResponse.answer
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};