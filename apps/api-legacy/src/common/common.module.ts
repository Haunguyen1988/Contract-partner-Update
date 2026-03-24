import { APP_FILTER } from "@nestjs/core";
import { Global, Module } from "@nestjs/common";
import { AuditService } from "./audit.service";
import { DomainErrorFilter } from "./domain-error.filter";
import { RolesGuard } from "./roles.guard";
import { PrismaService } from "./prisma.service";

@Global()
@Module({
  providers: [
    PrismaService,
    AuditService,
    RolesGuard,
    {
      provide: APP_FILTER,
      useClass: DomainErrorFilter
    }
  ],
  exports: [PrismaService, AuditService, RolesGuard]
})
export class CommonModule {}
