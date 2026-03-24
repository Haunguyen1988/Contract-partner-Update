import {
  daysUntil,
  toIsoDateString,
  type AlertResolutionInput
} from "@contract/shared";
import type { AlertsPrismaClient, AuditLogger, ServiceActor, SettingsReader } from "./types";

export class AlertsDomainService {
  constructor(
    private readonly prisma: AlertsPrismaClient,
    private readonly settingsReader: SettingsReader,
    private readonly auditLogger: AuditLogger
  ) {}

  async list(currentUser: ServiceActor) {
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
      dueDate: toIsoDateString(alert.dueDate),
      assignedRole: alert.assignedRole,
      contractNo: alert.contract?.contractNo ?? null
    }));
  }

  async resolve(alertId: string, input: AlertResolutionInput, changedById: string) {
    const alert = await this.prisma.alert.update({
      where: { id: alertId },
      data: {
        status: input.status,
        resolvedAt: new Date(),
        resolvedById: changedById
      }
    });

    await this.auditLogger.log({
      entityType: "ALERT",
      entityId: alertId,
      action: "RESOLVE_ALERT",
      changedById,
      diffSummary: input
    });

    return alert;
  }

  async syncContractExpiryAlerts(today = new Date()) {
    const settings = await this.settingsReader.getSettings();
    const leadDays = settings.expiryLeadDays;

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
