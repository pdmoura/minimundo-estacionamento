import { BadRequestException, NotFoundException } from '@nestjs/common';
import {
  ReservationStatus,
  type Reservation,
} from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { WaitlistService } from '../waitlist/waitlist.service';
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
  };
  const cancellationEventId = 'a1b2c3d4-0000-4000-8000-000000000001';
  const transactionClient = {
    sector: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    reservation: {
      create: jest.fn(),
      findUnique: jest.fn(),
    },
    historyEvent: {
      create: jest.fn(),
    },
    $queryRaw: jest.fn(),
  };
  const prisma = {
    $transaction: jest.fn(
      async (
        callback: (client: typeof transactionClient) => Promise<unknown>,
      ) => callback(transactionClient),
    ),
  };
  const waitlistService = {
    promoteFirstWaiting: jest.fn(),
  };
  const service = new ReservationsService(
    prisma as unknown as PrismaService,
    waitlistService as unknown as WaitlistService,
  );
  const payload: CreateReservationDto = {
    plate: 'ABC1D23',
    sectorId: reservation.sectorId,
    expectedArrivalAt: reservation.expectedArrivalAt.toISOString(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('cria a reserva após decrementar uma vaga atomicamente', async () => {
    transactionClient.sector.findUnique.mockResolvedValue({
      id: reservation.sectorId,
    });
    transactionClient.$queryRaw.mockResolvedValue([
      { id: reservation.sectorId },
    ]);
    transactionClient.reservation.create.mockResolvedValue(reservation);
    transactionClient.historyEvent.create.mockResolvedValue({
      id: cancellationEventId,
    });

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

  it('cancela uma reserva ativa e devolve uma vaga quando nÃ£o hÃ¡ fila', async () => {
    transactionClient.$queryRaw.mockResolvedValue([
      { ...reservation, status: ReservationStatus.CANCELLED },
    ]);
    waitlistService.promoteFirstWaiting.mockResolvedValue(null);
    transactionClient.sector.update.mockResolvedValue({});
    transactionClient.historyEvent.create.mockResolvedValue({
      id: cancellationEventId,
    });

    await expect(service.cancel(reservation.id)).resolves.toMatchObject({
      id: reservation.id,
      status: ReservationStatus.CANCELLED,
    });
    expect(transactionClient.sector.update).toHaveBeenCalledWith({
      where: { id: reservation.sectorId },
      data: { availableSpots: { increment: 1 } },
    });
    expect(waitlistService.promoteFirstWaiting).toHaveBeenCalledWith(
      transactionClient,
      reservation.sectorId,
      cancellationEventId,
    );
  });

  it('cancela uma reserva ativa e promove a primeira entrada da fila', async () => {
    transactionClient.$queryRaw.mockResolvedValue([
      { ...reservation, status: ReservationStatus.CANCELLED },
    ]);
    waitlistService.promoteFirstWaiting.mockResolvedValue({});
    transactionClient.historyEvent.create.mockResolvedValue({
      id: cancellationEventId,
    });

    await expect(service.cancel(reservation.id)).resolves.toMatchObject({
      id: reservation.id,
      status: ReservationStatus.CANCELLED,
    });
    expect(waitlistService.promoteFirstWaiting).toHaveBeenCalledWith(
      transactionClient,
      reservation.sectorId,
      cancellationEventId,
    );
    expect(transactionClient.sector.update).not.toHaveBeenCalled();
  });

  it('recusa o segundo cancelamento', async () => {
    transactionClient.$queryRaw.mockResolvedValue([]);
    transactionClient.reservation.findUnique.mockResolvedValue({
      id: reservation.id,
    });

    await expect(service.cancel(reservation.id)).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(transactionClient.sector.update).not.toHaveBeenCalled();
    expect(waitlistService.promoteFirstWaiting).not.toHaveBeenCalled();
  });

  it('recusa o cancelamento de uma reserva inexistente sem promover ninguÃ©m', async () => {
    transactionClient.$queryRaw.mockResolvedValue([]);
    transactionClient.reservation.findUnique.mockResolvedValue(null);

    await expect(service.cancel(reservation.id)).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(transactionClient.sector.update).not.toHaveBeenCalled();
    expect(waitlistService.promoteFirstWaiting).not.toHaveBeenCalled();
  });
});
