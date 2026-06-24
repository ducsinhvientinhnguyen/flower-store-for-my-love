# Flower Store — Project Guide

Web app quản lý cửa hàng hoa (bán hoa theo bó). Truy cập từ mọi nơi qua trình duyệt.

## Links

- **Production:** https://flower-store-for-my-love.vercel.app
- **GitHub:** https://github.com/ducsinhvientinhnguyen/flower-store-for-my-love (branch: `master`)
- **Database:** Neon PostgreSQL — `ep-odd-dew-atxmetgf.c-9.us-east-1.aws.neon.tech`
- **Seed account:** `admin@flowerstore.com` / `admin123` / role: OWNER

## Commands

Chạy từ thư mục gốc của project:

```bash
npm run dev          # Dev server: frontend :3000 + API :3001 (chạy song song)
npm run build        # Production build → /dist
npm test             # Vitest (frontend tests)
npm run test:api     # Jest (API tests)
npm run db:migrate   # Prisma migrate dev
npm run db:seed      # Tạo tài khoản admin seed
```

## Tech Stack

| Layer | Công nghệ |
|---|---|
| Frontend | React 18 + Vite |
| Backend | Express 5 + Node.js (Vercel Serverless) |
| Database | PostgreSQL trên Neon |
| ORM | Prisma 5.22.0 |
| Auth | JWT (accessToken 15 phút + refreshToken 7 ngày, httpOnly cookie) |
| State | Zustand |
| Data fetching | TanStack Query |
| Styling | Tailwind CSS v3 dark theme |
| Charts | Recharts |

## Architecture

```
/
├── src/                  # React frontend
│   ├── pages/            # LoginPage, POSPage, InventoryPage, ...
│   ├── components/       # Layout.jsx (sidebar + bottom nav)
│   ├── store/            # authStore.js (Zustand)
│   └── lib/              # api.js (fetch wrapper, auto-refresh)
├── api/                  # Express backend (Vercel Serverless)
│   ├── index.js          # Express app entry (module.exports = app)
│   ├── dev-server.js     # Local dev server (port 3001)
│   ├── routes/           # auth.js
│   └── middleware/       # authenticate.js, authorize.js
├── prisma/
│   ├── schema.prisma     # 9 models, 6 enums
│   ├── seed.js           # Tạo owner account
│   └── migrations/       # SQL migration files
├── vercel.json           # Build config + rewrites
└── package.json          # Không có "type" field (quan trọng!)
```

## Critical Config — KHÔNG được thay đổi

### package.json
- **Không có `"type"` field** — `.js` files mặc định là CJS; API dùng `require()`. Vite/Tailwind/PostCSS configs dùng extension `.mjs` để là ESM.

### Prisma
- Pinned tại **5.22.0** (KHÔNG dùng v7 — v7 đổi sang `prisma.config.ts`, bỏ `url` trong datasource)
- `binaryTargets = ["native", "rhel-openssl-3.0.x"]` trong schema — cần cho Vercel Linux runtime
- `vercel.json` buildCommand: `npx prisma generate && vite build`

### Tailwind
- Pinned tại **v3.4.x** (KHÔNG dùng v4 — v4 đổi PostCSS plugin path và format config)

### Vercel
- `vercel.json` có 2 rewrites: `/api/(.*)` → `/api/index` và `/(.*)` → `/index.html` (SPA fallback)
- `DATABASE_URL` trong Vercel dashboard có thêm `&connection_limit=1` ở cuối

### Tests
- Frontend: **Vitest** (`npm test`), include: `src/**/*.test.{js,jsx}`
- API: **Jest** (`npm run test:api`), match: `api/__tests__/**/*.test.js`
- Hai test runner riêng biệt — không trộn lẫn

## Database Schema (9 models)

`User` · `Customer` · `FlowerType` · `Product` · `Order` · `OrderItem` · `PreOrder` · `InventoryTransaction` · `Expense`

Mọi mutation đều có `createdById` → audit trail đầy đủ.

## Auth Flow

1. POST `/api/auth/login` → trả `accessToken` (15 phút) + set `refreshToken` cookie (7 ngày, httpOnly)
2. Client giữ `accessToken` trong Zustand memory
3. Mỗi request: `Authorization: Bearer <accessToken>`
4. Hết hạn → `api.js` tự gọi POST `/api/auth/refresh` → cấp token mới
5. Roles: `OWNER` (toàn quyền) vs `STAFF` (giới hạn)

## Navigation / Roles

| Tab | OWNER | STAFF |
|---|:---:|:---:|
| 🛒 Bán hàng | ✅ | ✅ |
| 📦 Kho | ✅ | ✅ |
| 📅 Đặt trước | ✅ | ✅ |
| 🧑 Khách hàng | ✅ | ✅ |
| 📊 Báo cáo | ✅ | ❌ |
| 💸 Sổ quỹ | ✅ | ❌ |

## Implementation Progress

### Plan 1: Foundation ✅ HOÀN THÀNH
- [x] Project init (Vite + React + Tailwind + Express + Prisma)
- [x] Prisma schema (9 models)
- [x] Express auth API (login/refresh/logout) + 6 Jest tests
- [x] Seed script
- [x] Zustand auth store + API client (auto-refresh)
- [x] Login page + 4 Vitest tests
- [x] App shell: Layout (responsive sidebar/bottom nav) + 6 placeholder pages
- [x] Deploy lên Vercel + Neon

### Design System + Landing Page ✅ HOÀN THÀNH
Re-skin toàn app theo "Cream Editorial" + landing page công khai.
- [x] Design tokens Tailwind (cream/charcoal/gold + font Libre Baskerville/Inter)
- [x] Framer Motion (`motion` v12): FadeInView, ParallaxLayer, PageTransition + 3 Vitest tests
- [x] API công khai `GET /api/products/featured` (không cần auth, tối đa 6) + 2 Jest tests
- [x] Seed 6 sản phẩm mẫu (ảnh Unsplash) — **cần chạy `npm run db:seed` trên production**
- [x] Landing page tại `/` (hero parallax, câu chuyện, lưới sản phẩm nổi bật, footer) + 2 Vitest tests
- [x] Chuyển app quản lý sang `/app/*`, restyle Layout + 6 trang + LoginPage; redirect sau login → `/app` + cập nhật App routing tests
- [x] Verify: frontend 11/11, API 8/8, build OK — merge vào `master`

> **Lưu ý route:** App quản lý giờ nằm dưới `/app/*` (không còn ở `/`). `/` là landing page công khai.

### Plan 2: POS Module ⏳ CHƯA BẮT ĐẦU
Màn hình bán hàng: lưới sản phẩm + giỏ hàng + modal bó custom + thanh toán + trừ kho.

### Plan 3: Inventory ⏳ CHƯA BẮT ĐẦU
Quản lý kho hoa: tồn kho, nhập hàng, lịch sử giao dịch.

### Plan 4: Customers + Pre-orders ⏳ CHƯA BẮT ĐẦU
Danh sách khách hàng, hồ sơ, đặt hàng trước / đặt cọc.

### Plan 5: Reports + Expenses ⏳ CHƯA BẮT ĐẦU
Báo cáo doanh thu (Recharts), sổ quỹ / chi phí (owner only).

## Design Docs

- Spec: `docs/superpowers/specs/2026-06-13-flower-store-design.md`
- Plan 1: `docs/superpowers/plans/2026-06-13-foundation.md`
- Spec (Design System + Landing): `docs/superpowers/specs/2026-06-18-design-system-landing-design.md`
- Plan (Design System + Landing): `docs/superpowers/plans/2026-06-18-design-system-landing.md`
