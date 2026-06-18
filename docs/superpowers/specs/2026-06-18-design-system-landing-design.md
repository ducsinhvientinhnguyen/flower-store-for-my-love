# Design System + Public Landing Page — Design

## Context

The app currently has a working Foundation (Plan 1): auth, app shell, 6 placeholder pages, all in a dark-slate Tailwind theme. The user wants the whole app re-skinned with a design language inspired by [To'ak Chocolate](https://toakchocolate.com/)'s site — minimal, premium, serif headlines, generous whitespace, scroll/parallax motion — adapted for a flower shop, plus a new public landing page at `/`.

This is the first of three sub-projects agreed with the user, in this order:
1. **Design System + Landing Page** (this spec)
2. Landing page content iteration (folded into this spec — see below)
3. POS Module (Plan 2 proper — cart, custom bouquet, checkout, stock deduction) — **separate spec, not covered here**

## Goals

- Establish reusable design tokens (color, typography, spacing) and apply them across the entire app, including the existing placeholder pages and `Layout.jsx`.
- Add a public, unauthenticated landing page at `/` that introduces the brand.
- Restructure routing so the management app lives under `/app/*`, freeing up `/` for the landing page.
- Introduce reusable motion primitives (scroll reveal, parallax, hover micro-interaction, page transition) built on Framer Motion, used by the landing page and available to future pages.
- Seed real (if minimal) product data so the landing page's "Featured products" section isn't empty.

## Non-goals

- Full Product CRUD / admin management UI — that's part of the POS Module spec.
- POS functionality (cart, checkout, inventory deduction) — separate spec.
- Pixel-perfect cloning of To'ak's site — this is an adapted mood, not a copy.

## Design Tokens

**Color palette — "Cream Editorial"** (chosen over a literal dark+gold clone and a botanical-green variant, after visual comparison):

| Token | Hex | Usage |
|---|---|---|
| `cream` | `#f3ead9` | Primary background (landing + all app pages) |
| `charcoal` | `#2a2420` | Primary text |
| `charcoal-soft` | `#5c5248` | Secondary/body text |
| `gold` | `#a3782f` | Accent — links, borders, icons, active nav state |
| `gold-light` | `#c9a45c` | Hover state for gold elements |

These become Tailwind theme extensions (`tailwind.config.mjs`), not one-off inline colors.

**Typography:**
- Headings: **Libre Baskerville** (serif) — chosen over Playfair Display (too heavy/contrasty) and Cormorant Garamond (too delicate) for being legible at both large hero sizes and smaller section headings.
- Body: **Inter** (sans-serif).
- Small uppercase labels (e.g. "Tinh tế · Thủ công · Bền vững") use wide letter-spacing (`tracking-widest`), matching the To'ak mood.
- Both fonts loaded via Google Fonts `<link>` in `index.html` (no new build dependency).

**Spacing:** Landing page sections use generous vertical padding (`py-24`/`py-32`) to read as premium/spacious, contrasting with the tighter `p-4` density appropriate for the management app's working screens.

**Scope of token application:** Per user decision, the new theme replaces the dark-slate theme **everywhere** — `Layout.jsx` (sidebar/nav/header) and all 6 existing pages, not just the landing page. Since those pages are still placeholders, this is a restyle of the shell and placeholder content, not a rewrite of business logic.

## Route Restructure

Current routes all hang off `/`. New structure:

```
/                    → LandingPage (public, no auth)
/login               → Login (restyled, logic unchanged)
/app                 → POSPage (auth required)            [was "/"]
/app/inventory       → InventoryPage                       [was "/inventory"]
/app/pre-orders      → PreOrdersPage                        [was "/pre-orders"]
/app/customers       → CustomersPage                        [was "/customers"]
/app/reports         → ReportsPage (OWNER only)              [was "/reports"]
/app/expenses        → ExpensesPage (OWNER only)             [was "/expenses"]
```

`Layout.jsx`'s `NAV_ITEMS` paths get the `/app` prefix; its `end` prop on the root nav item (`/app` instead of `/`) and the existing auth-guard (`if (!user) return <Navigate to="/login" />`) logic stay as-is — only the path strings change. The router config (wherever `<Routes>` is defined) adds a top-level `/` route for `LandingPage` and nests the existing protected routes under `/app`.

## Motion Primitives

**Library: Framer Motion** (`motion` npm package), chosen over GSAP (more powerful but imperative/heavier for this app's needs) and a hand-rolled CSS+IntersectionObserver approach (would require essentially reimplementing Framer Motion's `AnimatePresence` to get smooth page transitions).

New folder `src/components/motion/`:
- **`FadeInView`** — wraps children in `motion.div` with `whileInView`/`initial` for fade+slide-up scroll reveal. Reused across every landing section and available for future card lists in `/app/*`.
- **`ParallaxLayer`** — uses `useScroll` + `useTransform` to offset a background image's vertical position relative to scroll, used in the landing hero.
- **`PageTransition`** — wraps the router's outlet in `AnimatePresence` + `motion.div` (fade/slide) so navigating between routes feels soft instead of an instant cut.
- Hover/tap micro-interactions (card lift, button press) don't need a dedicated component — applied directly via `whileHover`/`whileTap` props where needed (product cards, buttons).

## Landing Page Composition

Single new page, `src/pages/LandingPage.jsx`, composed of four sections in this order (validated via wireframe with the user):

1. **Header** — logo + "Đăng nhập" link to `/login`. Not part of the scrolling sections; sticky/simple.
2. **Hero** — large serif headline ("Hoa Tươi Mỗi Ngày"), uppercase tagline, CTA button scrolling to/linking the featured products section. Background image uses `ParallaxLayer`.
3. **Brand story** — short paragraph about the shop's philosophy, wrapped in `FadeInView`.
4. **Featured products** — grid of product cards (image, name, price) fetched from the new public API, each wrapped in `FadeInView` with hover lift on the card. With 6 seeded products, the grid renders 3 columns × 2 rows on desktop, 2 columns on mobile.
5. **Footer** — contact info (address, hotline, hours).

## Data: Featured Products

No products API exists yet (only `api/routes/auth.js`), and the `Product` table is empty. Since the landing page is public and unauthenticated:

- New route file `api/routes/products.js`, mounted at `/api/products` in `api/index.js`.
- `GET /api/products/featured` — public (no auth middleware), returns up to 6 products where `isActive: true`, selecting only `id, name, category, basePrice, imageUrl` (no internal/audit fields).
- `prisma/seed.js` extended to upsert 6 sample `Product` rows so the section has real content:

| name | category | basePrice (VND) | imageUrl |
|---|---|---|---|
| Bó Hồng Hỗn Hợp | Hoa hồng | 350000 | `https://images.unsplash.com/photo-1582794543139-8ac9cb0f7b11?w=800&q=80&auto=format&fit=crop` |
| Bó Hoa Cưới Trắng | Hoa cưới | 650000 | `https://images.unsplash.com/photo-1523693916903-027d144a2b7d?w=800&q=80&auto=format&fit=crop` |
| Bó Hoa Pastel | Hoa hỗn hợp | 420000 | `https://images.unsplash.com/photo-1572454591674-2739f30d8c40?w=800&q=80&auto=format&fit=crop` |
| Bó Hoa Sinh Nhật | Hoa hỗn hợp | 380000 | `https://images.unsplash.com/photo-1589095181425-c038b3871b6a?w=800&q=80&auto=format&fit=crop` |
| Bó Hướng Dương | Hướng dương | 320000 | `https://images.unsplash.com/photo-1593026238161-ac5f86e5ef79?w=800&q=80&auto=format&fit=crop` |
| Bó Mẫu Đơn (Peony) | Mẫu đơn | 590000 | `https://images.unsplash.com/photo-1557926005-012bd4382a0d?w=800&q=80&auto=format&fit=crop` |

All 6 URLs verified to return `200 image/jpeg` directly from Unsplash's CDN (free-to-use, no attribution required) — no self-hosting needed. Full Product admin CRUD (create/edit/delete from the UI) is out of scope here and belongs to the POS Module spec.

## Testing

- **Vitest (frontend):** `LandingPage` renders all sections and the "Đăng nhập" link points to `/login`; route-guard test confirms `/app/*` redirects unauthenticated users to `/login` while `/` stays public.
- **Jest (API):** `GET /api/products/featured` returns only `isActive: true` products with the expected field shape, and requires no auth token.
- Animation behavior (Framer Motion timing/easing) is not unit-tested — only that components render; visual verification is manual (per `verification-before-completion` norms before marking this done).

## Open risks / follow-ups

- Restyling `Layout.jsx` and all 6 pages to the new theme, while keeping them functionally placeholders, means the POS Module spec will build real functionality directly on top of the new theme (no second restyle pass expected).
- If real product photography becomes available later, swapping seed `imageUrl` values for owned photos is a one-line change per row.
