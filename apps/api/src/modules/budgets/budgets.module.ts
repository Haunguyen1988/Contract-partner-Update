import { Body, Controller, Get, Injectable, Module, NotFoundException, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { DEFAULT_CAMPAIGN, computeRemainingBudget, createBudgetAllocationSchema, updateBudgetAllocationSchema } from "@contract/shared";
import { Prisma } from "@prisma/client";
import { AuditService } from "../../common/audit.service";
import { CurrentUser, type AuthenticatedUser } from "../../common/current-user.decorator";
import { PrismaService } from "../../common/prisma.service";
import { Roles } from "../../common/roles.decorator";
import { RolesGuard } from "../../common/roles.guard";
import { parseOrThrow } from "../../common/zod";
import { JwtAuthGuard } from "../auth/auth.module";

const COMMITTED_STATUSES = ["DRAFT", "PENDING_ACTIVATION", "ACTIVE", "EXPIRED"] as const;

function decimalToString(value: Prisma.Decimal | number | string | null | undefined): string {
  return value ? value.toString() : "0";
}

@Injectable()
export class BudgetsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService
  ) {}

  async list() {
    const budgets = await this.prisma.budgetAllocation.findMany({
      include: {
        owner: {
          select: {
            id: true,
            fullName: true,
            email: true,
            role: true
          }
        }
      },
      orderBy: [{ fiscalYear: "desc" }, { owner: { fullName: "asc" } }]
    });

    return budgets.map((budget) => ({
      id: budget.id,
      fiscalYear: budget.fiscalYear,
      ownerId: budget.ownerId,
      ownerName: budget.owner.fullName,
      campaign: budget.campaign,
      allocatedAmount: decimalToString(budget.allocatedAmount),
      committedAmount: decimalToString(budget.committedAmount),
      remainingAmount: decimalToString(budget.remainingAmount)
    }));
  }

  async upsert(payload: unknown, currentUser: AuthenticatedUser) {
    const input = parseOrThrow(createBudgetAllocationSchema, payload);
    const campaign = input.campaign || DEFAULT_CAMPAIGN;

    const budget = await this.prisma.budgetAllocation.upsert({
      where: {
        fiscalYear_ownerId_campaign: {
          fiscalYear: input.fiscalYear,
          ownerId: input.ownerId,
          campaign
        }
      },
      update: {
        allocatedAmount: input.allocatedAmount,
        remainingAmount: input.allocatedAmount
      },
      create: {
        fiscalYear: input.fiscalYear,
        ownerId: input.ownerId,
        campaign,
        allocatedAmount: input.allocatedAmount,
        committedAmount: 0,
        remainingAmount: input.allocatedAmount
      }
    });

    await this.recomputeBudget(input.fiscalYear, input.ownerId, campaign);

    await this.auditService.log({
      entityType: "BUDGET",
      entityId: budget.id,
      action: "UPSERT_BUDGET",
      changedById: currentUser.id,
      diffSummary: input
    });

    return this.prisma.budgetAllocation.findUnique({ where: { id: budget.id } });
  }

  async update(budgetId: string, payload: unknown, currentUser: AuthenticatedUser) {
    const existing = await this.prisma.budgetAllocation.findUnique({ where: { id: budgetId } });

    if (!existing) {
      throw new NotFoundException("Không tìm thấy ngân sách.");
    }

    const input = parseOrThrow(updateBudgetAllocationSchema, payload);

    const budget = await this.prisma.budgetAllocation.update({
      where: { id: budgetId },
      data: {
        fiscalYear: input.fiscalYear ?? existing.fiscalYear,
        ownerId: input.ownerId ?? existing.ownerId,
        campaign: input.campaign ?? existing.campaign,
        allocatedAmount: input.allocatedAmount ?? existing.allocatedAmount
      }
    });

    await this.recomputeBudget(budget.fiscalYear, budget.ownerId, budget.campaign);

    await this.auditService.log({
      entityType: "BUDGET",
      entityId: budget.id,
      action: "UPDATE_BUDGET",
      changedById: currentUser.id,
      diffSummary: input as Record<string, unknown>
    });

    return this.prisma.budgetAllocation.findUnique({ where: { id: budget.id } });
  }

  async recomputeBudget(fiscalYear: number, ownerId: string, campaign = DEFAULT_CAMPAIGN) {
    const budget = await this.prisma.budgetAllocation.findUnique({
      where: {
        fiscalYear_ownerId_campaign: {
          fiscalYear,
          ownerId,
          campaign
        }
      }
    });

    if (!budget) {
      return null;
    }

    const aggregate = await this.prisma.contract.aggregate({
      _sum: { value: true },
      where: {
        ownerId,
        fiscalYear,
        campaign,
        archivedAt: null,
        lifecycleStatus: { in: [...COMMITTED_STATUSES] }
      }
    });

    const committedAmount = Number(aggregate._sum.value ?? 0);
    const remainingAmount = computeRemainingBudget(Number(budget.allocatedAmount), committedAmount);

    return this.prisma.budgetAllocation.update({
      where: { id: budget.id },
      data: {
        committedAmount,
        remainingAmount
      }
    });
  }

  async evaluateBudget(fiscalYear: number, ownerId: string, campaign: string, nextContractValue: number, currentContractId?: string) {
    const budget = await this.prisma.budgetAllocation.findUnique({
      where: {
        fiscalYear_ownerId_campaign: {
          fiscalYear,
          ownerId,
          campaign
        }
      }
    });

    if (!budget) {
      return {
        hasBudget: false,
        remainingAmount: "0",
        projectedRemainingAmount: (-nextContractValue).toString()
      };
    }

    const aggregate = await this.prisma.contract.aggregate({
      _sum: { value: true },
      where: {
        ownerId,
        fiscalYear,
        campaign,
        archivedAt: null,
        lifecycleStatus: { in: [...COMMITTED_STATUSES] },
        ...(currentContractId ? { NOT: { id: currentContractId } } : {})
      }
    });

    const currentCommitted = Number(aggregate._sum.value ?? 0);
    const projectedCommitted = currentCommitted + nextContractValue;
    const projectedRemaining = computeRemainingBudget(Number(budget.allocatedAmount), projectedCommitted);

    return {
      hasBudget: true,
      remainingAmount: decimalToString(budget.remainingAmount),
      projectedRemainingAmount: projectedRemaining.toString(),
      isOverBudget: projectedRemaining < 0
    };
  }
}

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller("budgets")
export class BudgetsController {
  constructor(private readonly budgetsService: BudgetsService) {}

  @Roles("ADMIN", "PR_COR_MANAGER", "FINANCE", "LEADERSHIP")
  @Get()
  list() {
    return this.budgetsService.list();
  }

  @Roles("ADMIN", "PR_COR_MANAGER", "FINANCE")
  @Post()
  upsert(@Body() payload: unknown, @CurrentUser() currentUser: AuthenticatedUser) {
    return this.budgetsService.upsert(payload, currentUser);
  }

  @Roles("ADMIN", "PR_COR_MANAGER", "FINANCE")
  @Patch(":id")
  update(@Param("id") budgetId: string, @Body() payload: unknown, @CurrentUser() currentUser: AuthenticatedUser) {
    return this.budgetsService.update(budgetId, payload, currentUser);
  }
}

@Module({
  controllers: [BudgetsController],
  providers: [BudgetsService],
  exports: [BudgetsService]
})
export class BudgetsModule {}

