import { ExceptionFilter, Catch, ArgumentsHost, HttpException, InternalServerErrorException } from '@nestjs/common';
import { Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    console.error('EXCEPTION:', exception);
    if (exception instanceof HttpException) {
      response.status(exception.getStatus()).json(exception.getResponse());
    } else {
      console.error('NON-HTTP EXCEPTION:', exception);
      response.status(500).json({ statusCode: 500, message: 'Internal server error', detail: String(exception) });
    }
  }
}