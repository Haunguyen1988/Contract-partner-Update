"use client";

import { useState } from "react";
import { Badge, Card, DataTable } from "@contract/ui";
import { ActionFeedback } from "../../../src/components/action-feedback";
import { AsyncActionButton } from "../../../src/components/async-action-button";
import { PageHeader } from "../../../src/components/page-header";
import { ResourceGuard } from "../../../src/components/resource-guard";
import { apiRequest } from "../../../src/lib/api";
import { useAsyncAction } from "../../../src/lib/async-action";
import { formatCurrency, formatDate } from "../../../src/lib/format";
import { useFormState } from "../../../src/lib/form-state";
import { mockContracts, mockPartners, mockUsers } from "../../../src/lib/mocks";
import { getResourcePageState } from "../../../src/lib/resource";
import { useSession } from "../../../src/lib/session";
import { useApiResource } from "../../../src/lib/use-api-resource";

interface CreateContractMutationResult {
  budgetCheck?: {
    warning?: string | null;
  };
}

export default function ContractsPage() {
  const { token } = useSession();
  const contractsResource = useApiResource("/api/internal/contracts", mockContracts);
  const partnersResource = useApiResource("/api/internal/partners", mockPartners);
  const usersResource = useApiResource("/api/internal/users", mockUsers);
  const contracts = contractsResource.data ?? mockContracts;
  const partners = partnersResource.data ?? mockPartners;
  const users = usersResource.data ?? mockUsers;
  const pageState = getResourcePageState([contractsResource, partnersResource, usersResource]);
  const contractAction = useAsyncAction();
  const [selectedContractId, setSelectedContractId] = useState(mockContracts[0]?.id ?? "");
  const [documentFile, setDocumentFile] = useState<File | null>(null);
  const contractForm = useFormState({
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

  return (
    <ResourceGuard label="hợp đồng và tài liệu" state={pageState}>
      <div className="stack">
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
                  <input placeholder="VD: 2026/VJC/CON/001" {...contractForm.bind("contractNo")} />
                </div>
                <div className="field">
                  <label>Tiêu đề</label>
                  <input placeholder="VD: Hợp đồng cung cấp dịch vụ IT" {...contractForm.bind("title")} />
                </div>
                <div className="field">
                  <label>Đối tác</label>
                  <select {...contractForm.bind("partnerId")}>
                    {partners.map((partner) => (
                      <option key={partner.id} value={partner.id}>{partner.legalName}</option>
                    ))}
                  </select>
                </div>
                <div className="field">
                  <label>Owner phụ trách</label>
                  <select {...contractForm.bind("ownerId")}>
                    {users.map((user) => (
                      <option key={user.id} value={user.id}>{user.fullName}</option>
                    ))}
                  </select>
                </div>
                <div className="field">
                  <label>Năm tài chính</label>
                  <input type="number" {...contractForm.bind("fiscalYear")} />
                </div>
                <div className="field">
                  <label>Giá trị (VND)</label>
                  <input type="number" placeholder="0" {...contractForm.bind("value")} />
                </div>
                <div className="field">
                  <label>Ngày hiệu lực</label>
                  <input type="date" {...contractForm.bind("startDate")} />
                </div>
                <div className="field">
                  <label>Ngày hết hạn</label>
                  <input type="date" {...contractForm.bind("endDate")} />
                </div>
              </div>
              <ActionFeedback feedback={contractAction.feedback} />
              <div className="button-row">
                <AsyncActionButton
                  className="button-primary"
                  pending={contractAction.pending}
                  idleLabel="Lưu bản nháp"
                  pendingLabel="Đang lưu..."
                  onClick={async () => {
                    await contractAction.run(
                      () => apiRequest<CreateContractMutationResult>("/api/internal/contracts", {
                        method: "POST",
                        body: JSON.stringify({
                          ...contractForm.values,
                          fiscalYear: Number(contractForm.values.fiscalYear),
                          value: Number(contractForm.values.value),
                          startDate: new Date(`${contractForm.values.startDate}T00:00:00.000Z`).toISOString(),
                          endDate: new Date(`${contractForm.values.endDate}T00:00:00.000Z`).toISOString(),
                          lifecycleStatus: "DRAFT"
                        })
                      }, token),
                      {
                        errorMessage: "Không thể tạo hợp đồng.",
                        successMessage: (response) => response.budgetCheck?.warning ?? "Đã tạo hợp đồng thành công.",
                        onSuccess: async (response) => {
                          if (!response.budgetCheck?.warning) {
                            setShowCreate(false);
                          }

                          await contractsResource.reload();
                        }
                      }
                    );
                  }}
                />
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
                <AsyncActionButton
                  className="button-secondary"
                  disabled={!documentFile || !selectedContractId}
                  pending={contractAction.pending}
                  idleLabel="Upload bản ký kết"
                  pendingLabel="Đang upload..."
                  onClick={async () => {
                    const formData = new FormData();
                    formData.append("type", "MAIN_CONTRACT");
                    formData.append("file", documentFile!);

                    await contractAction.run(
                      () => apiRequest(`/api/internal/documents/contracts/${selectedContractId}`, {
                        method: "POST",
                        body: formData
                      }, token),
                      {
                        errorMessage: "Upload thất bại.",
                        successMessage: "Đã upload tài liệu thành công.",
                        onSuccess: async () => {
                          setDocumentFile(null);
                          await contractsResource.reload();
                        }
                      }
                    );
                  }}
                />
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
            <AsyncActionButton
              key={`${contract.id}-action`}
              className="button-ghost"
              disabled={contract.lifecycleStatus === "ACTIVE"}
              pending={contractAction.pending}
              idleLabel="Kích hoạt"
              pendingLabel="Đang xử lý..."
              onClick={async () => {
                await contractAction.run(
                  () => apiRequest(`/api/internal/contracts/${contract.id}/activate`, { method: "POST" }, token),
                  {
                    errorMessage: "Lỗi kích hoạt.",
                    successMessage: `Đã kích hoạt ${contract.contractNo}.`,
                    onSuccess: () => contractsResource.reload()
                  }
                );
              }}
            />
          ])}
        />
      </Card>
      </div>
    </ResourceGuard>
  );
}
