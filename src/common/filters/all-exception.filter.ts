import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { EntityNotFoundError } from 'typeorm';

@Catch() // Catches all exceptions
export class CatchEverythingFilter implements ExceptionFilter {
  private readonly logger = new Logger(CatchEverythingFilter.name);

  constructor(private readonly httpAdapterHost: HttpAdapterHost) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    // Resolve httpAdapter at runtime to ensure it's available
    const { httpAdapter } = this.httpAdapterHost;
    const ctx = host.switchToHttp();
    const request = ctx.getRequest();
    const response = ctx.getResponse();

    let httpStatus = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | object = 'Internal server error';

    // Check for specific exception types and handle accordingly
    if (exception instanceof HttpException) {
      httpStatus = exception.getStatus();
      message = exception.getResponse();
    } else if (exception instanceof EntityNotFoundError) {
      httpStatus = HttpStatus.NOT_FOUND;
      message = { message: 'Resource not found' };
    } else if (exception instanceof Error) {
      // Handle general JavaScript errors
      message = exception.message;
    }

    // Prepare the response body with detailed information
    const responseBody = {
      statusCode: httpStatus,
      message:
        typeof message === 'string'
          ? message
          : message['message'] || 'Error occurred',
      timestamp: new Date().toISOString(),
      path: httpAdapter.getRequestUrl(request),
    };

    // Log the exception details
    this.logger.error(`Exception caught: ${JSON.stringify(responseBody)}`);
    this.logger.error(
      `Stack trace: ${
        exception instanceof Error ? exception.stack : 'No stack trace'
      }`,
    );

    // Send the response back to the client
    httpAdapter.reply(response, responseBody, httpStatus);
  }
}
