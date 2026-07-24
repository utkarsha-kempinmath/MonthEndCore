const ShareConfig = require("../models/shareConfigModel");

// Configure sharing
const configureSharing = async (req, res) => {
  try {
    // AFTER
const { parentEmail, preferences, tone, sharingDate } = req.body;

const config = await ShareConfig.findOneAndUpdate(
  { userId: req.user._id },
  {
    parentEmail,
    sharingDate,
    sharingPreferences: preferences,
    tone,
    isSharingEnabled: true,
  },
  { upsert: true, new: true }
);

    res.json({ success: true, config });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to configure sharing" });
  }
};

// Toggle sharing
const toggleSharing = async (req, res) => {
  try {
    const config = await ShareConfig.findOne({ userId: req.user._id });

    if (!config) {
      return res.status(404).json({ error: "Config not found" });
    }

    config.isSharingEnabled = !config.isSharingEnabled;
    await config.save();

    res.json({ success: true, isSharingEnabled: config.isSharingEnabled });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to toggle sharing" });
  }
};

module.exports = {
  configureSharing,
  toggleSharing,
};