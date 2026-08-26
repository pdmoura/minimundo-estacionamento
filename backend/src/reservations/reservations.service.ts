import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ReservationResponseDto } from './dto/reservation-response.dto';

@Injectable()
export class ReservationsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(): Promise<ReservationResponseDto[]> {
    const reservations = await this.prisma.reservation.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return reservations.map((reservation) =>
      ReservationResponseDto.fromEntity(reservation),
    );
  }

  async cancel(id: string): Promise<ReservationResponseDto> {
    return this.prisma.$transaction(async (tx) => {
      const reservation = await tx.reservation.findUnique({ where: { id } });

      if (!reservation) {
        throw new BadRequestException({
          code: 'RESERVATION_NOT_FOUND',
          message: 'Reserva não encontrada.',
        });
      }

      const { count } = await tx.reservation.updateMany({
        where: { id, status: 'ACTIVE' },
        data: { status: 'CANCELLED' },
      });

      if (count === 0) {
        throw new BadRequestException({
          code: 'RESERVATION_ALREADY_CANCELLED',
          message: 'Reserva já cancelada.',
        });
      }

      await tx.sector.update({
        where: { id: reservation.sectorId },
        data: { availableSpots: { increment: 1 } },
      });

      await tx.historyEvent.create({
        data: {
          type: 'RESERVATION_CANCELLED',
          reservationId: id,
        },
      });

      const cancelled = await tx.reservation.findUniqueOrThrow({
        where: { id },
      });

      return ReservationResponseDto.fromEntity(cancelled);
    });
  }
}
