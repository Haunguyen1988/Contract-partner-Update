"use client";

import { useRouter } from "next/navigation";
import { ActionFeedback } from "../../src/components/action-feedback";
import { AsyncActionButton } from "../../src/components/async-action-button";
import { IntegrationStatus } from "../../src/components/integration-status";
import { useAsyncAction } from "../../src/lib/async-action";
import { useFormState } from "../../src/lib/form-state";
import { useSession } from "../../src/lib/session";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useSession();
  const loginForm = useFormState({
    email: "admin@prcor.local",
    password: "Admin@123"
  });
  const loginAction = useAsyncAction();

  return (
    <div className="login-shell">
      <div className="login-card panel">
        <section className="login-hero">
          <p className="muted" style={{ fontWeight: 600, letterSpacing: "0.05em", marginTop: 0, fontSize: 13 }}>Phase 1 MVP</p>
          <h1 style={{ fontSize: 40, lineHeight: 1.1, marginBottom: 16, letterSpacing: "-0.03em" }}>Ứng dụng quản trị hợp đồng báo chí cho PR COR</h1>
          <p className="muted" style={{ fontSize: 16, lineHeight: 1.6 }}>
            Tập trung hóa đối tác, hợp đồng, ngân sách, tài liệu và cảnh báo hết hạn trong một không gian vận hành chung.
          </p>
          <div className="panel" style={{ padding: 24, marginTop: 32, background: "var(--bg-1)", boxShadow: "none" }}>
            <p style={{ marginTop: 0, fontWeight: 600, fontSize: 15 }}>Những gì đã có trong MVP</p>
            <ul style={{ marginBottom: 0, paddingLeft: 18, color: "#334155" }}>
              <li>Auth nội bộ và phân quyền theo vai trò</li>
              <li>Partner registry và duplicate check</li>
              <li>Contract registry, upload tài liệu, activation rule</li>
              <li>Budget control, expiry alerts, dashboard, audit log</li>
            </ul>
          </div>
          <div style={{ marginTop: 18 }}>
            <IntegrationStatus compact />
          </div>
        </section>

        <section className="login-form">
          <h2 style={{ marginTop: 0, fontSize: 28, letterSpacing: "-0.02em" }}>Đăng nhập</h2>
          <p className="muted" style={{ fontSize: 14 }}>Dùng tài khoản nội bộ seeded trong README để vào dashboard.</p>
          <div className="stack" style={{ marginTop: 24 }}>
            <div className="field">
              <label>Email</label>
              <input {...loginForm.bind("email")} />
            </div>
            <div className="field">
              <label>Mật khẩu</label>
              <input type="password" {...loginForm.bind("password")} />
            </div>
            <ActionFeedback feedback={loginAction.feedback} />
            <div className="button-row">
              <AsyncActionButton
                className="button-primary"
                pending={loginAction.pending}
                idleLabel="Vào hệ thống"
                pendingLabel="Đang đăng nhập..."
                onClick={async () => {
                  await loginAction.run(
                    () => login(loginForm.values.email, loginForm.values.password),
                    {
                      errorMessage: "Không thể đăng nhập.",
                      onSuccess: () => {
                        router.push("/dashboard");
                      }
                    }
                  );
                }}
              />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
