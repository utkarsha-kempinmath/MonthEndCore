const BehaviorSnapshot = require("../models/behaviorSnapshotModel");
const ShareConfig = require("../models/shareConfigModel");
const { getMonthlyFinance } = require("./financeService");

async function generateParentReport(userId) {
  const snapshot = await BehaviorSnapshot.findOne({ user: userId }).sort({
    createdAt: -1,
  });

  const config = await ShareConfig.findOne({ userId });

  if (!snapshot || !config || !config.isSharingEnabled) return null;

  const prefs = config.sharingPreferences;

  // 🔥 Get real financial data
  const finance = await getMonthlyFinance(userId);

  const report = {};

  // ✅ Summary
  if (prefs.monthlySummary) {
    report.summary = {
      totalSpent: finance.totalSpent,
      remaining: finance.remaining,
      riskLevel: snapshot.mlOutput?.risk?.level || "low",
    };
  }

  // ✅ Categories (top spending areas)
  if (prefs.categorySplit) {
    report.categories = finance.categorySplit;
  }

  // ✅ Events (context-based spending)
  if (prefs.events !== false) {
    report.events = finance.eventBreakdown;
  }

  // ✅ Reflection (AI summary)
  if (prefs.reflections) {
    report.reflection =
      snapshot.mlOutput?.summary ||
      "This month shows stable financial behavior.";
  }

  // 🔥 Add derived insights (optional but powerful)
  if (finance.categorySplit?.length) {
    const topCategory = [...finance.categorySplit].sort(
      (a, b) => b.amount - a.amount
    )[0];

    report.topCategoryInsight = `Most spending was concentrated in ${topCategory.category}.`;
  }

  if (finance.eventBreakdown?.length) {
    report.eventInsight =
      "Spending appears influenced by recent events.";
  }

  return report;
}

module.exports = { generateParentReport };