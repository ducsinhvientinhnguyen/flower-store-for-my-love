# Flower Store — Web App Design Spec

**Date:** 2026-06-13
**Status:** Approved

---

## 1. Tổng quan

Web app quản lý toàn bộ hoạt động kinh doanh của một cửa hàng hoa bán lẻ (chủ yếu bán hoa theo bó). Truy cập được từ mọi nơi qua trình duyệt, hỗ trợ đầy đủ trên desktop, tablet, và mobile.

**Người dùng:** Chủ cửa hàng (owner) + nhiều nhân viên theo ca (staff). Cần phân quyền chi tiết và audit trail (biết ai làm gì, lúc nào).

---

## 2. Tech Stack

| Layer | Công nghệ | Host |
|---|---|---|
| Frontend | React 18 + Vite | Vercel (CDN, free) |
| Backend | Express 4 + Node.js | Vercel Serverless Functions |
| Database | PostgreSQL | Neon (serverless Postgres, free tier) |
| ORM | Prisma | — |
| Auth | JWT (accessToken 15 phút + refreshToken 7 ngày) | — |
| State | Zustand | — |
| Data fetching | TanStack Query | — |
| Styling | Tailwind CSS (dark theme) | — |
| Charts | Recharts | — |

**Lý do chọn stack này:** Phù hợp kinh nghiệm React + Node.js của team; deploy miễn phí toàn bộ trên Vercel + Neon; Prisma giúp an toàn khi thao tác DB.

---

## 3. Cấu trúc thư mục

```
flower-store/
├── src/                        # React frontend
│   ├── pages/                  # POS, Inventory, Orders, Customers, Reports, Expenses
│   ├── components/             # UI components dùng chung
│   ├── hooks/                  # Custom React hooks
│   ├── lib/                    # API client (fetch wrappers)
│   └── store/                  # Zustand stores
├── api/                        # Express backend (Vercel Serverless)
│   ├── routes/                 # orders, products, inventory, customers, pre-orders, expenses, reports, auth
│   ├── middleware/             # authenticate, authorize
│   └── index.js                # Express app entry
├── prisma/
│   └── schema.prisma           # Database schema
├── vercel.json                 # Rewrite rules: /api/* → serverless
└── package.json
```

---

## 4. Database Schema

### 4.1 Bảng chính

**users** — tài khoản nhân viên
```
id uuid PK | name | email UNIQUE | password_hash | role (owner|staff) | is_active | created_at
```

**customers** — khách hàng quen
```
id uuid PK | name | phone | email | notes | created_at
```

**flower_types** — các loại hoa trong kho
```
id uuid PK | name | unit (bông|cành|kg) | cost_per_unit | current_stock | min_stock_alert | updated_at
```

**products** — sản phẩm bán (bó hoa cố định + custom)
```
id uuid PK | name | category | base_price | image_url | is_custom (bool) | is_active
```

**orders** — đơn hàng POS
```
id uuid PK | customer_id FK nullable | created_by FK→users | status (completed|cancelled) | total_amount | payment_method (cash|transfer) | note | created_at
```

**order_items** — chi tiết từng item trong đơn
```
id uuid PK | order_id FK | product_id FK nullable | name | quantity | unit_price | subtotal | custom_details jsonb
```
> `custom_details` lưu JSON cho bó custom: `{ flowers: [{flower_type_id, quantity}], note }`.

**pre_orders** — đặt hàng trước / đặt cọc
```
id uuid PK | customer_id FK | created_by FK→users | title | description | required_date | deposit_amount | total_amount | status (pending|confirmed|ready|delivered|cancelled) | note | created_at
```

**inventory_transactions** — lịch sử nhập/xuất kho
```
id uuid PK | flower_type_id FK | created_by FK→users | type (in|out|adjust) | quantity | note | created_at
```

**expenses** — chi phí / sổ quỹ
```
id uuid PK | created_by FK→users | category (nhập_hàng|lương|điện_nước|khác) | amount | description | expense_date | created_at
```

### 4.2 Quan hệ quan trọng
- Mọi bảng mutation đều có `created_by` → audit trail đầy đủ.
- Khi POS hoàn thành đơn, handler `POST /api/orders` dùng Prisma transaction: tạo order + order_items + trừ `flower_types.current_stock` trong một atomic operation.
- Khi nhập kho (`POST /api/inventory/transactions` type `in`), handler tăng `current_stock` và tự động tạo `expenses` type `nhập_hàng` trong cùng transaction.
- Khi điều chỉnh kho (`type = adjust`), không tạo expense.

---

## 5. Auth & Phân quyền

### 5.1 JWT Flow
1. `POST /api/auth/login` với `{ email, password }`
2. Server verify bcrypt hash → tạo `accessToken` (15 phút) + `refreshToken` (7 ngày)
3. Client giữ `accessToken` trong memory; `refreshToken` trong httpOnly cookie
4. Mỗi request đính kèm `Authorization: Bearer <accessToken>`
5. `POST /api/auth/refresh` → cấp `accessToken` mới khi hết hạn

### 5.2 Roles

| Quyền | owner | staff |
|---|:---:|:---:|
| Tạo đơn POS | ✅ | ✅ |
| Nhập kho | ✅ | ✅ |
| Tạo/xem đặt hàng trước | ✅ | ✅ |
| Tìm kiếm / tạo khách hàng | ✅ | ✅ |
| Xem báo cáo doanh thu | ✅ | ❌ |
| Xem/ghi sổ quỹ | ✅ | ❌ |
| Quản lý sản phẩm & giá | ✅ | ❌ |
| Quản lý nhân viên | ✅ | ❌ |
| Xóa/hủy đơn hàng cũ | ✅ | ❌ |

### 5.3 Middleware pattern
```js
router.get('/reports/daily', authenticate, authorize('owner'), handler)
router.post('/orders',       authenticate, authorize('owner', 'staff'), handler)
```

---

## 6. Module Design

### 6.1 POS — Bán hàng
**Màn hình:** 2 cột — trái: lưới sản phẩm, phải: giỏ hàng.

- **Thêm sản phẩm cố định:** tap/click → vào giỏ ngay.
- **Bó custom:** mở modal → chọn loại hoa + số lượng + giá → thêm vào giỏ.
- **Giỏ hàng:** chỉnh số lượng, xóa item, thêm ghi chú đơn hàng.
- **Gắn khách:** autocomplete tìm khách quen trước khi checkout (optional).
- **Thanh toán:** chọn tiền mặt / chuyển khoản → xác nhận → service tạo order + trừ kho.
- **In bill:** tạo HTML receipt → `window.print()`.

**API:** `POST /api/orders` (tạo order + items + trừ kho trong transaction).

### 6.2 Kho — Quản lý nguyên liệu
- **Tổng quan:** bảng các loại hoa, tồn kho hiện tại. Badge cảnh báo đỏ khi dưới `min_stock_alert`.
- **Nhập kho sáng:** form nhanh — chọn loại hoa → nhập số lượng → lưu → tự tạo expense `nhập_hàng`.
- **Lịch sử:** tất cả giao dịch in/out/adjust, lọc theo ngày.
- **Quản lý loại hoa:** thêm/sửa/xóa, đặt ngưỡng cảnh báo.

**API:** `GET /api/inventory`, `POST /api/inventory/transactions`, `GET /api/inventory/transactions`.

### 6.3 Khách hàng
- **Danh sách:** tìm theo tên / SĐT, hiển thị tổng đơn + lần cuối mua.
- **Hồ sơ:** lịch sử toàn bộ orders + pre-orders + tổng chi tiêu.
- **Ghi chú sở thích:** free-text, hiển thị khi tra cứu ở POS.

**API:** `GET /api/customers`, `POST /api/customers`, `GET /api/customers/:id`, `PATCH /api/customers/:id`.

### 6.4 Đặt hàng trước
- **Danh sách:** filter theo status, highlight đơn cần giao trong 24h tới (badge trên nav).
- **Tạo đơn:** gắn khách, mô tả bó hoa, ngày giao, tiền cọc, tổng tiền dự kiến.
- **Trạng thái:** `pending → confirmed → ready → delivered` (cancelled bất kỳ lúc).
- **Hoàn thành giao:** khi `delivered` → tạo order POS cho phần thanh toán còn lại.

**API:** `GET /api/pre-orders`, `POST /api/pre-orders`, `PATCH /api/pre-orders/:id/status`.

### 6.5 Báo cáo *(owner only)*
- **Tổng quan hôm nay:** doanh thu, số đơn, trung bình đơn — card header.
- **Biểu đồ đường:** doanh thu 7 / 30 ngày qua (Recharts).
- **Top sản phẩm:** bảng sản phẩm bán chạy, lọc theo tuần / tháng.
- **So sánh tháng:** tháng này vs tháng trước (+/- %).
- **Lọc tùy chỉnh:** date range picker.
- **Xuất CSV:** export đơn giản cho kế toán.

**API:** `GET /api/reports/summary?from=&to=`, `GET /api/reports/top-products`.

### 6.6 Sổ quỹ / Chi phí *(owner only)*
- **Nhập chi phí:** category (nhập_hàng / lương / điện_nước / khác), số tiền, ghi chú, ngày.
- **Danh sách:** lọc theo tháng, category.
- **Tóm tắt tháng:** tổng chi phí vs tổng doanh thu → lợi nhuận ước tính.
- **Tích hợp kho:** nhập hàng tự tạo expense type `nhập_hàng`.

**API:** `GET /api/expenses`, `POST /api/expenses`, `GET /api/expenses/summary`.

---

## 7. UI/UX

### 7.1 Layout
- **Desktop (≥768px):** Sidebar cố định bên trái (120px) + header top bar + main content.
- **Mobile/Tablet (<768px):** Bottom navigation bar 5 tab + header mini.
- **POS trên tablet:** 2 cột full height, nút lớn dễ tap.

### 7.2 Theme
- **Màu sắc:** Dark theme.
  - Background: `#0f172a` / `#1e293b`
  - Primary (action): `#6366f1` (Indigo)
  - Success/Confirm: `#10b981` (Emerald)
  - Warning: `#f59e0b` (Amber)
  - Danger: `#ef4444` (Red)
- **Font:** System UI stack (Inter nếu có).
- **Border radius:** 8px cho card, 6px cho button.

### 7.3 Navigation items
| Icon | Label | Role |
|---|---|---|
| 🛒 | Bán hàng | staff + owner |
| 📦 | Kho | staff + owner |
| 📅 | Đặt trước | staff + owner |
| 🧑 | Khách hàng | staff + owner |
| 📊 | Báo cáo | owner only |
| 💸 | Sổ quỹ | owner only |

> Trên mobile: bottom nav chỉ hiển thị 4 tab + "Thêm" (⋯) để ẩn các item theo role.

---

## 8. API Summary

| Method | Endpoint | Auth | Mô tả |
|---|---|---|---|
| POST | /api/auth/login | public | Đăng nhập |
| POST | /api/auth/refresh | cookie | Refresh token |
| GET | /api/products | authenticated | Danh sách sản phẩm |
| POST | /api/orders | authenticated | Tạo đơn POS (atomic: order + items + trừ kho) |
| GET | /api/orders | authenticated | Lịch sử đơn hàng |
| GET | /api/inventory | authenticated | Tồn kho |
| POST | /api/inventory/transactions | authenticated | Nhập/xuất kho (atomic: transaction + cập nhật stock + tạo expense nếu type=in) |
| GET | /api/customers | authenticated | Danh sách khách |
| POST | /api/customers | authenticated | Tạo khách mới |
| GET | /api/customers/:id | authenticated | Hồ sơ khách |
| GET | /api/pre-orders | authenticated | Đặt hàng trước |
| POST | /api/pre-orders | authenticated | Tạo đặt hàng |
| PATCH | /api/pre-orders/:id/status | authenticated | Cập nhật trạng thái |
| GET | /api/reports/summary | owner | Tổng quan doanh thu |
| GET | /api/reports/top-products | owner | Sản phẩm bán chạy |
| GET | /api/expenses | owner | Danh sách chi phí |
| POST | /api/expenses | owner | Ghi chi phí |
| GET | /api/expenses/summary | owner | Tóm tắt tháng |
| GET | /api/users | owner | Quản lý nhân viên |
| POST | /api/users | owner | Thêm nhân viên |

---

## 9. Deployment

```
GitHub repo
  ├── push to main
  └── Vercel auto-deploy
        ├── /src → React SPA (CDN)
        └── /api → Serverless Functions (Express)

Neon PostgreSQL
  └── DATABASE_URL env var → Prisma connects
```

**Environment variables cần thiết:**
- `DATABASE_URL` — Neon connection string
- `JWT_SECRET` — secret cho accessToken
- `JWT_REFRESH_SECRET` — secret cho refreshToken

---

## 10. Out of Scope (v1)

- Quản lý ca làm / chấm công nhân viên
- Push notification (nhắc đơn đặt trước)
- Tích hợp thanh toán online (VNPay, Momo)
- App mobile native
- Multi-branch (nhiều cơ sở)
