import { ReservationResponseDto } from './dto/reservation-response.dto';
import { ReservationsController } from './reservations.controller';
import { ReservationsService } from './reservations.service';

describe('ReservationsController', () => {
  const reservation: ReservationResponseDto = {
    id: '9c9999e1-d70a-4764-a884-769889aeb960',
    plate: 'ABC-1234',
    sectorId: 'b3b1c7a2-1234-4a1a-9a1a-abcdefabcdef',
    expectedArrivalAt: '2026-08-27T15:30:00.000Z',
    status: 'ACTIVE',
    createdAt: '2026-08-26T13:00:00.000Z',
  };

  const reservationsService = {
    findAll: jest.fn<Promise<ReservationResponseDto[]>, []>(),
    cancel: jest.fn<Promise<ReservationResponseDto>, [string]>(),
  };

  const controller = new ReservationsController(
    reservationsService as unknown as ReservationsService,
  );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('retorna a lista no envelope data', async () => {
    reservationsService.findAll.mockResolvedValue([reservation]);

    await expect(controller.findAll()).resolves.toEqual({
      data: [reservation],
    });
  });

  it('retorna a reserva cancelada no envelope data', async () => {
    const cancelled = { ...reservation, status: 'CANCELLED' as const };
    reservationsService.cancel.mockResolvedValue(cancelled);

    await expect(controller.cancel(reservation.id)).resolves.toEqual({
      data: cancelled,
    });
    expect(reservationsService.cancel).toHaveBeenCalledWith(reservation.id);
  });
});
