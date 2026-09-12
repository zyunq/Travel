# Task 2 Report: User/Group/Fee Ownership Migration

## TDD evidence
1. Added `backend/scripts/ownership.test.js` first for migration backfill/idempotence, fee preservation, bcrypt user creation, zeroed config, and duplicate rejection.
2. Initial run failed (`Cannot find module './migrate-ownership'`) before implementation.
3. Implemented schema, migration SQL, helpers, CLI, and package scripts.
4. Focused tests: `node --test backend/scripts/ownership.test.js` — 4/4 pass.
5. Regression backend tests (group/auth/utils): 15/15 pass.
6. `npx prisma generate` and `npx prisma validate --schema prisma/schema.prisma` pass.

## Files
- `backend/prisma/schema.prisma`: `User.active`; required `Group.ownerId`; unique `FeeConfig.userId`; zero fee defaults and relations.
- `backend/prisma/migrations/20260909100000_add_user_ownership/migration.sql`: legacy backfill to admin preserving fee values and enforcing constraints/indexes.
- `backend/scripts/migrate-ownership.js` (+ `migrate-user-ownership.js` export): idempotent ownership backfill with admin resolution/creation and update counts.
- `backend/scripts/create-user.js`: bcrypt-hashed transactional user + zeroed FeeConfig creation with duplicate rejection and CLI.
- `backend/scripts/ownership.test.js`; `backend/package.json` scripts.

## Concerns
- SQL assumes an `admin` user exists when copying legacy rows; run admin initialization/ownership helper first if absent.
- CLI positional password may be visible in shell history/process listings; use only in controlled server environments.
