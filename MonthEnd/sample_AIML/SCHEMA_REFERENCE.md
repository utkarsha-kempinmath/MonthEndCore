# sentToML vs fromML Schema Reference

## sentToML Input Format (from Frontend)

```json
{
  "meta": {
    "userId": "student_123",
    "month": "2026-04",
    "schemaVersion": 1
  },
  "state": {
    "financial": {
      "budgetUtilization": 0.45,
      "planDeviationRatio": 0.1,
      "spendingDelta": 0.05,
      "transactionDelta": 0.03,
      "transactions": [
        { "date": "2026-04-01", "category": "Food", "amount": 180 },
        { "date": "2026-04-02", "category": "Food", "amount": 220 }
      ]
    },
    "emotion": {
      "distribution": { "happy": 0.3, "stressed": 0.5 },
      "stressSpendRatio": 0.45,
      "emotionalVolatilityIndex": 0.2
    },
    "category": {
      "distribution": { "Food": 0.1, "Transport": 0.1, "Shopping": 0.4 }
    },
    "temporal": {
      "dailyVolatilityScore": 0.2,
      "spikeFrequency": 0.1
    },
    "event": {
      "trigger": "exam_period",
      "highestExpenditureEventScore": 0.95
    }
  },
  "profile": {
    "impulsivity": 0.75,
    "planning": 0.55,
    "emotionalSpending": true,
    "socialInfluence": 0.6
  },
  "goals": {
    "targetAmount": 15000,
    "savedAmount": 4500,
    "timelineMonths": 12
  },
  "allowance": {
    "amount": 10000,
    "period": "monthly"
  }
}
```

## fromML Output Format (to Frontend)

```json
{
  "risk": {
    "level": "low|moderate|high",
    "overspendingProbability": 0.64,
    "financialInstabilityScore": 0.77
  },
  "financialPosition": {
    "spent": 6400.0,
    "budget": 10000.0,
    "remaining": 3600.0,
    "daysLeft": 27,
    "avgDailySpend": 213.33
  },
  "affordability": {
    "canAfford": true,
    "safeLimit": 2520.0,
    "dangerLimit": 3240.0
  },
  "forecast": {
    "projectedSpend": 5760.0,
    "remainingBuffer": -2160.0,
    "confidence": 0.60
  },
  "goalStatus": {
    "progress": 0.30,
    "onTrack": false
  },
  "impact": {
    "delayAmount": 0.0,
    "delayRisk": "low|medium|high",
    "budgetImpact": "safe|stretch|risky",
    "goalImpact": "none|slight_delay|major_delay",
    "behaviorRisk": "low|medium|high"
  },
  "behavioral": {
    "dominantPattern": "impulse_spending|stress_spending|balanced",
    "trigger": "shopping_spree|exam_period|unknown",
    "consistencyScore": 0.55
  },
  "predictions": {
    "endOfMonthBalance": 3600.0,
    "goalAchievementProbability": 0.31
  },
  "anomalies": [
    {
      "type": "spike",
      "category": "Shopping",
      "severity": 0.85
    }
  ],
  "insights": {
    "summary": "Based on your spending patterns...",
    "tags": ["caution", "spikes_detected", "impulse_prone", "goal_at_risk"]
  },
  "chatbot": {
    "message": "You've spent ₹6400 out of ₹10000. You have ₹3600 remaining. 💡 Tips...",
    "followUp": {
      "required": false,
      "field": null,
      "question": null
    }
  }
}
```

## Chatbot Query Formats

### Affordability Query
```json
{
  "meta": { "queryType": "affordability" },
  "query": {
    "rawText": "Can I afford this?",
    "amount": 1200
  },
  "conversationContext": {
    "lastIntent": "affordability",
    "awaitingField": null
  }
}
```

### Projection Query
```json
{
  "meta": { "queryType": "projection" },
  "query": {
    "rawText": "What will my balance be at end of month?"
  },
  "conversationContext": {
    "lastIntent": "projection",
    "awaitingField": null
  }
}
```

### Behavior Analysis Query
```json
{
  "meta": { "queryType": "behavior_analysis" },
  "query": {
    "rawText": "Why do I spend so much during stressful times?"
  }
}
```

### Goal Analysis Query
```json
{
  "meta": { "queryType": "goal_analysis" },
  "query": {
    "rawText": "Will I achieve my savings goal?"
  }
}
```

## Field Descriptions

### risk.level
Categorizes overall financial risk:
- **low**: < 60% overspending
- **moderate**: 60-80% overspending
- **high**: > 80% overspending

### affordability
Provides safe spending guidelines:
- **safeLimit**: 70% of remaining budget (recommended max spend)
- **dangerLimit**: 90% of remaining budget (caution zone)

### impact
Shows consequences of current spending patterns:
- **budgetImpact**: Whether current trajectory is sustainable
- **goalImpact**: How spending affects savings goals
- **behaviorRisk**: Likelihood of continued risky spending

### insights.tags
Categorizes spending behaviors:
- `high_risk`: High overspending probability
- `caution`: Moderate overspending risk
- `spikes_detected`: Unusual spending patterns found
- `emotional_spending`: Spending correlated with emotions
- `impulse_prone`: High impulsivity scores
- `goal_at_risk`: Savings goals may be unreachable
- `insufficient_records`: Not enough data for analysis

### chatbot.followUp
For multi-turn conversations:
- If `required: true`, the chatbot needs additional info
- `field` indicates what data is needed
- `question` is the prompt to ask the user
