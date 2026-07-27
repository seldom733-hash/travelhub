-- CreateEnum
CREATE TYPE "TourCategory" AS ENUM ('ONE_DAY', 'MULTI_DAY');

-- AlterTable
ALTER TABLE "services" ADD COLUMN     "tourCategory" "TourCategory";

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "companyName" TEXT;
