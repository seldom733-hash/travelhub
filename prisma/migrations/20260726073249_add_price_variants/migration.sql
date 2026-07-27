-- CreateTable
CREATE TABLE "service_price_variants" (
    "id" TEXT NOT NULL,
    "dateFrom" TIMESTAMP(3) NOT NULL,
    "dateTo" TIMESTAMP(3) NOT NULL,
    "roomType" TEXT,
    "mealPlan" TEXT,
    "hasChildren" BOOLEAN NOT NULL DEFAULT false,
    "guests" INTEGER NOT NULL DEFAULT 1,
    "pricePerPerson" DECIMAL(65,30) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'AZN',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "serviceId" TEXT NOT NULL,

    CONSTRAINT "service_price_variants_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "service_price_variants_serviceId_idx" ON "service_price_variants"("serviceId");

-- CreateIndex
CREATE INDEX "service_price_variants_serviceId_dateFrom_dateTo_idx" ON "service_price_variants"("serviceId", "dateFrom", "dateTo");

-- AddForeignKey
ALTER TABLE "service_price_variants" ADD CONSTRAINT "service_price_variants_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "services"("id") ON DELETE CASCADE ON UPDATE CASCADE;
