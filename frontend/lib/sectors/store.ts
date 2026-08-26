import type { Sector } from "./types";

const sectors: Sector[] = [];

export function listSectors(): Sector[] {
  return [...sectors];
}

export function addSector(sector: Sector): Sector {
  sectors.push(sector);
  return sector;
}
