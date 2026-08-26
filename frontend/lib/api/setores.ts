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
