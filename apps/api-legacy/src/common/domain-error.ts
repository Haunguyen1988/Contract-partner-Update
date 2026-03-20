import { BadRequestException, NotFoundException } from "@nestjs/common";
import { DomainNotFoundError, DomainRuleError } from "@contract/core";

export function rethrowDomainError(error: unknown): never {
  if (error instanceof DomainNotFoundError) {
    throw new NotFoundException(error.message);
  }

  if (error instanceof DomainRuleError) {
    throw new BadRequestException(error.message);
  }

  throw error;
}
