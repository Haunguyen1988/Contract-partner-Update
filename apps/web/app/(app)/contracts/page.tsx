"use client";

import { useState } from "react";
import { Badge, Card, DataTable } from "@contract/ui";
import { PageHeader } from "../../../src/components/page-header";
import { ResourceState } from "../../../src/components/resource-state";
import { apiRequest, mergeResourceSources } from "../../../src/lib/api";
import { formatCurrency, formatDate } from "../../../src/lib/format";
import { mockContracts, mockPartners, mockUsers } from "../../../src/lib/mocks";
import { useSession } from "../../../src/lib/session";
import { useApiResource } from "../../../src/lib/use-api-resource";

export default function ContractsPage() {
  const { token } = useSession();
  const contractsResource = useApiResource("/contracts", mockContracts);
  const partnersResource = useApiResource("/partners", mockPartners);
  const usersResource = useApiResource("/users", mockUsers);
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

  if (pageSource === "loading") {
    return <ResourceState source={pageSource} label="hợp đồng và tài liệu" />;
  }

  if (pageSource === "unavailable" && !contractsResource.data && !partnersResource.data && !usersResource.data) {
    return <ResourceState source="unavailable" label="hợp đồng và tài liệu" error={pageError} />;
  }

  return (
    <div className="stack">
      {pageSource === "fallback" ? <ResourceState source="fallback" label="hợp đồng và tài liệu" error={pageError} /> : null}
      <div className="grid-2">
        <Card title="Tạo hợp đồng" eyebrow="Contract registry">
          <div className="stack">
            <PageHeader title="Draft contract" description="Hệ thống sẽ kiểm tra budget theo owner và fiscal year trước khi lưu." />
            <div className="form-grid">
              <div className="field">
                <label>Số hợp đồng</label>
                <input value={contractForm.contractNo} onChange={(event) => setContractForm({ ...contractForm, contractNo: event.target.value })} />
              </div>
              <div className="field">
                <label>Tiêu đề</label>
                <input value={contractForm.title} onChange={(event) => setContractForm({ ...contractForm, title: event.target.value })} />
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
                <label>Owner</label>
                <select value={contractForm.ownerId} onChange={(event) => setContractForm({ ...contractForm, ownerId: event.target.value })}>
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>{user.fullName}</option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label>Fiscal year</label>
                <input value={contractForm.fiscalYear} onChange={(event) => setContractForm({ ...contractForm, fiscalYear: event.target.value })} />
              </div>
              <div className="field">
                <label>Giá trị</label>
                <input value={contractForm.value} onChange={(event) => setContractForm({ ...contractForm, value: event.target.value })} />
              </div>
              <div className="field">
                <label>Ngày bắt đầu</label>
                <input type="date" value={contractForm.startDate} onChange={(event) => setContractForm({ ...contractForm, startDate: event.target.value })} />
              </div>
              <div className="field">
                <label>Ngày kết thúc</label>
                <input type="date" value={contractForm.endDate} onChange={(event) => setContractForm({ ...contractForm, endDate: event.target.value })} />
              </div>
            </div>
            <div className={`status-text ${status ? "success" : ""}`}>{status}</div>
            <div className="button-row">
              <button
                className="button-primary"
                disabled={submitting}
                onClick={async () => {
                  setSubmitting(true);
                  try {
                    const response = await apiRequest<{ budgetCheck?: { warning?: string | null } }>("/contracts", {
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
                    await contractsResource.reload();
                  } catch (error) {
                    setStatus(error instanceof Error ? error.message : "Không thể tạo hợp đồng.");
                  } finally {
                    setSubmitting(false);
                  }
                }}
              >
                {submitting ? "Đang lưu..." : "Lưu draft"}
              </button>
            </div>
          </div>
        </Card>

        <Card title="Upload tài liệu" eyebrow="Document control">
          <div className="stack">
            <PageHeader title="Main contract / appendix" description="Activation sẽ bị chặn cho tới khi có ít nhất 1 tài liệu MAIN_CONTRACT." />
            <div className="field">
              <label>Hợp đồng</label>
              <select value={selectedContractId} onChange={(event) => setSelectedContractId(event.target.value)}>
                {contracts.map((contract) => (
                  <option key={contract.id} value={contract.id}>{contract.contractNo}</option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>Chọn file</label>
              <input type="file" onChange={(event) => setDocumentFile(event.target.files?.[0] ?? null)} />
            </div>
            <div className="button-row">
              <button
                className="button-secondary"
                onClick={async () => {
                  if (!documentFile || !selectedContractId) {
                    setStatus("Cần chọn hợp đồng và file trước khi upload.");
                    return;
                  }

                  const formData = new FormData();
                  formData.append("type", "MAIN_CONTRACT");
                  formData.append("file", documentFile);

                  try {
                    await apiRequest(`/documents/contracts/${selectedContractId}`, {
                      method: "POST",
                      body: formData
                    }, token);
                    setStatus("Đã upload tài liệu hợp đồng.");
                    setDocumentFile(null);
                    await contractsResource.reload();
                  } catch (error) {
                    setStatus(error instanceof Error ? error.message : "Upload thất bại.");
                  }
                }}
              >
                Upload MAIN_CONTRACT
              </button>
            </div>
          </div>
        </Card>
      </div>

      <Card title="Danh sách hợp đồng" eyebrow="Current contracts">
        <DataTable
          columns={["Số hợp đồng", "Tiêu đề", "Đối tác", "Owner", "Giá trị", "Hết hạn", "Status", "Tài liệu", "Action"]}
          rows={contracts.map((contract) => [
            contract.contractNo,
            contract.title,
            contract.partnerName,
            contract.ownerName,
            formatCurrency(contract.value),
            formatDate(contract.endDate),
            <Badge key={`${contract.id}-status`} tone={contract.lifecycleStatus === "ACTIVE" ? "success" : "warning"}>{contract.lifecycleStatus}</Badge>,
            contract.hasMainContract ? "Đã có main contract" : "Thiếu main contract",
            <button
              key={`${contract.id}-action`}
              className="button-ghost"
              disabled={contract.lifecycleStatus === "ACTIVE"}
              onClick={async () => {
                try {
                  await apiRequest(`/contracts/${contract.id}/activate`, { method: "POST" }, token);
                  setStatus(`Đã kích hoạt ${contract.contractNo}.`);
                  await contractsResource.reload();
                } catch (error) {
                  setStatus(error instanceof Error ? error.message : "Không thể kích hoạt hợp đồng.");
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
