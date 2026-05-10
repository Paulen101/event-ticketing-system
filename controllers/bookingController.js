const crypto = require('crypto');
const QRCode = require('qrcode');
const Booking = require('../models/Booking');
const Event = require('../models/Event');
const { sendBookingConfirmation } = require('../utils/emailService');

const getMyBookings = async (req, res, next) => {
  try {
    const bookings = await Booking.find({ user: req.user._id })
      .populate('event')
      .sort({ bookingDate: -1 });

    res.json(bookings);
  } catch (error) {
    next(error);
  }
};

const getBookingById = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id).populate('event');

    if (!booking) {
      res.status(404);
      throw new Error('Booking not found');
    }

    if (booking.user.toString() !== req.user._id.toString()) {
      res.status(403);
      throw new Error('Not authorized to view this booking');
    }

    res.json(booking);
  } catch (error) {
    next(error);
  }
};

const createBooking = async (req, res, next) => {
  try {
    const { event: eventId, quantity } = req.body;
    const requestedQuantity = Number(quantity);

    if (!eventId || !quantity) {
      res.status(400);
      throw new Error('Event and quantity are required');
    }

    if (!Number.isInteger(requestedQuantity) || requestedQuantity <= 0) {
      res.status(400);
      throw new Error('Quantity must be a whole number greater than 0');
    }

    const event = await Event.findOneAndUpdate(
      {
        _id: eventId,
        $expr: {
          $gte: [{ $subtract: ['$seatCapacity', '$bookedSeats'] }, requestedQuantity]
        }
      },
      { $inc: { bookedSeats: requestedQuantity } },
      { new: true, runValidators: true }
    );

    if (!event) {
      const eventExists = await Event.exists({ _id: eventId });

      if (!eventExists) {
        res.status(404);
        throw new Error('Event not found');
      }

      res.status(400);
      throw new Error('Not enough seats available');
    }

    let createdBooking;

    try {
      createdBooking = await Booking.create({
        user: req.user._id,
        event: event._id,
        quantity: requestedQuantity,
        qrCode: crypto.randomUUID()
      });
    } catch (bookingError) {
      await Event.updateOne({ _id: event._id }, { $inc: { bookedSeats: -requestedQuantity } });
      throw bookingError;
    }

    const booking = await Booking.findById(createdBooking._id).populate('event');
    const qrImage = await QRCode.toDataURL(booking.qrCode);
    let emailSent = false;

    try {
      emailSent = await sendBookingConfirmation({
        to: req.user.email,
        booking,
        event
      });
    } catch (emailError) {
      console.error(`Booking confirmation email failed: ${emailError.message}`);
    }

    res.status(201).json({
      booking,
      qrImage,
      emailSent
    });
  } catch (error) {
    next(error);
  }
};

const validateBookingQr = async (req, res, next) => {
  try {
    const booking = await Booking.findOne({ qrCode: req.params.qr })
      .populate('event')
      .populate('user', 'name email');

    if (!booking) {
      res.status(404);
      throw new Error('Invalid QR code');
    }

    res.json({
      valid: true,
      booking
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMyBookings,
  getBookingById,
  createBooking,
  validateBookingQr
};
