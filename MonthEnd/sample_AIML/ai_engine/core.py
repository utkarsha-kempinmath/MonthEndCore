"""
core.py

Pure analytics layer.
- Deterministic, testable functions only

Input: structured Python data (from backend)
Output: structured Python data (for backend / HF layer)
"""

import pandas as pd


# --------------------------------
# MINIMUM DATA CHECK
# --------------------------------
def has_minimum_data(expenses, min_records=5):
    """
    Ensures there is enough data to run analysis.

    expenses: list of dicts
    min_records: minimum unique records required
    """
    if not expenses:
        return False

    return len(expenses) >= min_records


# --------------------------------
# ANOMALY DETECTION (IQR METHOD)
# --------------------------------
def detect_anomalies(expenses):
    """
    Detects anomalous expenses using IQR per category.

    expenses: list of dicts with keys:
        - date
        - category
        - amount
    """
    df = pd.DataFrame(expenses)

    # Guard: required columns
    required_cols = {"date", "category", "amount"}
    if not required_cols.issubset(df.columns):
        raise ValueError("Expenses missing required fields")

    anomalies = []

    for category in df["category"].unique():
        subset = df[df["category"] == category]["amount"]

        # Guard: need variation
        if len(subset) < 3:
            continue

        q1 = subset.quantile(0.25)
        q3 = subset.quantile(0.75)
        iqr = q3 - q1

        lower_bound = max(0, q1 - 1.5 * iqr)
        upper_bound = q3 + 1.5 * iqr

        for _, row in df[df["category"] == category].iterrows():
            if row["amount"] < lower_bound or row["amount"] > upper_bound:
                anomalies.append({
                    "date": row["date"],
                    "category": row["category"],
                    "amount": float(row["amount"]),
                    "normalRange": f"{round(lower_bound, 2)}–{round(upper_bound, 2)}"
                })

    return anomalies


# --------------------------------
# SPENDING SUMMARY
# --------------------------------
def spending_summary(expenses):
    """
    Returns total spending per category.
    """
    df = pd.DataFrame(expenses)

    summary = (
        df.groupby("category")["amount"]
        .sum()
        .sort_values(ascending=False)
        .to_dict()
    )

    # Ensure JSON-safe types
    return {k: float(v) for k, v in summary.items()}


# --------------------------------
# ALLOWANCE METRICS
# --------------------------------
def allowance_metrics(expenses, monthly_allowance):
    """
    Calculates allowance usage.

    monthly_allowance: number
    """
    total_spent = sum(float(e["amount"]) for e in expenses)

    return {
        "monthlyAllowance": float(monthly_allowance),
        "totalSpent": float(total_spent),
        "remaining": float(monthly_allowance - total_spent)
    }


# --------------------------------
# MASTER ANALYSIS FUNCTION
# --------------------------------
def run_core_analysis(payload):
    """
    Entry point for backend.

    payload format:
    {
        "user": {
            "userId": str,
            "monthlyAllowance": number
        },
        "expenses": [ ... ]
    }
    """
    expenses = payload.get("expenses", [])
    user = payload.get("user", {})

    if not has_minimum_data(expenses):
        return {
            "status": "not_enough_data",
            "message": "At least 5 expense records are required"
        }

    anomalies = detect_anomalies(expenses)
    summary = spending_summary(expenses)
    allowance = allowance_metrics(
        expenses,
        user.get("monthlyAllowance", 0)
    )

    return {
        "status": "ok",
        "anomalies": anomalies,
        "summary": summary,
        "allowance": allowance
    }
