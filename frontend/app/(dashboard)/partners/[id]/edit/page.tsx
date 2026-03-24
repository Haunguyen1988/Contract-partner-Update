import { AppShell } from "@/components/app-shell";
import { PartnerForm } from "@/components/partners/partner-form";

export default function EditPartnerPage({
  params
}: {
  params: { id: string };
}) {
  return (
    <AppShell
      currentPath="/partners"
      title="Cập nhật đối tác"
      description="Chỉnh sửa thông tin đối tác, cập nhật owner và liên hệ để dữ liệu quản trị luôn chính xác."
    >
      <PartnerForm mode="edit" partnerId={params.id} />
    </AppShell>
  );
}
