import { Body, Controller, Get, Injectable, Module, Param, Patch, UseGuards } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { AlertsDomainService } from "@contract/core";
import { alertResolutionSchema } from "@contract/shared";
import { AuditService } from "../../common/audit.service";
import { CurrentUser, type AuthenticatedUser } from "../../common/current-user.decorator";
import { PrismaService } from "../../common/prisma.service";
import { Roles } from "../../common/roles.decorator";
import { RolesGuard } from "../../common/roles.guard";
import { parseOrThrow } from "../../common/zod";
import { JwtAuthGuard } from "../auth/auth.module";
import { SettingsModule, SettingsService } from "../settings/settings.module";

@Injectable()
export class AlertsService extends AlertsDomainService {
  constructor(
    prisma: PrismaService,
    settingsService: SettingsService,
    auditService: AuditService
  ) {
    super(prisma, settingsService, auditService);
  }

  @Cron(CronExpression.EVERY_DAY_AT_1AM)
  override async syncContractExpiryAlerts() {
    return super.syncContractExpiryAlerts();
  }
}

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller("alerts")
export class AlertsController {
  constructor(private readonly alertsService: AlertsService) {}

  @Roles("ADMIN", "PR_COR_MANAGER", "PR_COR_STAFF", "FINANCE", "LEGAL", "PROCUREMENT", "LEADERSHIP")
  @Get()
  list(@CurrentUser() currentUser: AuthenticatedUser) {
    return this.alertsService.list(currentUser);
  }

  @Roles("ADMIN", "PR_COR_MANAGER", "PR_COR_STAFF", "FINANCE")
  @Patch(":id/resolve")
  resolve(@Param("id") alertId: string, @Body() payload: unknown, @CurrentUser() currentUser: AuthenticatedUser) {
    return this.alertsService.resolve(alertId, parseOrThrow(alertResolutionSchema, payload), currentUser.id);
  }
}

@Module({
  imports: [SettingsModule],
  controllers: [AlertsController],
  providers: [AlertsService],
  exports: [AlertsService]
})
export class AlertsModule {}
