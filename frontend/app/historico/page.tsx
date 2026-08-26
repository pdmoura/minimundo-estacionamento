"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { FormatDate } from "@/components/FormatDate";
import { listarReservas } from "@/lib/api/reservas";
import type { Reservation } from "@/lib/reservations/types";

function rotuloStatus(status: Reservation["status"]) {
  return status === "ACTIVE" ? "Ativa" : "Cancelada";
}

export default function HistoricoPage() {
  const [reservas, setReservas] = useState<Reservation[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [busca, setBusca] = useState("");

  useEffect(() => {
    let ativo = true;
    void (async () => {
      try {
        const dados = await listarReservas();
        if (ativo) setReservas(dados);
      } catch {
        if (ativo) setErro("Não foi possível carregar o histórico.");
      } finally {
        if (ativo) setCarregando(false);
      }
    })();
    return () => {
      ativo = false;
    };
  }, []);

  const filtradas = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    if (!termo) return reservas;
    return reservas.filter(
      (reserva) =>
        reserva.plate.toLowerCase().includes(termo) ||
        reserva.sectorName.toLowerCase().includes(termo),
    );
  }, [reservas, busca]);

  return (
    <>
      <div className="mb-4">
        <h1 className="h3 mb-1">Histórico</h1>
        <p className="text-secondary mb-0">
          Consulte a linha do tempo de cada reserva.
        </p>
      </div>

      <div className="mb-3">
        <input
          type="text"
          placeholder="Buscar placa ou setor..."
          value={busca}
          onChange={(event) => setBusca(event.target.value)}
          className="form-control"
          style={{ maxWidth: "280px" }}
        />
      </div>

      {!carregando && erro && (
        <div className="alert alert-danger" role="alert">
          {erro}
        </div>
      )}

      <div className="card shadow-sm border-0">
        <div className="card-body p-0">
          {carregando && (
            <p className="p-4 text-muted mb-0">Carregando histórico...</p>
          )}

          {!carregando && !erro && filtradas.length === 0 && (
            <div className="text-center text-secondary py-5">
              <i className="bi bi-clock-history fs-1 d-block mb-2" />
              <p className="mb-0">Nenhuma reserva encontrada.</p>
            </div>
          )}

          {!carregando && !erro && filtradas.length > 0 && (
            <div className="table-responsive">
              <table className="table align-middle mb-0">
                <thead className="table-light">
                  <tr>
                    <th>Placa</th>
                    <th>Setor</th>
                    <th>Chegada prevista</th>
                    <th>Status</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {filtradas.map((reserva) => (
                    <tr key={reserva.id}>
                      <td className="fw-semibold">{reserva.plate}</td>
                      <td>{reserva.sectorName}</td>
                      <td><FormatDate value={reserva.expectedArrivalAt} /></td>
                      <td>
                        <span
                          className={`badge ${reserva.status === "ACTIVE" ? "text-bg-success" : "text-bg-secondary"}`}
                        >
                          {rotuloStatus(reserva.status)}
                        </span>
                      </td>
                      <td className="text-end">
                        <Link
                          href={`/historico/${reserva.id}`}
                          className="btn btn-sm btn-outline-primary"
                        >
                          Ver timeline
                        </Link>
                      </td>
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
