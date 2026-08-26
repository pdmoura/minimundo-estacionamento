import { BadRequestException } from '@nestjs/common';
import {
  ReservationStatus,
  type Reservation,
} from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { ReservationsService } from './reservations.service';

describe('ReservationsService', () => {
  const now = new Date('2026-08-26T14:00:00.000Z');
  const reservation: Reservation = {
    id: '37bb275b-b795-4db4-9ac9-64fd0de2b324',
    plate: 'ABC1D23',
    sectorId: '9c9999e1-d70a-4764-a884-769889aeb960',
    expectedArrivalAt: new Date('2099-08-27T15:00:00.000Z'),
    status: ReservationStatus.ACTIVE,
    createdAt: now,
    cancelledAt: null,
  };
  const transactionClient = {
    sector: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    reservation: {
      create: jest.fn(),
      findUniqueOrThrow: jest.fn(),
      updateMany: jest.fn(),
    },
    historyEvent: {
      create: jest.fn(),
    },
    $queryRaw: jest.fn(),
  };
  const prisma = {
    reservation: {
      findMany: jest.fn(),
    },
    $transaction: jest.fn(
      async (
        callback: (client: typeof transactionClient) => Promise<unknown>,
      ) => callback(transactionClient),
    ),
  };
  const service = new ReservationsService(prisma as unknown as PrismaService);
  const payload: CreateReservationDto = {
    plate: 'ABC1D23',
    sectorId: reservation.sectorId,
    expectedArrivalAt: reservation.expectedArrivalAt.toISOString(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('lista reservas da mais recente para a mais antiga', async () => {
    prisma.reservation.findMany.mockResolvedValue([reservation]);

    await expect(service.findAll()).resolves.toEqual([
      expect.objectContaining({ id: reservation.id }),
    ]);
    expect(prisma.reservation.findMany).toHaveBeenCalledWith({
      orderBy: { createdAt: 'desc' },
    });
  });

  it('cria a reserva após decrementar uma vaga atomicamente', async () => {
    transactionClient.sector.findUnique.mockResolvedValue({
      id: reservation.sectorId,
    });
    transactionClient.$queryRaw.mockResolvedValue([
      { id: reservation.sectorId },
    ]);
    transactionClient.reservation.create.mockResolvedValue(reservation);
    transactionClient.historyEvent.create.mockResolvedValue({});

    await expect(service.create(payload)).resolves.toMatchObject({
      id: reservation.id,
      plate: reservation.plate,
      status: ReservationStatus.ACTIVE,
    });
    expect(transactionClient.$queryRaw).toHaveBeenCalledTimes(1);
    expect(transactionClient.historyEvent.create).toHaveBeenCalledTimes(1);
  });

  it('recusa reserva quando o decremento não encontra vaga', async () => {
    transactionClient.sector.findUnique.mockResolvedValue({
      id: reservation.sectorId,
    });
    transactionClient.$queryRaw.mockResolvedValue([]);

    await expect(service.create(payload)).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(transactionClient.reservation.create).not.toHaveBeenCalled();
  });

  it('recusa data prevista no passado antes de abrir transação', async () => {
    await expect(
      service.create({
        ...payload,
        expectedArrivalAt: '2020-01-01T00:00:00.000Z',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('cancela uma reserva ativa e devolve uma vaga', async () => {
    transactionClient.reservation.updateMany.mockResolvedValue({ count: 1 });
    transactionClient.reservation.findUniqueOrThrow.mockResolvedValue({
      ...reservation,
      status: ReservationStatus.CANCELLED,
      cancelledAt: now,
    });
    transactionClient.sector.update.mockResolvedValue({});
    transactionClient.historyEvent.create.mockResolvedValue({});

    await expect(service.cancel(reservation.id)).resolves.toMatchObject({
      id: reservation.id,
      status: ReservationStatus.CANCELLED,
    });
    expect(transactionClient.sector.update).toHaveBeenCalledWith({
      where: { id: reservation.sectorId },
      data: { availableSpots: { increment: 1 } },
    });
  });

  it('recusa o segundo cancelamento', async () => {
    transactionClient.reservation.updateMany.mockResolvedValue({ count: 0 });

    await expect(service.cancel(reservation.id)).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(transactionClient.sector.update).not.toHaveBeenCalled();
  });
});
