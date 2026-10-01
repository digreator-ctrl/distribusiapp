# Rencana Pembangunan Sistem Distribusi & Konsinyasi (V2)

Berdasarkan `dokumentasialursistem.md` dan `rancanganarsitek.md`, dokumen ini memuat rancangan arsitektur dan peta jalan untuk sistem distribusi dan konsinyasi dengan pendekatan *SaaS (Multi-tenant)*.

## 1. Stack Teknologi
*   **Frontend**: React, [Refine](https://refine.dev/), Tailwind CSS, Shadcn UI.
*   **Backend**: [Hono](https://hono.dev/) (Framework ringan berbasis web standards).
*   **Database**: Cloudflare D1 (Serverless SQLite).
*   **Storage**: Cloudflare R2 (Object Storage).
*   **Deployment**: Cloudflare Pages (Frontend) & Cloudflare Workers (Backend).
*   **Platform Target**: Progressive Web App (PWA) untuk mendukung *offline-first* bagi petugas lapangan.

## 2. Struktur Database (Cloudflare D1)
Sistem *multi-tenant* mengharuskan setiap tabel transaksi dan master (kecuali tabel global) memiliki kolom `tenant_id`.

Entitas Utama:
- **Tenants**: Data penyewa SaaS (Misal: PT Distributor A).
- **Users**: Admin, Owner, Sales.
- **Suppliers / Produsen**: Data mitra atau produsen eksternal untuk sistem titipan/konsinyasi barang masuk.
- **Products & Variants**: Master produk dan SKU. Produk bisa jadi milik internal atau titipan dari `supplier_id` tertentu.
- **Inbound Batches**: Catatan stok masuk (produksi sendiri atau kiriman dari supplier).

*   `tenants`: Entitas usaha/pemilik (*Owner*).
*   `users`: Pengguna aplikasi dengan hak akses (`owner`, `admin`, `sales`).
*   `products`: Data master produk beserta 3 tingkatan harga (produksi, sales, agen).
*   `inbound_batches`: Pencatatan stok masuk (*batch*, tanggal produksi, kedaluwarsa, sumber produksi).
*   `stores`: Data master toko mitra/konsinyasi.
*   `display_assets`: Wadah/Rak display untuk pelacakan aset fisik di lapangan.
*   `consignments`: Transaksi penitipan barang di toko (mencatat stok awal, laku, retur, sisa).
*   `returns`: Transaksi retur barang berdasarkan klasifikasi (cacat produksi, cacat pengiriman, kedaluwarsa, cacat display).

## 3. Peta Jalan Implementasi

*   **Tahap 1: Scaffolding Proyek** ✅
    *   Setup *backend* (Hono + Workers).
    *   Setup *frontend* (React Vite + Refine + Tailwind + Shadcn UI).

*   **Tahap 2: Backend & Database (Hono + D1)** 🔄 *(Saat ini)*
    *   Membuat skema SQL (DDL).
    *   Membuat API *endpoint* (CRUD) standar.
    *   Menerapkan *Authentication* (JWT) dan RBAC.

*   **Tahap 3: Frontend - Fondasi (Refine)**
    *   Konfigurasi `authProvider` dan `dataProvider` Refine.
    *   Konfigurasi *Routing* dan *Layout*.

*   **Tahap 4: Frontend - Tampilan Web Dashboard (Owner & Admin)**
    *   Modul Manajemen Tenant & Karyawan.
    *   Modul Inventory & Harga.
    *   Modul Outbound & Retur Gudang.

*   **Tahap 5: Frontend - Tampilan PWA Mobile (Sales)**
    *   UI berbasis *mobile/bottom navigation*.
    *   Modul Kunjungan Toko & Opname Konsinyasi.
    *   Modul Pelacakan Aset Display.
