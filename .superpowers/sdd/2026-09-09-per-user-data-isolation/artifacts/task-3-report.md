# Task 3 Report: Token-based login and secure password storage

## Implemented

- Reworked `backend/routes/auth.js` around an injectable `createAuthRouter({ prisma })` factory while retaining the default router export used by the app.
- `POST /api/auth/login` now accepts bcrypt hashes and legacy 32-character MD5 hashes. A successful MD5 login immediately replaces the stored hash with bcrypt (one-time compatibility upgrade).
- Login rejects missing credentials, invalid credentials, and inactive users with `401`, and returns `{ token, user }` on success. User payloads contain only `id`, `username`, `name`, `role`, and `active`.
- `GET /api/auth/me` and `PUT /api/auth/password` are protected by `requireAuth`. Password changes resolve the target exclusively from `req.user.id`; a client-supplied `userId` is ignored. New passwords are always bcrypt hashes.
- Public registration was removed from the auth router; account creation remains server-side through the CLI from Task 2.
- `backend/app.js` shares the auth Prisma client through `app.locals.prisma`, exports the app for tests, and only starts the listener when run directly. Health and login remain public.
- Carried forward the review finding in `backend/middleware/auth.js`: when `app.locals.prisma` is available, bearer authentication reloads the current user and rejects deleted/deactivated accounts instead of trusting stale JWT claims. The original synchronous fallback remains for direct middleware callers.

## Tests

Added `backend/routes/auth.test.js` covering:

- bcrypt login response and password omission;
- MD5 compatibility login and bcrypt upgrade;
- invalid credentials and inactive users;
- `/me` authentication and sanitized response;
- password changes scoped to the authenticated user despite a supplied `userId`.

Verification command:

```text
node --test
```

Result: 23 tests passed, 0 failed.

