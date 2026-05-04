const express = require('express');
const {
  getEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent
} = require('../controllers/eventController');
const { protect } = require('../middleware/authMiddleware');
const { admin } = require('../middleware/adminMiddleware');

const router = express.Router();

router.route('/').get(getEvents).post(protect, admin, createEvent);
router.route('/:id').get(getEventById).put(protect, admin, updateEvent).delete(protect, admin, deleteEvent);

module.exports = router;
