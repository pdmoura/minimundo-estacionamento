import type { HistoryEvent, Reservation } from "@/lib/reservations/types";
import { listarSetores, type Setor } from "@/lib/api/setores";

type ApiEnvelope<T> = { data: T };
type ApiError = { error?: string; field?: string };
type CreateResponse = ApiEnvelope<Reservation> & { availableSpots?: number };

export type ReservaErro = Error & { field?: string };

async function parseJson<T>(resposta: Response): Promise<T> {
  return (await resposta.json()) as T;
}

export async function listarReservas(): Promise<Reservation[]> {
  const resposta = await fetch("/api/reservations");
  if (!resposta.ok) {
    throw new Error("Não foi possível carregar as reservas.");
  }
  const { data } = await parseJson<ApiEnvelope<Reservation[]>>(resposta);
  return data;
}

export async function obterHistorico(id: string): Promise<{
  reservation: Reservation;
  events: HistoryEvent[];
}> {
  const resposta = await fetch(`/api/reservations/${id}/history`);
  if (resposta.status === 404) {
    throw new Error("Reserva não encontrada.");
  }
  if (!resposta.ok) {
    throw new Error("Não foi possível carregar o histórico.");
  }
  return (await parseJson<ApiEnvelope<{ reservation: Reservation; events: HistoryEvent[] }>>(
    resposta,
  )).data;
}

export async function criarReserva(input: {
  plate: string;
  sectorId: string;
  sectorName: string;
  expectedArrivalAt: string;
  availableSpots: number;
}): Promise<{ reservation: Reservation; availableSpots: number }> {
  const resposta = await fetch("/api/reservations", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const body = await parseJson<CreateResponse | ApiError>(resposta);

  if (!resposta.ok || !("data" in body)) {
    const erro = new Error(
      "error" in body
        ? body.error ?? "Não foi possível registrar a reserva."
        : "Não foi possível registrar a reserva.",
    ) as ReservaErro;
    if ("field" in body) erro.field = body.field;
    throw erro;
  }

  return {
    reservation: body.data,
    availableSpots: body.availableSpots ?? 0,
  };
}

export async function cancelarReserva(id: string): Promise<Reservation> {
  const resposta = await fetch(`/api/reservations/${id}/cancel`, {
    method: "POST",
  });
  const body = await parseJson<ApiEnvelope<Reservation> | ApiError>(resposta);

  if (!resposta.ok || !("data" in body)) {
    throw new Error(
      "error" in body
        ? body.error ?? "Não foi possível cancelar a reserva."
        : "Não foi possível cancelar a reserva.",
    );
  }

  return body.data;
}

export async function listarSetoresReserva(): Promise<Setor[]> {
  try {
    const setores = await Promise.race([
      listarSetores(),
      new Promise<Setor[]>((_, reject) =>
        setTimeout(() => reject(new Error("timeout")), 1500),
      ),
    ]);
    if (setores.length > 0) return setores;
  } catch {
    // usa o stub local quando o Nest não estiver disponível
  }

  const resposta = await fetch("/api/reservation-sectors");
  if (!resposta.ok) {
    throw new Error("Não foi possível carregar os setores.");
  }
  const { data } = await parseJson<
    ApiEnvelope<{ id: string; name: string; availableSpots: number }[]>
  >(resposta);
  return data.map((setor) => ({
    id: setor.id,
    nome: setor.name,
    localizacao: "",
    cotaVagas: setor.availableSpots,
    vagasOcupadas: 0,
    tarifaPorHora: 0,
  }));
}
