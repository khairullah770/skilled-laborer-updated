# Incident Report: Laborer Signup Duplicate Key Error

**Date:** 2026-02-10
**Severity:** High (Blocked User Signup)
**Status:** Resolved

## 1. Issue Description
Users attempting to sign up as laborers encountered an error:
`E11000 duplicate key error collection: skilled-labor-app.users index: phone_1 dup key: { phone: "" }`

This error prevented new users from registering if they chose a signup method that left the other unique field (email or phone) empty. Specifically, the second user to sign up without a phone number would fail because the database already contained a user with `phone: ""` (empty string), which the unique index treated as a duplicate value.

## 2. Root Cause Analysis
- **Schema Definition:** The Mongoose `User` schema defined `phone` and `email` fields with `default: ''` and `unique: true`.
- **MongoDB Behavior:** MongoDB's unique index treats empty strings (`""`) as distinct values. It allows only one document to have `phone: ""` and one to have `email: ""`.
- **Conflict:** When a user signed up with Email only, the `phone` field defaulted to `""`. The first user succeeded. The second user also defaulted `phone` to `""`, causing a unique key collision.

## 3. Resolution Steps
### 3.1. Schema Update
Modified `backend/models/User.js` to remove the `default: ''` property from `email` and `phone` fields.
- **Before:** `{ type: String, default: '', unique: true, sparse: true }`
- **After:** `{ type: String, unique: true, sparse: true }`
This ensures that if a field is not provided, it is not stored in the document (or stored as `null` if explicitly set), which the `sparse` index correctly ignores.

### 3.2. Data Migration & Cleanup
Created and executed a script (`backend/fix_indexes.js`) to:
1. Drop the existing problematic indexes (`email_1` and `phone_1`).
2. Update existing user documents to remove fields with empty strings (`$unset: { phone: 1 }` where `phone: ""` and `$unset: { email: 1 }` where `email: ""`).
3. Mongoose automatically recreated the indexes with the correct definitions upon application restart.

### 3.3. Verification
Created an automated test script (`backend/tests/signup_test.js`) that:
1. Connects to the database.
2. Creates multiple users with only Email.
3. Creates multiple users with only Phone.
4. Verifies that no duplicate key errors occur for the missing fields.
The test passed successfully.

## 4. Preventive Measures
- **Schema Design Rule:** For optional unique fields in Mongoose, **never** use `default: ''`. Always use `sparse: true` and ensure the field is `undefined` (not included in the payload) or `null` if not provided.
- **Testing:** Integration tests (`signup_test.js`) are now available to verify auth flows and constraint handling.
- **Validation:** Frontend `laborer-signup.tsx` payload construction was verified to ensure it conditionally sends only the active identifier (Email or Phone), which aligns with the fixed schema.
