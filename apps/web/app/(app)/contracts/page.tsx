"use client";

import { useState } from "react";
import { 
  Badge, 
  Card, 
  DataTable, 
  Column, 
  PageHeader,
  Button,
  LoadingState
} from "@contract/ui";
import { apiRequest } from "../../../src/lib/api";
import { formatCurrency } from "../../../src/lib/format";
import { mockContracts, mockPartners } from "../../../src/lib/mocks";
import { useSession } from "../../../src/lib/session";
import { useApiResource } from "../../../src/lib/use-api-resource";
import { hasPermission } from "@contract/shared";
import { toast } from "sonner";

export default function ContractsPage() {
  const { token, user } = useSession();
  const contractsResource = useApiResource("/api/internal/contracts", mockContracts);
  const partnersResource = useApiResource("/api/internal/partners", mockPartners);
  
  const contracts = contractsResource.data ?? mockContracts;
  const partners = partnersResource.data ?? mockPartners;
  
  const [showCreate, setShowCreate] = useState(false);
  const [contractForm, setContractForm] = useState({
    contractNo: "",
    title: "",
    partnerId: "",
    ownerId: user?.id ?? "",
    fiscalYear: "2026",
    value: "",
    startDate: new Date().toISOString().split("T")[0],
    endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    campaign: "GENERAL"
  });

  async function handleAction(contractId: string, action: "submit" | "approve" | "reject") {
    try {
      let reason = undefined;
      if (action === "reject") {
        reason = window.prompt("Lý do từ chối:");
        if (!reason) return;
      }

      await apiRequest(`/api/internal/contracts/${contractId}/status`, {
        method: "POST",
        body: JSON.stringify({ action, reason })
      }, token);
      
      toast.success(`Đã thực hiện: ${action}`);
      contractsResource.reload();
    } catch (err: any) {
      toast.error(err.message || "Thao tác thất bại");
    }
  }

  const columns: Column<any>[] = [
    { header: "Số hợp đồng", accessor: (c) => <strong className="text-accent">{c.contractNo}</strong> },
    { header: "Tiêu đề", accessor: (c) => c.title },
    { header: "Đối tác", accessor: (c) => c.partnerName },
    { header: "Owner", accessor: (c) => c.ownerName },
    { header: "Giá trị", accessor: (c) => formatCurrency(c.value) },
    { 
      header: "Status", 
      accessor: (c) => {
        let tone: "success" | "warning" | "critical" | "neutral" = "neutral";
        if (c.lifecycleStatus === "ACTIVE") tone = "success";
        if (c.lifecycleStatus === "PENDING_APPROVAL") tone = "warning";
        if (c.lifecycleStatus === "REJECTED") tone = "critical";
        
        return <Badge tone={tone}>{c.lifecycleStatus}</Badge>;
      }
    },
    {
      header: "Thao tác",
      accessor: (c) => (
        <div className="flex gap-2">
          {c.lifecycleStatus === "DRAFT" && hasPermission(user?.role as any, "CONTRACT_SUBMIT") && (
            <Button size="sm" onClick={() => handleAction(c.id, "submit")}>Gửi duyệt</Button>
          )}
          {c.lifecycleStatus === "PENDING_APPROVAL" && hasPermission(user?.role as any, "CONTRACT_APPROVE") && (
            <>
              <Button size="sm" variant="primary" onClick={() => handleAction(c.id, "approve")}>Duyệt</Button>
              <Button size="sm" variant="ghost" onClick={() => handleAction(c.id, "reject")}>Từ chối</Button>
            </>
          )}
          {c.lifecycleStatus === "ACTIVE" && (
            <Badge tone="success">Vận hành</Badge>
          )}
        </div>
      )
    }
  ];

  if (contractsResource.source === "loading") return <LoadingState />;

  return (
    <div className="stack" style={{ padding: 24 }}>
      <PageHeader 
        title="Quản lý hợp đồng & Quy trình phê duyệt" 
        description="Đăng ký, đính kèm hồ sơ và thực thực phê duyệt đa cấp."
      >
        <Button onClick={() => setShowCreate(!showCreate)}>
          {showCreate ? "Đóng form" : "Hợp đồng mới"}
        </Button>
      </PageHeader>

      {showCreate && (
        <Card>
          <div className="p-6">
            <h3 className="text-lg font-semibold mb-4">Nhập thông tin hợp đồng</h3>
            <div className="stack" style={{ gap: 16 }}>
              <div className="grid-2" style={{ gap: 16 }}>
                <div className="field">
                  <label className="text-sm font-medium mb-1 block">Số hợp đồng</label>
                  <input className="input" placeholder="2026/CON/001" value={contractForm.contractNo} onChange={(e) => setContractForm({...contractForm, contractNo: e.target.value})} />
                </div>
                <div className="field">
                  <label className="text-sm font-medium mb-1 block">Tiêu đề</label>
                  <input className="input" value={contractForm.title} onChange={(e) => setContractForm({...contractForm, title: e.target.value})} />
                </div>
              </div>
              <div className="grid-2" style={{ gap: 16 }}>
                <div className="field">
                  <label className="text-sm font-medium mb-1 block">Đối tác</label>
                  <select className="select" value={contractForm.partnerId} onChange={(e) => setContractForm({...contractForm, partnerId: e.target.value})}>
                    <option value="">-- Chọn đối tác --</option>
                    {partners.map((p: any) => (<option key={p.id} value={p.id}>{p.legalName}</option>))}
                  </select>
                </div>
                <div className="field">
                  <label className="text-sm font-medium mb-1 block">Giá trị (VND)</label>
                  <input className="input" type="number" value={contractForm.value} onChange={(e) => setContractForm({...contractForm, value: e.target.value})} />
                </div>
              </div>
              <Button 
                onClick={async () => {
                  try {
                    await apiRequest("/api/internal/contracts", {
                      method: "POST",
                      body: JSON.stringify({
                        ...contractForm,
                        fiscalYear: Number(contractForm.fiscalYear),
                        value: Number(contractForm.value),
                        startDate: new Date(contractForm.startDate).toISOString(),
                        endDate: new Date(contractForm.endDate).toISOString()
                      })
                    }, token);
                    toast.success("Đã tạo hđ thành công.");
                    setShowCreate(false);
                    contractsResource.reload();
                  } catch (err: any) {
                    toast.error(err.message);
                  }
                }}
              >
                Lưu bản nháp
              </Button>
            </div>
          </div>
        </Card>
      )}

      <Card>
        <div className="p-6">
          <h3 className="text-lg font-semibold mb-4">Danh sách hợp đồng</h3>
          <DataTable data={contracts} columns={columns} />
        </div>
      </Card>
    </div>
  );
}
