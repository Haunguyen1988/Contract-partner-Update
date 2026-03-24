import { Controller, Get, Injectable, Module, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { BudgetsDomainService } from "@contract/core";
import {
  createBudgetAllocationSchema,
  type CreateBudgetAllocationInput,
  type UpdateBudgetAllocationInput,
  updateBudgetAllocationSchema
} from "@contract/shared";
import { AuditService } from "../../common/audit.service";
import { CurrentUser, type AuthenticatedUser } from "../../common/current-user.decorator";
import { PrismaService } from "../../common/prisma.service";
import { BUDGET_READ_ROLES, FINANCE_MANAGER_ROLES } from "../../common/role-groups";
import { Roles } from "../../common/roles.decorator";
import { RolesGuard } from "../../common/roles.guard";
import { ValidatedBody } from "../../common/validated-body.decorator";
import { JwtAuthGuard } from "../auth/auth.module";

@Injectable()
export class BudgetsService extends BudgetsDomainService {
  constructor(
    prisma: PrismaService,
    auditService: AuditService
  ) {
    super(prisma, auditService);
  }
}

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller("budgets")
export class BudgetsController {
  constructor(private readonly budgetsService: BudgetsService) {}

  @Roles(...BUDGET_READ_ROLES)
  @Get()
  list() {
    return this.budgetsService.list();
  }

  @Roles(...FINANCE_MANAGER_ROLES)
  @Post()
  upsert(
    @ValidatedBody(createBudgetAllocationSchema) payload: CreateBudgetAllocationInput,
    @CurrentUser() currentUser: AuthenticatedUser
  ) {
    return this.budgetsService.upsert(payload, currentUser.id);
  }

  @Roles(...FINANCE_MANAGER_ROLES)
  @Patch(":id")
  update(
    @Param("id") budgetId: string,
    @ValidatedBody(updateBudgetAllocationSchema) payload: UpdateBudgetAllocationInput,
    @CurrentUser() currentUser: AuthenticatedUser
  ) {
    return this.budgetsService.update(budgetId, payload, currentUser.id);
  }
}

@Module({
  controllers: [BudgetsController],
  providers: [BudgetsService],
  exports: [BudgetsService]
})
export class BudgetsModule {}
