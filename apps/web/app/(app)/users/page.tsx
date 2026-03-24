"use client";

import { Badge, Card, DataTable } from "@contract/ui";
import { ActionFeedback } from "../../../src/components/action-feedback";
import { AsyncActionButton } from "../../../src/components/async-action-button";
import { PageHeader } from "../../../src/components/page-header";
import { ResourceGuard } from "../../../src/components/resource-guard";
import { apiRequest } from "../../../src/lib/api";
import { useAsyncAction } from "../../../src/lib/async-action";
import { useFormState } from "../../../src/lib/form-state";
import { mockUsers } from "../../../src/lib/mocks";
import { getResourcePageState } from "../../../src/lib/resource";
import { useSession } from "../../../src/lib/session";
import { useApiResource } from "../../../src/lib/use-api-resource";

const roles = ["ADMIN", "PR_COR_STAFF", "PR_COR_MANAGER", "FINANCE", "LEGAL", "PROCUREMENT", "LEADERSHIP"] as const;

export default function UsersPage() {
  const { token } = useSession();
  const usersResource = useApiResource("/api/internal/users", mockUsers);
  const users = usersResource.data ?? mockUsers;
  const createUserAction = useAsyncAction();
  const userForm = useFormState({
    fullName: "",
    email: "",
    password: "Password@123",
    role: "PR_COR_STAFF",
    department: "PR COR",
    status: "ACTIVE"
  });
  const pageState = getResourcePageState([usersResource]);

  return (
    <ResourceGuard label="người dùng và phân quyền" state={pageState}>
      <div className="grid-2">
        <Card title="Provision user" eyebrow="RBAC">
          <div className="stack">
            <PageHeader title="Tạo user nội bộ" description="Admin có thể tạo user, gán vai trò và mở rộng quyền truy cập theo module." />
            <div className="form-grid">
              <div className="field">
                <label>Họ tên</label>
                <input {...userForm.bind("fullName")} />
              </div>
              <div className="field">
                <label>Email</label>
                <input {...userForm.bind("email")} />
              </div>
              <div className="field">
                <label>Mật khẩu tạm</label>
                <input {...userForm.bind("password")} />
              </div>
              <div className="field">
                <label>Vai trò</label>
                <select {...userForm.bind("role")}>
                  {roles.map((role) => (
                    <option key={role} value={role}>{role}</option>
                  ))}
                </select>
              </div>
            </div>
            <ActionFeedback feedback={createUserAction.feedback} />
            <div className="button-row">
              <AsyncActionButton
                className="button-primary"
                pending={createUserAction.pending}
                idleLabel="Tạo user"
                pendingLabel="Đang tạo..."
                onClick={async () => {
                  await createUserAction.run(
                    () => apiRequest("/api/internal/users", {
                      method: "POST",
                      body: JSON.stringify(userForm.values)
                    }, token),
                    {
                      errorMessage: "Không thể tạo user.",
                      successMessage: "Đã provision user mới.",
                      onSuccess: () => usersResource.reload()
                    }
                  );
                }}
              />
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
    </ResourceGuard>
  );
}
