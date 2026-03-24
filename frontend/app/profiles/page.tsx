import { AppShell } from "@/components/app-shell";
import { DataTableCard } from "@/components/data-table-card";
import { getDataset } from "@/lib/api";

export default async function ProfilesPage() {
  const profiles = await getDataset("profiles");

  return (
    <AppShell
      currentPath="/profiles"
      title="Quan ly nguoi dung"
      description="Trang mau de xem du lieu bang profiles, phu hop cho buoc tiep theo neu ban can role management hoac phan quyen noi bo."
    >
      <DataTableCard
        title="Danh sach nguoi dung"
        description="Nguon du lieu: bang profiles qua FastAPI."
        dataset={profiles}
      />
    </AppShell>
  );
}
