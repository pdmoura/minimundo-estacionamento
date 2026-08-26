import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';
import { CreateWaitlistEntryDto } from './dto/create-waitlist-entry.dto';
import { WaitlistEntryResponseDto } from './dto/waitlist-entry-response.dto';
import { WaitlistService } from './waitlist.service';

interface ApiResponse<T> {
  data: T;
}

@Controller('sectors/:sectorId/waitlist')
export class WaitlistController {
  constructor(private readonly waitlistService: WaitlistService) {}

  @Post()
  async join(
    @Param('sectorId', new ParseUUIDPipe()) sectorId: string,
    @Body() data: CreateWaitlistEntryDto,
  ): Promise<ApiResponse<WaitlistEntryResponseDto>> {
    return { data: await this.waitlistService.join(sectorId, data) };
  }

  @Get()
  async findAll(
    @Param('sectorId', new ParseUUIDPipe()) sectorId: string,
  ): Promise<ApiResponse<WaitlistEntryResponseDto[]>> {
    return { data: await this.waitlistService.findAll(sectorId) };
  }

  @Post(':entryId/leave')
  async leave(
    @Param('sectorId', new ParseUUIDPipe()) sectorId: string,
    @Param('entryId', new ParseUUIDPipe()) entryId: string,
  ): Promise<ApiResponse<WaitlistEntryResponseDto>> {
    return { data: await this.waitlistService.leave(sectorId, entryId) };
  }
}
