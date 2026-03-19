import type { AppSettings, Role } from "@contract/shared";
import type { EntityType, PrismaClient } from "@prisma/client";

export interface AuditEntry {
  entityType: EntityType;
  entityId: string;
  action: string;
  changedById?: string | null;
  diffSummary?: Record<string, unknown> | null;
}

export interface AuditLogger {
  log(entry: AuditEntry): Promise<unknown>;
}

export interface ServiceActor {
  id: string;
  role: Role;
}

export interface BudgetEvaluation {
  hasBudget: boolean;
  remainingAmount: string;
  projectedRemainingAmount: string;
  isOverBudget?: boolean;
}

export interface SettingsReader {
  getSettings(): Promise<AppSettings>;
}

export interface BudgetCoordinator {
  recomputeBudget(fiscalYear: number, ownerId: string, campaign?: string | null): Promise<unknown>;
  evaluateBudget(
    fiscalYear: number,
    ownerId: string,
    campaign: string,
    nextContractValue: number,
    currentContractId?: string
  ): Promise<BudgetEvaluation>;
}

export interface UploadedBinaryFile {
  originalName: string;
  mimeType: string;
  size: number;
  buffer: Uint8Array;
}

export interface DocumentFileStore {
  store(contractId: string, originalName: string, buffer: Uint8Array): Promise<{
    filename: string;
    storageKey: string;
  }>;
}

export type SettingsPrismaClient = Pick<PrismaClient, "$transaction" | "appSetting">;
export type AlertsPrismaClient = Pick<PrismaClient, "alert" | "contract">;
export type ImportsPrismaClient = Pick<PrismaClient, "user">;
export type BudgetsPrismaClient = Pick<PrismaClient, "budgetAllocation" | "contract">;
export type ContractsPrismaClient = Pick<PrismaClient, "contract" | "partner" | "user">;
export type DocumentsPrismaClient = Pick<PrismaClient, "contract" | "contractDocument">;
