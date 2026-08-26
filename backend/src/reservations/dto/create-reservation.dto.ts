import { Transform, type TransformFnParams } from 'class-transformer';
import {
  IsISO8601,
  IsNotEmpty,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

function normalizePlate({ value }: TransformFnParams): unknown {
  const input = value as unknown;
  return typeof input === 'string' ? input.trim().toUpperCase() : input;
}

export class CreateReservationDto {
  @Transform(normalizePlate)
  @IsString({ message: 'A placa deve ser um texto.' })
  @IsNotEmpty({ message: 'A placa é obrigatória.' })
  @MaxLength(10, { message: 'A placa deve ter no máximo 10 caracteres.' })
  plate: string;

  @IsUUID('4', { message: 'O setor informado é inválido.' })
  sectorId: string;

  @IsISO8601(
    { strict: true },
    { message: 'A data prevista de chegada deve estar no formato ISO 8601.' },
  )
  expectedArrivalAt: string;
}
