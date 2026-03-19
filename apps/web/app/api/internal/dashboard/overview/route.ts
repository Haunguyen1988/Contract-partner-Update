import { daysUntil, formatVnd, type Role } from "@contract/shared";
import { NextRequest, NextResponse } from "next/server";
import { handleRouteError, requireSession } from "../../../../../src/server/internal-api";
import { prisma } from "../../../../../src/server/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DASHBOARD_ROLES: Role[] = ["ADMIN", "PR_COR_MANAGER", "PR_COR_STAFF", "FINANCE", "LEGAL", "PROCUREMENT", "LEADERSHIP"];

function decimalToNumber(value: { toString(): string } | number | string | null | undefined) {
  return Number(value ?? 0);
}

export async function GET(request: NextRequest) {
  try {
    const currentUser = await requireSession(request, DASHBOARD_ROLES);
    const contractFilter = currentUser.role === "PR_COR_STAFF" ? { ownerId: currentUser.id } : {};

    const [activeContracts, alerts, budgets, expiringContracts, topOwners, myTasks] = await Promise.all([
      prisma.contract.count({
        where: {
          lifecycleStatus: "ACTIVE",
          archivedAt: null,
          ...contractFilter
        }
      }),
      prisma.alert.count({
        where: {
          status: "OPEN",
          ...(currentUser.role === "PR_COR_STAFF" ? { contract: { ownerId: currentUser.id } } : {})
        }
      }),
      prisma.budgetAllocation.findMany({
        where: currentUser.role === "PR_COR_STAFF" ? { ownerId: currentUser.id } : undefined,
        include: {
          owner: {
            select: {
              id: true,
              fullName: true
            }
          }
        },
        orderBy: { committedAmount: "desc" },
        take: 5
      }),
      prisma.contract.findMany({
        where: {
          archivedAt: null,
          lifecycleStatus: { in: ["ACTIVE", "PENDING_ACTIVATION"] },
          ...contractFilter
        },
        include: {
          partner: { select: { legalName: true } },
          owner: { select: { fullName: true } }
        },
        orderBy: { endDate: "asc" },
        take: 5
      }),
      prisma.budgetAllocation.findMany({
        include: {
          owner: { select: { id: true, fullName: true } }
        },
        orderBy: { committedAmount: "desc" },
        take: 5
      }),
      prisma.alert.findMany({
        where: {
          status: "OPEN",
          ...(currentUser.role === "PR_COR_STAFF" ? { contract: { ownerId: currentUser.id } } : {})
        },
        orderBy: [{ severity: "desc" }, { dueDate: "asc" }],
        take: 6
      })
    ]);

    const totalCommittedBudget = budgets.reduce((sum, budget) => sum + decimalToNumber(budget.committedAmount), 0);
    const totalRemainingBudget = budgets.reduce((sum, budget) => sum + decimalToNumber(budget.remainingAmount), 0);

    return NextResponse.json({
      summary: {
        activeContracts,
        expiringContracts: expiringContracts.length,
        openAlerts: alerts,
        totalCommittedBudget: formatVnd(totalCommittedBudget),
        totalRemainingBudget: formatVnd(totalRemainingBudget)
      },
      topOwners: topOwners.map((budget) => ({
        ownerId: budget.owner.id,
        ownerName: budget.owner.fullName,
        committedAmount: budget.committedAmount.toString(),
        remainingAmount: budget.remainingAmount.toString()
      })),
      expiringContracts: expiringContracts.map((contract) => ({
        id: contract.id,
        contractNo: contract.contractNo,
        title: contract.title,
        ownerName: contract.owner.fullName,
        partnerName: contract.partner.legalName,
        endDate: contract.endDate.toISOString(),
        daysRemaining: daysUntil(contract.endDate)
      })),
      myTasks: myTasks.map((alert) => ({
        id: alert.id,
        title: alert.title,
        description: alert.message,
        dueDate: alert.dueDate.toISOString(),
        severity: alert.severity
      }))
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
