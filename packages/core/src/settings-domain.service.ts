import {
  APP_SETTING_KEYS,
  DEFAULT_BUDGET_POLICY,
  type AppSettings,
  type AppSettingsInput
} from "@contract/shared";
import type { AuditLogger, SettingsPrismaClient } from "./types";

const DEFAULT_EXPIRY_LEAD_DAYS = [30, 15, 7, 1];

function parseExpiryLeadDays(value: string | undefined): number[] {
  if (!value) {
    return DEFAULT_EXPIRY_LEAD_DAYS;
  }

  try {
    const parsed = JSON.parse(value) as unknown;

    if (!Array.isArray(parsed) || parsed.some((item) => typeof item !== "number")) {
      return DEFAULT_EXPIRY_LEAD_DAYS;
    }

    return parsed;
  } catch {
    return DEFAULT_EXPIRY_LEAD_DAYS;
  }
}

export class SettingsDomainService {
  constructor(
    private readonly prisma: SettingsPrismaClient,
    private readonly auditLogger: AuditLogger
  ) {}

  async getSettings(): Promise<AppSettings> {
    const settings = await this.prisma.appSetting.findMany();
    const map = new Map(settings.map((setting) => [setting.key, setting.value]));

    return {
      budgetOverrunPolicy: (map.get(APP_SETTING_KEYS.budgetOverrunPolicy) ?? DEFAULT_BUDGET_POLICY) as "WARN" | "BLOCK",
      expiryLeadDays: parseExpiryLeadDays(map.get(APP_SETTING_KEYS.expiryLeadDays))
    };
  }

  async updateSettings(input: AppSettingsInput, changedById: string): Promise<AppSettings> {
    const normalizedSettings = {
      budgetOverrunPolicy: input.budgetOverrunPolicy ?? DEFAULT_BUDGET_POLICY,
      expiryLeadDays: input.expiryLeadDays
    };

    await this.prisma.$transaction([
      this.prisma.appSetting.upsert({
        where: { key: APP_SETTING_KEYS.budgetOverrunPolicy },
        update: { value: normalizedSettings.budgetOverrunPolicy },
        create: { key: APP_SETTING_KEYS.budgetOverrunPolicy, value: normalizedSettings.budgetOverrunPolicy }
      }),
      this.prisma.appSetting.upsert({
        where: { key: APP_SETTING_KEYS.expiryLeadDays },
        update: { value: JSON.stringify(normalizedSettings.expiryLeadDays) },
        create: { key: APP_SETTING_KEYS.expiryLeadDays, value: JSON.stringify(normalizedSettings.expiryLeadDays) }
      })
    ]);

    await this.auditLogger.log({
      entityType: "SETTING",
      entityId: APP_SETTING_KEYS.budgetOverrunPolicy,
      action: "UPDATE_SETTINGS",
      changedById,
      diffSummary: normalizedSettings
    });

    return this.getSettings();
  }
}
