"use client";

import { Badge, Card, DataTable } from "@contract/ui";
import { ActionFeedback } from "../../../src/components/action-feedback";
import { AsyncActionButton } from "../../../src/components/async-action-button";
import { PageHeader } from "../../../src/components/page-header";
import { ResourceGuard } from "../../../src/components/resource-guard";
import { apiRequest } from "../../../src/lib/api";
import { useAsyncAction } from "../../../src/lib/async-action";
import { useFormState } from "../../../src/lib/form-state";
import { mockPartners, mockUsers } from "../../../src/lib/mocks";
import { getResourcePageState } from "../../../src/lib/resource";
import { useSession } from "../../../src/lib/session";
import { useApiResource } from "../../../src/lib/use-api-resource";

export default function PartnersPage() {
  const { token } = useSession();
  const partnersResource = useApiResource("/api/internal/partners", mockPartners);
  const usersResource = useApiResource("/api/internal/users", mockUsers);
  const partners = partnersResource.data ?? mockPartners;
  const users = usersResource.data ?? mockUsers;
  const pageState = getResourcePageState([partnersResource, usersResource]);
  const createPartnerAction = useAsyncAction();
  const partnerForm = useFormState({
    code: "",
    legalName: "",
    taxCode: "",
    category: "",
    primaryOwnerId: mockUsers[2]?.id ?? "",
    backupOwnerId: mockUsers[1]?.id ?? ""
  });

  return (
    <ResourceGuard label="danh mục đối tác" state={pageState}>
      <div className="grid-2">
        <Card title="Tạo đối tác mới" eyebrow="Partner registry">
          <div className="stack">
            <PageHeader title="Master data đối tác" description="Chuẩn hóa legal name, tax code và owner phụ trách trước khi mở hợp đồng." />
            <div className="form-grid">
              <div className="field">
                <label>Mã đối tác</label>
                <input {...partnerForm.bind("code")} />
              </div>
              <div className="field">
                <label>Legal name</label>
                <input {...partnerForm.bind("legalName")} />
              </div>
              <div className="field">
                <label>Tax code</label>
                <input {...partnerForm.bind("taxCode")} />
              </div>
              <div className="field">
                <label>Category</label>
                <input {...partnerForm.bind("category")} />
              </div>
              <div className="field">
                <label>Primary owner</label>
                <select {...partnerForm.bind("primaryOwnerId")}>
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>{user.fullName}</option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label>Backup owner</label>
                <select {...partnerForm.bind("backupOwnerId")}>
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>{user.fullName}</option>
                  ))}
                </select>
              </div>
            </div>
            <ActionFeedback feedback={createPartnerAction.feedback} />
            <div className="button-row">
              <AsyncActionButton
                className="button-primary"
                pending={createPartnerAction.pending}
                idleLabel="Lưu đối tác"
                pendingLabel="Đang lưu..."
                onClick={async () => {
                  await createPartnerAction.run(
                    () => apiRequest("/api/internal/partners", {
                      method: "POST",
                      body: JSON.stringify({
                        ...partnerForm.values,
                        contactInfo: {}
                      })
                    }, token),
                    {
                      errorMessage: "Không thể tạo đối tác.",
                      successMessage: "Đã tạo đối tác và ghi log thành công.",
                      onSuccess: async () => {
                        partnerForm.patch({ code: "", legalName: "", taxCode: "", category: "" });
                        await partnersResource.reload();
                      }
                    }
                  );
                }}
              />
            </div>
          </div>
        </Card>

        <Card title="Danh mục đối tác" eyebrow="Current registry">
          <DataTable
            columns={["Code", "Legal name", "Tax code", "Owner", "Category", "Status"]}
            rows={partners.map((partner) => [
              partner.code,
              partner.legalName,
              partner.taxCode ?? "Chưa có",
              partner.primaryOwner?.fullName ?? "N/A",
              partner.category ?? "N/A",
              <Badge key={partner.id} tone={partner.status === "ACTIVE" ? "success" : "warning"}>{partner.status}</Badge>
            ])}
          />
        </Card>
      </div>
    </ResourceGuard>
  );
}
