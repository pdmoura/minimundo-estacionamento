"use client";

import Link from "next/link";
import { use, useEffect, useState } from "react";
import {
  obterDetalheSetor,
  type DetalheSetor,
} from "@/lib/mock/detalheSetor";

const money = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

export default function DetalheSetorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [setor, setSetor] = useState<DetalheSetor | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    async function carregar() {
      setCarregando(true);
      setErro(null);
      try {
        const dados = await obterDetalheSetor(id);
        setSetor(dados);
      } catch {
        setErro("Não foi possível carregar o setor.");
      } finally {
        setCarregando(false);
      }
    }

    // eslint-disable-next-line react-hooks/set-state-in-effect -- carga inicial do detalhe
    void carregar();
  }, [id]);

  if (carregando) {
    return <p className="text-muted">Carregando setor...</p>;
  }

  if (erro || !setor) {
    return (
      <div className="alert alert-danger" role="alert">
        {erro ?? "Setor não encontrado."}
      </div>
    );
  }

  return (
    <>
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
        <div className="d-flex align-items-center gap-3">
          <Link
            href="/setores"
            className="text-secondary fs-4 lh-1"
            aria-label="Voltar para setores"
          >
            <i className="bi bi-arrow-left" />
          </Link>
          <div>
            <h1 className="h4 mb-0">{setor.nome}</h1>
            <p className="text-secondary small mb-0">
              <i className="bi bi-geo-alt me-1" />
              {setor.localizacao}
            </p>
          </div>
        </div>
        <button type="button" className="btn btn-primary">
          Reservar vaga
        </button>
      </div>

      <div className="row g-3 mb-4">
        <div className="col-12 col-sm-4">
          <div className="card shadow-sm border-0 h-100">
            <div className="card-body">
              <div className="text-secondary small text-uppercase mb-1">
                Cota total
              </div>
              <div className="h4 mb-0">{setor.cotaVagas}</div>
            </div>
          </div>
        </div>
        <div className="col-12 col-sm-4">
          <div className="card shadow-sm border-0 h-100">
            <div className="card-body">
              <div className="text-secondary small text-uppercase mb-1">
                Disponíveis
              </div>
              <div className="h4 mb-0 text-success">
                {setor.vagasDisponiveis}
              </div>
            </div>
          </div>
        </div>
        <div className="col-12 col-sm-4">
          <div className="card shadow-sm border-0 h-100">
            <div className="card-body">
              <div className="text-secondary small text-uppercase mb-1">
                Tarifa por hora
              </div>
              <div className="h4 mb-0">
                {money.format(setor.tarifaPorHora)}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="row g-3">
        <div className="col-12 col-lg-4">
          <div className="card shadow-sm border-0 h-100">
            <div className="card-body">
              <h2 className="h6 fw-semibold mb-3">Reservas ativas</h2>
              <ul className="list-unstyled d-flex flex-column gap-2 mb-2">
                {setor.reservasAtivas.map((reserva) => (
                  <li
                    key={reserva.id}
                    className="d-flex align-items-center gap-2"
                  >
                    <i className="bi bi-car-front-fill text-secondary" />
                    <span className="fw-medium flex-grow-1">
                      {reserva.placa}
                    </span>
                    <span className="text-secondary small">
                      {reserva.horarioChegada}
                    </span>
                    <span className="badge text-bg-success">
                      {reserva.status}
                    </span>
                  </li>
                ))}
                {setor.reservasAtivas.length === 0 && (
                  <li className="text-secondary small">
                    Nenhuma reserva ativa.
                  </li>
                )}
              </ul>
              <Link href="#" className="small">
                Ver todas as reservas
              </Link>
            </div>
          </div>
        </div>

        <div className="col-12 col-lg-4">
          <div className="card shadow-sm border-0 h-100">
            <div className="card-body">
              <h2 className="h6 fw-semibold mb-3">
                Lista de espera ({setor.listaDeEspera.length})
              </h2>
              <ul className="list-unstyled d-flex flex-column gap-2 mb-2">
                {setor.listaDeEspera.map((entrada) => (
                  <li
                    key={entrada.id}
                    className="d-flex align-items-center gap-2"
                  >
                    <span className="text-secondary small" style={{ width: "20px" }}>
                      {entrada.posicao}º
                    </span>
                    <i className="bi bi-car-front text-secondary" />
                    <span className="fw-medium flex-grow-1">
                      {entrada.placa}
                    </span>
                    <span className="text-secondary small">
                      {entrada.horarioChegada}
                    </span>
                  </li>
                ))}
                {setor.listaDeEspera.length === 0 && (
                  <li className="text-secondary small">
                    Ninguém na lista de espera.
                  </li>
                )}
              </ul>
              <Link href="#" className="small">
                Ver lista completa
              </Link>
            </div>
          </div>
        </div>

        <div className="col-12 col-lg-4">
          <div className="card shadow-sm border-0 h-100 bg-warning-subtle">
            <div className="card-body">
              <h2 className="h6 fw-semibold mb-2">Como funciona a fila</h2>
              <p className="small text-secondary mb-3">
                Se uma reserva for cancelada, a primeira placa da lista de
                espera será promovida automaticamente para reserva ativa.
              </p>
              <div className="d-flex gap-2 fs-5 text-secondary">
                <i className="bi bi-people-fill" />
                <i className="bi bi-arrow-right" />
                <i className="bi bi-car-front-fill" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
