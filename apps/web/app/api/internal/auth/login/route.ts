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
    console.log(`[Auth] Attempting login for: ${payload.email}`);

    const user = await prisma.user.findUnique({ 
      where: { email: payload.email } 
    });

    if (!user) {
      console.warn(`[Auth] Login failed: User not found (${payload.email})`);
      return NextResponse.json(
        { message: "Email hoac mat khau khong dung." },
        { status: 401 }
      );
    }

    if (user.status !== "ACTIVE") {
      console.warn(`[Auth] Login failed: User is inactive (${payload.email})`);
      return NextResponse.json(
        { message: "Tai khoan da bi khoa hoac chua kich hoat." },
        { status: 401 }
      );
    }

    const isMatch = await bcrypt.compare(payload.password, user.passwordHash);

    if (!isMatch) {
      console.warn(`[Auth] Login failed: Password mismatch (${payload.email})`);
      return NextResponse.json(
        { message: "Email hoac mat khau khong dung." },
        { status: 401 }
      );
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() }
    });

    console.log(`[Auth] Login successful: ${user.email} (ID: ${user.id})`);

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
    console.error(`[Auth] Unexpected error during login process:`, error);
    return handleRouteError(error);
  }
}
