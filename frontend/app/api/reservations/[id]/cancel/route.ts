import { NextResponse } from "next/server";

import { cancelReservation } from "@/lib/reservations/store";

export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;

  try {
    const reservation = cancelReservation(id);
    return NextResponse.json({ data: reservation });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Não foi possível cancelar a reserva.";
    const status =
      error instanceof Error && "status" in error
        ? Number((error as { status?: number }).status) || 400
        : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
