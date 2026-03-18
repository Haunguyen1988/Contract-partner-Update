import { DEFAULT_CAMPAIGN } from "./constants";

export function normalizeText(input: string): string {
  return input
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-zA-Z0-9]+/g, " ")
    .trim()
    .toLowerCase();
}

export function formatVnd(value: number | string): string {
  const normalized = typeof value === "string" ? Number(value) : value;
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0
  }).format(normalized);
}

export function computeRemainingBudget(allocatedAmount: number, committedAmount: number): number {
  return Number((allocatedAmount - committedAmount).toFixed(2));
}

export function needsMainContractDocument(documentTypes: string[]): boolean {
  return !documentTypes.includes("MAIN_CONTRACT");
}

export function buildBudgetKey(fiscalYear: number, ownerId: string, campaign?: string | null): string {
  return `${fiscalYear}:${ownerId}:${campaign || DEFAULT_CAMPAIGN}`;
}

export function daysUntil(targetDate: string | Date, fromDate = new Date()): number {
  const target = new Date(targetDate);
  const diffMs = target.setHours(0, 0, 0, 0) - new Date(fromDate).setHours(0, 0, 0, 0);
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

export function toIsoDateString(input: string | Date): string {
  return new Date(input).toISOString();
}

