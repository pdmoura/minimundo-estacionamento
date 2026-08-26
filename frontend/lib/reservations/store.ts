import type {
  CreateReservationInput,
  HistoryEvent,
  JoinWaitlistInput,
  Reservation,
  WaitlistEntry,
} from "./types";

const remainingBySector = new Map<string, number>();
const reservations: Reservation[] = [];
const historyEvents: HistoryEvent[] = [];
const waitlistEntries: WaitlistEntry[] = [];

function hoursAgo(hours: number) {
  return new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
}

function hoursFromNow(hours: number) {
  return new Date(Date.now() + hours * 60 * 60 * 1000).toISOString();
}

function addEvent(
  event: Omit<HistoryEvent, "id"> & { id?: string },
): HistoryEvent {
  const created: HistoryEvent = {
    ...event,
    id: event.id ?? crypto.randomUUID(),
  };
  historyEvents.push(created);
  return created;
}

function seed() {
  const setorA = { id: "setor-a", name: "Setor A" };
  const setorB = { id: "setor-b", name: "Setor B" };
  remainingBySector.set(setorA.id, 4);
  remainingBySector.set(setorB.id, 0);

  const soCriacao: Reservation = {
    id: "res-criada",
    plate: "ABC1D23",
    sectorId: setorA.id,
    sectorName: setorA.name,
    expectedArrivalAt: hoursFromNow(2),
    status: "ACTIVE",
    createdAt: hoursAgo(3),
  };

  const cancelada: Reservation = {
    id: "res-cancelada",
    plate: "XYZ9E87",
    sectorId: setorA.id,
    sectorName: setorA.name,
    expectedArrivalAt: hoursFromNow(4),
    status: "CANCELLED",
    createdAt: hoursAgo(8),
  };

  const saiuEspera: Reservation = {
    id: "res-espera-saida",
    plate: "QWE4R56",
    sectorId: setorB.id,
    sectorName: setorB.name,
    expectedArrivalAt: hoursFromNow(6),
    status: "CANCELLED",
    createdAt: hoursAgo(6),
  };

  const promovida: Reservation = {
    id: "res-promovida",
    plate: "JKL7M89",
    sectorId: setorA.id,
    sectorName: setorA.name,
    expectedArrivalAt: hoursFromNow(5),
    status: "ACTIVE",
    createdAt: hoursAgo(1),
  };

  reservations.push(soCriacao, cancelada, saiuEspera, promovida);

  addEvent({
    type: "RESERVATION_CREATED",
    occurredAt: soCriacao.createdAt,
    reservationId: soCriacao.id,
    description: "Reserva criada.",
  });

  addEvent({
    type: "RESERVATION_CREATED",
    occurredAt: cancelada.createdAt,
    reservationId: cancelada.id,
    description: "Reserva criada.",
  });

  const cancelamento = addEvent({
    id: "evt-cancelamento-origem",
    type: "RESERVATION_CANCELLED",
    occurredAt: hoursAgo(2),
    reservationId: cancelada.id,
    description: "Reserva cancelada.",
  });

  addEvent({
    type: "WAITLIST_JOINED",
    occurredAt: hoursAgo(6),
    reservationId: saiuEspera.id,
    description: "Entrou na lista de espera.",
  });

  addEvent({
    type: "WAITLIST_LEFT",
    occurredAt: hoursAgo(5),
    reservationId: saiuEspera.id,
    description: "Saiu voluntariamente da lista de espera.",
  });

  addEvent({
    type: "WAITLIST_JOINED",
    occurredAt: hoursAgo(4),
    reservationId: promovida.id,
    description: "Entrou na lista de espera.",
  });

  addEvent({
    type: "WAITLIST_PROMOTED",
    occurredAt: promovida.createdAt,
    reservationId: promovida.id,
    originEventId: cancelamento.id,
    description: `Promovido da lista de espera a partir do cancelamento da placa ${cancelada.plate}.`,
  });

  addEvent({
    type: "RESERVATION_CREATED",
    occurredAt: promovida.createdAt,
    reservationId: promovida.id,
    description: "Reserva criada.",
  });
}

seed();

export function listReservations(): Reservation[] {
  return [...reservations].sort(
    (a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

export function getReservation(id: string): Reservation | undefined {
  return reservations.find((item) => item.id === id);
}

export function listHistory(reservationId: string): HistoryEvent[] {
  return historyEvents
    .filter((event) => event.reservationId === reservationId)
    .sort(
      (a, b) =>
        new Date(a.occurredAt).getTime() - new Date(b.occurredAt).getTime(),
    );
}

export function createReservation(input: CreateReservationInput): Reservation {
  const plate = input.plate.trim().toUpperCase();
  const expectedArrivalAt = new Date(input.expectedArrivalAt);

  if (!plate) {
    throw Object.assign(new Error("Informe a placa."), { field: "plate" });
  }

  if (Number.isNaN(expectedArrivalAt.getTime())) {
    throw Object.assign(new Error("Informe a data/hora prevista."), {
      field: "expectedArrivalAt",
    });
  }

  if (expectedArrivalAt.getTime() < Date.now()) {
    throw Object.assign(
      new Error("A data/hora prevista não pode estar no passado."),
      { field: "expectedArrivalAt" },
    );
  }

  const hasActive = reservations.some(
    (item) => item.plate === plate && item.status === "ACTIVE",
  );
  if (hasActive) {
    throw Object.assign(
      new Error("Esta placa já possui uma reserva ativa."),
      { field: "plate" },
    );
  }

  if (!remainingBySector.has(input.sectorId)) {
    remainingBySector.set(input.sectorId, input.availableSpots);
  }

  const remaining = remainingBySector.get(input.sectorId) ?? 0;
  if (remaining < 1) {
    throw Object.assign(new Error("Não há vagas disponíveis neste setor."), {
      field: "sectorId",
    });
  }

  const now = new Date().toISOString();
  const reservation: Reservation = {
    id: crypto.randomUUID(),
    plate,
    sectorId: input.sectorId,
    sectorName: input.sectorName,
    expectedArrivalAt: expectedArrivalAt.toISOString(),
    status: "ACTIVE",
    createdAt: now,
  };

  reservations.push(reservation);
  remainingBySector.set(input.sectorId, remaining - 1);
  addEvent({
    type: "RESERVATION_CREATED",
    occurredAt: now,
    reservationId: reservation.id,
    description: "Reserva criada.",
  });

  return reservation;
}

export function getAvailableSpots(sectorId: string): number | undefined {
  return remainingBySector.get(sectorId);
}

export function listSectors(): { id: string; name: string; availableSpots: number }[] {
  const known = [
    { id: "setor-a", name: "Setor A" },
    { id: "setor-b", name: "Setor B" },
  ];
  const extras = [...remainingBySector.keys()]
    .filter((id) => !known.some((setor) => setor.id === id))
    .map((id) => ({ id, name: id }));

  return [...known, ...extras].map((setor) => ({
    ...setor,
    availableSpots: remainingBySector.get(setor.id) ?? 0,
  }));
}

export function cancelReservation(id: string): Reservation {
  const reservation = reservations.find((item) => item.id === id);
  if (!reservation) {
    throw Object.assign(new Error("Reserva não encontrada."), { status: 404 });
  }
  if (reservation.status !== "ACTIVE") {
    throw Object.assign(new Error("Só é possível cancelar uma reserva ativa."), {
      field: "status",
    });
  }

  reservation.status = "CANCELLED";
  const now = new Date().toISOString();
  const cancelamento = addEvent({
    type: "RESERVATION_CANCELLED",
    occurredAt: now,
    reservationId: reservation.id,
    description: "Reserva cancelada.",
  });

  const proximo = waitlistEntries
    .filter(
      (entry) => entry.sectorId === reservation.sectorId && entry.status === "WAITING",
    )
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())[0];

  if (proximo) {
    proximo.status = "PROMOTED";
    const promovida: Reservation = {
      id: crypto.randomUUID(),
      plate: proximo.plate,
      sectorId: proximo.sectorId,
      sectorName: proximo.sectorName,
      expectedArrivalAt: proximo.expectedArrivalAt,
      status: "ACTIVE",
      createdAt: now,
    };
    reservations.push(promovida);
    addEvent({
      type: "WAITLIST_PROMOTED",
      occurredAt: now,
      reservationId: promovida.id,
      waitlistEntryId: proximo.id,
      originEventId: cancelamento.id,
      description: `Promovido da lista de espera a partir do cancelamento da placa ${reservation.plate}.`,
    });
  } else {
    remainingBySector.set(
      reservation.sectorId,
      (remainingBySector.get(reservation.sectorId) ?? 0) + 1,
    );
  }

  return reservation;
}

export function listWaitlist(sectorId?: string): WaitlistEntry[] {
  return waitlistEntries
    .filter((entry) => entry.status === "WAITING")
    .filter((entry) => !sectorId || entry.sectorId === sectorId)
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
}

export function joinWaitlist(input: JoinWaitlistInput): WaitlistEntry {
  const plate = input.plate.trim().toUpperCase();
  const expectedArrivalAt = new Date(input.expectedArrivalAt);

  if (!plate) {
    throw Object.assign(new Error("Informe a placa."), { field: "plate" });
  }

  if (Number.isNaN(expectedArrivalAt.getTime())) {
    throw Object.assign(new Error("Informe a data/hora prevista."), {
      field: "expectedArrivalAt",
    });
  }

  if (expectedArrivalAt.getTime() < Date.now()) {
    throw Object.assign(
      new Error("A data/hora prevista não pode estar no passado."),
      { field: "expectedArrivalAt" },
    );
  }

  const hasActiveReservation = reservations.some(
    (item) => item.plate === plate && item.status === "ACTIVE",
  );
  if (hasActiveReservation) {
    throw Object.assign(
      new Error("Esta placa já possui uma reserva ativa."),
      { field: "plate" },
    );
  }

  const hasWaitlistEntry = waitlistEntries.some(
    (entry) =>
      entry.plate === plate &&
      entry.sectorId === input.sectorId &&
      entry.status === "WAITING",
  );
  if (hasWaitlistEntry) {
    throw Object.assign(
      new Error("Esta placa já está na lista de espera deste setor."),
      { field: "plate" },
    );
  }

  const now = new Date().toISOString();
  const entry: WaitlistEntry = {
    id: crypto.randomUUID(),
    plate,
    sectorId: input.sectorId,
    sectorName: input.sectorName,
    expectedArrivalAt: expectedArrivalAt.toISOString(),
    status: "WAITING",
    createdAt: now,
  };

  waitlistEntries.push(entry);
  addEvent({
    type: "WAITLIST_JOINED",
    occurredAt: now,
    waitlistEntryId: entry.id,
    description: "Entrou na lista de espera.",
  });

  return entry;
}

export function leaveWaitlist(id: string): WaitlistEntry {
  const entry = waitlistEntries.find((item) => item.id === id);
  if (!entry) {
    throw Object.assign(new Error("Registro na lista de espera não encontrado."), {
      status: 404,
    });
  }
  if (entry.status !== "WAITING") {
    throw Object.assign(
      new Error("Só é possível sair de um registro que está aguardando."),
      { field: "status" },
    );
  }

  entry.status = "LEFT";
  addEvent({
    type: "WAITLIST_LEFT",
    occurredAt: new Date().toISOString(),
    waitlistEntryId: entry.id,
    description: "Saiu voluntariamente da lista de espera.",
  });

  return entry;
}
