"use client";

import { useEffect, useState } from "react";
import { obterResumoDashboard, type ResumoDashboard } from "@/lib/api/setores";

const CORES_SETOR = ["#2563eb", "#16a34a", "#f59e0b", "#4f46e5"];

function corSetor(indice: number) {
  return CORES_SETOR[indice % CORES_SETOR.length];
}

function formatarPercentual(fracao: number) {
  return `${Math.round(fracao * 100)}%`;
}

export default function DashboardPage() {
  const [resumo, setResumo] = useState<ResumoDashboard | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    async function carregar() {
      setCarregando(true);
      setErro(null);
      try {
        const dados = await obterResumoDashboard();
        setResumo(dados);
      } catch {
        setErro("Não foi possível carregar o dashboard.");
      } finally {
        setCarregando(false);
      }
    }

    // eslint-disable-next-line react-hooks/set-state-in-effect -- carga inicial do dashboard
    void carregar();
  }, []);

  return (
    <div className="flex-grow-1 bg-light px-4 py-4">
      <h1 className="h3 fw-bold mb-4">Dashboard</h1>

      {carregando && <p className="text-muted">Carregando dashboard...</p>}
      {!carregando && erro && <p className="text-danger">{erro}</p>}

      {!carregando && !erro && resumo && (
        <>
          <div className="row g-3 mb-4">
            <div className="col-12 col-sm-6 col-lg-3">
              <CartaoEstatistica
                icone="bi-building"
                corFundo="#2563eb"
                valor={resumo.setoresCadastrados}
                rotulo="Setores cadastrados"
              />
            </div>
            <div className="col-12 col-sm-6 col-lg-3">
              <CartaoEstatistica
                icone="bi-car-front-fill"
                corFundo="#16a34a"
                valor={resumo.reservasAtivas}
                rotulo="Reservas ativas"
              />
            </div>
            <div className="col-12 col-sm-6 col-lg-3">
              <CartaoEstatistica
                icone="bi-people-fill"
                corFundo="#f59e0b"
                valor={resumo.naListaDeEspera}
                rotulo="Na lista de espera agora"
              />
            </div>
            <div className="col-12 col-sm-6 col-lg-3">
              <CartaoEstatistica
                icone="bi-pie-chart-fill"
                corFundo="#4f46e5"
                valor={formatarPercentual(resumo.taxaOcupacaoMedia)}
                rotulo="Taxa de ocupação média"
              />
            </div>
          </div>

          <div className="card shadow-sm">
            <div className="card-body">
              <h2 className="h5 fw-semibold mb-3">Ocupação por setor</h2>
              <ul className="list-unstyled d-flex flex-column gap-3 mb-0">
                {resumo.ocupacaoPorSetor.map((setor, indice) => {
                  const fracaoOcupada = setor.vagasOcupadas / setor.cotaVagas;
                  return (
                    <li
                      key={setor.id}
                      className="d-flex align-items-center gap-3"
                    >
                      <span
                        className="d-flex align-items-center justify-content-center rounded-circle text-white flex-shrink-0"
                        style={{
                          width: "36px",
                          height: "36px",
                          backgroundColor: corSetor(indice),
                        }}
                      >
                        <i className="bi bi-building" />
                      </span>

                      <div style={{ minWidth: "160px" }}>
                        <div className="fw-medium">{setor.nome}</div>
                        <div className="small text-muted">
                          {setor.localizacao}
                        </div>
                      </div>

                      <div className="flex-grow-1">
                        <div
                          className="progress"
                          role="progressbar"
                          aria-valuenow={Math.round(fracaoOcupada * 100)}
                          aria-valuemin={0}
                          aria-valuemax={100}
                          style={{ height: "8px" }}
                        >
                          <div
                            className="progress-bar"
                            style={{
                              width: formatarPercentual(fracaoOcupada),
                              backgroundColor: corSetor(indice),
                            }}
                          />
                        </div>
                      </div>

                      <div
                        className="text-muted small text-nowrap"
                        style={{ width: "90px" }}
                      >
                        {setor.vagasOcupadas} / {setor.cotaVagas} vagas
                      </div>

                      <div
                        className="text-nowrap fw-medium"
                        style={{ width: "48px" }}
                      >
                        {formatarPercentual(fracaoOcupada)}
                      </div>

                      <div
                        className="text-nowrap fw-semibold text-primary"
                        style={{ width: "80px" }}
                      >
                        R$ {setor.tarifaPorHora.toFixed(2)}/h
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function CartaoEstatistica({
  icone,
  corFundo,
  valor,
  rotulo,
}: {
  icone: string;
  corFundo: string;
  valor: number | string;
  rotulo: string;
}) {
  return (
    <div className="card shadow-sm h-100">
      <div className="card-body d-flex align-items-center gap-3">
        <span
          className="d-flex align-items-center justify-content-center rounded-circle text-white flex-shrink-0"
          style={{ width: "44px", height: "44px", backgroundColor: corFundo }}
        >
          <i className={`bi ${icone}`} />
        </span>
        <div>
          <div className="h4 fw-bold mb-0">{valor}</div>
          <div className="small text-muted">{rotulo}</div>
        </div>
      </div>
    </div>
  );
}
