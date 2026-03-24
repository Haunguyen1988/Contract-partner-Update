import type { Role } from "@contract/shared";
import { defineAuthorizedRoute } from "../../../../src/server/internal-api";
import { prisma } from "../../../../src/server/prisma";

export {
  INTERNAL_ROUTE_DYNAMIC as dynamic,
  INTERNAL_ROUTE_RUNTIME as runtime
} from "../../../../src/server/internal-api";

const AUDIT_ROLES: Role[] = ["ADMIN", "PR_COR_MANAGER", "FINANCE", "LEGAL", "PROCUREMENT", "LEADERSHIP"];

export const GET = defineAuthorizedRoute(
  AUDIT_ROLES,
  async ({ user }) => {
    const logs = await prisma.auditLog.findMany({
      include: {
        changedBy: {
          select: {
            fullName: true,
            email: true
          }
        }
      },
      orderBy: { changedAt: "desc" },
      take: user.role === "ADMIN" ? 200 : 100
    });

    return logs.map((log) => ({
      id: log.id,
      entityType: log.entityType,
      entityId: log.entityId,
      action: log.action,
      changedAt: log.changedAt.toISOString(),
      changedBy: log.changedBy?.fullName ?? null,
      diffSummary: log.diffSummary
    }));
  }
);
