import { NextResponse } from "next/server";

import { getReservation, listHistory } from "@/lib/reservations/store";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const reservation = getReservation(id);

  if (!reservation) {
    return NextResponse.json(
      { error: "Reserva não encontrada." },
      { status: 404 },
    );
  }

  return NextResponse.json({
    data: {
      reservation,
      events: listHistory(id),
    },
  });
}
