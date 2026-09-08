-- Add a persistent bookkeeping note to each trip.
ALTER TABLE "Group" ADD COLUMN "notes" TEXT NOT NULL DEFAULT '';
