import { Controller, Get, Injectable, Module, Patch, UseGuards } from "@nestjs/common";
import { SettingsDomainService } from "@contract/core";
import { appSettingsSchema, type AppSettingsInput } from "@contract/shared";
import { AuditService } from "../../common/audit.service";
import { CurrentUser, type AuthenticatedUser } from "../../common/current-user.decorator";
import { PrismaService } from "../../common/prisma.service";
import { ADMIN_MANAGER_ROLES, FINANCE_MANAGER_ROLES } from "../../common/role-groups";
import { Roles } from "../../common/roles.decorator";
import { RolesGuard } from "../../common/roles.guard";
import { ValidatedBody } from "../../common/validated-body.decorator";
import { JwtAuthGuard } from "../auth/auth.module";

@Injectable()
export class SettingsService extends SettingsDomainService {
  constructor(
    prisma: PrismaService,
    auditService: AuditService
  ) {
    super(prisma, auditService);
  }
}

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller("settings")
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Roles(...FINANCE_MANAGER_ROLES)
  @Get()
  getSettings() {
    return this.settingsService.getSettings();
  }

  @Roles(...ADMIN_MANAGER_ROLES)
  @Patch()
  updateSettings(
    @ValidatedBody(appSettingsSchema) payload: AppSettingsInput,
    @CurrentUser() currentUser: AuthenticatedUser
  ) {
    return this.settingsService.updateSettings(payload, currentUser.id);
  }
}

@Module({
  controllers: [SettingsController],
  providers: [SettingsService],
  exports: [SettingsService]
})
export class SettingsModule {}
