import type {
  HistoryEvent,
  HistoryEventType,
} from '../../generated/prisma/client';

export class HistoryEventResponseDto {
  id: string;
  type: HistoryEventType;
  occurredAt: string;
  originEventId: string | null;

  static fromEntity(event: HistoryEvent): HistoryEventResponseDto {
    return {
      id: event.id,
      type: event.type,
      occurredAt: event.occurredAt.toISOString(),
      originEventId: event.originEventId,
    };
  }
}
