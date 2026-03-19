import type { Role } from "@contract/shared";
import { NextRequest, NextResponse } from "next/server";
import { handleRouteError, requireSession } from "../../../../src/server/internal-api";
import { prisma } from "../../../../src/server/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const AUDIT_ROLES: Role[] = ["ADMIN", "PR_COR_MANAGER", "FINANCE", "LEGAL", "PROCUREMENT", "LEADERSHIP"];

export async function GET(request: NextRequest) {
  try {
    const currentUser = await requireSession(request, AUDIT_ROLES);

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
      take: currentUser.role === "ADMIN" ? 200 : 100
    });

    return NextResponse.json(
      logs.map((log) => ({
        id: log.id,
        entityType: log.entityType,
        entityId: log.entityId,
        action: log.action,
        changedAt: log.changedAt.toISOString(),
        changedBy: log.changedBy?.fullName ?? null,
        diffSummary: log.diffSummary
      }))
    );
  } catch (error) {
    return handleRouteError(error);
  }
}
