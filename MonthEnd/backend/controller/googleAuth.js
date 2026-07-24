const { OAuth2Client } = require("google-auth-library");
const jwt = require("jsonwebtoken");
const User = require("../models/userModel");

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const googleLogin = async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: "Google token is required",
      });
    }

    const ticket = await client.verifyIdToken({
            idToken: req.body.token, // (Or whatever variable holds your token here)
            audience: [
                // 1. Whatever is currently in your .env file
                process.env.GOOGLE_CLIENT_ID, 
                
                // 2. Your Web ID (with the number 1)
                "298605633-u5khvgj5c2mkp1617u5hkktuqobnm4uq.apps.googleusercontent.com",
                
                // 3. Your Web ID (with the letter L, just in case)
                "298605633-u5khvgj5c2mkp16l7u5hkktuqobnm4uq.apps.googleusercontent.com",
                
                // 4. Your Android ID
                "298605633-b5a79mmqb26jgsnvmigko1ouvkr4re9u.apps.googleusercontent.com"
            ],
        });

    const payload = ticket.getPayload();

    const { email, name, sub } = payload; // sub = googleId

    let user = await User.findOne({ email });

    if (user && user.authProvider === "local") {
      user.authProvider = "google";
      user.googleId = sub;
      await user.save();
    }

    if (!user) {
      user = await User.create({
        username: name,
        email,
        passwordHash: null,
        authProvider: "google",
        googleId: sub,
      });
    }

    const jwtToken = jwt.sign(
      { _id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES || "7d" }
    );

    return res.status(200).json({
      success: true,
      token: jwtToken,
      user,
    });

  } catch (err) {
    console.log("=== RAW GOOGLE ERROR ===", err)

    return res.status(401).json({
      success: false,
      message: "Google authentication failed",
    });
  }
};

module.exports = { googleLogin };