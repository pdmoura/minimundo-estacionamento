import { Body, Controller, Get, Post } from '@nestjs/common';
import { CreateSectorDto } from './dto/create-sector.dto';
import { SectorResponseDto } from './dto/sector-response.dto';
import { SectorsService } from './sectors.service';

interface ApiResponse<T> {
  data: T;
}

@Controller('sectors')
export class SectorsController {
  constructor(private readonly sectorsService: SectorsService) {}

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
