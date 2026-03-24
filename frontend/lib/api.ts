import {
  ContractsListResponse,
  ContractMutationPayload,
  ContractMutationResponse,
  ContractsQueryParams,
  PartnerDetailResponse,
  PartnerMutationPayload,
  PartnerMutationResponse,
  PartnersListResponse,
  PartnerStatus,
  DashboardAlertsResponse,
  DashboardOwnerMatrixResponse,
  SelectOptionResponse,
  DashboardStatsResponse,
  DashboardSummary,
  DatasetResponse,
  TableName
} from "@/lib/types";

const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000"
).replace(/\/$/, "");

const TABLE_LABELS: Record<TableName, string> = {
  profiles: "Nguoi dung",
  partners: "Doi tac",
  contracts: "Hop dong",
  payments: "Thanh toan",
  budget_allocations: "Ngan sach"
};

function buildFallbackSummary(): DashboardSummary {
  return {
    app_name: process.env.NEXT_PUBLIC_APP_NAME || "PR COR Contract Admin",
    connected: false,
    frontend_origin: "http://localhost:3000",
    fetched_at: new Date().toISOString(),
    message:
      "Backend chua ket noi. Hay khoi dong FastAPI va dien bien moi truong Supabase.",
    tables: Object.entries(TABLE_LABELS).map(([name, label]) => ({
      name: name as TableName,
      label,
      count: null
    }))
  };
}

function buildFallbackDashboardStats(): DashboardStatsResponse {
  return {
    connected: false,
    fetched_at: new Date().toISOString(),
    message:
      "Backend dashboard tam thoi chua san sang. Dang hien thi du lieu mau de ban tiep tuc giao dien.",
    stats: {
      active_contracts: 28,
      expiring_in_30_days: 6,
      pending_approval: 4,
      budget_used_percent: 67.5
    }
  };
}

function buildFallbackDashboardAlerts(): DashboardAlertsResponse {
  return {
    connected: false,
    fetched_at: new Date().toISOString(),
    message:
      "Chua lay duoc canh bao tu backend. Dang hien thi du lieu mau.",
    items: [
      {
        contract_number: "HD-PR-024",
        partner: "VnExpress",
        owner: "Linh Tran",
        expiry_date: "2026-03-29",
        status: "Can gia han",
        urgency: "red",
        days_remaining: 5
      },
      {
        contract_number: "HD-PR-011",
        partner: "Tuoi Tre",
        owner: "Hoang Nguyen",
        expiry_date: "2026-04-04",
        status: "Sap het han",
        urgency: "yellow",
        days_remaining: 11
      },
      {
        contract_number: "HD-PR-032",
        partner: "Zing News",
        owner: "Minh Do",
        expiry_date: "2026-04-18",
        status: "Theo doi",
        urgency: "orange",
        days_remaining: 25
      }
    ]
  };
}

function buildFallbackOwnerMatrix(): DashboardOwnerMatrixResponse {
  return {
    connected: false,
    fetched_at: new Date().toISOString(),
    message:
      "Chua lay duoc ma tran owner tu backend. Dang hien thi du lieu mau.",
    items: [
      {
        owner: "Linh Tran",
        partner: "VnExpress",
        active_contracts: 5,
        nearest_expiry: "2026-03-29",
        budget_used_percent: 82
      },
      {
        owner: "Hoang Nguyen",
        partner: "Tuoi Tre",
        active_contracts: 4,
        nearest_expiry: "2026-04-04",
        budget_used_percent: 64
      },
      {
        owner: "Minh Do",
        partner: "Zing News",
        active_contracts: 3,
        nearest_expiry: "2026-04-18",
        budget_used_percent: 58.5
      }
    ]
  };
}

function buildFallbackContracts(params?: ContractsQueryParams): ContractsListResponse {
  const allItems = [
    {
      id: "ct-001",
      contract_number: "HD-PR-001",
      partner: "VnExpress",
      owner_id: "owner-linh",
      owner: "Linh Tran",
      value_vnd: 180000000,
      expiry_date: "2026-04-03",
      expires_in_days: 10,
      status: "active",
      status_label: "Active"
    },
    {
      id: "ct-002",
      contract_number: "HD-PR-002",
      partner: "Tuoi Tre",
      owner_id: "owner-hoang",
      owner: "Hoang Nguyen",
      value_vnd: 95000000,
      expiry_date: "2026-03-28",
      expires_in_days: 4,
      status: "active",
      status_label: "Active"
    },
    {
      id: "ct-003",
      contract_number: "HD-PR-003",
      partner: "Thanh Nien",
      owner_id: "owner-minh",
      owner: "Minh Do",
      value_vnd: 120000000,
      expiry_date: "2026-05-20",
      expires_in_days: 57,
      status: "pending",
      status_label: "Cho duyet"
    },
    {
      id: "ct-004",
      contract_number: "HD-PR-004",
      partner: "CafeF",
      owner_id: "owner-linh",
      owner: "Linh Tran",
      value_vnd: 75000000,
      expiry_date: "2026-03-20",
      expires_in_days: -4,
      status: "expired",
      status_label: "Het han"
    },
    {
      id: "ct-005",
      contract_number: "HD-PR-005",
      partner: "Dan Tri",
      owner_id: "owner-hoang",
      owner: "Hoang Nguyen",
      value_vnd: 65000000,
      expiry_date: "2026-06-15",
      expires_in_days: 83,
      status: "draft",
      status_label: "Draft"
    },
    {
      id: "ct-006",
      contract_number: "HD-PR-006",
      partner: "Zing News",
      owner_id: "owner-minh",
      owner: "Minh Do",
      value_vnd: 145000000,
      expiry_date: "2026-04-18",
      expires_in_days: 25,
      status: "active",
      status_label: "Active"
    },
    {
      id: "ct-007",
      contract_number: "HD-PR-007",
      partner: "Kenh14",
      owner_id: "owner-linh",
      owner: "Linh Tran",
      value_vnd: 110000000,
      expiry_date: "2026-04-11",
      expires_in_days: 18,
      status: "active",
      status_label: "Active"
    },
    {
      id: "ct-008",
      contract_number: "HD-PR-008",
      partner: "Soha",
      owner_id: "owner-hoang",
      owner: "Hoang Nguyen",
      value_vnd: 88000000,
      expiry_date: "2026-07-03",
      expires_in_days: 101,
      status: "pending",
      status_label: "Cho duyet"
    },
    {
      id: "ct-009",
      contract_number: "HD-PR-009",
      partner: "24h",
      owner_id: "owner-minh",
      owner: "Minh Do",
      value_vnd: 73000000,
      expiry_date: "2026-04-21",
      expires_in_days: 28,
      status: "active",
      status_label: "Active"
    },
    {
      id: "ct-010",
      contract_number: "HD-PR-010",
      partner: "Nguoi Lao Dong",
      owner_id: "owner-hoang",
      owner: "Hoang Nguyen",
      value_vnd: 168000000,
      expiry_date: "2026-04-01",
      expires_in_days: 8,
      status: "active",
      status_label: "Active"
    },
    {
      id: "ct-011",
      contract_number: "HD-PR-011",
      partner: "Tien Phong",
      owner_id: "owner-linh",
      owner: "Linh Tran",
      value_vnd: 102000000,
      expiry_date: "2026-05-02",
      expires_in_days: 39,
      status: "draft",
      status_label: "Draft"
    },
    {
      id: "ct-012",
      contract_number: "HD-PR-012",
      partner: "Lao Dong",
      owner_id: "owner-minh",
      owner: "Minh Do",
      value_vnd: 99000000,
      expiry_date: "2026-04-27",
      expires_in_days: 34,
      status: "active",
      status_label: "Active"
    }
  ] as ContractsListResponse["items"];

  const normalizedSearch = (params?.search || "").trim().toLowerCase();
  const filtered = allItems.filter((item) => {
    if (params?.status && item.status !== params.status) {
      return false;
    }

    if (params?.owner_id && item.owner_id !== params.owner_id) {
      return false;
    }

    if (normalizedSearch) {
      const haystack =
        `${item.contract_number} ${item.partner} ${item.owner}`.toLowerCase();
      if (!haystack.includes(normalizedSearch)) {
        return false;
      }
    }

    return true;
  });

  const limit = params?.limit || 10;
  const page = params?.page || 1;
  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const start = (page - 1) * limit;

  return {
    connected: false,
    fetched_at: new Date().toISOString(),
    message:
      "Dang hien thi du lieu mau vi backend contracts chua san sang hoan toan.",
    page,
    limit,
    total,
    total_pages: totalPages,
    owners: [
      { id: "owner-hoang", label: "Hoang Nguyen" },
      { id: "owner-linh", label: "Linh Tran" },
      { id: "owner-minh", label: "Minh Do" }
    ],
    items: filtered.slice(start, start + limit)
  };
}

function buildFallbackOptions(items: SelectOptionResponse["items"], message: string): SelectOptionResponse {
  return {
    connected: false,
    fetched_at: new Date().toISOString(),
    message,
    items
  };
}

function buildFallbackPartners(
  search?: string,
  status?: PartnerStatus | ""
): PartnersListResponse {
  const items = [
    {
      id: "partner-vne",
      name: "VnExpress",
      partner_type: "Bao dien tu",
      tax_code: "0312345678",
      primary_owner_id: "owner-linh",
      primary_owner: "Linh Tran",
      active_contracts: 3,
      status: "active",
      status_label: "Active"
    },
    {
      id: "partner-tt",
      name: "Tuoi Tre",
      partner_type: "Bao in + online",
      tax_code: "0308765432",
      primary_owner_id: "owner-hoang",
      primary_owner: "Hoang Nguyen",
      active_contracts: 2,
      status: "active",
      status_label: "Active"
    },
    {
      id: "partner-tn",
      name: "Thanh Nien",
      partner_type: "Bao online",
      tax_code: "0319988776",
      primary_owner_id: "owner-minh",
      primary_owner: "Minh Do",
      active_contracts: 1,
      status: "active",
      status_label: "Active"
    },
    {
      id: "partner-cafef",
      name: "CafeF",
      partner_type: "Financial media",
      tax_code: "0101122334",
      primary_owner_id: "owner-linh",
      primary_owner: "Linh Tran",
      active_contracts: 0,
      status: "inactive",
      status_label: "Inactive"
    }
  ] as PartnersListResponse["items"];

  const normalizedSearch = (search || "").trim().toLowerCase();
  const filtered = items.filter((item) => {
    if (status && item.status !== status) {
      return false;
    }
    if (normalizedSearch) {
      const haystack = `${item.name} ${item.tax_code || ""}`.toLowerCase();
      return haystack.includes(normalizedSearch);
    }
    return true;
  });

  return {
    connected: false,
    fetched_at: new Date().toISOString(),
    message: "Dang hien thi danh sach doi tac mau.",
    total: filtered.length,
    items: filtered
  };
}

function buildFallbackPartnerDetail(partnerId: string): PartnerDetailResponse {
  const detailMap: Record<string, PartnerDetailResponse["item"]> = {
    "partner-vne": {
      id: "partner-vne",
      name: "VnExpress",
      partner_type: "Bao dien tu",
      tax_code: "0312345678",
      contact_name: "Le Anh",
      contact_email: "le.anh@vnexpress.vn",
      contact_phone: "0901234567",
      primary_owner_id: "owner-linh",
      primary_owner: "Linh Tran",
      backup_owner_id: "owner-hoang",
      backup_owner: "Hoang Nguyen",
      notes: "Doi tac uu tien cho chien dich premium.",
      status: "active",
      status_label: "Active",
      active_contracts: 3,
      contracts: buildFallbackContracts({ search: "VnExpress", page: 1, limit: 20 }).items,
      history: [
        {
          id: "log-vne-1",
          action: "updated",
          actor: "Linh Tran",
          changed_at: new Date().toISOString(),
          description: "Cap nhat thong tin lien he doi tac."
        },
        {
          id: "log-vne-2",
          action: "created",
          actor: "Hoang Nguyen",
          changed_at: new Date(Date.now() - 86400000 * 10).toISOString(),
          description: "Tao moi doi tac trong he thong."
        }
      ]
    },
    "partner-tt": {
      id: "partner-tt",
      name: "Tuoi Tre",
      partner_type: "Bao in + online",
      tax_code: "0308765432",
      contact_name: "Pham Mai",
      contact_email: "pham.mai@tuoitre.vn",
      contact_phone: "0912000001",
      primary_owner_id: "owner-hoang",
      primary_owner: "Hoang Nguyen",
      backup_owner_id: "owner-minh",
      backup_owner: "Minh Do",
      notes: "Can follow-up gia han vao quy II.",
      status: "active",
      status_label: "Active",
      active_contracts: 2,
      contracts: buildFallbackContracts({ search: "Tuoi Tre", page: 1, limit: 20 }).items,
      history: [
        {
          id: "log-tt-1",
          action: "created",
          actor: "Hoang Nguyen",
          changed_at: new Date().toISOString(),
          description: "Khoi tao doi tac cho nhom bao in + online."
        }
      ]
    }
  };

  return {
    connected: false,
    fetched_at: new Date().toISOString(),
    message: "Dang hien thi chi tiet doi tac mau.",
    item:
      detailMap[partnerId] ||
      {
        id: partnerId,
        name: "Doi tac demo",
        partner_type: "Chua phan loai",
        tax_code: null,
        contact_name: null,
        contact_email: null,
        contact_phone: null,
        primary_owner_id: "owner-linh",
        primary_owner: "Linh Tran",
        backup_owner_id: null,
        backup_owner: null,
        notes: null,
        status: "active",
        status_label: "Active",
        active_contracts: 0,
        contracts: [],
        history: []
      }
  };
}

function buildFallbackDataset(table: TableName): DatasetResponse {
  return {
    table,
    connected: false,
    count: null,
    fetched_at: new Date().toISOString(),
    message:
      "Chua lay duoc du lieu. Kiem tra NEXT_PUBLIC_API_BASE_URL va backend FastAPI.",
    items: []
  };
}

async function requestJson<T>(path: string, fallback: T): Promise<T> {
  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      cache: "no-store",
      headers: {
        "Content-Type": "application/json"
      }
    });

    if (!response.ok) {
      throw new Error(`Request failed with status ${response.status}`);
    }

    return (await response.json()) as T;
  } catch {
    return fallback;
  }
}

async function requestJsonWithMethod<T>(
  path: string,
  method: "POST" | "PATCH",
  body: unknown
): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });

  const json = (await response.json()) as T & { detail?: string };

  if (!response.ok) {
    throw new Error(
      typeof json === "object" && json && "detail" in json && json.detail
        ? String(json.detail)
        : `Request failed with status ${response.status}`
    );
  }

  return json;
}

export async function getDashboardSummary() {
  return requestJson<DashboardSummary>(
    "/api/v1/dashboard/summary",
    buildFallbackSummary()
  );
}

export async function getDashboardStats() {
  return requestJson<DashboardStatsResponse>(
    "/api/dashboard/stats",
    buildFallbackDashboardStats()
  );
}

export async function getDashboardAlerts() {
  return requestJson<DashboardAlertsResponse>(
    "/api/dashboard/alerts",
    buildFallbackDashboardAlerts()
  );
}

export async function getDashboardOwnerMatrix() {
  return requestJson<DashboardOwnerMatrixResponse>(
    "/api/dashboard/owner-matrix",
    buildFallbackOwnerMatrix()
  );
}

export async function getContracts(params: ContractsQueryParams = {}) {
  const query = new URLSearchParams();

  if (params.status) {
    query.set("status", params.status);
  }

  if (params.owner_id) {
    query.set("owner_id", params.owner_id);
  }

  if (params.search) {
    query.set("search", params.search);
  }

  query.set("page", String(params.page || 1));
  query.set("limit", String(params.limit || 10));

  return requestJson<ContractsListResponse>(
    `/api/contracts?${query.toString()}`,
    buildFallbackContracts(params)
  );
}

export async function getPartnerOptions() {
  return requestJson<SelectOptionResponse>(
    "/api/partners/options",
    buildFallbackOptions(
      [
        { id: "partner-vne", label: "VnExpress" },
        { id: "partner-tt", label: "Tuoi Tre" },
        { id: "partner-tn", label: "Thanh Nien" }
      ],
      "Dang hien thi danh sach doi tac mau."
    )
  );
}

export async function getStaffOptions() {
  return requestJson<SelectOptionResponse>(
    "/api/profiles?role=staff",
    buildFallbackOptions(
      [
        { id: "owner-linh", label: "Linh Tran" },
        { id: "owner-hoang", label: "Hoang Nguyen" },
        { id: "owner-minh", label: "Minh Do" }
      ],
      "Dang hien thi danh sach staff mau."
    )
  );
}

export async function getPartners(params: {
  search?: string;
  status?: PartnerStatus | "";
} = {}) {
  const query = new URLSearchParams();
  if (params.search) {
    query.set("search", params.search);
  }
  if (params.status) {
    query.set("status", params.status);
  }

  const suffix = query.toString() ? `?${query.toString()}` : "";

  return requestJson<PartnersListResponse>(
    `/api/partners${suffix}`,
    buildFallbackPartners(params.search, params.status)
  );
}

export async function getPartnerDetail(partnerId: string) {
  return requestJson<PartnerDetailResponse>(
    `/api/partners/${partnerId}`,
    buildFallbackPartnerDetail(partnerId)
  );
}

export async function createPartner(payload: PartnerMutationPayload) {
  return requestJsonWithMethod<PartnerMutationResponse>("/api/partners", "POST", payload);
}

export async function updatePartner(partnerId: string, payload: PartnerMutationPayload) {
  return requestJsonWithMethod<PartnerMutationResponse>(
    `/api/partners/${partnerId}`,
    "PATCH",
    payload
  );
}

export async function createContractDraft(payload: ContractMutationPayload) {
  return requestJsonWithMethod<ContractMutationResponse>("/api/contracts", "POST", {
    ...payload,
    status: "draft"
  });
}

export async function submitContract(payload: ContractMutationPayload) {
  return requestJsonWithMethod<ContractMutationResponse>(
    "/api/contracts/submit",
    "POST",
    payload
  );
}

export async function getDataset(table: TableName) {
  return requestJson<DatasetResponse>(
    `/api/v1/${table}?limit=12`,
    buildFallbackDataset(table)
  );
}
