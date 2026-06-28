/*
  Warnings:

  - You are about to drop the column `invoiceCount` on the `Group` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `Group` table. All the data in the column will be lost.
  - Added the required column `groupName` to the `Group` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Group" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "groupName" TEXT NOT NULL,
    "tripType" TEXT NOT NULL DEFAULT '去程',
    "departDate" TEXT NOT NULL,
    "trainNo" TEXT NOT NULL,
    "route" TEXT NOT NULL,
    "adultPrice" REAL NOT NULL,
    "childPrice" REAL NOT NULL,
    "verifyCount" INTEGER NOT NULL DEFAULT 0
);
INSERT INTO "new_Group" ("adultPrice", "childPrice", "departDate", "id", "route", "trainNo", "verifyCount") SELECT "adultPrice", "childPrice", "departDate", "id", "route", "trainNo", "verifyCount" FROM "Group";
DROP TABLE "Group";
ALTER TABLE "new_Group" RENAME TO "Group";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
