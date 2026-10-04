CREATE TYPE "ConfessorParish" AS ENUM (
  'GUBRE_TRINITY',
  'SAINT_STEPHANOS',
  'EWAN_MIKAEL',
  'NONE'
);

ALTER TABLE "Registration"
ADD COLUMN "christianName" TEXT,
ADD COLUMN "confessorParish" "ConfessorParish",
ADD COLUMN "confessorName" TEXT;