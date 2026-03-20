import { BadRequestException } from "@nestjs/common";
import type { ZodTypeAny, output } from "zod";

export function parseOrThrow<TSchema extends ZodTypeAny>(schema: TSchema, payload: unknown): output<TSchema> {
  const result = schema.safeParse(payload);

  if (!result.success) {
    throw new BadRequestException({
      message: "Validation failed",
      issues: result.error.flatten()
    });
  }

  return result.data;
}
