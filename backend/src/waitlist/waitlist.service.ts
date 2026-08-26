import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  HistoryEventType,
  Prisma,
  ReservationStatus,
  WaitlistStatus,
  type Reservation,
  type WaitlistEntry,
} from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateWaitlistEntryDto } from './dto/create-waitlist-entry.dto';
import { WaitlistEntryResponseDto } from './dto/waitlist-entry-response.dto';

@Injectable()
export class WaitlistService {
  constructor(private readonly prisma: PrismaService) {}

  async join(
    sectorId: string,
    data: CreateWaitlistEntryDto,
  ): Promise<WaitlistEntryResponseDto> {
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

    const entry = await this.prisma.$transaction(async (tx) => {
      const sector = await tx.sector.findUnique({
        where: { id: sectorId },
        select: { id: true, availableSpots: true },
      });

      if (!sector) {
        throw new NotFoundException({
          code: 'SECTOR_NOT_FOUND',
          message: 'Setor não encontrado.',
        });
      }

      if (sector.availableSpots !== 0) {
        throw new BadRequestException({
          code: 'SECTOR_HAS_AVAILABLE_SPOTS',
          message: 'O setor ainda possui vagas disponíveis.',
        });
      }

      const activeReservation = await tx.reservation.findFirst({
        where: { plate: data.plate, status: ReservationStatus.ACTIVE },
        select: { id: true },
      });

      if (activeReservation) {
        throw new BadRequestException({
          code: 'ACTIVE_RESERVATION_EXISTS',
          message: 'Esta placa já possui uma reserva ativa.',
          fields: { plate: 'Esta placa já possui uma reserva ativa.' },
        });
      }

      const existingEntry = await tx.waitlistEntry.findFirst({
        where: { plate: data.plate, sectorId, status: WaitlistStatus.WAITING },
        select: { id: true },
      });

      if (existingEntry) {
        throw new BadRequestException({
          code: 'WAITLIST_ENTRY_EXISTS',
          message: 'Esta placa já está na fila deste setor.',
          fields: { plate: 'Esta placa já está na fila deste setor.' },
        });
      }

      const created = await tx.waitlistEntry.create({
        data: {
          plate: data.plate,
          sectorId,
          expectedArrivalAt,
        },
      });

      await tx.historyEvent.create({
        data: {
          type: HistoryEventType.WAITLIST_JOINED,
          waitlistEntryId: created.id,
        },
      });

      return created;
    });

    return WaitlistEntryResponseDto.fromEntity(entry);
  }

  async findAll(sectorId: string): Promise<WaitlistEntryResponseDto[]> {
    const sector = await this.prisma.sector.findUnique({
      where: { id: sectorId },
      select: { id: true },
    });

    if (!sector) {
      throw new NotFoundException({
        code: 'SECTOR_NOT_FOUND',
        message: 'Setor não encontrado.',
      });
    }

    const entries = await this.prisma.waitlistEntry.findMany({
      where: { sectorId, status: WaitlistStatus.WAITING },
      orderBy: { createdAt: 'asc' },
    });

    return entries.map((entry) => WaitlistEntryResponseDto.fromEntity(entry));
  }

  async leave(
    sectorId: string,
    entryId: string,
  ): Promise<WaitlistEntryResponseDto> {
    const entry = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.waitlistEntry.updateMany({
        where: { id: entryId, sectorId, status: WaitlistStatus.WAITING },
        data: { status: WaitlistStatus.LEFT },
      });

      if (updated.count === 0) {
        const existingEntry = await tx.waitlistEntry.findFirst({
          where: { id: entryId, sectorId },
          select: { id: true },
        });

        if (!existingEntry) {
          throw new NotFoundException({
            code: 'WAITLIST_ENTRY_NOT_FOUND',
            message: 'Entrada da fila não encontrada.',
          });
        }

        throw new BadRequestException({
          code: 'WAITLIST_ENTRY_NOT_WAITING',
          message: 'A entrada não está aguardando na fila.',
        });
      }

      const leftEntry = await tx.waitlistEntry.findUnique({
        where: { id: entryId },
      });

      if (!leftEntry) {
        throw new NotFoundException({
          code: 'WAITLIST_ENTRY_NOT_FOUND',
          message: 'Entrada da fila não encontrada.',
        });
      }

      await tx.historyEvent.create({
        data: {
          type: HistoryEventType.WAITLIST_LEFT,
          waitlistEntryId: leftEntry.id,
        },
      });

      return leftEntry;
    });

    return WaitlistEntryResponseDto.fromEntity(entry);
  }

  async promoteFirstWaiting(
    tx: Prisma.TransactionClient,
    sectorId: string,
  ): Promise<{ entry: WaitlistEntry; reservation: Reservation } | null> {
    const entry = await tx.waitlistEntry.findFirst({
      where: { sectorId, status: WaitlistStatus.WAITING },
      orderBy: { createdAt: 'asc' },
    });

    if (!entry) {
      return null;
    }

    const promotedEntry = await tx.waitlistEntry.update({
      where: { id: entry.id },
      data: { status: WaitlistStatus.PROMOTED },
    });

    const reservation = await tx.reservation.create({
      data: {
        plate: entry.plate,
        sectorId: entry.sectorId,
        expectedArrivalAt: entry.expectedArrivalAt,
      },
    });

    await tx.historyEvent.create({
      data: {
        type: HistoryEventType.WAITLIST_PROMOTED,
        waitlistEntryId: promotedEntry.id,
      },
    });
    await tx.historyEvent.create({
      data: {
        type: HistoryEventType.RESERVATION_CREATED,
        reservationId: reservation.id,
      },
    });

    return { entry: promotedEntry, reservation };
  }
}
