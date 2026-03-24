import { createPartnerSchema, normalizeText, type Role } from "@contract/shared";
import {
  RouteHttpError,
  defineAuthorizedRoute,
  parseJsonBody
} from "../../../../src/server/internal-api";
import { prisma } from "../../../../src/server/prisma";
import { auditLogger } from "../../../../src/server/services";

export {
  INTERNAL_ROUTE_DYNAMIC as dynamic,
  INTERNAL_ROUTE_RUNTIME as runtime
} from "../../../../src/server/internal-api";

const PARTNER_LIST_ROLES: Role[] = [
  "ADMIN",
  "PR_COR_MANAGER",
  "PR_COR_STAFF",
  "FINANCE",
  "LEGAL",
  "PROCUREMENT",
  "LEADERSHIP"
];
const PARTNER_WRITE_ROLES: Role[] = ["ADMIN", "PR_COR_MANAGER", "PR_COR_STAFF"];

export const GET = defineAuthorizedRoute(
  PARTNER_LIST_ROLES,
  async () => prisma.partner.findMany({
    where: { status: { not: "ARCHIVED" } },
    include: {
      primaryOwner: { select: { id: true, fullName: true, email: true } },
      backupOwner: { select: { id: true, fullName: true, email: true } }
    },
    orderBy: { legalName: "asc" }
  })
);

export const POST = defineAuthorizedRoute(
  PARTNER_WRITE_ROLES,
  async ({ request, user }) => {
    const input = await parseJsonBody(request, createPartnerSchema);
    const contactInfo = input.contactInfo ?? {};

    const owners = await prisma.user.findMany({
      where: { id: { in: [input.primaryOwnerId, input.backupOwnerId].filter(Boolean) as string[] } },
      select: { id: true }
    });

    if (!owners.some((owner) => owner.id === input.primaryOwnerId)) {
      throw new RouteHttpError(404, "Primary owner khong ton tai.");
    }

    if (input.backupOwnerId && !owners.some((owner) => owner.id === input.backupOwnerId)) {
      throw new RouteHttpError(404, "Backup owner khong ton tai.");
    }

    const duplicate = await prisma.partner.findFirst({
      where: {
        status: { not: "ARCHIVED" },
        OR: [
          { normalizedName: normalizeText(input.legalName) },
          ...(input.taxCode ? [{ taxCode: input.taxCode }] : [])
        ]
      }
    });

    if (duplicate) {
      throw new RouteHttpError(409, "Doi tac bi trung theo ten chuan hoa hoac ma so thue.");
    }

    const partner = await prisma.partner.create({
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
      },
      include: {
        primaryOwner: { select: { id: true, fullName: true, email: true } },
        backupOwner: { select: { id: true, fullName: true, email: true } }
      }
    });

    await auditLogger.log({
      entityType: "PARTNER",
      entityId: partner.id,
      action: "CREATE_PARTNER",
      changedById: user.id,
      diffSummary: { legalName: partner.legalName, taxCode: partner.taxCode }
    });

    return partner;
  }
);
