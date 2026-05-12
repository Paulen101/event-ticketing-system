const express = require('express');
const {
  getMyBookings,
  getBookingById,
  createBooking,
  validateBookingQr
} = require('../controllers/bookingController');
const { protect } = require('../middleware/authMiddleware');
const { admin } = require('../middleware/adminMiddleware');

const router = express.Router();

router.route('/').get(protect, getMyBookings).post(protect, createBooking);
router.route('/validate/:qr').get(protect, admin, validateBookingQr);
router.route('/:id').get(protect, getBookingById);

module.exports = router;
