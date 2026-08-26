import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Response } from 'express';

interface ErrorPayload {
  code: string;
  message: string;
  fields?: Record<string, string>;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

@Catch()
export class ApiExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(ApiExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse<Response>();
    const status: HttpStatus =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    if (!(exception instanceof HttpException)) {
      this.logger.error(
        'Erro não tratado na API.',
        exception instanceof Error ? exception.stack : undefined,
      );
    }

    response.status(status).json({
      error: this.payloadFor(exception, status),
    });
  }

  private payloadFor(exception: unknown, status: HttpStatus): ErrorPayload {
    if (exception instanceof HttpException) {
      const exceptionResponse = exception.getResponse();

      if (isRecord(exceptionResponse) && 'code' in exceptionResponse) {
        return {
          code: String(exceptionResponse.code),
          message:
            typeof exceptionResponse.message === 'string'
              ? exceptionResponse.message
              : 'Requisição inválida.',
          ...(isRecord(exceptionResponse.fields)
            ? {
                fields: Object.fromEntries(
                  Object.entries(exceptionResponse.fields).map(
                    ([field, message]) => [field, String(message)],
                  ),
                ),
              }
            : {}),
        };
      }
    }

    if (status === HttpStatus.BAD_REQUEST) {
      return {
        code: 'BAD_REQUEST',
        message: 'Requisição inválida.',
      };
    }

    if (status === HttpStatus.NOT_FOUND) {
      return {
        code: 'NOT_FOUND',
        message: 'Recurso não encontrado.',
      };
    }

    return {
      code: 'INTERNAL_ERROR',
      message: 'Erro interno do servidor.',
    };
  }
}
