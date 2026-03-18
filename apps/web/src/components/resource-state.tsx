"use client";

import { Badge } from "@contract/ui";
import type { ResourceSource } from "../lib/api";

interface ResourceStateProps {
  source: ResourceSource;
  label: string;
  error?: string | null;
}

const stateCopy: Record<Exclude<ResourceSource, "api">, { eyebrow: string; title: string; description: string; tone: "neutral" | "warning" | "critical" }> = {
  loading: {
    eyebrow: "Đang đồng bộ",
    title: "Đang tải dữ liệu mới nhất",
    description: "Hệ thống đang gọi API để lấy dữ liệu thật từ môi trường Supabase hiện tại.",
    tone: "neutral"
  },
  fallback: {
    eyebrow: "Dữ liệu mẫu",
    title: "Màn hình đang dùng dữ liệu demo",
    description: "API chưa phản hồi nên ứng dụng đang hiển thị dữ liệu mẫu vì chế độ fallback đã được bật rõ ràng.",
    tone: "warning"
  },
  unavailable: {
    eyebrow: "Lỗi kết nối",
    title: "Không thể lấy dữ liệu từ API",
    description: "Kiểm tra NEXT_PUBLIC_API_URL, tiến trình Nest API, và phiên đăng nhập trước khi tiếp tục thao tác.",
    tone: "critical"
  }
};

export function ResourceState({ source, label, error }: ResourceStateProps) {
  if (source === "api") {
    return null;
  }

  const copy = stateCopy[source];

  return (
    <div className="panel resource-state" data-tone={copy.tone}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 16, alignItems: "flex-start" }}>
        <div>
          <p className="muted" style={{ margin: 0, textTransform: "uppercase", letterSpacing: "0.08em", fontSize: 12 }}>
            {copy.eyebrow}
          </p>
          <h3 style={{ margin: "6px 0 8px", fontSize: 20 }}>{copy.title}</h3>
          <p style={{ margin: 0 }}>{copy.description}</p>
          <p className="muted" style={{ margin: "8px 0 0" }}>
            Phạm vi: <strong>{label}</strong>
          </p>
          {error ? <p style={{ margin: "8px 0 0" }}>Chi tiết: {error}</p> : null}
        </div>
        <Badge tone={copy.tone}>{source.toUpperCase()}</Badge>
      </div>
    </div>
  );
}
