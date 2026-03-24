import bcrypt from "bcryptjs";
import { loginSchema } from "@contract/shared";
import {
  RouteHttpError,
  createJwtToken,
  defineRoute,
  parseJsonBody
} from "../../../../../src/server/internal-api";
import { prisma } from "../../../../../src/server/prisma";

export {
  INTERNAL_ROUTE_DYNAMIC as dynamic,
  INTERNAL_ROUTE_RUNTIME as runtime
} from "../../../../../src/server/internal-api";

export const POST = defineRoute(async (request) => {
  const payload = await parseJsonBody(request, loginSchema);

  const user = await prisma.user.findUnique({
    where: { email: payload.email }
  });

  if (!user) {
    throw new RouteHttpError(401, "Email hoac mat khau khong dung.");
  }

  if (user.status !== "ACTIVE") {
    throw new RouteHttpError(401, "Tai khoan da bi khoa hoac chua kich hoat.");
  }

  const isMatch = await bcrypt.compare(payload.password, user.passwordHash);

  if (!isMatch) {
    throw new RouteHttpError(401, "Email hoac mat khau khong dung.");
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() }
  });

  const accessToken = createJwtToken({
    sub: user.id,
    email: user.email,
    role: user.role,
    fullName: user.fullName
  });

  return {
    accessToken,
    user: {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      department: user.department,
      status: user.status
    }
  };
});
