# 📋 Implementation Plan — Sistem Manajemen Penjualan & Konsinyasi

> **DistribusiApp** — Aplikasi multi-tenant SaaS untuk mengelola produk, distribusi, konsinyasi, agen, sales, toko, display, retur, dan laporan.

---

## 🏗️ Tech Stack

| Layer | Teknologi | Keterangan |
|-------|-----------|------------|
| **Frontend Framework** | React 18 + Refine v4 | Framework-agnostic routing, modular, mudah maintenance |
| **Styling** | Tailwind CSS + shadcn/ui | Soft color palette + dark mode toggle |
| **Backend** | Hono v4 (Cloudflare Workers) | Lightweight, edge-native |
| **Database** | Cloudflare D1 (SQLite) | Local dev via Wrangler/Miniflare |
| **Storage** | Cloudflare R2 | Local dev via Miniflare |
| **Auth** | JWT + cookie-based session | Stateless, edge-compatible |
| **PWA** | Vite PWA plugin | Offline-capable, installable |
| **Dev Environment** | Wrangler dev + Miniflare | Local-first development |
| **Deployment** | Cloudflare Pages + Workers | Production deployment |

---

## 📦 Struktur Proyek

```text
DistribusiApp/
│
├── frontend/                    # React + Refine + Vite
│   ├── src/
│   │   ├── components/          # Reusable UI components (shadcn/ui)
│   │   │   ├── ui/              # shadcn/ui base components
│   │   │   ├── layout/          # Layout components per role
│   │   │   └── shared/          # Shared business components
│   │   ├── pages/               # Halaman per modul
│   │   │   ├── auth/            # Login, Register
│   │   │   ├── onboarding/      # Profil Usaha
│   │   │   ├── dashboard/       # Dashboard per role
│   │   │   ├── products/        # Produk & Varian
│   │   │   ├── production/      # Produksi & Batch
│   │   │   ├── inventory/       # Stok & Mutasi
│   │   │   ├── distribution/    # Distribusi Agen & Sales
│   │   │   ├── agents/          # Manajemen Agen
│   │   │   ├── sales/           # Manajemen Sales
│   │   │   ├── stores/          # Toko & Konsinyasi
│   │   │   ├── displays/        # Display / Wadah
│   │   │   ├── returns/         # Retur
│   │   │   ├── reports/         # Laporan
│   │   │   └── settings/        # Pengaturan Usaha & Pengguna
│   │   ├── providers/           # Refine data provider, auth provider
│   │   ├── hooks/               # Custom hooks
│   │   ├── utils/               # Helper functions
│   │   ├── types/               # TypeScript types
│   │   ├── styles/              # Global styles, theme config
│   │   └── App.tsx
│   ├── public/
│   │   ├── manifest.json        # PWA manifest
│   │   └── icons/               # PWA icons
│   ├── tailwind.config.ts
│   ├── vite.config.ts
│   └── package.json
│
├── backend/                     # Hono + Cloudflare Workers
│   ├── src/
│   │   ├── routes/              # API routes per modul
│   │   │   ├── auth.ts
│   │   │   ├── businesses.ts
│   │   │   ├── users.ts
│   │   │   ├── products.ts
│   │   │   ├── categories.ts
│   │   │   ├── variants.ts
│   │   │   ├── units.ts
│   │   │   ├── suppliers.ts
│   │   │   ├── production.ts
│   │   │   ├── batches.ts
│   │   │   ├── inventory.ts
│   │   │   ├── agents.ts
│   │   │   ├── sales.ts
│   │   │   ├── stores.ts
│   │   │   ├── visits.ts
│   │   │   ├── consignments.ts
│   │   │   ├── displays.ts
│   │   │   ├── returns.ts
│   │   │   ├── reports.ts
│   │   │   └── uploads.ts
│   │   ├── middleware/
│   │   │   ├── auth.ts          # JWT validation
│   │   │   ├── tenant.ts        # Business tenant boundary
│   │   │   ├── role.ts          # Role-based access
│   │   │   └── validation.ts    # Request validation
│   │   ├── db/
│   │   │   ├── schema.sql       # Full database schema
│   │   │   ├── seed.sql         # Seed data for development
│   │   │   └── migrations/      # Incremental migrations
│   │   ├── services/            # Business logic layer
│   │   │   ├── auth.service.ts
│   │   │   ├── product.service.ts
│   │   │   ├── stock.service.ts
│   │   │   ├── distribution.service.ts
│   │   │   ├── consignment.service.ts
│   │   │   ├── return.service.ts
│   │   │   └── report.service.ts
│   │   ├── types/               # Shared TypeScript types
│   │   └── index.ts             # Hono app entry
│   ├── wrangler.toml
│   └── package.json
│
├── docs/                        # Dokumentasi requirements
│   ├── alur.md
│   ├── sistem.md
│   ├── information architecture.md
│   ├── diagram.md
│   └── tahapan.md
│
├── IMPLEMENTATION_PLAN.md       # File ini
├── TASK_PLAN.md                 # Task tracking
└── package.json                 # Root workspace
```

---

## 🗄️ Database Schema (34 Tabel)

### A. Core (4 tabel)

| # | Tabel | Fungsi | Kolom Utama |
|---|-------|--------|-------------|
| 1 | `users` | Data akun pengguna | id, name, email, password_hash, phone, avatar_url, status |
| 2 | `roles` | Definisi role | id, name (Owner/Admin/Sales), description |
| 3 | `businesses` | Data usaha/tenant | id, owner_user_id, name, slug, logo_url, phone, email, address, status |
| 4 | `business_members` | Hubungan user ↔ business + role | id, business_id, user_id, role_id, status, joined_at |

### B. Master Data (5 tabel)

| # | Tabel | Fungsi | Kolom Utama |
|---|-------|--------|-------------|
| 5 | `product_categories` | Kategori produk | id, business_id, name, description, status |
| 6 | `units` | Satuan produk | id, business_id, name, symbol |
| 7 | `products` | Data produk | id, business_id, category_id, name, sku, description, product_type, status, image_url |
| 8 | `product_variants` | Varian produk + harga | id, business_id, product_id, name, sku, barcode, unit_id, price_production, price_sales, price_agent, status |
| 9 | `suppliers` | Data rekanan | id, business_id, name, contact_person, phone, email, address, type, status, notes |

### C. Produksi & Batch (4 tabel)

| # | Tabel | Fungsi | Kolom Utama |
|---|-------|--------|-------------|
| 10 | `product_batches` | Batch produk | id, business_id, product_id, variant_id, batch_number, source_type, supplier_id, production_date, expired_date, quantity_initial, quantity_available, production_cost, status |
| 11 | `production_orders` | Order produksi | id, business_id, production_number, production_date, status, notes, created_by |
| 12 | `production_order_items` | Detail item produksi | id, production_order_id, product_id, variant_id, batch_id, quantity, production_cost |
| 13 | `supplier_receipts` | Penerimaan dari rekanan | id, business_id, supplier_id, receipt_number, receipt_date, status, notes, created_by |
| 14 | `supplier_receipt_items` | Detail penerimaan | id, receipt_id, product_id, variant_id, batch_id, quantity, cost |

### D. Inventory (3 tabel)

| # | Tabel | Fungsi | Kolom Utama |
|---|-------|--------|-------------|
| 15 | `stock_locations` | Lokasi stok | id, business_id, type (GUDANG/SALES/STORE/DISPLAY), reference_id, name |
| 16 | `stock_movements` | **Ledger stok** | id, business_id, product_id, variant_id, batch_id, from_location_id, to_location_id, quantity, movement_type, reference_type, reference_id, created_by, notes |
| 17 | `stock_balances` | Cache saldo stok | id, business_id, location_id, product_id, variant_id, batch_id, quantity |

### E. Agen (4 tabel)

| # | Tabel | Fungsi | Kolom Utama |
|---|-------|--------|-------------|
| 18 | `agents` | Data agen | id, business_id, code, name, contact_person, phone, email, address, status, notes |
| 19 | `agent_rules` | Ketentuan agen | id, business_id, agent_id, minimum_order, price_type, return_policy, status |
| 20 | `agent_orders` | Pesanan agen | id, business_id, agent_id, order_number, order_date, status, total, notes |
| 21 | `agent_order_items` | Detail pesanan | id, order_id, product_id, variant_id, batch_id, quantity, price, subtotal |

### F. Sales & Distribusi (3 tabel)

| # | Tabel | Fungsi | Kolom Utama |
|---|-------|--------|-------------|
| 22 | `sales` | Data sales | id, business_id, user_id, sales_code, name, phone, status, area |
| 23 | `distributions` | Distribusi barang | id, business_id, distribution_number, type (AGENT/SALES), target_id, date, status, notes, created_by |
| 24 | `distribution_items` | Detail distribusi | id, distribution_id, product_id, variant_id, batch_id, quantity |

### G. Toko & Konsinyasi (5 tabel)

| # | Tabel | Fungsi | Kolom Utama |
|---|-------|--------|-------------|
| 25 | `stores` | Data toko | id, business_id, store_code, name, owner_name, phone, address, latitude, longitude, type, status, notes |
| 26 | `sales_visits` | Kunjungan sales | id, business_id, sales_id, store_id, visit_date, latitude, longitude, notes, status |
| 27 | `sales_visit_items` | Detail kunjungan | id, visit_id, product_id, variant_id, batch_id, previous_qty, sold_qty, return_qty, new_qty, remaining_qty |
| 28 | `consignments` | Transaksi konsinyasi | id, business_id, sales_id, store_id, visit_id, consignment_number, date, status, notes |
| 29 | `consignment_items` | Detail konsinyasi | id, consignment_id, product_id, variant_id, batch_id, quantity |

### H. Display (3 tabel)

| # | Tabel | Fungsi | Kolom Utama |
|---|-------|--------|-------------|
| 30 | `displays` | Data display/wadah | id, business_id, display_code, name, type, capacity, condition, status |
| 31 | `display_assignments` | Penempatan display | id, business_id, display_id, sales_id, store_id, assigned_at, released_at, status, notes |
| 32 | `display_items` | Produk dalam display | id, display_id, product_id, variant_id, batch_id, quantity |

### I. Retur (2 tabel)

| # | Tabel | Fungsi | Kolom Utama |
|---|-------|--------|-------------|
| 33 | `returns` | Header retur | id, business_id, return_number, source_type, source_id, return_type (PRODUCTION_DEFECT/SHIPPING_DAMAGE/EXPIRED/DISPLAY_DAMAGE), destination_type, destination_id, status, return_date, created_by, verified_by, notes |
| 34 | `return_items` | Detail produk retur | id, return_id, product_id, variant_id, batch_id, quantity, condition, replacement_qty, notes |

---

## 🔐 Role & Navigasi

### Owner — Monitoring & Pengendalian
```text
├── Beranda (Dashboard ringkasan)
├── Monitoring
│   ├── Penjualan
│   ├── Stok
│   ├── Konsinyasi
│   ├── Sales
│   ├── Agen
│   └── Toko
├── Laporan
│   ├── Penjualan
│   ├── Stok
│   ├── Konsinyasi
│   ├── Retur
│   └── Aktivitas
├── Pengguna (User Management)
├── Profil Usaha
└── Pengaturan
```

### Admin — Operasional Harian
```text
├── Beranda (Dashboard operasional)
├── Produk
│   ├── Daftar Produk
│   ├── Produksi
│   ├── Batch
│   └── Penerimaan Rekanan
├── Stok
│   ├── Gudang
│   ├── Sales
│   ├── Toko
│   ├── Display
│   └── Mutasi Stok
├── Distribusi
│   ├── Agen
│   ├── Sales
│   └── Riwayat Distribusi
├── Agen
│   ├── Daftar Agen
│   ├── Pesanan
│   └── Retur
├── Sales
│   ├── Daftar Sales
│   ├── Aktivitas
│   └── Kunjungan
├── Toko
│   ├── Daftar Toko
│   ├── Kunjungan
│   ├── Konsinyasi
│   └── Stok Toko
├── Display
│   ├── Daftar Display
│   ├── Penempatan
│   └── Riwayat
├── Retur
│   ├── Pengajuan
│   ├── Proses Retur
│   └── Riwayat
├── Laporan
└── Master Data
    ├── Kategori
    ├── Varian
    ├── Satuan
    └── Rekanan
```

### Sales — Aktivitas Lapangan (Mobile-First PWA)
```text
├── Beranda (Stok saya, jadwal hari ini)
├── Toko
│   ├── Daftar Toko
│   ├── Tambah Toko
│   └── Kunjungan
├── Konsinyasi
│   ├── ★ Kunjungan Baru (Fast Action)
│   ├── Stok Toko
│   ├── Produk Terjual
│   ├── Produk Tersisa
│   └── Retur
├── Stok Saya
├── Display
│   ├── Display Saya
│   ├── Penempatan
│   └── Isi Display
└── Riwayat
    ├── Kunjungan
    ├── Konsinyasi
    ├── Retur
    └── Display
```

---

## ⚡ Prinsip Arsitektur

### 1. Stock Ledger — Bukan Stok Manual
Stok **TIDAK** disimpan sebagai angka terpisah di tiap lokasi. Semua pergerakan stok dicatat di `stock_movements` sebagai ledger. Stok per lokasi **dihitung** dari total mutasi masuk minus mutasi keluar.

```text
STOK = Σ(mutasi masuk) - Σ(mutasi keluar)
```

### 2. Multi-Tenant Boundary
Hampir seluruh tabel operasional memiliki `business_id` sebagai **tenant boundary**. Middleware memastikan setiap query hanya mengakses data milik tenant yang aktif.

### 3. Batch Tracking
Produk dilacak hingga level **batch** — setiap perpindahan stok mencatat `batch_id`. Ini memungkinkan:
- Pelacakan expired date
- Retur per batch
- Traceability produk penuh

### 4. Separation of Concerns
- **Routes** → HTTP handling, validation, response
- **Services** → Business logic
- **DB** → Data access

### 5. Design System
- Soft color palette (cream, sage green, soft blue)
- Dark mode toggle
- Mobile-first untuk Sales interface
- Desktop-optimized untuk Owner & Admin

---

## 📅 Tahapan Implementasi

### Fase 1 — Foundation & Scaffolding
Setup project, database schema, tooling, dan konfigurasi dasar.

### Fase 2 — Auth & Onboarding
Register, login, pendaftaran usaha, user management, layout per role.

### Fase 3 — Master Data & Produk
Produk, kategori, varian, satuan, rekanan, upload foto.

### Fase 4 — Produksi & Inventory
Batch, stock ledger, mutasi stok, expired tracking.

### Fase 5 — Agen & Distribusi Agen
Data agen, MOQ, pesanan, distribusi, transaksi.

### Fase 6 — Sales, Toko & Konsinyasi
Sales, toko, kunjungan, konsinyasi, stok toko, mobile view.

### Fase 7 — Display & Retur
Wadah/display, penempatan, perpindahan, 4 jenis retur.

### Fase 8 — Dashboard, Laporan & Polish
Dashboard per role, laporan, pengaturan, PWA polish, testing.

> Detail task per fase ada di file `TASK_PLAN.md`
