import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSectorDto } from './dto/create-sector.dto';
import { SectorRankingDto } from './dto/sector-ranking.dto';
import { SectorResponseDto } from './dto/sector-response.dto';

@Injectable()
export class SectorsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(): Promise<SectorResponseDto[]> {
    const sectors = await this.prisma.sector.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return sectors.map((sector) => SectorResponseDto.fromEntity(sector));
  }

  ranking(): Promise<SectorRankingDto[]> {
    // LEFT JOIN mantém setor sem reserva com zero; COUNT(r.id) não conta a
    // linha nula do join; ::int evita o COUNT chegar como string no front.
    return this.prisma.$queryRaw<SectorRankingDto[]>`
      SELECT s."id", s."name", s."location", COUNT(r."id")::int AS "totalReservations"
      FROM "Sector" s
      LEFT JOIN "Reservation" r ON r."sectorId" = s."id"
      GROUP BY s."id", s."name", s."location"
      ORDER BY "totalReservations" DESC, s."name"
    `;
  }

  async create(data: CreateSectorDto): Promise<SectorResponseDto> {
    const sector = await this.prisma.sector.create({
      data: {
        name: data.name,
        location: data.location,
        reservableQuota: data.reservableQuota,
        availableSpots: data.reservableQuota,
        hourlyRate: data.hourlyRate,
      },
    });

    return SectorResponseDto.fromEntity(sector);
  }
}
