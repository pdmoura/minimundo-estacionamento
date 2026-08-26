export type Setor = {
  id: string;
  nome: string;
  localizacao: string;
  cotaVagas: number;
  vagasOcupadas: number;
  tarifaPorHora: number;
};

export type ResumoDashboard = {
  setoresCadastrados: number;
  reservasAtivas: number;
  naListaDeEspera: number;
  taxaOcupacaoMedia: number;
  ocupacaoPorSetor: Setor[];
};

type SectorApi = {
  id: string;
  name: string;
  location: string;
  reservableQuota: number;
  availableSpots: number;
  hourlyRate: number;
  createdAt: string;
};

export type CriarSetorInput = {
  name: string;
  location: string;
  reservableQuota: number;
  hourlyRate: number;
};

type ApiEnvelope<T> = { data: T };
type ApiErrorEnvelope = { error?: { message?: string } };

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

const RESERVAS_ATIVAS_MOCK = 127;
const NA_LISTA_DE_ESPERA_MOCK = 23;

function paraSetor(sector: SectorApi): Setor {
  return {
    id: sector.id,
    nome: sector.name,
    localizacao: sector.location,
    cotaVagas: sector.reservableQuota,
    vagasOcupadas: sector.reservableQuota - sector.availableSpots,
    tarifaPorHora: sector.hourlyRate,
  };
}

export async function listarSetores(): Promise<Setor[]> {
  const resposta = await fetch(`${API_BASE_URL}/api/sectors`);
  if (!resposta.ok) {
    throw new Error(`Falha ao buscar setores: ${resposta.status}`);
  }

  const { data }: { data: SectorApi[] } = await resposta.json();
  return data.map(paraSetor);
}

export async function criarSetor(input: CriarSetorInput): Promise<Setor> {
  const resposta = await fetch(`${API_BASE_URL}/api/sectors`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const body = (await resposta.json()) as
    | ApiEnvelope<SectorApi>
    | ApiErrorEnvelope;

  if (!resposta.ok || !("data" in body)) {
    throw new Error(
      "error" in body
        ? body.error?.message ?? "Não foi possível cadastrar o setor."
        : "Não foi possível cadastrar o setor.",
    );
  }

  return paraSetor(body.data);
}

export async function obterResumoDashboard(): Promise<ResumoDashboard> {
  const setores = await listarSetores();

  const ocupacoes = setores.map((setor) => setor.vagasOcupadas / setor.cotaVagas);
  const taxaOcupacaoMedia =
    ocupacoes.length > 0
      ? ocupacoes.reduce((soma, valor) => soma + valor, 0) / ocupacoes.length
      : 0;

  return {
    setoresCadastrados: setores.length,
    reservasAtivas: RESERVAS_ATIVAS_MOCK,
    naListaDeEspera: NA_LISTA_DE_ESPERA_MOCK,
    taxaOcupacaoMedia,
    ocupacaoPorSetor: setores,
  };
}

export type SetorNoRanking = {
  id: string;
  nome: string;
  localizacao: string;
  totalReservas: number;
};

type SectorRankingApi = {
  id: string;
  name: string;
  location: string;
  totalReservations: number;
};

export async function listarRanking(): Promise<SetorNoRanking[]> {
  const resposta = await fetch(`${API_BASE_URL}/api/sectors/ranking`);
  if (!resposta.ok) {
    throw new Error(`Falha ao buscar o ranking: ${resposta.status}`);
  }

  const { data }: { data: SectorRankingApi[] } = await resposta.json();
  return data.map((item) => ({
    id: item.id,
    nome: item.name,
    localizacao: item.location,
    totalReservas: item.totalReservations,
  }));
}
