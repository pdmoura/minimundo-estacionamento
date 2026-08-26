import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  HistoryEventType,
  Prisma,
  ReservationStatus,
  type Reservation,
} from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { WaitlistService } from '../waitlist/waitlist.service';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { ReservationResponseDto } from './dto/reservation-response.dto';

@Injectable()
export class ReservationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly waitlistService: WaitlistService,
  ) {}

  async findAll(): Promise<ReservationResponseDto[]> {
    const reservations = await this.prisma.reservation.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return reservations.map((reservation) =>
      ReservationResponseDto.fromEntity(reservation),
    );
  }

  async create(data: CreateReservationDto): Promise<ReservationResponseDto> {
    const expectedArrivalAt = new Date(data.expectedArrivalAt);

    if (expectedArrivalAt <= new Date()) {
      throw new BadRequestException({
        code: 'ARRIVAL_IN_THE_PAST',
        message: 'A data prevista de chegada deve estar no futuro.',
        fields: {
          expectedArrivalAt: 'A data prevista de chegada deve estar no futuro.',
        },
      });
    }

    try {
      const reservation = await this.prisma.$transaction(async (tx) => {
        const sector = await tx.sector.findUnique({
          where: { id: data.sectorId },
          select: { id: true },
        });

        if (!sector) {
          throw new NotFoundException({
            code: 'SECTOR_NOT_FOUND',
            message: 'Setor não encontrado.',
          });
        }

        const updatedSectors = await tx.$queryRaw<Array<{ id: string }>>`
          UPDATE "Sector"
          SET "availableSpots" = "availableSpots" - 1
          WHERE "id" = ${data.sectorId}::uuid
            AND "availableSpots" > 0
          RETURNING "id"
        `;

        if (updatedSectors.length === 0) {
          throw new BadRequestException({
            code: 'SECTOR_FULL',
            message: 'Setor sem vaga disponível.',
          });
        }

        const created = await tx.reservation.create({
          data: {
            plate: data.plate.trim().toUpperCase(),
            sectorId: data.sectorId,
            expectedArrivalAt,
          },
        });

        await tx.historyEvent.create({
          data: {
            type: HistoryEventType.RESERVATION_CREATED,
            reservationId: created.id,
          },
        });

        return created;
      });

      return ReservationResponseDto.fromEntity(reservation);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new BadRequestException({
          code: 'ACTIVE_RESERVATION_EXISTS',
          message: 'Esta placa já possui uma reserva ativa.',
          fields: { plate: 'Esta placa já possui uma reserva ativa.' },
        });
      }

      throw error;
    }
  }

  async cancel(id: string): Promise<ReservationResponseDto> {
    const reservation = await this.prisma.$transaction(async (tx) => {
      const updatedReservations = await tx.$queryRaw<Reservation[]>`
        UPDATE "Reservation"
        SET "status" = 'CANCELLED'
        WHERE "id" = ${id}::uuid
          AND "status" = 'ACTIVE'
        RETURNING *
      `;

      if (updatedReservations.length === 0) {
        const existing = await tx.reservation.findUnique({
          where: { id },
          select: { id: true },
        });

        if (!existing) {
          throw new NotFoundException({
            code: 'RESERVATION_NOT_FOUND',
            message: 'Reserva não encontrada.',
          });
        }

        throw new BadRequestException({
          code: 'RESERVATION_ALREADY_CANCELLED',
          message: 'A reserva já foi cancelada.',
        });
      }

      const updated = updatedReservations[0];
      const promotion = await this.waitlistService.promoteFirstWaiting(
        tx,
        updated.sectorId,
      );

      if (!promotion) {
        await tx.sector.update({
          where: { id: updated.sectorId },
          data: { availableSpots: { increment: 1 } },
        });
      }

      await tx.historyEvent.create({
        data: {
          type: HistoryEventType.RESERVATION_CANCELLED,
          reservationId: updated.id,
        },
      });

      return {
        ...updated,
        status: ReservationStatus.CANCELLED,
      };
    });

    return ReservationResponseDto.fromEntity(reservation);
  }
}
