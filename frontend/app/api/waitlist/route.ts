import { NextResponse } from "next/server";

import { joinWaitlist, listWaitlist } from "@/lib/reservations/store";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const sectorId = searchParams.get("sectorId") ?? undefined;
  return NextResponse.json({ data: listWaitlist(sectorId) });
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const plate = typeof body.plate === "string" ? body.plate : "";
  const sectorId = typeof body.sectorId === "string" ? body.sectorId : "";
  const sectorName = typeof body.sectorName === "string" ? body.sectorName : "";
  const expectedArrivalAt =
    typeof body.expectedArrivalAt === "string" ? body.expectedArrivalAt : "";

  if (!sectorId.trim()) {
    return NextResponse.json(
      { error: "Selecione o setor.", field: "sectorId" },
      { status: 400 },
    );
  }

  try {
    const entry = joinWaitlist({
      plate,
      sectorId,
      sectorName: sectorName.trim() || "Setor",
      expectedArrivalAt,
    });
    return NextResponse.json({ data: entry }, { status: 201 });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Não foi possível entrar na lista de espera.";
    const field =
      error instanceof Error && "field" in error
        ? String((error as { field?: string }).field ?? "")
        : "";
    return NextResponse.json({ error: message, field }, { status: 400 });
  }
}
