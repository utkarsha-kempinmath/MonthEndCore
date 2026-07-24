const { spawn } = require("child_process");
const path = require("path");

const runPython = (input) => {
    return new Promise((resolve, reject) => {
        const py = spawn("python", [
            path.join(__dirname, "../../sample_AIML/run_wrapper.py")
        ]);

        let data = "";
        let error = "";

        py.stdout.on("data", (chunk) => {
            data += chunk.toString();
        });

        // ← Add this — captures Python tracebacks
        py.stderr.on("data", (chunk) => {
            error += chunk.toString();
        });

        py.on("close", (code) => {
            if (code !== 0) {
                return reject(new Error(`Python exited ${code}: ${error}`));
            }

            try {
                const firstBrace = data.indexOf('{');
                const lastBrace = data.lastIndexOf('}');
                if (firstBrace === -1 || lastBrace === -1) {
                    throw new Error("No JSON found");
                }
                const cleanJSON = data.slice(firstBrace, lastBrace + 1);
                resolve(JSON.parse(cleanJSON));

            } catch (err) {
                reject(new Error(`Invalid JSON from ML. stderr: ${error} stdout: ${data}`));
            }
        });

        py.stdin.write(JSON.stringify(input));
        py.stdin.end();
    });
};

exports.runAnalytics = (payload) => {
    return runPython({ mode: "from_ml", payload });
};

exports.runChatbot = (analytics_output, question, planCategories = []) => {
    return runPython({
        mode: "chatbot",
        analytics_output,
        question,
        plan_categories: planCategories
    });
};