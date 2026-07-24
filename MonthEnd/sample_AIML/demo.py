"""
demo.py

Terminal-based demo to simulate all AI features:
- Analytics (anomaly detection)
- Advisory generation
- Chatbot interaction

This file is for DEMO / TESTING ONLY.
"""

import json
from ai_engine.run import (
    run_analytics,
    run_from_ml,
    run_advisory,
    run_chatbot
)


def load_json(path):
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def save_json(path, data):
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)


def main():
    print("\n=== AI ENGINE DEMO ===\n")

    print("1. Loading sentToML v2 payload...")
    sent_payload = load_json("../shared/sentToML.json")

    print("2. Running from_ml (sentToML v2 -> fromML)...")
    try:
        from_ml = run_from_ml(sent_payload)
        
        print("\n[OK] Processed Successfully!")
        print(f"  Risk Level: {from_ml['risk']['level']}")
        print(f"  Spending Probability: {from_ml['risk']['overspendingProbability']:.2%}")
        print(f"  Forecast Confidence: {from_ml['forecast']['confidence']:.2%}")
        print(f"  Goal Achievement: {from_ml['predictions']['goalAchievementProbability']:.2%}")
        
        print("\n  Full fromML output:")
        print(json.dumps(from_ml, indent=2))

        print("\n3. Writing fromML output to ../shared/fromML.json...")
        save_json("../shared/fromML.json", from_ml)
        print("[OK] Saved")

    except Exception as e:
        print(f"[ERROR] {e}")
        import traceback
        traceback.print_exc()
        return

    print("\n4. Generating advisory...")
    try:
        advisory = run_advisory(from_ml)
        print("\nAdvice:")
        print(advisory["advice"])
    except Exception as e:
        print(f"[ERROR] Advisory generation failed: {e}")

    print("\n5. Chatbot demo")
    print("(Type 'exit' to quit)\n")
    while True:
        question = input("Ask a question: ")
        if question.lower() == "exit":
            break

        try:
            response = run_chatbot(from_ml, question)
            print(f"Bot: {response['answer']}\n")
        except Exception as e:
            print(f"[ERROR] {e}\n")

    print("[OK] Demo finished.")


if __name__ == "__main__":
    main()
