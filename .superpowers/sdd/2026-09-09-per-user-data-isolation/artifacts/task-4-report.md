# Task 4 Report: Group and Fee Configuration Isolation

Implemented per-user authorization for groups and fee configuration routes.

## Changes

- Added `requireAuth` middleware to group and config routers.
- Scoped group listing, categories, names, merge, delete-category, by-name, detail, copy, import, export, update, and delete operations to `req.user.id`.
- Group imports now set `ownerId` from the authenticated token; client owner IDs are ignored.
- Group fee summaries load the authenticated user’s `FeeConfig` via `userId`.
- Config GET/PUT now read and upsert by authenticated `userId`, creating zero-default rows for new users and ignoring client IDs.
- Updated `FeeConfig.id` to autoincrement to support one config row per user.
- Added ownership tests covering filtered lists, cross-owner 404s, and config ID spoofing.

## Verification

```
node --test backend/routes/groups-ownership.test.js backend/routes/config-ownership.test.js backend/routes/groups.test.js
```

All 4 tests passed.
