const Booking = require('../models/Booking');
const Event = require('../models/Event');
const User = require('../models/User');

const getDashboard = async (req, res, next) => {
  try {
    const [
      totalUsers,
      totalEvents,
      totalBookings,
      recentEvents,
      recentBookings,
      lowAvailabilityEvents
    ] = await Promise.all([
      User.countDocuments(),
      Event.countDocuments(),
      Booking.countDocuments(),
      Event.find()
        .sort({ createdAt: -1 })
        .limit(5),
      Booking.find()
        .populate('user', 'name email')
        .populate('event', 'title date venue')
        .sort({ bookingDate: -1 })
        .limit(5),
      Event.aggregate([
        {
          $addFields: {
            availableSeats: { $subtract: ['$seatCapacity', '$bookedSeats'] }
          }
        },
        {
          $match: {
            availableSeats: { $lte: 10 }
          }
        },
        {
          $sort: {
            availableSeats: 1,
            date: 1
          }
        },
        {
          $limit: 5
        },
        {
          $project: {
            title: 1,
            date: 1,
            venue: 1,
            seatCapacity: 1,
            bookedSeats: 1,
            availableSeats: 1
          }
        }
      ])
    ]);

    res.json({
      summary: {
        totalUsers,
        totalEvents,
        totalBookings
      },
      recentEvents,
      recentBookings,
      lowAvailabilityEvents
    });
  } catch (error) {
    next(error);
  }
};

const getAnalytics = async (req, res, next) => {
  try {
    const [
      totalUsers,
      totalEvents,
      totalBookings,
      bookingStats,
      eventStats,
      revenueStats,
      categoryStats
    ] = await Promise.all([
      User.countDocuments(),
      Event.countDocuments(),
      Booking.countDocuments(),
      Booking.aggregate([
        {
          $group: {
            _id: null,
            totalTicketsBooked: { $sum: '$quantity' }
          }
        }
      ]),
      Event.aggregate([
        {
          $group: {
            _id: null,
            totalSeatCapacity: { $sum: '$seatCapacity' },
            totalBookedSeats: { $sum: '$bookedSeats' },
            totalPotentialRevenue: { $sum: { $multiply: ['$seatCapacity', '$price'] } }
          }
        }
      ]),
      Booking.aggregate([
        {
          $lookup: {
            from: 'events',
            localField: 'event',
            foreignField: '_id',
            as: 'event'
          }
        },
        {
          $unwind: '$event'
        },
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: { $multiply: ['$quantity', '$event.price'] } }
          }
        }
      ]),
      Event.aggregate([
        {
          $group: {
            _id: '$category',
            events: { $sum: 1 },
            bookedSeats: { $sum: '$bookedSeats' },
            seatCapacity: { $sum: '$seatCapacity' }
          }
        },
        {
          $project: {
            _id: 0,
            category: {
              $cond: [{ $eq: ['$_id', ''] }, 'Uncategorized', '$_id']
            },
            events: 1,
            bookedSeats: 1,
            seatCapacity: 1
          }
        },
        {
          $sort: {
            bookedSeats: -1,
            events: -1
          }
        }
      ])
    ]);

    res.json({
      totalUsers,
      totalEvents,
      totalBookings,
      totalTicketsBooked: bookingStats[0]?.totalTicketsBooked || 0,
      totalSeatCapacity: eventStats[0]?.totalSeatCapacity || 0,
      totalBookedSeats: eventStats[0]?.totalBookedSeats || 0,
      totalAvailableSeats:
        (eventStats[0]?.totalSeatCapacity || 0) - (eventStats[0]?.totalBookedSeats || 0),
      totalRevenue: revenueStats[0]?.totalRevenue || 0,
      totalPotentialRevenue: eventStats[0]?.totalPotentialRevenue || 0,
      categoryStats
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboard,
  getAnalytics
};
