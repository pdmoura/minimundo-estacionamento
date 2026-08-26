import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  HistoryEventType,
  Prisma,
  ReservationStatus,
  type HistoryEvent,
  type Reservation,
} from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { WaitlistService } from '../waitlist/waitlist.service';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { HistoryEventResponseDto } from './dto/history-event-response.dto';
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

      // O cancelamento é gravado antes da promoção para que a promoção possa
      // apontar de volta para ele via originEventId, que é o que responde
      // "qual cancelamento liberou esta vaga" no histórico.
      const cancellationEvent = await tx.historyEvent.create({
        data: {
          type: HistoryEventType.RESERVATION_CANCELLED,
          reservationId: updated.id,
        },
      });

      const promotion = await this.waitlistService.promoteFirstWaiting(
        tx,
        updated.sectorId,
        cancellationEvent.id,
      );

      // Quando alguém é promovido, a vaga passa direto para essa pessoa e a
      // cota do setor não muda.
      if (!promotion) {
        await tx.sector.update({
          where: { id: updated.sectorId },
          data: { availableSpots: { increment: 1 } },
        });
      }

      return {
        ...updated,
        status: ReservationStatus.CANCELLED,
      };
    });

    return ReservationResponseDto.fromEntity(reservation);
  }

  async getHistory(id: string): Promise<HistoryEventResponseDto[]> {
    const reservation = await this.prisma.reservation.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!reservation) {
      throw new NotFoundException({
        code: 'RESERVATION_NOT_FOUND',
        message: 'Reserva não encontrada.',
      });
    }

    const events = await this.collectEvents(id);
    events.sort((a, b) => a.occurredAt.getTime() - b.occurredAt.getTime());

    const origins = await this.originsFor(events);

    return events.map((event) =>
      HistoryEventResponseDto.fromEntity(
        event,
        event.originEventId ? origins.get(event.originEventId) : undefined,
      ),
    );
  }

  // Uma reserva que veio da lista de espera carrega a história da espera que
  // a precedeu. Esses eventos penduram no WaitlistEntry, não na Reservation,
  // então só entram se a gente atravessar a ponte pelo evento de promoção.
  // Sem promoção, a busca extra nem acontece.
  private async collectEvents(reservationId: string): Promise<HistoryEvent[]> {
    const direct = await this.prisma.historyEvent.findMany({
      where: { reservationId },
    });

    const waitlistEntryIds = [
      ...new Set(
        direct
          .map((event) => event.waitlistEntryId)
          .filter((entryId): entryId is string => entryId !== null),
      ),
    ];

    if (waitlistEntryIds.length === 0) {
      return direct;
    }

    const fromWaitlist = await this.prisma.historyEvent.findMany({
      where: { waitlistEntryId: { in: waitlistEntryIds } },
    });

    const seen = new Set(direct.map((event) => event.id));

    return [...direct, ...fromWaitlist.filter((event) => !seen.has(event.id))];
  }

  // "A promoção indica qual cancelamento a originou": originEventId aponta
  // para o evento que disparou a promoção. Resolvemos em lote para descrever.
  private async originsFor(
    events: HistoryEvent[],
  ): Promise<Map<string, HistoryEvent>> {
    const originIds = [
      ...new Set(
        events
          .map((event) => event.originEventId)
          .filter((originId): originId is string => originId !== null),
      ),
    ];

    if (originIds.length === 0) {
      return new Map();
    }

    const origins = await this.prisma.historyEvent.findMany({
      where: { id: { in: originIds } },
    });

    return new Map(origins.map((origin) => [origin.id, origin]));
  }
}
