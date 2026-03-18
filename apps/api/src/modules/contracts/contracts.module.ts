import { BadRequestException, Body, Controller, Delete, Get, Injectable, Module, NotFoundException, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { DEFAULT_CAMPAIGN, createContractSchema, needsMainContractDocument, updateContractSchema } from "@contract/shared";
import { Prisma } from "@prisma/client";
import { AuditService } from "../../common/audit.service";
import { CurrentUser, type AuthenticatedUser } from "../../common/current-user.decorator";
import { PrismaService } from "../../common/prisma.service";
import { Roles } from "../../common/roles.decorator";
import { RolesGuard } from "../../common/roles.guard";
import { parseOrThrow } from "../../common/zod";
import { JwtAuthGuard } from "../auth/auth.module";
import { BudgetsModule, BudgetsService } from "../budgets/budgets.module";
import { SettingsModule, SettingsService } from "../settings/settings.module";

function decimalToString(value: Prisma.Decimal | number | string | null | undefined): string {
  return value ? value.toString() : "0";
}

@Injectable()
export class ContractsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly budgetsService: BudgetsService,
    private readonly settingsService: SettingsService,
    private readonly auditService: AuditService
  ) {}

  async list() {
    const contracts = await this.prisma.contract.findMany({
      where: {
        lifecycleStatus: { not: "ARCHIVED" }
      },
      include: {
        partner: { select: { id: true, legalName: true, code: true } },
        owner: { select: { id: true, fullName: true, email: true } },
        documents: { select: { id: true, type: true } }
      },
      orderBy: [{ endDate: "asc" }, { createdAt: "desc" }]
    });

    return contracts.map((contract) => ({
      id: contract.id,
      contractNo: contract.contractNo,
      title: contract.title,
      partnerId: contract.partnerId,
      partnerName: contract.partner.legalName,
      ownerId: contract.ownerId,
      ownerName: contract.owner.fullName,
      campaign: contract.campaign,
      fiscalYear: contract.fiscalYear,
      value: decimalToString(contract.value),
      startDate: contract.startDate.toISOString(),
      endDate: contract.endDate.toISOString(),
      lifecycleStatus: contract.lifecycleStatus,
      hasMainContract: contract.documents.some((document) => document.type === "MAIN_CONTRACT")
    }));
  }

  async findOne(contractId: string) {
    const contract = await this.prisma.contract.findUnique({
      where: { id: contractId },
      include: {
        partner: { select: { id: true, legalName: true, code: true } },
        owner: { select: { id: true, fullName: true, email: true } },
        documents: {
          orderBy: { uploadedAt: "desc" },
          select: {
            id: true,
            type: true,
            filename: true,
            originalName: true,
            mimeType: true,
            size: true,
            uploadedAt: true
          }
        }
      }
    });

    if (!contract) {
      throw new NotFoundException("Không tìm thấy hợp đồng.");
    }

    return {
      id: contract.id,
      contractNo: contract.contractNo,
      partnerId: contract.partnerId,
      partnerName: contract.partner.legalName,
      ownerId: contract.ownerId,
      ownerName: contract.owner.fullName,
      title: contract.title,
      campaign: contract.campaign,
      fiscalYear: contract.fiscalYear,
      value: decimalToString(contract.value),
      startDate: contract.startDate.toISOString(),
      endDate: contract.endDate.toISOString(),
      lifecycleStatus: contract.lifecycleStatus,
      notes: contract.notes,
      documents: contract.documents.map((document) => ({
        ...document,
        uploadedAt: document.uploadedAt.toISOString()
      }))
    };
  }

  async create(payload: unknown, currentUser: AuthenticatedUser) {
    const input = parseOrThrow(createContractSchema, payload);
    await this.assertContractReferences(input.partnerId, input.ownerId);

    const budgetCheck = await this.enforceBudgetPolicy(input.fiscalYear, input.ownerId, input.campaign || DEFAULT_CAMPAIGN, input.value);

    const contract = await this.prisma.contract.create({
      data: {
        contractNo: input.contractNo,
        partnerId: input.partnerId,
        ownerId: input.ownerId,
        title: input.title,
        campaign: input.campaign || DEFAULT_CAMPAIGN,
        fiscalYear: input.fiscalYear,
        value: input.value,
        startDate: new Date(input.startDate),
        endDate: new Date(input.endDate),
        lifecycleStatus: input.lifecycleStatus,
        notes: input.notes ?? null
      }
    });

    await this.budgetsService.recomputeBudget(contract.fiscalYear, contract.ownerId, contract.campaign);

    await this.auditService.log({
      entityType: "CONTRACT",
      entityId: contract.id,
      action: "CREATE_CONTRACT",
      changedById: currentUser.id,
      diffSummary: { contractNo: contract.contractNo, value: input.value, budgetCheck }
    });

    return {
      contract: await this.findOne(contract.id),
      budgetCheck
    };
  }

  async update(contractId: string, payload: unknown, currentUser: AuthenticatedUser) {
    const existing = await this.prisma.contract.findUnique({ where: { id: contractId } });

    if (!existing) {
      throw new NotFoundException("Không tìm thấy hợp đồng.");
    }

    const input = parseOrThrow(updateContractSchema, payload);
    const partnerId = input.partnerId ?? existing.partnerId;
    const ownerId = input.ownerId ?? existing.ownerId;
    const campaign = input.campaign ?? existing.campaign;
    const fiscalYear = input.fiscalYear ?? existing.fiscalYear;
    const value = input.value ?? Number(existing.value);

    await this.assertContractReferences(partnerId, ownerId);
    const budgetCheck = await this.enforceBudgetPolicy(fiscalYear, ownerId, campaign || DEFAULT_CAMPAIGN, value, contractId);

    await this.prisma.contract.update({
      where: { id: contractId },
      data: {
        contractNo: input.contractNo ?? existing.contractNo,
        partnerId,
        ownerId,
        title: input.title ?? existing.title,
        campaign,
        fiscalYear,
        value,
        startDate: input.startDate ? new Date(input.startDate) : existing.startDate,
        endDate: input.endDate ? new Date(input.endDate) : existing.endDate,
        lifecycleStatus: input.lifecycleStatus ?? existing.lifecycleStatus,
        notes: input.notes ?? existing.notes
      }
    });

    await this.budgetsService.recomputeBudget(existing.fiscalYear, existing.ownerId, existing.campaign);
    await this.budgetsService.recomputeBudget(fiscalYear, ownerId, campaign || DEFAULT_CAMPAIGN);

    await this.auditService.log({
      entityType: "CONTRACT",
      entityId: contractId,
      action: "UPDATE_CONTRACT",
      changedById: currentUser.id,
      diffSummary: { ...input, budgetCheck }
    });

    return {
      contract: await this.findOne(contractId),
      budgetCheck
    };
  }

  async activate(contractId: string, currentUser: AuthenticatedUser) {
    const contract = await this.prisma.contract.findUnique({
      where: { id: contractId },
      include: {
        documents: { select: { type: true } }
      }
    });

    if (!contract) {
      throw new NotFoundException("Không tìm thấy hợp đồng.");
    }

    if (needsMainContractDocument(contract.documents.map((document) => document.type))) {
      throw new BadRequestException("Không thể kích hoạt nếu chưa có tài liệu hợp đồng chính.");
    }

    if (!contract.contractNo || !contract.partnerId || !contract.ownerId || !contract.title) {
      throw new BadRequestException("Hợp đồng thiếu dữ liệu bắt buộc.");
    }

    await this.prisma.contract.update({
      where: { id: contractId },
      data: {
        lifecycleStatus: "ACTIVE",
        activatedAt: new Date()
      }
    });

    await this.budgetsService.recomputeBudget(contract.fiscalYear, contract.ownerId, contract.campaign);

    await this.auditService.log({
      entityType: "CONTRACT",
      entityId: contractId,
      action: "ACTIVATE_CONTRACT",
      changedById: currentUser.id,
      diffSummary: { lifecycleStatus: "ACTIVE" }
    });

    return this.findOne(contractId);
  }

  async archive(contractId: string, currentUser: AuthenticatedUser) {
    const contract = await this.prisma.contract.findUnique({ where: { id: contractId } });

    if (!contract) {
      throw new NotFoundException("Không tìm thấy hợp đồng.");
    }

    await this.prisma.contract.update({
      where: { id: contractId },
      data: {
        lifecycleStatus: "ARCHIVED",
        archivedAt: new Date()
      }
    });

    await this.budgetsService.recomputeBudget(contract.fiscalYear, contract.ownerId, contract.campaign);

    await this.auditService.log({
      entityType: "CONTRACT",
      entityId: contractId,
      action: "ARCHIVE_CONTRACT",
      changedById: currentUser.id,
      diffSummary: { lifecycleStatus: "ARCHIVED" }
    });

    return { success: true };
  }

  private async assertContractReferences(partnerId: string, ownerId: string) {
    const [partner, owner] = await Promise.all([
      this.prisma.partner.findUnique({ where: { id: partnerId } }),
      this.prisma.user.findUnique({ where: { id: ownerId } })
    ]);

    if (!partner || partner.status === "ARCHIVED") {
      throw new NotFoundException("Đối tác không tồn tại hoặc đã bị archive.");
    }

    if (!owner || owner.status !== "ACTIVE") {
      throw new NotFoundException("Owner không tồn tại hoặc không hoạt động.");
    }
  }

  private async enforceBudgetPolicy(fiscalYear: number, ownerId: string, campaign: string, value: number, contractId?: string) {
    const settings = await this.settingsService.getSettings();
    const budgetCheck = await this.budgetsService.evaluateBudget(fiscalYear, ownerId, campaign, value, contractId);

    if (budgetCheck.isOverBudget && settings.budgetOverrunPolicy === "BLOCK") {
      throw new BadRequestException("Hợp đồng vượt ngân sách được cấp và đang bị chặn theo cấu hình.");
    }

    return {
      ...budgetCheck,
      policy: settings.budgetOverrunPolicy,
      warning: budgetCheck.isOverBudget && settings.budgetOverrunPolicy === "WARN"
        ? "Hợp đồng vượt ngân sách nhưng được phép lưu dưới dạng cảnh báo."
        : null
    };
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
    return this.contractsService.create(payload, currentUser);
  }

  @Roles("ADMIN", "PR_COR_MANAGER", "PR_COR_STAFF")
  @Patch(":id")
  update(@Param("id") contractId: string, @Body() payload: unknown, @CurrentUser() currentUser: AuthenticatedUser) {
    return this.contractsService.update(contractId, payload, currentUser);
  }

  @Roles("ADMIN", "PR_COR_MANAGER")
  @Post(":id/activate")
  activate(@Param("id") contractId: string, @CurrentUser() currentUser: AuthenticatedUser) {
    return this.contractsService.activate(contractId, currentUser);
  }

  @Roles("ADMIN", "PR_COR_MANAGER")
  @Delete(":id")
  archive(@Param("id") contractId: string, @CurrentUser() currentUser: AuthenticatedUser) {
    return this.contractsService.archive(contractId, currentUser);
  }
}

@Module({
  imports: [BudgetsModule, SettingsModule],
  controllers: [ContractsController],
  providers: [ContractsService],
  exports: [ContractsService]
})
export class ContractsModule {}
