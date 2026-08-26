import type {
  Reservation,
  ReservationStatus,
} from '../../generated/prisma/client';

export class ReservationResponseDto {
  id: string;
  plate: string;
  sectorId: string;
  expectedArrivalAt: string;
  status: ReservationStatus;
  createdAt: string;

  static fromEntity(reservation: Reservation): ReservationResponseDto {
    return {
      id: reservation.id,
      plate: reservation.plate,
      sectorId: reservation.sectorId,
      expectedArrivalAt: reservation.expectedArrivalAt.toISOString(),
      status: reservation.status,
      createdAt: reservation.createdAt.toISOString(),
    };
  }
}
