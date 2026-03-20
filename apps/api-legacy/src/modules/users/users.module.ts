import { Body, Controller, Get, Injectable, Module, NotFoundException, Param, Patch, Post, UseGuards } from "@nestjs/common";
import bcrypt from "bcryptjs";
import { createUserSchema, updateUserSchema } from "@contract/shared";
import { AuditService } from "../../common/audit.service";
import { CurrentUser, type AuthenticatedUser } from "../../common/current-user.decorator";
import { Roles } from "../../common/roles.decorator";
import { RolesGuard } from "../../common/roles.guard";
import { PrismaService } from "../../common/prisma.service";
import { parseOrThrow } from "../../common/zod";
import { JwtAuthGuard } from "../auth/auth.module";

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService
  ) {}

  list() {
    return this.prisma.user.findMany({
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
  }

  async create(payload: unknown, currentUser: AuthenticatedUser) {
    const input = parseOrThrow(createUserSchema, payload);
    const passwordHash = await bcrypt.hash(input.password, 10);

    const user = await this.prisma.user.create({
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

    await this.auditService.log({
      entityType: "USER",
      entityId: user.id,
      action: "CREATE_USER",
      changedById: currentUser.id,
      diffSummary: { email: user.email, role: user.role }
    });

    return user;
  }

  async update(userId: string, payload: unknown, currentUser: AuthenticatedUser) {
    const existing = await this.prisma.user.findUnique({ where: { id: userId } });

    if (!existing) {
      throw new NotFoundException("Không tìm thấy user.");
    }

    const input = parseOrThrow(updateUserSchema, payload);
    const passwordHash = input.password ? await bcrypt.hash(input.password, 10) : undefined;

    const user = await this.prisma.user.update({
      where: { id: userId },
      data: {
        email: input.email ?? existing.email,
        fullName: input.fullName ?? existing.fullName,
        department: input.department ?? existing.department,
        role: input.role ?? existing.role,
        status: input.status ?? existing.status,
        ...(passwordHash ? { passwordHash } : {})
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

    await this.auditService.log({
      entityType: "USER",
      entityId: user.id,
      action: "UPDATE_USER",
      changedById: currentUser.id,
      diffSummary: input as Record<string, unknown>
    });

    return user;
  }
}

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller("users")
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Roles("ADMIN", "PR_COR_MANAGER")
  @Get()
  list() {
    return this.usersService.list();
  }

  @Roles("ADMIN")
  @Post()
  create(@Body() payload: unknown, @CurrentUser() currentUser: AuthenticatedUser) {
    return this.usersService.create(payload, currentUser);
  }

  @Roles("ADMIN")
  @Patch(":id")
  update(@Param("id") userId: string, @Body() payload: unknown, @CurrentUser() currentUser: AuthenticatedUser) {
    return this.usersService.update(userId, payload, currentUser);
  }
}

@Module({
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService]
})
export class UsersModule {}

