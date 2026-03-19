import { Body, Controller, Get, Injectable, Module, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { BudgetsDomainService } from "@contract/core";
import {
  createBudgetAllocationSchema,
  updateBudgetAllocationSchema,
  type CreateBudgetAllocationInput,
  type UpdateBudgetAllocationInput
} from "@contract/shared";
import { AuditService } from "../../common/audit.service";
import { rethrowDomainError } from "../../common/domain-error";
import { CurrentUser, type AuthenticatedUser } from "../../common/current-user.decorator";
import { PrismaService } from "../../common/prisma.service";
import { Roles } from "../../common/roles.decorator";
import { RolesGuard } from "../../common/roles.guard";
import { parseOrThrow } from "../../common/zod";
import { JwtAuthGuard } from "../auth/auth.module";

@Injectable()
export class BudgetsService extends BudgetsDomainService {
  constructor(
    prisma: PrismaService,
    auditService: AuditService
  ) {
    super(prisma, auditService);
  }

  override async list() {
    try {
      return await super.list();
    } catch (error) {
      rethrowDomainError(error);
    }
  }

  override async upsert(input: CreateBudgetAllocationInput, changedById: string) {
    try {
      return await super.upsert(input, changedById);
    } catch (error) {
      rethrowDomainError(error);
    }
  }

  override async update(
    budgetId: string,
    input: UpdateBudgetAllocationInput,
    changedById: string
  ) {
    try {
      return await super.update(budgetId, input, changedById);
    } catch (error) {
      rethrowDomainError(error);
    }
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
    return this.budgetsService.upsert(parseOrThrow(createBudgetAllocationSchema, payload), currentUser.id);
  }

  @Roles("ADMIN", "PR_COR_MANAGER", "FINANCE")
  @Patch(":id")
  update(@Param("id") budgetId: string, @Body() payload: unknown, @CurrentUser() currentUser: AuthenticatedUser) {
    return this.budgetsService.update(budgetId, parseOrThrow(updateBudgetAllocationSchema, payload), currentUser.id);
  }
}

@Module({
  controllers: [BudgetsController],
  providers: [BudgetsService],
  exports: [BudgetsService]
})
export class BudgetsModule {}
