import {
  DEFAULT_CAMPAIGN,
  computeRemainingBudget,
  type CreateBudgetAllocationInput,
  type UpdateBudgetAllocationInput
} from "@contract/shared";
import { DomainNotFoundError } from "./errors";
import type { AuditLogger, BudgetsPrismaClient, BudgetEvaluation } from "./types";

const COMMITTED_STATUSES = ["DRAFT", "PENDING_ACTIVATION", "ACTIVE", "EXPIRED"] as const;

function decimalToString(value: { toString(): string } | number | string | null | undefined) {
  return value ? value.toString() : "0";
}

export class BudgetsDomainService {
  constructor(
    private readonly prisma: BudgetsPrismaClient,
    private readonly auditLogger: AuditLogger
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

  async upsert(input: CreateBudgetAllocationInput, changedById: string) {
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

    await this.auditLogger.log({
      entityType: "BUDGET",
      entityId: budget.id,
      action: "UPSERT_BUDGET",
      changedById,
      diffSummary: input
    });

    return this.prisma.budgetAllocation.findUnique({ where: { id: budget.id } });
  }

  async update(budgetId: string, input: UpdateBudgetAllocationInput, changedById: string) {
    const existing = await this.prisma.budgetAllocation.findUnique({ where: { id: budgetId } });

    if (!existing) {
      throw new DomainNotFoundError("Khong tim thay ngan sach.");
    }

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

    await this.auditLogger.log({
      entityType: "BUDGET",
      entityId: budget.id,
      action: "UPDATE_BUDGET",
      changedById,
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

  async evaluateBudget(
    fiscalYear: number,
    ownerId: string,
    campaign: string,
    nextContractValue: number,
    currentContractId?: string
  ): Promise<BudgetEvaluation> {
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
