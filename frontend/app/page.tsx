"use client";

import { useEffect, useState } from "react";

type Sector = {
  id: string;
  name: string;
  quota: number;
  availableQuota: number;
};

export default function DashboardPage() {
  const [sectors, setSectors] = useState<Sector[]>([]);

  useEffect(() => {
    fetch("/api/sectors")
      .then((response) => response.json())
      .then(setSectors)
      .catch(() => setSectors([]));
  }, []);

  const available = sectors.reduce((sum, sector) => sum + sector.availableQuota, 0);
  const quota = sectors.reduce((sum, sector) => sum + sector.quota, 0);

  return (
    <>
      <h1 className="h3 mb-1">Dashboard</h1>
      <p className="text-secondary mb-4">Visão geral do estacionamento rotativo.</p>

      <div className="row g-3">
        <div className="col-md-4">
          <div className="card shadow-sm border-0 h-100">
            <div className="card-body">
              <p className="text-secondary small mb-1">Setores cadastrados</p>
              <p className="display-6 fw-semibold mb-0">{sectors.length}</p>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card shadow-sm border-0 h-100">
            <div className="card-body">
              <p className="text-secondary small mb-1">Cota total</p>
              <p className="display-6 fw-semibold mb-0">{quota}</p>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card shadow-sm border-0 h-100">
            <div className="card-body">
              <p className="text-secondary small mb-1">Vagas disponíveis</p>
              <p className="display-6 fw-semibold mb-0">{available}</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
