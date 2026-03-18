import { z } from "zod";
import {
  alertSeveritySchema,
  budgetOverrunPolicySchema,
  contractLifecycleStatusSchema,
  documentTypeSchema,
  roleSchema,
  userStatusSchema
} from "./enums";

const requiredText = (label: string) => z.string().trim().min(1, `${label} is required`);

export const loginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(8)
});

export const createUserSchema = z.object({
  fullName: requiredText("fullName"),
  email: z.string().trim().email(),
  password: z.string().min(8),
  role: roleSchema,
  department: z.string().trim().nullish(),
  status: userStatusSchema.default("ACTIVE")
});

export const updateUserSchema = createUserSchema.partial().extend({
  password: z.string().min(8).optional()
});

export const partnerContactInfoSchema = z.object({
  contactName: z.string().trim().nullish(),
  contactEmail: z.string().trim().email().nullish().or(z.literal("")),
  contactPhone: z.string().trim().nullish(),
  address: z.string().trim().nullish()
});

export const createPartnerSchema = z.object({
  code: requiredText("code"),
  legalName: requiredText("legalName"),
  shortName: z.string().trim().nullish(),
  taxCode: z.string().trim().min(8).max(20).nullish(),
  category: z.string().trim().nullish(),
  primaryOwnerId: requiredText("primaryOwnerId"),
  backupOwnerId: z.string().trim().nullish(),
  contactInfo: partnerContactInfoSchema.default({}),
  notes: z.string().trim().nullish()
});

export const updatePartnerSchema = createPartnerSchema.partial();

export const createBudgetAllocationSchema = z.object({
  fiscalYear: z.number().int().min(2024).max(2100),
  ownerId: requiredText("ownerId"),
  campaign: z.string().trim().default("GENERAL"),
  allocatedAmount: z.coerce.number().nonnegative()
});

export const updateBudgetAllocationSchema = createBudgetAllocationSchema.partial();

const contractSchemaBase = z.object({
  contractNo: requiredText("contractNo"),
  partnerId: requiredText("partnerId"),
  ownerId: requiredText("ownerId"),
  title: requiredText("title"),
  campaign: z.string().trim().default("GENERAL"),
  fiscalYear: z.number().int().min(2024).max(2100),
  value: z.coerce.number().positive(),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  lifecycleStatus: contractLifecycleStatusSchema.default("DRAFT"),
  notes: z.string().trim().nullish()
});

export const createContractSchema = contractSchemaBase.superRefine((payload, ctx) => {
  if (new Date(payload.endDate) <= new Date(payload.startDate)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "endDate must be later than startDate",
      path: ["endDate"]
    });
  }
});

export const updateContractSchema = contractSchemaBase.partial().superRefine((payload, ctx) => {
  if (payload.startDate && payload.endDate && new Date(payload.endDate) <= new Date(payload.startDate)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "endDate must be later than startDate",
      path: ["endDate"]
    });
  }
});

export const contractDocumentMetadataSchema = z.object({
  type: documentTypeSchema,
  filename: requiredText("filename"),
  mimeType: requiredText("mimeType"),
  size: z.number().int().positive()
});

export const appSettingsSchema = z.object({
  budgetOverrunPolicy: budgetOverrunPolicySchema.default("WARN"),
  expiryLeadDays: z.array(z.number().int().positive()).min(1)
});

export const csvImportSchema = z.object({
  csv: requiredText("csv")
});

export const alertResolutionSchema = z.object({
  status: z.enum(["RESOLVED", "DISMISSED"]).default("RESOLVED"),
  note: z.string().trim().nullish()
});

export const dashboardTaskSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  dueDate: z.string(),
  severity: alertSeveritySchema
});

export type LoginInput = z.infer<typeof loginSchema>;
export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type CreatePartnerInput = z.infer<typeof createPartnerSchema>;
export type UpdatePartnerInput = z.infer<typeof updatePartnerSchema>;
export type CreateContractInput = z.infer<typeof createContractSchema>;
export type UpdateContractInput = z.infer<typeof updateContractSchema>;
export type CreateBudgetAllocationInput = z.infer<typeof createBudgetAllocationSchema>;
export type UpdateBudgetAllocationInput = z.infer<typeof updateBudgetAllocationSchema>;
export type ContractDocumentMetadataInput = z.infer<typeof contractDocumentMetadataSchema>;
export type AppSettingsInput = z.infer<typeof appSettingsSchema>;
export type CsvImportInput = z.infer<typeof csvImportSchema>;
