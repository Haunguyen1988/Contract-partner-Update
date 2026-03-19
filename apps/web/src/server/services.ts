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

export const auditLogger = {
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

export function createBudgetsService() {
  return new BudgetsDomainService(prisma, auditLogger);
}

export function createSettingsService() {
  return new SettingsDomainService(prisma, auditLogger);
}

export function createContractsService() {
  return new ContractsDomainService(
    prisma,
    createBudgetsService(),
    createSettingsService(),
    auditLogger
  );
}

export function createAlertsService() {
  return new AlertsDomainService(
    prisma,
    createSettingsService(),
    auditLogger
  );
}

export function createImportsService() {
  return new ImportsDomainService(prisma);
}

export function createDocumentsService() {
  return new DocumentsDomainService(
    prisma,
    new LocalDocumentFileStore(process.env.UPLOAD_DIR ?? "./apps/api/uploads"),
    auditLogger
  );
}
