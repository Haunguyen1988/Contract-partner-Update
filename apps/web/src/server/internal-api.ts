import { createHmac, timingSafeEqual } from "node:crypto";
import { DomainNotFoundError, DomainRuleError } from "@contract/core";
import { Prisma } from "@contract/db";
import type { Role } from "@contract/shared";
import { NextRequest, NextResponse } from "next/server";
import { ZodError, type ZodTypeAny, type output } from "zod";
import { prisma } from "./prisma";

interface JwtPayload {
  sub?: string;
  email?: string;
  role?: Role;
  fullName?: string;
  exp?: number;
}

export interface InternalSessionUser {
  id: string;
  email: string;
  fullName: string;
  role: Role;
}

export class RouteHttpError extends Error {
  constructor(
    public readonly status: number,
    message: string
  ) {
    super(message);
  }
}

export function createJwtToken(payload: Omit<JwtPayload, "exp">, expiresInSeconds = 8 * 60 * 60) {
  const headerSegment = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
  const payloadSegment = Buffer.from(
    JSON.stringify({
      ...payload,
      exp: Math.floor(Date.now() / 1000) + expiresInSeconds
    })
  ).toString("base64url");

  const signatureSegment = createHmac("sha256", process.env.JWT_SECRET ?? "change-me-in-production")
    .update(`${headerSegment}.${payloadSegment}`)
    .digest("base64url");

  return `${headerSegment}.${payloadSegment}.${signatureSegment}`;
}

function verifyJwtToken(token: string, secret: string): JwtPayload {
  const [headerSegment, payloadSegment, signatureSegment] = token.split(".");

  if (!headerSegment || !payloadSegment || !signatureSegment) {
    throw new RouteHttpError(401, "Token khong hop le.");
  }

  const expectedSignature = createHmac("sha256", secret)
    .update(`${headerSegment}.${payloadSegment}`)
    .digest();

  const providedSignature = Buffer.from(signatureSegment, "base64url");

  if (
    providedSignature.length !== expectedSignature.length ||
    !timingSafeEqual(providedSignature, expectedSignature)
  ) {
    throw new RouteHttpError(401, "Token khong hop le.");
  }

  const payload = JSON.parse(Buffer.from(payloadSegment, "base64url").toString("utf8")) as JwtPayload;

  if (typeof payload.exp === "number" && payload.exp <= Math.floor(Date.now() / 1000)) {
    throw new RouteHttpError(401, "Token da het han.");
  }

  return payload;
}

export async function requireSession(
  request: NextRequest,
  allowedRoles?: readonly Role[]
): Promise<InternalSessionUser> {
  const authHeader = request.headers.get("authorization");

  if (!authHeader?.startsWith("Bearer ")) {
    throw new RouteHttpError(401, "Thieu access token.");
  }

  const token = authHeader.slice("Bearer ".length);
  const payload = verifyJwtToken(token, process.env.JWT_SECRET ?? "change-me-in-production");

  if (!payload.sub) {
    throw new RouteHttpError(401, "Token khong hop le.");
  }

  const user = await prisma.user.findUnique({
    where: { id: payload.sub },
    select: {
      id: true,
      email: true,
      fullName: true,
      role: true,
      status: true
    }
  });

  if (!user || user.status !== "ACTIVE") {
    throw new RouteHttpError(401, "Tai khoan khong kha dung.");
  }

  if (allowedRoles?.length && !allowedRoles.includes(user.role)) {
    throw new RouteHttpError(403, "Ban khong co quyen thuc hien thao tac nay.");
  }

  return {
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    role: user.role
  };
}

export async function parseJsonBody<TSchema extends ZodTypeAny>(
  request: NextRequest,
  schema: TSchema
): Promise<output<TSchema>> {
  return schema.parse(await request.json());
}

export function handleRouteError(error: unknown) {
  if (error instanceof RouteHttpError) {
    return NextResponse.json({ message: error.message }, { status: error.status });
  }

  if (error instanceof DomainNotFoundError) {
    return NextResponse.json({ message: error.message }, { status: 404 });
  }

  if (error instanceof DomainRuleError) {
    return NextResponse.json({ message: error.message }, { status: 400 });
  }

  if (error instanceof ZodError) {
    return NextResponse.json(
      {
        message: error.issues[0]?.message ?? "Payload khong hop le.",
        details: error.flatten()
      },
      { status: 400 }
    );
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
    return NextResponse.json({ message: "Du lieu bi trung hoac xung dot." }, { status: 409 });
  }

  console.error(error);
  return NextResponse.json({ message: "Internal server error." }, { status: 500 });
}
