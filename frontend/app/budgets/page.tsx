import { AppShell } from "@/components/app-shell";
import { DataTableCard } from "@/components/data-table-card";
import { getDataset } from "@/lib/api";

export default async function BudgetsPage() {
  const budgets = await getDataset("budget_allocations");

  return (
    <AppShell
      currentPath="/budgets"
      title="Phan bo ngan sach"
      description="Trang mau de theo doi du lieu ngan sach theo hop dong hoac chien dich. Co the mo rong them canh bao vuot tran va lich su dieu chinh."
    >
      <DataTableCard
        title="Danh sach ngan sach"
        description="Nguon du lieu: bang budget_allocations qua FastAPI."
        dataset={budgets}
      />
    </AppShell>
  );
}
