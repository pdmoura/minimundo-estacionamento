import { NextResponse } from "next/server";

import {
  createReservation,
  getAvailableSpots,
  listReservations,
} from "@/lib/reservations/store";

export async function GET() {
  return NextResponse.json({ data: listReservations() });
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const plate = typeof body.plate === "string" ? body.plate : "";
  const sectorId = typeof body.sectorId === "string" ? body.sectorId : "";
  const sectorName = typeof body.sectorName === "string" ? body.sectorName : "";
  const expectedArrivalAt =
    typeof body.expectedArrivalAt === "string" ? body.expectedArrivalAt : "";
  const availableSpots = Number(body.availableSpots);

  if (!sectorId.trim()) {
    return NextResponse.json(
      { error: "Selecione o setor.", field: "sectorId" },
      { status: 400 },
    );
  }

  try {
    const reservation = createReservation({
      plate,
      sectorId,
      sectorName: sectorName.trim() || "Setor",
      expectedArrivalAt,
      availableSpots: Number.isFinite(availableSpots) ? availableSpots : 0,
    });
    return NextResponse.json(
      {
        data: reservation,
        availableSpots: getAvailableSpots(sectorId) ?? 0,
      },
      { status: 201 },
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Não foi possível registrar a reserva.";
    const field =
      error instanceof Error && "field" in error
        ? String((error as { field?: string }).field ?? "")
        : "";
    return NextResponse.json({ error: message, field }, { status: 400 });
  }
}
