"use client";

import { useState } from "react";
import { Badge, Card, DataTable, Column, PageHeader } from "@contract/ui";
import { apiRequest } from "../../../src/lib/api";
import { mockPartners, mockUsers } from "../../../src/lib/mocks";
import { useSession } from "../../../src/lib/session";
import { useApiResource } from "../../../src/lib/use-api-resource";

export default function PartnersPage() {
  const { token } = useSession();
  const partnersResource = useApiResource("/api/internal/partners", mockPartners);
  const usersResource = useApiResource("/api/internal/users", mockUsers);
  const partners = partnersResource.data ?? mockPartners;
  const users = usersResource.data ?? mockUsers;
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

  const columns: Column<any>[] = [
    { header: "Code", accessor: (p) => p.code },
    { header: "Legal name", accessor: (p) => p.legalName },
    { header: "Tax code", accessor: (p) => p.taxCode ?? "Chưa có" },
    { header: "Owner", accessor: (p) => p.primaryOwner?.fullName ?? "N/A" },
    { header: "Category", accessor: (p) => p.category ?? "N/A" },
    { header: "Status", accessor: (p) => <Badge tone={p.status === "ACTIVE" ? "success" : "warning"}>{p.status}</Badge> }
  ];

  return (
    <div className="grid-2" style={{ padding: 24 }}>
      <Card>
        <div className="p-6">
          <PageHeader title="Tạo đối tác mới" description="Chuẩn hóa legal name, tax code và owner phụ trách trước khi mở hợp đồng." />
          <div className="stack" style={{ gap: 16, marginTop: 24 }}>
            <div className="grid-2" style={{ gap: 16 }}>
              <div className="field">
                <label className="text-sm font-medium mb-1 block">Mã đối tác</label>
                <input className="input" value={form.code} onChange={(event) => setForm({ ...form, code: event.target.value })} />
              </div>
              <div className="field">
                <label className="text-sm font-medium mb-1 block">Legal name</label>
                <input className="input" value={form.legalName} onChange={(event) => setForm({ ...form, legalName: event.target.value })} />
              </div>
            </div>
            <div className="field">
              <label className="text-sm font-medium mb-1 block">Tax code</label>
              <input className="input" value={form.taxCode} onChange={(event) => setForm({ ...form, taxCode: event.target.value })} />
            </div>
            <div className="field">
              <label className="text-sm font-medium mb-1 block">Category</label>
              <input className="input" value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })} />
            </div>
            <div className="grid-2" style={{ gap: 16 }}>
              <div className="field">
                <label className="text-sm font-medium mb-1 block">Primary owner</label>
                <select className="select" value={form.primaryOwnerId} onChange={(event) => setForm({ ...form, primaryOwnerId: event.target.value })}>
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>{user.fullName}</option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label className="text-sm font-medium mb-1 block">Backup owner</label>
                <select className="select" value={form.backupOwnerId} onChange={(event) => setForm({ ...form, backupOwnerId: event.target.value })}>
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>{user.fullName}</option>
                  ))}
                </select>
              </div>
            </div>
            {status && <div className="text-sm text-success">{status}</div>}
            <button
              className="button-primary"
              disabled={submitting}
              onClick={async () => {
                setSubmitting(true);
                try {
                  await apiRequest("/api/internal/partners", {
                    method: "POST",
                    body: JSON.stringify({ ...form, contactInfo: {} })
                  }, token);
                  setStatus("Đã tạo đối tác thành công.");
                  setForm({ ...form, code: "", legalName: "", taxCode: "", category: "" });
                  partnersResource.reload();
                } catch (error) {
                  setStatus(error instanceof Error ? error.message : "Thất bại.");
                } finally {
                  setSubmitting(false);
                }
              }}
            >
              Lưu đối tác
            </button>
          </div>
        </div>
      </Card>

      <Card>
        <div className="p-6">
          <h3 className="text-lg font-semibold mb-4">Danh mục đối tác</h3>
          <DataTable data={partners} columns={columns} />
        </div>
      </Card>
    </div>
  );
}
