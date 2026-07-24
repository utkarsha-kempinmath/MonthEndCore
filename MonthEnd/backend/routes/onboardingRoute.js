const express = require("express")
const router = express.Router()

const isLoggedIn = require("../middleware/auth")
const { completeOnboarding } = require("../controller/onboarding")

router.post("/complete", isLoggedIn, completeOnboarding)

module.exports = router