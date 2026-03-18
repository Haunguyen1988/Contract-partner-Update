"use client";

import { useState } from "react";
import { Badge, Card, DataTable } from "@contract/ui";
import { PageHeader } from "../../../src/components/page-header";
import { ResourceState } from "../../../src/components/resource-state";
import { apiRequest } from "../../../src/lib/api";
import { mockUsers } from "../../../src/lib/mocks";
import { useSession } from "../../../src/lib/session";
import { useApiResource } from "../../../src/lib/use-api-resource";

const roles = ["ADMIN", "PR_COR_STAFF", "PR_COR_MANAGER", "FINANCE", "LEGAL", "PROCUREMENT", "LEADERSHIP"] as const;

export default function UsersPage() {
  const { token } = useSession();
  const usersResource = useApiResource("/users", mockUsers);
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

  if (usersResource.source === "loading") {
    return <ResourceState source="loading" label="người dùng và phân quyền" />;
  }

  if (usersResource.source === "unavailable" && !usersResource.data) {
    return <ResourceState source="unavailable" label="người dùng và phân quyền" error={usersResource.error?.message ?? null} />;
  }

  return (
    <div className="grid-2">
      {usersResource.usingFallback ? <ResourceState source="fallback" label="người dùng và phân quyền" error={usersResource.error?.message ?? null} /> : null}
      <Card title="Provision user" eyebrow="RBAC">
        <div className="stack">
          <PageHeader title="Tạo user nội bộ" description="Admin có thể tạo user, gán vai trò và mở rộng quyền truy cập theo module." />
          <div className="form-grid">
            <div className="field">
              <label>Họ tên</label>
              <input value={form.fullName} onChange={(event) => setForm({ ...form, fullName: event.target.value })} />
            </div>
            <div className="field">
              <label>Email</label>
              <input value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} />
            </div>
            <div className="field">
              <label>Mật khẩu tạm</label>
              <input value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} />
            </div>
            <div className="field">
              <label>Vai trò</label>
              <select value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value })}>
                {roles.map((role) => (
                  <option key={role} value={role}>{role}</option>
                ))}
              </select>
            </div>
          </div>
          <div className={`status-text ${status ? "success" : ""}`}>{status}</div>
          <div className="button-row">
            <button
              className="button-primary"
              onClick={async () => {
                try {
                  await apiRequest("/users", {
                    method: "POST",
                    body: JSON.stringify(form)
                  }, token);
                  setStatus("Đã provision user mới.");
                  await usersResource.reload();
                } catch (error) {
                  setStatus(error instanceof Error ? error.message : "Không thể tạo user.");
                }
              }}
            >
              Tạo user
            </button>
          </div>
        </div>
      </Card>

      <Card title="Danh sách user" eyebrow="Access management">
        <DataTable
          columns={["Họ tên", "Email", "Vai trò", "Phòng ban", "Trạng thái"]}
          rows={users.map((user) => [
            user.fullName,
            user.email,
            user.role,
            user.department ?? "N/A",
            <Badge key={user.id} tone={user.status === "ACTIVE" ? "success" : "warning"}>{user.status}</Badge>
          ])}
        />
      </Card>
    </div>
  );
}
