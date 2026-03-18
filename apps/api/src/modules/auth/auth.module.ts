import { Body, CanActivate, Controller, ExecutionContext, ForbiddenException, Get, Global, Injectable, Module, Post, UnauthorizedException, UseGuards } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { JwtModule, JwtService } from "@nestjs/jwt";
import bcrypt from "bcryptjs";
import { loginSchema, type LoginInput } from "@contract/shared";
import { PrismaService } from "../../common/prisma.service";
import { parseOrThrow } from "../../common/zod";
import { CurrentUser, type AuthenticatedUser } from "../../common/current-user.decorator";

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService
  ) {}

  async login(payload: LoginInput) {
    const user = await this.prisma.user.findUnique({ where: { email: payload.email } });

    if (!user || user.status !== "ACTIVE") {
      throw new UnauthorizedException("Tài khoản không hợp lệ hoặc đã bị khóa.");
    }

    const isMatch = await bcrypt.compare(payload.password, user.passwordHash);

    if (!isMatch) {
      throw new UnauthorizedException("Email hoặc mật khẩu không đúng.");
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() }
    });

    const token = await this.jwtService.signAsync({
      sub: user.id,
      email: user.email,
      role: user.role,
      fullName: user.fullName
    });

    return {
      accessToken: token,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        department: user.department,
        status: user.status
      }
    };
  }

  async bootstrapAdmin() {
    const totalUsers = await this.prisma.user.count();

    if (totalUsers > 0) {
      throw new ForbiddenException("Bootstrap admin chỉ cho phép khi hệ thống chưa có user.");
    }

    const passwordHash = await bcrypt.hash("Admin@123", 10);
    const admin = await this.prisma.user.create({
      data: {
        email: "admin@prcor.local",
        fullName: "System Admin",
        role: "ADMIN",
        status: "ACTIVE",
        department: "IT",
        passwordHash
      }
    });

    return {
      email: admin.email,
      password: "Admin@123"
    };
  }
}

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService
  ) {}

  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader?.startsWith("Bearer ")) {
      throw new UnauthorizedException("Thiếu access token.");
    }

    const token = authHeader.slice("Bearer ".length);

    try {
      const payload = await this.jwtService.verifyAsync(token);
      const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });

      if (!user || user.status !== "ACTIVE") {
        throw new UnauthorizedException("Tài khoản không khả dụng.");
      }

      request.user = {
        id: user.id,
        email: user.email,
        role: user.role,
        fullName: user.fullName
      } satisfies AuthenticatedUser;

      return true;
    } catch {
      throw new UnauthorizedException("Token không hợp lệ.");
    }
  }
}

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("login")
  login(@Body() payload: unknown) {
    return this.authService.login(parseOrThrow(loginSchema, payload));
  }

  @Post("bootstrap-admin")
  bootstrapAdmin() {
    return this.authService.bootstrapAdmin();
  }

  @UseGuards(JwtAuthGuard)
  @Get("me")
  me(@CurrentUser() user: AuthenticatedUser) {
    return user;
  }
}

@Global()
@Module({
  imports: [
    ConfigModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>("JWT_SECRET", "change-me-in-production"),
        signOptions: { expiresIn: "8h" }
      })
    })
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtAuthGuard],
  exports: [AuthService, JwtAuthGuard, JwtModule]
})
export class AuthModule {}
