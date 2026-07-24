"""
run.py

Thin orchestration layer for the AI engine.

This file:
- contains NO I/O
- contains NO execution on import
- contains NO database access
- contains NO CLI behavior

Backend is expected to call the exposed functions directly.
"""

from ai_engine.schemas import validate_payload
from ai_engine.core import run_core_analysis
from ai_engine.hf_advisor import load_hf_model, generate_advice, chat_response


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
# ADVISORY ENTRY POINT
# --------------------------------
def run_advisory(analytics_output: dict) -> dict:
    """
    Generates natural-language advice from analytics output.

    Intended usage:
    - on-demand
    - chatbot / explanation layer
    """
    hf_pipeline = load_hf_model()
    advice = generate_advice(hf_pipeline, analytics_output)

    return {
        "advice": advice
    }


# --------------------------------
# CHATBOT ENTRY POINT
# --------------------------------
def run_chatbot(
    analytics_output: dict,
    user_question: str
) -> dict:
    """
    Answers a user question using cached analytics.
    """
    hf_pipeline = load_hf_model()
    answer = chat_response(
        hf_pipeline,
        analytics_output,
        user_question
    )

    return {
        "answer": answer
    }
"""
run.py

Thin orchestration layer for the AI engine.

This file:
- contains NO I/O
- contains NO execution on import
- contains NO database access
- contains NO CLI behavior

Backend is expected to call the exposed functions directly.
"""

from ai_engine.schemas import validate_payload
from ai_engine.core import run_core_analysis
from ai_engine.hf_advisor import load_hf_model, generate_advice, chat_response


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
# ADVISORY ENTRY POINT
# --------------------------------
def run_advisory(analytics_output: dict) -> dict:
    """
    Generates natural-language advice from analytics output.

    Intended usage:
    - on-demand
    - chatbot / explanation layer
    """
    hf_pipeline = load_hf_model()
    advice = generate_advice(hf_pipeline, analytics_output)

    return {
        "advice": advice
    }


# --------------------------------
# CHATBOT ENTRY POINT
# --------------------------------
def run_chatbot(
    analytics_output: dict,
    user_question: str
) -> dict:
    """
    Answers a user question using cached analytics.
    """
    hf_pipeline = load_hf_model()
    answer = chat_response(
        hf_pipeline,
        analytics_output,
        user_question
    )

    return {
        "answer": answer
    }

# ---------------------------------------------
# INSTALLATION STEPS
# ----------------------------------------------
Step 1: Create or activate a virtual environment

Windows:
venv\Scripts\activate

Linux / macOS:
source venv/bin/activate

Step 2: Install dependencies

From the project root:

pip install -r requirements.txt

# ----------------------------------
# INPUT DATA CONTRACT (BACKEND → AI)
# -------------------------------------
The backend must supply a payload with this structure:

{
"user": {
"userId": "string",
"monthlyAllowance": number
},
"expenses": [
{
"date": "YYYY-MM-DD",
"category": "string",
"amount": number
}
]
}

Rules:

At least 5 expense records are required

Amounts must be non-negative

Backend is responsible for validation before calling AI

# -----------------------------------------------------
# CORE ANALYTICS USAGE (NO LLM)
# ------------------------------------------------------
Intended usage:

Run once per user session

Cache results in backend

Conceptual usage:

from ai_engine.run import run_analytics

analytics_output = run_analytics(payload)

Returns:

anomalies

spending summaries

allowance metrics

# ----------------------------------------
# HUGGING FACE ADVISORY (OPTIONAL)
# -----------------------------------------
Hugging Face is used ONLY for:

explaining anomalies

generating suggestions

chatbot-style interaction

Model used:

google/flan-t5-base (instruction-tuned)

Characteristics:

No hallucinated facts

Uses only analytics output

Deterministic (no sampling)

# ---------------------------------------
# ADVISORY USAGE (ON-DEMAND)
# ---------------------------------------
Intended usage:

Triggered by user action (chatbot)

Uses cached analytics

No recomputation

Conceptual usage:

from ai_engine.run import run_advisory

advice = run_advisory(analytics_output)

CHATBOT USAGE (ON-DEMAND)

Conceptual usage:

from ai_engine.run import run_chatbot

reply = run_chatbot(
analytics_output,
"Why was shopping flagged this month?"
)

# -------------------------------------------------------
# PERFORMANCE NOTES
# --------------------------------------------------------
Analytics are deterministic and fast

Hugging Face has cold-start latency on first call

HF should NOT be called on every request

Backend should cache analytics per session

# --------------------------------------------------------
# SECURITY & SAFETY
# --------------------------------------------------------
No secrets stored in AI module

No environment variables required

No file system writes

No network calls except Hugging Face model load

DEVELOPMENT & TESTING NOTES

data/user-model.json is for local testing only

run.py must NOT be auto-executed

AI module is safe to import in backend

# ------------------------------------------------------------
# PRODUCTION GUIDELINES
# ------------------------------------------------------------
Backend controls lifecycle

Backend controls caching

Backend controls feature toggles

Hugging Face can be disabled without breaking analytics

# --------------------------------------------------------------------
# SUMMARY
# --------------------------------------------------------------------
sample_AIML is a pure AI computation layer.
It is safe, stateless, backend-controlled, and production-ready.

====================================================