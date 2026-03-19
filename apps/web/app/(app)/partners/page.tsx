"use client";

import { useState } from "react";
import { Badge, Card, DataTable } from "@contract/ui";
import { PageHeader } from "../../../src/components/page-header";
import { ResourceState } from "../../../src/components/resource-state";
import { apiRequest, mergeResourceSources } from "../../../src/lib/api";
import { mockPartners, mockUsers } from "../../../src/lib/mocks";
import { useSession } from "../../../src/lib/session";
import { useApiResource } from "../../../src/lib/use-api-resource";

export default function PartnersPage() {
  const { token } = useSession();
  const partnersResource = useApiResource("/api/internal/partners", mockPartners);
  const usersResource = useApiResource("/api/internal/users", mockUsers);
  const partners = partnersResource.data ?? mockPartners;
  const users = usersResource.data ?? mockUsers;
  const pageSource = mergeResourceSources([partnersResource.source, usersResource.source]);
  const pageError = partnersResource.error?.message ?? usersResource.error?.message ?? null;
  const [status, setStatus] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    code: "",
    legalName: "",
    taxCode: "",
    category: "",
    primaryOwnerId: mockUsers[2]?.id ?? "",
    backupOwnerId: mockUsers[1]?.id ?? ""
  });

  if (pageSource === "loading") {
    return <ResourceState source={pageSource} label="danh mục đối tác" />;
  }

  if (pageSource === "unavailable" && !partnersResource.data && !usersResource.data) {
    return <ResourceState source="unavailable" label="danh mục đối tác" error={pageError} />;
  }

  return (
    <div className="grid-2">
      {pageSource === "fallback" ? <ResourceState source="fallback" label="danh mục đối tác" error={pageError} /> : null}
      <Card title="Tạo đối tác mới" eyebrow="Partner registry">
        <div className="stack">
          <PageHeader title="Master data đối tác" description="Chuẩn hóa legal name, tax code và owner phụ trách trước khi mở hợp đồng." />
          <div className="form-grid">
            <div className="field">
              <label>Mã đối tác</label>
              <input value={form.code} onChange={(event) => setForm({ ...form, code: event.target.value })} />
            </div>
            <div className="field">
              <label>Legal name</label>
              <input value={form.legalName} onChange={(event) => setForm({ ...form, legalName: event.target.value })} />
            </div>
            <div className="field">
              <label>Tax code</label>
              <input value={form.taxCode} onChange={(event) => setForm({ ...form, taxCode: event.target.value })} />
            </div>
            <div className="field">
              <label>Category</label>
              <input value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })} />
            </div>
            <div className="field">
              <label>Primary owner</label>
              <select value={form.primaryOwnerId} onChange={(event) => setForm({ ...form, primaryOwnerId: event.target.value })}>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>{user.fullName}</option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>Backup owner</label>
              <select value={form.backupOwnerId} onChange={(event) => setForm({ ...form, backupOwnerId: event.target.value })}>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>{user.fullName}</option>
                ))}
              </select>
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
                  await apiRequest("/api/internal/partners", {
                    method: "POST",
                    body: JSON.stringify({
                      ...form,
                      contactInfo: {}
                    })
                  }, token);
                  setStatus("Đã tạo đối tác và ghi log thành công.");
                  setForm({ ...form, code: "", legalName: "", taxCode: "", category: "" });
                  await partnersResource.reload();
                } catch (error) {
                  setStatus(error instanceof Error ? error.message : "Không thể tạo đối tác.");
                } finally {
                  setSubmitting(false);
                }
              }}
            >
              {submitting ? "Đang lưu..." : "Lưu đối tác"}
            </button>
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
  );
}
