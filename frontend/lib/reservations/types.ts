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
  reservationId?: string;
  waitlistEntryId?: string;
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

export type WaitlistStatus = "WAITING" | "PROMOTED" | "LEFT";

export type WaitlistEntry = {
  id: string;
  plate: string;
  sectorId: string;
  sectorName: string;
  expectedArrivalAt: string;
  status: WaitlistStatus;
  createdAt: string;
};

export type JoinWaitlistInput = {
  plate: string;
  sectorId: string;
  sectorName: string;
  expectedArrivalAt: string;
};
