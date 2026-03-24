import { Controller, Delete, Get, Injectable, Module, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { ContractsDomainService } from "@contract/core";
import {
  createContractSchema,
  type CreateContractInput,
  type UpdateContractInput,
  updateContractSchema
} from "@contract/shared";
import { AuditService } from "../../common/audit.service";
import { CurrentUser, type AuthenticatedUser } from "../../common/current-user.decorator";
import { PrismaService } from "../../common/prisma.service";
import {
  ADMIN_MANAGER_ROLES,
  BUSINESS_READ_ROLES,
  OPERATIONS_ROLES
} from "../../common/role-groups";
import { Roles } from "../../common/roles.decorator";
import { RolesGuard } from "../../common/roles.guard";
import { ValidatedBody } from "../../common/validated-body.decorator";
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
}

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller("contracts")
export class ContractsController {
  constructor(private readonly contractsService: ContractsService) {}

  @Roles(...BUSINESS_READ_ROLES)
  @Get()
  list() {
    return this.contractsService.list();
  }

  @Roles(...BUSINESS_READ_ROLES)
  @Get(":id")
  findOne(@Param("id") contractId: string) {
    return this.contractsService.findOne(contractId);
  }

  @Roles(...OPERATIONS_ROLES)
  @Post()
  create(
    @ValidatedBody(createContractSchema) payload: CreateContractInput,
    @CurrentUser() currentUser: AuthenticatedUser
  ) {
    return this.contractsService.create(payload, currentUser.id);
  }

  @Roles(...OPERATIONS_ROLES)
  @Patch(":id")
  update(
    @Param("id") contractId: string,
    @ValidatedBody(updateContractSchema) payload: UpdateContractInput,
    @CurrentUser() currentUser: AuthenticatedUser
  ) {
    return this.contractsService.update(contractId, payload, currentUser.id);
  }

  @Roles(...ADMIN_MANAGER_ROLES)
  @Post(":id/activate")
  activate(@Param("id") contractId: string, @CurrentUser() currentUser: AuthenticatedUser) {
    return this.contractsService.activate(contractId, currentUser.id);
  }

  @Roles(...ADMIN_MANAGER_ROLES)
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
