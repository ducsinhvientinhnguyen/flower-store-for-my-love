# Flower Store — Plan 1: Foundation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Dựng nền tảng dự án — project setup, database schema, auth API, app shell với routing và navigation — kết thúc bằng một app deploy được lên Vercel với màn hình đăng nhập và navigation hoạt động đầy đủ.

**Architecture:** React 18 + Vite (frontend, deploy Vercel CDN) + Express 4 (backend, deploy Vercel Serverless via `/api` rewrite) + Prisma ORM + PostgreSQL trên Neon. Trong dev, Vite proxy `/api/*` sang Express chạy local `:3001`. Trên Vercel, `/api/*` đi thẳng vào serverless functions.

**Tech Stack:** React 18, Vite 5, React Router v6, Zustand, TanStack Query v5, Tailwind CSS v3, Express 4, Prisma 5, jsonwebtoken, bcryptjs, Vitest (frontend tests), Jest + Supertest (API tests)

---

> **Phạm vi 5 plans:**
> - **Plan 1 (này):** Foundation — setup, schema, auth, app shell
> - **Plan 2:** POS — products, cart, order creation
> - **Plan 3:** Inventory — flower types, stock transactions
> - **Plan 4:** Customers + Pre-orders
> - **Plan 5:** Reports + Expenses

---

## File Map

```
flower-store/
├── src/
│   ├── main.jsx                        # React entry
│   ├── App.jsx                         # Router + QueryClient setup
│   ├── pages/
│   │   ├── LoginPage.jsx               # Login form
│   │   ├── POSPage.jsx                 # Placeholder
│   │   ├── InventoryPage.jsx           # Placeholder
│   │   ├── PreOrdersPage.jsx           # Placeholder
│   │   ├── CustomersPage.jsx           # Placeholder
│   │   ├── ReportsPage.jsx             # Placeholder
│   │   └── ExpensesPage.jsx            # Placeholder
│   ├── components/
│   │   └── Layout.jsx                  # Sidebar (desktop) + BottomNav (mobile) + Outlet
│   ├── store/
│   │   └── authStore.js               # Zustand: { user, accessToken, setAuth, clearAuth }
│   └── lib/
│       └── api.js                      # fetch wrapper với auto-refresh token
├── api/
│   ├── index.js                        # Express app (export cho Vercel + dev server)
│   ├── dev-server.js                   # Chạy Express local :3001 khi dev
│   ├── middleware/
│   │   ├── authenticate.js             # Verify JWT → req.user
│   │   └── authorize.js               # Role check middleware factory
│   └── routes/
│       └── auth.js                     # POST /api/auth/login, POST /api/auth/refresh
├── prisma/
│   ├── schema.prisma                   # Toàn bộ schema (9 models)
│   └── seed.js                         # Tạo owner account đầu tiên
├── src/__tests__/
│   └── LoginPage.test.jsx              # Vitest: form submit, error state
├── api/__tests__/
│   └── auth.test.js                    # Jest + Supertest: login, refresh, 401/403
├── vercel.json                         # Rewrite /api/* → serverless
├── vite.config.js                      # Vite + proxy /api → :3001
├── tailwind.config.js
├── postcss.config.js
├── jest.config.js                      # Config cho API tests
├── .env.example
└── package.json
```

---

## Task 1: Project initialization

**Files:**
- Create: `package.json`
- Create: `vite.config.js`
- Create: `tailwind.config.js`
- Create: `postcss.config.js`
- Create: `jest.config.js`
- Create: `vercel.json`
- Create: `.env.example`
- Create: `src/main.jsx`

- [ ] **Step 1: Tạo thư mục và khởi tạo npm**

```bash
mkdir flower-store && cd flower-store
npm init -y
```

- [ ] **Step 2: Cài frontend dependencies**

```bash
npm install react@18 react-dom@18 react-router-dom@6 zustand @tanstack/react-query recharts dayjs
npm install -D vite @vitejs/plugin-react tailwindcss postcss autoprefixer vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom
```

- [ ] **Step 3: Cài backend dependencies**

```bash
npm install express cors cookie-parser jsonwebtoken bcryptjs zod @prisma/client dotenv
npm install -D prisma jest jest-environment-node supertest concurrently
```

- [ ] **Step 4: Tạo `package.json` scripts** (thay thế scripts section)

```json
{
  "scripts": {
    "dev": "concurrently \"vite --port 3000\" \"node api/dev-server.js\"",
    "build": "vite build",
    "preview": "vite preview",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:api": "jest --testPathPattern=api/__tests__",
    "db:migrate": "prisma migrate dev",
    "db:generate": "prisma generate",
    "db:seed": "node prisma/seed.js"
  }
}
```

- [ ] **Step 5: Tạo `vite.config.js`**

```js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      }
    }
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/__tests__/setup.js'],
  }
})
```

- [ ] **Step 6: Tạo `src/__tests__/setup.js`**

```js
import '@testing-library/jest-dom'
```

- [ ] **Step 7: Tạo `tailwind.config.js`**

```js
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {},
  },
  plugins: [],
}
```

- [ ] **Step 8: Tạo `postcss.config.js`**

```js
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
```

- [ ] **Step 9: Tạo `jest.config.js`**

```js
module.exports = {
  testEnvironment: 'node',
  testPathPattern: 'api/__tests__',
  clearMocks: true,
}
```

- [ ] **Step 10: Tạo `vercel.json`**

```json
{
  "rewrites": [
    { "source": "/api/(.*)", "destination": "/api/index" }
  ]
}
```

- [ ] **Step 11: Tạo `.env.example`**

```
DATABASE_URL=postgresql://user:password@host/dbname?sslmode=require
JWT_SECRET=change-me-to-a-long-random-string
JWT_REFRESH_SECRET=change-me-to-another-long-random-string
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
```

- [ ] **Step 12: Tạo `.env` từ `.env.example` và điền thông tin Neon + JWT secrets**

```bash
cp .env.example .env
# Mở .env và điền DATABASE_URL từ Neon dashboard
# Tạo JWT_SECRET ngẫu nhiên:
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

- [ ] **Step 13: Tạo `index.html`**

```html
<!DOCTYPE html>
<html lang="vi">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Flower Store</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
```

- [ ] **Step 14: Tạo `src/main.jsx`**

```jsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'
import App from './App'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
```

- [ ] **Step 15: Tạo `src/index.css`**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

- [ ] **Step 16: Commit**

```bash
git init
echo "node_modules\n.env\ndist\n.superpowers" > .gitignore
git add .
git commit -m "feat: project initialization — Vite + React + Express + Tailwind"
```

---

## Task 2: Prisma schema

**Files:**
- Create: `prisma/schema.prisma`

- [ ] **Step 1: Khởi tạo Prisma**

```bash
npx prisma init --datasource-provider postgresql
```

Lệnh này tạo `prisma/schema.prisma` và thêm `DATABASE_URL` vào `.env`.

- [ ] **Step 2: Thay toàn bộ nội dung `prisma/schema.prisma`**

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum Role {
  OWNER
  STAFF
}

enum OrderStatus {
  COMPLETED
  CANCELLED
}

enum PaymentMethod {
  CASH
  TRANSFER
}

enum PreOrderStatus {
  PENDING
  CONFIRMED
  READY
  DELIVERED
  CANCELLED
}

enum TransactionType {
  IN
  OUT
  ADJUST
}

enum ExpenseCategory {
  NHAP_HANG
  LUONG
  DIEN_NUOC
  KHAC
}

model User {
  id           String   @id @default(uuid())
  name         String
  email        String   @unique
  passwordHash String
  role         Role     @default(STAFF)
  isActive     Boolean  @default(true)
  createdAt    DateTime @default(now())

  orders                Order[]
  inventoryTransactions InventoryTransaction[]
  expenses              Expense[]
  preOrders             PreOrder[]
}

model Customer {
  id        String   @id @default(uuid())
  name      String
  phone     String
  email     String?
  notes     String?
  createdAt DateTime @default(now())

  orders    Order[]
  preOrders PreOrder[]
}

model FlowerType {
  id            String  @id @default(uuid())
  name          String
  unit          String
  costPerUnit   Decimal @db.Decimal(10, 2)
  currentStock  Decimal @db.Decimal(10, 2) @default(0)
  minStockAlert Decimal @db.Decimal(10, 2) @default(0)
  updatedAt     DateTime @updatedAt

  inventoryTransactions InventoryTransaction[]
}

model Product {
  id        String  @id @default(uuid())
  name      String
  category  String
  basePrice Decimal @db.Decimal(10, 2)
  imageUrl  String?
  isCustom  Boolean @default(false)
  isActive  Boolean @default(true)

  orderItems OrderItem[]
}

model Order {
  id            String        @id @default(uuid())
  customerId    String?
  createdById   String
  status        OrderStatus   @default(COMPLETED)
  totalAmount   Decimal       @db.Decimal(10, 2)
  paymentMethod PaymentMethod
  note          String?
  createdAt     DateTime      @default(now())

  customer  Customer?   @relation(fields: [customerId], references: [id])
  createdBy User        @relation(fields: [createdById], references: [id])
  items     OrderItem[]
}

model OrderItem {
  id            String   @id @default(uuid())
  orderId       String
  productId     String?
  name          String
  quantity      Int
  unitPrice     Decimal  @db.Decimal(10, 2)
  subtotal      Decimal  @db.Decimal(10, 2)
  customDetails Json?

  order   Order    @relation(fields: [orderId], references: [id])
  product Product? @relation(fields: [productId], references: [id])
}

model PreOrder {
  id            String         @id @default(uuid())
  customerId    String
  createdById   String
  title         String
  description   String?
  requiredDate  DateTime       @db.Date
  depositAmount Decimal        @db.Decimal(10, 2)
  totalAmount   Decimal        @db.Decimal(10, 2)
  status        PreOrderStatus @default(PENDING)
  note          String?
  createdAt     DateTime       @default(now())

  customer  Customer @relation(fields: [customerId], references: [id])
  createdBy User     @relation(fields: [createdById], references: [id])
}

model InventoryTransaction {
  id           String          @id @default(uuid())
  flowerTypeId String
  createdById  String
  type         TransactionType
  quantity     Decimal         @db.Decimal(10, 2)
  note         String?
  createdAt    DateTime        @default(now())

  flowerType FlowerType @relation(fields: [flowerTypeId], references: [id])
  createdBy  User       @relation(fields: [createdById], references: [id])
}

model Expense {
  id          String          @id @default(uuid())
  createdById String
  category    ExpenseCategory
  amount      Decimal         @db.Decimal(10, 2)
  description String?
  expenseDate DateTime        @db.Date
  createdAt   DateTime        @default(now())

  createdBy User @relation(fields: [createdById], references: [id])
}
```

- [ ] **Step 3: Chạy migration lần đầu**

Prisma CLI tự đọc `.env` — đảm bảo `DATABASE_URL` đã điền đúng trước khi chạy:

```bash
npx prisma migrate dev --name init
```

Expected output:
```
✔ Generated Prisma Client
The following migration(s) have been created and applied:
  migrations/20260613000000_init/migration.sql
```

- [ ] **Step 4: Generate Prisma client**

```bash
npx prisma generate
```

- [ ] **Step 5: Commit**

```bash
git add prisma/
git commit -m "feat: add Prisma schema with all 9 models"
```

---

## Task 3: Express app + Auth API

**Files:**
- Create: `api/index.js`
- Create: `api/dev-server.js`
- Create: `api/middleware/authenticate.js`
- Create: `api/middleware/authorize.js`
- Create: `api/routes/auth.js`
- Create: `api/__tests__/auth.test.js`

- [ ] **Step 1: Viết failing test trước**

Tạo `api/__tests__/auth.test.js`:

```js
const request = require('supertest')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')

process.env.JWT_SECRET = 'test-secret'
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret'
process.env.NODE_ENV = 'test'

// Mock Prisma
jest.mock('@prisma/client', () => {
  const mockFindUnique = jest.fn()
  return {
    PrismaClient: jest.fn().mockImplementation(() => ({
      user: { findUnique: mockFindUnique },
    })),
    _mockFindUnique: mockFindUnique,
  }
})

const { _mockFindUnique } = require('@prisma/client')
const app = require('../index')

describe('POST /api/auth/login', () => {
  const passwordHash = bcrypt.hashSync('password123', 10)
  const mockUser = {
    id: 'user-1',
    name: 'Chủ shop',
    email: 'owner@test.com',
    passwordHash,
    role: 'OWNER',
    isActive: true,
  }

  beforeEach(() => jest.clearAllMocks())

  it('trả về accessToken khi đúng credentials', async () => {
    _mockFindUnique.mockResolvedValue(mockUser)

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'owner@test.com', password: 'password123' })

    expect(res.status).toBe(200)
    expect(res.body.accessToken).toBeDefined()
    expect(res.body.user.role).toBe('OWNER')
    expect(res.body.user.passwordHash).toBeUndefined()
    expect(res.headers['set-cookie']).toBeDefined()
  })

  it('trả về 401 khi sai mật khẩu', async () => {
    _mockFindUnique.mockResolvedValue(mockUser)

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'owner@test.com', password: 'wrong' })

    expect(res.status).toBe(401)
  })

  it('trả về 401 khi email không tồn tại', async () => {
    _mockFindUnique.mockResolvedValue(null)

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'nobody@test.com', password: 'password123' })

    expect(res.status).toBe(401)
  })

  it('trả về 401 khi tài khoản bị vô hiệu hóa', async () => {
    _mockFindUnique.mockResolvedValue({ ...mockUser, isActive: false })

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'owner@test.com', password: 'password123' })

    expect(res.status).toBe(401)
  })
})

describe('POST /api/auth/refresh', () => {
  it('trả về accessToken mới khi có refreshToken hợp lệ', async () => {
    const refreshToken = jwt.sign({ id: 'user-1' }, 'test-refresh-secret', { expiresIn: '7d' })

    const res = await request(app)
      .post('/api/auth/refresh')
      .set('Cookie', `refreshToken=${refreshToken}`)

    expect(res.status).toBe(200)
    expect(res.body.accessToken).toBeDefined()
  })

  it('trả về 401 khi không có refreshToken', async () => {
    const res = await request(app).post('/api/auth/refresh')
    expect(res.status).toBe(401)
  })
})
```

- [ ] **Step 2: Chạy test để xác nhận FAIL**

```bash
npm run test:api
```

Expected: FAIL — `Cannot find module '../index'`

- [ ] **Step 3: Tạo `api/middleware/authenticate.js`**

```js
const jwt = require('jsonwebtoken')

module.exports = function authenticate(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1]
  if (!token) return res.status(401).json({ error: 'Token không hợp lệ' })

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET)
    next()
  } catch {
    res.status(401).json({ error: 'Token hết hạn hoặc không hợp lệ' })
  }
}
```

- [ ] **Step 4: Tạo `api/middleware/authorize.js`**

```js
module.exports = function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Không có quyền truy cập' })
    }
    next()
  }
}
```

- [ ] **Step 5: Tạo `api/routes/auth.js`**

```js
const router = require('express').Router()
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge: 7 * 24 * 60 * 60 * 1000,
}

router.post('/login', async (req, res) => {
  const { email, password } = req.body
  if (!email || !password) {
    return res.status(400).json({ error: 'Email và mật khẩu là bắt buộc' })
  }

  const user = await prisma.user.findUnique({ where: { email } })
  if (!user || !user.isActive) {
    return res.status(401).json({ error: 'Email hoặc mật khẩu không đúng' })
  }

  const valid = await bcrypt.compare(password, user.passwordHash)
  if (!valid) {
    return res.status(401).json({ error: 'Email hoặc mật khẩu không đúng' })
  }

  const accessToken = jwt.sign(
    { id: user.id, role: user.role, name: user.name },
    process.env.JWT_SECRET,
    { expiresIn: '15m' }
  )
  const refreshToken = jwt.sign(
    { id: user.id },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: '7d' }
  )

  res.cookie('refreshToken', refreshToken, COOKIE_OPTIONS)
  res.json({
    accessToken,
    user: { id: user.id, name: user.name, role: user.role },
  })
})

router.post('/refresh', (req, res) => {
  const token = req.cookies?.refreshToken
  if (!token) return res.status(401).json({ error: 'Không có refresh token' })

  try {
    const payload = jwt.verify(token, process.env.JWT_REFRESH_SECRET)
    const accessToken = jwt.sign(
      { id: payload.id },
      process.env.JWT_SECRET,
      { expiresIn: '15m' }
    )
    res.json({ accessToken })
  } catch {
    res.status(401).json({ error: 'Refresh token hết hạn' })
  }
})

router.post('/logout', (req, res) => {
  res.clearCookie('refreshToken', COOKIE_OPTIONS)
  res.json({ ok: true })
})

module.exports = router
```

- [ ] **Step 6: Tạo `api/index.js`**

```js
const express = require('express')
const cors = require('cors')
const cookieParser = require('cookie-parser')

const app = express()

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}))
app.use(express.json())
app.use(cookieParser())

app.use('/api/auth', require('./routes/auth'))

module.exports = app
```

- [ ] **Step 7: Tạo `api/dev-server.js`**

```js
require('dotenv').config()
const app = require('./index')
const port = process.env.API_PORT || 3001
app.listen(port, () => console.log(`API server running on http://localhost:${port}`))
```

- [ ] **Step 8: Chạy lại test để xác nhận PASS**

```bash
npm run test:api
```

Expected:
```
PASS  api/__tests__/auth.test.js
  POST /api/auth/login
    ✓ trả về accessToken khi đúng credentials
    ✓ trả về 401 khi sai mật khẩu
    ✓ trả về 401 khi email không tồn tại
    ✓ trả về 401 khi tài khoản bị vô hiệu hóa
  POST /api/auth/refresh
    ✓ trả về accessToken mới khi có refreshToken hợp lệ
    ✓ trả về 401 khi không có refreshToken

Test Suites: 1 passed
Tests:       6 passed
```

- [ ] **Step 9: Commit**

```bash
git add api/
git commit -m "feat: Express app with JWT auth — login, refresh, logout"
```

---

## Task 4: Seed script

**Files:**
- Create: `prisma/seed.js`

- [ ] **Step 1: Tạo `prisma/seed.js`**

```js
require('dotenv').config()
const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function main() {
  const passwordHash = await bcrypt.hash('admin123', 10)

  const owner = await prisma.user.upsert({
    where: { email: 'admin@flowerstore.com' },
    update: {},
    create: {
      name: 'Chủ shop',
      email: 'admin@flowerstore.com',
      passwordHash,
      role: 'OWNER',
    },
  })

  console.log('✅ Seed hoàn tất')
  console.log(`   Email:    admin@flowerstore.com`)
  console.log(`   Password: admin123`)
  console.log(`   Role:     OWNER`)
  console.log(`   ID:       ${owner.id}`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
```

- [ ] **Step 2: Thêm seed config vào `package.json`**

```json
{
  "prisma": {
    "seed": "node prisma/seed.js"
  }
}
```

- [ ] **Step 3: Chạy seed**

```bash
npm run db:seed
```

Expected:
```
✅ Seed hoàn tất
   Email:    admin@flowerstore.com
   Password: admin123
   Role:     OWNER
```

- [ ] **Step 4: Commit**

```bash
git add prisma/seed.js package.json
git commit -m "feat: seed script — tạo owner account đầu tiên"
```

---

## Task 5: Auth store + API client

**Files:**
- Create: `src/store/authStore.js`
- Create: `src/lib/api.js`

- [ ] **Step 1: Tạo `src/store/authStore.js`**

```js
import { create } from 'zustand'

export const useAuthStore = create((set, get) => ({
  user: null,
  accessToken: null,

  setAuth: (user, accessToken) => set({ user, accessToken }),

  clearAuth: () => {
    set({ user: null, accessToken: null })
    fetch('/api/auth/logout', { method: 'POST', credentials: 'include' })
  },

  getAccessToken: () => get().accessToken,
}))
```

- [ ] **Step 2: Tạo `src/lib/api.js`**

```js
import { useAuthStore } from '../store/authStore'

async function apiFetch(path, options = {}) {
  const token = useAuthStore.getState().getAccessToken()

  const res = await fetch(`/api${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
    credentials: 'include',
  })

  if (res.status === 401) {
    const refreshRes = await fetch('/api/auth/refresh', {
      method: 'POST',
      credentials: 'include',
    })

    if (refreshRes.ok) {
      const { accessToken: newToken } = await refreshRes.json()
      const { user } = useAuthStore.getState()
      useAuthStore.getState().setAuth(user, newToken)

      return fetch(`/api${path}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${newToken}`,
          ...options.headers,
        },
        credentials: 'include',
      })
    }

    useAuthStore.getState().clearAuth()
    window.location.href = '/login'
    return res
  }

  return res
}

export const api = {
  get: (path, options) => apiFetch(path, { method: 'GET', ...options }),
  post: (path, body) => apiFetch(path, { method: 'POST', body: JSON.stringify(body) }),
  patch: (path, body) => apiFetch(path, { method: 'PATCH', body: JSON.stringify(body) }),
  del: (path) => apiFetch(path, { method: 'DELETE' }),
}
```

- [ ] **Step 3: Commit**

```bash
git add src/store/ src/lib/
git commit -m "feat: Zustand auth store + API client với auto-refresh"
```

---

## Task 6: Login page

**Files:**
- Create: `src/pages/LoginPage.jsx`
- Create: `src/__tests__/LoginPage.test.jsx`

- [ ] **Step 1: Viết failing test**

Tạo `src/__tests__/LoginPage.test.jsx`:

```jsx
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { vi } from 'vitest'
import LoginPage from '../pages/LoginPage'

// Mock react-router navigate
const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return { ...actual, useNavigate: () => mockNavigate }
})

// Mock api
vi.mock('../lib/api', () => ({
  api: {
    post: vi.fn(),
  },
}))

import { api } from '../lib/api'

// Mock authStore
vi.mock('../store/authStore', () => ({
  useAuthStore: (selector) => selector({ setAuth: vi.fn() }),
}))

function renderLogin() {
  return render(
    <MemoryRouter>
      <LoginPage />
    </MemoryRouter>
  )
}

describe('LoginPage', () => {
  beforeEach(() => vi.clearAllMocks())

  it('hiển thị form đăng nhập', () => {
    renderLogin()
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/mật khẩu/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /đăng nhập/i })).toBeInTheDocument()
  })

  it('navigate về / sau khi đăng nhập thành công', async () => {
    api.post.mockResolvedValue({
      ok: true,
      json: async () => ({ accessToken: 'tok', user: { id: '1', name: 'A', role: 'OWNER' } }),
    })

    renderLogin()
    await userEvent.type(screen.getByLabelText(/email/i), 'owner@test.com')
    await userEvent.type(screen.getByLabelText(/mật khẩu/i), 'password123')
    await userEvent.click(screen.getByRole('button', { name: /đăng nhập/i }))

    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/'))
  })

  it('hiển thị lỗi khi credentials sai', async () => {
    api.post.mockResolvedValue({ ok: false })

    renderLogin()
    await userEvent.type(screen.getByLabelText(/email/i), 'owner@test.com')
    await userEvent.type(screen.getByLabelText(/mật khẩu/i), 'wrong')
    await userEvent.click(screen.getByRole('button', { name: /đăng nhập/i }))

    await waitFor(() =>
      expect(screen.getByText(/email hoặc mật khẩu không đúng/i)).toBeInTheDocument()
    )
  })
})
```

- [ ] **Step 2: Chạy test để xác nhận FAIL**

```bash
npm test
```

Expected: FAIL — `Cannot find module '../pages/LoginPage'`

- [ ] **Step 3: Tạo `src/pages/LoginPage.jsx`**

```jsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { api } from '../lib/api'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const setAuth = useAuthStore(s => s.setAuth)
  const navigate = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const res = await api.post('/auth/login', { email, password })
    if (res.ok) {
      const data = await res.json()
      setAuth(data.user, data.accessToken)
      navigate('/')
    } else {
      setError('Email hoặc mật khẩu không đúng')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center px-4">
      <div className="w-full max-w-sm bg-slate-800 rounded-xl p-8 shadow-xl">
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">🌸</div>
          <h1 className="text-2xl font-bold text-white">Flower Store</h1>
          <p className="text-slate-400 text-sm mt-1">Quản lý cửa hàng hoa</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm text-slate-400 mb-1">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full bg-slate-700 text-white rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder-slate-500"
              placeholder="admin@flowerstore.com"
              required
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm text-slate-400 mb-1">
              Mật khẩu
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full bg-slate-700 text-white rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>

          {error && (
            <p className="text-red-400 text-sm bg-red-400/10 rounded-lg px-3 py-2">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg px-4 py-2.5 font-medium transition-colors"
          >
            {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
          </button>
        </form>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Chạy test để xác nhận PASS**

```bash
npm test
```

Expected:
```
✓ src/__tests__/LoginPage.test.jsx (3)
  ✓ hiển thị form đăng nhập
  ✓ navigate về / sau khi đăng nhập thành công
  ✓ hiển thị lỗi khi credentials sai
```

- [ ] **Step 5: Commit**

```bash
git add src/pages/LoginPage.jsx src/__tests__/LoginPage.test.jsx
git commit -m "feat: login page với form validation và error state"
```

---

## Task 7: App shell — Layout + routing

**Files:**
- Create: `src/App.jsx`
- Create: `src/components/Layout.jsx`
- Create: `src/pages/POSPage.jsx`
- Create: `src/pages/InventoryPage.jsx`
- Create: `src/pages/PreOrdersPage.jsx`
- Create: `src/pages/CustomersPage.jsx`
- Create: `src/pages/ReportsPage.jsx`
- Create: `src/pages/ExpensesPage.jsx`

- [ ] **Step 1: Tạo 6 placeholder pages**

`src/pages/POSPage.jsx`:
```jsx
export default function POSPage() {
  return <div className="p-6 text-white"><h1 className="text-2xl font-bold">🛒 Bán hàng</h1><p className="text-slate-400 mt-2">Coming soon — Plan 2</p></div>
}
```

`src/pages/InventoryPage.jsx`:
```jsx
export default function InventoryPage() {
  return <div className="p-6 text-white"><h1 className="text-2xl font-bold">📦 Kho nguyên liệu</h1><p className="text-slate-400 mt-2">Coming soon — Plan 3</p></div>
}
```

`src/pages/PreOrdersPage.jsx`:
```jsx
export default function PreOrdersPage() {
  return <div className="p-6 text-white"><h1 className="text-2xl font-bold">📅 Đặt hàng trước</h1><p className="text-slate-400 mt-2">Coming soon — Plan 4</p></div>
}
```

`src/pages/CustomersPage.jsx`:
```jsx
export default function CustomersPage() {
  return <div className="p-6 text-white"><h1 className="text-2xl font-bold">🧑 Khách hàng</h1><p className="text-slate-400 mt-2">Coming soon — Plan 4</p></div>
}
```

`src/pages/ReportsPage.jsx`:
```jsx
export default function ReportsPage() {
  return <div className="p-6 text-white"><h1 className="text-2xl font-bold">📊 Báo cáo</h1><p className="text-slate-400 mt-2">Coming soon — Plan 5</p></div>
}
```

`src/pages/ExpensesPage.jsx`:
```jsx
export default function ExpensesPage() {
  return <div className="p-6 text-white"><h1 className="text-2xl font-bold">💸 Sổ quỹ</h1><p className="text-slate-400 mt-2">Coming soon — Plan 5</p></div>
}
```

- [ ] **Step 2: Tạo `src/components/Layout.jsx`**

```jsx
import { Link, useLocation, Outlet, Navigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'

const NAV_ITEMS = [
  { path: '/',            label: 'Bán hàng',   icon: '🛒', roles: ['OWNER', 'STAFF'] },
  { path: '/inventory',   label: 'Kho',        icon: '📦', roles: ['OWNER', 'STAFF'] },
  { path: '/pre-orders',  label: 'Đặt trước',  icon: '📅', roles: ['OWNER', 'STAFF'] },
  { path: '/customers',   label: 'Khách hàng', icon: '🧑', roles: ['OWNER', 'STAFF'] },
  { path: '/reports',     label: 'Báo cáo',    icon: '📊', roles: ['OWNER'] },
  { path: '/expenses',    label: 'Sổ quỹ',     icon: '💸', roles: ['OWNER'] },
]

export default function Layout() {
  const { user, clearAuth } = useAuthStore()
  const location = useLocation()

  if (!user) return <Navigate to="/login" replace />

  const visibleItems = NAV_ITEMS.filter(item => item.roles.includes(user.role))

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex fixed left-0 top-0 h-full w-32 bg-slate-800 border-r border-slate-700 flex-col z-10">
        <div className="p-4 text-center border-b border-slate-700">
          <div className="text-3xl">🌸</div>
          <div className="text-xs text-slate-400 mt-1 font-medium">Flower Store</div>
        </div>

        <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
          {visibleItems.map(item => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center gap-1 p-2.5 rounded-lg text-xs transition-colors ${
                location.pathname === item.path
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-400 hover:bg-slate-700 hover:text-white'
              }`}
            >
              <span className="text-xl">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className="p-3 border-t border-slate-700 space-y-1">
          <div className="text-xs text-slate-300 font-medium truncate">{user.name}</div>
          <div className="text-xs text-slate-500">{user.role === 'OWNER' ? 'Chủ shop' : 'Nhân viên'}</div>
          <button
            onClick={clearAuth}
            className="text-xs text-slate-500 hover:text-red-400 transition-colors mt-1"
          >
            Đăng xuất
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="md:ml-32 pb-20 md:pb-0 min-h-screen">
        <Outlet />
      </main>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-slate-800 border-t border-slate-700 z-10">
        <div className="grid h-16" style={{ gridTemplateColumns: `repeat(${Math.min(visibleItems.length, 5)}, 1fr)` }}>
          {visibleItems.slice(0, 5).map(item => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center justify-center text-xs transition-colors ${
                location.pathname === item.path
                  ? 'text-indigo-400'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              <span className="text-xl">{item.icon}</span>
              <span className="mt-0.5">{item.label}</span>
            </Link>
          ))}
        </div>
      </nav>
    </div>
  )
}
```

- [ ] **Step 3: Tạo `src/App.jsx`**

```jsx
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import Layout from './components/Layout'
import LoginPage from './pages/LoginPage'
import POSPage from './pages/POSPage'
import InventoryPage from './pages/InventoryPage'
import PreOrdersPage from './pages/PreOrdersPage'
import CustomersPage from './pages/CustomersPage'
import ReportsPage from './pages/ReportsPage'
import ExpensesPage from './pages/ExpensesPage'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 1000 * 60, retry: 1 },
  },
})

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route element={<Layout />}>
            <Route path="/" element={<POSPage />} />
            <Route path="/inventory" element={<InventoryPage />} />
            <Route path="/pre-orders" element={<PreOrdersPage />} />
            <Route path="/customers" element={<CustomersPage />} />
            <Route path="/reports" element={<ReportsPage />} />
            <Route path="/expenses" element={<ExpensesPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  )
}
```

- [ ] **Step 4: Chạy toàn bộ test suite**

```bash
npm test && npm run test:api
```

Expected: tất cả pass, không có lỗi.

- [ ] **Step 5: Chạy dev server và kiểm tra thủ công**

```bash
npm run dev
```

Mở http://localhost:3000:
- [ ] Redirect sang `/login` tự động ✓
- [ ] Form đăng nhập hiển thị đúng ✓
- [ ] Đăng nhập với `admin@flowerstore.com` / `admin123` → vào trang Bán hàng ✓
- [ ] Sidebar hiển thị đầy đủ navigation (OWNER thấy 6 items) ✓
- [ ] Click các nav item chuyển trang đúng ✓
- [ ] Thu nhỏ cửa sổ < 768px → bottom nav xuất hiện ✓
- [ ] Nút đăng xuất → về login ✓

- [ ] **Step 6: Commit**

```bash
git add src/
git commit -m "feat: app shell — Layout với sidebar + bottom nav + routing đầy đủ"
```

---

## Task 8: Deploy lên Vercel

**Files:** không có file mới, chỉ cấu hình Vercel dashboard.

- [ ] **Step 1: Push lên GitHub**

```bash
git remote add origin https://github.com/<username>/flower-store.git
git push -u origin main
```

- [ ] **Step 2: Import project trên Vercel**

1. Vào vercel.com → New Project → Import từ GitHub
2. Chọn repo `flower-store`
3. Framework Preset: **Vite**
4. Build Command: `npm run build`
5. Output Directory: `dist`

- [ ] **Step 3: Thêm Environment Variables trên Vercel**

Trong Settings → Environment Variables, thêm:
```
DATABASE_URL      = <Neon connection string>
JWT_SECRET        = <same value from .env>
JWT_REFRESH_SECRET = <same value from .env>
FRONTEND_URL      = https://<your-vercel-domain>.vercel.app
NODE_ENV          = production
```

- [ ] **Step 4: Deploy và kiểm tra**

```
https://<your-vercel-domain>.vercel.app
```

- [ ] Login page tải được ✓
- [ ] POST `/api/auth/login` trả về 200 với credentials đúng ✓
- [ ] Navigation hoạt động đúng trên mobile ✓

- [ ] **Step 5: Commit verification**

```bash
git tag v1.0-foundation
git push --tags
```

---

## Kết quả Plan 1

Sau khi hoàn thành, bạn có:
- ✅ App deploy được tại Vercel URL
- ✅ Database schema đầy đủ trên Neon
- ✅ Đăng nhập / đăng xuất hoạt động với JWT
- ✅ Phân quyền owner/staff qua middleware
- ✅ Navigation responsive (sidebar desktop, bottom nav mobile)
- ✅ 9 test passes (6 API + 3 UI)
- ✅ Seed account: `admin@flowerstore.com` / `admin123`

**Tiếp theo:** Plan 2 — POS Module (products, cart, order creation)
