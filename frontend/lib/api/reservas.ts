import type {
  HistoryEvent,
  HistoryEventType,
  Reservation,
} from "@/lib/reservations/types";
import { listarSetores, type Setor } from "@/lib/api/setores";

type ApiEnvelope<T> = { data: T };
type ApiErrorEnvelope = {
  error?: { message?: string; fields?: Record<string, string> };
};

type ReservationApi = {
  id: string;
  plate: string;
  sectorId: string;
  expectedArrivalAt: string;
  status: Reservation["status"];
  createdAt: string;
};

export type ReservaErro = Error & { field?: string };

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

function lancarErroApi(body: ApiErrorEnvelope, mensagemPadrao: string): never {
  const fields = body.error?.fields ?? {};
  const [primeiroCampo] = Object.keys(fields);
  const mensagem = primeiroCampo
    ? fields[primeiroCampo]
    : body.error?.message ?? mensagemPadrao;
  const erro = new Error(mensagem) as ReservaErro;
  if (primeiroCampo) erro.field = primeiroCampo;
  throw erro;
}

function paraReservation(
  reservation: ReservationApi,
  nomesPorSetor: Map<string, string>,
): Reservation {
  return {
    id: reservation.id,
    plate: reservation.plate,
    sectorId: reservation.sectorId,
    sectorName: nomesPorSetor.get(reservation.sectorId) ?? "Setor",
    expectedArrivalAt: reservation.expectedArrivalAt,
    status: reservation.status,
    createdAt: reservation.createdAt,
  };
}

export async function listarReservas(): Promise<Reservation[]> {
  const [respostaReservas, setores] = await Promise.all([
    fetch(`${API_BASE_URL}/api/reservations`),
    listarSetores(),
  ]);

  if (!respostaReservas.ok) {
    throw new Error("Não foi possível carregar as reservas.");
  }

  const nomesPorSetor = new Map(setores.map((setor) => [setor.id, setor.nome]));
  const { data }: ApiEnvelope<ReservationApi[]> = await respostaReservas.json();
  return data.map((reservation) => paraReservation(reservation, nomesPorSetor));
}

export async function criarReserva(input: {
  plate: string;
  sectorId: string;
  expectedArrivalAt: string;
}): Promise<Reservation> {
  const resposta = await fetch(`${API_BASE_URL}/api/reservations`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const body = (await resposta.json()) as
    | ApiEnvelope<ReservationApi>
    | ApiErrorEnvelope;

  if (!resposta.ok || !("data" in body)) {
    lancarErroApi(body as ApiErrorEnvelope, "Não foi possível registrar a reserva.");
  }

  const setores = await listarSetores();
  const nomesPorSetor = new Map(setores.map((setor) => [setor.id, setor.nome]));
  return paraReservation((body as ApiEnvelope<ReservationApi>).data, nomesPorSetor);
}

export async function cancelarReserva(id: string): Promise<Reservation> {
  const resposta = await fetch(`${API_BASE_URL}/api/reservations/${id}/cancel`, {
    method: "POST",
  });
  const body = (await resposta.json()) as
    | ApiEnvelope<ReservationApi>
    | ApiErrorEnvelope;

  if (!resposta.ok || !("data" in body)) {
    lancarErroApi(body as ApiErrorEnvelope, "Não foi possível cancelar a reserva.");
  }

  const setores = await listarSetores();
  const nomesPorSetor = new Map(setores.map((setor) => [setor.id, setor.nome]));
  return paraReservation((body as ApiEnvelope<ReservationApi>).data, nomesPorSetor);
}

export async function listarSetoresReserva(): Promise<Setor[]> {
  return listarSetores();
}

type HistoryEventApi = {
  id: string;
  type: HistoryEventType;
  occurredAt: string;
  description: string;
  originEventId: string | null;
  originDescription: string | null;
};

export async function obterHistorico(id: string): Promise<{
  reservation: Reservation;
  events: HistoryEvent[];
}> {
  const [reservas, resposta] = await Promise.all([
    listarReservas(),
    fetch(`${API_BASE_URL}/api/reservations/${id}/history`),
  ]);

  if (resposta.status === 404) {
    throw new Error("Reserva não encontrada.");
  }
  if (!resposta.ok) {
    throw new Error("Não foi possível carregar o histórico.");
  }

  const reservation = reservas.find((item) => item.id === id);
  if (!reservation) {
    throw new Error("Reserva não encontrada.");
  }

  const { data }: ApiEnvelope<HistoryEventApi[]> = await resposta.json();

  return {
    reservation,
    events: data.map((evento) => ({
      id: evento.id,
      type: evento.type,
      occurredAt: evento.occurredAt,
      description: evento.description,
      ...(evento.originEventId ? { originEventId: evento.originEventId } : {}),
      ...(evento.originDescription
        ? { originDescription: evento.originDescription }
        : {}),
    })),
  };
}
