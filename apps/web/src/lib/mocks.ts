import type { AppSettings, DashboardOverview } from "@contract/shared";

export const mockDashboard: DashboardOverview = {
  summary: {
    activeContracts: 14,
    expiringContracts: 3,
    openAlerts: 6,
    totalCommittedBudget: "1.250.000.000 ₫",
    totalRemainingBudget: "830.000.000 ₫"
  },
  topOwners: [
    { ownerId: "u-1", ownerName: "Tran Minh Chau", committedAmount: "450000000", remainingAmount: "150000000" },
    { ownerId: "u-2", ownerName: "Nguyen Thu Ha", committedAmount: "320000000", remainingAmount: "180000000" },
    { ownerId: "u-3", ownerName: "Pham Quoc Duy", committedAmount: "280000000", remainingAmount: "190000000" }
  ],
  expiringContracts: [
    {
      id: "c-1",
      contractNo: "PR-2026-001",
      title: "Truyền thông chiến dịch hè 2026",
      ownerName: "Tran Minh Chau",
      partnerName: "VNExpress Media",
      endDate: "2026-05-15T00:00:00.000Z",
      daysRemaining: 7
    }
  ],
  myTasks: [
    {
      id: "a-1",
      title: "Kiểm tra hồ sơ hợp đồng PR-2026-001",
      description: "Cần rà soát hồ sơ chính trước thời điểm active.",
      dueDate: "2026-03-20T00:00:00.000Z",
      severity: "WARNING"
    }
  ]
};

export const mockPartners = [
  {
    id: "p-1",
    code: "VNEXPRESS",
    legalName: "Công ty Cổ phần Báo chí Việt Nam",
    taxCode: "0312345678",
    category: "Digital News",
    status: "ACTIVE",
    primaryOwner: { fullName: "Tran Minh Chau" }
  },
  {
    id: "p-2",
    code: "THANHNIEN",
    legalName: "Báo Thanh Niên",
    taxCode: "0319991234",
    category: "Print + Online",
    status: "ACTIVE",
    primaryOwner: { fullName: "Nguyen Thu Ha" }
  }
];

export const mockUsers = [
  {
    id: "u-admin",
    fullName: "System Admin",
    email: "admin@prcor.local",
    role: "ADMIN",
    department: "IT",
    status: "ACTIVE"
  },
  {
    id: "u-manager",
    fullName: "PR COR Manager",
    email: "manager@prcor.local",
    role: "PR_COR_MANAGER",
    department: "PR COR",
    status: "ACTIVE"
  },
  {
    id: "u-staff",
    fullName: "PR COR Staff",
    email: "staff@prcor.local",
    role: "PR_COR_STAFF",
    department: "PR COR",
    status: "ACTIVE"
  }
];

export const mockContracts = [
  {
    id: "c-1",
    contractNo: "PR-2026-001",
    title: "Truyền thông chiến dịch hè 2026",
    partnerId: "p-1",
    partnerName: "Công ty Cổ phần Báo chí Việt Nam",
    ownerId: "u-staff",
    ownerName: "PR COR Staff",
    campaign: "GENERAL",
    fiscalYear: 2026,
    value: "250000000",
    startDate: "2026-03-01T00:00:00.000Z",
    endDate: "2026-05-15T00:00:00.000Z",
    lifecycleStatus: "ACTIVE",
    hasMainContract: true
  }
];

export const mockBudgets = [
  {
    id: "b-1",
    fiscalYear: 2026,
    ownerId: "u-staff",
    ownerName: "PR COR Staff",
    campaign: "GENERAL",
    allocatedAmount: "800000000",
    committedAmount: "250000000",
    remainingAmount: "550000000"
  }
];

export const mockAlerts = [
  {
    id: "a-1",
    type: "CONTRACT_EXPIRY",
    severity: "WARNING",
    status: "OPEN",
    entityType: "CONTRACT",
    entityId: "c-1",
    title: "Hợp đồng PR-2026-001 sắp hết hạn",
    message: "Hợp đồng còn 7 ngày trước khi hết hạn.",
    dueDate: "2026-03-25T00:00:00.000Z",
    assignedRole: "PR_COR_STAFF"
  }
];

export const mockSettings: AppSettings = {
  budgetOverrunPolicy: "WARN",
  expiryLeadDays: [30, 15, 7, 1]
};

export const mockAuditLogs = [
  {
    id: "log-1",
    entityType: "CONTRACT",
    entityId: "c-1",
    action: "CREATE_CONTRACT",
    changedAt: "2026-03-17T09:20:00.000Z",
    changedBy: "System Admin",
    diffSummary: { contractNo: "PR-2026-001", value: 250000000 }
  }
];

export const mockPartnerCsv = `code,legalName,taxCode,category,primaryOwnerEmail,backupOwnerEmail
VNEXPRESS,Cong ty Co phan Bao chi Viet Nam,0312345678,Digital News,staff@prcor.local,manager@prcor.local`;

export const mockContractCsv = `contractNo,partnerCode,ownerEmail,title,fiscalYear,value,startDate,endDate,campaign
PR-2026-001,VNEXPRESS,staff@prcor.local,Truyen thong he 2026,2026,250000000,2026-03-01T00:00:00.000Z,2026-05-15T00:00:00.000Z,GENERAL`;

