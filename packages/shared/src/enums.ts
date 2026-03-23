import { z } from "zod";

export const roleValues = [
  "ADMIN",
  "PR_COR_STAFF",
  "PR_COR_MANAGER",
  "FINANCE",
  "LEGAL",
  "PROCUREMENT",
  "LEADERSHIP"
] as const;

export const userStatusValues = ["ACTIVE", "INACTIVE", "INVITED"] as const;
export const partnerStatusValues = ["ACTIVE", "INACTIVE", "ARCHIVED"] as const;
export const contractLifecycleStatusValues = [
  "DRAFT",
  "PENDING_APPROVAL",
  "PENDING_ACTIVATION",
  "ACTIVE",
  "REJECTED",
  "EXPIRED",
  "TERMINATED",
  "LIQUIDATED",
  "ARCHIVED"
] as const;
export const budgetOverrunPolicyValues = ["WARN", "BLOCK"] as const;
export const documentTypeValues = ["MAIN_CONTRACT", "APPENDIX", "SUPPORTING_DOC"] as const;
export const alertTypeValues = ["CONTRACT_EXPIRY", "BUDGET_OVERAGE", "MISSING_DOCUMENT"] as const;
export const alertSeverityValues = ["INFO", "WARNING", "CRITICAL"] as const;
export const alertStatusValues = ["OPEN", "RESOLVED", "DISMISSED"] as const;
export const entityTypeValues = ["USER", "PARTNER", "CONTRACT", "BUDGET", "DOCUMENT", "ALERT", "SETTING", "IMPORT"] as const;

export const roleSchema = z.enum(roleValues);
export const userStatusSchema = z.enum(userStatusValues);
export const partnerStatusSchema = z.enum(partnerStatusValues);
export const contractLifecycleStatusSchema = z.enum(contractLifecycleStatusValues);
export const budgetOverrunPolicySchema = z.enum(budgetOverrunPolicyValues);
export const documentTypeSchema = z.enum(documentTypeValues);
export const alertTypeSchema = z.enum(alertTypeValues);
export const alertSeveritySchema = z.enum(alertSeverityValues);
export const alertStatusSchema = z.enum(alertStatusValues);
export const entityTypeSchema = z.enum(entityTypeValues);

export type Role = z.infer<typeof roleSchema>;
export type UserStatus = z.infer<typeof userStatusSchema>;
export type PartnerStatus = z.infer<typeof partnerStatusSchema>;
export type ContractLifecycleStatus = z.infer<typeof contractLifecycleStatusSchema>;
export type BudgetOverrunPolicy = z.infer<typeof budgetOverrunPolicySchema>;
export type DocumentType = z.infer<typeof documentTypeSchema>;
export type AlertType = z.infer<typeof alertTypeSchema>;
export type AlertSeverity = z.infer<typeof alertSeveritySchema>;
export type AlertStatus = z.infer<typeof alertStatusSchema>;
export type EntityType = z.infer<typeof entityTypeSchema>;

