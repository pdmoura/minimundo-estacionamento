const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

export type StatusReserva = "ACTIVE" | "CANCELLED";

export type Reserva = {
  id: string;
  placa: string;
  setorId: string;
  chegadaPrevista: string;
  status: StatusReserva;
  criadaEm: string;
};

export type EventoHistorico = {
  id: string;
  tipo: string;
  descricao: string;
  ocorridoEm: string;
  originDescription: string | null;
};

type ReservationApi = {
  id: string;
  plate: string;
  sectorId: string;
  expectedArrivalAt: string;
  status: StatusReserva;
  createdAt: string;
};

type HistoryEventApi = {
  id: string;
  type: string;
  description: string;
  occurredAt: string;
  originEventId: string | null;
  originDescription: string | null;
};

export async function listarReservas(): Promise<Reserva[]> {
  const resposta = await fetch(`${API_BASE_URL}/api/reservations`);
  if (!resposta.ok) {
    throw new Error(`Falha ao buscar reservas: ${resposta.status}`);
  }

  const { data }: { data: ReservationApi[] } = await resposta.json();
  return data.map((item) => ({
    id: item.id,
    placa: item.plate,
    setorId: item.sectorId,
    chegadaPrevista: item.expectedArrivalAt,
    status: item.status,
    criadaEm: item.createdAt,
  }));
}

export async function obterHistorico(
  reservaId: string,
): Promise<EventoHistorico[]> {
  const resposta = await fetch(
    `${API_BASE_URL}/api/reservations/${reservaId}/history`,
  );
  if (!resposta.ok) {
    throw new Error(`Falha ao buscar o histórico: ${resposta.status}`);
  }

  const { data }: { data: HistoryEventApi[] } = await resposta.json();
  return data.map((item) => ({
    id: item.id,
    tipo: item.type,
    descricao: item.description,
    ocorridoEm: item.occurredAt,
    originDescription: item.originDescription,
  }));
}
