# Event Ticketing System

An event ticketing application built with Node.js, Express, MongoDB, and a browser-based frontend. It supports user registration, JWT login, public event browsing, ticket booking with seat validation, QR code generation, email confirmations, and admin reporting.

## Features

- JWT-based registration and login
- Public event listing with category and date filters
- Event details, available seats, ticket pricing, and booking flow
- Atomic seat reservation to prevent overbooking
- QR code generation for each booking
- Optional booking confirmation emails through Resend
- User booking history
- Admin-only event creation, updates, deletion, QR validation, dashboard, and analytics
- Static browser frontend served by the Express app
- Centralized API error handling and content-aware 404 responses

## Tech Stack

- Node.js
- Express
- MongoDB with Mongoose
- JSON Web Tokens
- bcryptjs
- qrcode
- Resend API via `fetch` for optional email delivery

## Project Structure

```txt
config/        MongoDB connection
controllers/   Request handlers for auth, events, bookings, and admin data
middleware/    Auth, admin, 404, and error handling middleware
models/        Mongoose schemas
public/        Browser frontend files
routes/        Express route definitions
utils/         JWT and email helpers
server.js      App entry point
```

## Prerequisites

- Node.js 18 or newer
- npm
- MongoDB connection string
- Optional Resend API key for booking confirmation emails

## Setup

Install dependencies:

```bash
npm install
```

Create your environment file:

```bash
cp .env.example .env
```

Update `.env`:

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
NODE_ENV=development

RESEND_API_KEY=your_resend_api_key
EMAIL_FROM=Ticket Management <onboarding@resend.dev>
```

`RESEND_API_KEY` and `EMAIL_FROM` are optional. If they are missing, bookings still work and email confirmations are skipped.

## Run

```bash
npm start
```

The app runs at:

```txt
http://localhost:5000
```

Frontend routes:

| Route | Description |
|---|---|
| `/` | Main user interface |
| `/admin` | Admin interface |
| `/admin/dashboard` | Admin dashboard interface |

API routes are served under `/api`.

## Authentication

Protected endpoints require a bearer token:

```txt
Authorization: Bearer <token>
```

Public registration always creates a regular user with the `user` role. Admin accounts should be created through a trusted database update or a separate protected admin workflow.

## API Reference

### Auth

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/api/auth/register` | Public | Register a user |
| `POST` | `/api/auth/login` | Public | Login and receive a JWT |

Register:

```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123"
}
```

Login:

```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

### Events

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/events` | Public | List events |
| `GET` | `/api/events/:id` | Public | Get one event |
| `POST` | `/api/events` | Admin | Create an event |
| `PUT` | `/api/events/:id` | Admin | Update an event |
| `DELETE` | `/api/events/:id` | Admin | Delete an event |

Supported filters:

```txt
/api/events?category=music
/api/events?date=2026-05-04
/api/events?category=music&date=2026-05-04
```

Create event:

```json
{
  "title": "Tech Conference 2026",
  "description": "A conference about technology and innovation.",
  "category": "Technology",
  "venue": "Main Hall",
  "date": "2026-05-04",
  "time": "10:00 AM",
  "seatCapacity": 100,
  "price": 25
}
```

Notes:

- Event dates must be valid date values.
- `seatCapacity` must be greater than zero.
- `price` cannot be negative.
- An event cannot be deleted if it already has bookings.
- Seat capacity cannot be reduced below the number of already booked seats.

### Bookings

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/bookings` | User | Get the logged-in user's bookings |
| `GET` | `/api/bookings/:id` | User | Get one owned booking |
| `POST` | `/api/bookings` | User | Book tickets for an event |
| `GET` | `/api/bookings/validate/:qr` | Admin | Validate a booking QR code |

Create booking:

```json
{
  "event": "event_id_here",
  "quantity": 2
}
```

Booking creation returns:

- `booking`: the saved booking with event data
- `qrImage`: a PNG data URL for the generated QR code
- `emailSent`: currently `false` because email is queued after the API response
- `emailQueued`: whether email delivery was queued

### Admin

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/admin/dashboard` | Admin | Summary counts, recent records, low-seat events, and bookings by event |
| `GET` | `/api/admin/dashboard/events` | Admin | Events with bookings and users who booked each event |
| `GET` | `/api/admin/analytics` | Admin | Booking, seat, revenue, and category analytics |
| `GET` | `/api/admin/email-status` | Admin | Check Resend configuration without exposing secrets |

## Email Confirmations

When Resend is configured, booking confirmation emails are sent after the booking response is returned. This keeps ticket creation fast and prevents email delivery failures from blocking a successful booking.

Required variables:

```env
RESEND_API_KEY=your_resend_api_key
EMAIL_FROM=Ticket Management <onboarding@resend.dev>
```

For production, verify a sending domain in Resend and use an address from that domain for `EMAIL_FROM`.

## Scripts

| Command | Description |
|---|---|
| `npm start` | Start the Express server |
| `npm run dev` | Start the Express server |

## Error Responses

API errors return JSON with a message. Common failures include missing required fields, invalid credentials, invalid event IDs, insufficient seats, unauthorized access, and attempts to delete events that already have bookings.
