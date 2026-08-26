"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { FormatDate } from "@/components/FormatDate";
import {
  entrarNaListaEspera,
  listarListaEspera,
  sairDaListaEspera,
  type WaitlistErro,
} from "@/lib/api/waitlist";
import { listarSetoresReserva } from "@/lib/api/reservas";
import type { Setor } from "@/lib/api/setores";
import type { WaitlistEntry } from "@/lib/reservations/types";

export default function ListaEsperaPage() {
  const [entradas, setEntradas] = useState<WaitlistEntry[]>([]);
  const [setores, setSetores] = useState<Setor[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState<string | null>(null);
  const [saindoId, setSaindoId] = useState<string | null>(null);

  const [plate, setPlate] = useState("");
  const [sectorId, setSectorId] = useState("");
  const [expectedArrivalAt, setExpectedArrivalAt] = useState("");
  const [erroForm, setErroForm] = useState("");
  const [campoErro, setCampoErro] = useState("");
  const [enviando, setEnviando] = useState(false);

  async function carregar() {
    setCarregando(true);
    setErro(null);
    try {
      const [listaEspera, setoresDisponiveis] = await Promise.all([
        listarListaEspera(),
        listarSetoresReserva(),
      ]);
      setEntradas(listaEspera);
      setSetores(setoresDisponiveis);
    } catch {
      setErro("Não foi possível carregar a lista de espera.");
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- carga inicial
    void carregar();
  }, []);

  const entradasPorSetor = useMemo(() => {
    const grupos = new Map<string, { nome: string; entradas: WaitlistEntry[] }>();
    for (const entrada of entradas) {
      const grupo = grupos.get(entrada.sectorId);
      if (grupo) {
        grupo.entradas.push(entrada);
      } else {
        grupos.set(entrada.sectorId, {
          nome: entrada.sectorName,
          entradas: [entrada],
        });
      }
    }
    return [...grupos.entries()];
  }, [entradas]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!plate.trim()) {
      setCampoErro("plate");
      setErroForm("Informe a placa.");
      return;
    }

    if (!sectorId) {
      setCampoErro("sectorId");
      setErroForm("Selecione o setor.");
      return;
    }

    if (!expectedArrivalAt) {
      setCampoErro("expectedArrivalAt");
      setErroForm("Informe a data/hora prevista.");
      return;
    }

    if (new Date(expectedArrivalAt).getTime() < Date.now()) {
      setCampoErro("expectedArrivalAt");
      setErroForm("A data/hora prevista não pode estar no passado.");
      return;
    }

    const setor = setores.find((item) => item.id === sectorId);
    if (!setor) {
      setCampoErro("sectorId");
      setErroForm("Selecione o setor.");
      return;
    }

    setEnviando(true);
    setErroForm("");
    setCampoErro("");

    try {
      await entrarNaListaEspera({
        plate,
        sectorId: setor.id,
        sectorName: setor.nome,
        expectedArrivalAt: new Date(expectedArrivalAt).toISOString(),
      });
      setSucesso("Placa incluída na lista de espera.");
      setPlate("");
      setSectorId("");
      setExpectedArrivalAt("");
      await carregar();
    } catch (requestError) {
      const erroTipado = requestError as WaitlistErro;
      setCampoErro(erroTipado.field ?? "");
      setErroForm(
        requestError instanceof Error
          ? requestError.message
          : "Não foi possível entrar na lista de espera.",
      );
    } finally {
      setEnviando(false);
    }
  }

  async function handleSair(sectorId: string, id: string) {
    setSaindoId(id);
    setErro(null);
    try {
      await sairDaListaEspera(sectorId, id);
      setSucesso("Placa removida da lista de espera.");
      await carregar();
    } catch (requestError) {
      setErro(
        requestError instanceof Error
          ? requestError.message
          : "Não foi possível sair da lista de espera.",
      );
    } finally {
      setSaindoId(null);
    }
  }

  return (
    <>
      <div className="mb-4">
        <h1 className="h3 mb-1">Lista de espera</h1>
        <p className="text-secondary mb-0">
          Placas aguardando vaga por setor, em ordem de entrada.
        </p>
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

      <div className="card shadow-sm border-0 mb-4" style={{ maxWidth: 560 }}>
        <div className="card-body">
          <h2 className="h6 mb-3">Entrar na lista de espera</h2>
          <form noValidate onSubmit={handleSubmit}>
            {erroForm ? (
              <div className="alert alert-danger py-2" role="alert">
                {erroForm}
              </div>
            ) : null}

            <div className="mb-3">
              <label htmlFor="espera-placa" className="form-label">
                Placa
              </label>
              <input
                id="espera-placa"
                className={`form-control${campoErro === "plate" ? " is-invalid" : ""}`}
                value={plate}
                onChange={(event) => setPlate(event.target.value.toUpperCase())}
                maxLength={8}
                placeholder="ABC1D23"
              />
            </div>

            <div className="mb-3">
              <label htmlFor="espera-setor" className="form-label">
                Setor
              </label>
              <select
                id="espera-setor"
                className={`form-select${campoErro === "sectorId" ? " is-invalid" : ""}`}
                value={sectorId}
                onChange={(event) => setSectorId(event.target.value)}
              >
                <option value="">Selecione</option>
                {setores.map((setor) => (
                  <option key={setor.id} value={setor.id}>
                    {setor.nome}
                  </option>
                ))}
              </select>
            </div>

            <div className="mb-3">
              <label htmlFor="espera-chegada" className="form-label">
                Data/hora prevista
              </label>
              <input
                id="espera-chegada"
                type="datetime-local"
                className={`form-control${campoErro === "expectedArrivalAt" ? " is-invalid" : ""}`}
                value={expectedArrivalAt}
                onChange={(event) => setExpectedArrivalAt(event.target.value)}
              />
            </div>

            <div className="d-flex justify-content-end mt-2">
              <button type="submit" className="btn btn-primary" disabled={enviando}>
                {enviando ? "Entrando..." : "Entrar na lista"}
              </button>
            </div>
          </form>
        </div>
      </div>

      <div className="card shadow-sm border-0">
        <div className="card-body p-0">
          {carregando && (
            <p className="p-4 text-muted mb-0">Carregando lista de espera...</p>
          )}

          {!carregando && !erro && entradasPorSetor.length === 0 && (
            <div className="text-center text-secondary py-5">
              <i className="bi bi-people fs-1 d-block mb-2" />
              <p className="mb-0">Ninguém na lista de espera ainda.</p>
            </div>
          )}

          {!carregando &&
            entradasPorSetor.map(([id, grupo], index) => (
              <div
                key={id}
                className={index > 0 ? "border-top" : ""}
              >
                <div className="px-4 pt-3 pb-2">
                  <h2 className="h6 mb-0">{grupo.nome}</h2>
                </div>
                <div className="table-responsive">
                  <table className="table align-middle mb-0">
                    <thead className="table-light">
                      <tr>
                        <th style={{ width: 48 }}>#</th>
                        <th>Placa</th>
                        <th>Chegada prevista</th>
                        <th />
                      </tr>
                    </thead>
                    <tbody>
                      {grupo.entradas.map((entrada, posicao) => (
                        <tr key={entrada.id}>
                          <td className="text-secondary">{posicao + 1}</td>
                          <td className="fw-semibold">{entrada.plate}</td>
                          <td>
                            <FormatDate value={entrada.expectedArrivalAt} />
                          </td>
                          <td className="text-end">
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-danger"
                              disabled={saindoId === entrada.id}
                              onClick={() => void handleSair(entrada.sectorId, entrada.id)}
                            >
                              {saindoId === entrada.id ? "Saindo..." : "Sair da lista"}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
        </div>
      </div>
    </>
  );
}
