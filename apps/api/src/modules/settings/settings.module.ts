import { Body, Controller, Get, Injectable, Module, Patch, UseGuards } from "@nestjs/common";
import { SettingsDomainService } from "@contract/core";
import { appSettingsSchema } from "@contract/shared";
import { AuditService } from "../../common/audit.service";
import { CurrentUser, type AuthenticatedUser } from "../../common/current-user.decorator";
import { PrismaService } from "../../common/prisma.service";
import { Roles } from "../../common/roles.decorator";
import { RolesGuard } from "../../common/roles.guard";
import { parseOrThrow } from "../../common/zod";
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

  @Roles("ADMIN", "PR_COR_MANAGER", "FINANCE")
  @Get()
  getSettings() {
    return this.settingsService.getSettings();
  }

  @Roles("ADMIN", "PR_COR_MANAGER")
  @Patch()
  updateSettings(@Body() payload: unknown, @CurrentUser() currentUser: AuthenticatedUser) {
    return this.settingsService.updateSettings(parseOrThrow(appSettingsSchema, payload), currentUser.id);
  }
}

@Module({
  controllers: [SettingsController],
  providers: [SettingsService],
  exports: [SettingsService]
})
export class SettingsModule {}
