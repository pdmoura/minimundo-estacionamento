import { NextResponse } from "next/server";

import { listSectors } from "@/lib/reservations/store";

export async function GET() {
  return NextResponse.json({ data: listSectors() });
}
