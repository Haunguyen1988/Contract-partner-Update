import bcrypt from "bcryptjs";
import { createUserSchema, type Role } from "@contract/shared";
import {
  defineAuthorizedRoute,
  parseJsonBody
} from "../../../../src/server/internal-api";
import { prisma } from "../../../../src/server/prisma";
import { auditLogger } from "../../../../src/server/services";

export {
  INTERNAL_ROUTE_DYNAMIC as dynamic,
  INTERNAL_ROUTE_RUNTIME as runtime
} from "../../../../src/server/internal-api";

const USER_LIST_ROLES: Role[] = ["ADMIN", "PR_COR_MANAGER"];
const USER_WRITE_ROLES: Role[] = ["ADMIN"];

export const GET = defineAuthorizedRoute(
  USER_LIST_ROLES,
  async () => prisma.user.findMany({
    orderBy: { fullName: "asc" },
    select: {
      id: true,
      email: true,
      fullName: true,
      role: true,
      department: true,
      status: true,
      lastLoginAt: true
    }
  })
);

export const POST = defineAuthorizedRoute(
  USER_WRITE_ROLES,
  async ({ request, user: currentUser }) => {
    const input = await parseJsonBody(request, createUserSchema);
    const passwordHash = await bcrypt.hash(input.password, 10);

    const user = await prisma.user.create({
      data: {
        email: input.email,
        fullName: input.fullName,
        department: input.department ?? null,
        role: input.role,
        status: input.status,
        passwordHash
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        department: true,
        status: true
      }
    });

    await auditLogger.log({
      entityType: "USER",
      entityId: user.id,
      action: "CREATE_USER",
      changedById: currentUser.id,
      diffSummary: { email: user.email, role: user.role }
    });

    return user;
  }
);
