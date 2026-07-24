const express = require("express")
const router = express.Router()

const isLoggedIn = require("../middleware/auth")
const {
  saveProfile,
  getProfile
} = require("../controller/behaviorProfile")

//router.post("/", isLoggedIn, saveProfile)
router.get("/", isLoggedIn, getProfile)

module.exports = router