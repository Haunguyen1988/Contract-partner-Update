import { Injectable } from "@nestjs/common";
import { EntityType, Prisma } from "@prisma/client";
import { PrismaService } from "./prisma.service";

interface AuditEntry {
  entityType: EntityType;
  entityId: string;
  action: string;
  changedById?: string | null;
  diffSummary?: Record<string, unknown> | null;
}

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  async log(entry: AuditEntry) {
    return this.prisma.auditLog.create({
      data: {
        entityType: entry.entityType,
        entityId: entry.entityId,
        action: entry.action,
        changedById: entry.changedById ?? null,
        diffSummary: entry.diffSummary
          ? (entry.diffSummary as Prisma.InputJsonValue)
          : Prisma.JsonNull
      }
    });
  }
}
