const { runAnalytics } = require("./mlBridge");

exports.generateInsights = async (mlInput) => {
    const analytics = await runAnalytics(mlInput);

    return analytics;
};