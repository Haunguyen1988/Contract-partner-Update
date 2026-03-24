import { BarChart3 } from "lucide-react";

import { AppShell } from "@/components/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function ReportsPage() {
  return (
    <AppShell
      currentPath="/reports"
      title="Bao cao"
      description="Khu vuc placeholder cho bo report tong hop. Co the bo sung bieu do, file export va dashboard theo phong ban o buoc tiep theo."
    >
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <BarChart3 className="h-5 w-5 text-primary" />
            Bao cao tong hop
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm leading-7 text-slate-600">
          Trang Bao cao da duoc tao de menu dashboard khong bi dut. Neu ban muon,
          minh co the lam tiep bo loc theo thang, xuat Excel va chart theo owner.
        </CardContent>
      </Card>
    </AppShell>
  );
}
