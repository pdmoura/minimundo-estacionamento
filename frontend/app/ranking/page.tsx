"use client";

import { useEffect, useState } from "react";
import { obterRanking, type ItemRanking } from "@/lib/mock/ranking";

const MEDALHAS = ["text-warning", "text-secondary", "text-danger-emphasis"];

function corPosicao(indice: number) {
  return MEDALHAS[indice] ?? "text-secondary";
}

export default function RankingPage() {
  const [ranking, setRanking] = useState<ItemRanking[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    async function carregar() {
      setCarregando(true);
      setErro(null);
      try {
        const dados = await obterRanking();
        setRanking(dados);
      } catch {
        setErro("Não foi possível carregar o ranking.");
      } finally {
        setCarregando(false);
      }
    }

    // eslint-disable-next-line react-hooks/set-state-in-effect -- carga inicial do ranking
    void carregar();
  }, []);

  const maiorTotal = ranking.reduce(
    (maior, item) => Math.max(maior, item.totalReservas),
    0,
  );

  return (
    <>
      <div className="d-flex align-items-center gap-2 mb-4">
        <i className="bi bi-trophy-fill text-warning fs-4" />
        <h1 className="h4 mb-0">Ranking de setores</h1>
      </div>

      <div className="row g-3">
        <div className="col-12 col-lg-3">
          <div className="card shadow-sm border-0 h-100">
            <div className="card-body">
              <i className="bi bi-bar-chart-fill fs-3 text-primary mb-2 d-block" />
              <p className="small text-secondary mb-3">
                Setores ordenados pela quantidade de reservas registradas.
              </p>
              <label className="form-label small text-secondary mb-1">
                Período
              </label>
              <select className="form-select form-select-sm" defaultValue="todos">
                <option value="todos">Todos</option>
                <option value="hoje">Hoje</option>
                <option value="semana">Esta semana</option>
                <option value="mes">Este mês</option>
              </select>
            </div>
          </div>
        </div>

        <div className="col-12 col-lg-6">
          <div className="card shadow-sm border-0 h-100">
            <div className="card-body">
              {carregando && (
                <p className="text-muted mb-0">Carregando ranking...</p>
              )}

              {!carregando && erro && (
                <div className="alert alert-danger mb-0" role="alert">
                  {erro}
                </div>
              )}

              {!carregando && !erro && ranking.length === 0 && (
                <p className="text-secondary mb-0">
                  Nenhuma reserva registrada ainda.
                </p>
              )}

              {!carregando && !erro && ranking.length > 0 && (
                <div className="table-responsive">
                  <table className="table align-middle mb-0">
                    <thead className="table-light">
                      <tr>
                        <th style={{ width: "70px" }}>Posição</th>
                        <th>Setor</th>
                        <th style={{ width: "50%" }} />
                        <th className="text-end">Total de reservas</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ranking.map((item, indice) => (
                        <tr key={item.setorId}>
                          <td>
                            <i
                              className={`bi bi-award-fill fs-5 ${corPosicao(indice)}`}
                            />{" "}
                            {item.posicao}
                          </td>
                          <td className="fw-semibold">{item.nome}</td>
                          <td>
                            <div
                              className="progress"
                              style={{ height: "8px" }}
                            >
                              <div
                                className="progress-bar bg-primary"
                                style={{
                                  width: `${maiorTotal ? (item.totalReservas / maiorTotal) * 100 : 0}%`,
                                }}
                              />
                            </div>
                          </td>
                          <td className="text-end fw-semibold">
                            {item.totalReservas}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="col-12 col-lg-3">
          <div className="card shadow-sm border-0 h-100">
            <div className="card-body text-center d-flex flex-column justify-content-center">
              {ranking.length === 0 ? (
                <>
                  <i className="bi bi-inbox fs-1 text-secondary mb-2" />
                  <p className="small text-secondary mb-0">
                    Nenhuma reserva registrada ainda.
                  </p>
                  <p className="small text-secondary mb-0">
                    Assim que houver reservas, o ranking será exibido aqui.
                  </p>
                </>
              ) : (
                <p className="small text-secondary mb-0">
                  <i className="bi bi-clock-history me-1" />
                  Última atualização: agora
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
