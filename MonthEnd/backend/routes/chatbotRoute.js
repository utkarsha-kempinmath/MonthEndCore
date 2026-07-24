const express = require("express")
const router = express.Router()

const isLoggedIn = require("../middleware/auth")
const { handleChatQuery } = require("../controller/chatbot")

router.post("/", isLoggedIn, handleChatQuery)

module.exports = router