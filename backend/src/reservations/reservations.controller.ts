import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
} from '@nestjs/common';
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
    return {
      data: await this.reservationsService.findAll(),
    };
  }

  @Post(':id/cancel')
  @HttpCode(HttpStatus.OK)
  async cancel(
    @Param('id') id: string,
  ): Promise<ApiResponse<ReservationResponseDto>> {
    return {
      data: await this.reservationsService.cancel(id),
    };
  }
}
