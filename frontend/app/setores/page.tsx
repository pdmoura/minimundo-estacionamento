"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Sector = {
  id: string;
  name: string;
  location: string;
  quota: number;
  availableQuota: number;
  hourlyRate: number;
};

const money = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

export default function SetoresPage() {
  const [sectors, setSectors] = useState<Sector[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/sectors")
      .then((response) => response.json())
      .then(setSectors)
      .catch(() => setError("Não foi possível carregar os setores."));
  }, []);

  return (
    <>
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
        <div>
          <h1 className="h3 mb-1">Setores</h1>
          <p className="text-secondary mb-0">
            Cadastre os setores do estacionamento e acompanhe a estrutura do pátio.
          </p>
        </div>
        <Link href="/setores/novo" className="btn btn-primary">
          <i className="bi bi-plus-lg me-1" />
          Novo setor
        </Link>
      </div>

      {error ? (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      ) : null}

      <div className="card shadow-sm border-0">
        <div className="card-body p-0">
          {sectors.length === 0 ? (
            <div className="text-center text-secondary py-5">
              <i className="bi bi-building fs-1 d-block mb-2" />
              <p className="mb-0">Nenhum setor cadastrado ainda.</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table align-middle mb-0">
                <thead className="table-light">
                  <tr>
                    <th>Nome</th>
                    <th>Localização</th>
                    <th>Cota</th>
                    <th>Disponíveis</th>
                    <th>Tarifa/hora</th>
                  </tr>
                </thead>
                <tbody>
                  {sectors.map((sector) => (
                    <tr key={sector.id}>
                      <td className="fw-semibold">{sector.name}</td>
                      <td>{sector.location || "—"}</td>
                      <td>{sector.quota}</td>
                      <td>{sector.availableQuota}</td>
                      <td>{money.format(sector.hourlyRate)}</td>
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
