import { BadRequestException } from "@nestjs/common";
import type { ZodSchema } from "zod";

export function parseOrThrow<T>(schema: ZodSchema<T>, payload: unknown): T {
  const result = schema.safeParse(payload);

  if (!result.success) {
    throw new BadRequestException({
      message: "Validation failed",
      issues: result.error.flatten()
    });
  }

  return result.data;
}

