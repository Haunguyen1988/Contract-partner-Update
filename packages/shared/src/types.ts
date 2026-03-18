import type {
  AlertSeverity,
  AlertStatus,
  AlertType,
  BudgetOverrunPolicy,
  ContractLifecycleStatus,
  DocumentType,
  EntityType,
  PartnerStatus,
  Role,
  UserStatus
} from "./enums";

export interface User {
  id: string;
  fullName: string;
  email: string;
  role: Role;
  department: string | null;
  status: UserStatus;
}

export interface Partner {
  id: string;
  code: string;
  legalName: string;
  shortName: string | null;
  taxCode: string | null;
  category: string | null;
  primaryOwnerId: string;
  backupOwnerId?: string | null;
  contactInfo: {
    contactName?: string | null;
    contactEmail?: string | null;
    contactPhone?: string | null;
    address?: string | null;
  };
  status: PartnerStatus;
}

export interface Contract {
  id: string;
  contractNo: string;
  partnerId: string;
  ownerId: string;
  title: string;
  campaign?: string | null;
  fiscalYear: number;
  value: string;
  startDate: string;
  endDate: string;
  lifecycleStatus: ContractLifecycleStatus;
  notes?: string | null;
}

export interface ContractDocument {
  id: string;
  contractId: string;
  type: DocumentType;
  filename: string;
  storageKey: string;
  mimeType: string;
  size: number;
  version: number;
  uploadedBy: string;
  uploadedAt: string;
}

export interface BudgetAllocation {
  id: string;
  fiscalYear: number;
  ownerId: string;
  campaign?: string | null;
  allocatedAmount: string;
  committedAmount: string;
  remainingAmount: string;
}

export interface Alert {
  id: string;
  type: AlertType;
  severity: AlertSeverity;
  entityType: EntityType;
  entityId: string;
  dueDate: string;
  status: AlertStatus;
  assignedRole?: Role | null;
}

export interface AuditLog {
  id: string;
  entityType: EntityType;
  entityId: string;
  action: string;
  changedBy: string | null;
  changedAt: string;
  diffSummary: Record<string, unknown> | null;
}

export interface AppSettings {
  budgetOverrunPolicy: BudgetOverrunPolicy;
  expiryLeadDays: number[];
}

export interface DashboardOverview {
  summary: {
    activeContracts: number;
    expiringContracts: number;
    openAlerts: number;
    totalCommittedBudget: string;
    totalRemainingBudget: string;
  };
  topOwners: Array<{
    ownerId: string;
    ownerName: string;
    committedAmount: string;
    remainingAmount: string;
  }>;
  expiringContracts: Array<{
    id: string;
    contractNo: string;
    title: string;
    ownerName: string;
    partnerName: string;
    endDate: string;
    daysRemaining: number;
  }>;
  myTasks: Array<{
    id: string;
    title: string;
    description: string;
    dueDate: string;
    severity: AlertSeverity;
  }>;
}

