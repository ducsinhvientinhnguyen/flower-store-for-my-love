# Design System + Public Landing Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Re-skin the whole app in a "Cream Editorial" design system (To'ak Chocolate-inspired, adapted for a flower shop), add Framer Motion-based scroll/parallax/hover/page-transition effects, and ship a new public landing page at `/`, with the existing management app moved under `/app/*`.

**Architecture:** Tailwind theme tokens (colors + fonts) drive all visual changes; a small `src/components/motion/` folder holds three reusable Framer Motion wrapper components used by the new landing page and available to future pages; a new public Express route serves featured products for the landing page without auth.

**Tech Stack:** React 18 + Vite, Tailwind CSS v3, `motion` (Framer Motion) v12, React Router v6, TanStack Query, Express 5 + Prisma 5.22.0, Vitest (frontend), Jest (API).

**Spec:** `docs/superpowers/specs/2026-06-18-design-system-landing-design.md`

---

### Task 1: Design tokens — Tailwind colors, fonts, and base body font

**Files:**
- Modify: `tailwind.config.mjs`
- Modify: `index.html`
- Modify: `src/index.css`

- [ ] **Step 1: Add color and font tokens to Tailwind config**

In `tailwind.config.mjs`, replace the empty `extend: {}` (line 6) with:

```js
/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        cream: '#f3ead9',
        charcoal: '#2a2420',
        'charcoal-soft': '#5c5248',
        gold: '#a3782f',
        'gold-light': '#c9a45c',
      },
      fontFamily: {
        serif: ['"Libre Baskerville"', 'Georgia', 'serif'],
        sans: ['Inter', 'Arial', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
```

- [ ] **Step 2: Load the fonts in `index.html`**

Insert these lines right before `</head>` (after the viewport meta tag):

```html
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link
      href="https://fonts.googleapis.com/css2?family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&family=Inter:wght@400;500;600;700&display=swap"
      rel="stylesheet"
    />
```

- [ ] **Step 3: Set Inter as the default body font**

Replace the full contents of `src/index.css` with:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

body {
  font-family: 'Inter', Arial, sans-serif;
}
```

- [ ] **Step 4: Verify the build picks up the new config**

Run: `npm run build`
Expected: build completes with no errors (exit code 0).

- [ ] **Step 5: Commit**

```bash
git add tailwind.config.mjs index.html src/index.css
git commit -m "feat: add Cream Editorial design tokens (colors, fonts)"
```

---

### Task 2: Install Framer Motion and add jsdom IntersectionObserver polyfill

**Files:**
- Modify: `package.json`
- Modify: `src/__tests__/setup.js`

- [ ] **Step 1: Install the `motion` package**

Run: `npm install motion`
Expected: `package.json` dependencies now include `"motion": "^12.x.x"`.

- [ ] **Step 2: Add an IntersectionObserver stub for jsdom**

`whileInView` (used by the scroll-reveal component in Task 3) relies on `IntersectionObserver`, which jsdom does not implement. Replace the full contents of `src/__tests__/setup.js` with:

```js
import '@testing-library/jest-dom'

if (typeof window !== 'undefined' && !window.IntersectionObserver) {
  window.IntersectionObserver = class IntersectionObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json src/__tests__/setup.js
git commit -m "chore: install motion, add IntersectionObserver test stub"
```

---

### Task 3: Motion primitives — FadeInView, ParallaxLayer, PageTransition

**Files:**
- Create: `src/components/motion/FadeInView.jsx`
- Create: `src/components/motion/ParallaxLayer.jsx`
- Create: `src/components/motion/PageTransition.jsx`
- Test: `src/__tests__/motion.test.jsx`

- [ ] **Step 1: Write the failing test**

Create `src/__tests__/motion.test.jsx`:

```jsx
import { render, screen } from '@testing-library/react'
import FadeInView from '../components/motion/FadeInView'
import ParallaxLayer from '../components/motion/ParallaxLayer'
import PageTransition from '../components/motion/PageTransition'

describe('motion primitives', () => {
  it('FadeInView renders its children', () => {
    render(<FadeInView><p>hello</p></FadeInView>)
    expect(screen.getByText('hello')).toBeInTheDocument()
  })

  it('ParallaxLayer renders its children', () => {
    render(<ParallaxLayer><p>parallax</p></ParallaxLayer>)
    expect(screen.getByText('parallax')).toBeInTheDocument()
  })

  it('PageTransition renders its children', () => {
    render(<PageTransition><p>page</p></PageTransition>)
    expect(screen.getByText('page')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run src/__tests__/motion.test.jsx`
Expected: FAIL — `Cannot find module '../components/motion/FadeInView'` (or similar) for all three imports.

- [ ] **Step 3: Implement `FadeInView`**

Create `src/components/motion/FadeInView.jsx`:

```jsx
import { motion } from 'motion/react'

export default function FadeInView({ children, className = '', delay = 0 }) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.6, delay, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  )
}
```

- [ ] **Step 4: Implement `ParallaxLayer`**

Create `src/components/motion/ParallaxLayer.jsx`:

```jsx
import { useRef } from 'react'
import { motion, useScroll, useTransform } from 'motion/react'

export default function ParallaxLayer({ children, className = '', offset = 80 }) {
  const ref = useRef(null)
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  })
  const y = useTransform(scrollYProgress, [0, 1], [-offset, offset])

  return (
    <div ref={ref} className={className} style={{ overflow: 'hidden', position: 'relative' }}>
      <motion.div style={{ y }}>{children}</motion.div>
    </div>
  )
}
```

- [ ] **Step 5: Implement `PageTransition`**

Create `src/components/motion/PageTransition.jsx`:

```jsx
import { motion } from 'motion/react'

export default function PageTransition({ children }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  )
}
```

- [ ] **Step 6: Run the test to verify it passes**

Run: `npx vitest run src/__tests__/motion.test.jsx`
Expected: PASS (3 tests).

- [ ] **Step 7: Commit**

```bash
git add src/components/motion src/__tests__/motion.test.jsx
git commit -m "feat: add FadeInView, ParallaxLayer, PageTransition motion primitives"
```

---

### Task 4: Public featured-products API

**Files:**
- Create: `api/routes/products.js`
- Modify: `api/index.js:18`
- Test: `api/__tests__/products.test.js`

- [ ] **Step 1: Write the failing test**

Create `api/__tests__/products.test.js`:

```js
process.env.NODE_ENV = 'test'

jest.mock('@prisma/client', () => {
  const mockFindMany = jest.fn()
  return {
    PrismaClient: jest.fn().mockImplementation(() => ({
      product: { findMany: mockFindMany },
    })),
    _mockFindMany: mockFindMany,
  }
})

const { _mockFindMany } = require('@prisma/client')
const request = require('supertest')
const app = require('../index')

describe('GET /api/products/featured', () => {
  beforeEach(() => jest.clearAllMocks())

  it('trả về sản phẩm active, không cần token', async () => {
    _mockFindMany.mockResolvedValue([
      { id: '1', name: 'Bó Hồng', category: 'Hoa hồng', basePrice: 350000, imageUrl: 'https://x/y.jpg' },
    ])

    const res = await request(app).get('/api/products/featured')

    expect(res.status).toBe(200)
    expect(res.body).toEqual([
      { id: '1', name: 'Bó Hồng', category: 'Hoa hồng', basePrice: 350000, imageUrl: 'https://x/y.jpg' },
    ])
  })

  it('chỉ truy vấn sản phẩm isActive true, tối đa 6, chỉ field công khai', async () => {
    _mockFindMany.mockResolvedValue([])

    await request(app).get('/api/products/featured')

    expect(_mockFindMany).toHaveBeenCalledWith({
      where: { isActive: true },
      take: 6,
      select: { id: true, name: true, category: true, basePrice: true, imageUrl: true },
    })
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx jest api/__tests__/products.test.js`
Expected: FAIL — `Cannot GET /api/products/featured` (404), since the route doesn't exist yet.

- [ ] **Step 3: Implement the route**

Create `api/routes/products.js`:

```js
const router = require('express').Router()
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

router.get('/featured', async (req, res, next) => {
  try {
    const products = await prisma.product.findMany({
      where: { isActive: true },
      take: 6,
      select: { id: true, name: true, category: true, basePrice: true, imageUrl: true },
    })

    res.json(products.map(p => ({ ...p, basePrice: Number(p.basePrice) })))
  } catch (err) {
    next(err)
  }
})

module.exports = router
```

- [ ] **Step 4: Mount the route**

In `api/index.js`, after line 18 (`app.use('/api/auth', require('./routes/auth'))`), add:

```js
app.use('/api/products', require('./routes/products'))
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `npx jest api/__tests__/products.test.js`
Expected: PASS (2 tests).

- [ ] **Step 6: Commit**

```bash
git add api/routes/products.js api/index.js api/__tests__/products.test.js
git commit -m "feat: add public GET /api/products/featured endpoint"
```

---

### Task 5: Seed sample products with real flower photos

**Files:**
- Modify: `prisma/seed.js`

- [ ] **Step 1: Add product seed data**

In `prisma/seed.js`, insert before the `console.log('✅ Seed hoàn tất')` line:

```js
  const SEED_PRODUCTS = [
    {
      id: '11111111-1111-1111-1111-111111111101',
      name: 'Bó Hồng Hỗn Hợp',
      category: 'Hoa hồng',
      basePrice: 350000,
      imageUrl: 'https://images.unsplash.com/photo-1582794543139-8ac9cb0f7b11?w=800&q=80&auto=format&fit=crop',
    },
    {
      id: '11111111-1111-1111-1111-111111111102',
      name: 'Bó Hoa Cưới Trắng',
      category: 'Hoa cưới',
      basePrice: 650000,
      imageUrl: 'https://images.unsplash.com/photo-1523693916903-027d144a2b7d?w=800&q=80&auto=format&fit=crop',
    },
    {
      id: '11111111-1111-1111-1111-111111111103',
      name: 'Bó Hoa Pastel',
      category: 'Hoa hỗn hợp',
      basePrice: 420000,
      imageUrl: 'https://images.unsplash.com/photo-1572454591674-2739f30d8c40?w=800&q=80&auto=format&fit=crop',
    },
    {
      id: '11111111-1111-1111-1111-111111111104',
      name: 'Bó Hoa Sinh Nhật',
      category: 'Hoa hỗn hợp',
      basePrice: 380000,
      imageUrl: 'https://images.unsplash.com/photo-1589095181425-c038b3871b6a?w=800&q=80&auto=format&fit=crop',
    },
    {
      id: '11111111-1111-1111-1111-111111111105',
      name: 'Bó Hướng Dương',
      category: 'Hướng dương',
      basePrice: 320000,
      imageUrl: 'https://images.unsplash.com/photo-1593026238161-ac5f86e5ef79?w=800&q=80&auto=format&fit=crop',
    },
    {
      id: '11111111-1111-1111-1111-111111111106',
      name: 'Bó Mẫu Đơn (Peony)',
      category: 'Mẫu đơn',
      basePrice: 590000,
      imageUrl: 'https://images.unsplash.com/photo-1557926005-012bd4382a0d?w=800&q=80&auto=format&fit=crop',
    },
  ]

  for (const product of SEED_PRODUCTS) {
    await prisma.product.upsert({
      where: { id: product.id },
      update: {},
      create: product,
    })
  }

  console.log(`✅ Seed ${SEED_PRODUCTS.length} sản phẩm mẫu`)
```

(Fixed UUIDs make the upsert idempotent — re-running the seed won't create duplicates, since `Product.name` has no unique constraint.)

- [ ] **Step 2: Run the seed**

Run: `npm run db:seed`
Expected: console output includes `✅ Seed hoàn tất` and `✅ Seed 6 sản phẩm mẫu`. Requires `DATABASE_URL` to be configured (same as existing owner-account seeding).

- [ ] **Step 3: Commit**

```bash
git add prisma/seed.js
git commit -m "feat: seed 6 sample products with Unsplash flower photos"
```

---

### Task 6: Landing page

**Files:**
- Create: `src/pages/LandingPage.jsx`
- Test: `src/__tests__/LandingPage.test.jsx`

- [ ] **Step 1: Write the failing test**

Create `src/__tests__/LandingPage.test.jsx`:

```jsx
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { vi } from 'vitest'
import LandingPage from '../pages/LandingPage'

vi.mock('../lib/api', () => ({
  api: { get: vi.fn() },
}))

import { api } from '../lib/api'

function renderLanding() {
  const queryClient = new QueryClient()
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <LandingPage />
      </MemoryRouter>
    </QueryClientProvider>
  )
}

describe('LandingPage', () => {
  beforeEach(() => vi.clearAllMocks())

  it('hiển thị hero, câu chuyện thương hiệu và link đăng nhập', async () => {
    api.get.mockResolvedValue({ ok: true, json: async () => [] })

    renderLanding()

    expect(screen.getByRole('heading', { name: /hoa tươi mỗi ngày/i })).toBeInTheDocument()
    expect(screen.getByText(/từ tâm huyết đến từng cánh hoa/i)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /đăng nhập/i })).toHaveAttribute('href', '/login')
  })

  it('hiển thị sản phẩm nổi bật khi API trả dữ liệu', async () => {
    api.get.mockResolvedValue({
      ok: true,
      json: async () => [
        { id: '1', name: 'Bó Hồng Hỗn Hợp', category: 'Hoa hồng', basePrice: 350000, imageUrl: 'https://x/y.jpg' },
      ],
    })

    renderLanding()

    await waitFor(() => expect(screen.getByText('Bó Hồng Hỗn Hợp')).toBeInTheDocument())
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run src/__tests__/LandingPage.test.jsx`
Expected: FAIL — `Cannot find module '../pages/LandingPage'`.

- [ ] **Step 3: Implement the landing page**

Create `src/pages/LandingPage.jsx`:

```jsx
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'motion/react'
import { api } from '../lib/api'
import FadeInView from '../components/motion/FadeInView'
import ParallaxLayer from '../components/motion/ParallaxLayer'

function useFeaturedProducts() {
  return useQuery({
    queryKey: ['products', 'featured'],
    queryFn: async () => {
      const res = await api.get('/products/featured')
      if (!res.ok) throw new Error('Failed to load featured products')
      return res.json()
    },
  })
}

export default function LandingPage() {
  const { data: products = [] } = useFeaturedProducts()

  return (
    <div className="bg-cream text-charcoal">
      <header className="flex items-center justify-between px-6 md:px-12 py-4 border-b border-charcoal/10">
        <span className="font-serif text-lg">🌸 Flower Store</span>
        <Link
          to="/login"
          className="text-xs uppercase tracking-widest border border-gold text-gold px-4 py-2 hover:bg-gold hover:text-cream transition-colors"
        >
          Đăng nhập
        </Link>
      </header>

      <ParallaxLayer className="py-24 md:py-32 text-center px-6">
        <h1 className="font-serif text-4xl md:text-6xl">Hoa Tươi Mỗi Ngày</h1>
        <p className="text-xs uppercase tracking-[0.2em] text-gold mt-4">
          Tinh tế · Thủ công · Bền vững
        </p>
        <a
          href="#featured"
          className="inline-block mt-8 border border-gold text-gold text-xs uppercase tracking-widest px-6 py-3 hover:bg-gold hover:text-cream transition-colors"
        >
          Khám phá sản phẩm
        </a>
      </ParallaxLayer>

      <FadeInView className="py-20 px-6 text-center max-w-xl mx-auto">
        <p className="text-xs uppercase tracking-widest text-gold">Câu chuyện</p>
        <h2 className="font-serif text-2xl md:text-3xl mt-3">Từ tâm huyết đến từng cánh hoa</h2>
        <p className="text-charcoal-soft text-sm mt-4">
          Mỗi bó hoa được chọn lựa và cắm tay cẩn thận, mang đến sự tươi mới và tinh tế cho từng
          khoảnh khắc của bạn.
        </p>
      </FadeInView>

      <section id="featured" className="py-20 px-6">
        <p className="text-center text-xs uppercase tracking-widest text-gold mb-10">
          Sản phẩm nổi bật
        </p>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          {products.map(product => (
            <FadeInView key={product.id}>
              <motion.div
                className="bg-white rounded-lg overflow-hidden border border-charcoal/10"
                whileHover={{ y: -4, scale: 1.02 }}
                transition={{ duration: 0.2 }}
              >
                <img src={product.imageUrl} alt={product.name} className="w-full h-40 object-cover" />
                <div className="p-3">
                  <p className="font-serif text-sm">{product.name}</p>
                  <p className="text-gold text-xs mt-1">{product.basePrice.toLocaleString('vi-VN')}đ</p>
                </div>
              </motion.div>
            </FadeInView>
          ))}
        </div>
      </section>

      <footer className="px-6 md:px-12 py-10 border-t border-charcoal/10 flex flex-col md:flex-row justify-between gap-2 text-sm text-charcoal-soft">
        <div>
          🌸 Flower Store
          <br />
          123 Đường Hoa, Q1, TP.HCM
        </div>
        <div>
          Hotline: 090x xxx xxx
          <br />
          9:00 - 21:00 hằng ngày
        </div>
      </footer>
    </div>
  )
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run src/__tests__/LandingPage.test.jsx`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add src/pages/LandingPage.jsx src/__tests__/LandingPage.test.jsx
git commit -m "feat: add public landing page with hero, story, featured products, footer"
```

---

### Task 7: Route restructure (`/app` prefix) + Layout restyle

**Files:**
- Modify: `src/App.jsx` (full rewrite)
- Modify: `src/components/Layout.jsx` (full rewrite)
- Test: `src/__tests__/App.test.jsx`

- [ ] **Step 1: Write the failing test**

Create `src/__tests__/App.test.jsx`:

```jsx
import { render, screen } from '@testing-library/react'
import { vi } from 'vitest'

vi.mock('../store/authStore', () => ({
  useAuthStore: vi.fn(),
}))

vi.mock('../lib/api', () => ({
  api: { get: vi.fn().mockResolvedValue({ ok: true, json: async () => [] }) },
}))

import { useAuthStore } from '../store/authStore'
import App from '../App'

function mockAuth(state) {
  useAuthStore.mockImplementation(selector => (selector ? selector(state) : state))
}

describe('App routing', () => {
  beforeEach(() => vi.clearAllMocks())

  it('"/" hiển thị landing page công khai khi chưa đăng nhập', () => {
    mockAuth({ user: null, clearAuth: vi.fn() })
    window.history.pushState({}, '', '/')

    render(<App />)

    expect(screen.getByRole('heading', { name: /hoa tươi mỗi ngày/i })).toBeInTheDocument()
  })

  it('"/app" chuyển hướng về /login khi chưa đăng nhập', () => {
    mockAuth({ user: null, clearAuth: vi.fn() })
    window.history.pushState({}, '', '/app')

    render(<App />)

    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run src/__tests__/App.test.jsx`
Expected: FAIL — first test fails because `/` currently renders `POSPage`/redirects via the old route table, not a landing page heading.

- [ ] **Step 3: Rewrite `src/App.jsx`**

Replace the full contents of `src/App.jsx` with:

```jsx
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AnimatePresence } from 'motion/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import LandingPage from './pages/LandingPage'
import LoginPage from './pages/LoginPage'
import Layout from './components/Layout'
import POSPage from './pages/POSPage'
import InventoryPage from './pages/InventoryPage'
import PreOrdersPage from './pages/PreOrdersPage'
import CustomersPage from './pages/CustomersPage'
import ReportsPage from './pages/ReportsPage'
import ExpensesPage from './pages/ExpensesPage'
import PageTransition from './components/motion/PageTransition'
import { useAuthStore } from './store/authStore'

const queryClient = new QueryClient()

function GuestRoute({ children }) {
  const user = useAuthStore(s => s.user)
  if (user) return <Navigate to="/app" replace />
  return children
}

function AnimatedRoutes() {
  const location = useLocation()

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<PageTransition><LandingPage /></PageTransition>} />
        <Route
          path="/login"
          element={
            <GuestRoute>
              <PageTransition><LoginPage /></PageTransition>
            </GuestRoute>
          }
        />
        <Route path="/app" element={<Layout />}>
          <Route index element={<PageTransition><POSPage /></PageTransition>} />
          <Route path="inventory" element={<PageTransition><InventoryPage /></PageTransition>} />
          <Route path="pre-orders" element={<PageTransition><PreOrdersPage /></PageTransition>} />
          <Route path="customers" element={<PageTransition><CustomersPage /></PageTransition>} />
          <Route path="reports" element={<PageTransition><ReportsPage /></PageTransition>} />
          <Route path="expenses" element={<PageTransition><ExpensesPage /></PageTransition>} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AnimatePresence>
  )
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AnimatedRoutes />
      </BrowserRouter>
    </QueryClientProvider>
  )
}
```

- [ ] **Step 4: Rewrite `src/components/Layout.jsx`**

Replace the full contents of `src/components/Layout.jsx` with:

```jsx
import { Navigate, Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { useQueryClient } from '@tanstack/react-query'

const NAV_ITEMS = [
  { path: '/app',            label: 'Bán hàng',  icon: '🛒', roles: ['OWNER', 'STAFF'] },
  { path: '/app/inventory',  label: 'Kho',       icon: '📦', roles: ['OWNER', 'STAFF'] },
  { path: '/app/pre-orders', label: 'Đặt trước', icon: '📅', roles: ['OWNER', 'STAFF'] },
  { path: '/app/customers',  label: 'Khách',     icon: '🧑', roles: ['OWNER', 'STAFF'] },
  { path: '/app/reports',    label: 'Báo cáo',   icon: '📊', roles: ['OWNER'] },
  { path: '/app/expenses',   label: 'Sổ quỹ',   icon: '💸', roles: ['OWNER'] },
]

export default function Layout() {
  const { user, clearAuth } = useAuthStore()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  if (!user) return <Navigate to="/login" replace />

  const visibleNav = NAV_ITEMS.filter(item => item.roles.includes(user.role))

  function handleLogout() {
    queryClient.clear()
    clearAuth()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-cream text-charcoal flex">
      {/* Sidebar — desktop only */}
      <aside className="hidden md:flex flex-col w-32 bg-cream border-r border-charcoal/10 fixed inset-y-0">
        <div className="flex items-center justify-center h-14 border-b border-charcoal/10">
          <span className="text-xl">🌸</span>
        </div>
        <nav className="flex-1 flex flex-col gap-1 p-2 mt-2">
          {visibleNav.map(item => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/app'}
              className={({ isActive }) =>
                `flex flex-col items-center gap-1 px-2 py-3 rounded-lg text-xs transition-colors ${
                  isActive
                    ? 'bg-gold text-cream'
                    : 'text-charcoal-soft hover:bg-gold/10 hover:text-gold'
                }`
              }
            >
              <span className="text-lg">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="p-2 border-t border-charcoal/10">
          <div className="text-xs text-charcoal-soft text-center mb-2 truncate px-1">{user.name}</div>
          <button
            type="button"
            onClick={handleLogout}
            className="w-full text-xs text-charcoal-soft hover:text-gold py-2 rounded transition-colors"
          >
            Đăng xuất
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 md:ml-32 flex flex-col min-h-screen">
        {/* Mobile header */}
        <header className="md:hidden flex items-center justify-between px-4 h-14 bg-cream border-b border-charcoal/10 sticky top-0 z-10">
          <span className="text-lg">🌸</span>
          <span className="text-sm text-charcoal-soft">{user.name}</span>
          <button type="button" onClick={handleLogout} className="text-xs text-charcoal-soft hover:text-gold">
            Đăng xuất
          </button>
        </header>

        <div className="flex-1 p-4 pb-20 md:pb-4">
          <Outlet />
        </div>
      </main>

      {/* Bottom nav — mobile only */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 bg-cream border-t border-charcoal/10 flex">
        {visibleNav.slice(0, 5).map(item => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/app'}
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center gap-0.5 py-2 text-xs transition-colors ${
                isActive ? 'text-gold' : 'text-charcoal-soft'
              }`
            }
          >
            <span className="text-xl">{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `npx vitest run src/__tests__/App.test.jsx`
Expected: PASS (2 tests).

- [ ] **Step 6: Commit**

```bash
git add src/App.jsx src/components/Layout.jsx src/__tests__/App.test.jsx
git commit -m "feat: restructure routes under /app, restyle Layout to Cream Editorial"
```

---

### Task 8: Restyle the 6 placeholder pages

**Files:**
- Modify: `src/pages/POSPage.jsx`
- Modify: `src/pages/InventoryPage.jsx`
- Modify: `src/pages/PreOrdersPage.jsx`
- Modify: `src/pages/CustomersPage.jsx`
- Modify: `src/pages/ReportsPage.jsx`
- Modify: `src/pages/ExpensesPage.jsx`

No automated test — these are unstyled placeholders with no behavior; the change is purely cosmetic class names. Verified by manual check in Step 2.

- [ ] **Step 1: Apply the same class-name swap to all 6 files**

In each file, change:
```jsx
      <h1 className="text-2xl font-bold text-white mb-4">{TITLE}</h1>
      <p className="text-slate-400">Tính năng đang được phát triển.</p>
```
to:
```jsx
      <h1 className="text-2xl font-serif font-bold text-charcoal mb-4">{TITLE}</h1>
      <p className="text-charcoal-soft">Tính năng đang được phát triển.</p>
```

Concretely:

`src/pages/POSPage.jsx`:
```jsx
export default function POSPage() {
  return (
    <div>
      <h1 className="text-2xl font-serif font-bold text-charcoal mb-4">Bán hàng</h1>
      <p className="text-charcoal-soft">Tính năng đang được phát triển.</p>
    </div>
  )
}
```

`src/pages/InventoryPage.jsx`:
```jsx
export default function InventoryPage() {
  return (
    <div>
      <h1 className="text-2xl font-serif font-bold text-charcoal mb-4">Kho</h1>
      <p className="text-charcoal-soft">Tính năng đang được phát triển.</p>
    </div>
  )
}
```

`src/pages/PreOrdersPage.jsx`:
```jsx
export default function PreOrdersPage() {
  return (
    <div>
      <h1 className="text-2xl font-serif font-bold text-charcoal mb-4">Đặt hàng trước</h1>
      <p className="text-charcoal-soft">Tính năng đang được phát triển.</p>
    </div>
  )
}
```

`src/pages/CustomersPage.jsx`:
```jsx
export default function CustomersPage() {
  return (
    <div>
      <h1 className="text-2xl font-serif font-bold text-charcoal mb-4">Khách hàng</h1>
      <p className="text-charcoal-soft">Tính năng đang được phát triển.</p>
    </div>
  )
}
```

`src/pages/ReportsPage.jsx`:
```jsx
export default function ReportsPage() {
  return (
    <div>
      <h1 className="text-2xl font-serif font-bold text-charcoal mb-4">Báo cáo</h1>
      <p className="text-charcoal-soft">Tính năng đang được phát triển.</p>
    </div>
  )
}
```

`src/pages/ExpensesPage.jsx`:
```jsx
export default function ExpensesPage() {
  return (
    <div>
      <h1 className="text-2xl font-serif font-bold text-charcoal mb-4">Sổ quỹ</h1>
      <p className="text-charcoal-soft">Tính năng đang được phát triển.</p>
    </div>
  )
}
```

- [ ] **Step 2: Manually verify**

Run: `npm run dev`
Open `http://localhost:3000/app` (after logging in), click through all 6 nav items.
Expected: every page shows cream background (inherited from `Layout`), charcoal serif heading, charcoal-soft body text — no leftover `text-white`/`text-slate-400`.

- [ ] **Step 3: Commit**

```bash
git add src/pages/POSPage.jsx src/pages/InventoryPage.jsx src/pages/PreOrdersPage.jsx src/pages/CustomersPage.jsx src/pages/ReportsPage.jsx src/pages/ExpensesPage.jsx
git commit -m "style: restyle placeholder pages to Cream Editorial theme"
```

---

### Task 9: Restyle LoginPage + update post-login redirect

**Files:**
- Modify: `src/pages/LoginPage.jsx` (full rewrite)
- Modify: `src/__tests__/LoginPage.test.jsx:57`

- [ ] **Step 1: Update the existing test's expected redirect target**

In `src/__tests__/LoginPage.test.jsx`, change line 57 from:

```js
    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/'))
```

to:

```js
    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/app'))
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run src/__tests__/LoginPage.test.jsx`
Expected: FAIL on the "navigate về /app sau khi đăng nhập thành công" assertion — current code still calls `navigate('/')`.

- [ ] **Step 3: Rewrite `src/pages/LoginPage.jsx`**

Replace the full contents of `src/pages/LoginPage.jsx` with:

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

    try {
      const res = await api.post('/auth/login', { email, password })
      if (res.ok) {
        const data = await res.json()
        setAuth(data.user, data.accessToken)
        navigate('/app')
      } else {
        setError('Email hoặc mật khẩu không đúng')
      }
    } catch {
      setError('Không thể kết nối đến máy chủ')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-cream flex items-center justify-center px-4">
      <div className="w-full max-w-sm bg-white rounded-xl p-8 shadow-xl border border-charcoal/10">
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">🌸</div>
          <h1 className="text-2xl font-serif font-bold text-charcoal">Flower Store</h1>
          <p className="text-charcoal-soft text-sm mt-1">Quản lý cửa hàng hoa</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm text-charcoal-soft mb-1">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full bg-cream text-charcoal rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-gold placeholder-charcoal-soft/50 border border-charcoal/10"
              placeholder="admin@flowerstore.com"
              required
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm text-charcoal-soft mb-1">
              Mật khẩu
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full bg-cream text-charcoal rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-gold border border-charcoal/10"
              required
            />
          </div>

          {error && (
            <p className="text-red-700 text-sm bg-red-100 rounded-lg px-3 py-2">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gold hover:bg-gold-light disabled:opacity-50 disabled:cursor-not-allowed text-cream rounded-lg px-4 py-2.5 font-medium transition-colors"
          >
            {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
          </button>
        </form>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run src/__tests__/LoginPage.test.jsx`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add src/pages/LoginPage.jsx src/__tests__/LoginPage.test.jsx
git commit -m "style: restyle LoginPage to Cream Editorial, redirect to /app post-login"
```

---

### Task 10: Final verification

**Files:** none (verification only)

- [ ] **Step 1: Run the full frontend test suite**

Run: `npm test -- --watchAll=false`
Expected: all test files pass, including `App.test.jsx`, `LandingPage.test.jsx`, `LoginPage.test.jsx`, `motion.test.jsx`.

- [ ] **Step 2: Run the full API test suite**

Run: `npm run test:api`
Expected: all tests pass, including `auth.test.js` and `products.test.js`.

- [ ] **Step 3: Run the production build**

Run: `npm run build`
Expected: build completes with no errors.

- [ ] **Step 4: Manual smoke test in the browser**

Run: `npm run dev`
Visit `http://localhost:3000/`:
- Landing page loads with cream background, serif hero headline, hero fades in on scroll (parallax), featured products section shows 6 cards with real photos and hover-lifts.
- Click "Đăng nhập" → lands on `/login`, restyled in cream theme.
- Log in with `admin@flowerstore.com` / `admin123` → redirected to `/app`, sidebar/nav shows Cream Editorial theme, all 6 nav items navigate correctly under `/app/*`.
- Manually visiting `/app/inventory` while logged out redirects to `/login`.

This step is manual (per the spec's testing section, animation feel/timing isn't unit-tested) — confirm it, but no code changes result from it unless a problem is found.

No cleanup step needed — the brainstorming companion server auto-exits after 30 minutes of idle time, and its mockup files live under the gitignored `.superpowers/brainstorm/` directory.
