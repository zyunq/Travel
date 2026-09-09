# Per-User Data Isolation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add secure per-account isolation for trips, passengers, notes, and fee configuration while retaining username/password login and the existing single-deployment architecture.

**Architecture:** Add JWT bearer authentication and explicit ownership relations from `Group` and `FeeConfig` to `User`. Every route resolves ownership from `req.user`, never from client input; all accounts have the same permissions and can access only their own data. Existing data is backfilled to `admin`, while new accounts are created only through a server-side CLI command.

**Tech Stack:** Node.js, Express 4, Prisma 5, SQLite, bcryptjs, jsonwebtoken, Vue 3/Vite, Pinia, Uni-app.

**Spec:** `docs/superpowers/specs/2026-09-09-per-user-data-isolation-design.md`

## Global Constraints

- Existing username/password login remains the only login method in this phase; WeChat one-click login is out of scope.
- Every account can access only its own trips, passengers, notes, and fee configuration.
- New fee configurations default `serviceFee`, `refundServiceFee`, `foreignIdVerify`, and `electronicInvoice` to `0`.
- Existing trips and the existing fee configuration are assigned to the current `admin` account.
- Missing, invalid, expired, or inactive tokens return `401`; cross-account resource access returns `404`.
- `/api/health` and `POST /api/auth/login` stay public; all other application routes require authentication.
- Client-provided owner IDs, user IDs, and config IDs are ignored for authorization.
- Password changes use the authenticated user and must not accept an arbitrary target user ID.
- Deployment requires a database backup and a production `JWT_SECRET`; users log in again after rollout.

### Task 1: Add Authentication Primitives

**Files:**
- Create: `backend/middleware/auth.js`
- Create: `backend/utils/auth.js`
- Modify: `backend/package.json`
- Test: `backend/middleware/auth.test.js`, `backend/utils/auth.test.js`

**Interfaces:**
- `signToken(user) -> string`
- `verifyToken(token) -> payload`
- `requireAuth(req, res, next)` attaches `{ id, username, name, role, active }` as `req.user`.

- [ ] **Step 1: Write failing tests** for token round-trip, malformed/expired token rejection, missing bearer header, inactive user rejection, and accepted active user.
- [ ] **Step 2: Run `node --test middleware/auth.test.js utils/auth.test.js` and verify failures are due to missing helpers/middleware.**
- [ ] **Step 3: Add `jsonwebtoken`, `bcryptjs`, and `JWT_SECRET` validation. Implement `signToken`, `verifyToken`, and `requireAuth` with `401` JSON responses.
- [ ] **Step 4: Re-run the focused tests and then `node --test middleware/auth.test.js utils/auth.test.js`.**
- [ ] **Step 5: Commit `feat: add bearer authentication primitives`.**

### Task 2: Migrate User, Group, and Fee Configuration Ownership

**Files:**
- Modify: `backend/prisma/schema.prisma`
- Create: `backend/prisma/migrations/20260909100000_add_user_ownership/migration.sql`
- Create: `backend/scripts/migrate-user-ownership.js`
- Create: `backend/scripts/create-user.js`
- Modify: `backend/package.json`
- Test: `backend/scripts/migrate-user-ownership.test.js`

**Interfaces:**
- `migrateOwnership({ prisma }) -> { adminId, groupsUpdated, configUpdated }`
- `createUser({ prisma, username, password, name }) -> sanitizedUser`

- [ ] **Step 1: Write a migration test** using a temporary SQLite database that creates an admin, legacy groups, and the singleton fee row, then asserts all rows receive `ownerId/userId` and existing fee values remain unchanged.
- [ ] **Step 2: Run the test and verify it fails because the ownership fields and migration helper do not exist.**
- [ ] **Step 3: Add `User.active`, required `Group.ownerId`, unique `FeeConfig.userId`, relations, and zero defaults for new fee rows. Add a Prisma migration that safely backfills existing rows to `admin` before enforcing non-null/unique constraints.
- [ ] **Step 4: Implement an idempotent migration script that resolves/creates `admin`, updates only missing ownership values, preserves the current admin config, and can be rerun without changing data.
- [ ] **Step 5: Implement `create-user.js` as a server-only CLI accepting `username`, `name`, and an interactive password or a single documented command-line form; create the user and zeroed fee config in one transaction, rejecting duplicate usernames.
- [ ] **Step 6: Run `npx prisma generate`, the focused migration tests, and a second migration run to verify idempotence.
- [ ] **Step 7: Commit `feat: add per-user ownership schema and migration`.**

### Task 3: Make Login Token-Based and Secure Password Storage

**Files:**
- Modify: `backend/routes/auth.js`
- Modify: `backend/app.js`
- Test: `backend/routes/auth.test.js`

**Interfaces:**
- `POST /api/auth/login -> { token, user }`
- `GET /api/auth/me -> user`
- `PUT /api/auth/password` uses `req.user.id` and `{ oldPassword, newPassword }`.

- [ ] **Step 1: Add failing route tests** for token-bearing login, legacy MD5 login upgrade to bcrypt, invalid credentials, `/me` with and without a token, inactive users, and password changes that cannot target another user.
- [ ] **Step 2: Run `node --test routes/auth.test.js` and verify the new contract fails.**
- [ ] **Step 3: Update login to compare bcrypt hashes and perform one-time MD5 compatibility upgrade, return `{ token, user }`, and never expose passwords.
- [ ] **Step 4: Register `requireAuth` on `/api/auth/me` and `/api/auth/password`; disable public `/register` or move it behind the server CLI only.
- [ ] **Step 5: Add centralized auth error handling and ensure health/login remain public.**
- [ ] **Step 6: Run route tests and all backend tests currently present.**
- [ ] **Step 7: Commit `feat: issue tokens from password login`.**

### Task 4: Enforce Group and Fee Configuration Isolation

**Files:**
- Modify: `backend/routes/groups.js`
- Modify: `backend/routes/config.js`
- Modify: `backend/app.js`
- Test: `backend/routes/groups-ownership.test.js`, `backend/routes/config-ownership.test.js`

**Interfaces:**
- Group list/create/import/detail/update/copy/export/delete handlers use `req.user.id`.
- `GET /api/config` and `PUT /api/config` operate on the authenticated user’s unique config row.

- [ ] **Step 1: Write failing ownership tests** with two users and same-named trips, asserting each list contains only its owner’s rows, ID access to another owner returns `404`, and new/imported groups ignore client `ownerId`.
- [ ] **Step 2: Add failing config tests** asserting independent values, zero defaults for a new user, and ignored client config/user IDs.
- [ ] **Step 3: Run both focused test files and verify failures show current global/singleton behavior.**
- [ ] **Step 4: Add `requireAuth` to group/config routers and scope every Prisma query by `ownerId` or `userId`.
- [ ] **Step 5: Change all group fee calculations to load the owner’s `FeeConfig`; preserve existing summaries and note behavior.
- [ ] **Step 6: Verify same-name trips remain separate and run all group/config tests.**
- [ ] **Step 7: Commit `feat: isolate trips and fee config by user`.**

### Task 5: Enforce Member and OCR Ownership

**Files:**
- Modify: `backend/routes/members.js`
- Modify: `backend/routes/ocr.js`
- Modify: `backend/app.js`
- Test: `backend/routes/members-ownership.test.js`, `backend/routes/ocr-auth.test.js`

**Interfaces:**
- Member handlers authorize through the parent group’s `ownerId`.
- OCR endpoints require a valid token and preserve existing upload/recognition response shapes.

- [ ] **Step 1: Write failing tests** for cross-user member list/create/update/refund/delete attempts and unauthenticated OCR requests.
- [ ] **Step 2: Run focused tests and verify current handlers allow access or lack authentication.**
- [ ] **Step 3: Add a shared parent-group ownership lookup and use it in every member handler before reading or mutating a member.
- [ ] **Step 4: Require auth on OCR routes and preserve public health/login behavior.
- [ ] **Step 5: Run member, OCR, group, config, and auth tests together.**
- [ ] **Step 6: Commit `feat: enforce member and OCR ownership`.**

### Task 6: Add Web Token Persistence and Request Authorization

**Files:**
- Modify: `frontend/src/views/Login.vue`
- Modify: `frontend/src/api/index.js`
- Modify: `frontend/src/router/index.js`
- Modify: `frontend/src/views/Config.vue`
- Test: `frontend/src` test setup or a focused API utility test file matching the existing frontend test tooling.

**Interfaces:**
- Login stores `localStorage.user` and `localStorage.token`.
- Axios request interceptor sends `Authorization: Bearer <token>`.
- `401` response clears both values and routes to `/login`.

- [ ] **Step 1: Write failing client tests** for token persistence, request header injection, token-based route guards, and clearing state on `401`.
- [ ] **Step 2: Run the focused frontend tests and verify the current user-only behavior fails.**
- [ ] **Step 3: Update login response handling, Axios interceptors, router guards, and password-change payload to use the authenticated session.
- [ ] **Step 4: Ensure all existing API modules use the configured Axios instance and do not overwrite authorization headers.
- [ ] **Step 5: Run frontend tests and `npm run build` from `frontend`.**
- [ ] **Step 6: Commit `feat: persist web auth tokens`.**

### Task 7: Centralize Mini-Program Authenticated Requests

**Files:**
- Modify: `uniapp/src/stores/user.js`
- Modify: `uniapp/src/utils/api.js`
- Modify: `uniapp/src/pages/login/login.vue`
- Modify: pages currently calling `uni.request` directly, including `uniapp/src/pages/group/detail.vue`.
- Test: `uniapp/tests/user-auth.test.mjs`, `uniapp/tests/api-auth.test.mjs`

**Interfaces:**
- Store login saves `result.token` and `result.user`.
- Shared request helper adds bearer headers and clears session on `401`.

- [ ] **Step 1: Write failing tests** for token persistence, authorization header injection, and clearing local session on `401`.
- [ ] **Step 2: Run `node --test tests/user-auth.test.mjs tests/api-auth.test.mjs` and verify failures.**
- [ ] **Step 3: Update Pinia login handling and the shared request wrapper to persist/send tokens and redirect on unauthorized responses.
- [ ] **Step 4: Replace direct business `uni.request` calls with the shared helper, preserving upload/download behavior and existing response handling.
- [ ] **Step 5: Run all mini-program tests and `npm run build:mp-weixin`.**
- [ ] **Step 6: Commit `feat: authenticate mini-program requests`.**

### Task 8: Deployment Runbook and End-to-End Verification

**Files:**
- Modify: `deploy/QUICKSTART.md`
- Modify: `deploy/DEPLOYMENT.md`
- Modify: `deploy/pm2/ecosystem.config.js` only if environment loading needs an explicit production `.env` path.
- Create: `backend/scripts/verify-user-isolation.js`
- Test: `backend/scripts/verify-user-isolation.test.js`

**Interfaces:**
- Verification script checks two users cannot read one another’s groups/config and that same-name trips remain distinct.
- Deployment instructions include backup, migration, `JWT_SECRET`, user creation, PM2 restart, and rollback.

- [ ] **Step 1: Write a failing verification test** for two-account isolation and migration idempotence.
- [ ] **Step 2: Implement the verification script against a temporary database and run it until green.**
- [ ] **Step 3: Update deployment docs with exact commands: database backup, `npx prisma migrate deploy`, ownership migration, `.env` setup, `node scripts/create-user.js`, PM2 restart, health/login checks, and rollback from backup.
- [ ] **Step 4: Run the complete backend test suite, mini-program tests/build, and frontend build.**
- [ ] **Step 5: Perform a local production-like smoke test: login as two users, create identical-name trips, change each fee config, and confirm isolated summaries.
- [ ] **Step 6: Commit `docs: document per-user deployment and verification`.**

## Final Release Checklist

- [ ] Production SQLite database backed up before migration.
- [ ] `JWT_SECRET` is set outside Git and PM2 receives it after restart.
- [ ] Existing admin trips/config are preserved after migration.
- [ ] New accounts have four fee values set to `0`.
- [ ] Two accounts with identical trip names see only their own data.
- [ ] `401` and cross-account `404` behavior is verified.
- [ ] Web build and mini-program build succeed.
- [ ] Existing sessions are intentionally invalidated and users are instructed to log in again.
