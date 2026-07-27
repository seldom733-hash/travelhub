-- CreateTable
CREATE TABLE "flight_details" (
    "id" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "flightNumber" TEXT,
    "airline" TEXT,
    "departureCity" TEXT NOT NULL,
    "departureCode" TEXT,
    "departureTime" TEXT NOT NULL,
    "arrivalCity" TEXT NOT NULL,
    "arrivalCode" TEXT,
    "arrivalTime" TEXT NOT NULL,
    "returnFlight" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "flight_details_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tour_hotels" (
    "id" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "hotelName" TEXT NOT NULL,
    "hotelClass" INTEGER,
    "roomType" TEXT NOT NULL DEFAULT 'Standard',
    "mealPlan" TEXT NOT NULL DEFAULT 'BB',
    "description" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tour_hotels_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transfer_details" (
    "id" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "included" BOOLEAN NOT NULL DEFAULT true,
    "type" TEXT NOT NULL DEFAULT 'standard',
    "description" TEXT,
    "fromPlace" TEXT,
    "toPlace" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "transfer_details_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "flight_details_serviceId_idx" ON "flight_details"("serviceId");

-- CreateIndex
CREATE INDEX "tour_hotels_serviceId_idx" ON "tour_hotels"("serviceId");

-- CreateIndex
CREATE INDEX "transfer_details_serviceId_idx" ON "transfer_details"("serviceId");

-- AddForeignKey
ALTER TABLE "flight_details" ADD CONSTRAINT "flight_details_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "services"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tour_hotels" ADD CONSTRAINT "tour_hotels_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "services"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transfer_details" ADD CONSTRAINT "transfer_details_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "services"("id") ON DELETE CASCADE ON UPDATE CASCADE;
