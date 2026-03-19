# Design Specifications: Tech/Modern (Linear/Stripe Inspired)

## 🎨 Color Palette & Theming
Giao diện sẽ sử dụng nền trắng/xám siêu nhạt (high contrast) kết hợp với các đường viền mỏng (subtle borders) và hiệu ứng bóng đổ sắc nét.

| Name | Hex | Usage |
|------|-----|-------|
| **Background (Base)** | `#fbfbfd` | Nền chính của ứng dụng (rất sáng) |
| **Surface (Card)** | `#ffffff` | Nền của Card, Panel, Modal |
| **Border/Line** | `#e5e7eb` | Đường kẻ phân cách, viền input (rất mỏng) |
| **Text Primary** | `#0f172a` | Tiêu đề, chữ chính (có độ tương phản cao, hơi thiên xanh thẳm) |
| **Text Muted** | `#64748b` | Chữ phụ, caption, label |
| **Accent Primary** | `#000000` | Nút chính, action quan trọng (Stripe/Linear style sử dụng đen tuyền cho nút bấm chính) |
| **Accent Hover** | `#334155` | Màu khi hover trên nút đen |
| **Danger** | `#ef4444` | Lỗi, xóa, cảnh báo nguy hiểm (|
| **Success** | `#10b981` | Thành công, active |

*Ghi chú: Linear sử dụng rất nhiều không gian trắng (whitespace) và chữ có màu sắc phân tầng rõ ràng (đen tuyền, xám đậm, xám nhạt).*

## 📝 Typography
Sử dụng Font Inter (hoặc các font sans-serif hệ thống hiện đại). Geometrics và crisp.

| Element | Font | Size | Weight | Line Height | Letter Spacing |
|---------|------|------|--------|-------------|----------------|
| **H1 (Hero)** | Inter | 32px | 600 (SemiBold)| 1.2 | -0.02em |
| **H2 (Page Title)**| Inter | 24px | 600 (SemiBold)| 1.3 | -0.01em |
| **H3 (Card Title)**| Inter | 16px | 600 (SemiBold)| 1.4 | 0 |
| **Body** | Inter | 14px | 400 (Regular) | 1.6 | 0 |
| **Label/Small** | Inter | 13px | 500 (Medium) | 1.5 | 0 |
| **Badge/Micro** | Inter | 12px | 500 (Medium) | 1.2 | 0.02em |

## 📐 Spacing System
Hệ thống khoảng cách chặt chẽ (tight layout) tạo cảm giác ứng dụng năng suất (productivity app).

| Name | Value | Usage |
|------|-------|-------|
| 2xs | 4px | Khoảng cách Icon và chữ |
| xs | 8px | Khoảng cách các trường form (field gap) |
| sm | 12px | Padding nhỏ (Button, Input) |
| md | 16px | Padding vừa (Card padding) |
| lg | 24px | Khoảng cách giữa các Section |
| xl | 32px | Khoảng cách lớn (Page header tới content) |
| 2xl | 48px | Padding tổng thể của trang (Page padding) |

## 🔲 Border Radius
Chuyển từ bo tròn lớn (radius-xl) sang bo tròn vừa phải, cứng cáp hơn (Tech/Modern).

| Name | Value | Usage |
|------|-------|-------|
| sm | 6px | Input, Badge, Item nhỏ |
| md | 8px | Button, Component vừa |
| lg | 12px | Card, Modal, Panel |

## 🌫️ Shadows & Effects
Bóng đổ (Shadow) thay vì mờ ảo (Glassmorphism) sẽ chuyển sang dạng sắc nét, nhiều lớp (multi-layered shadow) như Stripe.

| Name | Value | Usage |
|------|-------|-------|
| xs | `0 1px 2px rgba(0,0,0,0.05)` | Nút bấm phụ, viền input |
| sm | `0 1px 3px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06)` | Nút primary, Card tĩnh |
| md | `0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)` | Hover state |
| lg | `0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05)` | Dropdown, Modal |

## 🖼️ Component System (Dự kiến implementation)

1.  **Buttons:**
    *   **Primary:** Nền Đen (`#000`), chữ trắng, shadow-sm, không viền. Hover: Nền Xám đậm.
    *   **Secondary/Ghost:** Nền trong suốt hoặc `#f3f4f6`, viền `#e5e7eb`, chữ Đen. Hover: BG mờ đậm hơn.
2.  **Inputs/Selects:**
    *   Nền `#ffffff`, viền `#e5e7eb`, bo góc 6px.
    *   Khi focus: Viền `#000`, hiện outline mỏng màu xám nhạt (`ring`), không dùng glow xanh.
3.  **Cards & Panels:**
    *   Nền trắng hoàn toàn, viền mỏng (`1px solid #e5e7eb`), shadow nhỏ giọt cực nhẹ (`shadow-sm`).
    *   Gỡ bỏ hiệu ứng backdrop-blur và gradient.
4.  **Sidebar/Navigation:**
    *   Background `#fbfbfd`. Border right `#e5e7eb`.
    *   Item: Muted text, khi active/hover chuyển background sang `#f1f5f9` và chữ Đen.

---
**Hướng đi tiếp theo**: Áp dụng các rules này vào `globals.css` và `layout`, sau đó là các screens.
