import { NextResponse } from "next/server";

import { addSector, listSectors } from "@/lib/sectors/store";
import type { Sector } from "@/lib/sectors/types";

export async function GET() {
  return NextResponse.json(listSectors());
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const name = typeof body.name === "string" ? body.name : "";
  const location = typeof body.location === "string" ? body.location : "";
  const quota = Number(body.quota);
  const hourlyRate = Number(body.hourlyRate);

  if (!name.trim()) {
    return NextResponse.json(
      { error: "Informe o nome do setor.", field: "name" },
      { status: 400 },
    );
  }

  if (!Number.isInteger(quota) || quota < 1) {
    return NextResponse.json(
      { error: "A cota de vagas deve ser no mínimo 1.", field: "quota" },
      { status: 400 },
    );
  }

  if (!Number.isFinite(hourlyRate) || hourlyRate < 0) {
    return NextResponse.json(
      { error: "A tarifa por hora não pode ser negativa.", field: "hourlyRate" },
      { status: 400 },
    );
  }

  const sector: Sector = {
    id: crypto.randomUUID(),
    name: name.trim(),
    location: location.trim(),
    quota,
    availableQuota: quota,
    hourlyRate,
    createdAt: new Date().toISOString(),
  };

  addSector(sector);
  return NextResponse.json(sector, { status: 201 });
}
