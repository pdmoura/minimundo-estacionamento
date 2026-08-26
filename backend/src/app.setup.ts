import {
  BadRequestException,
  INestApplication,
  ValidationPipe,
} from '@nestjs/common';
import type { ValidationError } from 'class-validator';
import { ApiExceptionFilter } from './common/filters/api-exception.filter';

function validationFields(errors: ValidationError[]) {
  return Object.fromEntries(
    errors.map((error) => [
      error.property,
      Object.values(error.constraints ?? {})[0] ?? 'Valor inválido.',
    ]),
  );
}

export function configureApp(app: INestApplication) {
  app.setGlobalPrefix('api');
  app.enableCors({ origin: 'http://localhost:3000' });
  app.useGlobalFilters(new ApiExceptionFilter());
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
      exceptionFactory: (errors) =>
        new BadRequestException({
          code: 'VALIDATION_ERROR',
          message: 'Dados inválidos.',
          fields: validationFields(errors),
        }),
    }),
  );
}
