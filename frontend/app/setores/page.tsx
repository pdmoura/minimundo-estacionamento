"use client";

import { useEffect, useMemo, useState } from "react";
import { listarSetores, type Setor } from "@/lib/api/setores";

const CORES_AVATAR = [
  "bg-primary",
  "bg-success",
  "bg-warning",
  "bg-secondary",
  "bg-danger",
  "bg-info",
];

function corAvatar(indice: number) {
  return CORES_AVATAR[indice % CORES_AVATAR.length];
}

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
    <div className="flex-grow-1 d-flex justify-content-center bg-light px-3 py-5">
      <main className="w-100" style={{ maxWidth: "960px" }}>
        <div className="card shadow-sm">
          <div className="card-header bg-white d-flex flex-wrap align-items-center justify-content-between gap-3">
            <h1 className="h4 fw-semibold mb-0">Setores</h1>

            <div className="d-flex align-items-center gap-2">
              <input
                type="text"
                placeholder="Buscar setor..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="form-control"
                style={{ width: "220px" }}
              />
            </div>
          </div>

          <div className="table-responsive">
            {carregando && (
              <p className="p-4 text-muted mb-0">Carregando setores...</p>
            )}

            {!carregando && erroListagem && (
              <p className="p-4 text-danger mb-0">{erroListagem}</p>
            )}

            {!carregando && !erroListagem && setoresFiltrados.length === 0 && (
              <p className="p-4 text-muted mb-0">
                {setores.length === 0
                  ? "Nenhum setor cadastrado ainda."
                  : "Nenhum setor encontrado para essa busca."}
              </p>
            )}

            {!carregando && !erroListagem && setoresFiltrados.length > 0 && (
              <table className="table table-hover align-middle mb-0">
                <thead>
                  <tr className="text-uppercase small text-muted">
                    <th className="px-4 py-3">Nome</th>
                    <th className="px-4 py-3">Localização</th>
                    <th className="px-4 py-3">Cota total</th>
                    <th className="px-4 py-3">Tarifa por hora</th>
                  </tr>
                </thead>
                <tbody>
                  {setoresFiltrados.map((setor, indice) => (
                    <tr key={setor.id}>
                      <td className="px-4 py-3">
                        <div className="d-flex align-items-center gap-2">
                          <span
                            className={`d-flex align-items-center justify-content-center rounded-circle text-white fw-semibold ${corAvatar(
                              indice,
                            )}`}
                            style={{
                              width: "28px",
                              height: "28px",
                              fontSize: "0.75rem",
                            }}
                          >
                            {setor.nome.charAt(0).toUpperCase()}
                          </span>
                          <span className="fw-medium">{setor.nome}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-secondary">
                        {setor.localizacao || "—"}
                      </td>
                      <td className="px-4 py-3 text-secondary">
                        {setor.cotaVagas}
                      </td>
                      <td className="px-4 py-3 text-secondary">
                        R$ {setor.tarifaPorHora.toFixed(2)}/h
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
