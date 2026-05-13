const Event = require('../models/Event');
const Booking = require('../models/Booking');

const escapeRegex = (value) => {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

const EVENT_UPDATE_FIELDS = [
  'title',
  'description',
  'category',
  'venue',
  'date',
  'time',
  'seatCapacity',
  'price'
];

const getEvents = async (req, res, next) => {
  try {
    const { category, date } = req.query;
    const filter = {};

    if (category) {
      filter.category = new RegExp(`^${escapeRegex(category)}$`, 'i');
    }

    if (date) {
      const start = new Date(date);

      if (Number.isNaN(start.getTime())) {
        res.status(400);
        throw new Error('Invalid date filter');
      }

      const end = new Date(start);
      end.setDate(end.getDate() + 1);
      filter.date = { $gte: start, $lt: end };
    }

    const events = await Event.find(filter).sort({ date: 1 });
    res.json(events);
  } catch (error) {
    next(error);
  }
};

const getEventById = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      res.status(404);
      throw new Error('Event not found');
    }

    res.json(event);
  } catch (error) {
    next(error);
  }
};

const createEvent = async (req, res, next) => {
  try {
    const event = await Event.create(req.body);
    res.status(201).json(event);
  } catch (error) {
    next(error);
  }
};

const updateEvent = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      res.status(404);
      throw new Error('Event not found');
    }

    if (
      req.body.seatCapacity !== undefined &&
      Number(req.body.seatCapacity) < event.bookedSeats
    ) {
      res.status(400);
      throw new Error('Seat capacity cannot be lower than already booked seats');
    }

    EVENT_UPDATE_FIELDS.forEach((field) => {
      if (req.body[field] !== undefined) {
        event[field] = req.body[field];
      }
    });
    const updatedEvent = await event.save();

    res.json(updatedEvent);
  } catch (error) {
    next(error);
  }
};

const deleteEvent = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      res.status(404);
      throw new Error('Event not found');
    }

    const bookingExists = await Booking.exists({ event: event._id });

    if (bookingExists) {
      res.status(400);
      throw new Error('Cannot delete an event with existing bookings');
    }

    await event.deleteOne();
    res.json({ message: 'Event deleted' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent
};
