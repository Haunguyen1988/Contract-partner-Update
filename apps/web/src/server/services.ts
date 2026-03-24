import {
  AlertsDomainService,
  BudgetsDomainService,
  ContractsDomainService,
  DocumentsDomainService,
  ImportsDomainService,
  LocalDocumentFileStore,
  SettingsDomainService,
  type AuditEntry
} from "@contract/core";
import { Prisma } from "@contract/db";
import { prisma } from "./prisma";

interface ServiceRegistry {
  auditLogger: {
    log(entry: AuditEntry): Promise<unknown>;
  };
  alertsService: AlertsDomainService;
  budgetsService: BudgetsDomainService;
  contractsService: ContractsDomainService;
  documentsService: DocumentsDomainService;
  importsService: ImportsDomainService;
  settingsService: SettingsDomainService;
}

const globalForServices = globalThis as typeof globalThis & {
  contractWebServices?: ServiceRegistry;
};

function createServiceRegistry(): ServiceRegistry {
  const auditLogger = {
    async log(entry: AuditEntry) {
      return prisma.auditLog.create({
        data: {
          entityType: entry.entityType,
          entityId: entry.entityId,
          action: entry.action,
          changedById: entry.changedById ?? null,
          diffSummary: entry.diffSummary
            ? (entry.diffSummary as Prisma.InputJsonValue)
            : Prisma.JsonNull
        }
      });
    }
  };

  const budgetsService = new BudgetsDomainService(prisma, auditLogger);
  const settingsService = new SettingsDomainService(prisma, auditLogger);

  return {
    auditLogger,
    alertsService: new AlertsDomainService(prisma, settingsService, auditLogger),
    budgetsService,
    contractsService: new ContractsDomainService(
      prisma,
      budgetsService,
      settingsService,
      auditLogger
    ),
    documentsService: new DocumentsDomainService(
      prisma,
      new LocalDocumentFileStore(process.env.UPLOAD_DIR ?? "./apps/api/uploads"),
      auditLogger
    ),
    importsService: new ImportsDomainService(prisma),
    settingsService
  };
}

const serviceRegistry = globalForServices.contractWebServices ?? createServiceRegistry();

if (process.env.NODE_ENV !== "production") {
  globalForServices.contractWebServices = serviceRegistry;
}

export const {
  auditLogger,
  alertsService,
  budgetsService,
  contractsService,
  documentsService,
  importsService,
  settingsService
} = serviceRegistry;

export function createBudgetsService() {
  return budgetsService;
}

export function createSettingsService() {
  return settingsService;
}

export function createContractsService() {
  return contractsService;
}

export function createAlertsService() {
  return alertsService;
}

export function createImportsService() {
  return importsService;
}

export function createDocumentsService() {
  return documentsService;
}
