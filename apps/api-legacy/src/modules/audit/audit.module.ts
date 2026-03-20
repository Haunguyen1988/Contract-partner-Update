import { Controller, Get, Module, UseGuards } from "@nestjs/common";
import { CurrentUser, type AuthenticatedUser } from "../../common/current-user.decorator";
import { PrismaService } from "../../common/prisma.service";
import { Roles } from "../../common/roles.decorator";
import { RolesGuard } from "../../common/roles.guard";
import { JwtAuthGuard } from "../auth/auth.module";

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller("audit")
export class AuditController {
  constructor(private readonly prisma: PrismaService) {}

  @Roles("ADMIN", "PR_COR_MANAGER", "FINANCE", "LEGAL", "PROCUREMENT", "LEADERSHIP")
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
      changedAt: log.changedAt.toISOString(),
      changedBy: log.changedBy?.fullName ?? null,
      diffSummary: log.diffSummary
    }));
  }
}

@Module({
  controllers: [AuditController]
})
export class AuditModule {}

