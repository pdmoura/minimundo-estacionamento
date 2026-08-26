import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { ReservationResponseDto } from './dto/reservation-response.dto';
import { ReservationsService } from './reservations.service';

interface ApiResponse<T> {
  data: T;
}

@Controller('reservations')
export class ReservationsController {
  constructor(private readonly reservationsService: ReservationsService) {}

  @Get()
  async findAll(): Promise<ApiResponse<ReservationResponseDto[]>> {
    return { data: await this.reservationsService.findAll() };
  }

  @Post()
  async create(
    @Body() data: CreateReservationDto,
  ): Promise<ApiResponse<ReservationResponseDto>> {
    return { data: await this.reservationsService.create(data) };
  }

  @Post(':id/cancel')
  @HttpCode(HttpStatus.OK)
  async cancel(
    @Param('id', new ParseUUIDPipe()) id: string,
  ): Promise<ApiResponse<ReservationResponseDto>> {
    return { data: await this.reservationsService.cancel(id) };
  }
}
