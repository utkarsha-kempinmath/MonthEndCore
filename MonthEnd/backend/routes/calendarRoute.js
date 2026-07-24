const express = require('express')
const router = express.Router()

const isLoggedIn = require('../middleware/auth')
const calendarController = require('../controller/calendar')

router.post('/', isLoggedIn, calendarController.addEvent)
router.get('/', isLoggedIn, calendarController.getEvents)
router.patch('/:id', isLoggedIn, calendarController.updateEvent)
router.delete('/:id', isLoggedIn, calendarController.deleteEvent)

module.exports = router
