const express = require('express')
const router = express.Router()

const isLoggedIn = require('../middleware/auth')
const planningController = require('../controller/planning')

router.post('/', isLoggedIn, planningController.savePlan)
router.get('/', isLoggedIn, planningController.getPlan)

module.exports = router
