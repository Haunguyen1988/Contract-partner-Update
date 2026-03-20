import { Body, ConflictException, Controller, Get, Injectable, Module, NotFoundException, Param, Patch, Post, Delete, UseGuards } from "@nestjs/common";
import { createPartnerSchema, normalizeText, updatePartnerSchema } from "@contract/shared";
import { AuditService } from "../../common/audit.service";
import { CurrentUser, type AuthenticatedUser } from "../../common/current-user.decorator";
import { PrismaService } from "../../common/prisma.service";
import { Roles } from "../../common/roles.decorator";
import { RolesGuard } from "../../common/roles.guard";
import { parseOrThrow } from "../../common/zod";
import { JwtAuthGuard } from "../auth/auth.module";

@Injectable()
export class PartnersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService
  ) {}

  list() {
    return this.prisma.partner.findMany({
      where: { status: { not: "ARCHIVED" } },
      include: {
        primaryOwner: { select: { id: true, fullName: true, email: true } },
        backupOwner: { select: { id: true, fullName: true, email: true } }
      },
      orderBy: { legalName: "asc" }
    });
  }

  async findOne(partnerId: string) {
    const partner = await this.prisma.partner.findUnique({
      where: { id: partnerId },
      include: {
        primaryOwner: { select: { id: true, fullName: true, email: true } },
        backupOwner: { select: { id: true, fullName: true, email: true } },
        contracts: {
          select: {
            id: true,
            contractNo: true,
            title: true,
            lifecycleStatus: true,
            value: true,
            endDate: true
          },
          orderBy: { createdAt: "desc" }
        }
      }
    });

    if (!partner) {
      throw new NotFoundException("Không tìm thấy đối tác.");
    }

    return partner;
  }

  async create(payload: unknown, currentUser: AuthenticatedUser) {
    const input = parseOrThrow(createPartnerSchema, payload);
    const contactInfo = input.contactInfo ?? {};
    await this.assertOwnerExists(input.primaryOwnerId, input.backupOwnerId);
    await this.ensureNotDuplicate(input.legalName, input.taxCode);

    const partner = await this.prisma.partner.create({
      data: {
        code: input.code,
        legalName: input.legalName,
        shortName: input.shortName ?? null,
        normalizedName: normalizeText(input.legalName),
        taxCode: input.taxCode ?? null,
        category: input.category ?? null,
        primaryOwnerId: input.primaryOwnerId,
        backupOwnerId: input.backupOwnerId ?? null,
        contactName: contactInfo.contactName ?? null,
        contactEmail: contactInfo.contactEmail || null,
        contactPhone: contactInfo.contactPhone ?? null,
        address: contactInfo.address ?? null,
        notes: input.notes ?? null
      }
    });

    await this.auditService.log({
      entityType: "PARTNER",
      entityId: partner.id,
      action: "CREATE_PARTNER",
      changedById: currentUser.id,
      diffSummary: { legalName: partner.legalName, taxCode: partner.taxCode }
    });

    return this.findOne(partner.id);
  }

  async update(partnerId: string, payload: unknown, currentUser: AuthenticatedUser) {
    const existing = await this.prisma.partner.findUnique({ where: { id: partnerId } });

    if (!existing) {
      throw new NotFoundException("Không tìm thấy đối tác.");
    }

    const input = parseOrThrow(updatePartnerSchema, payload);
    await this.assertOwnerExists(input.primaryOwnerId ?? existing.primaryOwnerId, input.backupOwnerId ?? existing.backupOwnerId);

    if (input.legalName || input.taxCode) {
      await this.ensureNotDuplicate(input.legalName ?? existing.legalName, input.taxCode ?? existing.taxCode, partnerId);
    }

    await this.prisma.partner.update({
      where: { id: partnerId },
      data: {
        code: input.code ?? existing.code,
        legalName: input.legalName ?? existing.legalName,
        shortName: input.shortName ?? existing.shortName,
        normalizedName: normalizeText(input.legalName ?? existing.legalName),
        taxCode: input.taxCode ?? existing.taxCode,
        category: input.category ?? existing.category,
        primaryOwnerId: input.primaryOwnerId ?? existing.primaryOwnerId,
        backupOwnerId: input.backupOwnerId ?? existing.backupOwnerId,
        contactName: input.contactInfo?.contactName ?? existing.contactName,
        contactEmail: input.contactInfo?.contactEmail ?? existing.contactEmail,
        contactPhone: input.contactInfo?.contactPhone ?? existing.contactPhone,
        address: input.contactInfo?.address ?? existing.address,
        notes: input.notes ?? existing.notes
      }
    });

    await this.auditService.log({
      entityType: "PARTNER",
      entityId: partnerId,
      action: "UPDATE_PARTNER",
      changedById: currentUser.id,
      diffSummary: input as Record<string, unknown>
    });

    return this.findOne(partnerId);
  }

  async archive(partnerId: string, currentUser: AuthenticatedUser) {
    const existing = await this.prisma.partner.findUnique({ where: { id: partnerId } });

    if (!existing) {
      throw new NotFoundException("Không tìm thấy đối tác.");
    }

    await this.prisma.partner.update({
      where: { id: partnerId },
      data: {
        status: "ARCHIVED",
        archivedAt: new Date()
      }
    });

    await this.auditService.log({
      entityType: "PARTNER",
      entityId: partnerId,
      action: "ARCHIVE_PARTNER",
      changedById: currentUser.id,
      diffSummary: { status: "ARCHIVED" }
    });

    return { success: true };
  }

  private async assertOwnerExists(primaryOwnerId: string, backupOwnerId?: string | null) {
    const users = await this.prisma.user.findMany({
      where: { id: { in: [primaryOwnerId, backupOwnerId].filter(Boolean) as string[] } },
      select: { id: true }
    });

    if (!users.some((user) => user.id === primaryOwnerId)) {
      throw new NotFoundException("Primary owner không tồn tại.");
    }

    if (backupOwnerId && !users.some((user) => user.id === backupOwnerId)) {
      throw new NotFoundException("Backup owner không tồn tại.");
    }
  }

  private async ensureNotDuplicate(legalName: string, taxCode?: string | null, currentPartnerId?: string) {
    const normalizedName = normalizeText(legalName);

    const duplicate = await this.prisma.partner.findFirst({
      where: {
        status: { not: "ARCHIVED" },
        ...(currentPartnerId ? { NOT: { id: currentPartnerId } } : {}),
        OR: [
          { normalizedName },
          ...(taxCode ? [{ taxCode }] : [])
        ]
      }
    });

    if (duplicate) {
      throw new ConflictException("Đối tác bị trùng theo tên chuẩn hóa hoặc mã số thuế.");
    }
  }
}

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller("partners")
export class PartnersController {
  constructor(private readonly partnersService: PartnersService) {}

  @Roles("ADMIN", "PR_COR_MANAGER", "PR_COR_STAFF", "FINANCE", "LEGAL", "PROCUREMENT", "LEADERSHIP")
  @Get()
  list() {
    return this.partnersService.list();
  }

  @Roles("ADMIN", "PR_COR_MANAGER", "PR_COR_STAFF", "FINANCE", "LEGAL", "PROCUREMENT")
  @Get(":id")
  findOne(@Param("id") partnerId: string) {
    return this.partnersService.findOne(partnerId);
  }

  @Roles("ADMIN", "PR_COR_MANAGER", "PR_COR_STAFF")
  @Post()
  create(@Body() payload: unknown, @CurrentUser() currentUser: AuthenticatedUser) {
    return this.partnersService.create(payload, currentUser);
  }

  @Roles("ADMIN", "PR_COR_MANAGER", "PR_COR_STAFF")
  @Patch(":id")
  update(@Param("id") partnerId: string, @Body() payload: unknown, @CurrentUser() currentUser: AuthenticatedUser) {
    return this.partnersService.update(partnerId, payload, currentUser);
  }

  @Roles("ADMIN", "PR_COR_MANAGER")
  @Delete(":id")
  archive(@Param("id") partnerId: string, @CurrentUser() currentUser: AuthenticatedUser) {
    return this.partnersService.archive(partnerId, currentUser);
  }
}

@Module({
  controllers: [PartnersController],
  providers: [PartnersService],
  exports: [PartnersService]
})
export class PartnersModule {}
