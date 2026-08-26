import { Transform } from 'class-transformer';
import {
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

const trimText = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

export class CreateSectorDto {
  @Transform(trimText)
  @IsString({ message: 'O nome deve ser um texto.' })
  @IsNotEmpty({ message: 'O nome é obrigatório.' })
  @MaxLength(100, { message: 'O nome deve ter no máximo 100 caracteres.' })
  name: string;

  @Transform(trimText)
  @IsString({ message: 'A localização deve ser um texto.' })
  @IsNotEmpty({ message: 'A localização é obrigatória.' })
  @MaxLength(200, {
    message: 'A localização deve ter no máximo 200 caracteres.',
  })
  location: string;

  @IsInt({ message: 'A cota de reservas deve ser um número inteiro.' })
  @Min(0, { message: 'A cota de reservas não pode ser negativa.' })
  reservableQuota: number;

  @IsNumber(
    { allowInfinity: false, allowNaN: false, maxDecimalPlaces: 2 },
    { message: 'A tarifa por hora deve ser um número com até 2 decimais.' },
  )
  @Min(0, { message: 'A tarifa por hora não pode ser negativa.' })
  hourlyRate: number;
}
