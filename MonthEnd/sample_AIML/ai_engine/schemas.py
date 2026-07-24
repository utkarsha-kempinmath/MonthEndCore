"""
schemas.py

Defines input and output data contracts for the AI engine.

These schemas are:
- Backend-facing (what backend must send)
- HuggingFace-facing (what LLM can see)
- Lightweight (no external dependencies)

Schema versions:
- v1: Basic expenses + allowance
- v2: Enhanced with emotion, temporal, financial ratios, and multi-goal support
"""

# --------------------------------
# INTERNAL PAYLOAD SCHEMA (After parsing sentToML/v1)
# --------------------------------

REQUIRED_EXPENSE_FIELDS = {
    "date",
    "category",
    "amount",
}

REQUIRED_USER_FIELDS = {
    "userId",
    "monthlyAllowance",
}

# --------------------------------
# SENT-TO-ML SCHEMA (v2)
# --------------------------------

SENT_TO_ML_V2_SCHEMA = {
    "meta": {
        "userId": "str (required)",
        "month": "str (YYYY-MM)",
        "schemaVersion": "int (2)"
    },
    "state": {
        "financial": {
            "budgetUtilization": "float (0.0-1.0)",
            "planDeviationRatio": "float (0.0-1.0)",
            "spendingDelta": "float (change in amount)",
            "transactionDelta": "float (change in count)",
            "transactions": "list (optional, legacy)"
        },
        "emotion": {
            "distribution": "dict (emotion -> float)",
            "stressSpendRatio": "float (0.0-1.0)",
            "emotionalVolatilityIndex": "float (0.0-1.0)"
        },
        "category": {
            "distribution": "dict (category -> amount)"
        },
        "temporal": {
            "dailyVolatilityScore": "float (0.0-1.0)",
            "spikeFrequency": "int (spikes per month)"
        },
        "event": {
            "highestExpenditureEventScore": "float (0.0-1.0)",
            "eventContext": {
                "examCount": "int",
                "festCount": "int",
                "otherEventCount": "int",
                "isEventActive": "bool",
                "daysToNextEvent": "int",
                "daysSinceLastEvent": "int",
                "totalEventDays": "int",
                "eventIntensityScore": "float (0.0-1.0)"
            }
        }
    },
    "profile": {
        "impulsivity": "float (0.0-1.0)",
        "planning": "float (0.0-1.0)",
        "emotionalSpending": "float (0.0-1.0)",
        "socialInfluence": "float (0.0-1.0)"
    },
    "goals": {
        "totalTarget": "float (sum of all goal targets)",
        "totalSaved": "float (sum of all savings)",
        "avgTimeline": "float (average timeline in months)",
        "goalCount": "int (number of active goals)",
        "pressureScore": "float (0.0-1.0)"
    },
    "allowance": {
        "monthlyAllowance": "float (required)",
        "totalSpent": "float",
        "remaining": "float",
        "utilization": "float (0.0-1.0)"
    }
}


def validate_payload(payload):
    """
    Validates the payload sent by the backend.

    Expected format:
    {
        "user": {
            "userId": str,
            "monthlyAllowance": number
        },
        "expenses": [
            {
                "date": str,
                "category": str,
                "amount": number
            }
        ]
    }
    """
    if not isinstance(payload, dict):
        raise ValueError("Payload must be a dictionary")

    if "user" not in payload or "expenses" not in payload:
        raise ValueError("Payload must contain 'user' and 'expenses'")

    user = payload["user"]
    expenses = payload["expenses"]

    if not isinstance(user, dict):
        raise ValueError("'user' must be an object")

    if not REQUIRED_USER_FIELDS.issubset(user.keys()):
        raise ValueError(
            f"'user' must contain fields: {REQUIRED_USER_FIELDS}"
        )

    if not isinstance(expenses, list):
        raise ValueError("'expenses' must be a list")

    for i, expense in enumerate(expenses):
        if not isinstance(expense, dict):
            raise ValueError(f"Expense at index {i} is not an object")

        if not REQUIRED_EXPENSE_FIELDS.issubset(expense.keys()):
            raise ValueError(
                f"Expense at index {i} must contain fields: {REQUIRED_EXPENSE_FIELDS}"
            )


def validate_sent_to_ml_v2(sent_payload: dict) -> dict:
    """
    Validates sentToML v2 schema payload.
    
    Returns validated and normalized payload with default values filled in.
    """
    if not isinstance(sent_payload, dict):
        raise ValueError("sentToML payload must be a dictionary")

    # Required top-level keys
    required_keys = {"meta", "state", "profile", "allowance", "goals"}
    if not required_keys.issubset(sent_payload.keys()):
        raise ValueError(f"sentToML v2 must contain: {required_keys}")

    # Validate meta
    meta = sent_payload.get("meta", {})
    if not isinstance(meta, dict):
        raise ValueError("meta must be an object")
    if "userId" not in meta:
        raise ValueError("meta.userId is required")
    if meta.get("schemaVersion") != 2:
        raise ValueError("schemaVersion must be 2")

    # Validate allowance
    allowance = sent_payload.get("allowance", {})
    if not isinstance(allowance, dict):
        raise ValueError("allowance must be an object")
    if "monthlyAllowance" not in allowance:
        raise ValueError("allowance.monthlyAllowance is required")

    # Optional: state, profile, goals with defaults
    state = sent_payload.get("state", {})
    profile = sent_payload.get("profile", {})
    goals = sent_payload.get("goals", {})

    return sent_payload


# --------------------------------
# CORE ANALYTICS OUTPUT SCHEMA
# --------------------------------

CORE_OUTPUT_SCHEMA = {
    "status": "ok | not_enough_data",
    "anomalies": [
        {
            "date": "str",
            "category": "str",
            "amount": "number",
            "normalRange": "str"
        }
    ],
    "summary": {
        "category": "total_spent"
    },
    "allowance": {
        "monthlyAllowance": "number",
        "totalSpent": "number",
        "remaining": "number"
    }
}

# --------------------------------
# FROM-ML OUTPUT SCHEMA (FINAL)
# --------------------------------

FROM_ML_OUTPUT_SCHEMA = {
    "risk": {
        "level": "low | moderate | high | critical",
        "overspendingProbability": "0.0-1.0",
        "financialInstabilityScore": "0.0-1.0",
        "compositeRiskFactors": {
            "budgetDeviation": "0.0-1.0",
            "stressInfluence": "0.0-1.0",
            "volatilityInfluence": "0.0-1.0",
            "eventInfluence": "0.0-1.0",
            "goalPressure": "0.0-1.0"
        }
    },
    "financialPosition": {
        "spent": "number",
        "budget": "number",
        "remaining": "number",
        "utilization": "0.0-1.0",
        "daysLeft": "number (estimated)",
        "avgDailySpend": "number",
        "budgetDeviation": "float (planned vs actual)"
    },
    "affordability": {
        "canAfford": "boolean",
        "safeLimit": "number (70% of remaining)",
        "dangerLimit": "number (90% of remaining)"
    },
    "forecast": {
        "projectedSpend": "number",
        "remainingBuffer": "number",
        "confidence": "0.0-1.0",
        "confidenceFactors": {
            "emotionalVolatility": "0.0-1.0",
            "dailyVolatility": "0.0-1.0",
            "eventProximity": "0.0-1.0"
        }
    },
    "goalStatus": {
        "progress": "0.0-1.0",
        "onTrack": "boolean",
        "totalTarget": "number",
        "totalSaved": "number",
        "goalCount": "int",
        "pressureScore": "0.0-1.0"
    },
    "impact": {
        "delayAmount": "number",
        "delayRisk": "low | medium | high",
        "budgetImpact": "safe | stretch | risky",
        "goalImpact": "none | slight_delay | major_delay",
        "behaviorRisk": "low | medium | high"
    },
    "behavioral": {
        "dominantPattern": "string",
        "trigger": "string",
        "consistencyScore": "0.0-1.0",
        "emotionalMetrics": {
            "stressSpendRatio": "0.0-1.0",
            "emotionalVolatility": "0.0-1.0",
            "dominantEmotion": "string"
        },
        "temporalMetrics": {
            "dailyVolatility": "0.0-1.0",
            "spikeFrequency": "int"
        }
    },
    "predictions": {
        "endOfMonthBalance": "number",
        "goalAchievementProbability": "0.0-1.0",
        "riskTrajectory": "improving | stable | deteriorating"
    },
    "anomalies": [
        {
            "type": "spike",
            "category": "string",
            "severity": "0.0-1.0"
        }
    ],
    "insights": {
        "summary": "string",
        "tags": ["list of strings"],
        "detailedFindings": [
            {
                "area": "string (financial|emotional|temporal|behavioral|goal)",
                "insight": "string",
                "confidence": "0.0-1.0"
            }
        ]
    },
    "chatbot": {
        "message": "string",
        "followUp": {
            "required": "boolean",
            "field": "string or null",
            "question": "string or null"
        }
    }
}


# --------------------------------
# HF INPUT SCHEMA (LLM-SAFE VIEW)
# --------------------------------

HF_ANOMALY_VIEW = {
    "category": "str",
    "amount": "number",
    "normalRange": "str"
}

HF_CONTEXT_SCHEMA = {
    "userProfile": {
        "role": "student",
        "budgetCycle": "monthly"
    },
    "anomalies": [HF_ANOMALY_VIEW],
    "summary": {
        "category": "total_spent"
    },
    "allowance": {
        "remaining": "number"
    }
}
