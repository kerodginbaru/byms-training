CREATE TYPE "OnlineLocation" AS ENUM ('LOCAL', 'INTERNATIONAL');

ALTER TABLE "Registration"
ADD COLUMN "onlineLocation" "OnlineLocation";
