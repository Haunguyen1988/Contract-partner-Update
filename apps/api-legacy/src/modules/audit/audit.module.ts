import { Controller, Get, Module, UseGuards } from "@nestjs/common";
import { toIsoDateString } from "@contract/shared";
import { CurrentUser, type AuthenticatedUser } from "../../common/current-user.decorator";
import { PrismaService } from "../../common/prisma.service";
import { AUDIT_READ_ROLES } from "../../common/role-groups";
import { Roles } from "../../common/roles.decorator";
import { RolesGuard } from "../../common/roles.guard";
import { JwtAuthGuard } from "../auth/auth.module";

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller("audit")
export class AuditController {
  constructor(private readonly prisma: PrismaService) {}

  @Roles(...AUDIT_READ_ROLES)
  @Get()
  async list(@CurrentUser() currentUser: AuthenticatedUser) {
    const logs = await this.prisma.auditLog.findMany({
      include: {
        changedBy: {
          select: {
            fullName: true,
            email: true
          }
        }
      },
      orderBy: { changedAt: "desc" },
      take: currentUser.role === "ADMIN" ? 200 : 100
    });

    return logs.map((log) => ({
      id: log.id,
      entityType: log.entityType,
      entityId: log.entityId,
      action: log.action,
      changedAt: toIsoDateString(log.changedAt),
      changedBy: log.changedBy?.fullName ?? null,
      diffSummary: log.diffSummary
    }));
  }
}

@Module({
  controllers: [AuditController]
})
export class AuditModule {}

