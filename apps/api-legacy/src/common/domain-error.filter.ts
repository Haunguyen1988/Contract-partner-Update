import {
  ArgumentsHost,
  BadRequestException,
  Catch,
  ExceptionFilter,
  NotFoundException
} from "@nestjs/common";
import { DomainNotFoundError, DomainRuleError } from "@contract/core";

@Catch(DomainNotFoundError, DomainRuleError)
export class DomainErrorFilter implements ExceptionFilter {
  catch(error: DomainNotFoundError | DomainRuleError, host: ArgumentsHost) {
    const httpHost = host.switchToHttp();
    const response = httpHost.getResponse();
    const request = httpHost.getRequest();

    const exception = error instanceof DomainNotFoundError
      ? new NotFoundException(error.message)
      : new BadRequestException(error.message);

    const status = exception.getStatus();
    const body = exception.getResponse();

    response.status(status).json({
      ...(typeof body === "string" ? { message: body } : body),
      path: request.url,
      statusCode: status,
      timestamp: new Date().toISOString()
    });
  }
}
