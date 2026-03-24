import { AppShell } from "@/components/app-shell";
import { NewContractForm } from "@/components/contracts/new-contract-form";

export default function NewContractPage() {
  return (
    <AppShell
      currentPath="/contracts"
      title="Tạo HĐ mới"
      description="Tạo mới hợp đồng đối tác báo chí, upload file hợp đồng và lưu theo draft hoặc gửi duyệt ngay."
    >
      <NewContractForm />
    </AppShell>
  );
}
