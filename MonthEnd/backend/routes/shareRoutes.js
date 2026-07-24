const express = require("express");
const router = express.Router();

const isLoggedIn = require("../middleware/auth");
const {
  configureSharing,
  toggleSharing,
} = require("../controller/shareController");

const {
  generateParentReport
} = require("../services/parentReportService");

const { generateEmailHTML } = require("../utils/emailTemplate");
const { sendParentEmail } = require("../services/mailService");
const ShareConfig = require("../models/shareConfigModel");

// 🔥 TEST ROUTE
router.get("/test-parent-email", isLoggedIn, async (req, res) => {
  try {
    const config = await ShareConfig.findOne({ userId: req.user._id });

    if (!config) {
      return res.status(404).json({ error: "No sharing config found" });
    }

    const report = await generateParentReport(req.user._id);

    if (!report) {
      return res.status(400).json({ error: "No report generated" });
    }

    const html = generateEmailHTML(report, config.tone);

    await sendParentEmail(config.parentEmail, html);

    res.json({ success: true, message: "Email sent successfully!" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to send email" });
  }
});

// Routes
router.post("/configure", isLoggedIn, configureSharing);
router.post("/toggle", isLoggedIn, toggleSharing);

module.exports = router;