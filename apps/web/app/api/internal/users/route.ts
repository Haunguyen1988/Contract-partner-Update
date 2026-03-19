import bcrypt from "bcryptjs";
import { createUserSchema, type Role } from "@contract/shared";
import { NextRequest, NextResponse } from "next/server";
import { handleRouteError, parseJsonBody, requireSession } from "../../../../src/server/internal-api";
import { prisma } from "../../../../src/server/prisma";
import { auditLogger } from "../../../../src/server/services";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const USER_LIST_ROLES: Role[] = ["ADMIN", "PR_COR_MANAGER"];
const USER_WRITE_ROLES: Role[] = ["ADMIN"];

export async function GET(request: NextRequest) {
  try {
    await requireSession(request, USER_LIST_ROLES);

    const users = await prisma.user.findMany({
      orderBy: { fullName: "asc" },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        department: true,
        status: true,
        lastLoginAt: true
      }
    });

    return NextResponse.json(users);
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const currentUser = await requireSession(request, USER_WRITE_ROLES);
    const input = await parseJsonBody(request, createUserSchema);
    const passwordHash = await bcrypt.hash(input.password, 10);

    const user = await prisma.user.create({
      data: {
        email: input.email,
        fullName: input.fullName,
        department: input.department ?? null,
        role: input.role,
        status: input.status,
        passwordHash
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        department: true,
        status: true
      }
    });

    await auditLogger.log({
      entityType: "USER",
      entityId: user.id,
      action: "CREATE_USER",
      changedById: currentUser.id,
      diffSummary: { email: user.email, role: user.role }
    });

    return NextResponse.json(user);
  } catch (error) {
    return handleRouteError(error);
  }
}
