import { CreateWaitlistEntryDto } from './dto/create-waitlist-entry.dto';
import { WaitlistEntryResponseDto } from './dto/waitlist-entry-response.dto';
import { WaitlistController } from './waitlist.controller';
import { WaitlistService } from './waitlist.service';

describe('WaitlistController', () => {
  const sectorId = '9c9999e1-d70a-4764-a884-769889aeb960';
  const entryId = '37bb275b-b795-4db4-9ac9-64fd0de2b324';
  const entry: WaitlistEntryResponseDto = {
    id: entryId,
    plate: 'ABC1D23',
    sectorId,
    expectedArrivalAt: '2099-08-27T15:00:00.000Z',
    status: 'WAITING',
    createdAt: '2026-08-26T14:00:00.000Z',
  };
  const waitlistService = {
    join: jest.fn<Promise<WaitlistEntryResponseDto>, [string, CreateWaitlistEntryDto]>(),
    findAll: jest.fn<Promise<WaitlistEntryResponseDto[]>, [string]>(),
    leave: jest.fn<Promise<WaitlistEntryResponseDto>, [string, string]>(),
  };
  const controller = new WaitlistController(
    waitlistService as unknown as WaitlistService,
  );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('retorna a entrada criada no envelope data', async () => {
    const payload: CreateWaitlistEntryDto = {
      plate: entry.plate,
      expectedArrivalAt: entry.expectedArrivalAt,
    };
    waitlistService.join.mockResolvedValue(entry);

    await expect(controller.join(sectorId, payload)).resolves.toEqual({
      data: entry,
    });
    expect(waitlistService.join).toHaveBeenCalledWith(sectorId, payload);
  });

  it('retorna uma fila vazia no envelope data', async () => {
    waitlistService.findAll.mockResolvedValue([]);

    await expect(controller.findAll(sectorId)).resolves.toEqual({ data: [] });
  });

  it('retorna a entrada que saiu no envelope data', async () => {
    const leftEntry = { ...entry, status: 'LEFT' as const };
    waitlistService.leave.mockResolvedValue(leftEntry);

    await expect(controller.leave(sectorId, entryId)).resolves.toEqual({
      data: leftEntry,
    });
    expect(waitlistService.leave).toHaveBeenCalledWith(sectorId, entryId);
  });
});
