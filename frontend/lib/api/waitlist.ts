import { listarSetores } from "@/lib/api/setores";
import type { JoinWaitlistInput, WaitlistEntry } from "@/lib/reservations/types";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

type ApiEnvelope<T> = { data: T };
type ApiErrorEnvelope = {
  error?: { code?: string; message?: string; fields?: Record<string, string> };
};

export type WaitlistErro = Error & { field?: string };

type WaitlistEntryApi = {
  id: string;
  plate: string;
  sectorId: string;
  expectedArrivalAt: string;
  status: WaitlistEntry["status"];
  createdAt: string;
};

// O backend não devolve o nome do setor na entrada da fila, só o id. A tela
// mostra o nome, então resolvemos aqui — mesma abordagem que listarReservas.
function paraEntrada(
  entrada: WaitlistEntryApi,
  nomesPorSetor: Map<string, string>,
): WaitlistEntry {
  return {
    id: entrada.id,
    plate: entrada.plate,
    sectorId: entrada.sectorId,
    sectorName: nomesPorSetor.get(entrada.sectorId) ?? "—",
    expectedArrivalAt: entrada.expectedArrivalAt,
    status: entrada.status,
    createdAt: entrada.createdAt,
  };
}

async function erroDaResposta(
  resposta: Response,
  padrao: string,
): Promise<WaitlistErro> {
  let corpo: ApiErrorEnvelope = {};
  try {
    corpo = (await resposta.json()) as ApiErrorEnvelope;
  } catch {
    // resposta sem corpo JSON — fica na mensagem padrão
  }

  const erro = new Error(corpo.error?.message ?? padrao) as WaitlistErro;
  const campos = corpo.error?.fields;
  if (campos) {
    const primeiro = Object.keys(campos)[0];
    if (primeiro) erro.field = primeiro;
  }

  return erro;
}

// A fila é por setor no backend, mas a tela lista o pátio inteiro — daí o
// fan-out por setor e a concatenação.
export async function listarListaEspera(): Promise<WaitlistEntry[]> {
  const setores = await listarSetores();
  const nomesPorSetor = new Map(setores.map((setor) => [setor.id, setor.nome]));

  const filas = await Promise.all(
    setores.map(async (setor) => {
      const resposta = await fetch(
        `${API_BASE_URL}/api/sectors/${setor.id}/waitlist`,
      );
      if (!resposta.ok) {
        throw new Error("Não foi possível carregar a lista de espera.");
      }

      const { data } = (await resposta.json()) as ApiEnvelope<
        WaitlistEntryApi[]
      >;
      return data.map((entrada) => paraEntrada(entrada, nomesPorSetor));
    }),
  );

  return filas
    .flat()
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

export async function entrarNaListaEspera(
  input: JoinWaitlistInput,
): Promise<WaitlistEntry> {
  const resposta = await fetch(
    `${API_BASE_URL}/api/sectors/${input.sectorId}/waitlist`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        plate: input.plate,
        expectedArrivalAt: input.expectedArrivalAt,
      }),
    },
  );

  if (!resposta.ok) {
    throw await erroDaResposta(
      resposta,
      "Não foi possível entrar na lista de espera.",
    );
  }

  const { data } = (await resposta.json()) as ApiEnvelope<WaitlistEntryApi>;
  return paraEntrada(data, new Map([[input.sectorId, input.sectorName]]));
}

export async function sairDaListaEspera(
  sectorId: string,
  entryId: string,
): Promise<WaitlistEntry> {
  const resposta = await fetch(
    `${API_BASE_URL}/api/sectors/${sectorId}/waitlist/${entryId}/leave`,
    { method: "POST" },
  );

  if (!resposta.ok) {
    throw await erroDaResposta(
      resposta,
      "Não foi possível sair da lista de espera.",
    );
  }

  const { data } = (await resposta.json()) as ApiEnvelope<WaitlistEntryApi>;
  return paraEntrada(data, new Map());
}
