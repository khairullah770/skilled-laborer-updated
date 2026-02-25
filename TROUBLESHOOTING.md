## Booking Details Screen Fails With `Cannot read properties of undefined (reading '_id')`

### Symptoms

- On the customer app, tapping **View details** in the Upcoming bookings section opens the Booking screen but shows a red error message:
  - `{"message":"Cannot read properties of undefined (reading '_id')"}`.
- The **Try again** button does not recover and the same error is displayed repeatedly.
- The issue only occurs for authenticated customers; the endpoint works for admin or may appear to work in limited test flows.

### Root Cause

- The backend handler for `GET /api/bookings/:id` performed authorization checks assuming `req.user` was always defined:
  - It accessed `req.user._id` and `req.user.role` even when requests were authenticated as customers.
- The authentication middleware sets:
  - `req.customer` for JSON Web Tokens issued by the customer login endpoint.
  - `req.user` for all other roles.
- For customer tokens, `req.user` was `undefined`, so the authorization logic threw a runtime error while trying to read `_id` and `role`:
  - `TypeError: Cannot read properties of undefined (reading '_id')`.
- The error was caught in the controller and returned as a JSON payload with HTTP status `400`, which surfaced in the mobile client as the red message shown above.

### Affected Endpoint

- Method: `GET`
- Path: `/api/bookings/:id`
- Controller: `getBookingById` in `backend/controllers/bookingController.js`.

### How It Was Fixed

1. Updated `getBookingById` to handle both customer and laborer principals without assuming `req.user` is present:
   - Extracts identifiers safely:
     - `uid` from `req.user?._id` (laborer or admin).
     - `cid` from `req.customer?._id` (customer).
   - Extracts booking participant identifiers defensively from `booking.customer?._id` and `booking.laborer?._id`.
2. Rewrote authorization checks:
   - `isCustomer` is true when the requesting principal matches `booking.customer`.
   - `isLaborer` is true when the requesting user matches `booking.laborer`.
   - `isAdmin` is true only when `req.user` exists and `req.user.role === 'admin'`.
   - If none of these are true, the handler returns HTTP `403` with `{"message":"Not authorized"}` instead of throwing.
3. Added backend tests to prevent regression:
   - `booking_detail_authorization.test.js` verifies:
     - Owning customer can fetch booking details.
     - Assigned laborer can fetch booking details.
     - Unrelated customer receives HTTP `403`.
4. Updated the mobile client booking details screen to use a shared fetch helper with:
   - Request timeouts.
   - Automatic retries for transient failures.
   - Consistent parsing of error payloads so customers see a clear message rather than a raw stack trace.

### Fixed Code Location

- Backend authorization: `backend/controllers/bookingController.js`, `getBookingById`.
- Client fetch logic: `app/(customer)/booking/details/[id].tsx` uses `apiFetchJson` from `constants/Api.ts`.

### How To Verify The Fix

1. Start the backend with the latest code (`npm run dev` in the `backend` folder) and ensure the old server instance is stopped.
2. Run backend tests:
   - `cd backend`
   - `npm test -- booking_visibility.test.js booking_response.test.js booking_detail_authorization.test.js`
   - All suites should pass.
3. On a device or emulator, log in as a customer and create a booking.
4. Navigate to **Bookings → Upcoming** and tap **View details**:
   - The Booking screen should display full booking information without the `_id` error.
5. Optionally log in as:
   - The assigned laborer: verify the same booking can be fetched via their jobs view.
   - A different customer: verify that attempting to access the booking returns a “Not authorized” error instead of a crash.

### Related Improvements

- Introduced `apiFetchJson` in `constants/Api.ts`:
  - Adds timeouts and retries to client-side network calls.
  - Centralizes logging of request method, URL, status code, and error type.
  - Normalizes JSON error handling so API error responses surface as concise messages to users.

## MongoDB Connection Fails With `querySrv ECONNREFUSED` Or `queryTxt ETIMEOUT`

### Symptoms

- Backend `npm run dev` shows errors similar to:
  - `Error: querySrv ECONNREFUSED _mongodb._tcp.cluster0.wk0ml.mongodb.net`
  - `Error: queryTxt ETIMEOUT cluster0.wk0ml.mongodb.net`
- nodemon prints:
  - `app crashed - waiting for file changes before starting...`
- API requests from the mobile app fail because the server never finishes starting.

### Root Cause

- The MongoDB connection string in `MONGO_URI` uses the Atlas SRV format, for example:
  - `mongodb+srv://user:pass@cluster0.wk0ml.mongodb.net/skilled-labor-app`
- The MongoDB driver must perform DNS SRV/TXT lookups for the Atlas hostname:
  - `_mongodb._tcp.cluster0.wk0ml.mongodb.net`
- When DNS or network access is blocked or misconfigured, these lookups fail with `ECONNREFUSED` or `ETIMEOUT`, causing `mongoose.connect` to throw.
- The previous `connectDB` implementation exited the process on the first error, so nodemon repeatedly restarted the app and printed the crash message.

### Configuration Checks

1. Verify that `backend/.env` defines a valid `MONGO_URI`:
   - Use a full Atlas SRV URI copied from the Atlas UI, or a local Mongo URI such as:
     - `mongodb://127.0.0.1:27017/skilled-labor-app`
2. In MongoDB Atlas network access:
   - Ensure the current IP address is whitelisted, or use `0.0.0.0/0` temporarily for testing.
3. On the development machine, verify DNS resolution:
   - Run `nslookup cluster0.wk0ml.mongodb.net` and confirm it resolves to Atlas addresses.

### Code Changes

- Updated `backend/config/db.js`:
  - Added `connectDB(maxRetries = 5, initialDelayMs = 1000)` with:
    - Retry loop and exponential backoff.
    - Shorter `serverSelectionTimeoutMS` for faster failure detection.
    - Structured logging of `name`, `code`, `message`, and DNS error `reason`.
- Updated `backend/server.js`:
  - Server now calls `connectDB()` inside `if (require.main === module)` and only starts listening after a successful connection.
  - On repeated failure after retries, logs a clear message and exits once, rather than crashing without context.

### How To Verify

1. Ensure `MONGO_URI` is correct and reachable.
2. From the `backend` directory, run:
   - `npm run dev`
3. Observe the logs:
   - Successful path:
     - `MongoDB connecting (attempt 1/6)`
     - `MongoDB Connected: cluster0-shard-00-01.wk0ml.mongodb.net`
     - `Server started on port 5000`
   - Failure path:
     - Multiple `MongoDB connection error` entries with DNS details.
     - Final log `Failed to connect to MongoDB after retries, exiting`.

### Notes

- If you see `EADDRINUSE: address already in use :::5000` after a successful MongoDB connection, another process is already listening on port 5000. Stop the other process or change the `PORT` environment variable for the backend.
