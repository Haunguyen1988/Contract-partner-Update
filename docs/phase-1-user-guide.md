# Phase 1 User Guide

## Đăng nhập

- Mở web app và đăng nhập bằng tài khoản nội bộ.
- Vai trò quyết định các module hiển thị và các hành động được phép gọi qua API.

## Quy trình vận hành chính

1. Tạo hoặc chuẩn hóa đối tác trong `Đối tác`.
2. Tạo budget allocation theo `owner + fiscal year + campaign` trong `Ngân sách`.
3. Tạo hợp đồng ở trạng thái `DRAFT` trong `Hợp đồng`.
4. Upload ít nhất một tài liệu `MAIN_CONTRACT`.
5. Kích hoạt hợp đồng khi dữ liệu đầy đủ.
6. Theo dõi cảnh báo và dashboard để xử lý hợp đồng sắp hết hạn.

## Quy tắc MVP cần nhớ

- Không xóa cứng dữ liệu nghiệp vụ, chỉ archive.
- Hợp đồng thiếu tài liệu chính sẽ không được activate.
- Budget overrun sẽ `WARN` hoặc `BLOCK` theo cấu hình.
- CSV import hiện tại là bước validate dữ liệu, chưa phải import chính thức.

