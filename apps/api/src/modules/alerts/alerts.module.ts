import { Body, Controller, Get, Injectable, Module, Param, Patch, UseGuards } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { alertResolutionSchema, daysUntil } from "@contract/shared";
import { AuditService } from "../../common/audit.service";
import { CurrentUser, type AuthenticatedUser } from "../../common/current-user.decorator";
import { PrismaService } from "../../common/prisma.service";
import { Roles } from "../../common/roles.decorator";
import { RolesGuard } from "../../common/roles.guard";
import { parseOrThrow } from "../../common/zod";
import { JwtAuthGuard } from "../auth/auth.module";
import { SettingsModule, SettingsService } from "../settings/settings.module";

@Injectable()
export class AlertsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly settingsService: SettingsService,
    private readonly auditService: AuditService
  ) {}

  async list(currentUser: AuthenticatedUser) {
    const where = currentUser.role === "PR_COR_STAFF"
      ? {
          OR: [
            { assignedRole: currentUser.role },
            {
              contract: {
                ownerId: currentUser.id
              }
            }
          ]
        }
      : {};

    const alerts = await this.prisma.alert.findMany({
      where,
      include: {
        contract: {
          select: {
            contractNo: true,
            title: true
          }
        }
      },
      orderBy: [{ status: "asc" }, { dueDate: "asc" }]
    });

    return alerts.map((alert) => ({
      id: alert.id,
      type: alert.type,
      severity: alert.severity,
      status: alert.status,
      entityType: alert.entityType,
      entityId: alert.entityId,
      title: alert.title,
      message: alert.message,
      dueDate: alert.dueDate.toISOString(),
      assignedRole: alert.assignedRole,
      contractNo: alert.contract?.contractNo ?? null
    }));
  }

  async resolve(alertId: string, payload: unknown, currentUser: AuthenticatedUser) {
    const input = parseOrThrow(alertResolutionSchema, payload);

    const alert = await this.prisma.alert.update({
      where: { id: alertId },
      data: {
        status: input.status,
        resolvedAt: new Date(),
        resolvedById: currentUser.id
      }
    });

    await this.auditService.log({
      entityType: "ALERT",
      entityId: alertId,
      action: "RESOLVE_ALERT",
      changedById: currentUser.id,
      diffSummary: input
    });

    return alert;
  }

  @Cron(CronExpression.EVERY_DAY_AT_1AM)
  async syncContractExpiryAlerts() {
    const settings = await this.settingsService.getSettings();
    const leadDays = settings.expiryLeadDays;
    const today = new Date();

    const contracts = await this.prisma.contract.findMany({
      where: {
        lifecycleStatus: { in: ["ACTIVE", "PENDING_ACTIVATION"] },
        archivedAt: null
      },
      include: {
        partner: { select: { legalName: true } },
        owner: { select: { fullName: true } }
      }
    });

    for (const contract of contracts) {
      const daysRemaining = daysUntil(contract.endDate, today);

      if (daysRemaining < 0 && contract.lifecycleStatus === "ACTIVE") {
        await this.prisma.contract.update({
          where: { id: contract.id },
          data: { lifecycleStatus: "EXPIRED" }
        });
      }

      if (!leadDays.includes(daysRemaining)) {
        continue;
      }

      const fingerprint = `contract-expiry:${contract.id}:${daysRemaining}`;
      await this.prisma.alert.upsert({
        where: { fingerprint },
        update: {},
        create: {
          fingerprint,
          type: "CONTRACT_EXPIRY",
          severity: daysRemaining <= 7 ? "CRITICAL" : "WARNING",
          status: "OPEN",
          entityType: "CONTRACT",
          entityId: contract.id,
          contractId: contract.id,
          title: `Hợp đồng ${contract.contractNo} sắp hết hạn`,
          message: `Hợp đồng "${contract.title}" với ${contract.partner.legalName} còn ${daysRemaining} ngày.`,
          dueDate: contract.endDate,
          assignedRole: "PR_COR_STAFF"
        }
      });
    }
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
    return this.alertsService.resolve(alertId, payload, currentUser);
  }
}

@Module({
  imports: [SettingsModule],
  controllers: [AlertsController],
  providers: [AlertsService],
  exports: [AlertsService]
})
export class AlertsModule {}
