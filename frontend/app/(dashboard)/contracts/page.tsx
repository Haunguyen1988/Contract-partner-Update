import { ContractsHeaderAction } from "@/components/contracts/contracts-header-action";
import { ContractsPageView } from "@/components/contracts/contracts-page-view";
import { AppShell } from "@/components/app-shell";

export default function ContractsPage() {
  return (
    <AppShell
      currentPath="/contracts"
      title="Hợp đồng"
      description="Quản lý danh sách hợp đồng đối tác báo chí, lọc theo trạng thái, owner và theo dõi hạn hiệu lực để xử lý đúng thời điểm."
      headerAside={<ContractsHeaderAction />}
    >
      <ContractsPageView />
    </AppShell>
  );
}
