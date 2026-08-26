"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { FormatDate } from "@/components/FormatDate";
import { obterHistorico } from "@/lib/api/reservas";
import type { HistoryEvent, Reservation } from "@/lib/reservations/types";

export default function HistoricoDetalhePage() {
  const params = useParams<{ id: string }>();
  const [reserva, setReserva] = useState<Reservation | null>(null);
  const [eventos, setEventos] = useState<HistoryEvent[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    let ativo = true;
    void (async () => {
      try {
        const dados = await obterHistorico(params.id);
        if (!ativo) return;
        setReserva(dados.reservation);
        setEventos(dados.events);
      } catch (requestError) {
        if (ativo) {
          setErro(
            requestError instanceof Error
              ? requestError.message
              : "Não foi possível carregar o histórico.",
          );
        }
      } finally {
        if (ativo) setCarregando(false);
      }
    })();
    return () => {
      ativo = false;
    };
  }, [params.id]);

  return (
    <>
      <Link href="/historico" className="btn btn-link px-0 mb-3">
        ← Voltar ao histórico
      </Link>

      <h1 className="h3 mb-1">Linha do tempo</h1>
      <p className="text-secondary mb-4">
        {reserva
          ? `Placa ${reserva.plate} · ${reserva.sectorName}`
          : "Eventos da reserva, do mais antigo ao mais recente."}
      </p>

      {carregando && <p className="text-muted">Carregando eventos...</p>}

      {!carregando && erro && (
        <div className="alert alert-danger" role="alert">
          {erro}
        </div>
      )}

      {!carregando && !erro && eventos.length === 0 && (
        <div className="alert alert-secondary">Nenhum evento registrado.</div>
      )}

      {!carregando && !erro && eventos.length > 0 && (
        <ol className="list-group list-group-numbered" style={{ maxWidth: 640 }}>
          {eventos.map((evento) => (
            <li key={evento.id} className="list-group-item">
              <div className="fw-semibold">{evento.description}</div>
              <div className="small text-secondary">
                <FormatDate value={evento.occurredAt} />
              </div>
              {evento.originDescription && (
                <div className="small text-secondary fst-italic">
                  Originado por: {evento.originDescription}
                </div>
              )}
            </li>
          ))}
        </ol>
      )}
    </>
  );
}
