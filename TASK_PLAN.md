# ✅ Task Plan — Sistem Manajemen Penjualan & Konsinyasi

> Dokumen ini melacak progress implementasi per fase.
> Tandai `[x]` jika task sudah selesai.

---

## 📊 Progress Summary

| Fase | Nama | Status | Progress |
|------|------|--------|----------|
| 1 | Foundation & Scaffolding | ✅ Selesai | 8/8 |
| 2 | Auth & Onboarding | ✅ Selesai | 12/12 |
| 3 | Master Data & Produk | ✅ Selesai | 10/10 |
| 4 | Produksi & Inventory | ✅ Selesai | 12/12 |
| 5 | Agen & Distribusi | ✅ Selesai | 9/9 |
| 6 | Sales, Toko & Konsinyasi | ✅ Selesai | 21/21 |
| 7 | Display & Retur | ✅ Selesai | 18/18 |
| 8 | Dashboard, Laporan & Polish | ✅ Selesai | 15/15 |

**Total: 105/105 tasks**

---

## 🔷 Fase 1 — Foundation & Scaffolding

> Setup project, database schema, tooling, dan konfigurasi dasar.

- [x] **1.1** Inisialisasi monorepo — Root `package.json` dengan workspace (frontend + backend)
- [x] **1.2** Setup backend Hono — `wrangler.toml`, Hono app, D1 + R2 binding, Miniflare local dev
- [x] **1.3** Setup frontend Vite + React — Vite + React 18 + TypeScript
- [x] **1.4** Setup Refine v4 — Data provider (REST API ke Hono), auth provider, react-router routing
- [x] **1.5** Setup Tailwind + shadcn/ui — Install & konfigurasi komponen dasar, soft color palette, dark mode
- [x] **1.6** Setup PWA — `vite-plugin-pwa`, manifest, service worker, icons
- [x] **1.7** Database schema (D1) — Seluruh 34 tabel sesuai arsitektur (`schema.sql`)
- [x] **1.8** Middleware dasar — CORS, auth middleware, tenant middleware, role middleware

---

## 🔷 Fase 2 — Auth & Onboarding

> Registrasi, login, pendaftaran usaha, dan manajemen pengguna.

### Backend API
- [x] **2.1** API: Register — `POST /api/auth/register` — buat user, otomatis jadi Owner
- [x] **2.2** API: Login — `POST /api/auth/login` — JWT token
- [x] **2.3** API: Profil Pengguna — `GET/PUT /api/auth/profile`
- [x] **2.4** API: Pendaftaran Usaha — `POST /api/businesses` — Owner membuat tenant
- [x] **2.5** API: Profil Usaha — `GET/PUT /api/businesses/:id`
- [x] **2.6** API: User Management — CRUD pengguna dalam usaha (Owner menambah Admin/Sales)
- [x] **2.7** API: Role & Permission — Assign role ke member

### Frontend UI
- [x] **2.8** UI: Halaman Register — Form registrasi akun
- [x] **2.9** UI: Halaman Login — Form login
- [x] **2.10** UI: Onboarding Usaha — Wizard pendaftaran usaha setelah registrasi
- [x] **2.11** UI: Manajemen Pengguna — Daftar, tambah, edit, hapus pengguna
- [x] **2.12** UI: Layout per Role — Sidebar/navigasi berbeda untuk Owner, Admin, Sales

---

## 🔷 Fase 3 — Master Data & Produk

> Pengelolaan data dasar: produk, kategori, varian, satuan, rekanan.

### Backend API
- [x] **3.1** API: Kategori Produk — CRUD `product_categories`
- [x] **3.2** API: Satuan — CRUD `units`
- [x] **3.3** API: Produk — CRUD `products` (nama, SKU, kategori, foto, harga)
- [x] **3.4** API: Varian Produk — CRUD `product_variants` (SKU, barcode, harga per tipe)
- [x] **3.5** API: Rekanan/Supplier — CRUD `suppliers`
- [x] **3.6** API: Upload Foto — R2 upload endpoint untuk foto produk

### Frontend UI
- [x] **3.7** UI: Daftar Produk — Tabel produk dengan filter, search, pagination
- [x] **3.8** UI: Form Produk — Tambah/edit produk + varian + harga
- [x] **3.9** UI: Kategori & Satuan — Halaman master data
- [x] **3.10** UI: Rekanan — CRUD rekanan

---

## 🔷 Fase 4 — Produksi & Inventory

> Pencatatan produksi, batch, penerimaan rekanan, dan stock ledger.

### Backend API
- [x] **4.1** API: Produksi Sendiri — Buat order produksi → batch → stok gudang bertambah
- [x] **4.2** API: Penerimaan Rekanan — Terima produk dari supplier → verifikasi → batch → stok gudang
- [x] **4.3** API: Batch Produk — CRUD `product_batches` (batch number, produksi, exp, qty)
- [x] **4.4** API: Stock Locations — Setup lokasi stok (Gudang, Sales, Toko, Display)
- [x] **4.5** API: Stock Movements — Ledger-based stock tracking
- [x] **4.6** API: Stok per Lokasi — Query stok gudang, sales, toko, display (dari movements)
- [x] **4.7** API: Mutasi Stok — Riwayat seluruh pergerakan stok

### Frontend UI
- [x] **4.8** UI: Produksi — Form buat produksi, pilih produk, input batch
- [x] **4.9** UI: Penerimaan Rekanan — Form terima produk dari rekanan
- [x] **4.10** UI: Stok Gudang — Dashboard stok gudang dengan batch tracking
- [x] **4.11** UI: Mutasi Stok — Riwayat pergerakan stok
- [x] **4.12** UI: Expired Tracking — Alert produk mendekati/melewati exp

---

## 🔷 Fase 5 — Agen & Distribusi Agen

> Manajemen agen, pesanan, MOQ, dan distribusi ke agen.

### Backend API
- [x] **5.1** API: Agen — CRUD `agents`
- [x] **5.2** API: Ketentuan Agen — `agent_rules` (MOQ, harga, kebijakan retur)
- [x] **5.3** API: Pesanan Agen — Buat pesanan → validasi MOQ → siapkan barang
- [x] **5.4** API: Distribusi Agen — Keluarkan stok gudang → agen (stock movement)
- [x] **5.5** API: Transaksi Agen — Riwayat transaksi penjualan ke agen

### Frontend UI
- [x] **5.6** UI: Daftar Agen — Tabel agen + ketentuan
- [x] **5.7** UI: Pesanan Agen — Form pesanan, validasi MOQ, approval
- [x] **5.8** UI: Distribusi Agen — Proses pengeluaran barang
- [x] **5.9** UI: Riwayat Transaksi Agen — History transaksi agen

---

## 🔷 Fase 6 — Sales, Toko & Konsinyasi

> Inti sistem — distribusi ke sales, kunjungan toko, konsinyasi, dan monitoring.

### Backend API
- [x] **6.1** API: Sales — CRUD `sales` (data sales, area, status)
- [x] **6.2** API: Distribusi ke Sales — Gudang → Sales (stock movement)
- [x] **6.3** API: Stok Sales — Query stok yang dibawa sales
- [x] **6.4** API: Toko — CRUD `stores` (nama, alamat, pemilik, lokasi GPS)
- [x] **6.5** API: Kunjungan Sales — `sales_visits`
- [x] **6.6** API: Detail Kunjungan — `sales_visit_items` (terjual, sisa, retur per produk)
- [x] **6.7** API: Konsinyasi — `consignments` + `consignment_items`
- [x] **6.8** API: Stok Toko — Query stok per toko (dari movements)
- [x] **6.9** API: Penjualan Konsinyasi — Catat produk terjual → stock movement

### Frontend UI
- [x] **6.10** UI: Daftar Sales — Tabel sales + area + status
- [x] **6.11** UI: Distribusi ke Sales — Form distribusi barang ke sales
- [x] **6.12** UI: Stok Sales — Dashboard stok yang dibawa sales
- [x] **6.13** UI: Daftar Toko — Tabel toko dengan filter per sales
- [x] **6.14** UI: Tambah Toko — Form pendaftaran toko baru (oleh Sales di lapangan)
- [x] **6.15** UI: Kunjungan Baru — **Flow utama Sales** — wizard kunjungan toko
- [x] **6.16** UI: Cek Stok Lama — Review stok konsinyasi sebelumnya
- [x] **6.17** UI: Input Terjual/Sisa/Retur — Form input per produk/varian/batch
- [x] **6.18** UI: Tambah Stok Baru — Pilih produk baru untuk dititipkan
- [x] **6.19** UI: Stok Toko — Dashboard stok per toko
- [x] **6.20** UI: Riwayat Kunjungan — History kunjungan per toko/sales
- [x] **6.21** UI: Sales Mobile View — Interface Sales **mobile-first** (PWA)

---

## 🔷 Fase 7 — Display & Retur

> Pengelolaan wadah/display dan sistem retur yang lengkap.

### Backend API
- [x] **7.1** API: Display — CRUD `displays` (kode, jenis, kapasitas, kondisi)
- [x] **7.2** API: Penempatan Display — `display_assignments` (assign ke sales/toko)
- [x] **7.3** API: Isi Display — `display_items` (produk dalam display)
- [x] **7.4** API: Perpindahan Display — Pindah display antar toko (histori)
- [x] **7.5** API: Retur — CRUD `returns` + `return_items`
- [x] **7.6** API: Jenis Retur — 4 kategori (cacat produksi, pengiriman, expired, display)
- [x] **7.7** API: Tujuan Retur — Routing otomatis (cacat produksi → rekanan, lainnya → gudang)
- [x] **7.8** API: Verifikasi Retur — Approve/reject retur oleh Admin
- [x] **7.9** API: Penggantian Produk — Retur agen → ganti produk baru

### Frontend UI
- [x] **7.10** UI: Daftar Display — Tabel display + lokasi + status
- [x] **7.11** UI: Penempatan Display — Form assign display ke toko
- [x] **7.12** UI: Isi Display — Lihat produk dalam display
- [x] **7.13** UI: Perpindahan Display — Form pindah display
- [x] **7.14** UI: Riwayat Display — History lokasi display
- [x] **7.15** UI: Pengajuan Retur — Form retur (Sales/Admin)
- [x] **7.16** UI: Verifikasi Retur — Approval retur (Admin)
- [x] **7.17** UI: Proses Retur — Penyelesaian retur + penggantian
- [x] **7.18** UI: Riwayat Retur — History retur

---

## 🔷 Fase 8 — Dashboard, Laporan & Polish

> Dashboard per role, laporan, dan finalisasi aplikasi.

### Backend API
- [x] **8.1** API: Dashboard Owner — Ringkasan penjualan, stok, konsinyasi, retur
- [x] **8.2** API: Dashboard Admin — Ringkasan operasional harian
- [x] **8.3** API: Dashboard Sales — Stok saya, toko, kunjungan hari ini
- [x] **8.4** API: Laporan Produk — Produk, batch, produksi, expired
- [x] **8.5** API: Laporan Stok — Stok per lokasi, mutasi
- [x] **8.6** API: Laporan Penjualan — Per agen, konsinyasi, produk, sales, toko
- [x] **8.7** API: Laporan Retur — Per jenis, produk, batch, toko, sales

### Frontend UI
- [x] **8.8** UI: Dashboard Owner — Cards, charts, monitoring
- [x] **8.9** UI: Dashboard Admin — Overview operasional
- [x] **8.10** UI: Dashboard Sales — Quick actions, stok, jadwal kunjungan
- [x] **8.11** UI: Halaman Laporan — Filter + tabel + export
- [x] **8.12** UI: Pengaturan Usaha — Profil usaha, harga, ketentuan

### Finalisasi
- [x] **8.13** PWA Polish — Offline capability, push notification
- [x] **8.14** Performance — Query optimization, caching
- [x] **8.15** Testing — End-to-end testing flows utama

---

## 📝 Catatan

- **Fase 5** (Agen) dan **Fase 6** (Sales/Konsinyasi) bisa dikerjakan **paralel** karena keduanya bergantung pada Fase 4 tetapi tidak saling tergantung.
- Setiap fase menghasilkan fungsionalitas yang **dapat diuji secara independen**.
- Task plan ini akan di-update seiring progress implementasi.

## 🔷 Fase 9 — Implementasi UI Detail (Berdasarkan modul.md & strukturnavigasi.md)

> Fase ini bertujuan untuk merapikan dan membuat seluruh halaman UI (terutama Dashboard dan Monitoring) menjadi persis sesuai dengan rincian di dokumen `modul.md`.

### 9.1 Owner Monitoring & Laporan
- [x] **9.1.1** UI: Ringkasan Penjualan (`SalesSummary.tsx`) - Menggunakan visual modern
- [x] **9.1.2** UI: Ringkasan Stok (`StockSummary.tsx`)
- [x] **9.1.3** UI: Konsinyasi & Retur Monitoring (Owner)
- [x] **9.1.4** UI: Modul Laporan Owner (Penjualan, Stok, Agen, Sales)

### 9.2 Admin Operasional Utama
- [ ] **9.2.1** UI: Master Data Produk Lengkap (Varian, Satuan, Harga)
- [x] **9.2.2** UI: Stok Gudang & Riwayat Mutasi Stok
- [ ] **9.2.3** UI: Stock Opname
- [x] **9.2.4** UI: Riwayat Distribusi (Sales & Agen)
- [x] **9.2.5** UI: Verifikasi Retur (Menunggu Verifikasi)

### 9.3 PWA Sales & Konsinyasi
- [x] **9.3.1** UI: Stok Saya (My Stock) untuk Sales
- [x] **9.3.2** UI: Kunjungan Toko (Penyempurnaan 8-step flow)
- [x] **9.3.3** UI: Modul Display (Daftar, Penempatan, Isi)

### 9.4 Integrasi Navigasi & Struktur
- [x] **9.4.1** Scaffold halaman kosong (Placeholder Component) untuk semua submenu di `Sidebar.tsx` agar tidak error (404).
- [x] **9.4.2** Pembaruan final pada `App.tsx` (Route mapping untuk 40+ rute)

---

## 🔄 Changelog

"
| Tanggal | Perubahan |
|---------|-----------|
| 2026-09-29 | Initial task plan dibuat |
