import { Transform, type TransformFnParams } from 'class-transformer';
import { IsISO8601, IsNotEmpty, IsString, MaxLength } from 'class-validator';

function normalizePlate({ value }: TransformFnParams): unknown {
  return typeof value === 'string' ? value.trim().toUpperCase() : value;
}

export class CreateWaitlistEntryDto {
  @Transform(normalizePlate)
  @IsString({ message: 'A placa deve ser um texto.' })
  @IsNotEmpty({ message: 'A placa é obrigatória.' })
  @MaxLength(10, { message: 'A placa deve ter no máximo 10 caracteres.' })
  plate: string;

  @IsISO8601(
    { strict: true },
    { message: 'A data prevista de chegada deve estar no formato ISO 8601.' },
  )
  expectedArrivalAt: string;
}
