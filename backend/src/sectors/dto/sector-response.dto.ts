import type { Sector } from '../../generated/prisma/client';

export class SectorResponseDto {
  id: string;
  name: string;
  location: string;
  reservableQuota: number;
  availableSpots: number;
  hourlyRate: number;
  createdAt: string;

  static fromEntity(sector: Sector): SectorResponseDto {
    return {
      id: sector.id,
      name: sector.name,
      location: sector.location,
      reservableQuota: sector.reservableQuota,
      availableSpots: sector.availableSpots,
      hourlyRate: sector.hourlyRate.toNumber(),
      createdAt: sector.createdAt.toISOString(),
    };
  }
}
