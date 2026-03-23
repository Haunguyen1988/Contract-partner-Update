"use client";

import { useState } from "react";
import { Badge, Card, DataTable, Column, PageHeader } from "@contract/ui";
import { apiRequest } from "../../../src/lib/api";
import { mockUsers } from "../../../src/lib/mocks";
import { useSession } from "../../../src/lib/session";
import { useApiResource } from "../../../src/lib/use-api-resource";

const roles = ["ADMIN", "PR_COR_STAFF", "PR_COR_MANAGER", "FINANCE", "LEGAL", "PROCUREMENT", "LEADERSHIP"] as const;

export default function UsersPage() {
  const { token } = useSession();
  const usersResource = useApiResource("/api/internal/users", mockUsers);
  const users = usersResource.data ?? mockUsers;
  const [status, setStatus] = useState("");
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    password: "Password@123",
    role: "PR_COR_STAFF",
    department: "PR COR",
    status: "ACTIVE"
  });

  const columns: Column<any>[] = [
    { header: "Họ tên", accessor: (u) => u.fullName },
    { header: "Email", accessor: (u) => u.email },
    { header: "Vai trò", accessor: (u) => u.role },
    { header: "Phòng ban", accessor: (u) => u.department ?? "N/A" },
    { header: "Trạng thái", accessor: (u) => <Badge tone={u.status === "ACTIVE" ? "success" : "warning"}>{u.status}</Badge> }
  ];

  return (
    <div className="grid-2" style={{ padding: 24 }}>
      <Card>
        <div className="p-6">
          <PageHeader title="Tạo user nội bộ" description="Admin có thể tạo user, gán vai trò và mở rộng quyền truy cập theo module." />
          <div className="stack" style={{ gap: 16, marginTop: 24 }}>
            <div className="field">
              <label className="text-sm font-medium mb-1 block">Họ tên</label>
              <input className="input" value={form.fullName} onChange={(event) => setForm({ ...form, fullName: event.target.value })} />
            </div>
            <div className="field">
              <label className="text-sm font-medium mb-1 block">Email</label>
              <input className="input" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} />
            </div>
            <div className="field">
              <label className="text-sm font-medium mb-1 block">Vai trò</label>
              <select className="select" value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value })}>
                {roles.map((role) => (
                  <option key={role} value={role}>{role}</option>
                ))}
              </select>
            </div>
            {status && <div className="text-sm text-success">{status}</div>}
            <button
              className="button-primary"
              onClick={async () => {
                try {
                  await apiRequest("/api/internal/users", {
                    method: "POST",
                    body: JSON.stringify(form)
                  }, token);
                  setStatus("Đã provision user mới.");
                  usersResource.reload();
                } catch (error) {
                  setStatus(error instanceof Error ? error.message : "Thất bại.");
                }
              }}
            >
              Tạo user
            </button>
          </div>
        </div>
      </Card>

      <Card>
        <div className="p-6">
          <h3 className="text-lg font-semibold mb-4">Danh sách user</h3>
          <DataTable data={users} columns={columns} />
        </div>
      </Card>
    </div>
  );
}
