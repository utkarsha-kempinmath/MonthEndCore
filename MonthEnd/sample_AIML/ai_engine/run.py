"""
run.py

Thin orchestration layer for the AI engine.

Backend is expected to call the exposed functions directly.
"""

import datetime

from ai_engine.schemas import validate_payload, validate_sent_to_ml_v2
from ai_engine.core import run_core_analysis
from ai_engine.hf_advisor import (
    generate_advice,
    chat_respond,
)


def _build_internal_payload(sent_payload: dict) -> dict:
    """
    Builds internal payload from sentToML v2 schema.
    
    sentToML v2 provides:
    - Aggregated financial metrics (budgetUtilization, planDeviationRatio, etc.)
    - Emotion and temporal indicators
    - Event context with timing
    - Multi-goal tracking
    
    We reconstruct expenses for core analytics, while preserving enriched metadata.
    """
    validate_sent_to_ml_v2(sent_payload)
    
    meta = sent_payload.get("meta", {})
    state = sent_payload.get("state", {})
    allowance = sent_payload.get("allowance", {})
    profile = sent_payload.get("profile", {})
    goals = sent_payload.get("goals", {})

    user_id = meta.get("userId")
    monthly_allowance = float(allowance.get("monthlyAllowance", 0))
    total_spent = float(allowance.get("totalSpent", 0))

    expenses = []

    # Try to use explicit transactions if provided
    financial = state.get("financial", {})
    transactions = financial.get("transactions")

    if transactions:
        for idx, t in enumerate(transactions):
            if not isinstance(t, dict):
                raise ValueError(f"transaction at index {idx} is not an object")
            if not all(k in t for k in ("date", "category", "amount")):
                raise ValueError(
                    "transaction must include date, category, amount"
                )
            expenses.append({
                "date": t["date"],
                "category": t["category"],
                "amount": float(t["amount"])
            })
    else:
        # Reconstruct from category distribution
        category = state.get("category", {})
        category_distribution = category.get("distribution", {})
        
        if not isinstance(category_distribution, dict) or not category_distribution:
            raise ValueError(
                "No transaction data found; expected state.financial.transactions or state.category.distribution"
            )

        today = datetime.date.today().isoformat()
        for cat, val in category_distribution.items():
            if not isinstance(val, (int, float)):
                continue

            amount = float(val)
            if 0 < amount <= 1:
                amount = amount * monthly_allowance

            expenses.append({
                "date": today,
                "category": cat,
                "amount": amount,
            })

        if not expenses:
            raise ValueError("Could not build expenses from category distribution")

    return {
        "user": {
            "userId": user_id,
            "monthlyAllowance": monthly_allowance,
        },
        "expenses": expenses,
        # Enriched metadata (preserved from sentToML v2)
        "_enriched": {
            "meta": meta,
            "state": state,
            "profile": profile,
            "goals": goals,
            "total_spent": total_spent,
        }
    }


def _build_from_ml_output(sent_payload: dict, analytics_output: dict) -> dict:
    """
    Builds comprehensive fromML output from sentToML v2 payload and analytics results.
    
    Incorporates:
    - Financial metrics (budgetUtilization, planDeviationRatio, deltas)
    - Emotional metrics (stressSpendRatio, emotionalVolatilityIndex)
    - Temporal metrics (dailyVolatilityScore, spikeFrequency)
    - Event context (intensity, timing, event counts)
    - Multi-goal tracking (totalTarget, totalSaved, goalCount, pressureScore)
    """
    enriched = analytics_output.get("_enriched", {})
    state = enriched.get("state", sent_payload.get("state", {}))
    profile = enriched.get("profile", sent_payload.get("profile", {})) or {}
    goals = enriched.get("goals", sent_payload.get("goals", {}))
    
    allowance = analytics_output.get("allowance", {})
    anomaly_list = analytics_output.get("anomalies", [])
    summary = analytics_output.get("summary", {})

    # ========== EXTRACT CORE VALUES ==========
    total_spent = float(allowance.get("totalSpent", 0))
    monthly_allowance = float(allowance.get("monthlyAllowance", 0) or 1)
    remaining = float(allowance.get("remaining", 0))

    # ========== EXTRACT v2 METRICS ==========
    financial = state.get("financial", {})
    budget_utilization = float(financial.get("budgetUtilization", total_spent / monthly_allowance))
    plan_deviation_ratio = float(financial.get("planDeviationRatio", 0))
    spending_delta = float(financial.get("spendingDelta", 0))
    transaction_delta = float(financial.get("transactionDelta", 0))

    emotion = state.get("emotion", {})
    emotion_distribution = emotion.get("distribution", {})
    stress_spend_ratio = float(emotion.get("stressSpendRatio", 0))
    emotional_volatility = float(emotion.get("emotionalVolatilityIndex", 0))
    dominant_emotion = max(emotion_distribution.items(), key=lambda x: x[1])[0] if emotion_distribution else "neutral"

    temporal = state.get("temporal", {})
    daily_volatility = float(temporal.get("dailyVolatilityScore", 0))
    spike_frequency = int(temporal.get("spikeFrequency", 0))

    event = state.get("event", {})
    highest_exp_event_score = float(event.get("highestExpenditureEventScore", 0))
    event_context = event.get("eventContext", {})
    exam_count = int(event_context.get("examCount", 0))
    fest_count = int(event_context.get("festCount", 0))
    other_event_count = int(event_context.get("otherEventCount", 0))
    is_event_active = bool(event_context.get("isEventActive", False))
    days_to_next_event = int(event_context.get("daysToNextEvent", 30))
    days_since_last_event = int(event_context.get("daysSinceLastEvent", 0))
    total_event_days = int(event_context.get("totalEventDays", 0))
    event_intensity_score = float(event_context.get("eventIntensityScore", 0))

    total_target = float(goals.get("totalTarget", 0) or 0)
    total_saved = float(goals.get("totalSaved", 0) or 0)
    avg_timeline = float(goals.get("avgTimeline", 1) or 1)
    goal_count = int(goals.get("goalCount", 0))
    pressure_score = float(goals.get("pressureScore", 0) or 0)

    impulsivity = float(profile.get("impulsivity", 0) or 0)
    planning = float(profile.get("planning", 0) or 0)
    emotional_spending = float(profile.get("emotionalSpending", 0) or 0)
    social_influence = float(profile.get("socialInfluence", 0) or 0)

    # ========== RISK ASSESSMENT (WITH v2 FACTORS) ==========
    base_overspending = min(1.0, max(0.0, total_spent / monthly_allowance))
    
    # Plan deviation amplification
    plan_dev_factor = (1 + plan_deviation_ratio * 1.5) if plan_deviation_ratio > 0 else 1.0
    
    # Delta contribution (acceleration indicator)
    delta_score = (abs(spending_delta) + abs(transaction_delta)) / monthly_allowance if monthly_allowance > 0 else 0
    volatility_influence = min(0.3, delta_score * 0.5)
    
    # Stress amplification
    stress_factor = (1 + stress_spend_ratio * 0.5) if stress_spend_ratio > 0.5 else 1.0
    
    # Event stress multiplier
    total_events = exam_count + fest_count + other_event_count
    event_stress_mult = 1.0
    if total_events > 2 and is_event_active:
        event_stress_mult = 1.0 + min(0.4, total_events * 0.1)
    
    # Composite risk
    base_risk = base_overspending * plan_dev_factor * stress_factor * event_stress_mult
    base_risk = min(1.0, base_risk + volatility_influence)

    # If low data, boost base risk using quiz-derived hint
    profile_hint = analytics_output.get("_profile_risk_hint", 0)
    if profile_hint and base_risk == 0:
        base_risk = profile_hint
    
    # Determine risk level with new thresholds
    if base_risk > 0.85:
        risk_level = "critical"
    elif base_risk > 0.8:
        risk_level = "high"
    elif base_risk > 0.6:
        risk_level = "moderate"
    else:
        risk_level = "low"

    # ========== FINANCIAL INSTABILITY (MULTI-FACTOR) ==========
    instability = min(1.0, 
        daily_volatility * 0.3 +
        min(spike_frequency / 10.0, 1.0) * 0.2 +
        plan_deviation_ratio * 0.3 +
        emotional_volatility * 0.2
    )

    # ========== FINANCIAL POSITION ==========
    days_in_month = 30
    effective_days_left = max(1, days_to_next_event) if is_event_active else max(0, days_in_month - 3)
    days_spent = max(1, days_in_month - effective_days_left)
    avg_daily_spend = total_spent / days_spent if days_spent > 0 else 0

    # ========== AFFORDABILITY WITH EVENT ADJUSTMENT ==========
    safe_limit = remaining * 0.7
    danger_limit = remaining * 0.9
    can_afford = remaining > 0

    # ========== FORECAST WITH TEMPORAL & EVENT FACTORS ==========
    volatility_factor = 1 + (daily_volatility * 0.4)
    monthly_avg = total_spent / days_spent if days_spent > 0 else 0
    projected_spending = monthly_avg * effective_days_left * volatility_factor
    remaining_buffer = remaining - projected_spending

    # Adjust for event intensity
    if event_intensity_score > 0.7:
        remaining_adjusted = remaining * (1 - event_intensity_score * 0.3)
    else:
        remaining_adjusted = remaining

    # Forecast confidence with multiple factors
    base_confidence = 0.6 if effective_days_left > 10 else 0.4
    confidence = base_confidence
    confidence *= (1 - emotional_volatility * 0.2)
    confidence *= (1 - daily_volatility * 0.15)
    
    if days_to_next_event < 14:
        confidence *= (1 - (14 - days_to_next_event) / 14 * 0.25)
    
    if planning > 0.7:
        confidence += 0.15
    
    forecast_confidence = round(min(1.0, max(0.2, confidence)), 2)

    # ========== MULTI-GOAL TRACKING ==========
    goal_progress = 0.0
    goal_on_track = True
    goal_achievement_probability = 0.0

    if total_target > 0:
        goal_progress = min(1.0, total_saved / total_target)
        
        # Pressure dampening: multiple goals reduce individual probability
        pressure_factor = min(1.0, goal_count * 0.15)
        adjusted_probability = goal_progress * (1 - pressure_factor)
        
        # Timeline efficiency
        timeline_efficiency = max(0.1, 1.0)  # Would need actual start date for real calc
        
        # Multi-factor goal achievement
        base_goal_prob = adjusted_probability * (1 - base_overspending * 0.4) * timeline_efficiency
        
        # Pressure score reduction
        pressure_influence = pressure_score * 0.3
        goal_achievement_probability = min(1.0, base_goal_prob * (1 - pressure_influence))
        
        # On track determination
        monthly_target_savings = total_target / avg_timeline
        goal_on_track = (total_saved / max(1, avg_timeline)) >= (monthly_target_savings * 0.8)
    else:
        goal_achievement_probability = 0.0

    # ========== IMPACT ANALYSIS ==========
    # Delay impact
    if remaining < 0:
        delay_amount = abs(remaining)
        delay_risk = "high"
    elif remaining < monthly_allowance * 0.1:
        delay_amount = 0
        delay_risk = "high"
    elif remaining < monthly_allowance * 0.3:
        delay_amount = 0
        delay_risk = "medium"
    else:
        delay_amount = 0
        delay_risk = "low"

    # Budget impact
    if base_risk > 0.8:
        budget_impact = "risky"
    elif base_risk > 0.6:
        budget_impact = "stretch"
    else:
        budget_impact = "safe"

    # Goal impact
    if goal_achievement_probability < 0.3:
        goal_impact = "major_delay"
    elif goal_achievement_probability < 0.6:
        goal_impact = "slight_delay"
    else:
        goal_impact = "none"

    # ========== BEHAVIOR RISK (COMPREHENSIVE) ==========
    behavior_risk_score = impulsivity
    
    if stress_spend_ratio > 0.6:
        behavior_risk_score = min(1.0, behavior_risk_score + stress_spend_ratio * 0.4)
    
    if event_intensity_score > 0.7 and daily_volatility > 0.6:
        behavior_risk_score = min(1.0, behavior_risk_score * 1.2)
    
    if emotional_volatility > 0.7:
        behavior_risk_score = min(1.0, behavior_risk_score + emotional_volatility * 0.2)
    
    if social_influence > 0.7:
        behavior_risk_score = min(1.0, behavior_risk_score + social_influence * 0.15)

    if behavior_risk_score > 0.7:
        behavior_risk = "high"
    elif behavior_risk_score > 0.4:
        behavior_risk = "medium"
    else:
        behavior_risk = "low"

    # ========== DOMINANT BEHAVIORAL PATTERN ==========
    dominant_pattern = "balanced"
    
    if stress_spend_ratio > 0.6:
        dominant_pattern = "stress_spending"
    elif impulsivity > 0.7:
        dominant_pattern = "impulse_spending"
    elif emotional_spending > 0.7:
        dominant_pattern = f"{dominant_emotion}_triggered_spending"
    elif social_influence > 0.7:
        dominant_pattern = "social_influenced_spending"
    
    # Event amplification
    if total_events > 2 and is_event_active:
        dominant_pattern += f"_({total_events}_events_active)"

    # ========== TRIGGER DETERMINATION ==========
    trigger = "unknown"
    if is_event_active:
        if exam_count > 0:
            trigger = f"exam_stress ({exam_count} exams)"
        elif fest_count > 0:
            trigger = f"festival/event ({fest_count} events)"
        else:
            trigger = "event_active"
    elif stress_spend_ratio > 0.6:
        trigger = "stress"
    elif dominant_emotion in ["anxiety", "sadness"]:
        trigger = f"{dominant_emotion}_driven"

    # ========== ANOMALIES WITH SEVERITY ==========
    anomalies_out = []
    for a in anomaly_list:
        cat = a.get("category", "unknown")
        amount = float(a.get("amount", 0))
        normal_range = a.get("normalRange", "0–0")
        
        severity = 0.0
        try:
            if "–" in normal_range:
                split = normal_range.split("–")
                low = float(split[0])
                high = float(split[1])
                norm_center = (low + high) / 2
                if norm_center > 0:
                    severity = min(1.0, abs(amount - norm_center) / norm_center)
        except Exception:
            severity = 0.0

        anomalies_out.append({
            "type": "spike",
            "category": cat,
            "severity": round(severity, 2)
        })

    # ========== INSIGHTS & TAGS ==========
    # 1. Clean Summary without the boilerplate text
    if base_risk > 0.8:
        insights_summary = "You are at high risk of budget overrun"
    elif base_risk > 0.6:
        insights_summary = "You are approaching budget limits"
    else:
        insights_summary = "You are managing your budget well"

    if stress_spend_ratio > 0.6:
        insights_summary += " with stress-driven spending detected."
    elif anomaly_list:
        insights_summary += " with some spending spikes detected."
    elif goal_count > 1 and pressure_score > 0.7:
        insights_summary += " while balancing multiple goals under pressure."
    else:
        insights_summary += "."

    insights_tags = []
    
    # 2. Human-readable tags (Max 6 words, no underscores)
    
    # Financial tags
    if base_risk > 0.85:
        insights_tags.append("Critical risk of budget overrun")
    elif base_risk > 0.8:
        insights_tags.append("High risk of overspending")
    if base_risk > 0.6:
        insights_tags.append("Approaching safe budget limits")
    if plan_deviation_ratio > 0.25:
        insights_tags.append("High deviation from planned budget")
    
    # Emotional tags
    if stress_spend_ratio > 0.6:
        insights_tags.append("Stress-driven spending detected")
    if emotional_volatility > 0.7:
        insights_tags.append("Emotionally volatile spending patterns")
    
    # Temporal tags
    if daily_volatility > 0.7:
        insights_tags.append("Highly erratic daily spending")
    if spike_frequency > len(anomalies_out) * 1.5:
        insights_tags.append("Frequent abnormal spending spikes")
    
    # Event tags
    if event_intensity_score > 0.7 and is_event_active:
        insights_tags.append("Events are amplifying spending risk")
    if days_to_next_event < 7:
        insights_tags.append("Upcoming events may trigger spending")
    
    # Goal tags
    if not goal_on_track:
        insights_tags.append("Current goals are at risk")
    if goal_count > 2 and pressure_score > 0.7:
        insights_tags.append("High pressure balancing multiple goals")
        
    # ========== DETAILED FINDINGS ==========
    detailed_findings = []
    
    if plan_deviation_ratio > 0.2:
        detailed_findings.append({
            "area": "financial",
            "insight": f"Your spending deviates {plan_deviation_ratio*100:.0f}% from planned budget, indicating planning challenges",
            "confidence": 0.95
        })
    
    if stress_spend_ratio > 0.5:
        detailed_findings.append({
            "area": "emotional",
            "insight": f"{stress_spend_ratio*100:.0f}% of spending is stress-triggered; consider stress management strategies",
            "confidence": 0.9
        })
    
    if daily_volatility > 0.7:
        detailed_findings.append({
            "area": "temporal",
            "insight": "Your spending is highly volatile day-to-day; this creates forecasting uncertainty",
            "confidence": 0.88
        })
    
    if event_intensity_score > 0.7 and is_event_active:
        detailed_findings.append({
            "area": "behavioral",
            "insight": f"Active events (exams: {exam_count}, festivals: {fest_count}) are amplifying spending by ~{event_intensity_score*100:.0f}%",
            "confidence": 0.92
        })
    
    if goal_count > 2 and pressure_score > 0.7:
        detailed_findings.append({
            "area": "goal",
            "insight": f"Juggling {goal_count} goals under high pressure; prioritize or adjust timelines",
            "confidence": 0.85
        })

    # ========== CHATBOT MESSAGE ==========
    chatbot_message = f"You've spent Rs{total_spent:.0f} out of Rs{monthly_allowance:.0f}. You have Rs{remaining:.0f} remaining. "
    
    if base_risk > 0.85:
        chatbot_message += "🚨 CRITICAL: You're at severe budget risk. Reduce spending immediately."
    elif base_risk > 0.8:
        chatbot_message += "⚠️ You're approaching or exceeding your budget. Be mindful of your spending."
    elif remaining < monthly_allowance * 0.2:
        chatbot_message += "💡 Your budget is getting low. Consider reducing non-essential expenses."
    else:
        chatbot_message += "✓ You're on track. Keep monitoring your spending."

    if stress_spend_ratio > 0.6:
        chatbot_message += " [Stress-driven spending detected—practice mindfulness before purchases]"

    # ========== RETURN COMPREHENSIVE OUTPUT ==========
    return {
        "risk": {
            "level": risk_level,
            "overspendingProbability": round(base_overspending, 2),
            "financialInstabilityScore": round(instability, 2),
            "compositeRiskFactors": {
                "budgetDeviation": round(plan_dev_factor - 1, 2),
                "stressInfluence": round(stress_factor - 1, 2),
                "volatilityInfluence": round(volatility_influence, 2),
                "eventInfluence": round(event_stress_mult - 1, 2),
                "goalPressure": round(pressure_score, 2)
            }
        },
        "financialPosition": {
            "spent": round(total_spent, 2),
            "budget": round(monthly_allowance, 2),
            "remaining": round(remaining, 2),
            "utilization": round(budget_utilization, 2),
            "daysLeft": effective_days_left,
            "avgDailySpend": round(avg_daily_spend, 2),
            "budgetDeviation": round(plan_deviation_ratio, 2)
        },
        "affordability": {
            "canAfford": can_afford,
            "safeLimit": round(safe_limit, 2),
            "dangerLimit": round(danger_limit, 2),
        },
        "forecast": {
            "projectedSpend": round(projected_spending, 2),
            "remainingBuffer": round(remaining_buffer, 2),
            "confidence": forecast_confidence,
            "confidenceFactors": {
                "emotionalVolatility": round(emotional_volatility, 2),
                "dailyVolatility": round(daily_volatility, 2),
                "eventProximity": round(max(0, (14 - days_to_next_event) / 14), 2) if days_to_next_event < 14 else 0.0
            }
        },
        "goalStatus": {
            "progress": round(goal_progress, 2),
            "onTrack": goal_on_track,
            "totalTarget": round(total_target, 2),
            "totalSaved": round(total_saved, 2),
            "goalCount": goal_count,
            "pressureScore": round(pressure_score, 2)
        },
        "impact": {
            "delayAmount": round(delay_amount, 2),
            "delayRisk": delay_risk,
            "budgetImpact": budget_impact,
            "goalImpact": goal_impact,
            "behaviorRisk": behavior_risk,
        },
        "behavioral": {
            "dominantPattern": dominant_pattern,
            "trigger": trigger,
            "consistencyScore": round(planning, 2),
            "emotionalMetrics": {
                "stressSpendRatio": round(stress_spend_ratio, 2),
                "emotionalVolatility": round(emotional_volatility, 2),
                "dominantEmotion": dominant_emotion
            },
            "temporalMetrics": {
                "dailyVolatility": round(daily_volatility, 2),
                "spikeFrequency": spike_frequency
            }
        },
        "predictions": {
            "endOfMonthBalance": round(remaining_adjusted, 2),
            "goalAchievementProbability": round(goal_achievement_probability, 2),
            "riskTrajectory": "deteriorating" if spending_delta > avg_daily_spend * 2 else "stable" if abs(spending_delta) < avg_daily_spend * 0.5 else "improving"
        },
        "anomalies": anomalies_out,
        "insights": {
            "summary": insights_summary,
            "tags": insights_tags,
            "detailedFindings": detailed_findings
        },
        "chatbot": {
            "message": chatbot_message,
            "followUp": {
                "required": False,
                "field": None,
                "question": None,
            }
        }
    }


# --------------------------------
# ANALYTICS ENTRY POINT
# --------------------------------
def run_analytics(payload: dict) -> dict:
    """
    Runs core analytics only (no Hugging Face).

    Intended usage:
    - once per session
    - cached by backend
    """
    validate_payload(payload)
    return run_core_analysis(payload)


# --------------------------------
# SENT-TO-ML / FROM-ML ENTRY POINT
# --------------------------------
def run_from_ml(sent_payload: dict) -> dict:
    """
    Accepts sentToML v2 schema and returns fromML schema.
    
    Validates the v2 payload, reconstructs expenses for core analytics,
    and applies comprehensive enriched calculations.
    """
    try:
        validate_sent_to_ml_v2(sent_payload)
    except ValueError as e:
        # Return error response for invalid schema
        return {
            "risk": {
                "level": "low",
                "overspendingProbability": 0.0,
                "financialInstabilityScore": 0.0,
                "compositeRiskFactors": {}
            },
            "financialPosition": {
                "spent": 0.0,
                "budget": 0.0,
                "remaining": 0.0,
                "utilization": 0.0,
                "daysLeft": 0,
                "avgDailySpend": 0.0,
                "budgetDeviation": 0.0
            },
            "affordability": {
                "canAfford": False,
                "safeLimit": 0.0,
                "dangerLimit": 0.0,
            },
            "forecast": {
                "projectedSpend": 0.0,
                "remainingBuffer": 0.0,
                "confidence": 0.0,
                "confidenceFactors": {}
            },
            "goalStatus": {
                "progress": 0.0,
                "onTrack": False,
                "totalTarget": 0.0,
                "totalSaved": 0.0,
                "goalCount": 0,
                "pressureScore": 0.0
            },
            "impact": {
                "delayAmount": 0.0,
                "delayRisk": "low",
                "budgetImpact": "safe",
                "goalImpact": "none",
                "behaviorRisk": "low",
            },
            "behavioral": {
                "dominantPattern": "not_enough_data",
                "trigger": "unknown",
                "consistencyScore": 0.0,
                "emotionalMetrics": {},
                "temporalMetrics": {}
            },
            "predictions": {
                "endOfMonthBalance": 0.0,
                "goalAchievementProbability": 0.0,
                "riskTrajectory": "stable"
            },
            "anomalies": [],
            "insights": {
                "summary": f"Schema validation failed: {str(e)}",
                "tags": ["schema_error"],
                "detailedFindings": []
            },
            "chatbot": {
                "message": f"Error processing request: {str(e)}",
                "followUp": {
                    "required": True,
                    "field": None,
                    "question": "Please check your data format and try again"
                }
            }
        }
    
    internal_payload = _build_internal_payload(sent_payload)
    validate_payload(internal_payload)

    analytics = run_core_analysis(internal_payload)
    
    # Attach enriched metadata to analytics for downstream use
    if "_enriched" in internal_payload:
        analytics["_enriched"] = internal_payload["_enriched"]
    
    #solved the edge case, initially when there is not enough datam the ml will now analyse on basis of the quiz nd qu asked
    if analytics.get("status") != "ok":
        profile = internal_payload.get("_enriched", {}).get("profile", {}) or {}
        goals = internal_payload.get("_enriched", {}).get("goals", {}) or {}
    
        # Derive synthetic summary from quiz traits + goals
        monthly = float(sent_payload.get("allowance", {}).get("monthlyAllowance", 0))
        total_spent = float(sent_payload.get("allowance", {}).get("totalSpent", 0))
    
        # Use impulsivity to estimate risk even without transactions
        impulsivity = float(profile.get("impulsivity", 0) or 0)
        emotional = float(profile.get("emotionalSpending", 0) or 0)
    
        analytics = {
            "status": "ok",
            "anomalies": [],
            "summary": {},
            "allowance": {
                "monthlyAllowance": monthly,
                "totalSpent": total_spent,
                "remaining": float(sent_payload.get("allowance", {}).get("remaining", 0))
            },
            # Inject profile-derived signals so _build_from_ml_output has context
            "_profile_risk_hint": min(1.0, (impulsivity * 0.6) + (emotional * 0.4)),
            "_enriched": internal_payload.get("_enriched", {})
        }

    return _build_from_ml_output(sent_payload, analytics)

# --------------------------------
# ADVISORY ENTRY POINT
# --------------------------------
def run_advisory(analytics_output: dict) -> dict:
    """
    Generates data-driven budget advice from analytics output.
    No LLM needed - uses rule-based logic.
    """
    advice = generate_advice(analytics_output)
    return {
        "advice": advice
    }


# --------------------------------
# CHATBOT ENTRY POINT
# --------------------------------
def run_chatbot(analytics_output: dict, user_question: str, plan_categories: list = []) -> dict:
    answer = chat_respond(analytics_output, user_question, plan_categories)
    return {"answer": answer}