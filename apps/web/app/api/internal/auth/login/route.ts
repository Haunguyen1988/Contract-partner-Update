import bcrypt from "bcryptjs";
import { loginSchema } from "@contract/shared";
import { NextRequest, NextResponse } from "next/server";
import { createJwtToken, handleRouteError, parseJsonBody } from "../../../../../src/server/internal-api";
import { prisma } from "../../../../../src/server/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const payload = await parseJsonBody(request, loginSchema);
    const user = await prisma.user.findUnique({ where: { email: payload.email } });

    if (!user || user.status !== "ACTIVE") {
      return NextResponse.json(
        { message: "Tai khoan khong hop le hoac da bi khoa." },
        { status: 401 }
      );
    }

    const isMatch = await bcrypt.compare(payload.password, user.passwordHash);

    if (!isMatch) {
      return NextResponse.json(
        { message: "Email hoac mat khau khong dung." },
        { status: 401 }
      );
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() }
    });

    const accessToken = createJwtToken({
      sub: user.id,
      email: user.email,
      role: user.role,
      fullName: user.fullName
    });

    return NextResponse.json({
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        department: user.department,
        status: user.status
      }
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
