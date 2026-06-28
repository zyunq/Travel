/*
  Warnings:

  - You are about to drop the column `groupName` on the `Group` table. All the data in the column will be lost.
  - You are about to drop the column `tripType` on the `Group` table. All the data in the column will be lost.
  - You are about to drop the column `needInvoice` on the `Member` table. All the data in the column will be lost.
  - Added the required column `name` to the `Group` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Group" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
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
CREATE TABLE "new_Member" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "groupId" INTEGER NOT NULL,
    "idType" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "idNumber" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "trainNo" TEXT NOT NULL,
    "departStation" TEXT NOT NULL,
    "arriveStation" TEXT NOT NULL,
    "seatClass" TEXT NOT NULL,
    "carriage" TEXT NOT NULL,
    "seatNo" TEXT NOT NULL,
    "price" REAL NOT NULL,
    "orderNo" TEXT NOT NULL,
    "ticketType" TEXT NOT NULL DEFAULT '成人',
    "status" TEXT NOT NULL DEFAULT '正常',
    CONSTRAINT "Member_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Member" ("arriveStation", "carriage", "date", "departStation", "groupId", "id", "idNumber", "idType", "name", "orderNo", "price", "seatClass", "seatNo", "status", "ticketType", "trainNo") SELECT "arriveStation", "carriage", "date", "departStation", "groupId", "id", "idNumber", "idType", "name", "orderNo", "price", "seatClass", "seatNo", "status", "ticketType", "trainNo" FROM "Member";
DROP TABLE "Member";
ALTER TABLE "new_Member" RENAME TO "Member";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
