# Event Ticketing System REST API

A Node.js and Express REST API for managing events, ticket bookings, users, authentication, and admin-only event management.

This project uses MongoDB with Mongoose, JWT authentication, role-based authorization, validation, and modular backend structure.

---

## Features

### User Features

- Register a new account
- Log in and receive a JWT token
- View all events
- View one event by ID
- Filter events by category and/or date
- Book tickets for an event
- View only your own bookings
- View one booking only if it belongs to you

### Admin Features

- Create new events
- Update existing events
- Delete events
- Manage event seat capacity
- Protect admin routes using authorization middleware

---

## Tech Stack

- Node.js
- Express.js
- MongoDB
- Mongoose
- JWT / JSON Web Token
- bcrypt or bcryptjs
- dotenv
- Postman or Thunder Client for API testing

---

## Project Structure

```txt
project-folder/
├── config/
│   └── db.js
├── controllers/
│   ├── authController.js
│   ├── eventController.js
│   └── bookingController.js
├── middleware/
│   ├── authMiddleware.js
│   ├── adminMiddleware.js
│   ├── errorMiddleware.js
│   └── notFoundMiddleware.js
├── models/
│   ├── User.js
│   ├── Event.js
│   └── Booking.js
├── routes/
│   ├── authRoutes.js
│   ├── eventRoutes.js
│   └── bookingRoutes.js
├── utils/
│   └── generateToken.js
├── .env.example
├── .gitignore
├── server.js
├── package.json
└── README.md
```

---

## Installation

### 1. Clone the Repository

```bash
git clone <your-github-repository-link>
cd project-folder
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Create Environment File

Create a `.env` file in the root folder.

```bash
touch .env
```

Then add your environment variables.

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
NODE_ENV=development
```

> Do not upload your `.env` file to GitHub.

---

## Environment Variables

| Variable | Description |
|---|---|
| `PORT` | Port number used to run the server locally |
| `MONGO_URI` | MongoDB connection string |
| `JWT_SECRET` | Secret key used to sign JWT tokens |
| `NODE_ENV` | Application environment, such as `development` or `production` |

---

## Run the Project Locally

### Development Mode

```bash
npm run dev
```

### Normal Start

```bash
npm start
```

Server should run at:

```txt
http://localhost:5000/
```

API root URL:

```txt
http://localhost:5000/api/
```

---

## Root URL

### `GET /`

Displays a simple HTML welcome page.

Example response:

```html
<h1>Welcome to the Event Ticketing System API</h1>
```

---

## Authentication

Protected routes require a JWT token.

Send the token in the request header:

```txt
Authorization: Bearer <your_token_here>
```

---

## API Endpoints

### Auth Routes

| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/api/auth/register` | Public | Register a new user |
| POST | `/api/auth/login` | Public | Log in a user and return JWT token |

---

### Event Routes

| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/api/events` | Public | Get all events |
| GET | `/api/events/:id` | Public | Get one event by ID |
| GET | `/api/events?category=music` | Public | Filter events by category |
| GET | `/api/events?date=2026-05-04` | Public | Filter events by date |
| GET | `/api/events?category=music&date=2026-05-04` | Public | Filter events by category and date |
| POST | `/api/events` | Admin only | Create a new event |
| PUT | `/api/events/:id` | Admin only | Update an event |
| DELETE | `/api/events/:id` | Admin only | Delete an event |

---

### Booking Routes

| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/api/bookings` | Authenticated user | Get logged-in user's bookings only |
| GET | `/api/bookings/:id` | Authenticated user | Get one booking only if it belongs to the logged-in user |
| POST | `/api/bookings` | Authenticated user | Book tickets for an event |

---

## Request Body Examples

### Register User

```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123"
}
```

### Login User

```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

### Create Event

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

### Create Booking

```json
{
  "event": "event_id_here",
  "quantity": 2
}
```

---

## Models

### User Model

| Field | Type | Requirement |
|---|---|---|
| `name` | String | Required |
| `email` | String | Required, unique |
| `password` | String | Required, hashed |
| `role` | String | Enum: `user`, `admin`; default: `user` |

### Event Model

| Field | Type | Requirement |
|---|---|---|
| `title` | String | Required |
| `description` | String | Optional |
| `category` | String | Optional |
| `venue` | String | Optional |
| `date` | Date | Required |
| `time` | String | Optional |
| `seatCapacity` | Number | Required, greater than 0 |
| `bookedSeats` | Number | Default: 0, cannot be negative |
| `price` | Number | Required, cannot be negative |

### Booking Model

| Field | Type | Requirement |
|---|---|---|
| `user` | ObjectId | References User |
| `event` | ObjectId | References Event |
| `quantity` | Number | Required, greater than 0 |
| `bookingDate` | Date | Default: Date.now |
| `qrCode` | String | Optional bonus feature |

---

## Validation Rules

The API validates major inputs, including:

- Required fields must be provided
- Email must use a valid format
- Password must be provided
- `seatCapacity` must be greater than 0
- `price` must not be negative
- `quantity` must be greater than 0
- Booking quantity must not exceed available seats
- `bookedSeats` must not be negative
- Event seat capacity cannot be updated below already booked seats

---

## Authorization Rules

- Only authenticated users can create bookings
- Users can only access their own bookings
- Only admins can create events
- Only admins can update events
- Only admins can delete events
- JWT token is required for protected routes

---

## Booking Logic

When a user books tickets:

1. The API checks if the event exists.
2. The API checks available seats.
3. If enough seats are available, the booking is created.
4. The event's `bookedSeats` value is increased by the booking quantity.
5. If the requested quantity is greater than available seats, the booking is rejected.

---

## 404 Handling

For invalid routes, the API returns different responses depending on the request `Accept` header.

### If `Accept: application/json`

```json
{
  "error": "404 Not Found"
}
```

### If `Accept: text/html`

```html
<h1>404 Not Found</h1>
```

---

## Error Handling

This project uses centralized error handling middleware to return meaningful error messages for invalid requests, server errors, authentication errors, authorization errors, and not found routes.

---

## Deployment

This project can be deployed using Render, Netlify, Firebase, Cyclic, Glitch, or a similar hosting service.

### Deployed API Link

```txt
https://your-project-name.onrender.com/
```

### API Base URL

```txt
https://your-project-name.onrender.com/api/
```

Remember to configure environment variables in the deployment dashboard.

---

## Testing

The API should be tested using Postman or Thunder Client.

Recommended tests:

- Register user
- Login user
- Register or create admin user
- Create event as admin
- Try creating event as normal user
- Get all events
- Filter events by category
- Filter events by date
- Book tickets as authenticated user
- Try booking more tickets than available seats
- View own bookings
- Try accessing another user's booking
- Update event as admin
- Delete event as admin
- Test invalid routes with JSON and HTML accept headers

---

## Bonus Features

Optional bonus features may include:

- QR code generation when a booking is created
- QR code validation endpoint: `GET /api/bookings/validate/:qr`
- Email confirmation using Nodemailer
- Admin dashboard or analytics route

---

## Final Submission Checklist

- [ ] All required endpoints are working
- [ ] MongoDB is connected
- [ ] Code uses models, routes, controllers, and middleware
- [ ] Passwords are hashed
- [ ] JWT authentication is implemented
- [ ] Admin-only routes are protected
- [ ] Users can only access their own bookings
- [ ] Validation is implemented
- [ ] Error handling middleware is included
- [ ] 404 middleware is included
- [ ] `.env.example` is included
- [ ] `.env` is not pushed to GitHub
- [ ] App is deployed
- [ ] Deployed API link is added to README
- [ ] API is tested using Postman or Thunder Client
- [ ] Final reflection PDF is submitted

---

## Author

Created for the Course Final Project: Event Ticketing System REST API.
