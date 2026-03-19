import { Body, Controller, Injectable, Module, Post, UseGuards } from "@nestjs/common";
import { ImportsDomainService } from "@contract/core";
import { csvImportSchema } from "@contract/shared";
import { PrismaService } from "../../common/prisma.service";
import { Roles } from "../../common/roles.decorator";
import { RolesGuard } from "../../common/roles.guard";
import { parseOrThrow } from "../../common/zod";
import { JwtAuthGuard } from "../auth/auth.module";

@Injectable()
export class ImportsService extends ImportsDomainService {
  constructor(prisma: PrismaService) {
    super(prisma);
  }
}

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller("imports")
export class ImportsController {
  constructor(private readonly importsService: ImportsService) {}

  @Roles("ADMIN", "PR_COR_MANAGER", "PR_COR_STAFF")
  @Post("partners/validate")
  validatePartnerCsv(@Body() payload: unknown) {
    return this.importsService.validatePartnerCsv(parseOrThrow(csvImportSchema, payload));
  }

  @Roles("ADMIN", "PR_COR_MANAGER", "PR_COR_STAFF")
  @Post("contracts/validate")
  validateContractCsv(@Body() payload: unknown) {
    return this.importsService.validateContractCsv(parseOrThrow(csvImportSchema, payload));
  }
}

@Module({
  controllers: [ImportsController],
  providers: [ImportsService]
})
export class ImportsModule {}
