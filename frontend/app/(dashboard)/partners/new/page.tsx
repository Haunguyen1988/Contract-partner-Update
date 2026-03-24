import { AppShell } from "@/components/app-shell";
import { PartnerForm } from "@/components/partners/partner-form";

export default function NewPartnerPage() {
  return (
    <AppShell
      currentPath="/partners"
      title="Thêm đối tác"
      description="Tạo mới hồ sơ đối tác báo chí, gán owner phụ trách và lưu thông tin liên hệ để đồng bộ vận hành."
    >
      <PartnerForm mode="create" />
    </AppShell>
  );
}
