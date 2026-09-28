# WebForge AI — Campus Resource Booking API

Team Name - Midnight Sons
Backend MVP for **P04 — Campus Resource Booking**.

The API supports authenticated users, admin resource management, booking requests, booking approval/rejection, booking history, cancellation, resource availability, and overlapping-booking detection.

## Tech Stack

- Node.js
- Express
- MongoDB
- Mongoose
- JWT
- bcryptjs
- cookie-parser

## Roles

- `USER` — view resources, create booking requests, view own bookings, cancel eligible own bookings.
- `ADMIN` — manage resources, view all bookings, approve/reject bookings, manage resource availability, view users and dashboard.

## Setup

```bash
npm install
```

Create `.env` from `.env.example` and set your MongoDB URI and JWT secret.

Start the API:

```bash
npm start
```

The server runs on `http://localhost:4000` by default.

## Seed Demo Data

```bash
npm run seed
```

Demo credentials:

- Admin: `admin@webforge.com` / `Password@123`
- User: `student@webforge.com` / `Password@123`

The seed creates three resources: AI Lab, Seminar Hall A, and Sports Ground.

## API Endpoints

### Authentication

| Method | Endpoint | Access | Purpose |
|---|---|---|---|
| POST | `/api/user` | Public | Register USER |
| POST | `/api/auth/login` | Public | Login and set JWT cookie |
| GET | `/api/auth/me` | Authenticated | Current user |
| POST | `/api/auth/logout` | Authenticated | Clear JWT cookie |

### Resources

| Method | Endpoint | Access | Purpose |
|---|---|---|---|
| GET | `/api/resources` | USER/ADMIN | List resources |
| GET | `/api/resources/:name` | USER/ADMIN | Get resource by name |
| GET | `/api/resources/type/:type` | USER/ADMIN | Filter resources by type |
| POST | `/api/admin/resources` | ADMIN | Create resource |
| PATCH | `/api/admin/resources/:id` | ADMIN | Update resource/availability |

### Bookings

| Method | Endpoint | Access | Purpose |
|---|---|---|---|
| POST | `/api/bookings/:name` | USER/ADMIN | Submit booking request |
| GET | `/api/bookings` | USER/ADMIN | Current user's booking history |
| GET | `/api/bookings/:id` | Owner/ADMIN | Get one booking |
| PATCH | `/api/bookings/:id/cancel` | Owner/ADMIN | Cancel eligible booking |
| GET | `/api/admin/bookings` | ADMIN | View all bookings |
| PATCH | `/api/admin/bookings/:id/approve` | ADMIN | Approve pending booking |
| PATCH | `/api/admin/bookings/:id/reject` | ADMIN | Reject pending booking |
| GET | `/api/admin/dashboard` | ADMIN | Booking/resource/user summary |

## Booking Rules

1. New bookings start with `Pending` status.
2. A resource must be `AVAILABLE` before a booking can be requested.
3. `Pending` and `Accepted` bookings block overlapping time intervals.
4. `Rejected` and `Cancelled` bookings do not block future bookings.
5. `endTimeDate` must be after `startTimeDate`.
6. A USER can only view or cancel their own bookings.
7. ADMIN can view/manage all bookings.
8. Admin approval re-checks resource availability and accepted-booking conflicts.

## Example Booking Request

```json
{
  "purpose": "AI club project meeting",
  "startTimeDate": "2026-09-28T10:00:00.000Z",
  "endTimeDate": "2026-09-28T12:00:00.000Z"
}
```

Send it to:

```text
POST /api/bookings/AI%20Lab
```

## HTTP Status Codes

- `200` — successful read/update/action
- `201` — resource/booking/user created
- `400` — invalid request or validation failure
- `401` — missing/invalid authentication
- `403` — insufficient role/ownership
- `404` — resource/booking/user not found
- `409` — booking/resource state conflict or duplicate data
- `500` — unexpected server error

## Project Structure

```text
APIs/
  admin.router.js
  user.router.js
Middleware/
  allowed-roles.middleware.js
  verify-token.middleware.js
Models/
  bookings.models.js
  resource.models.js
  user.models.js
server.js
seed.js
README.md
```
