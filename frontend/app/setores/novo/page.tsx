"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { criarSetor, ErroCadastroSetor } from "@/lib/api/setores";

const CAMPO_POR_CAMPO_API: Record<string, string> = {
  name: "name",
  location: "location",
  reservableQuota: "quota",
  hourlyRate: "hourlyRate",
};

export default function NovoSetorPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [quota, setQuota] = useState("");
  const [hourlyRate, setHourlyRate] = useState("");
  const [error, setError] = useState("");
  const [errorField, setErrorField] = useState("");
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const quotaNumber = Number(quota);
    const rateNumber = Number(hourlyRate);

    if (!name.trim()) {
      setErrorField("name");
      setError("Informe o nome do setor.");
      return;
    }

    if (!Number.isInteger(quotaNumber) || quotaNumber < 1) {
      setErrorField("quota");
      setError("A cota de vagas deve ser no mínimo 1.");
      return;
    }

    if (!Number.isFinite(rateNumber) || rateNumber < 0) {
      setErrorField("hourlyRate");
      setError("A tarifa por hora não pode ser negativa.");
      return;
    }

    setPending(true);
    setError("");
    setErrorField("");

    try {
      await criarSetor({
        name,
        location,
        reservableQuota: quotaNumber,
        hourlyRate: rateNumber,
      });

      setPending(false);
      router.push("/setores");
    } catch (erro) {
      setPending(false);
      if (erro instanceof ErroCadastroSetor) {
        setErrorField(erro.campo ? (CAMPO_POR_CAMPO_API[erro.campo] ?? "") : "");
        setError(erro.message);
        return;
      }
      setError("Não foi possível conectar ao servidor. Tente novamente.");
    }
  }

  return (
    <>
      <h1 className="h3 mb-1">Novo setor</h1>
      <p className="text-secondary mb-4">Informe os dados para cadastrar o setor no pátio.</p>

      <div className="card shadow-sm border-0" style={{ maxWidth: 560 }}>
        <div className="card-body">
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
              />
            </div>

            <div className="mb-3">
              <label htmlFor="sector-location" className="form-label">
                Localização
              </label>
              <input
                id="sector-location"
                className="form-control"
                value={location}
                onChange={(event) => setLocation(event.target.value)}
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
                  className={`form-control${errorField === "quota" ? " is-invalid" : ""}`}
                  value={quota}
                  onChange={(event) => setQuota(event.target.value)}
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
              <Link href="/setores" className="btn btn-outline-secondary">
                Cancelar
              </Link>
              <button type="submit" className="btn btn-primary" disabled={pending}>
                {pending ? "Cadastrando..." : "Cadastrar"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
