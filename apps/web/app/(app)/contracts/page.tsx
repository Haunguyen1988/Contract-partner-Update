"use client";

import { useState } from "react";
import { Badge, Card, DataTable, ProgressBar } from "@contract/ui";
import { PageHeader } from "../../../src/components/page-header";
import { ResourceState } from "../../../src/components/resource-state";
import { apiRequest, mergeResourceSources } from "../../../src/lib/api";
import { formatCurrency, formatDate } from "../../../src/lib/format";
import { mockContracts, mockPartners, mockUsers } from "../../../src/lib/mocks";
import { useSession } from "../../../src/lib/session";
import { useApiResource } from "../../../src/lib/use-api-resource";

export default function ContractsPage() {
  const { token } = useSession();
  const contractsResource = useApiResource("/api/internal/contracts", mockContracts);
  const partnersResource = useApiResource("/api/internal/partners", mockPartners);
  const usersResource = useApiResource("/api/internal/users", mockUsers);
  const contracts = contractsResource.data ?? mockContracts;
  const partners = partnersResource.data ?? mockPartners;
  const users = usersResource.data ?? mockUsers;
  const pageSource = mergeResourceSources([contractsResource.source, partnersResource.source, usersResource.source]);
  const pageError = contractsResource.error?.message ?? partnersResource.error?.message ?? usersResource.error?.message ?? null;
  const [status, setStatus] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [selectedContractId, setSelectedContractId] = useState(mockContracts[0]?.id ?? "");
  const [documentFile, setDocumentFile] = useState<File | null>(null);
  const [contractForm, setContractForm] = useState({
    contractNo: "",
    title: "",
    partnerId: mockPartners[0]?.id ?? "",
    ownerId: mockUsers[2]?.id ?? "",
    fiscalYear: "2026",
    value: "",
    startDate: "2026-03-18",
    endDate: "2026-05-18",
    campaign: "GENERAL"
  });

  const [showCreate, setShowCreate] = useState(false);
  
  if (pageSource === "loading") {
    return <ResourceState source={pageSource} label="hợp đồng và tài liệu" />;
  }

  if (pageSource === "unavailable" && !contractsResource.data && !partnersResource.data && !usersResource.data) {
    return <ResourceState source="unavailable" label="hợp đồng và tài liệu" error={pageError} />;
  }

  return (
    <div className="stack">
      {pageSource === "fallback" ? <ResourceState source="fallback" label="hợp đồng và tài liệu" error={pageError} /> : null}
      
      <section className="hero panel" style={{ background: "var(--bg-0)", padding: "24px 32px", marginBottom: 0 }}>
        <PageHeader 
          title="Quản lý hợp đồng" 
          description="Đăng ký hợp đồng mới, upload tài liệu pháp lý và theo dõi hiệu lực."
          actions={
            <button className="button-primary" onClick={() => setShowCreate(!showCreate)}>
              {showCreate ? "Đóng form" : "Tạo hợp đồng mới"}
            </button>
          }
        />
      </section>

      {showCreate && (
        <div className="grid-2">
          <Card title="Chi tiết hợp đồng" eyebrow="Drafting">
            <div className="stack">
              <div className="form-grid">
                <div className="field">
                  <label>Số hợp đồng</label>
                  <input placeholder="VD: 2026/VJC/CON/001" value={contractForm.contractNo} onChange={(event) => setContractForm({ ...contractForm, contractNo: event.target.value })} />
                </div>
                <div className="field">
                  <label>Tiêu đề</label>
                  <input placeholder="VD: Hợp đồng cung cấp dịch vụ IT" value={contractForm.title} onChange={(event) => setContractForm({ ...contractForm, title: event.target.value })} />
                </div>
                <div className="field">
                  <label>Đối tác</label>
                  <select value={contractForm.partnerId} onChange={(event) => setContractForm({ ...contractForm, partnerId: event.target.value })}>
                    {partners.map((partner) => (
                      <option key={partner.id} value={partner.id}>{partner.legalName}</option>
                    ))}
                  </select>
                </div>
                <div className="field">
                  <label>Owner phụ trách</label>
                  <select value={contractForm.ownerId} onChange={(event) => setContractForm({ ...contractForm, ownerId: event.target.value })}>
                    {users.map((user) => (
                      <option key={user.id} value={user.id}>{user.fullName}</option>
                    ))}
                  </select>
                </div>
                <div className="field">
                  <label>Năm tài chính</label>
                  <input type="number" value={contractForm.fiscalYear} onChange={(event) => setContractForm({ ...contractForm, fiscalYear: event.target.value })} />
                </div>
                <div className="field">
                  <label>Giá trị (VND)</label>
                  <input type="number" placeholder="0" value={contractForm.value} onChange={(event) => setContractForm({ ...contractForm, value: event.target.value })} />
                </div>
                <div className="field">
                  <label>Ngày hiệu lực</label>
                  <input type="date" value={contractForm.startDate} onChange={(event) => setContractForm({ ...contractForm, startDate: event.target.value })} />
                </div>
                <div className="field">
                  <label>Ngày hết hạn</label>
                  <input type="date" value={contractForm.endDate} onChange={(event) => setContractForm({ ...contractForm, endDate: event.target.value })} />
                </div>
              </div>
              <div className={`status-text ${status ? (status.includes("lỗi") || status.includes("Thất bại") ? "error" : "success") : ""}`}>{status}</div>
              <div className="button-row">
                <button
                  className="button-primary"
                  disabled={submitting}
                  onClick={async () => {
                    setSubmitting(true);
                    try {
                      const response = await apiRequest<{ budgetCheck?: { warning?: string | null } }>("/api/internal/contracts", {
                        method: "POST",
                        body: JSON.stringify({
                          ...contractForm,
                          fiscalYear: Number(contractForm.fiscalYear),
                          value: Number(contractForm.value),
                          startDate: new Date(`${contractForm.startDate}T00:00:00.000Z`).toISOString(),
                          endDate: new Date(`${contractForm.endDate}T00:00:00.000Z`).toISOString(),
                          lifecycleStatus: "DRAFT"
                        })
                      }, token);
                      setStatus(response.budgetCheck?.warning ?? "Đã tạo hợp đồng thành công.");
                      if (!response.budgetCheck?.warning) {
                        setShowCreate(false);
                      }
                      await contractsResource.reload();
                    } catch (error) {
                      setStatus(error instanceof Error ? error.message : "Không thể tạo hợp đồng.");
                    } finally {
                      setSubmitting(false);
                    }
                  }}
                >
                  {submitting ? "Đang lưu..." : "Lưu bản nháp"}
                </button>
              </div>
            </div>
          </Card>

          <Card title="Tài liệu đính kèm" eyebrow="Compliance">
            <div className="stack">
              <PageHeader title="Upload hồ sơ" description="Bắt buộc có MAIN_CONTRACT để kích hoạt hợp đồng." />
              <div className="field">
                <label>Chọn hợp đồng để bổ sung</label>
                <select value={selectedContractId} onChange={(event) => setSelectedContractId(event.target.value)}>
                  <option value="">-- Chọn hợp đồng --</option>
                  {contracts.map((contract) => (
                    <option key={contract.id} value={contract.id}>{contract.contractNo} - {contract.title}</option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label>File đính kèm (PDF/Scan)</label>
                <input type="file" onChange={(event) => setDocumentFile(event.target.files?.[0] ?? null)} />
              </div>
              <div className="button-row">
                <button
                  className="button-secondary"
                  disabled={!documentFile || !selectedContractId}
                  onClick={async () => {
                    const formData = new FormData();
                    formData.append("type", "MAIN_CONTRACT");
                    formData.append("file", documentFile!);

                    try {
                      await apiRequest(`/api/internal/documents/contracts/${selectedContractId}`, {
                        method: "POST",
                        body: formData
                      }, token);
                      setStatus("Đã upload tài liệu thành công.");
                      setDocumentFile(null);
                      await contractsResource.reload();
                    } catch (error) {
                      setStatus(error instanceof Error ? error.message : "Upload thất bại.");
                    }
                  }}
                >
                  Upload bản ký kết
                </button>
              </div>
            </div>
          </Card>
        </div>
      )}

      <Card title="Sổ cái hợp đồng" eyebrow={`Phát hiện ${contracts.length} bản ghi`}>
        <DataTable
          columns={["Số hợp đồng", "Tiêu đề", "Đối tác", "Owner", "Giá trị", "Hết hạn", "Status", "Tài liệu", "Thao tác"]}
          rows={contracts.map((contract) => [
            <strong key={`${contract.id}-no`}>{contract.contractNo}</strong>,
            contract.title,
            contract.partnerName,
            contract.ownerName,
            formatCurrency(contract.value),
            formatDate(contract.endDate),
            <Badge key={`${contract.id}-status`} tone={contract.lifecycleStatus === "ACTIVE" ? "success" : "warning"}>{contract.lifecycleStatus}</Badge>,
            <span key={`${contract.id}-doc`} style={{ fontSize: "12px", color: contract.hasMainContract ? "var(--accent)" : "var(--danger)" }}>
              {contract.hasMainContract ? "✅ Đã có file" : "❌ Thiếu file"}
            </span>,
            <button
              key={`${contract.id}-action`}
              className="button-ghost"
              disabled={contract.lifecycleStatus === "ACTIVE"}
              onClick={async () => {
                try {
                  await apiRequest(`/api/internal/contracts/${contract.id}/activate`, { method: "POST" }, token);
                  setStatus(`Đã kích hoạt ${contract.contractNo}.`);
                  await contractsResource.reload();
                } catch (error) {
                  setStatus(error instanceof Error ? error.message : "Lỗi kích hoạt.");
                }
              }}
            >
              Kích hoạt
            </button>
          ])}
        />
      </Card>
    </div>
  );
}
