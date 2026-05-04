const express = require('express');
const {
  getMyBookings,
  getBookingById,
  createBooking,
  validateBookingQr
} = require('../controllers/bookingController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.route('/').get(protect, getMyBookings).post(protect, createBooking);
router.route('/validate/:qr').get(validateBookingQr);
router.route('/:id').get(protect, getBookingById);

module.exports = router;
