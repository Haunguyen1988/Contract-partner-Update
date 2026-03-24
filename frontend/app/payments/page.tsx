import { AppShell } from "@/components/app-shell";
import { DataTableCard } from "@/components/data-table-card";
import { getDataset } from "@/lib/api";

export default async function PaymentsPage() {
  const payments = await getDataset("payments");

  return (
    <AppShell
      currentPath="/payments"
      title="Theo doi thanh toan"
      description="Trang mau cho bo phan van hanh theo doi dot thanh toan, trang thai doi soat va du lieu lien quan tu Supabase."
    >
      <DataTableCard
        title="Danh sach thanh toan"
        description="Nguon du lieu: bang payments qua FastAPI."
        dataset={payments}
      />
    </AppShell>
  );
}
