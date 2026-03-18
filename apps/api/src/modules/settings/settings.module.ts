import { Body, Controller, Get, Injectable, Module, Patch, UseGuards } from "@nestjs/common";
import { APP_SETTING_KEYS, DEFAULT_BUDGET_POLICY, appSettingsSchema } from "@contract/shared";
import { AuditService } from "../../common/audit.service";
import { CurrentUser, type AuthenticatedUser } from "../../common/current-user.decorator";
import { PrismaService } from "../../common/prisma.service";
import { Roles } from "../../common/roles.decorator";
import { RolesGuard } from "../../common/roles.guard";
import { parseOrThrow } from "../../common/zod";
import { JwtAuthGuard } from "../auth/auth.module";

@Injectable()
export class SettingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService
  ) {}

  async getSettings() {
    const settings = await this.prisma.appSetting.findMany();
    const map = new Map(settings.map((setting) => [setting.key, setting.value]));

    return {
      budgetOverrunPolicy: (map.get(APP_SETTING_KEYS.budgetOverrunPolicy) ?? DEFAULT_BUDGET_POLICY) as "WARN" | "BLOCK",
      expiryLeadDays: JSON.parse(map.get(APP_SETTING_KEYS.expiryLeadDays) ?? "[30,15,7,1]")
    };
  }

  async updateSettings(payload: unknown, currentUser: AuthenticatedUser) {
    const input = parseOrThrow(appSettingsSchema, payload);
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

    await this.auditService.log({
      entityType: "SETTING",
      entityId: APP_SETTING_KEYS.budgetOverrunPolicy,
      action: "UPDATE_SETTINGS",
      changedById: currentUser.id,
      diffSummary: normalizedSettings
    });

    return this.getSettings();
  }
}


@UseGuards(JwtAuthGuard, RolesGuard)
@Controller("settings")
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Roles("ADMIN", "PR_COR_MANAGER", "FINANCE")
  @Get()
  getSettings() {
    return this.settingsService.getSettings();
  }

  @Roles("ADMIN", "PR_COR_MANAGER")
  @Patch()
  updateSettings(@Body() payload: unknown, @CurrentUser() currentUser: AuthenticatedUser) {
    return this.settingsService.updateSettings(payload, currentUser);
  }
}

@Module({
  controllers: [SettingsController],
  providers: [SettingsService],
  exports: [SettingsService]
})
export class SettingsModule {}
