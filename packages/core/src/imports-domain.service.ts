import { parse } from "csv-parse/sync";
import { normalizeText, type CsvImportInput } from "@contract/shared";
import type { ImportsPrismaClient } from "./types";

export class ImportsDomainService {
  constructor(private readonly prisma: ImportsPrismaClient) {}

  async validatePartnerCsv(input: CsvImportInput) {
    const records = parse(input.csv, {
      columns: true,
      skip_empty_lines: true,
      trim: true
    }) as Array<Record<string, string>>;

    const existingOwners = await this.prisma.user.findMany({
      select: { id: true, email: true }
    });
    const ownerEmails = new Set(existingOwners.map((owner) => owner.email.toLowerCase()));
    const seenNames = new Set<string>();
    const issues: Array<{ row: number; issues: string[] }> = [];

    records.forEach((record, index) => {
      const rowIssues: string[] = [];
      const legalName = record.legalName?.trim();
      const taxCode = record.taxCode?.trim();
      const primaryOwnerEmail = record.primaryOwnerEmail?.trim().toLowerCase();

      if (!legalName) {
        rowIssues.push("Thiếu legalName.");
      }

      if (!primaryOwnerEmail || !ownerEmails.has(primaryOwnerEmail)) {
        rowIssues.push("Primary owner email không tồn tại.");
      }

      if (taxCode && taxCode.length < 8) {
        rowIssues.push("Tax code không hợp lệ.");
      }

      if (legalName) {
        const normalized = normalizeText(legalName);
        if (seenNames.has(normalized)) {
          rowIssues.push("Trùng legalName trong file import.");
        }
        seenNames.add(normalized);
      }

      if (rowIssues.length) {
        issues.push({ row: index + 2, issues: rowIssues });
      }
    });

    return {
      totalRows: records.length,
      validRows: records.length - issues.length,
      issues
    };
  }

  async validateContractCsv(input: CsvImportInput) {
    const records = parse(input.csv, {
      columns: true,
      skip_empty_lines: true,
      trim: true
    }) as Array<Record<string, string>>;

    const contractNumbers = new Set<string>();
    const issues: Array<{ row: number; issues: string[] }> = [];

    records.forEach((record, index) => {
      const rowIssues: string[] = [];

      if (!record.contractNo) {
        rowIssues.push("Thiếu contractNo.");
      }

      if (record.contractNo && contractNumbers.has(record.contractNo)) {
        rowIssues.push("Trùng contractNo trong file import.");
      }
      contractNumbers.add(record.contractNo);

      if (!record.partnerCode) {
        rowIssues.push("Thiếu partnerCode.");
      }

      if (!record.ownerEmail) {
        rowIssues.push("Thiếu ownerEmail.");
      }

      if (!record.startDate || !record.endDate || Number.isNaN(Date.parse(record.startDate)) || Number.isNaN(Date.parse(record.endDate))) {
        rowIssues.push("Ngày hợp đồng không hợp lệ.");
      } else if (new Date(record.endDate) <= new Date(record.startDate)) {
        rowIssues.push("endDate phải lớn hơn startDate.");
      }

      if (!record.value || Number(record.value) <= 0) {
        rowIssues.push("Giá trị hợp đồng không hợp lệ.");
      }

      if (rowIssues.length) {
        issues.push({ row: index + 2, issues: rowIssues });
      }
    });

    return {
      totalRows: records.length,
      validRows: records.length - issues.length,
      issues
    };
  }
}
