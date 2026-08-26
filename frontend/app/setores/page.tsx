"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { listarSetores, type Setor } from "@/lib/api/setores";

const money = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

export default function SetoresPage() {
  const [setores, setSetores] = useState<Setor[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erroListagem, setErroListagem] = useState<string | null>(null);
  const [busca, setBusca] = useState("");

  async function carregarSetores() {
    setCarregando(true);
    setErroListagem(null);
    try {
      const dados = await listarSetores();
      setSetores(dados);
    } catch {
      setErroListagem("Não foi possível carregar os setores.");
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- carga inicial da listagem
    void carregarSetores();
  }, []);

  const setoresFiltrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    if (!termo) return setores;
    return setores.filter(
      (setor) =>
        setor.nome.toLowerCase().includes(termo) ||
        setor.localizacao.toLowerCase().includes(termo),
    );
  }, [setores, busca]);

  return (
    <>
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
        <div>
          <h1 className="h3 mb-1">Setores</h1>
          <p className="text-secondary mb-0">
            Cadastre os setores do estacionamento e acompanhe a estrutura do
            pátio.
          </p>
        </div>
        <Link href="/setores/novo" className="btn btn-primary">
          <i className="bi bi-plus-lg me-1" />
          Novo setor
        </Link>
      </div>

      <div className="mb-3">
        <input
          type="text"
          placeholder="Buscar setor..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          className="form-control"
          style={{ maxWidth: "280px" }}
        />
      </div>

      {!carregando && erroListagem && (
        <div className="alert alert-danger" role="alert">
          {erroListagem}
        </div>
      )}

      <div className="card shadow-sm border-0">
        <div className="card-body p-0">
          {carregando && (
            <p className="p-4 text-muted mb-0">Carregando setores...</p>
          )}

          {!carregando && !erroListagem && setoresFiltrados.length === 0 && (
            <div className="text-center text-secondary py-5">
              <i className="bi bi-building fs-1 d-block mb-2" />
              <p className="mb-0">
                {setores.length === 0
                  ? "Nenhum setor cadastrado ainda."
                  : "Nenhum setor encontrado para essa busca."}
              </p>
            </div>
          )}

          {!carregando && !erroListagem && setoresFiltrados.length > 0 && (
            <div className="table-responsive">
              <table className="table align-middle mb-0">
                <thead className="table-light">
                  <tr>
                    <th>Nome</th>
                    <th>Localização</th>
                    <th>Cota</th>
                    <th>Ocupadas</th>
                    <th>Tarifa/hora</th>
                  </tr>
                </thead>
                <tbody>
                  {setoresFiltrados.map((setor) => (
                    <tr key={setor.id}>
                      <td className="fw-semibold">{setor.nome}</td>
                      <td>{setor.localizacao || "—"}</td>
                      <td>{setor.cotaVagas}</td>
                      <td>{setor.vagasOcupadas}</td>
                      <td>{money.format(setor.tarifaPorHora)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
