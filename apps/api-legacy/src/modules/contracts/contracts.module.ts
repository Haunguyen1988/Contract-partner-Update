import { Body, Controller, Delete, Get, Injectable, Module, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { ContractsDomainService } from "@contract/core";
import {
  createContractSchema,
  updateContractSchema,
  type CreateContractInput,
  type UpdateContractInput
} from "@contract/shared";
import { AuditService } from "../../common/audit.service";
import { rethrowDomainError } from "../../common/domain-error";
import { CurrentUser, type AuthenticatedUser } from "../../common/current-user.decorator";
import { PrismaService } from "../../common/prisma.service";
import { Roles } from "../../common/roles.decorator";
import { RolesGuard } from "../../common/roles.guard";
import { parseOrThrow } from "../../common/zod";
import { JwtAuthGuard } from "../auth/auth.module";
import { BudgetsModule, BudgetsService } from "../budgets/budgets.module";
import { SettingsModule, SettingsService } from "../settings/settings.module";

@Injectable()
export class ContractsService extends ContractsDomainService {
  constructor(
    prisma: PrismaService,
    budgetsService: BudgetsService,
    settingsService: SettingsService,
    auditService: AuditService
  ) {
    super(prisma, budgetsService, settingsService, auditService);
  }

  override async list() {
    try {
      return await super.list();
    } catch (error) {
      rethrowDomainError(error);
    }
  }

  override async findOne(contractId: string) {
    try {
      return await super.findOne(contractId);
    } catch (error) {
      rethrowDomainError(error);
    }
  }

  override async create(input: CreateContractInput, changedById: string) {
    try {
      return await super.create(input, changedById);
    } catch (error) {
      rethrowDomainError(error);
    }
  }

  override async update(contractId: string, input: UpdateContractInput, changedById: string) {
    try {
      return await super.update(contractId, input, changedById);
    } catch (error) {
      rethrowDomainError(error);
    }
  }

  override async activate(contractId: string, changedById: string) {
    try {
      return await super.activate(contractId, changedById);
    } catch (error) {
      rethrowDomainError(error);
    }
  }

  override async archive(contractId: string, changedById: string) {
    try {
      return await super.archive(contractId, changedById);
    } catch (error) {
      rethrowDomainError(error);
    }
  }
}

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller("contracts")
export class ContractsController {
  constructor(private readonly contractsService: ContractsService) {}

  @Roles("ADMIN", "PR_COR_MANAGER", "PR_COR_STAFF", "FINANCE", "LEGAL", "PROCUREMENT", "LEADERSHIP")
  @Get()
  list() {
    return this.contractsService.list();
  }

  @Roles("ADMIN", "PR_COR_MANAGER", "PR_COR_STAFF", "FINANCE", "LEGAL", "PROCUREMENT", "LEADERSHIP")
  @Get(":id")
  findOne(@Param("id") contractId: string) {
    return this.contractsService.findOne(contractId);
  }

  @Roles("ADMIN", "PR_COR_MANAGER", "PR_COR_STAFF")
  @Post()
  create(@Body() payload: unknown, @CurrentUser() currentUser: AuthenticatedUser) {
    return this.contractsService.create(parseOrThrow(createContractSchema, payload), currentUser.id);
  }

  @Roles("ADMIN", "PR_COR_MANAGER", "PR_COR_STAFF")
  @Patch(":id")
  update(@Param("id") contractId: string, @Body() payload: unknown, @CurrentUser() currentUser: AuthenticatedUser) {
    return this.contractsService.update(contractId, parseOrThrow(updateContractSchema, payload), currentUser.id);
  }

  @Roles("ADMIN", "PR_COR_MANAGER")
  @Post(":id/activate")
  activate(@Param("id") contractId: string, @CurrentUser() currentUser: AuthenticatedUser) {
    return this.contractsService.activate(contractId, currentUser.id);
  }

  @Roles("ADMIN", "PR_COR_MANAGER")
  @Delete(":id")
  archive(@Param("id") contractId: string, @CurrentUser() currentUser: AuthenticatedUser) {
    return this.contractsService.archive(contractId, currentUser.id);
  }
}

@Module({
  imports: [BudgetsModule, SettingsModule],
  controllers: [ContractsController],
  providers: [ContractsService],
  exports: [ContractsService]
})
export class ContractsModule {}
