import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import type { Role } from "@contract/shared";

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: Role;
  fullName: string;
}

export const CurrentUser = createParamDecorator((_: unknown, context: ExecutionContext) => {
  const request = context.switchToHttp().getRequest();
  return request.user as AuthenticatedUser;
});

