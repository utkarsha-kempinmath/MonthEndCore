const Expense = require("../models/expensesModel");
const Planning = require("../models/planningModel");
const Calendar = require("../models/calendarModel");

async function getMonthlyFinance(userId) {
  const now = new Date();
  const year = now.getFullYear();
  const monthIndex = now.getMonth();

  const start = new Date(year, monthIndex, 1);
  const end = new Date(year, monthIndex + 1, 1);

  // Fetch data
  const [expenses, plan, events] = await Promise.all([
    Expense.find({
      user: userId,
      date: { $gte: start, $lt: end },
    }),
    Planning.findOne({
      user: userId,
      month: `${year}-${String(monthIndex + 1).padStart(2, "0")}`,
    }),
    Calendar.find({
      user: userId,
      $or: [
        { startDate: { $lte: end }, endDate: { $gte: start } },
        { startDate: { $lte: end }, endDate: null },
      ],
    }),
  ]);

  // 🔹 Total calculations
  const totalIncome = plan
    ? plan.categories.reduce((acc, c) => acc + c.amount, 0)
    : 0;

  const totalSpent = expenses.reduce((acc, e) => acc + e.amount, 0);

  const remaining = totalIncome - totalSpent;

  // 🔹 Category split
  const categoryMap = {};
  expenses.forEach((e) => {
    categoryMap[e.category] =
      (categoryMap[e.category] || 0) + e.amount;
  });

  const categorySplit = Object.entries(categoryMap).map(
    ([category, amount]) => ({ category, amount })
  );

  // 🔹 Event-based spending
  const eventSpendMap = {};

  expenses.forEach((e) => {
    if (e.eventId) {
      eventSpendMap[e.eventId] =
        (eventSpendMap[e.eventId] || 0) + e.amount;
    }
  });

  const eventBreakdown = events
    .map((e) => ({
      event: e.title,
      amount: eventSpendMap[e._id] || 0,
    }))
    .filter((e) => e.amount > 0);

  return {
    totalIncome,
    totalSpent,
    remaining,
    categorySplit,
    eventBreakdown,
  };
}

module.exports = { getMonthlyFinance };