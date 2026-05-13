# Event Ticketing System REST API

A Node.js and Express REST API for managing events, ticket bookings, users, authentication, and admin-only event management.

## Features

- User registration and login with JWT authentication
- Public event listing, event details, and event filtering by category/date
- Authenticated ticket booking with available-seat validation
- Users can view only their own bookings
- Admin-only event creation, updates, and deletion
- Admin dashboard and analytics endpoints
- Browser frontend for login, event booking, user bookings, and admin event bookings
- Centralized error handling and content-aware 404 responses

## Setup

```bash
npm install
cp .env.example .env
```

Update `.env` with your MongoDB connection string and JWT secret:

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
NODE_ENV=development

SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
SMTP_SECURE=false
EMAIL_FROM=
```

## Run

```bash
npm start
```

The app runs at `http://localhost:5000`. The browser frontend is served from `/`, the admin dashboard frontend is available at `/admin/dashboard`, and the API is served from `/api`.

## Endpoints

### Auth

| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/api/auth/register` | Public | Register a user |
| POST | `/api/auth/login` | Public | Login and receive a token |

### Events

| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/api/events` | Public | Get events |
| GET | `/api/events/:id` | Public | Get one event |
| POST | `/api/events` | Admin | Create event |
| PUT | `/api/events/:id` | Admin | Update event |
| DELETE | `/api/events/:id` | Admin | Delete event |

Filters:

```txt
/api/events?category=music
/api/events?date=2026-05-04
/api/events?category=music&date=2026-05-04
```

### Bookings

| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/api/bookings` | Authenticated | Get logged-in user's bookings |
| GET | `/api/bookings/:id` | Authenticated | Get own booking by ID |
| POST | `/api/bookings` | Authenticated | Book tickets |
| GET | `/api/bookings/validate/:qr` | Admin | Validate a booking QR code |

Booking creation returns the booking, a `qrImage` data URL, `emailSent`, and `emailQueued`. Email is sent after the booking response so slow SMTP does not block ticket creation.

### Admin

| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/api/admin/dashboard` | Admin | Get admin dashboard summary, recent activity, and low-seat events |
| GET | `/api/admin/dashboard/events` | Admin | Get all events with bookings and users who booked each event |
| GET | `/api/admin/analytics` | Admin | Get booking, seat, revenue, and category analytics |
| GET | `/api/admin/email-status` | Admin | Verify deployed SMTP configuration without exposing secrets |

## Optional Email Confirmation

Booking creation sends a confirmation email through Nodemailer when SMTP is configured. If SMTP is not configured, booking still succeeds and the API returns `emailSent: false`.

Required deployment variables for email:

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_16_character_google_app_password_without_spaces
SMTP_SECURE=false
EMAIL_FROM=your_email@gmail.com
```

`EMAIL_FROM` can be omitted when it is the same as `SMTP_USER`. Use `SMTP_SECURE=true` for port `465`; for port `587`, keep `SMTP_SECURE=false`.

## Auth Header

```txt
Authorization: Bearer <your_token_here>
```

## Example Bodies

Register:

```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "role": "user"
}
```

Public registration always creates a regular user. Create admin accounts by updating trusted users directly in the database or through a separate protected admin workflow.

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

Create booking:

```json
{
  "event": "event_id_here",
  "quantity": 2
}
```
