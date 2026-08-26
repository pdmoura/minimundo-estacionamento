import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSectorDto } from './dto/create-sector.dto';
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
