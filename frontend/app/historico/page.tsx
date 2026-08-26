"use client";

import { useEffect, useState } from "react";
import {
  listarReservas,
  obterHistorico,
  type EventoHistorico,
  type Reserva,
} from "@/lib/api/reservas";

const dataHora = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeStyle: "short",
});

function formatar(iso: string) {
  return dataHora.format(new Date(iso));
}

export default function HistoricoPage() {
  const [reservas, setReservas] = useState<Reserva[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const [selecionada, setSelecionada] = useState<string | null>(null);
  const [eventos, setEventos] = useState<EventoHistorico[]>([]);
  const [carregandoEventos, setCarregandoEventos] = useState(false);
  const [erroEventos, setErroEventos] = useState<string | null>(null);

  async function carregarReservas() {
    setCarregando(true);
    setErro(null);
    try {
      setReservas(await listarReservas());
    } catch {
      setErro("Não foi possível carregar as reservas.");
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- carga inicial
    void carregarReservas();
  }, []);

  async function abrirHistorico(reserva: Reserva) {
    if (selecionada === reserva.id) {
      setSelecionada(null);
      return;
    }

    setSelecionada(reserva.id);
    setEventos([]);
    setErroEventos(null);
    setCarregandoEventos(true);
    try {
      setEventos(await obterHistorico(reserva.id));
    } catch {
      setErroEventos("Não foi possível carregar o histórico desta reserva.");
    } finally {
      setCarregandoEventos(false);
    }
  }

  return (
    <>
      <div className="mb-4">
        <h1 className="h3 mb-1">Histórico de reservas</h1>
        <p className="text-secondary mb-0">
          Selecione uma reserva para ver tudo o que aconteceu com ela, do mais
          antigo para o mais recente.
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
            <p className="p-4 text-muted mb-0">Carregando reservas...</p>
          )}

          {!carregando && !erro && reservas.length === 0 && (
            <div className="text-center text-secondary py-5">
              <i className="bi bi-clock-history fs-1 d-block mb-2" />
              <p className="mb-0">Nenhuma reserva registrada ainda.</p>
            </div>
          )}

          {!carregando && !erro && reservas.length > 0 && (
            <ul className="list-group list-group-flush">
              {reservas.map((reserva) => {
                const aberta = selecionada === reserva.id;
                return (
                  <li key={reserva.id} className="list-group-item p-0">
                    <button
                      type="button"
                      onClick={() => void abrirHistorico(reserva)}
                      aria-expanded={aberta}
                      className="btn btn-link text-decoration-none text-body w-100 d-flex justify-content-between align-items-center px-3 py-3"
                    >
                      <span className="d-flex align-items-center gap-3">
                        <i
                          className={`bi ${aberta ? "bi-chevron-down" : "bi-chevron-right"}`}
                        />
                        <span className="text-start">
                          <span className="fw-semibold d-block">
                            {reserva.placa}
                          </span>
                          <small className="text-secondary">
                            Chegada prevista: {formatar(reserva.chegadaPrevista)}
                          </small>
                        </span>
                      </span>
                      <span
                        className={`badge ${reserva.status === "ACTIVE" ? "bg-success" : "bg-secondary"}`}
                      >
                        {reserva.status === "ACTIVE" ? "Ativa" : "Cancelada"}
                      </span>
                    </button>

                    {aberta && (
                      <div className="px-4 pb-4">
                        {carregandoEventos && (
                          <p className="text-muted mb-0">
                            Carregando histórico...
                          </p>
                        )}

                        {!carregandoEventos && erroEventos && (
                          <div className="alert alert-danger mb-0" role="alert">
                            {erroEventos}
                          </div>
                        )}

                        {!carregandoEventos &&
                          !erroEventos &&
                          eventos.length === 0 && (
                            <p className="text-secondary mb-0">
                              Nenhum evento registrado para esta reserva.
                            </p>
                          )}

                        {!carregandoEventos && !erroEventos && (
                          <ol className="list-unstyled mb-0 ms-2 border-start ps-4">
                            {eventos.map((evento) => (
                              <li key={evento.id} className="position-relative pb-3">
                                <span
                                  className="position-absolute bg-primary rounded-circle"
                                  style={{
                                    width: 9,
                                    height: 9,
                                    left: "-1.32rem",
                                    top: "0.4rem",
                                  }}
                                />
                                <div className="fw-semibold">
                                  {evento.descricao}
                                </div>
                                <small className="text-secondary d-block">
                                  {formatar(evento.ocorridoEm)}
                                </small>
                                {evento.originDescription && (
                                  <small className="text-secondary fst-italic d-block">
                                    Originado por: {evento.originDescription}
                                  </small>
                                )}
                              </li>
                            ))}
                          </ol>
                        )}
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </>
  );
}
