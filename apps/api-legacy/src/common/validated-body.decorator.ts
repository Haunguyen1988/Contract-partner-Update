import { createParamDecorator, type ExecutionContext } from "@nestjs/common";
import type { ZodTypeAny } from "zod";
import { parseOrThrow } from "./zod";

const validatedBodyDecorator = createParamDecorator((schema: ZodTypeAny, context: ExecutionContext) => {
  const request = context.switchToHttp().getRequest();
  return parseOrThrow(schema, request.body);
});

export function ValidatedBody<TSchema extends ZodTypeAny>(schema: TSchema): ParameterDecorator {
  return validatedBodyDecorator(schema);
}

