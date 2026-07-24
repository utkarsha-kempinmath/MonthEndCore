const express = require("express");
const homeController = require('../controller/home')
const isLoggedIn = require("../middleware/auth");

const router = express.Router();

router.get("/dashboard", isLoggedIn, homeController.getDashboard);
router.get('/analysis', isLoggedIn, homeController.getMonthlyAnalysis)
router.get("/reflection", isLoggedIn, homeController.getMonthlyReflection)

module.exports = router;
