/**
 * Helper: Calculate standard deviation of an array
 * Used to measure dispersion in daily spending.
 * If no values, return 0 to avoid NaN.
 */
const calculateStdDev = (arr) => {
    if (!arr.length) return 0

    const mean = arr.reduce((a, b) => a + b, 0) / arr.length
    const variance = arr.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / arr.length
    return Math.sqrt(variance)
}

/**
 * Safe division helper.
 * Prevents division by zero errors.
 * Returns 0 when denominator is 0.
 */
const safeDivide = (a, b) => {
    if (!b) return 0
    return a / b
}

/**
 * Builds structured Behavioral State Vector for a given month.
 * 
 * This function converts raw transaction data into a normalized
 * feature representation suitable for ML modeling.
 * 
 * No raw user data is exposed beyond aggregated signals.
 */

exports.buildBehavioralStateInput = ({
    currentExpenses = [],
    previousExpenses = [],
    currentPlan = { total: 0 },
    year,
    monthIndex
}) => {

    // If no expenses for current month, no behavioral state exists
    if (!currentExpenses.length) return null


    // BASIC AGGREGATES

    const totalSpent = currentExpenses.reduce((sum, e) => sum + e.amount, 0)
    const prevTotalSpent = previousExpenses.reduce((sum, e) => sum + e.amount, 0)

    const totalBudget = currentPlan?.total || 0

    const transactionCount = currentExpenses.length
    const prevTransactionCount = previousExpenses.length


    // FINANCIAL FEATURES

    /**
     * budgetUtilization
     * Ratio of spending to allocated budget.
     * > 1  → overspending
     * ~ 1 → near limit
     * < 1 → within budget
     */
    const budgetUtilization = safeDivide(totalSpent, totalBudget)

    /**
     * planDeviationRatio
     * Measures proportional deviation from plan.
     * Positive → exceeded plan
     * Negative → under plan
     */
    const planDeviationRatio = totalBudget
        ? (totalSpent - totalBudget) / totalBudget
        : 0

    /**
     * spendingDelta
     * Month-over-month proportional change in total spending.
     * Positive → spending increased
     * Negative → spending decreased
     */
    const spendingDelta = prevTotalSpent
        ? (totalSpent - prevTotalSpent) / prevTotalSpent
        : 0

    /**
     * transactionDelta
     * Month-over-month change in transaction count.
     * Indicates behavioral frequency shift.
     */
    const transactionDelta = prevTransactionCount
        ? (transactionCount - prevTransactionCount) / prevTransactionCount
        : 0


    // EMOTIONAL FEATURES


    /**
     * emotionTotals:
     * Aggregates total spend per emotion for current month.
     * Uses primary emotion tag per transaction.
     */
    const emotionTotals = {}
    const prevEmotionTotals = {}

    currentExpenses.forEach(e => {
        if (e.emotion?.primary) {
            emotionTotals[e.emotion.primary] =
                (emotionTotals[e.emotion.primary] || 0) + e.amount
        }
    })

    previousExpenses.forEach(e => {
        if (e.emotion?.primary) {
            prevEmotionTotals[e.emotion.primary] =
                (prevEmotionTotals[e.emotion.primary] || 0) + e.amount
        }
    })

    /**
     * Combine all emotion keys from both months.
     * Ensures volatility captures new/disappeared emotions.
     */
    const allEmotions = new Set([
        ...Object.keys(emotionTotals),
        ...Object.keys(prevEmotionTotals)
    ])

    const categoryTotals = {}

    currentExpenses.forEach(e => {
        categoryTotals[e.category] =
            (categoryTotals[e.category] || 0) + e.amount
    })

    const categoryDistribution = {}

    Object.keys(categoryTotals).forEach(cat => {
        categoryDistribution[cat] = safeDivide(categoryTotals[cat], totalSpent)
    })

    /**
     * distribution:
     * Proportion of total spending under each emotion.
     * Values sum approximately to 1.
     */
    const distribution = {}

    allEmotions.forEach(emo => {
        distribution[emo] = safeDivide(emotionTotals[emo] || 0, totalSpent)
    })

    /**
     * stressSpendRatio:
     * Special feature capturing proportion of spending under "stressed".
     * Direct proxy for emotional financial pressure.
     */
    const stressSpendRatio = safeDivide(emotionTotals["stressed"] || 0, totalSpent)

    /**
     * emotionalVolatilityIndex:
     * Sum of absolute differences in emotion distributions
     * between current and previous month.
     * 
     * Higher value → greater emotional shift in spending behavior.
     */
    const emotionalVolatilityIndex = Math.min(1, [...allEmotions].reduce((sum, emo) => {
        const currRatio = safeDivide(emotionTotals[emo] || 0, totalSpent)
        const prevRatio = safeDivide(prevEmotionTotals[emo] || 0, prevTotalSpent)
        return sum + Math.abs(currRatio - prevRatio)
    }, 0))

    console.log("emotionalVolatilityIndex:", emotionalVolatilityIndex)


    // TEMPORAL FEATURES

    /**
     * dailyMap:
     * Aggregates spending per calendar day.
     */
    const dailyMap = {}

    currentExpenses.forEach(e => {
        const day = new Date(e.date).getDate()
        dailyMap[day] = (dailyMap[day] || 0) + e.amount
    })

    const dailyValues = Object.values(dailyMap)

    /**
     * daysInMonth:
     * Used for normalization and volatility scaling.
     */
    const daysInMonth = new Date(year, monthIndex + 1, 0).getDate()

    const dailyStd = calculateStdDev(dailyValues)
    const dailyMean = safeDivide(totalSpent, daysInMonth)

    /**
     * dailyVolatilityScore:
     * Coefficient of variation (std / mean).
     * Measures irregularity in spending distribution.
     */
    const dailyVolatilityScore = dailyMean
        ? Math.min(1, dailyStd / dailyMean)
        : 0

    /**
     * spikeFrequency:
     * Fraction of days where spending exceeded (mean + std).
     * Captures frequency of abnormal high-spend days.
     */
    const spikeThreshold = dailyMean + dailyStd
    const spikeDays = dailyValues.filter(v => v > spikeThreshold).length
    const spikeFrequency = safeDivide(spikeDays, daysInMonth)


    // EVENT FEATURE

    /**
     * highestExpenditureEventScore:
     * Ratio of maximum daily spend to average daily spend.
     * 
     * > 1  → peak day above average
     * >> 1 → extreme spending event
     */
    const highestDaySpend = dailyValues.length
        ? Math.max(...dailyValues)
        : 0

    const highestExpenditureEventScore = dailyMean
        ? Math.min(1, highestDaySpend / dailyMean)
        : 0

    // FINAL STRUCTURED STATE VECTOR

    return {
        version: 1, // Feature schema version

        financial: {
            budgetUtilization,
            planDeviationRatio,
            spendingDelta,
            transactionDelta
        },

        emotion: {
            distribution,
            stressSpendRatio,
            emotionalVolatilityIndex
        },

        category: {
            distribution: categoryDistribution
        },

        temporal: {
            dailyVolatilityScore,
            spikeFrequency
        },

        event: {
            highestExpenditureEventScore
        }
    }
}
// this goes to ml nd ml returns:
// risk scores
// anomaly detection
// patterns: impulseTrait, stressTrait/emotionTrait, eventScore
// predictions