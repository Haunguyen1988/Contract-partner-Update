import { Body, Controller, Get, Injectable, Module, Param, Post, UploadedFile, UseGuards, UseInterceptors } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { FileInterceptor } from "@nestjs/platform-express";
import {
  DocumentsDomainService,
  LocalDocumentFileStore,
  type UploadedBinaryFile
} from "@contract/core";
import {
  contractDocumentMetadataSchema,
  type ContractDocumentMetadataInput
} from "@contract/shared";
import { AuditService } from "../../common/audit.service";
import { CurrentUser, type AuthenticatedUser } from "../../common/current-user.decorator";
import { PrismaService } from "../../common/prisma.service";
import { BUSINESS_READ_ROLES, OPERATIONS_ROLES } from "../../common/role-groups";
import { Roles } from "../../common/roles.decorator";
import { RolesGuard } from "../../common/roles.guard";
import { parseOrThrow } from "../../common/zod";
import { JwtAuthGuard } from "../auth/auth.module";

@Injectable()
export class DocumentsService extends DocumentsDomainService {
  constructor(
    prisma: PrismaService,
    configService: ConfigService,
    auditService: AuditService
  ) {
    super(
      prisma,
      new LocalDocumentFileStore(configService.get<string>("UPLOAD_DIR", "./apps/api/uploads")),
      auditService
    );
  }
}

function mapUploadedFile(file: Express.Multer.File | undefined): UploadedBinaryFile | undefined {
  if (!file) {
    return undefined;
  }

  return {
    originalName: file.originalname,
    mimeType: file.mimetype,
    size: file.size,
    buffer: file.buffer
  };
}

function parseDocumentMetadata(
  payload: unknown,
  file: Express.Multer.File | undefined
): ContractDocumentMetadataInput {
  const rawMetadata = typeof payload === "object" && payload !== null
    ? payload as Record<string, unknown>
    : {};

  return parseOrThrow(contractDocumentMetadataSchema, {
    ...rawMetadata,
    filename: file?.filename ?? file?.originalname ?? "missing-upload.bin",
    mimeType: file?.mimetype ?? "application/octet-stream",
    size: file?.size ?? 1
  });
}

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller("documents")
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Roles(...BUSINESS_READ_ROLES)
  @Get("contracts/:contractId")
  listByContract(@Param("contractId") contractId: string) {
    return this.documentsService.listByContract(contractId);
  }

  @Roles(...OPERATIONS_ROLES)
  @Post("contracts/:contractId")
  @UseInterceptors(FileInterceptor("file"))
  upload(
    @Param("contractId") contractId: string,
    @Body() metadataPayload: unknown,
    @UploadedFile() file: Express.Multer.File | undefined,
    @CurrentUser() currentUser: AuthenticatedUser
  ) {
    return this.documentsService.upload(
      contractId,
      parseDocumentMetadata(metadataPayload, file),
      mapUploadedFile(file),
      currentUser.id
    );
  }
}

@Module({
  controllers: [DocumentsController],
  providers: [DocumentsService],
  exports: [DocumentsService]
})
export class DocumentsModule {}
