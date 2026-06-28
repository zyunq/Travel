/*
  Warnings:

  - Added the required column `groupName` to the `Group` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Group" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "groupName" TEXT NOT NULL,
    "tripType" TEXT NOT NULL DEFAULT '去程',
    "departDate" TEXT NOT NULL,
    "trainNo" TEXT NOT NULL,
    "route" TEXT NOT NULL,
    "adultPrice" REAL NOT NULL,
    "childPrice" REAL NOT NULL,
    "verifyCount" INTEGER NOT NULL DEFAULT 0
);
INSERT INTO "new_Group" ("adultPrice", "childPrice", "departDate", "id", "name", "route", "trainNo", "verifyCount") SELECT "adultPrice", "childPrice", "departDate", "id", "name", "route", "trainNo", "verifyCount" FROM "Group";
DROP TABLE "Group";
ALTER TABLE "new_Group" RENAME TO "Group";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
