"""
hf_advisor.py

Hugging Face advisory + chatbot layer
Using Hugging Face Inference API (NO local model download)

Model:
- google/flan-t5-small (free-tier accessible, instruction-tuned)

Requirements:
- huggingface_hub
- HF_API_TOKEN in .env
"""

import os
from pathlib import Path
from huggingface_hub import InferenceClient
from dotenv import load_dotenv
from typer import prompt

# Load environment variables from project root
env_path = Path(__file__).parent.parent / ".env"
load_dotenv(env_path)
#print(f"[DEBUG] Loading .env from: {env_path}")

def safe_generate(hf_client, prompt, **kwargs) -> str:
    """
    Safely consume HF text generation output, with detailed debug logging.
    Prevents StopIteration crashes.
    """
    #print("[DEBUG] HF prompt:\n", prompt[:100] + "...")
    #print("[DEBUG] HF kwargs:\n", kwargs)

    try:
        print("[DEBUG] Calling HF text_generation...")
        result = hf_client.text_generation(prompt, **kwargs)
        #print("[DEBUG] HF call returned, type:", type(result))
        #print("[DEBUG] HF raw result:", repr(result)[:200])

        # If streaming / generator
        if hasattr(result, "__iter__") and not isinstance(result, str):
            #print("[DEBUG] Result is iterable, attempting to consume...")
            chunks = list(result)
            #print("[DEBUG] HF chunked output count:", len(chunks))
            if not chunks:
                #print("[DEBUG] No chunks received")
                return "I'm unable to generate a response right now."
            out = "".join(chunks).strip()
            #print("[DEBUG] HF joined output:", repr(out)[:150])
            return out if out else "I'm unable to generate a response right now."

        # Normal string response
        out = (result or "").strip()
        #print("[DEBUG] HF string output:", repr(out)[:150])
        if not out:
            #print("[DEBUG] Empty string response from HF")
            return "I'm unable to generate a response right now."

        return out

    except StopIteration:
        #print("[DEBUG] StopIteration exception")
        return "I'm unable to generate a response right now."
    except Exception as e:
        #print("[DEBUG] HF exception caught:", type(e).__name__, "-", str(e)[:200])
        return f"Model error: {type(e).__name__}: {str(e)[:100]}"


def safe_generate_with_retries(hf_client, prompt, retries=3, backoff=2, **kwargs) -> str:
    """Try generation multiple times with exponential backoff when model returns empty or error."""
    for attempt in range(1, retries + 1):
        result = safe_generate(hf_client, prompt, **kwargs)

        if not result.startswith("Model error") and result != "I'm unable to generate a response right now.":
            return result

        if attempt < retries:
            wait = backoff**attempt
            #print(f"[DEBUG] retry {attempt} failed, waiting {wait}s...")
            import time
            time.sleep(wait)

    # Final fallback
    if result.startswith("Model error"):
        return "Advisory unavailable at the moment. Please try again later."

    return "I'm unable to generate a response right now."


# --------------------------------
# INIT HF CLIENT (HOSTED)
# --------------------------------

def load_hf_client():
    token = os.getenv("HF_API_TOKEN")
    if not token:
        raise RuntimeError("HF_API_TOKEN not set. Check .env file exists and is loaded.")

    model_name = os.getenv("HF_MODEL", "tiiuae/falcon-7b-instruct")
    
    token_preview = token[:20] + "..." if len(token) > 20 else token
    #print(f"[DEBUG] Using HF token: {token_preview}")
    #print(f"[DEBUG] Using HF model: {model_name}")

    return InferenceClient(
        model=model_name,
        token=token,
        timeout=30,
        #retries=1,
        #base_url="https://router.huggingface.co"
    )


# --------------------------------
# BUILD INSTRUCTION PROMPT
# --------------------------------
def build_prompt(context):
    anomalies = context.get("anomalies", [])
    allowance = context.get("allowance", {})
    remaining = allowance.get("remaining", 0)
    summary = context.get("summary", {})

    if not anomalies:
        return "Give brief budget advice for someone with no unusual spending."

    # Compact format for flan-t5-small
    spent = sum(summary.values())
    ratio = "overspending" if spent > allowance.get("monthlyAllowance", 1) else "within budget"
    
    anom_list = ", ".join([f"{a['category']}: ₹{a['amount']}" for a in anomalies[:3]])
    
    return (
        f"Budget analysis: Remaining ₹{remaining}. "
        f"Status: {ratio}. "
        f"Unusual expenses: {anom_list}. "
        f"Suggest 1-2 practical budget tips."
    )


# --------------------------------
# RULE-BASED ADVISOR (NO LLM NEEDED)
# --------------------------------

def generate_advice(analytics_output):
    """
    Generate budget advice based on analytics WITHOUT LLM.
    Works with both analytics (core) and fromML (enriched) output.
    Uses v2 metrics for nuanced recommendations.
    """
    # Handle both schemas
    if "financialPosition" in analytics_output:
        # fromML schema (enriched output) - USE RICH METRICS
        financial = analytics_output.get("financialPosition", {})
        total_spent = financial.get("spent", 0)
        monthly = financial.get("budget", 1)
        remaining = financial.get("remaining", 0)
        
        # Extract v2 metrics for context
        risk = analytics_output.get("risk", {})
        risk_level = risk.get("level", "unknown")
        overspending_prob = risk.get("overspendingProbability", 0)
        
        behavioral = analytics_output.get("behavioral", {})
        pattern = behavioral.get("dominantPattern", "unknown")
        stress_ratio = behavioral.get("emotionalMetrics", {}).get("stressSpendRatio", 0)
        
        goal_status = analytics_output.get("goalStatus", {})
        goal_progress = goal_status.get("progress", 0)
        goal_count = goal_status.get("goalCount", 0)
        on_track = goal_status.get("onTrack", True)
        
        anomalies = analytics_output.get("anomalies", [])
        summary = {}
    else:
        # Core analytics schema
        anomalies = analytics_output.get("anomalies", [])
        allowance = analytics_output.get("allowance", {})
        summary = analytics_output.get("summary", {})
        
        remaining = allowance.get("remaining", 0)
        total_spent = allowance.get("totalSpent", 0)
        monthly = allowance.get("monthlyAllowance", 1)
        
        # Defaults for core schema (no v2 metrics)
        risk_level = None
        overspending_prob = 0
        pattern = None
        stress_ratio = 0
        goal_progress = 0
        goal_count = 0
        on_track = True
    
    spent_ratio = total_spent / float(monthly) if monthly > 0 else 0
    
    advice_lines = []
    
    # STATUS LINE - Use v2 metrics if available, fallback to percentage
    if risk_level:
        # Use rich v2 metrics
        if risk_level == "critical":
            advice_lines.append("CRITICAL ALERT: High-risk spending pattern detected. Immediate action required:")
        elif risk_level == "high":
            advice_lines.append("WARNING: Your spending and behavior indicate high risk.")
        elif risk_level == "moderate":
            advice_lines.append(f"CAUTION: Moderate risk detected. You've spent {int(spent_ratio*100)}% of budget.")
            if not on_track:
                advice_lines.append("Your goals are falling behind.")
            if "impulse" in pattern.lower():
                advice_lines.append("Impulse spending detected - slow down before purchases.")
            if stress_ratio > 0.6:
                advice_lines.append(f"Warning: {int(stress_ratio*100)}% of spending is stress-driven.")
        else:  # low risk
            advice_lines.append(f"Good: You've spent {int(spent_ratio*100)}% of budget. Keep tracking.")
    else:
        # Simple percentage-based fallback (core schema)
        if spent_ratio > 0.9:
            advice_lines.append("WARNING: You're spending 90%+ of your budget. Cut unnecessary expenses immediately.")
        elif spent_ratio > 0.7:
            advice_lines.append("CAUTION: You're spending 70%+ of monthly allowance. Be more careful with purchases.")
        else:
            advice_lines.append(f"Good: You've spent {int(spent_ratio*100)}% of budget. Keep tracking.")
    
    # ANOMALY-BASED ADVICE
    if anomalies:
        top_anomaly_cat = max(anomalies, key=lambda x: x.get("amount", 0))["category"]
        advice_lines.append(f"Focus: Your {top_anomaly_cat} spending is abnormally high. Set a weekly limit.")
    
    # CATEGORY DISTRIBUTION TIP
    if summary:
        highest_cat = max(summary.items(), key=lambda x: x[1])[0]
        highest_amt = summary[highest_cat]
        if highest_amt > monthly * 0.3:
            advice_lines.append(f"{highest_cat} is {int(highest_amt/monthly*100)}% of budget. Plan better for this category.")
    
    # GOAL-SPECIFIC ADVICE
    if goal_count > 1 and not on_track:
        advice_lines.append(f"With {goal_count} goals, you need stricter spending discipline. Current progress: {int(goal_progress*100)}%.")
    elif goal_count > 0 and goal_progress < 0.3:
        advice_lines.append(f"Goal achievement at only {int(goal_progress*100)}%. Increase savings or extend timeline.")
    
    # GENERIC TIPS
    advice_lines.append("Tip: Track daily spending. Review budget weekly. Avoid impulse buys.")
    
    return " ".join(advice_lines)

#made some changes here cz cit wasnt analysing upcoming events
def chat_respond(analytics_output, user_question, plan_categories=[]):

    question = user_question.lower()
    import re
    
    # Build plan lookup
    plan_map = {p["name"]: p["amount"] for p in plan_categories} if plan_categories else {}
    plan_total = sum(plan_map.values())

    if "financialPosition" in analytics_output:
        financial = analytics_output.get("financialPosition", {})
        remaining = financial.get("remaining", 0)
        total_spent = financial.get("spent", 0)
        monthly = financial.get("budget", 0)
        avg_daily = financial.get("avgDailySpend", 0)
        days_left = financial.get("daysLeft", 15)
    else:
        allowance = analytics_output.get("allowance", {})
        remaining = allowance.get("remaining", 0)
        total_spent = allowance.get("totalSpent", 0)
        monthly = allowance.get("monthlyAllowance", 0)
        avg_daily = total_spent / 15
        days_left = 15

    summary = analytics_output.get("summary", {})
    anomalies = analytics_output.get("anomalies", [])

    live_events = analytics_output.get("liveEvents", {})
    active_evt = live_events.get("active", 0)
    upcoming_evt = live_events.get("upcoming", 0)
    
    event_warning = ""
    if active_evt > 0 or upcoming_evt > 0:
        total_evt = active_evt + upcoming_evt
        event_warning = f" Heads up: You have {total_evt} active/upcoming event(s) in your calendar!"

    amounts = re.findall(r'\d+', user_question)
    purchase = float(amounts[-1]) if amounts else 0

    # --- NEW: Catch if the user just types a number (e.g. "1500" or "1500 rs") ---
    text_only = re.sub(r'[\d\s\.,₹$]', '', question).replace('rs', '').replace('rupees', '').replace('inr', '').strip()
    is_just_number = (purchase > 0) and (len(text_only) == 0)

    # 1. Goal Impact (Highest Priority)
    if any(word in question for word in ["affect", "impact", "goal", "goals", "delay"]):
        goal_status = analytics_output.get("goalStatus", {})
        total_target = goal_status.get("totalTarget", 0)
        total_saved = goal_status.get("totalSaved", 0)
        goal_count = goal_status.get("goalCount", 0)
        pressure = goal_status.get("pressureScore", 0)
        on_track = goal_status.get("onTrack", True)

        new_remaining = remaining - purchase

        if purchase > 0:
            goal_delay = round((purchase / max(total_target - total_saved, 1)) * 12, 1) if total_target > total_saved else 0
            if new_remaining < 0:
                return (
                    f"You can't afford ₹{purchase:.0f} — it exceeds your remaining balance. "
                    f"This would directly delay your {goal_count} goal(s)."
                )
            elif pressure > 0.7:
                return (
                    f"Spending ₹{purchase:.0f} will leave you with ₹{new_remaining:.0f}. "
                    f"Your goals are under high pressure. This could delay them by ~{goal_delay} month(s). "
                    f"Consider skipping this."
                )
            else:
                return (
                    f"Spending ₹{purchase:.0f} leaves ₹{new_remaining:.0f}. "
                    f"Goal impact: ~{goal_delay} month(s) delay. "
                    f"{'Manageable, but be careful.' if on_track else 'You are already off track — this adds pressure.'} "
                )
        else:
            return (
                f"You have {goal_count} active goal(s). "
                f"Target: ₹{total_target:.0f}, Saved: ₹{total_saved:.0f}. "
                f"{'On track!' if on_track else 'Currently off track — reduce discretionary spending.'}"
            )

    # 2. END OF MONTH OUTLOOK 
    elif any(word in question for word in ["end of month", "forecast", "outlook", "end of the month", "project"]):
        projected_remaining = remaining - (avg_daily * days_left)
        
        if purchase > 0:
            projected_remaining -= purchase
            if projected_remaining < 0:
                return f"If you spend ₹{purchase:.0f}, you'll likely end the month in the negative (₹{projected_remaining:.0f}).{event_warning}"
            else:
                return f"If you spend ₹{purchase:.0f}, your projected end-of-month balance will be ~₹{projected_remaining:.0f}.{event_warning}"
        else:
            return f"Based on your daily average of ₹{avg_daily:.0f}, your projected end-of-month balance is ~₹{projected_remaining:.0f}.{event_warning}"

    # 3. BALANCE & SPENT (Moved ABOVE Affordability so "spending balance" triggers correctly)
    elif any(word in question for word in ["spent", "balance", "money left", "remaining"]):
        return f"Spent: ₹{total_spent:.0f}. Remaining: ₹{remaining:.0f}. Monthly allowance: ₹{monthly:.0f}."

    # 4. Affordability OR Just a Number (Catches "1500" perfectly now)
    elif is_just_number or any(word in question for word in ["afford", "buy", "purchase", "cost", "spare", "spend"]):
        if purchase > 0:
            if purchase <= remaining:
                return f"Yes, you can afford it. You have ₹{remaining:.0f} remaining.{event_warning} But be careful not to overspend."
            else:
                shortfall = purchase - remaining
                return f"No. You need ₹{shortfall:.0f} more. Current balance: ₹{remaining:.0f}."
        else:
            return f"Sure! You currently have ₹{remaining:.0f} remaining this month. Tell me the amount you're thinking of spending and I'll check if it's safe!"

    # 5. Anomalies
    elif any(word in question for word in ["anomal", "unusual", "spike", "high", "expensive"]):
        if anomalies:
            top = anomalies[0]
            return f"Unusual spending detected: {top['category']} ₹{top['amount']:.0f} (normal: {top['normalRange']}). Avoid this."
        else:
            return "No unusual spending patterns detected. You're spending normally."

    # 6. Categories
    elif any(word in question for word in ["category", "categories", "expense"]):
        if plan_map:
            items = ", ".join([f"{k}: budgeted ₹{v:.0f}, spent ₹{summary.get(k, 0):.0f}" 
                             for k, v in list(plan_map.items())[:3]])
            return f"Category breakdown: {items}"
        elif summary:
            items = ", ".join([f"{k}: ₹{v:.0f}" for k, v in list(summary.items())[:3]])
            return f"Top expenses: {items}"
        return "No spending data available."

    # 7. Savings Tips
    elif any(word in question for word in ["save", "tip", "advice", "help"]):
        return f"Your balance is ₹{remaining:.0f}. Add a budget plan for category-specific savings advice."

    # 8. Plan
    elif any(word in question for word in ["plan", "budget", "planned"]):
        if plan_map:
            items = ", ".join([f"{k}: ₹{v:.0f}" for k, v in plan_map.items()])
            return f"Your plan: {items}. Total planned: ₹{plan_total:.0f}."
        return "No plan set for this month. Add a plan for better tracking."

    # 9. Greetings
    elif any(word in question for word in ["hi", "hello", "hey"]):
        return f"Hi there! I'm your budget assistant. You have ₹{remaining:.0f} remaining this month. What would you like to know?"

    else:
        return (f"Budget: ₹{remaining:.0f} remaining out of ₹{monthly:.0f}. "
                f"Ask me about spending, balance, unusual expenses, affordability, or saving tips.")