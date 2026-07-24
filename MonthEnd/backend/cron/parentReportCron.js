const cron = require("node-cron");
const ShareConfig = require("../models/shareConfigModel");
const { generateParentReport } = require("../services/parentReportService");
const { generateEmailHTML } = require("../utils/emailTemplate");
const { sendParentEmail } = require("../services/mailService");

// Runs every single day at 12:00 AM (Midnight)
cron.schedule("0 0 * * *", async () => {
  try {
    // 1. Get today's day of the month (e.g., 15)
    const todayDate = new Date().getDate();

    // 2. Find ONLY the users who have sharing enabled AND selected today
    const users = await ShareConfig.find({ 
      isSharingEnabled: true,
      sharingDate: todayDate 
    });

    console.log(`[CRON] Found ${users.length} parent reports to send for day ${todayDate}`);

    // 3. Process and send
    for (const user of users) {
      const report = await generateParentReport(user.userId);

      if (!report) continue;

      const html = generateEmailHTML(report, user.tone);

      await sendParentEmail(user.parentEmail, html);

      user.lastSentAt = new Date();
      await user.save();
    }
  } catch (error) {
    console.error("[CRON] Error sending parent reports:", error);
  }
});