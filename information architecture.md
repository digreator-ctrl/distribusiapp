Berdasarkan alur yang sudah kita rapikan, saya sarankan arsitekturnya dibuat **multi-tenant SaaS** dengan `Usaha` sebagai batas utama data. Jadi satu akun dapat menjadi Owner dari satu usaha, dan seluruh data operasional usaha berada di dalam tenant tersebut.

# 1. Information Architecture

```text
APLIKASI MANAJEMEN PENJUALAN & KONSINYASI
│
├── 01. ONBOARDING
│   ├── Registrasi Akun
│   ├── Profil Pengguna
│   └── Pendaftaran Usaha
│
├── 02. DASHBOARD
│   ├── Ringkasan Penjualan
│   ├── Ringkasan Stok
│   ├── Konsinyasi
│   ├── Retur
│   └── Aktivitas
│
├── 03. MASTER DATA
│   ├── Produk
│   ├── Kategori Produk
│   ├── Varian Produk
│   ├── Satuan
│   ├── Rekanan
│   ├── Agen
│   ├── Sales
│   ├── Toko
│   └── Display/Wadah
│
├── 04. PRODUK & PRODUKSI
│   ├── Produk
│   ├── Produksi
│   ├── Batch Produk
│   └── Penerimaan Produk Rekanan
│
├── 05. PERSEDIAAN / STOK
│   ├── Stok Gudang
│   ├── Stok Sales
│   ├── Stok Toko
│   ├── Stok Display
│   ├── Mutasi Stok
│   └── Riwayat Stok
│
├── 06. DISTRIBUSI
│   ├── Distribusi Agen
│   ├── Distribusi Sales
│   ├── Penitipan Konsinyasi
│   └── Riwayat Distribusi
│
├── 07. AGEN
│   ├── Daftar Agen
│   ├── Pesanan Agen
│   ├── Transaksi Agen
│   ├── Ketentuan Agen
│   └── Retur Agen
│
├── 08. SALES
│   ├── Daftar Sales
│   ├── Aktivitas Sales
│   ├── Stok Sales
│   ├── Kunjungan
│   └── Target/Monitoring
│
├── 09. TOKO & KONSINYASI
│   ├── Daftar Toko
│   ├── Kunjungan Toko
│   ├── Stok Toko
│   ├── Penjualan Toko
│   ├── Penitipan Produk
│   └── Riwayat Konsinyasi
│
├── 10. DISPLAY / WADAH
│   ├── Daftar Display
│   ├── Penempatan Display
│   ├── Isi Display
│   ├── Perpindahan Display
│   └── Riwayat Display
│
├── 11. RETUR
│   ├── Pengajuan Retur
│   ├── Retur Agen
│   ├── Retur Sales
│   ├── Retur Toko
│   ├── Retur Produksi
│   └── Riwayat Retur
│
├── 12. LAPORAN
│   ├── Laporan Produk
│   ├── Laporan Stok
│   ├── Laporan Penjualan
│   ├── Laporan Konsinyasi
│   ├── Laporan Sales
│   ├── Laporan Agen
│   ├── Laporan Toko
│   ├── Laporan Retur
│   └── Laporan Display
│
└── 13. PENGATURAN
    ├── Profil Usaha
    ├── Pengguna
    ├── Role & Permission
    ├── Harga
    ├── Ketentuan Agen
    ├── Ketentuan Konsinyasi
    ├── Ketentuan Retur
    └── Pengaturan Sistem
```

---

# 2. Struktur Navigasi

Saya sarankan **menu tidak dibuat sama untuk semua role**. Satu aplikasi memiliki tiga interface berdasarkan tugas.

## A. Owner

```text
OWNER
│
├── Beranda
│
├── Monitoring
│   ├── Penjualan
│   ├── Stok
│   ├── Konsinyasi
│   ├── Sales
│   ├── Agen
│   └── Toko
│
├── Laporan
│   ├── Penjualan
│   ├── Stok
│   ├── Konsinyasi
│   ├── Retur
│   └── Aktivitas
│
├── Pengguna
│
├── Profil Usaha
│
└── Pengaturan
```

Owner lebih banyak **monitoring dan pengendalian**, bukan melakukan input operasional harian.

---

# 3. Navigasi Admin

Admin merupakan pengguna operasional utama.

```text
ADMIN
│
├── Beranda
│
├── Produk
│   ├── Daftar Produk
│   ├── Produksi
│   ├── Batch
│   └── Penerimaan Rekanan
│
├── Stok
│   ├── Gudang
│   ├── Sales
│   ├── Toko
│   ├── Display
│   └── Mutasi Stok
│
├── Distribusi
│   ├── Agen
│   ├── Sales
│   └── Riwayat Distribusi
│
├── Agen
│   ├── Daftar Agen
│   ├── Pesanan
│   └── Retur
│
├── Sales
│   ├── Daftar Sales
│   ├── Aktivitas
│   └── Kunjungan
│
├── Toko
│   ├── Daftar Toko
│   ├── Kunjungan
│   ├── Konsinyasi
│   └── Stok Toko
│
├── Display
│   ├── Daftar Display
│   ├── Penempatan
│   └── Riwayat
│
├── Retur
│   ├── Pengajuan
│   ├── Proses Retur
│   └── Riwayat
│
├── Laporan
│
└── Master Data
    ├── Kategori
    ├── Varian
    ├── Satuan
    └── Rekanan
```

---

# 4. Navigasi Sales

Interface Sales harus jauh lebih sederhana karena digunakan di lapangan melalui PWA/mobile.

```text
SALES
│
├── Beranda
│
├── Toko
│   ├── Daftar Toko
│   ├── Tambah Toko
│   └── Kunjungan
│
├── Konsinyasi
│   ├── Kunjungan Baru
│   ├── Stok Toko
│   ├── Produk Terjual
│   ├── Produk Tersisa
│   └── Retur
│
├── Stok Saya
│
├── Display
│   ├── Display Saya
│   ├── Penempatan
│   └── Isi Display
│
└── Riwayat
    ├── Kunjungan
    ├── Konsinyasi
    ├── Retur
    └── Display
```

Untuk Sales, saya justru menyarankan **Kunjungan Baru** menjadi tombol aksi utama/Fast Action.

---

# 5. Modul dan Fitur

## Modul 01 — Account & Onboarding

| Fitur             | Fungsi                    |
| ----------------- | ------------------------- |
| Registrasi        | Membuat akun              |
| Login             | Autentikasi               |
| Profil Pengguna   | Data pengguna             |
| Pendaftaran Usaha | Membuat tenant/usaha      |
| Profil Usaha      | Mengelola identitas usaha |
| User Management   | Menambah pengguna         |
| Role              | Menentukan peran          |
| Permission        | Membatasi akses           |

Alur:

```text
Registrasi
   ↓
Account
   ↓
Owner
   ↓
Daftar Usaha
   ↓
Usaha Aktif
   ↓
Kelola Aplikasi
```

---

# 6. Modul Produk

Produk sebaiknya **dipisahkan dari batch**.

Ini penting.

```text
PRODUK
│
├── Produk A
│   ├── Varian Original
│   ├── Varian Cokelat
│   └── Varian Pedas
│
└── Produk B
    └── Varian Original
```

Sedangkan batch:

```text
Produk A
│
├── Batch A-001
│   ├── Produksi: 01-09-2026
│   └── Exp: 01-12-2026
│
└── Batch A-002
    ├── Produksi: 15-09-2026
    └── Exp: 15-12-2026
```

### Fitur

* Tambah Produk
* Edit Produk
* Kategori
* Varian
* Satuan
* Harga Produksi
* Harga Sales
* Harga Agen
* Status Produk
* Foto Produk
* Batch Produk

---

# 7. Modul Produksi

Mendukung dua sumber produk.

```text
SUMBER PRODUK
│
├── PRODUKSI SENDIRI
│
└── REKANAN
```

### Produksi sendiri

```text
Buat Produksi
    ↓
Pilih Produk
    ↓
Input Batch
    ↓
Tanggal Produksi
    ↓
Tanggal Expired
    ↓
Jumlah
    ↓
Produksi Selesai
    ↓
Stok Gudang Bertambah
```

### Produk Rekanan

```text
Rekanan
   ↓
Pengiriman Produk
   ↓
Penerimaan
   ↓
Verifikasi Admin
   ↓
Batch
   ↓
Stok Gudang Bertambah
```

---

# 8. Modul Inventory / Stok

Ini merupakan salah satu modul **paling penting**.

Saya menyarankan jangan membuat stok sebagai angka yang diubah langsung.

Gunakan konsep:

> **Stock Movement / Mutasi Stok**

Contoh:

```text
Produksi +100
     ↓
Gudang 100
     ↓
Sales -20
     ↓
Gudang 80
Sales 20
     ↓
Sales titip ke Toko -10
     ↓
Sales 10
Toko 10
     ↓
Terjual -4
     ↓
Toko 6
```

Dengan demikian setiap perubahan stok memiliki histori.

### Fitur

* Stok Gudang
* Stok Sales
* Stok Toko
* Stok Display
* Mutasi Stok
* Adjustment
* Stock Opname
* Riwayat Stok
* Batch Tracking
* Expired Tracking

---

# 9. Modul Agen

### Fitur

* Data Agen
* Ketentuan Agen
* Harga Agen
* Minimum Order
* Pesanan Agen
* Pemenuhan Pesanan
* Pengeluaran Barang
* Riwayat Transaksi
* Retur Agen

Alur:

```text
Agen
 ↓
Pesanan
 ↓
Validasi MOQ
 ↓
Persiapan Barang
 ↓
Pengeluaran Stok
 ↓
Transaksi
```

---

# 10. Modul Sales

### Fitur

* Data Sales
* Status Sales
* Area Sales
* Stok Sales
* Distribusi ke Sales
* Kunjungan
* Aktivitas
* Riwayat
* Monitoring

---

# 11. Modul Toko & Konsinyasi

### Fitur Toko

* Data Toko
* Pemilik
* Kontak
* Alamat
* Lokasi
* Status
* Sales Penanggung Jawab
* Riwayat Kunjungan

### Fitur Konsinyasi

* Penitipan Produk
* Stok Toko
* Produk Terjual
* Produk Tersisa
* Retur
* Penambahan Stok
* Riwayat Konsinyasi

Alur utama:

```text
Kunjungan
    ↓
Ambil Stok Sebelumnya
    ↓
Input Terjual
    ↓
Input Sisa
    ↓
Input Retur
    ↓
Tambah Stok Baru
    ↓
Simpan Kunjungan
```

---

# 12. Modul Display

Display bukan sekadar atribut toko.

Ia harus menjadi **entitas sendiri** karena dapat berpindah.

```text
DISPLAY-001
     │
     ├── Dimiliki Usaha
     │
     ├── Dibawa Sales A
     │
     ├── Ditempatkan di Toko X
     │
     ├── Berisi Produk A
     ├── Berisi Produk B
     │
     └── Dipindahkan ke Toko Y
```

### Fitur

* Daftar Display
* Kode Display
* Jenis Display
* Kapasitas
* Kondisi
* Penempatan
* Isi Display
* Perpindahan
* Riwayat Lokasi
* Riwayat Produk

---

# 13. Modul Retur

Retur menggunakan **jenis retur**.

```text
RETUR
│
├── Cacat Produksi
│       ↓
│   Produksi/Rekanan
│
├── Cacat Pengiriman
│       ↓
│   Gudang
│
├── Expired
│       ↓
│   Gudang
│
└── Cacat Display
        ↓
      Gudang
```

### Fitur

* Pengajuan Retur
* Verifikasi Retur
* Jenis Retur
* Detail Produk
* Batch
* Jumlah
* Kondisi
* Tujuan Retur
* Status Retur
* Penyelesaian Retur
* Penggantian Produk
* Riwayat

---

# 14. Modul Laporan

Laporan sebaiknya mengambil data dari transaksi/mutasi, bukan menjadi sumber data baru.

```text
DATA TRANSAKSI
      ↓
DATA MUTASI
      ↓
REPORTING ENGINE
      ↓
LAPORAN
```

### Laporan

**Produk**

* Produk
* Batch
* Produksi
* Expired

**Stok**

* Stok Gudang
* Stok Sales
* Stok Toko
* Stok Display
* Mutasi Stok

**Penjualan**

* Penjualan Agen
* Penjualan Konsinyasi
* Penjualan per Produk
* Penjualan per Sales
* Penjualan per Toko

**Retur**

* Retur per Jenis
* Retur per Produk
* Retur per Batch
* Retur per Toko
* Retur per Sales

---

# 15. Skema Database

Saya sarankan struktur database D1 dibuat seperti berikut.

```text
users
│
├── user_roles
│
└── business_members
          │
          ▼
       businesses
          │
          ├── products
          │      ├── product_variants
          │      └── product_batches
          │
          ├── suppliers
          │
          ├── agents
          │
          ├── sales
          │
          ├── stores
          │
          ├── displays
          │
          ├── production_orders
          │
          ├── stock_locations
          │
          ├── stock_movements
          │
          ├── agent_orders
          │
          ├── consignments
          │
          ├── sales_visits
          │
          ├── returns
          │
          └── reports
```

---

# 16. Entity Utama Database

## A. `users`

```text
users
-------------------------
id
name
email
password_hash
phone
avatar_url
status
created_at
updated_at
```

---

## B. `businesses`

```text
businesses
-------------------------
id
owner_user_id
name
slug
logo_url
phone
email
address
status
created_at
updated_at
```

`business_id` nantinya menjadi **tenant boundary** hampir di seluruh tabel operasional.

---

## C. `business_members`

```text
business_members
-------------------------
id
business_id
user_id
role_id
status
joined_at
created_at
updated_at
```

Dengan ini satu usaha dapat mempunyai:

```text
Business
│
├── Owner
├── Admin
├── Sales A
├── Sales B
└── Sales C
```

---

# 17. Produk

### `product_categories`

```text
id
business_id
name
description
status
created_at
updated_at
```

### `products`

```text
id
business_id
category_id
name
sku
description
product_type
status
image_url
created_at
updated_at
```

### `product_variants`

```text
id
business_id
product_id
name
sku
barcode
unit_id
price_production
price_sales
price_agent
status
created_at
updated_at
```

### `units`

```text
id
business_id
name
symbol
```

---

# 18. Rekanan

```text
suppliers
-------------------------
id
business_id
name
contact_person
phone
email
address
type
status
notes
created_at
updated_at
```

`type` dapat membedakan:

```text
REKANAN_PRODUKSI
```

---

# 19. Batch Produk

```text
product_batches
-------------------------
id
business_id
product_id
variant_id
batch_number
source_type
supplier_id
production_date
expired_date
quantity_initial
quantity_available
production_cost
status
created_at
updated_at
```

`source_type`:

```text
SELF_PRODUCTION
SUPPLIER
```

Dengan demikian:

```text
Batch 001
source = SELF_PRODUCTION

Batch 002
source = SUPPLIER
supplier_id = Supplier A
```

---

# 20. Produksi

```text
production_orders
-------------------------
id
business_id
production_number
production_date
status
notes
created_by
created_at
updated_at
```

Detail:

```text
production_order_items
-------------------------
id
production_order_id
product_id
variant_id
batch_id
quantity
production_cost
```

---

# 21. Agen

```text
agents
-------------------------
id
business_id
code
name
contact_person
phone
email
address
status
notes
created_at
updated_at
```

Ketentuan:

```text
agent_rules
-------------------------
id
business_id
agent_id
minimum_order
price_type
return_policy
status
created_at
updated_at
```

---

# 22. Sales

```text
sales
-------------------------
id
business_id
user_id
sales_code
name
phone
status
area
created_at
updated_at
```

Sales dapat dikaitkan dengan user aplikasi.

---

# 23. Toko

```text
stores
-------------------------
id
business_id
store_code
name
owner_name
phone
address
latitude
longitude
type
status
notes
created_at
updated_at
```

---

# 24. Kunjungan Sales

```text
sales_visits
-------------------------
id
business_id
sales_id
store_id
visit_date
latitude
longitude
notes
status
created_at
updated_at
```

Detail kunjungan:

```text
sales_visit_items
-------------------------
id
sales_visit_id
product_id
variant_id
batch_id
previous_quantity
sold_quantity
return_quantity
new_quantity
remaining_quantity
```

---

# 25. Konsinyasi

Untuk histori konsinyasi, saya sarankan jangan hanya menyimpan "stok toko".

Gunakan transaksi konsinyasi:

```text
consignments
-------------------------
id
business_id
sales_id
store_id
visit_id
consignment_number
date
status
notes
created_at
updated_at
```

Detail:

```text
consignment_items
-------------------------
id
consignment_id
product_id
variant_id
batch_id
quantity
```

Dengan ini sistem dapat mengetahui:

> Pada tanggal tertentu, Sales A menitipkan 20 produk Batch X ke Toko B.

---

# 26. Display

### `displays`

```text
id
business_id
display_code
name
type
capacity
condition
status
created_at
updated_at
```

Penempatan:

```text
display_assignments
-------------------------
id
business_id
display_id
sales_id
store_id
assigned_at
released_at
status
notes
```

Isi display:

```text
display_items
-------------------------
id
display_id
product_id
variant_id
batch_id
quantity
created_at
updated_at
```

Dengan struktur ini satu display bisa berisi:

```text
DISPLAY-001
│
├── Produk A / Original / Batch 01 / 10
├── Produk A / Cokelat  / Batch 02 / 10
└── Produk B / Original / Batch 03 / 5
```

---

# 27. Stok — Bagian Terpenting

Saya sarankan menggunakan konsep **Stock Ledger**.

### `stock_locations`

```text
id
business_id
type
reference_id
name
```

Contoh:

```text
GUDANG
SALES
STORE
DISPLAY
```

Kemudian seluruh perubahan stok dicatat di:

### `stock_movements`

```text
id
business_id
product_id
variant_id
batch_id

from_location_id
to_location_id

quantity

movement_type
reference_type
reference_id

created_by
created_at
notes
```

Contoh:

```text
Produksi:

NULL
 ↓
Gudang
+100
```

Distribusi ke Sales:

```text
Gudang
 ↓ -20
Sales A
 ↑ 20
```

Konsinyasi:

```text
Sales A
 ↓ -10
Toko B
 ↑ 10
```

Penjualan:

```text
Toko B
 ↓ -3
Terjual
```

Retur:

```text
Toko B
 ↓ -2
Gudang
 ↑ 2
```

Ini jauh lebih aman daripada menyimpan stok secara manual di banyak tabel.

---

# 28. Retur

```text
returns
-------------------------
id
business_id
return_number
source_type
source_id
return_type
destination_type
destination_id
status
return_date
created_by
verified_by
notes
created_at
updated_at
```

Detail:

```text
return_items
-------------------------
id
return_id
product_id
variant_id
batch_id
quantity
condition
replacement_quantity
notes
```

Jenis retur:

```text
PRODUCTION_DEFECT
SHIPPING_DAMAGE
EXPIRED
DISPLAY_DAMAGE
```

---

# 29. Relasi Utama

Secara sederhana ERD-nya:

```text
                         ┌──────────────┐
                         │    USERS     │
                         └──────┬───────┘
                                │
                                ▼
                      ┌──────────────────┐
                      │BUSINESS_MEMBERS  │
                      └────────┬─────────┘
                               │
                               ▼
                      ┌──────────────────┐
                      │    BUSINESSES    │
                      └────────┬─────────┘
                               │
        ┌──────────────┬───────┼────────┬──────────────┐
        │              │       │        │              │
        ▼              ▼       ▼        ▼              ▼
   PRODUCTS        SUPPLIERS SALES    AGENTS         STORES
        │              │       │        │              │
        ▼              │       │        │              │
 PRODUCT_VARIANTS      │       │        │              │
        │              │       │        │              │
        ▼              │       │        │              │
 PRODUCT_BATCHES ◄─────┘       │        │              │
        │                      │        │              │
        └──────────┬───────────┘        │              │
                   │                    │              │
                   ▼                    ▼              ▼
             STOCK_MOVEMENTS       AGENT_ORDERS   SALES_VISITS
                   │                                   │
                   │                                   ▼
                   │                              CONSIGNMENTS
                   │                                   │
                   │                                   ▼
                   │                            CONSIGNMENT_ITEMS
                   │
                   ▼
             STOCK_LOCATIONS
                   │
            ┌──────┼────────┐
            ▼      ▼        ▼
          GUDANG  SALES    TOKO
                              │
                              ▼
                          DISPLAY
                              │
                              ▼
                        DISPLAY_ITEMS


RETURNS
   │
   ├── Product
   ├── Batch
   ├── Sales
   ├── Store
   └── Destination
```

---

# 30. Hubungan Bisnis yang Paling Penting

Ada beberapa hubungan yang menurut saya **harus dipertahankan dalam desain database**:

```text
BUSINESS
   │
   ├── PRODUCT
   │      │
   │      └── VARIANT
   │             │
   │             └── BATCH
   │
   ├── SUPPLIER
   │
   ├── SALES
   │      │
   │      └── VISIT
   │              │
   │              └── STORE
   │
   ├── AGENT
   │
   ├── STORE
   │      │
   │      └── CONSIGNMENT
   │
   ├── DISPLAY
   │      │
   │      └── DISPLAY ITEM
   │
   ├── STOCK LOCATION
   │      │
   │      └── STOCK MOVEMENT
   │
   └── RETURN
```

---

# 31. Arsitektur Sistem Keseluruhan

Dengan stack yang Anda pilih, bentuk akhirnya bisa seperti ini:

```text
                         USERS
                           │
                           ▼
                ┌───────────────────┐
                │   PWA / Browser    │
                └─────────┬─────────┘
                          │
                          ▼
                ┌───────────────────┐
                │ React + Refine    │
                │ Tailwind          │
                │ shadcn/ui         │
                └─────────┬─────────┘
                          │
                       HTTPS
                          │
                          ▼
                ┌───────────────────┐
                │ Cloudflare Worker │
                │       Hono        │
                └───────┬───┬───────┘
                        │   │
              ┌─────────┘   └─────────┐
              ▼                       ▼
       ┌──────────────┐       ┌──────────────┐
       │ Cloudflare D1│       │ Cloudflare R2 │
       │              │       │              │
       │ Relational   │       │ Images       │
       │ Database     │       │ Documents    │
       │              │       │ Photos       │
       └──────────────┘       └──────────────┘
```

## 32. Struktur Modul Final

Jika diringkas menjadi arsitektur aplikasi:

```text
APLIKASI
│
├── ACCOUNT
│
├── ONBOARDING
│
├── DASHBOARD
│
├── MASTER DATA
│   ├── Produk
│   ├── Kategori
│   ├── Varian
│   ├── Satuan
│   ├── Rekanan
│   ├── Agen
│   ├── Sales
│   ├── Toko
│   └── Display
│
├── PRODUK & PRODUKSI
│
├── INVENTORY
│
├── DISTRIBUSI
│   ├── Agen
│   └── Sales
│
├── KONSINYASI
│
├── SALES ACTIVITY
│
├── DISPLAY
│
├── RETUR
│
├── LAPORAN
│
└── PENGATURAN
```

### Satu prinsip penting untuk implementasinya

Untuk aplikasi ini, **jangan membuat tabel `stok_gudang`, `stok_sales`, `stok_toko`, dan `stok_display` sebagai sumber stok yang berdiri sendiri**. Lebih aman menjadikan **`stock_movements` sebagai ledger/pergerakan stok**, sedangkan stok per lokasi dihitung dari mutasi atau menggunakan tabel saldo/cache yang selalu diturunkan dari ledger.

Dengan begitu, kita bisa menjawab pertanyaan penting seperti:

> "Produk Batch A sekarang ada di mana?"

> "Produk ini sebelumnya pernah dititipkan ke toko mana?"

> "Sales mana yang membawa produk tersebut?"

> "Berapa produk yang masuk, terjual, tersisa, dan diretur?"

> "Produk yang diretur ini berasal dari batch mana?"

> "Display nomor D-001 sekarang berada di toko mana dan sebelumnya pernah berada di mana?"

tanpa kehilangan **audit trail**.
