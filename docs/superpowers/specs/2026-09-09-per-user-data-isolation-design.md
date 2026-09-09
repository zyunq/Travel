# Per-User Data Isolation Design

## Goal

Allow multiple username/password accounts to use the same deployment while keeping each account's trips, passengers, notes, and fee configuration isolated. All accounts have the same permissions: a user can access only their own data. WeChat one-click login and cross-user administration are explicitly out of scope.

## User Experience

- Existing username/password login remains the only login method in this phase.
- A successful login creates a server-issued bearer token and stores it in the web app or mini-program.
- Every account sees only its own trips and passengers.
- Every account reads and edits only its own fee configuration.
- New accounts are created by an operator on the server with a CLI command; public registration is removed or disabled.
- New accounts receive a fee configuration with all four values set to `0`.
- Existing production trips and the existing fee configuration are assigned to the current `admin` account.
- After deployment, existing sessions are invalid and users must log in again.

## Data Model

### User

Keep the current identity fields and add an `active` flag. Passwords are stored as bcrypt hashes. Existing MD5 hashes are accepted once during migration-compatible login and replaced with bcrypt after a successful login.

### Group

Add required `ownerId` with a relation to `User`. Every group query, create, update, copy, export, and delete operation is scoped to the authenticated owner's ID.

### FeeConfig

Replace the singleton `id=1` ownership model with one row per user:

- `userId` is required and unique.
- Existing fee columns remain unchanged.
- New rows default `serviceFee`, `refundServiceFee`, `foreignIdVerify`, and `electronicInvoice` to `0`.

The migration first adds nullable ownership columns, backfills existing rows to the existing admin user, then enforces required/unique constraints. The existing singleton row is preserved as the admin configuration rather than recreated with new defaults.

## Authentication

Add a shared authentication middleware:

1. Read `Authorization: Bearer <token>`.
2. Verify a JWT signed with `JWT_SECRET`.
3. Load the user and reject missing, invalid, or inactive users with `401`.
4. Attach the authenticated user to `req.user`.

`POST /api/auth/login` returns `{ token, user }`. The user object excludes password fields. `/api/auth/me` validates the token and returns the current user.

The public `/api/auth/register` route is removed or disabled. A server-only `scripts/create-user.js` command creates accounts and ensures each new account gets a zeroed fee configuration.

Required production environment variables:

```env
JWT_SECRET=<long random secret>
```

## API Authorization Rules

All business routes require authentication. `/api/health` and the login endpoint remain public. OCR endpoints are also authenticated because they are part of the application workflow and consume server resources.

### Groups

- List, categories, group names, and by-name queries filter by `ownerId`.
- Create/import sets `ownerId` from `req.user.id`; client-provided ownership is ignored.
- ID-based reads, updates, copies, exports, and deletes first require a matching owner.
- Group deletion continues to cascade to members through the existing relation.

### Members

Member operations resolve the parent group and require that its `ownerId` matches `req.user.id`. A member ID alone is never sufficient authorization.

### Fee configuration

`GET /api/config` and `PUT /api/config` read or upsert the row for `req.user.id`. Client-provided config IDs or user IDs are ignored.

### Password changes

Password changes use the authenticated user from the token. The request must not accept an arbitrary `userId`; this prevents one account from changing another account's password.

Unauthorized access returns `401`; a valid user attempting to access another user's resource is treated as not found (`404`) to avoid leaking resource existence.

## Client Changes

### Web frontend

- Save `token` and `user` after login.
- Axios request interceptor sends the bearer token.
- A `401` response clears both values and redirects to `/login`.
- Router guards require a token, not only a locally stored user object.
- Password change uses the authenticated session and no longer sends an arbitrary user ID.

### Mini-program

- Save the returned token in the Pinia user store.
- Centralize request headers so every API call sends the bearer token, including pages that currently call `uni.request` directly.
- Clear token and user data on `401` and redirect to login.
- Keep the existing username/password form; the existing WeChat button remains deferred and is not wired in this change.

## Migration and Rollout

1. Back up the production SQLite database.
2. Deploy the Prisma migration and run a one-time data migration:
   - resolve the existing `admin` user;
   - set every existing group `ownerId` to that user;
   - set the existing fee configuration `userId` to that user;
   - create missing admin configuration values with the current values, not zeroes.
3. Set `JWT_SECRET` in the production environment.
4. Deploy backend and clients.
5. Restart PM2 and verify health, login, authenticated group listing, and config update.

If migration fails, stop before changing application code and restore the database backup. The migration must be idempotent so it can be safely re-run after a partial deployment.

## Testing

Backend tests cover:

- token creation and rejection of invalid/expired tokens;
- login response shape;
- group list/create/read/update/delete ownership isolation;
- member ownership checks;
- per-user fee configuration and zero defaults;
- migration backfill for existing admin data.

Client tests cover:

- token persistence after login;
- bearer header injection;
- clearing session on `401`;
- separate accounts receiving separate data.

Before release, run backend tests, mini-program utility tests, web build, and mini-program production build.

## Non-Goals

- WeChat one-click login.
- Admin cross-user dashboards or user switching.
- Public self-service registration.
- Sharing one trip or fee configuration between users.
