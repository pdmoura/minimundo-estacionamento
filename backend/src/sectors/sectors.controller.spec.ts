import { CreateSectorDto } from './dto/create-sector.dto';
import { SectorResponseDto } from './dto/sector-response.dto';
import { SectorsController } from './sectors.controller';
import { SectorsService } from './sectors.service';

describe('SectorsController', () => {
  const sector: SectorResponseDto = {
    id: '9c9999e1-d70a-4764-a884-769889aeb960',
    name: 'Setor A',
    location: 'Piso térreo',
    reservableQuota: 20,
    availableSpots: 20,
    hourlyRate: 10,
    createdAt: '2026-08-26T13:00:00.000Z',
  };

  const sectorsService = {
    findAll: jest.fn<Promise<SectorResponseDto[]>, []>(),
    create: jest.fn<Promise<SectorResponseDto>, [CreateSectorDto]>(),
  };

  const controller = new SectorsController(
    sectorsService as unknown as SectorsService,
  );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('retorna a lista no envelope data', async () => {
    sectorsService.findAll.mockResolvedValue([sector]);

    await expect(controller.findAll()).resolves.toEqual({ data: [sector] });
  });

  it('retorna o setor criado no envelope data', async () => {
    const payload: CreateSectorDto = {
      name: 'Setor A',
      location: 'Piso térreo',
      reservableQuota: 20,
      hourlyRate: 10,
    };
    sectorsService.create.mockResolvedValue(sector);

    await expect(controller.create(payload)).resolves.toEqual({ data: sector });
    expect(sectorsService.create).toHaveBeenCalledWith(payload);
  });
});
