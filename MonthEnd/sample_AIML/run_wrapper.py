import sys
import os
import json

sys.path.append(os.path.dirname(__file__))

from ai_engine.run import run_analytics, run_chatbot

def main():
    input_data = sys.stdin.read()
    data = json.loads(input_data)

    mode = data.get("mode")

    if mode == "analytics":
        result = run_analytics(data["payload"])
    
    elif mode == "chatbot":
        result = run_chatbot(
            data["analytics_output"],
            data["question"],
            data.get("plan_categories", []) 
        )
    
    elif mode == "from_ml":
        from ai_engine.run import run_from_ml
        result = run_from_ml(data["payload"])
    
    else:
        result = {"error": "Invalid mode"}

    print(json.dumps(result))
    

if __name__ == "__main__":
    main()