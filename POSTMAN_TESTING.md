# Testing the API with Postman

This guide shows how to test the Event Ticketing System REST API using Postman.

## 1. Start the Server

Install dependencies if you have not already:

```bash
npm install
```

Make sure your `.env` file has these values:

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
NODE_ENV=development
```

Start the API:

```bash
npm start
```

The base URL should be:

```txt
http://localhost:5000
```

## 2. Create a Postman Environment

In Postman, create an environment with these variables:

| Variable | Initial Value |
|---|---|
| `baseUrl` | `http://localhost:5000` |
| `userToken` | leave blank |
| `adminToken` | leave blank |
| `eventId` | leave blank |
| `bookingId` | leave blank |
| `qrCode` | leave blank |

Use `{{baseUrl}}` in request URLs so you do not have to type the full localhost URL each time.

## 3. Register a Regular User

Request:

```txt
POST {{baseUrl}}/api/auth/register
```

Headers:

```txt
Content-Type: application/json
```

Body:

```json
{
  "name": "Student User",
  "email": "student@example.com",
  "password": "password123"
}
```

Expected result:

```txt
Status: 201 Created
```

The response should include a `token`. Copy that token into the Postman environment variable named `userToken`.

## 4. Register an Admin User

Request:

```txt
POST {{baseUrl}}/api/auth/register
```

Headers:

```txt
Content-Type: application/json
```

Body:

```json
{
  "name": "Admin User",
  "email": "admin@example.com",
  "password": "password123",
  "role": "admin"
}
```

Expected result:

```txt
Status: 201 Created
```

Copy the response `token` into the Postman environment variable named `adminToken`.

## 5. Login if You Already Registered

Regular user login:

```txt
POST {{baseUrl}}/api/auth/login
```

Body:

```json
{
  "email": "student@example.com",
  "password": "password123"
}
```

Admin login:

```txt
POST {{baseUrl}}/api/auth/login
```

Body:

```json
{
  "email": "admin@example.com",
  "password": "password123"
}
```

Copy the returned token into either `userToken` or `adminToken`.

## 6. Create an Event as Admin

Request:

```txt
POST {{baseUrl}}/api/events
```

Headers:

```txt
Content-Type: application/json
Authorization: Bearer {{adminToken}}
```

Body:

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

Expected result:

```txt
Status: 201 Created
```

Copy the event `_id` from the response into the Postman environment variable named `eventId`.

## 7. View Events

Get all events:

```txt
GET {{baseUrl}}/api/events
```

Get one event:

```txt
GET {{baseUrl}}/api/events/{{eventId}}
```

Filter by category:

```txt
GET {{baseUrl}}/api/events?category=Technology
```

Filter by date:

```txt
GET {{baseUrl}}/api/events?date=2026-05-04
```

Expected result:

```txt
Status: 200 OK
```

## 8. Create a Booking as a User

Request:

```txt
POST {{baseUrl}}/api/bookings
```

Headers:

```txt
Content-Type: application/json
Authorization: Bearer {{userToken}}
```

Body:

```json
{
  "event": "{{eventId}}",
  "quantity": 2
}
```

Expected result:

```txt
Status: 201 Created
```

The response includes:

- `booking`
- `qrImage`
- `emailSent`

Copy `booking._id` into the Postman environment variable named `bookingId`.
Copy `booking.qrCode` into the Postman environment variable named `qrCode`.

## 9. View User Bookings

Get all bookings for the logged-in user:

```txt
GET {{baseUrl}}/api/bookings
```

Headers:

```txt
Authorization: Bearer {{userToken}}
```

Get one booking:

```txt
GET {{baseUrl}}/api/bookings/{{bookingId}}
```

Headers:

```txt
Authorization: Bearer {{userToken}}
```

Expected result:

```txt
Status: 200 OK
```

## 10. Validate a Booking QR Code

Request:

```txt
GET {{baseUrl}}/api/bookings/validate/{{qrCode}}
```

Expected result:

```txt
Status: 200 OK
```

The response should include:

```json
{
  "valid": true
}
```

## 11. Test the Admin Dashboard JSON

Request:

```txt
GET {{baseUrl}}/api/admin/dashboard
```

Headers:

```txt
Authorization: Bearer {{adminToken}}
```

Expected result:

```txt
Status: 200 OK
```

The response should include:

- `summary`
- `recentEvents`
- `recentBookings`
- `lowAvailabilityEvents`

This endpoint is the admin dashboard data as JSON.

## 12. Test Admin Analytics JSON

Request:

```txt
GET {{baseUrl}}/api/admin/analytics
```

Headers:

```txt
Authorization: Bearer {{adminToken}}
```

Expected result:

```txt
Status: 200 OK
```

The response should include values such as:

- `totalUsers`
- `totalEvents`
- `totalBookings`
- `totalTicketsBooked`
- `totalRevenue`
- `categoryStats`

## 13. Update an Event as Admin

Request:

```txt
PUT {{baseUrl}}/api/events/{{eventId}}
```

Headers:

```txt
Content-Type: application/json
Authorization: Bearer {{adminToken}}
```

Body:

```json
{
  "title": "Updated Tech Conference 2026",
  "price": 30
}
```

Expected result:

```txt
Status: 200 OK
```

## 14. Delete an Event as Admin

Request:

```txt
DELETE {{baseUrl}}/api/events/{{eventId}}
```

Headers:

```txt
Authorization: Bearer {{adminToken}}
```

Expected result:

```txt
Status: 200 OK
```

Response:

```json
{
  "message": "Event deleted"
}
```

## Common Errors to Check

Missing token:

```txt
Status: 401 Unauthorized
```

Using a regular user token on admin routes:

```txt
Status: 403 Forbidden
```

Invalid event ID or booking ID:

```txt
Status: 404 Not Found
```

Not enough seats available:

```txt
Status: 400 Bad Request
```

## Suggested Testing Order

1. Register admin user.
2. Register regular user.
3. Create an event with the admin token.
4. View all events.
5. Book tickets with the regular user token.
6. View user bookings.
7. Validate the QR code.
8. Check admin dashboard.
9. Check admin analytics.
10. Update or delete the event as admin.
