-- CreateEnum
CREATE TYPE "ReservationStatus" AS ENUM ('ACTIVE', 'CANCELLED');

-- CreateEnum
CREATE TYPE "WaitlistStatus" AS ENUM ('WAITING', 'PROMOTED', 'LEFT');

-- CreateEnum
CREATE TYPE "HistoryEventType" AS ENUM ('RESERVATION_CREATED', 'RESERVATION_CANCELLED', 'WAITLIST_JOINED', 'WAITLIST_LEFT', 'WAITLIST_PROMOTED');

-- CreateTable
CREATE TABLE "Sector" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "reservableQuota" INTEGER NOT NULL,
    "availableSpots" INTEGER NOT NULL,
    "hourlyRate" DECIMAL(10,2) NOT NULL,

    CONSTRAINT "Sector_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Reservation" (
    "id" UUID NOT NULL,
    "plate" TEXT NOT NULL,
    "sectorId" UUID NOT NULL,
    "expectedArrivalAt" TIMESTAMP(3) NOT NULL,
    "status" "ReservationStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Reservation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WaitlistEntry" (
    "id" UUID NOT NULL,
    "plate" TEXT NOT NULL,
    "sectorId" UUID NOT NULL,
    "expectedArrivalAt" TIMESTAMP(3) NOT NULL,
    "status" "WaitlistStatus" NOT NULL DEFAULT 'WAITING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WaitlistEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HistoryEvent" (
    "id" UUID NOT NULL,
    "type" "HistoryEventType" NOT NULL,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reservationId" UUID,
    "waitlistEntryId" UUID,
    "originEventId" UUID,

    CONSTRAINT "HistoryEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Reservation_plate_idx" ON "Reservation"("plate");

-- CreateIndex
CREATE INDEX "Reservation_sectorId_idx" ON "Reservation"("sectorId");

-- CreateIndex
CREATE INDEX "WaitlistEntry_plate_idx" ON "WaitlistEntry"("plate");

-- CreateIndex
CREATE INDEX "WaitlistEntry_sectorId_idx" ON "WaitlistEntry"("sectorId");

-- CreateIndex
CREATE INDEX "WaitlistEntry_sectorId_createdAt_idx" ON "WaitlistEntry"("sectorId", "createdAt");

-- CreateIndex
CREATE INDEX "HistoryEvent_reservationId_idx" ON "HistoryEvent"("reservationId");

-- CreateIndex
CREATE INDEX "HistoryEvent_waitlistEntryId_idx" ON "HistoryEvent"("waitlistEntryId");

-- CreateIndex
CREATE INDEX "HistoryEvent_occurredAt_idx" ON "HistoryEvent"("occurredAt");

-- AddForeignKey
ALTER TABLE "Reservation" ADD CONSTRAINT "Reservation_sectorId_fkey" FOREIGN KEY ("sectorId") REFERENCES "Sector"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WaitlistEntry" ADD CONSTRAINT "WaitlistEntry_sectorId_fkey" FOREIGN KEY ("sectorId") REFERENCES "Sector"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HistoryEvent" ADD CONSTRAINT "HistoryEvent_reservationId_fkey" FOREIGN KEY ("reservationId") REFERENCES "Reservation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HistoryEvent" ADD CONSTRAINT "HistoryEvent_waitlistEntryId_fkey" FOREIGN KEY ("waitlistEntryId") REFERENCES "WaitlistEntry"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HistoryEvent" ADD CONSTRAINT "HistoryEvent_originEventId_fkey" FOREIGN KEY ("originEventId") REFERENCES "HistoryEvent"("id") ON DELETE SET NULL ON UPDATE CASCADE;
