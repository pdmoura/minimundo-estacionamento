export type ReservaAtiva = {
  id: string;
  placa: string;
  horarioChegada: string;
  status: "Ativa";
};

export type EntradaListaEspera = {
  id: string;
  posicao: number;
  placa: string;
  horarioChegada: string;
};

export type DetalheSetor = {
  id: string;
  nome: string;
  localizacao: string;
  cotaVagas: number;
  vagasDisponiveis: number;
  tarifaPorHora: number;
  reservasAtivas: ReservaAtiva[];
  listaDeEspera: EntradaListaEspera[];
};

const DETALHE_SETOR_MOCK: DetalheSetor = {
  id: "1",
  nome: "Setor Central",
  localizacao: "Praça Central",
  cotaVagas: 30,
  vagasDisponiveis: 18,
  tarifaPorHora: 8,
  reservasAtivas: [
    { id: "r1", placa: "ABC-1234", horarioChegada: "Hoje 14:30", status: "Ativa" },
    { id: "r2", placa: "KLM-5678", horarioChegada: "Hoje 16:00", status: "Ativa" },
    { id: "r3", placa: "XYZ-9012", horarioChegada: "Hoje 17:30", status: "Ativa" },
  ],
  listaDeEspera: [
    { id: "w1", posicao: 1, placa: "BRA-1234", horarioChegada: "Hoje 18:00" },
    { id: "w2", posicao: 2, placa: "DEF-5678", horarioChegada: "Hoje 18:30" },
    { id: "w3", posicao: 3, placa: "GHI-9012", horarioChegada: "Hoje 19:00" },
  ],
};

const LATENCIA_MS = 300;

function atraso<T>(valor: T): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(valor), LATENCIA_MS));
}

export async function obterDetalheSetor(id: string): Promise<DetalheSetor> {
  return atraso({ ...DETALHE_SETOR_MOCK, id });
}
