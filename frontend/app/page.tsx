"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import type {
  ApiErrorResponse,
  ApiResponse,
  CreateSectorPayload,
  Sector,
} from "@/lib/sectors/types";

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/api";

const money = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

export default function Home() {
  const [sectors, setSectors] = useState<Sector[]>([]);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [reservableQuota, setReservableQuota] = useState("");
  const [hourlyRate, setHourlyRate] = useState("");
  const [loadError, setLoadError] = useState("");
  const [error, setError] = useState("");
  const [errorField, setErrorField] = useState("");
  const [success, setSuccess] = useState("");
  const [pending, setPending] = useState(false);

  useEffect(() => {
    const controller = new AbortController();

    async function loadSectors() {
      try {
        const response = await fetch(`${apiUrl}/sectors`, {
          signal: controller.signal,
        });
        const body = (await response.json()) as
          | ApiResponse<Sector[]>
          | ApiErrorResponse;

        if (!response.ok || !("data" in body)) {
          throw new Error(
            "error" in body
              ? body.error.message
              : "Não foi possível carregar os setores.",
          );
        }

        setSectors(body.data);
        setLoadError("");
      } catch (requestError) {
        if (requestError instanceof Error && requestError.name === "AbortError") {
          return;
        }

        setLoadError(
          requestError instanceof Error
            ? requestError.message
            : "Não foi possível carregar os setores.",
        );
      }
    }

    void loadSectors();

    return () => controller.abort();
  }, []);

  function closeModal() {
    setOpen(false);
    setName("");
    setLocation("");
    setReservableQuota("");
    setHourlyRate("");
    setError("");
    setErrorField("");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const quotaNumber = Number(reservableQuota);
    const rateNumber = Number(hourlyRate);

    if (!name.trim()) {
      setErrorField("name");
      setError("Informe o nome do setor.");
      return;
    }

    if (!location.trim()) {
      setErrorField("location");
      setError("Informe a localização do setor.");
      return;
    }

    if (
      !reservableQuota.trim() ||
      !Number.isInteger(quotaNumber) ||
      quotaNumber < 1
    ) {
      setErrorField("reservableQuota");
      setError("A cota de vagas deve ser no mínimo 1.");
      return;
    }

    if (!hourlyRate.trim() || !Number.isFinite(rateNumber) || rateNumber < 0) {
      setErrorField("hourlyRate");
      setError("A tarifa por hora não pode ser negativa.");
      return;
    }

    setPending(true);
    setError("");
    setErrorField("");

    try {
      const payload: CreateSectorPayload = {
        name: name.trim(),
        location: location.trim(),
        reservableQuota: quotaNumber,
        hourlyRate: rateNumber,
      };
      const response = await fetch(`${apiUrl}/sectors`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const body = (await response.json()) as
        | ApiResponse<Sector>
        | ApiErrorResponse;

      if (!response.ok || !("data" in body)) {
        const apiError = "error" in body ? body.error : undefined;
        setErrorField(Object.keys(apiError?.fields ?? {})[0] ?? "");
        setError(apiError?.message ?? "Não foi possível cadastrar o setor.");
        return;
      }

      setSectors((current) => [body.data, ...current]);
      setSuccess(`Setor "${body.data.name}" cadastrado com sucesso.`);
      closeModal();
    } catch {
      setError("Não foi possível conectar ao servidor. Tente novamente.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="park-shell d-flex">
      <aside className="park-sidebar d-flex flex-column flex-shrink-0 p-3">
        <div className="d-flex align-items-center gap-2 px-1 py-2 mb-4">
          <span
            className="bg-primary rounded-2 d-inline-flex align-items-center justify-content-center"
            style={{ width: 36, height: 36 }}
          >
            <i className="bi bi-p-circle-fill fs-5" />
          </span>
          <span className="park-brand">PARK CENTRAL</span>
        </div>

        <nav className="nav flex-column gap-1 flex-grow-1">
          <a className="park-nav-link" href="#">
            <i className="bi bi-speedometer2" /> Dashboard
          </a>
          <Link className="park-nav-link active" href="/" aria-current="page">
            <i className="bi bi-building" /> Setores
          </Link>
          <a className="park-nav-link" href="#">
            <i className="bi bi-p-circle" /> Reservas
          </a>
          <a className="park-nav-link" href="#">
            <i className="bi bi-people" /> Lista de espera
          </a>
          <a className="park-nav-link" href="#">
            <i className="bi bi-bar-chart" /> Ranking
          </a>
          <a className="park-nav-link" href="#">
            <i className="bi bi-clock-history" /> Histórico
          </a>
        </nav>

        <div className="d-flex align-items-center gap-2 px-1 pt-3 border-top border-light border-opacity-25">
          <span className="park-avatar bg-primary">AD</span>
          <div className="lh-sm">
            <div className="fw-semibold small">Admin</div>
            <div className="small text-white-50">Administrador</div>
          </div>
        </div>
      </aside>

      <main className="park-main flex-grow-1 p-4 p-lg-5">
        <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
          <div>
            <h1 className="h3 mb-1">Setores</h1>
            <p className="text-secondary mb-0">
              Cadastre os setores do estacionamento e acompanhe a estrutura do pátio.
            </p>
          </div>
          <button type="button" className="btn btn-primary" onClick={() => setOpen(true)}>
            <i className="bi bi-plus-lg me-1" />
            Novo setor
          </button>
        </div>

        {success ? (
          <div className="alert alert-success" role="status">
            {success}
          </div>
        ) : null}

        {loadError ? (
          <div className="alert alert-danger" role="alert">
            {loadError}
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
                        <td>{sector.reservableQuota}</td>
                        <td>{sector.availableSpots}</td>
                        <td>{money.format(sector.hourlyRate)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </main>

      {open ? (
        <div
          className="modal d-block"
          tabIndex={-1}
          role="dialog"
          aria-modal="true"
          style={{ background: "rgba(15, 23, 42, 0.45)" }}
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content shadow">
              <div className="modal-header">
                <h2 className="modal-title h5">Novo setor</h2>
                <button type="button" className="btn-close" aria-label="Fechar" onClick={closeModal} />
              </div>
              <div className="modal-body">
                <form noValidate onSubmit={handleSubmit}>
                  {error ? (
                    <div className="alert alert-danger py-2" role="alert">
                      {error}
                    </div>
                  ) : null}

                  <div className="mb-3">
                    <label htmlFor="sector-name" className="form-label">
                      Nome
                    </label>
                    <input
                      id="sector-name"
                      className={`form-control${errorField === "name" ? " is-invalid" : ""}`}
                      value={name}
                      onChange={(event) => setName(event.target.value)}
                      maxLength={100}
                    />
                  </div>

                  <div className="mb-3">
                    <label htmlFor="sector-location" className="form-label">
                      Localização
                    </label>
                    <input
                      id="sector-location"
                      className={`form-control${errorField === "location" ? " is-invalid" : ""}`}
                      value={location}
                      onChange={(event) => setLocation(event.target.value)}
                      maxLength={200}
                    />
                  </div>

                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label htmlFor="sector-quota" className="form-label">
                        Cota de vagas
                      </label>
                      <input
                        id="sector-quota"
                        type="number"
                        min="1"
                        className={`form-control${errorField === "reservableQuota" ? " is-invalid" : ""}`}
                        value={reservableQuota}
                        onChange={(event) => setReservableQuota(event.target.value)}
                      />
                    </div>
                    <div className="col-md-6 mb-3">
                      <label htmlFor="sector-hourly-rate" className="form-label">
                        Tarifa por hora (R$)
                      </label>
                      <input
                        id="sector-hourly-rate"
                        type="number"
                        step="0.01"
                        className={`form-control${errorField === "hourlyRate" ? " is-invalid" : ""}`}
                        value={hourlyRate}
                        onChange={(event) => setHourlyRate(event.target.value)}
                      />
                    </div>
                  </div>

                  <div className="d-flex justify-content-end gap-2 mt-2">
                    <button type="button" className="btn btn-outline-secondary" onClick={closeModal}>
                      Cancelar
                    </button>
                    <button type="submit" className="btn btn-primary" disabled={pending}>
                      {pending ? "Cadastrando..." : "Cadastrar"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
