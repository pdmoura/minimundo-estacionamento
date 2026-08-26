"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { criarReserva, listarSetoresReserva, type ReservaErro } from "@/lib/api/reservas";
import type { Setor } from "@/lib/api/setores";

function vagasDisponiveis(setor: Setor) {
  return Math.max(setor.cotaVagas - setor.vagasOcupadas, 0);
}

export default function NovaReservaPage() {
  const router = useRouter();
  const [setores, setSetores] = useState<Setor[]>([]);
  const [plate, setPlate] = useState("");
  const [sectorId, setSectorId] = useState("");
  const [expectedArrivalAt, setExpectedArrivalAt] = useState("");
  const [error, setError] = useState("");
  const [errorField, setErrorField] = useState("");
  const [pending, setPending] = useState(false);
  const [erroSetores, setErroSetores] = useState("");

  useEffect(() => {
    void (async () => {
      try {
        setSetores(await listarSetoresReserva());
      } catch {
        setErroSetores("Não foi possível carregar os setores.");
      }
    })();
  }, []);

  const setorSelecionado = useMemo(
    () => setores.find((setor) => setor.id === sectorId),
    [setores, sectorId],
  );

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!plate.trim()) {
      setErrorField("plate");
      setError("Informe a placa.");
      return;
    }

    if (!sectorId) {
      setErrorField("sectorId");
      setError("Selecione o setor.");
      return;
    }

    if (!expectedArrivalAt) {
      setErrorField("expectedArrivalAt");
      setError("Informe a data/hora prevista.");
      return;
    }

    if (new Date(expectedArrivalAt).getTime() < Date.now()) {
      setErrorField("expectedArrivalAt");
      setError("A data/hora prevista não pode estar no passado.");
      return;
    }

    const setor = setores.find((item) => item.id === sectorId);
    if (!setor) {
      setErrorField("sectorId");
      setError("Selecione o setor.");
      return;
    }

    setPending(true);
    setError("");
    setErrorField("");

    try {
      await criarReserva({
        plate,
        sectorId: setor.id,
        expectedArrivalAt: new Date(expectedArrivalAt).toISOString(),
      });
      router.push("/reservas?criada=1");
    } catch (requestError) {
      const erro = requestError as ReservaErro;
      setErrorField(erro.field ?? "");
      setError(
        erro instanceof Error
          ? erro.message
          : "Não foi possível conectar ao servidor. Tente novamente.",
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <>
      <h1 className="h3 mb-1">Nova reserva</h1>
      <p className="text-secondary mb-4">
        Informe a placa, o setor e a data/hora prevista de chegada.
      </p>

      <div className="card shadow-sm border-0" style={{ maxWidth: 560 }}>
        <div className="card-body">
          <form noValidate onSubmit={handleSubmit}>
            {error ? (
              <div className="alert alert-danger py-2" role="alert">
                {error}
              </div>
            ) : null}

            {erroSetores ? (
              <div className="alert alert-warning py-2" role="alert">
                {erroSetores}
              </div>
            ) : null}

            <div className="mb-3">
              <label htmlFor="reserva-placa" className="form-label">
                Placa
              </label>
              <input
                id="reserva-placa"
                className={`form-control${errorField === "plate" ? " is-invalid" : ""}`}
                value={plate}
                onChange={(event) => setPlate(event.target.value.toUpperCase())}
                maxLength={8}
                placeholder="ABC1D23"
              />
            </div>

            <div className="mb-3">
              <label htmlFor="reserva-setor" className="form-label">
                Setor
              </label>
              <select
                id="reserva-setor"
                className={`form-select${errorField === "sectorId" ? " is-invalid" : ""}`}
                value={sectorId}
                onChange={(event) => setSectorId(event.target.value)}
              >
                <option value="">Selecione</option>
                {setores.map((setor) => (
                  <option key={setor.id} value={setor.id}>
                    {setor.nome} ({vagasDisponiveis(setor)} vagas)
                  </option>
                ))}
              </select>
              {setorSelecionado && (
                <div className="form-text">
                  Cota disponível: {vagasDisponiveis(setorSelecionado)}
                </div>
              )}
            </div>

            <div className="mb-3">
              <label htmlFor="reserva-chegada" className="form-label">
                Data/hora prevista
              </label>
              <input
                id="reserva-chegada"
                type="datetime-local"
                className={`form-control${errorField === "expectedArrivalAt" ? " is-invalid" : ""}`}
                value={expectedArrivalAt}
                onChange={(event) => setExpectedArrivalAt(event.target.value)}
              />
            </div>

            <div className="d-flex justify-content-end gap-2 mt-2">
              <Link href="/reservas" className="btn btn-outline-secondary">
                Cancelar
              </Link>
              <button type="submit" className="btn btn-primary" disabled={pending}>
                {pending ? "Reservando..." : "Reservar"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
