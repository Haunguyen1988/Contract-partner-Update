export const CONTRACT_EXPIRY_LEAD_DAYS = [30, 15, 7, 1] as const;
export const DEFAULT_BUDGET_POLICY = "WARN";
export const DEFAULT_CAMPAIGN = "GENERAL";

export const APP_SETTING_KEYS = {
  budgetOverrunPolicy: "budget_overrun_policy",
  expiryLeadDays: "contract_expiry_lead_days"
} as const;

