import type {
  WaitlistEntry,
  WaitlistStatus,
} from '../../generated/prisma/client';

export class WaitlistEntryResponseDto {
  id: string;
  plate: string;
  sectorId: string;
  expectedArrivalAt: string;
  status: WaitlistStatus;
  createdAt: string;

  static fromEntity(entry: WaitlistEntry): WaitlistEntryResponseDto {
    return {
      id: entry.id,
      plate: entry.plate,
      sectorId: entry.sectorId,
      expectedArrivalAt: entry.expectedArrivalAt.toISOString(),
      status: entry.status,
      createdAt: entry.createdAt.toISOString(),
    };
  }
}
