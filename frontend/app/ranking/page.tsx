"use client";

import { useEffect, useState } from "react";
import { listarRanking, type SetorNoRanking } from "@/lib/api/setores";

export default function RankingPage() {
  const [setores, setSetores] = useState<SetorNoRanking[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  async function carregarRanking() {
    setCarregando(true);
    setErro(null);
    try {
      const dados = await listarRanking();
      setSetores(dados);
    } catch {
      setErro("Não foi possível carregar o ranking.");
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- carga inicial do ranking
    void carregarRanking();
  }, []);

  // O endpoint devolve todos os setores (LEFT JOIN), então "sem reservas"
  // não é lista vazia: é lista inteira zerada. Os dois casos caem no vazio.
  const semReservas =
    setores.length === 0 ||
    setores.every((setor) => setor.totalReservas === 0);

  return (
    <>
      <div className="mb-4">
        <h1 className="h3 mb-1">Ranking de setores</h1>
        <p className="text-secondary mb-0">
          Setores ordenados pela quantidade de reservas registradas.
        </p>
      </div>

      {!carregando && erro && (
        <div className="alert alert-danger" role="alert">
          {erro}
        </div>
      )}

      <div className="card shadow-sm border-0">
        <div className="card-body p-0">
          {carregando && (
            <p className="p-4 text-muted mb-0">Carregando ranking...</p>
          )}

          {!carregando && !erro && semReservas && (
            <div className="text-center text-secondary py-5">
              <i className="bi bi-bar-chart fs-1 d-block mb-2" />
              <p className="mb-0">
                {setores.length === 0
                  ? "Nenhum setor cadastrado ainda."
                  : "Nenhuma reserva registrada ainda."}
              </p>
            </div>
          )}

          {!carregando && !erro && !semReservas && (
            <ol className="list-group list-group-flush list-group-numbered">
              {setores.map((setor) => (
                <li
                  key={setor.id}
                  className="list-group-item d-flex justify-content-between align-items-center py-3"
                >
                  <div className="ms-2 me-auto">
                    <div className="fw-semibold">{setor.nome}</div>
                    <small className="text-secondary">
                      {setor.localizacao || "—"}
                    </small>
                  </div>
                  <span className="badge bg-primary rounded-pill fs-6">
                    {setor.totalReservas}
                    <span className="ms-1 fw-normal">
                      {setor.totalReservas === 1 ? "reserva" : "reservas"}
                    </span>
                  </span>
                </li>
              ))}
            </ol>
          )}
        </div>
      </div>
    </>
  );
}
