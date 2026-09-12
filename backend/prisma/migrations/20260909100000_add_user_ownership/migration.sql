PRAGMA foreign_keys=OFF;

-- Existing installations already have an admin account; fail rather than
-- assigning ownership to an arbitrary user if it is missing.
ALTER TABLE "User" ADD COLUMN "active" BOOLEAN NOT NULL DEFAULT true;

CREATE TABLE "Group_new" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "groupName" TEXT NOT NULL,
    "category" TEXT DEFAULT '',
    "tripType" TEXT NOT NULL DEFAULT '去程',
    "departDate" TEXT NOT NULL,
    "trainNo" TEXT NOT NULL,
    "route" TEXT NOT NULL,
    "adultPrice" REAL NOT NULL,
    "childPrice" REAL NOT NULL,
    "verifyCount" INTEGER NOT NULL DEFAULT 0,
    "serviceFeeCount" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT NOT NULL DEFAULT '',
    "ownerId" INTEGER NOT NULL,
    CONSTRAINT "Group_new_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "Group_new" ("id", "name", "groupName", "category", "tripType", "departDate", "trainNo", "route", "adultPrice", "childPrice", "verifyCount", "serviceFeeCount", "notes", "ownerId")
SELECT "id", "name", "groupName", "category", "tripType", "departDate", "trainNo", "route", "adultPrice", "childPrice", "verifyCount", "serviceFeeCount", "notes",
       (SELECT "id" FROM "User" WHERE "username" = 'admin' LIMIT 1)
FROM "Group";
DROP TABLE "Group";
ALTER TABLE "Group_new" RENAME TO "Group";

CREATE TABLE "FeeConfig_new" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER NOT NULL,
    "serviceFee" REAL NOT NULL DEFAULT 0,
    "refundServiceFee" REAL NOT NULL DEFAULT 0,
    "foreignIdVerify" REAL NOT NULL DEFAULT 0,
    "electronicInvoice" REAL NOT NULL DEFAULT 0,
    CONSTRAINT "FeeConfig_new_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "FeeConfig_new" ("id", "userId", "serviceFee", "refundServiceFee", "foreignIdVerify", "electronicInvoice")
SELECT "id", (SELECT "id" FROM "User" WHERE "username" = 'admin' LIMIT 1), "serviceFee", "refundServiceFee", "foreignIdVerify", "electronicInvoice"
FROM "FeeConfig";
DROP TABLE "FeeConfig";
ALTER TABLE "FeeConfig_new" RENAME TO "FeeConfig";
CREATE UNIQUE INDEX "FeeConfig_userId_key" ON "FeeConfig" ("userId");

PRAGMA foreign_keys=ON;
