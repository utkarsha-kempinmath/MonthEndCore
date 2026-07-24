exports.generateInsights = (stats, month, rawExpenses = [], eventContext = {}) => {
    // 1. Safety check -
    if (!stats || stats.length === 0) {
        return [`No spending data available for ${month}`];
    }

    const insights = [];

    // 2. Prepare Emotional Context
    const emotionMap = {};
    rawExpenses.forEach(exp => {
        const emo = exp.emotion?.primary || 'neutral';
        emotionMap[emo] = (emotionMap[emo] || 0) + exp.amount;
    });
    const topEmotionEntry = Object.entries(emotionMap).sort((a, b) => b[1] - a[1])[0];
    const topEmotion = topEmotionEntry ? topEmotionEntry[0] : null;

    const { isEventActive, examCount } = eventContext;

    // --- INSIGHT TYPE 1: Highest Expenditure Context ---
    // Finds your top expense and links it to your mood
    const topActual = [...stats].sort((a, b) => b.actual - a.actual)[0];
    if (topActual && topActual.actual > 0) {
        let msg = `Highest expenditure is in ${topActual.category} (₹${topActual.actual}).`;
        if (topEmotion) {
            msg += ` Most of this occurred while feeling ${topEmotion}.`;
        }
        insights.push(msg);
    }

    // --- INSIGHT TYPE 2: Overspending Context ---
    // Specifically targets where you went over the planned budget
    const overspent = stats.filter(s => s.diff > 0).sort((a, b) => b.diff - a.diff);
    if (overspent.length > 0) {
        const s = overspent[0];
        let msg = `${s.category} spending exceeded your plan by ₹${s.diff}.`;
        if (isEventActive) {
            msg += ` This often happens during active schedule periods.`;
        }
        insights.push(msg);
    }

    // --- INSIGHT TYPE 3: Academic/Event Warning ---
    // General behavioral warning based on your calendar
    if (examCount > 0) {
        insights.push(`With ${examCount} academic events scheduled, watch out for potential stress-related spending.`);
    }

    // Fallback if the user hasn't spent anything yet
    if (insights.length === 0) {
        insights.push(`Your spending is currently within the planned limits for ${month}.`);
    }

    return insights.slice(0, 3);
};