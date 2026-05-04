const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true
    },
    description: {
      type: String,
      default: ''
    },
    category: {
      type: String,
      trim: true,
      default: ''
    },
    venue: {
      type: String,
      trim: true,
      default: ''
    },
    date: {
      type: Date,
      required: [true, 'Date is required']
    },
    time: {
      type: String,
      default: ''
    },
    seatCapacity: {
      type: Number,
      required: [true, 'Seat capacity is required'],
      min: [1, 'Seat capacity must be greater than 0']
    },
    bookedSeats: {
      type: Number,
      default: 0,
      min: [0, 'Booked seats cannot be negative']
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price cannot be negative']
    }
  },
  {
    timestamps: true
  }
);

eventSchema.pre('validate', function validateBookedSeats(next) {
  if (this.bookedSeats > this.seatCapacity) {
    this.invalidate('bookedSeats', 'Booked seats cannot exceed seat capacity');
  }

  next();
});

module.exports = mongoose.model('Event', eventSchema);
