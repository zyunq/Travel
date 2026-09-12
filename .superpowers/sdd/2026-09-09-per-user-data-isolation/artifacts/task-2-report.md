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
- Migration now inserts a deterministic bcrypt-hashed `admin` account when absent; operators should change the default password after deployment.
- CLI prompts on stdin by default; optional positional password remains for compatibility but may be visible in shell history/process listings.

## Review follow-up

- Reworked `migrateOwnership` to enumerate rows and update by primary key, avoiding invalid Prisma `where: { field: null }` filters against required schema fields; fee rows are similarly inspected in memory.
- Migration SQL now deterministically inserts a bcrypt-hashed admin account when absent before enforcing ownership foreign keys, preventing null-owner/uniqueness failures.
- CLI prompts for a password on stdin when omitted (`node scripts/create-user.js <username> <name>`), while retaining the exported API and optional positional compatibility.
- Re-ran ownership tests: 4/4 pass.
