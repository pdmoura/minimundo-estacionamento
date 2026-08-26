import { BadRequestException, NotFoundException } from '@nestjs/common';
import {
  ReservationStatus,
  WaitlistStatus,
  type Reservation,
  type WaitlistEntry,
} from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateWaitlistEntryDto } from './dto/create-waitlist-entry.dto';
import { WaitlistService } from './waitlist.service';

describe('WaitlistService', () => {
  const sectorId = '9c9999e1-d70a-4764-a884-769889aeb960';
  const entryId = '37bb275b-b795-4db4-9ac9-64fd0de2b324';
  const now = new Date('2026-08-26T14:00:00.000Z');
  const entry: WaitlistEntry = {
    id: entryId,
    plate: 'ABC1D23',
    sectorId,
    expectedArrivalAt: new Date('2099-08-27T15:00:00.000Z'),
    status: WaitlistStatus.WAITING,
    createdAt: now,
  };
  const reservation: Reservation = {
    id: '7d31f25a-04a6-46ea-b08f-15dd2b1602a9',
    plate: entry.plate,
    sectorId,
    expectedArrivalAt: entry.expectedArrivalAt,
    status: ReservationStatus.ACTIVE,
    createdAt: now,
  };
  const transactionClient = {
    sector: { findUnique: jest.fn() },
    reservation: { findFirst: jest.fn(), create: jest.fn() },
    waitlistEntry: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
    historyEvent: { create: jest.fn() },
  };
  const prisma = {
    sector: { findUnique: jest.fn() },
    waitlistEntry: { findMany: jest.fn() },
    $transaction: jest.fn(
      async (
        callback: (client: typeof transactionClient) => Promise<unknown>,
      ) => callback(transactionClient),
    ),
  };
  const service = new WaitlistService(prisma as unknown as PrismaService);
  const payload: CreateWaitlistEntryDto = {
    plate: entry.plate,
    expectedArrivalAt: entry.expectedArrivalAt.toISOString(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('cria uma entrada WAITING sem alterar vagas e registra o histórico', async () => {
    transactionClient.sector.findUnique.mockResolvedValue({
      id: sectorId,
      availableSpots: 0,
    });
    transactionClient.reservation.findFirst.mockResolvedValue(null);
    transactionClient.waitlistEntry.findFirst.mockResolvedValue(null);
    transactionClient.waitlistEntry.create.mockResolvedValue(entry);
    transactionClient.historyEvent.create.mockResolvedValue({});

    await expect(service.join(sectorId, payload)).resolves.toMatchObject({
      id: entry.id,
      status: WaitlistStatus.WAITING,
    });
    expect(transactionClient.waitlistEntry.create).toHaveBeenCalledWith({
      data: {
        plate: entry.plate,
        sectorId,
        expectedArrivalAt: entry.expectedArrivalAt,
      },
    });
    expect(transactionClient.historyEvent.create).toHaveBeenCalledWith({
      data: {
        type: 'WAITLIST_JOINED',
        waitlistEntryId: entry.id,
      },
    });
  });

  it('recusa entrada quando o setor ainda possui vagas', async () => {
    transactionClient.sector.findUnique.mockResolvedValue({
      id: sectorId,
      availableSpots: 1,
    });

    await expect(service.join(sectorId, payload)).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(transactionClient.waitlistEntry.create).not.toHaveBeenCalled();
  });

  it('recusa placa com reserva ativa', async () => {
    transactionClient.sector.findUnique.mockResolvedValue({
      id: sectorId,
      availableSpots: 0,
    });
    transactionClient.reservation.findFirst.mockResolvedValue({ id: reservation.id });

    await expect(service.join(sectorId, payload)).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(transactionClient.waitlistEntry.create).not.toHaveBeenCalled();
  });

  it('recusa placa que já está aguardando no mesmo setor', async () => {
    transactionClient.sector.findUnique.mockResolvedValue({
      id: sectorId,
      availableSpots: 0,
    });
    transactionClient.reservation.findFirst.mockResolvedValue(null);
    transactionClient.waitlistEntry.findFirst.mockResolvedValue({ id: entry.id });

    await expect(service.join(sectorId, payload)).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('recusa data prevista no passado antes de abrir transação', async () => {
    await expect(
      service.join(sectorId, {
        ...payload,
        expectedArrivalAt: '2020-01-01T00:00:00.000Z',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('lista somente entradas WAITING em ordem de criação', async () => {
    prisma.sector.findUnique.mockResolvedValue({ id: sectorId });
    prisma.waitlistEntry.findMany.mockResolvedValue([entry]);

    await expect(service.findAll(sectorId)).resolves.toHaveLength(1);
    expect(prisma.waitlistEntry.findMany).toHaveBeenCalledWith({
      where: { sectorId, status: WaitlistStatus.WAITING },
      orderBy: { createdAt: 'asc' },
    });
  });

  it('retorna lista vazia quando o setor não tem ninguém aguardando', async () => {
    prisma.sector.findUnique.mockResolvedValue({ id: sectorId });
    prisma.waitlistEntry.findMany.mockResolvedValue([]);

    await expect(service.findAll(sectorId)).resolves.toEqual([]);
  });

  it('recusa listagem de setor inexistente', async () => {
    prisma.sector.findUnique.mockResolvedValue(null);

    await expect(service.findAll(sectorId)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('marca uma entrada WAITING como LEFT e registra o histórico', async () => {
    transactionClient.waitlistEntry.updateMany.mockResolvedValue({ count: 1 });
    transactionClient.waitlistEntry.findUnique.mockResolvedValue({
      ...entry,
      status: WaitlistStatus.LEFT,
    });
    transactionClient.historyEvent.create.mockResolvedValue({});

    await expect(service.leave(sectorId, entryId)).resolves.toMatchObject({
      id: entryId,
      status: WaitlistStatus.LEFT,
    });
    expect(transactionClient.waitlistEntry.updateMany).toHaveBeenCalledWith({
      where: { id: entryId, sectorId, status: WaitlistStatus.WAITING },
      data: { status: WaitlistStatus.LEFT },
    });
    expect(transactionClient.historyEvent.create).toHaveBeenCalledWith({
      data: { type: 'WAITLIST_LEFT', waitlistEntryId: entryId },
    });
  });

  it('promove a primeira entrada WAITING sem alterar vagas', async () => {
    transactionClient.waitlistEntry.findFirst.mockResolvedValue(entry);
    transactionClient.waitlistEntry.update.mockResolvedValue({
      ...entry,
      status: WaitlistStatus.PROMOTED,
    });
    transactionClient.reservation.create.mockResolvedValue(reservation);
    transactionClient.historyEvent.create.mockResolvedValue({});

    await expect(
      service.promoteFirstWaiting(
        transactionClient as never,
        sectorId,
      ),
    ).resolves.toMatchObject({
      entry: { status: WaitlistStatus.PROMOTED },
      reservation: { status: ReservationStatus.ACTIVE },
    });
    expect(transactionClient.waitlistEntry.findFirst).toHaveBeenCalledWith({
      where: { sectorId, status: WaitlistStatus.WAITING },
      orderBy: { createdAt: 'asc' },
    });
  });
});
