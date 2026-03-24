import { daysUntil, formatVnd, toIsoDateString, toNumber, type Role } from "@contract/shared";
import { defineAuthorizedRoute } from "../../../../../src/server/internal-api";
import { prisma } from "../../../../../src/server/prisma";

export {
  INTERNAL_ROUTE_DYNAMIC as dynamic,
  INTERNAL_ROUTE_RUNTIME as runtime
} from "../../../../../src/server/internal-api";

const DASHBOARD_ROLES: Role[] = ["ADMIN", "PR_COR_MANAGER", "PR_COR_STAFF", "FINANCE", "LEGAL", "PROCUREMENT", "LEADERSHIP"];

export const GET = defineAuthorizedRoute(
  DASHBOARD_ROLES,
  async ({ user }) => {
    const contractFilter = user.role === "PR_COR_STAFF" ? { ownerId: user.id } : {};

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
          ...(user.role === "PR_COR_STAFF" ? { contract: { ownerId: user.id } } : {})
        }
      }),
      prisma.budgetAllocation.findMany({
        where: user.role === "PR_COR_STAFF" ? { ownerId: user.id } : undefined,
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
          ...(user.role === "PR_COR_STAFF" ? { contract: { ownerId: user.id } } : {})
        },
        orderBy: [{ severity: "desc" }, { dueDate: "asc" }],
        take: 6
      })
    ]);

    const totalCommittedBudget = budgets.reduce((sum, budget) => sum + toNumber(budget.committedAmount), 0);
    const totalRemainingBudget = budgets.reduce((sum, budget) => sum + toNumber(budget.remainingAmount), 0);

    return {
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
        endDate: toIsoDateString(contract.endDate),
        daysRemaining: daysUntil(contract.endDate)
      })),
      myTasks: myTasks.map((alert) => ({
        id: alert.id,
        title: alert.title,
        description: alert.message,
        dueDate: toIsoDateString(alert.dueDate),
        severity: alert.severity
      }))
    };
  }
);
