"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { FormatDate } from "@/components/FormatDate";
import { cancelarReserva, listarReservas } from "@/lib/api/reservas";
import type { Reservation } from "@/lib/reservations/types";

function rotuloStatus(status: Reservation["status"]) {
  return status === "ACTIVE" ? "Ativa" : "Cancelada";
}

export default function ReservasPage() {
  const [reservas, setReservas] = useState<Reservation[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState<string | null>(null);
  const [cancelandoId, setCancelandoId] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("criada") === "1") {
      setSucesso("Reserva registrada.");
    }
  }, []);

  async function carregar() {
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
    void carregar();
  }, []);

  async function handleCancelar(id: string) {
    setCancelandoId(id);
    setErro(null);
    try {
      await cancelarReserva(id);
      setSucesso("Reserva cancelada. A cota disponível do setor aumentou em 1.");
      await carregar();
    } catch (requestError) {
      setErro(
        requestError instanceof Error
          ? requestError.message
          : "Não foi possível cancelar a reserva.",
      );
    } finally {
      setCancelandoId(null);
    }
  }

  return (
    <>
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
        <div>
          <h1 className="h3 mb-1">Reservas</h1>
          <p className="text-secondary mb-0">
            Registre e cancele reservas por placa, setor e data/hora prevista.
          </p>
        </div>
        <Link href="/reservas/nova" className="btn btn-primary">
          <i className="bi bi-plus-lg me-1" />
          Nova reserva
        </Link>
      </div>

      {sucesso && (
        <div className="alert alert-success" role="alert">
          {sucesso}
        </div>
      )}

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
              <i className="bi bi-p-circle fs-1 d-block mb-2" />
              <p className="mb-0">Nenhuma reserva registrada ainda.</p>
            </div>
          )}

          {!carregando && reservas.length > 0 && (
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
                  {reservas.map((reserva) => (
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
                        {reserva.status === "ACTIVE" && (
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-danger"
                            disabled={cancelandoId === reserva.id}
                            onClick={() => void handleCancelar(reserva.id)}
                          >
                            {cancelandoId === reserva.id ? "Cancelando..." : "Cancelar"}
                          </button>
                        )}
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
