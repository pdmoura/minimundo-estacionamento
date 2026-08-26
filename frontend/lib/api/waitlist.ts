import type { WaitlistEntry } from "@/lib/reservations/types";
import { listarSetores, type Setor } from "@/lib/api/setores";

type ApiEnvelope<T> = { data: T };
type ApiErrorEnvelope = {
  error?: { message?: string; fields?: Record<string, string> };
};

type WaitlistEntryApi = {
  id: string;
  plate: string;
  sectorId: string;
  expectedArrivalAt: string;
  status: WaitlistEntry["status"];
  createdAt: string;
};

export type WaitlistErro = Error & { field?: string };

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

function lancarErroApi(body: ApiErrorEnvelope, mensagemPadrao: string): never {
  const fields = body.error?.fields ?? {};
  const [primeiroCampo] = Object.keys(fields);
  const mensagem = primeiroCampo
    ? fields[primeiroCampo]
    : body.error?.message ?? mensagemPadrao;
  const erro = new Error(mensagem) as WaitlistErro;
  if (primeiroCampo) erro.field = primeiroCampo;
  throw erro;
}

function paraWaitlistEntry(
  entry: WaitlistEntryApi,
  nomesPorSetor: Map<string, string>,
): WaitlistEntry {
  return {
    id: entry.id,
    plate: entry.plate,
    sectorId: entry.sectorId,
    sectorName: nomesPorSetor.get(entry.sectorId) ?? "Setor",
    expectedArrivalAt: entry.expectedArrivalAt,
    status: entry.status,
    createdAt: entry.createdAt,
  };
}

async function buscarSetoresEMapaDeNomes(): Promise<{
  setores: Setor[];
  nomesPorSetor: Map<string, string>;
}> {
  const setores = await listarSetores();
  return {
    setores,
    nomesPorSetor: new Map(setores.map((setor) => [setor.id, setor.nome])),
  };
}

export async function listarListaEspera(): Promise<WaitlistEntry[]> {
  const { setores, nomesPorSetor } = await buscarSetoresEMapaDeNomes();

  const listasPorSetor = await Promise.all(
    setores.map(async (setor) => {
      const resposta = await fetch(
        `${API_BASE_URL}/api/sectors/${setor.id}/waitlist`,
      );
      if (!resposta.ok) {
        throw new Error("Não foi possível carregar a lista de espera.");
      }
      const { data }: ApiEnvelope<WaitlistEntryApi[]> = await resposta.json();
      return data.map((entry) => paraWaitlistEntry(entry, nomesPorSetor));
    }),
  );

  return listasPorSetor.flat();
}

export async function entrarNaListaEspera(input: {
  plate: string;
  sectorId: string;
  expectedArrivalAt: string;
}): Promise<WaitlistEntry> {
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
  const body = (await resposta.json()) as
    | ApiEnvelope<WaitlistEntryApi>
    | ApiErrorEnvelope;

  if (!resposta.ok || !("data" in body)) {
    lancarErroApi(
      body as ApiErrorEnvelope,
      "Não foi possível entrar na lista de espera.",
    );
  }

  const { nomesPorSetor } = await buscarSetoresEMapaDeNomes();
  return paraWaitlistEntry(
    (body as ApiEnvelope<WaitlistEntryApi>).data,
    nomesPorSetor,
  );
}

export async function sairDaListaEspera(
  sectorId: string,
  entryId: string,
): Promise<WaitlistEntry> {
  const resposta = await fetch(
    `${API_BASE_URL}/api/sectors/${sectorId}/waitlist/${entryId}/leave`,
    { method: "POST" },
  );
  const body = (await resposta.json()) as
    | ApiEnvelope<WaitlistEntryApi>
    | ApiErrorEnvelope;

  if (!resposta.ok || !("data" in body)) {
    lancarErroApi(
      body as ApiErrorEnvelope,
      "Não foi possível sair da lista de espera.",
    );
  }

  const { nomesPorSetor } = await buscarSetoresEMapaDeNomes();
  return paraWaitlistEntry(
    (body as ApiEnvelope<WaitlistEntryApi>).data,
    nomesPorSetor,
  );
}
