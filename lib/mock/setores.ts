export type Setor = {
  id: string;
  nome: string;
  localizacao: string;
  cotaVagas: number;
  tarifaPorHora: number;
};

export type NovoSetor = {
  nome: string;
  localizacao: string;
  cotaVagas: number;
  tarifaPorHora: number;
};

let setores: Setor[] = [
  {
    id: "1",
    nome: "Setor A",
    localizacao: "Entrada principal",
    cotaVagas: 20,
    tarifaPorHora: 6,
  },
  {
    id: "2",
    nome: "Setor B",
    localizacao: "Fundos da praça",
    cotaVagas: 12,
    tarifaPorHora: 4.5,
  },
];

const LATENCIA_MS = 400;

function atraso<T>(valor: T): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(valor), LATENCIA_MS));
}

export async function listarSetores(): Promise<Setor[]> {
  return atraso([...setores]);
}

export async function criarSetor(dados: NovoSetor): Promise<Setor> {
  const novo: Setor = { id: crypto.randomUUID(), ...dados };
  setores = [...setores, novo];
  return atraso(novo);
}
