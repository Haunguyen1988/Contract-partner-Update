import { Global, Module } from "@nestjs/common";
import { AuditService } from "./audit.service";
import { RolesGuard } from "./roles.guard";
import { PrismaService } from "./prisma.service";

@Global()
@Module({
  providers: [PrismaService, AuditService, RolesGuard],
  exports: [PrismaService, AuditService, RolesGuard]
})
export class CommonModule {}
