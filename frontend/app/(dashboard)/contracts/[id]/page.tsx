import Link from "next/link";
import { FileText } from "lucide-react";

import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function ContractDetailPage({
  params
}: {
  params: { id: string };
}) {
  return (
    <AppShell
      currentPath="/contracts"
      title="Chi tiết hợp đồng"
      description="Trang chi tiết cơ bản để hỗ trợ điều hướng từ bảng danh sách hợp đồng."
    >
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <FileText className="h-5 w-5 text-primary" />
            Hợp đồng: {params.id}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm leading-7 text-slate-600">
          <p>
            Trang chi tiết đã sẵn route để người dùng có thể mở từ danh sách hợp
            đồng. Nếu bạn muốn, mình có thể làm tiếp phần thông tin đầy đủ, lịch sử
            duyệt, phụ lục và thanh toán liên quan.
          </p>
          <Button asChild variant="outline">
            <Link href="/contracts">Quay lại danh sách</Link>
          </Button>
        </CardContent>
      </Card>
    </AppShell>
  );
}
