import { Body, Controller, Param, ParseUUIDPipe, Post } from '@nestjs/common';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { ReservationResponseDto } from './dto/reservation-response.dto';
import { ReservationsService } from './reservations.service';

interface ApiResponse<T> {
  data: T;
}

@Controller('reservations')
export class ReservationsController {
  constructor(private readonly reservationsService: ReservationsService) {}

  @Post()
  async create(
    @Body() data: CreateReservationDto,
  ): Promise<ApiResponse<ReservationResponseDto>> {
    return { data: await this.reservationsService.create(data) };
  }

  @Post(':id/cancel')
  async cancel(
    @Param('id', new ParseUUIDPipe()) id: string,
  ): Promise<ApiResponse<ReservationResponseDto>> {
    return { data: await this.reservationsService.cancel(id) };
  }
}
