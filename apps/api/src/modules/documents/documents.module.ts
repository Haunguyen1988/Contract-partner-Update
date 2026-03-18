import { Body, Controller, Get, Injectable, Module, NotFoundException, Param, Post, UploadedFile, UseGuards, UseInterceptors } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { FileInterceptor } from "@nestjs/platform-express";
import { promises as fs } from "node:fs";
import path from "node:path";
import { contractDocumentMetadataSchema } from "@contract/shared";
import { AuditService } from "../../common/audit.service";
import { CurrentUser, type AuthenticatedUser } from "../../common/current-user.decorator";
import { PrismaService } from "../../common/prisma.service";
import { Roles } from "../../common/roles.decorator";
import { RolesGuard } from "../../common/roles.guard";
import { parseOrThrow } from "../../common/zod";
import { JwtAuthGuard } from "../auth/auth.module";

@Injectable()
export class DocumentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly auditService: AuditService
  ) {}

  async listByContract(contractId: string) {
    const contract = await this.prisma.contract.findUnique({ where: { id: contractId } });

    if (!contract) {
      throw new NotFoundException("Không tìm thấy hợp đồng.");
    }

    const documents = await this.prisma.contractDocument.findMany({
      where: { contractId },
      orderBy: { uploadedAt: "desc" }
    });

    return documents.map((document) => ({
      id: document.id,
      type: document.type,
      filename: document.filename,
      originalName: document.originalName,
      mimeType: document.mimeType,
      size: document.size,
      version: document.version,
      uploadedAt: document.uploadedAt.toISOString()
    }));
  }

  async upload(contractId: string, metadataPayload: unknown, file: Express.Multer.File | undefined, currentUser: AuthenticatedUser) {
    const contract = await this.prisma.contract.findUnique({ where: { id: contractId } });

    if (!contract) {
      throw new NotFoundException("Không tìm thấy hợp đồng.");
    }

    if (!file) {
      throw new NotFoundException("Thiếu file upload.");
    }

    const rawMetadata = typeof metadataPayload === "object" && metadataPayload !== null
      ? metadataPayload as Record<string, unknown>
      : {};

    const metadata = parseOrThrow(contractDocumentMetadataSchema, {
      ...rawMetadata,
      filename: file.filename ?? file.originalname,
      mimeType: file.mimetype,
      size: file.size
    });

    const uploadDir = this.configService.get<string>("UPLOAD_DIR", "./apps/api/uploads");
    const contractDir = path.join(uploadDir, contractId);
    await fs.mkdir(contractDir, { recursive: true });

    const safeFilename = `${Date.now()}-${file.originalname.replace(/\s+/g, "-")}`;
    const storageKey = path.join(contractId, safeFilename);
    const fullPath = path.join(uploadDir, storageKey);
    await fs.writeFile(fullPath, file.buffer);

    const latest = await this.prisma.contractDocument.findFirst({
      where: { contractId, type: metadata.type },
      orderBy: { version: "desc" }
    });

    const document = await this.prisma.contractDocument.create({
      data: {
        contractId,
        type: metadata.type,
        filename: safeFilename,
        originalName: file.originalname,
        storageKey,
        mimeType: file.mimetype,
        size: file.size,
        version: (latest?.version ?? 0) + 1,
        uploadedById: currentUser.id
      }
    });

    await this.auditService.log({
      entityType: "DOCUMENT",
      entityId: document.id,
      action: "UPLOAD_DOCUMENT",
      changedById: currentUser.id,
      diffSummary: { contractId, type: metadata.type, filename: document.filename }
    });

    return {
      id: document.id,
      type: document.type,
      filename: document.filename,
      originalName: document.originalName,
      storageKey: document.storageKey,
      mimeType: document.mimeType,
      size: document.size,
      version: document.version,
      uploadedAt: document.uploadedAt.toISOString()
    };
  }
}

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller("documents")
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Roles("ADMIN", "PR_COR_MANAGER", "PR_COR_STAFF", "FINANCE", "LEGAL", "PROCUREMENT", "LEADERSHIP")
  @Get("contracts/:contractId")
  listByContract(@Param("contractId") contractId: string) {
    return this.documentsService.listByContract(contractId);
  }

  @Roles("ADMIN", "PR_COR_MANAGER", "PR_COR_STAFF")
  @Post("contracts/:contractId")
  @UseInterceptors(FileInterceptor("file"))
  upload(
    @Param("contractId") contractId: string,
    @Body() metadataPayload: unknown,
    @UploadedFile() file: Express.Multer.File | undefined,
    @CurrentUser() currentUser: AuthenticatedUser
  ) {
    return this.documentsService.upload(contractId, metadataPayload, file, currentUser);
  }
}

@Module({
  controllers: [DocumentsController],
  providers: [DocumentsService],
  exports: [DocumentsService]
})
export class DocumentsModule {}
