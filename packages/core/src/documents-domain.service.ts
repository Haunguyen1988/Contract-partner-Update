import { promises as fs } from "node:fs";
import path from "node:path";
import { toIsoDateString, type ContractDocumentMetadataInput } from "@contract/shared";
import { DomainNotFoundError, DomainRuleError } from "./errors";
import type {
  AuditLogger,
  DocumentFileStore,
  DocumentsPrismaClient,
  UploadedBinaryFile
} from "./types";

export class LocalDocumentFileStore implements DocumentFileStore {
  constructor(private readonly uploadDir: string) {}

  async store(contractId: string, originalName: string, buffer: Uint8Array) {
    const contractDir = path.join(this.uploadDir, contractId);
    await fs.mkdir(contractDir, { recursive: true });

    const safeFilename = `${Date.now()}-${originalName.replace(/\s+/g, "-")}`;
    const storageKey = path.join(contractId, safeFilename);
    const fullPath = path.join(this.uploadDir, storageKey);
    await fs.writeFile(fullPath, buffer);

    return {
      filename: safeFilename,
      storageKey
    };
  }
}

export class DocumentsDomainService {
  constructor(
    private readonly prisma: DocumentsPrismaClient,
    private readonly fileStore: DocumentFileStore,
    private readonly auditLogger: AuditLogger
  ) {}

  async listByContract(contractId: string) {
    const contract = await this.prisma.contract.findUnique({ where: { id: contractId } });

    if (!contract) {
      throw new DomainNotFoundError("Khong tim thay hop dong.");
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
      uploadedAt: toIsoDateString(document.uploadedAt)
    }));
  }

  async upload(
    contractId: string,
    metadata: ContractDocumentMetadataInput,
    file: UploadedBinaryFile | undefined,
    changedById: string
  ) {
    const contract = await this.prisma.contract.findUnique({ where: { id: contractId } });

    if (!contract) {
      throw new DomainNotFoundError("Khong tim thay hop dong.");
    }

    if (!file) {
      throw new DomainRuleError("Thieu file upload.");
    }

    const storedFile = await this.fileStore.store(contractId, file.originalName, file.buffer);

    const latest = await this.prisma.contractDocument.findFirst({
      where: { contractId, type: metadata.type },
      orderBy: { version: "desc" }
    });

    const document = await this.prisma.contractDocument.create({
      data: {
        contractId,
        type: metadata.type,
        filename: storedFile.filename,
        originalName: file.originalName,
        storageKey: storedFile.storageKey,
        mimeType: file.mimeType,
        size: file.size,
        version: (latest?.version ?? 0) + 1,
        uploadedById: changedById
      }
    });

    await this.auditLogger.log({
      entityType: "DOCUMENT",
      entityId: document.id,
      action: "UPLOAD_DOCUMENT",
      changedById,
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
      uploadedAt: toIsoDateString(document.uploadedAt)
    };
  }
}
