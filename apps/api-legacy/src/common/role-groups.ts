import type { Role } from "@contract/shared";

export const ADMIN_ONLY_ROLES = ["ADMIN"] as const satisfies readonly Role[];
export const ADMIN_MANAGER_ROLES = ["ADMIN", "PR_COR_MANAGER"] as const satisfies readonly Role[];
export const FINANCE_MANAGER_ROLES = ["ADMIN", "PR_COR_MANAGER", "FINANCE"] as const satisfies readonly Role[];
export const OPERATIONS_ROLES = ["ADMIN", "PR_COR_MANAGER", "PR_COR_STAFF"] as const satisfies readonly Role[];
export const ALERT_RESOLUTION_ROLES = ["ADMIN", "PR_COR_MANAGER", "PR_COR_STAFF", "FINANCE"] as const satisfies readonly Role[];
export const BUDGET_READ_ROLES = ["ADMIN", "PR_COR_MANAGER", "FINANCE", "LEADERSHIP"] as const satisfies readonly Role[];
export const AUDIT_READ_ROLES = ["ADMIN", "PR_COR_MANAGER", "FINANCE", "LEGAL", "PROCUREMENT", "LEADERSHIP"] as const satisfies readonly Role[];
export const BUSINESS_READ_ROLES = [
  "ADMIN",
  "PR_COR_MANAGER",
  "PR_COR_STAFF",
  "FINANCE",
  "LEGAL",
  "PROCUREMENT",
  "LEADERSHIP"
] as const satisfies readonly Role[];
export const PARTNER_DETAIL_ROLES = [
  "ADMIN",
  "PR_COR_MANAGER",
  "PR_COR_STAFF",
  "FINANCE",
  "LEGAL",
  "PROCUREMENT"
] as const satisfies readonly Role[];

