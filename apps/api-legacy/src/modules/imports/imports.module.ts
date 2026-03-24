import { Controller, Injectable, Module, Post, UseGuards } from "@nestjs/common";
import { ImportsDomainService } from "@contract/core";
import { csvImportSchema, type CsvImportInput } from "@contract/shared";
import { PrismaService } from "../../common/prisma.service";
import { OPERATIONS_ROLES } from "../../common/role-groups";
import { Roles } from "../../common/roles.decorator";
import { RolesGuard } from "../../common/roles.guard";
import { ValidatedBody } from "../../common/validated-body.decorator";
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

  @Roles(...OPERATIONS_ROLES)
  @Post("partners/validate")
  validatePartnerCsv(@ValidatedBody(csvImportSchema) payload: CsvImportInput) {
    return this.importsService.validatePartnerCsv(payload);
  }

  @Roles(...OPERATIONS_ROLES)
  @Post("contracts/validate")
  validateContractCsv(@ValidatedBody(csvImportSchema) payload: CsvImportInput) {
    return this.importsService.validateContractCsv(payload);
  }
}

@Module({
  controllers: [ImportsController],
  providers: [ImportsService]
})
export class ImportsModule {}
