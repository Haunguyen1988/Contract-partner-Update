import { AppShell } from "@/components/app-shell";
import { PartnersHeaderAction } from "@/components/partners/partners-header-action";
import { PartnersPageView } from "@/components/partners/partners-page-view";

export default function PartnersPage() {
  return (
    <AppShell
      currentPath="/partners"
      title="Đối tác báo chí"
      description="Theo dõi danh sách đối tác, owner phụ trách và số hợp đồng active để ưu tiên xử lý đúng đầu mối."
      headerAside={<PartnersHeaderAction />}
    >
      <PartnersPageView />
    </AppShell>
  );
}
