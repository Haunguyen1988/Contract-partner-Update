import { AppShell } from "@/components/app-shell";
import { PartnerDetailView } from "@/components/partners/partner-detail-view";
import { getPartnerDetail } from "@/lib/api";

export default async function PartnerDetailPage({
  params
}: {
  params: { id: string };
}) {
  const detail = await getPartnerDetail(params.id);

  return (
    <AppShell
      currentPath="/partners"
      title={detail.item.name}
      description="Chi tiết đối tác, hợp đồng liên quan và lịch sử thay đổi để team theo dõi đầy đủ trong một màn hình."
    >
      <PartnerDetailView detail={detail} />
    </AppShell>
  );
}
