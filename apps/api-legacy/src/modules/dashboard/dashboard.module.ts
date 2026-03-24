import { Controller, Get, Injectable, Module, UseGuards } from "@nestjs/common";
import { daysUntil, formatVnd, toIsoDateString, toNumber } from "@contract/shared";
import { CurrentUser, type AuthenticatedUser } from "../../common/current-user.decorator";
import { PrismaService } from "../../common/prisma.service";
import { BUSINESS_READ_ROLES } from "../../common/role-groups";
import { Roles } from "../../common/roles.decorator";
import { RolesGuard } from "../../common/roles.guard";
import { JwtAuthGuard } from "../auth/auth.module";

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getOverview(currentUser: AuthenticatedUser) {
    const contractFilter = currentUser.role === "PR_COR_STAFF" ? { ownerId: currentUser.id } : {};
    const [activeContracts, alerts, budgets, expiringContracts, topOwners] = await Promise.all([
      this.prisma.contract.count({
        where: {
          lifecycleStatus: "ACTIVE",
          archivedAt: null,
          ...contractFilter
        }
      }),
      this.prisma.alert.count({
        where: {
          status: "OPEN",
          ...(currentUser.role === "PR_COR_STAFF" ? { contract: { ownerId: currentUser.id } } : {})
        }
      }),
      this.prisma.budgetAllocation.findMany({
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
      this.prisma.contract.findMany({
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
      this.prisma.budgetAllocation.findMany({
        include: {
          owner: { select: { id: true, fullName: true } }
        },
        orderBy: { committedAmount: "desc" },
        take: 5
      })
    ]);

    const myTasks = await this.prisma.alert.findMany({
      where: {
        status: "OPEN",
        ...(currentUser.role === "PR_COR_STAFF" ? { contract: { ownerId: currentUser.id } } : {})
      },
      orderBy: [{ severity: "desc" }, { dueDate: "asc" }],
      take: 6
    });

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
}

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller("dashboard")
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Roles(...BUSINESS_READ_ROLES)
  @Get("overview")
  getOverview(@CurrentUser() currentUser: AuthenticatedUser) {
    return this.dashboardService.getOverview(currentUser);
  }
}

@Module({
  controllers: [DashboardController],
  providers: [DashboardService]
})
export class DashboardModule {}

