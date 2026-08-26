import type { JoinWaitlistInput, WaitlistEntry } from "@/lib/reservations/types";

type ApiEnvelope<T> = { data: T };
type ApiError = { error?: string; field?: string };

export type WaitlistErro = Error & { field?: string };

async function parseJson<T>(resposta: Response): Promise<T> {
  return (await resposta.json()) as T;
}

export async function listarListaEspera(): Promise<WaitlistEntry[]> {
  const resposta = await fetch("/api/waitlist");
  if (!resposta.ok) {
    throw new Error("Não foi possível carregar a lista de espera.");
  }
  const { data } = await parseJson<ApiEnvelope<WaitlistEntry[]>>(resposta);
  return data;
}

export async function entrarNaListaEspera(
  input: JoinWaitlistInput,
): Promise<WaitlistEntry> {
  const resposta = await fetch("/api/waitlist", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const body = await parseJson<ApiEnvelope<WaitlistEntry> | ApiError>(resposta);

  if (!resposta.ok || !("data" in body)) {
    const erro = new Error(
      "error" in body
        ? body.error ?? "Não foi possível entrar na lista de espera."
        : "Não foi possível entrar na lista de espera.",
    ) as WaitlistErro;
    if ("field" in body) erro.field = body.field;
    throw erro;
  }

  return body.data;
}

export async function sairDaListaEspera(id: string): Promise<WaitlistEntry> {
  const resposta = await fetch(`/api/waitlist/${id}/leave`, {
    method: "POST",
  });
  const body = await parseJson<ApiEnvelope<WaitlistEntry> | ApiError>(resposta);

  if (!resposta.ok || !("data" in body)) {
    throw new Error(
      "error" in body
        ? body.error ?? "Não foi possível sair da lista de espera."
        : "Não foi possível sair da lista de espera.",
    );
  }

  return body.data;
}
