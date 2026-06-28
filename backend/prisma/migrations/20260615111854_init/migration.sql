-- CreateTable
CREATE TABLE "Group" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "departDate" TEXT NOT NULL,
    "returnDate" TEXT NOT NULL,
    "trainNo" TEXT NOT NULL,
    "route" TEXT NOT NULL,
    "adultPrice" REAL NOT NULL,
    "childPrice" REAL NOT NULL,
    "verifyCount" INTEGER NOT NULL DEFAULT 0,
    "invoiceCount" INTEGER NOT NULL DEFAULT 0
);

-- CreateTable
CREATE TABLE "Member" (
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
    "needInvoice" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "Member_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "FeeConfig" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT DEFAULT 1,
    "serviceFee" REAL NOT NULL DEFAULT 10,
    "refundServiceFee" REAL NOT NULL DEFAULT 20,
    "foreignIdVerify" REAL NOT NULL DEFAULT 8,
    "electronicInvoice" REAL NOT NULL DEFAULT 3
);
