/*
  Warnings:

  - The values [RECEIPT] on the enum `FileKind` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `registrationStatus` on the `Registration` table. All the data in the column will be lost.
  - You are about to drop the column `firstMonthFee` on the `Settings` table. All the data in the column will be lost.
  - You are about to drop the column `registrationFee` on the `Settings` table. All the data in the column will be lost.
  - You are about to drop the `Payment` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "PackageType" AS ENUM ('REGULAR', 'SPECIAL', 'HOME_TO_HOME', 'KRAR');

-- AlterEnum
BEGIN;
CREATE TYPE "FileKind_new" AS ENUM ('DOCUMENT', 'LOGO', 'HERO_IMAGE', 'ABOUT_IMAGE', 'GALLERY_IMAGE');
ALTER TABLE "UploadedFile" ALTER COLUMN "kind" DROP DEFAULT;
ALTER TABLE "UploadedFile" ALTER COLUMN "kind" TYPE "FileKind_new" USING ("kind"::text::"FileKind_new");
ALTER TYPE "FileKind" RENAME TO "FileKind_old";
ALTER TYPE "FileKind_new" RENAME TO "FileKind";
DROP TYPE "FileKind_old";
ALTER TABLE "UploadedFile" ALTER COLUMN "kind" SET DEFAULT 'DOCUMENT';
COMMIT;

-- DropForeignKey
ALTER TABLE "Payment" DROP CONSTRAINT "Payment_receiptFileId_fkey";

-- DropForeignKey
ALTER TABLE "Payment" DROP CONSTRAINT "Payment_registrationId_fkey";

-- DropForeignKey
ALTER TABLE "Payment" DROP CONSTRAINT "Payment_verifiedById_fkey";

-- DropForeignKey
ALTER TABLE "Registration" DROP CONSTRAINT "Registration_scheduleId_fkey";

-- DropIndex
DROP INDEX "Registration_registrationStatus_idx";

-- AlterTable
ALTER TABLE "Registration" DROP COLUMN "registrationStatus",
ADD COLUMN     "agreedToRegulations" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "packageType" "PackageType" NOT NULL DEFAULT 'REGULAR',
ADD COLUMN     "preferredTime" TEXT,
ALTER COLUMN "scheduleId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Settings" DROP COLUMN "firstMonthFee",
DROP COLUMN "registrationFee",
ADD COLUMN     "contactPersonName" TEXT NOT NULL DEFAULT 'መምህር ዲያቆን አሸናፊ',
ADD COLUMN     "contactPersonPhone" TEXT NOT NULL DEFAULT '0993184466',
ADD COLUMN     "location" TEXT NOT NULL DEFAULT 'ጉብሬ ቤተ-ማርያም አጠገብ';

-- AlterTable
ALTER TABLE "UploadedFile" ALTER COLUMN "kind" SET DEFAULT 'DOCUMENT';

-- DropTable
DROP TABLE "Payment";

-- DropEnum
DROP TYPE "PaymentStatus";

-- DropEnum
DROP TYPE "RegistrationStatus";

-- AddForeignKey
ALTER TABLE "Registration" ADD CONSTRAINT "Registration_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "Schedule"("id") ON DELETE SET NULL ON UPDATE CASCADE;
