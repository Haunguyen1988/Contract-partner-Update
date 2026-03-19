import { Card } from "@contract/ui";
import { PageHeader } from "../../../src/components/page-header";

export default function TermsPage() {
  return (
    <div className="container py-12 max-w-4xl mx-auto">
      <Card title="Điều khoản dịch vụ" eyebrow="Legal compliance">
        <div className="stack space-y-6">
          <PageHeader 
            title="Điều khoản sử dụng hệ thống" 
            description="Bằng việc truy cập hệ thống Contract Management MVP, bạn đồng ý với các điều khoản dưới đây." 
          />
          
          <section className="space-y-4 text-slate-400">
            <h3 className="text-xl font-semibold text-white">1. Mục đích sử dụng</h3>
            <p>Hệ thống này chỉ dành cho mục đích quản lý hợp đồng đối tác truyền thống của bộ phận PR COR. Nghiêm cấm sử dụng cho mục đích cá nhân hoặc tiết lộ thông tin ra bên ngoài.</p>
            
            <h3 className="text-xl font-semibold text-white">2. Trách nhiệm người dùng</h3>
            <p>Mỗi nhân viên chịu trách nhiệm bảo mật tài khoản của mình. Không chia sẻ mật khẩu hoặc quyền truy cập cho người khác.</p>
            
            <h3 className="text-xl font-semibold text-white">3. Độ chính xác dữ liệu</h3>
            <p>Người nhập liệu có trách nhiệm đảm bảo tính chính xác của Legal Name và Tax Code của đối tác để tránh sai sót trong quá trình thanh toán và quyết toán.</p>
            
            <h3 className="text-xl font-semibold text-white">4. Thay đổi điều khoản</h3>
            <p>Chúng tôi có quyền cập nhật các điều khoản này để phù hợp với quy định vận hành của công ty tại từng thời điểm.</p>
          </section>
        </div>
      </Card>
    </div>
  );
}
