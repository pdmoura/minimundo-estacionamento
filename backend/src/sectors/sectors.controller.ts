import { Body, Controller, Get, Post } from '@nestjs/common';
import { CreateSectorDto } from './dto/create-sector.dto';
import { SectorRankingDto } from './dto/sector-ranking.dto';
import { SectorResponseDto } from './dto/sector-response.dto';
import { SectorsService } from './sectors.service';

interface ApiResponse<T> {
  data: T;
}

@Controller('sectors')
export class SectorsController {
  constructor(private readonly sectorsService: SectorsService) {}

  // Precisa vir antes de qualquer @Get(':id'), senão o Nest casa "ranking"
  // como parâmetro de rota e a validação de UUID quebra.
  @Get('ranking')
  async ranking(): Promise<ApiResponse<SectorRankingDto[]>> {
    return {
      data: await this.sectorsService.ranking(),
    };
  }

  @Get()
  async findAll(): Promise<ApiResponse<SectorResponseDto[]>> {
    return {
      data: await this.sectorsService.findAll(),
    };
  }

  @Post()
  async create(
    @Body() data: CreateSectorDto,
  ): Promise<ApiResponse<SectorResponseDto>> {
    return {
      data: await this.sectorsService.create(data),
    };
  }
}
