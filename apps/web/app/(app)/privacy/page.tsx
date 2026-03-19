import { Card } from "@contract/ui";
import { PageHeader } from "../../../src/components/page-header";

export default function PrivacyPage() {
  return (
    <div className="container py-12 max-w-4xl mx-auto">
      <Card title="Chính sách bảo mật" eyebrow="Legal compliance">
        <div className="stack space-y-6">
          <PageHeader 
            title="Chính sách bảo mật thông tin" 
            description="Cập nhật lần cuối: 19/03/2026. Chúng tôi cam kết bảo vệ dữ liệu hợp đồng của đối tác." 
          />
          
          <section className="space-y-4 text-slate-400">
            <h3 className="text-xl font-semibold text-white">1. Thu thập thông tin</h3>
            <p>Chúng tôi thu thập các thông tin cần thiết để quản lý hợp đồng bao gồm: Tên pháp nhân, Mã số thuế, Thông tin người đại diện và các tệp tin hợp đồng đi kèm.</p>
            
            <h3 className="text-xl font-semibold text-white">2. Sử dụng thông tin</h3>
            <p>Dữ liệu chỉ được sử dụng cho mục đích: Theo dõi tiến độ hợp đồng, cảnh báo hết hạn, và quản lý ngân sách nội bộ của PR COR.</p>
            
            <h3 className="text-xl font-semibold text-white">3. Bảo mật dữ liệu</h3>
            <p>Tất cả dữ liệu được lưu trữ trên hạ tầng mã hóa của Supabase và chỉ những người dùng có quyền (ADMIN, FINANCE, PR_COR) mới có thể truy cập theo phân quyền Role-based Access Control (RBAC).</p>
            
            <h3 className="text-xl font-semibold text-white">4. Quyền của người dùng</h3>
            <p>Người dùng có quyền cập nhật thông tin đối tác và yêu cầu xóa dữ liệu nếu hợp đồng đã kết thúc và không còn giá trị pháp lý ràng buộc.</p>
          </section>
        </div>
      </Card>
    </div>
  );
}
