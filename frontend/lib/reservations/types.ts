export type ReservationStatus = "ACTIVE" | "CANCELLED";

export type HistoryEventType =
  | "RESERVATION_CREATED"
  | "RESERVATION_CANCELLED"
  | "WAITLIST_JOINED"
  | "WAITLIST_LEFT"
  | "WAITLIST_PROMOTED";

export type Reservation = {
  id: string;
  plate: string;
  sectorId: string;
  sectorName: string;
  expectedArrivalAt: string;
  status: ReservationStatus;
  createdAt: string;
};

export type HistoryEvent = {
  id: string;
  type: HistoryEventType;
  occurredAt: string;
  reservationId: string;
  description: string;
  originEventId?: string;
};

export type CreateReservationInput = {
  plate: string;
  sectorId: string;
  sectorName: string;
  expectedArrivalAt: string;
  availableSpots: number;
};
