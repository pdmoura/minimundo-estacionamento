CREATE UNIQUE INDEX "Reservation_active_plate_key"
ON "Reservation" (UPPER(TRIM("plate")))
WHERE "status" = 'ACTIVE';
