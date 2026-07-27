/*
  Warnings:

  - You are about to drop the column `guests` on the `service_price_variants` table. All the data in the column will be lost.
  - You are about to drop the column `hasChildren` on the `service_price_variants` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "PricingRuleType" AS ENUM ('ROOM_TYPE', 'MEAL_PLAN', 'CHILD', 'NIGHTS', 'SEASON', 'GUESTS');

-- CreateEnum
CREATE TYPE "PricingModifier" AS ENUM ('ADD', 'SUBTRACT', 'MULTIPLY', 'FIXED');

-- AlterTable
ALTER TABLE "service_price_variants" DROP COLUMN "guests",
DROP COLUMN "hasChildren",
ADD COLUMN     "availableSlots" INTEGER,
ADD COLUMN     "basePrice" DECIMAL(65,30),
ADD COLUMN     "childAgeFrom" INTEGER,
ADD COLUMN     "childAgeTo" INTEGER,
ADD COLUMN     "childPrice" DECIMAL(65,30),
ADD COLUMN     "guestsAdults" INTEGER NOT NULL DEFAULT 2,
ADD COLUMN     "guestsChildren" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "nights" INTEGER;

-- CreateTable
CREATE TABLE "room_types" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "maxAdults" INTEGER NOT NULL DEFAULT 2,
    "maxChildren" INTEGER NOT NULL DEFAULT 0,
    "basePrice" DECIMAL(65,30) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'AZN',
    "images" TEXT NOT NULL DEFAULT '',
    "amenities" TEXT NOT NULL DEFAULT '',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "serviceId" TEXT NOT NULL,

    CONSTRAINT "room_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pricing_rules" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "PricingRuleType" NOT NULL,
    "paramKey" TEXT NOT NULL,
    "paramValue" TEXT NOT NULL,
    "modifier" "PricingModifier" NOT NULL DEFAULT 'ADD',
    "value" DECIMAL(65,30) NOT NULL,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "serviceId" TEXT NOT NULL,

    CONSTRAINT "pricing_rules_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "room_types_serviceId_idx" ON "room_types"("serviceId");

-- CreateIndex
CREATE UNIQUE INDEX "room_types_serviceId_slug_key" ON "room_types"("serviceId", "slug");

-- CreateIndex
CREATE INDEX "pricing_rules_serviceId_idx" ON "pricing_rules"("serviceId");

-- CreateIndex
CREATE INDEX "pricing_rules_serviceId_type_paramKey_idx" ON "pricing_rules"("serviceId", "type", "paramKey");

-- CreateIndex
CREATE INDEX "service_price_variants_serviceId_roomType_mealPlan_idx" ON "service_price_variants"("serviceId", "roomType", "mealPlan");

-- AddForeignKey
ALTER TABLE "room_types" ADD CONSTRAINT "room_types_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "services"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pricing_rules" ADD CONSTRAINT "pricing_rules_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "services"("id") ON DELETE CASCADE ON UPDATE CASCADE;
