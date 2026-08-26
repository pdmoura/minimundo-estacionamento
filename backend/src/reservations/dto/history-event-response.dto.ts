import type {
  HistoryEvent,
  HistoryEventType,
} from '../../generated/prisma/client';

export const HISTORY_EVENT_LABELS: Record<HistoryEventType, string> = {
  RESERVATION_CREATED: 'Reserva criada',
  RESERVATION_CANCELLED: 'Reserva cancelada',
  WAITLIST_JOINED: 'Entrou na lista de espera',
  WAITLIST_LEFT: 'Saiu da lista de espera',
  WAITLIST_PROMOTED: 'Promovida da lista de espera para reserva ativa',
};

export class HistoryEventResponseDto {
  id: string;
  type: HistoryEventType;
  description: string;
  occurredAt: string;
  originEventId: string | null;
  originDescription: string | null;

  static fromEntity(
    event: HistoryEvent,
    origin?: HistoryEvent,
  ): HistoryEventResponseDto {
    return {
      id: event.id,
      type: event.type,
      description: HISTORY_EVENT_LABELS[event.type],
      occurredAt: event.occurredAt.toISOString(),
      originEventId: event.originEventId,
      originDescription: origin ? HISTORY_EVENT_LABELS[origin.type] : null,
    };
  }
}
