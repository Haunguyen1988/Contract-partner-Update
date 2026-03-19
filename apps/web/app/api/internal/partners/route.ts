import { createPartnerSchema, normalizeText, type Role } from "@contract/shared";
import { NextRequest, NextResponse } from "next/server";
import { RouteHttpError, handleRouteError, parseJsonBody, requireSession } from "../../../../src/server/internal-api";
import { prisma } from "../../../../src/server/prisma";
import { auditLogger } from "../../../../src/server/services";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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

export async function GET(request: NextRequest) {
  try {
    await requireSession(request, PARTNER_LIST_ROLES);

    const partners = await prisma.partner.findMany({
      where: { status: { not: "ARCHIVED" } },
      include: {
        primaryOwner: { select: { id: true, fullName: true, email: true } },
        backupOwner: { select: { id: true, fullName: true, email: true } }
      },
      orderBy: { legalName: "asc" }
    });

    return NextResponse.json(partners);
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const currentUser = await requireSession(request, PARTNER_WRITE_ROLES);
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
      changedById: currentUser.id,
      diffSummary: { legalName: partner.legalName, taxCode: partner.taxCode }
    });

    return NextResponse.json(partner);
  } catch (error) {
    return handleRouteError(error);
  }
}
