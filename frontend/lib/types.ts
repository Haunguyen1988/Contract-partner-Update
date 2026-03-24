export type TableName =
  | "profiles"
  | "partners"
  | "contracts"
  | "payments"
  | "budget_allocations";

export interface TableSummary {
  name: TableName;
  label: string;
  count: number | null;
}

export interface DashboardSummary {
  app_name: string;
  connected: boolean;
  frontend_origin: string;
  fetched_at: string;
  message?: string | null;
  tables: TableSummary[];
}

export interface DatasetResponse {
  table: TableName;
  connected: boolean;
  count: number | null;
  fetched_at: string;
  message?: string | null;
  items: Record<string, unknown>[];
}

export interface DashboardStatsPayload {
  active_contracts: number;
  expiring_in_30_days: number;
  pending_approval: number;
  budget_used_percent: number;
}

export interface DashboardStatsResponse {
  connected: boolean;
  fetched_at: string;
  message?: string | null;
  stats: DashboardStatsPayload;
}

export type DashboardAlertUrgency = "red" | "yellow" | "orange" | "neutral";

export interface DashboardAlertItem {
  contract_number: string;
  partner: string;
  owner: string;
  expiry_date?: string | null;
  status: string;
  urgency: DashboardAlertUrgency;
  days_remaining?: number | null;
}

export interface DashboardAlertsResponse {
  connected: boolean;
  fetched_at: string;
  message?: string | null;
  items: DashboardAlertItem[];
}

export interface DashboardOwnerMatrixItem {
  owner: string;
  partner: string;
  active_contracts: number;
  nearest_expiry?: string | null;
  budget_used_percent: number;
}

export interface DashboardOwnerMatrixResponse {
  connected: boolean;
  fetched_at: string;
  message?: string | null;
  items: DashboardOwnerMatrixItem[];
}

export type ContractStatus = "draft" | "pending" | "active" | "expired";

export interface ContractOwnerOption {
  id: string;
  label: string;
}

export interface ContractListItem {
  id: string;
  contract_number: string;
  partner: string;
  owner_id?: string | null;
  owner: string;
  value_vnd: number;
  expiry_date?: string | null;
  expires_in_days?: number | null;
  status: ContractStatus;
  status_label: string;
}

export interface ContractsListResponse {
  connected: boolean;
  fetched_at: string;
  message?: string | null;
  page: number;
  limit: number;
  total: number;
  total_pages: number;
  owners: ContractOwnerOption[];
  items: ContractListItem[];
}

export interface ContractsQueryParams {
  status?: ContractStatus | "";
  owner_id?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface SelectOptionItem {
  id: string;
  label: string;
}

export interface SelectOptionResponse {
  connected: boolean;
  fetched_at: string;
  message?: string | null;
  items: SelectOptionItem[];
}

export interface ContractMutationPayload {
  contract_number?: string | null;
  partner_id?: string | null;
  owner_id?: string | null;
  title?: string | null;
  value_vnd?: number | null;
  start_date?: string | null;
  expiry_date?: string | null;
  budget_period?: string | null;
  notes?: string | null;
  file_path?: string | null;
  file_url?: string | null;
  status?: "draft" | "pending" | null;
}

export interface ContractMutationResponse {
  success: boolean;
  connected: boolean;
  message: string;
  contract_id: string;
  status: "draft" | "pending";
}

export type PartnerStatus = "active" | "inactive";

export interface PartnerListItem {
  id: string;
  name: string;
  partner_type: string;
  tax_code?: string | null;
  primary_owner_id?: string | null;
  primary_owner: string;
  active_contracts: number;
  status: PartnerStatus;
  status_label: string;
}

export interface PartnersListResponse {
  connected: boolean;
  fetched_at: string;
  message?: string | null;
  total: number;
  items: PartnerListItem[];
}

export interface PartnerHistoryItem {
  id: string;
  action: string;
  actor: string;
  changed_at: string;
  description: string;
}

export interface PartnerDetailItem {
  id: string;
  name: string;
  partner_type: string;
  tax_code?: string | null;
  contact_name?: string | null;
  contact_email?: string | null;
  contact_phone?: string | null;
  primary_owner_id?: string | null;
  primary_owner: string;
  backup_owner_id?: string | null;
  backup_owner?: string | null;
  notes?: string | null;
  status: PartnerStatus;
  status_label: string;
  active_contracts: number;
  contracts: ContractListItem[];
  history: PartnerHistoryItem[];
}

export interface PartnerDetailResponse {
  connected: boolean;
  fetched_at: string;
  message?: string | null;
  item: PartnerDetailItem;
}

export interface PartnerMutationPayload {
  name?: string | null;
  partner_type?: string | null;
  tax_code?: string | null;
  primary_owner_id?: string | null;
  backup_owner_id?: string | null;
  contact_name?: string | null;
  contact_email?: string | null;
  contact_phone?: string | null;
  notes?: string | null;
  status?: PartnerStatus | null;
}

export interface PartnerMutationResponse {
  success: boolean;
  connected: boolean;
  message: string;
  partner_id: string;
}
