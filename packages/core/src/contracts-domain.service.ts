import {
  DEFAULT_CAMPAIGN,
  needsMainContractDocument,
  toIsoDateString,
  toNumber,
  toNumericString,
  type CreateContractInput,
  type UpdateContractInput
} from "@contract/shared";
import { DomainNotFoundError, DomainRuleError } from "./errors";
import type {
  AuditLogger,
  BudgetCoordinator,
  ContractsPrismaClient,
  SettingsReader
} from "./types";

interface ContractDetailsRecord {
  id: string;
  contractNo: string;
  partnerId: string;
  ownerId: string;
  title: string;
  campaign: string;
  fiscalYear: number;
  value: { toString(): string } | number | string | null;
  startDate: Date;
  endDate: Date;
  lifecycleStatus: string;
  notes: string | null;
  partner: {
    legalName: string;
  };
  owner: {
    fullName: string;
  };
  documents: Array<{
    id: string;
    type: string;
    filename: string;
    originalName: string;
    mimeType: string;
    size: number;
    uploadedAt: Date;
  }>;
}

export class ContractsDomainService {
  constructor(
    private readonly prisma: ContractsPrismaClient,
    private readonly budgetsService: BudgetCoordinator,
    private readonly settingsReader: SettingsReader,
    private readonly auditLogger: AuditLogger
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
      value: toNumericString(contract.value),
      startDate: toIsoDateString(contract.startDate),
      endDate: toIsoDateString(contract.endDate),
      lifecycleStatus: contract.lifecycleStatus,
      hasMainContract: contract.documents.some((document) => document.type === "MAIN_CONTRACT")
    }));
  }

  async findOne(contractId: string) {
    const contract = await this.getContractDetailsOrThrow(contractId);
    return this.mapContractDetails(contract);
  }

  async create(input: CreateContractInput, changedById: string) {
    await this.assertContractReferences(input.partnerId, input.ownerId);

    const campaign = input.campaign || DEFAULT_CAMPAIGN;
    const budgetCheck = await this.enforceBudgetPolicy(input.fiscalYear, input.ownerId, campaign, input.value);

    const contract = await this.prisma.contract.create({
      data: {
        contractNo: input.contractNo,
        partnerId: input.partnerId,
        ownerId: input.ownerId,
        title: input.title,
        campaign,
        fiscalYear: input.fiscalYear,
        value: input.value,
        startDate: new Date(input.startDate),
        endDate: new Date(input.endDate),
        lifecycleStatus: input.lifecycleStatus,
        notes: input.notes ?? null
      }
    });

    await this.budgetsService.recomputeBudget(contract.fiscalYear, contract.ownerId, contract.campaign);

    await this.auditLogger.log({
      entityType: "CONTRACT",
      entityId: contract.id,
      action: "CREATE_CONTRACT",
      changedById,
      diffSummary: { contractNo: contract.contractNo, value: input.value, budgetCheck }
    });

    return {
      contract: await this.findOne(contract.id),
      budgetCheck
    };
  }

  async update(contractId: string, input: UpdateContractInput, changedById: string) {
    const existing = await this.prisma.contract.findUnique({ where: { id: contractId } });

    if (!existing) {
      throw new DomainNotFoundError("Khong tim thay hop dong.");
    }

    const partnerId = input.partnerId ?? existing.partnerId;
    const ownerId = input.ownerId ?? existing.ownerId;
    const campaign = input.campaign ?? existing.campaign;
    const fiscalYear = input.fiscalYear ?? existing.fiscalYear;
    const value = input.value ?? toNumber(existing.value);

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

    await this.auditLogger.log({
      entityType: "CONTRACT",
      entityId: contractId,
      action: "UPDATE_CONTRACT",
      changedById,
      diffSummary: { ...input, budgetCheck }
    });

    return {
      contract: await this.findOne(contractId),
      budgetCheck
    };
  }

  async activate(contractId: string, changedById: string) {
    const contract = await this.prisma.contract.findUnique({
      where: { id: contractId },
      include: {
        documents: { select: { type: true } }
      }
    });

    if (!contract) {
      throw new DomainNotFoundError("Khong tim thay hop dong.");
    }

    if (needsMainContractDocument(contract.documents.map((document) => document.type))) {
      throw new DomainRuleError("Khong the kich hoat neu chua co tai lieu hop dong chinh.");
    }

    if (!contract.contractNo || !contract.partnerId || !contract.ownerId || !contract.title) {
      throw new DomainRuleError("Hop dong thieu du lieu bat buoc.");
    }

    await this.prisma.contract.update({
      where: { id: contractId },
      data: {
        lifecycleStatus: "ACTIVE",
        activatedAt: new Date()
      }
    });

    await this.budgetsService.recomputeBudget(contract.fiscalYear, contract.ownerId, contract.campaign);

    await this.auditLogger.log({
      entityType: "CONTRACT",
      entityId: contractId,
      action: "ACTIVATE_CONTRACT",
      changedById,
      diffSummary: { lifecycleStatus: "ACTIVE" }
    });

    return this.findOne(contractId);
  }

  async archive(contractId: string, changedById: string) {
    const contract = await this.prisma.contract.findUnique({ where: { id: contractId } });

    if (!contract) {
      throw new DomainNotFoundError("Khong tim thay hop dong.");
    }

    await this.prisma.contract.update({
      where: { id: contractId },
      data: {
        lifecycleStatus: "ARCHIVED",
        archivedAt: new Date()
      }
    });

    await this.budgetsService.recomputeBudget(contract.fiscalYear, contract.ownerId, contract.campaign);

    await this.auditLogger.log({
      entityType: "CONTRACT",
      entityId: contractId,
      action: "ARCHIVE_CONTRACT",
      changedById,
      diffSummary: { lifecycleStatus: "ARCHIVED" }
    });

    return { success: true };
  }

  private async getContractDetailsOrThrow(contractId: string) {
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
      throw new DomainNotFoundError("Khong tim thay hop dong.");
    }

    return contract;
  }

  private mapContractDetails(contract: ContractDetailsRecord) {
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
      value: toNumericString(contract.value),
      startDate: toIsoDateString(contract.startDate),
      endDate: toIsoDateString(contract.endDate),
      lifecycleStatus: contract.lifecycleStatus,
      notes: contract.notes,
      documents: contract.documents.map((document) => ({
        ...document,
        uploadedAt: toIsoDateString(document.uploadedAt)
      }))
    };
  }

  private async assertContractReferences(partnerId: string, ownerId: string) {
    const [partner, owner] = await Promise.all([
      this.prisma.partner.findUnique({ where: { id: partnerId } }),
      this.prisma.user.findUnique({ where: { id: ownerId } })
    ]);

    if (!partner || partner.status === "ARCHIVED") {
      throw new DomainNotFoundError("Doi tac khong ton tai hoac da bi archive.");
    }

    if (!owner || owner.status !== "ACTIVE") {
      throw new DomainNotFoundError("Owner khong ton tai hoac khong hoat dong.");
    }
  }

  private async enforceBudgetPolicy(
    fiscalYear: number,
    ownerId: string,
    campaign: string,
    value: number,
    contractId?: string
  ) {
    const settings = await this.settingsReader.getSettings();
    const budgetCheck = await this.budgetsService.evaluateBudget(fiscalYear, ownerId, campaign, value, contractId);

    if (budgetCheck.isOverBudget && settings.budgetOverrunPolicy === "BLOCK") {
      throw new DomainRuleError("Hop dong vuot ngan sach duoc cap va dang bi chan theo cau hinh.");
    }

    return {
      ...budgetCheck,
      policy: settings.budgetOverrunPolicy,
      warning: budgetCheck.isOverBudget && settings.budgetOverrunPolicy === "WARN"
        ? "Hop dong vuot ngan sach nhung duoc phep luu duoi dang canh bao."
        : null
    };
  }
}
