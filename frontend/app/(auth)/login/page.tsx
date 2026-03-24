"use client";

import { AlertCircle, LockKeyhole, Mail, Newspaper } from "lucide-react";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

function getErrorMessage(message?: string) {
  const normalized = message?.toLowerCase() ?? "";

  if (
    normalized.includes("invalid login credentials") ||
    normalized.includes("invalid credentials") ||
    normalized.includes("email or password") ||
    normalized.includes("invalid_grant")
  ) {
    return "Email hoặc mật khẩu không đúng. Vui lòng kiểm tra lại và thử lại.";
  }

  if (normalized.includes("email not confirmed")) {
    return "Tài khoản này chưa xác nhận email. Vui lòng kiểm tra hộp thư trước khi đăng nhập.";
  }

  if (normalized.includes("fetch")) {
    return "Không thể kết nối tới Supabase. Vui lòng kiểm tra mạng hoặc cấu hình dự án.";
  }

  return "Đăng nhập không thành công. Vui lòng thử lại sau.";
}

export default function LoginPage() {
  const router = useRouter();
  const [isRedirecting, startTransition] = useTransition();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    router.prefetch("/dashboard");
  }, [router]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const supabase = getSupabaseBrowserClient();

    if (!supabase) {
      setError(
        "Thiếu cấu hình Supabase. Hãy điền NEXT_PUBLIC_SUPABASE_URL và NEXT_PUBLIC_SUPABASE_ANON_KEY trong frontend/.env.local."
      );
      return;
    }

    setIsSubmitting(true);

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    setIsSubmitting(false);

    if (signInError) {
      setError(getErrorMessage(signInError.message));
      return;
    }

    startTransition(() => {
      router.replace("/dashboard");
      router.refresh();
    });
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_right,_rgba(15,118,110,0.22),_transparent_26%),radial-gradient(circle_at_bottom_left,_rgba(234,179,8,0.18),_transparent_28%),linear-gradient(180deg,_#f8fafc_0%,_#eef2f7_100%)]">
      <div className="mx-auto grid min-h-screen w-full max-w-7xl items-center gap-8 px-4 py-8 lg:grid-cols-[1.1fr_0.9fr] lg:px-6">
        <section className="hidden min-h-[640px] flex-col justify-between rounded-[2rem] border border-white/60 bg-slate-950 p-8 text-slate-50 shadow-panel lg:flex">
          <div className="space-y-8">
            <div className="inline-flex w-fit items-center gap-3 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm text-slate-100">
              <Newspaper className="h-4 w-4" />
              Hệ thống nội bộ PR COR
            </div>

            <div className="space-y-4">
              <p className="font-mono text-sm uppercase tracking-[0.28em] text-teal-200">
                HĐ Báo chí PR COR
              </p>
              <h1 className="max-w-xl text-4xl font-semibold leading-tight">
                Quản trị hợp đồng đối tác báo chí gọn gàng, bảo mật và dễ vận hành.
              </h1>
              <p className="max-w-xl text-base leading-7 text-slate-300">
                Giao diện đăng nhập dành cho đội nội bộ, kết nối trực tiếp với
                Supabase Auth để dùng email và mật khẩu hiện có.
              </p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-4">
              <p className="text-sm font-semibold">Bảo mật rõ ràng</p>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                Đăng nhập bằng Supabase Auth, dễ mở rộng thêm role và session guard.
              </p>
            </div>
            <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-4">
              <p className="text-sm font-semibold">Triển khai gọn</p>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                Phù hợp cho team 1-10 người dùng với frontend trên Vercel.
              </p>
            </div>
            <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-4">
              <p className="text-sm font-semibold">Sẵn cho mở rộng</p>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                Có thể nối tiếp với dashboard, phân quyền và audit log sau bước này.
              </p>
            </div>
          </div>
        </section>

        <section className="flex items-center justify-center">
          <Card className="w-full max-w-md border-white/70 bg-white/92 shadow-panel backdrop-blur">
            <CardHeader className="space-y-5 pb-2 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Newspaper className="h-7 w-7" />
              </div>
              <div className="space-y-2">
                <p className="font-mono text-sm uppercase tracking-[0.24em] text-slate-500">
                  HĐ Báo chí PR COR
                </p>
                <CardTitle className="text-3xl text-slate-950">
                  Đăng nhập hệ thống
                </CardTitle>
                <CardDescription className="text-sm leading-6">
                  Đăng nhập bằng email và mật khẩu để truy cập khu vực quản trị hợp
                  đồng nội bộ.
                </CardDescription>
              </div>
            </CardHeader>

            <CardContent className="pt-4">
              <form className="space-y-4" onSubmit={handleSubmit}>
                <div className="space-y-2">
                  <label
                    htmlFor="email"
                    className="text-sm font-medium text-slate-700"
                  >
                    Email
                  </label>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <Input
                      id="email"
                      type="email"
                      autoComplete="email"
                      placeholder="ban@prcor.vn"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      className="pl-11"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="password"
                    className="text-sm font-medium text-slate-700"
                  >
                    Password
                  </label>
                  <div className="relative">
                    <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <Input
                      id="password"
                      type="password"
                      autoComplete="current-password"
                      placeholder="Nhập mật khẩu"
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      className="pl-11"
                      required
                    />
                  </div>
                </div>

                {error ? (
                  <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                    <p>{error}</p>
                  </div>
                ) : null}

                <Button
                  type="submit"
                  size="lg"
                  className="w-full"
                  disabled={isSubmitting || isRedirecting}
                >
                  {isSubmitting || isRedirecting ? "Đang đăng nhập..." : "Đăng nhập"}
                </Button>

                <p className="text-center text-sm leading-6 text-muted-foreground">
                  Sử dụng tài khoản Supabase Auth của bạn để truy cập dashboard.
                </p>
              </form>
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  );
}
