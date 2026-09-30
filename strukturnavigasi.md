Berdasarkan alur bisnis yang Anda berikan, saya sarankan **struktur navigasi jangan dibuat berdasarkan tabel database**, tetapi berdasarkan **alur kerja masing-masing role**.

Karena ada 3 pengguna utama — **Owner, Admin, Sales** — maka satu aplikasi memiliki **3 navigasi/interface berbeda**, tetapi menggunakan data yang sama.

# 1. Struktur Navigasi Utama

```text
APLIKASI
│
├── AUTHENTICATION
│   ├── Login
│   ├── Registrasi
│   ├── Lupa Password
│   └── Reset Password
│
└── SETELAH LOGIN
    │
    ├── OWNER
    │
    ├── ADMIN
    │
    └── SALES
```

---

# 2. NAVIGASI OWNER

Owner berfungsi sebagai **pemilik usaha dan pengambil keputusan/monitoring**, bukan sebagai operator utama.

```text
OWNER
│
├── Beranda
│
├── Monitoring
│   ├── Ringkasan Penjualan
│   ├── Ringkasan Stok
│   ├── Stok Gudang
│   ├── Stok Sales
│   ├── Stok Toko
│   ├── Stok Display
│   ├── Konsinyasi
│   ├── Agen
│   ├── Sales
│   └── Retur
│
├── Produk
│   ├── Semua Produk
│   ├── Produk Produksi Sendiri
│   └── Produk Rekanan
│
├── Distribusi
│   ├── Agen
│   └── Konsinyasi
│
├── Sales
│   ├── Daftar Sales
│   ├── Aktivitas Sales
│   └── Kunjungan
│
├── Toko
│   ├── Daftar Toko
│   ├── Status Konsinyasi
│   └── Riwayat Kunjungan
│
├── Display
│   ├── Daftar Display
│   ├── Display Aktif
│   └── Riwayat Display
│
├── Retur
│   ├── Semua Retur
│   ├── Retur Produksi
│   ├── Retur Pengiriman
│   ├── Retur Expired
│   └── Retur Display
│
├── Laporan
│   ├── Laporan Penjualan
│   ├── Laporan Stok
│   ├── Laporan Konsinyasi
│   ├── Laporan Agen
│   ├── Laporan Sales
│   ├── Laporan Toko
│   ├── Laporan Retur
│   └── Laporan Display
│
├── Pengguna
│   ├── Daftar Pengguna
│   ├── Admin
│   └── Sales
│
└── Pengaturan
    ├── Profil Usaha
    ├── Pengaturan Harga
    ├── Aturan Agen
    ├── Aturan Konsinyasi
    ├── Aturan Retur
    └── Pengaturan Sistem
```

### Fokus Owner

```text
OWNER
  │
  ├── Melihat
  ├── Memantau
  ├── Mengontrol
  ├── Mengatur
  └── Melihat Laporan
```

---

# 3. NAVIGASI ADMIN

Admin adalah **pusat operasional sistem**.

Karena Admin mengelola produk setelah produksi/penerimaan, stok, distribusi, retur dan master data, navigasinya paling lengkap.

```text
ADMIN
│
├── Beranda
│
├── Produk
│   ├── Semua Produk
│   ├── Kategori
│   ├── Varian
│   ├── Satuan
│   └── Harga
│
├── Produksi
│   ├── Produksi Sendiri
│   ├── Penerimaan Rekanan
│   ├── Batch Produksi
│   └── Riwayat Produksi
│
├── Stok
│   ├── Stok Gudang
│   ├── Stok Sales
│   ├── Stok Toko
│   ├── Stok Display
│   ├── Mutasi Stok
│   └── Stock Opname
│
├── Distribusi
│   ├── Distribusi ke Agen
│   ├── Distribusi ke Sales
│   └── Riwayat Distribusi
│
├── Agen
│   ├── Daftar Agen
│   ├── Ketentuan Agen
│   ├── Pesanan Agen
│   ├── Penjualan Agen
│   └── Retur Agen
│
├── Sales
│   ├── Daftar Sales
│   ├── Stok Sales
│   ├── Distribusi Sales
│   ├── Aktivitas Sales
│   └── Kunjungan
│
├── Toko
│   ├── Daftar Toko
│   ├── Data Konsinyasi
│   ├── Stok Toko
│   ├── Penjualan Toko
│   ├── Retur Toko
│   └── Riwayat Kunjungan
│
├── Display
│   ├── Daftar Display
│   ├── Penempatan Display
│   ├── Isi Display
│   ├── Perpindahan Display
│   └── Riwayat Display
│
├── Retur
│   ├── Semua Retur
│   ├── Menunggu Verifikasi
│   ├── Retur Produksi
│   ├── Retur Pengiriman
│   ├── Retur Expired
│   ├── Retur Display
│   └── Riwayat Retur
│
├── Rekanan
│   ├── Daftar Rekanan
│   ├── Produk Rekanan
│   └── Riwayat Penerimaan
│
└── Laporan
    ├── Produk
    ├── Produksi
    ├── Stok
    ├── Distribusi
    ├── Agen
    ├── Sales
    ├── Toko
    ├── Konsinyasi
    ├── Display
    └── Retur
```

---

# 4. NAVIGASI SALES

Untuk Sales saya **tidak menyarankan navigasi sebanyak Admin**.

Sales bekerja di lapangan dan kemungkinan besar menggunakan HP. Karena itu navigasinya harus berorientasi pada **aktivitas**, bukan data master.

```text
SALES
│
├── Beranda
│
├── Kunjungan
│   ├── Kunjungan Baru
│   ├── Toko Terdaftar
│   └── Riwayat Kunjungan
│
├── Toko
│   ├── Daftar Toko
│   ├── Tambah Toko
│   └── Detail Toko
│
├── Konsinyasi
│   ├── Stok Toko
│   ├── Produk Terjual
│   ├── Produk Tersisa
│   ├── Retur
│   └── Titip Produk Baru
│
├── Stok Saya
│   ├── Stok Produk
│   ├── Stok per Batch
│   └── Riwayat Stok
│
├── Display
│   ├── Display Saya
│   ├── Penempatan Display
│   ├── Isi Display
│   └── Riwayat Display
│
└── Profil
    └── Profil Saya
```

---

# 5. Saya Sarankan Sales Memiliki "Fast Action"

Karena pekerjaan Sales sebenarnya berpusat pada **kunjungan toko**, maka PWA Sales sebaiknya memiliki tombol aksi utama.

```text
┌──────────────────────────────────────┐
│              BERANDA                 │
│                                      │
│  Halo, Sales                         │
│                                      │
│  ┌──────────────┐ ┌───────────────┐  │
│  │ Toko Hari Ini│ │ Stok Saya     │  │
│  └──────────────┘ └───────────────┘  │
│                                      │
│                                      │
│          ┌─────────────────┐         │
│          │  + KUNJUNGAN    │         │
│          └─────────────────┘         │
│                                      │
│  Kunjungan Terakhir                  │
│  ────────────────────────────────    │
│  Toko A              29 Sep          │
│  Toko B              29 Sep          │
│  Toko C              28 Sep          │
│                                      │
├──────────────────────────────────────┤
│ Beranda │ Toko │ + │ Stok │ Lainnya │
└──────────────────────────────────────┘
```

Ini lebih cocok untuk workflow lapangan daripada memberikan Sales menu Admin.

---

# 6. Alur "Kunjungan Baru" Sales

Saya sarankan **Kunjungan Baru** menjadi pusat workflow Sales.

```text
                + KUNJUNGAN
                     │
                     ▼
              ┌─────────────┐
              │ PILIH TOKO  │
              └──────┬──────┘
                     │
             ┌───────┴────────┐
             │                │
             ▼                ▼
       TOKO TERDAFTAR      TOKO BARU
             │                │
             │                ▼
             │          INPUT DATA TOKO
             │                │
             └────────┬───────┘
                      ▼
              CEK STOK TOKO
                      │
                      ▼
        ┌─────────────┼──────────────┐
        │             │              │
        ▼             ▼              ▼
      TERJUAL       TERSISA        RETUR
        │             │              │
        └─────────────┼──────────────┘
                      ▼
              TITIP PRODUK BARU
                      │
              ┌───────┴────────┐
              │                │
              ▼                ▼
        TANPA DISPLAY      DENGAN DISPLAY
              │                │
              │                ▼
              │          PILIH DISPLAY
              │                │
              └────────┬───────┘
                       ▼
                SIMPAN KUNJUNGAN
                       │
                       ▼
                  SELESAI
```

Dengan demikian Sales tidak perlu berpikir:

> "Saya harus masuk menu konsinyasi → submenu X → submenu Y."

Cukup:

> **Kunjungan → pilih toko → cek stok → input penjualan/retur → titip produk → selesai.**

---

# 7. Struktur Detail Menu Produk Admin

Karena produk merupakan sumber utama seluruh distribusi, struktur produknya sebaiknya seperti ini:

```text
PRODUK
│
├── Semua Produk
│
├── Kategori
│
├── Varian
│
├── Satuan
│
└── Harga
    ├── Harga Produksi
    ├── Harga Sales
    └── Harga Agen
```

Sedangkan **Batch tidak ditempatkan sebagai master produk**, tetapi berada pada proses produksi/penerimaan:

```text
PRODUK
   │
   ▼
VARIAN
   │
   ▼
PRODUKSI / PENERIMAAN
   │
   ▼
BATCH
   │
   ├── Nomor Batch
   ├── Tanggal Produksi
   ├── Expired Date
   ├── Jumlah
   └── Sumber Produk
```

Ini akan membuat struktur lebih mudah dipahami.

---

# 8. Struktur Produksi

```text
PRODUKSI
│
├── Produksi Sendiri
│   │
│   ├── Buat Produksi
│   ├── Draft
│   ├── Selesai
│   └── Riwayat
│
└── Produk Rekanan
    │
    ├── Penerimaan Baru
    ├── Menunggu Verifikasi
    ├── Diterima
    └── Riwayat
```

Jadi Admin bisa membedakan:

```text
SUMBER PRODUK
│
├── PRODUKSI SENDIRI
│
└── REKANAN
```

---

# 9. Struktur Distribusi

Saya menyarankan distribusi menjadi **dua jalur yang sangat jelas**:

```text
DISTRIBUSI
│
├── AGEN
│   │
│   ├── Pesanan
│   ├── Persiapan
│   ├── Pengeluaran
│   └── Riwayat
│
└── SALES
    │
    ├── Distribusi Stok ke Sales
    ├── Stok Sales
    └── Riwayat
```

Kemudian Sales mengurus:

```text
SALES
   │
   ▼
TOKO
   │
   ▼
KONSINYASI
```

Jadi jangan mencampurkan **penjualan Agen** dengan **konsinyasi Sales** dalam satu workflow.

---

# 10. Struktur Konsinyasi

```text
KONSINYASI
│
├── Semua Konsinyasi
│
├── Berdasarkan Sales
│
├── Berdasarkan Toko
│
├── Stok Toko
│
├── Produk Terjual
│
├── Produk Tersisa
│
├── Produk Retur
│
└── Riwayat Konsinyasi
```

Namun untuk **Sales**, menu ini tidak perlu ditampilkan sebagai menu yang terlalu kompleks.

Sales cukup:

```text
KUNJUNGAN
   ↓
CEK STOK
   ↓
TERJUAL
   ↓
RETUR
   ↓
TITIP BARU
```

---

# 11. Struktur Retur

Saya menyarankan **jenis retur berdasarkan penyebab**, bukan berdasarkan siapa yang mengembalikan.

```text
RETUR
│
├── Semua Retur
│
├── Menunggu Verifikasi
│
├── Cacat Produksi
│   └── → Produksi / Rekanan
│
├── Cacat Pengiriman
│   └── → Gudang
│
├── Expired
│   └── → Gudang
│
├── Cacat Display
│   └── → Gudang
│
└── Riwayat Retur
```

Karena:

> Sales/Toko/Agen = **sumber retur**

sedangkan:

> Cacat Produksi/Cacat Pengiriman/Expired/Cacat Display = **alasan retur**

Ini dua konsep yang berbeda dan sebaiknya tidak digabung.

---

# 12. Struktur Display

Display juga sebaiknya berdiri sebagai modul sendiri.

```text
DISPLAY
│
├── Semua Display
│
├── Display Tersedia
│
├── Display Digunakan
│
├── Penempatan
│
├── Isi Display
│
├── Perpindahan
│
└── Riwayat
```

Detail:

```text
DISPLAY-001
│
├── Kondisi
├── Sales
├── Toko
├── Tanggal Penempatan
│
└── Isi
    ├── Produk A
    │   ├── Varian 1
    │   └── Varian 2
    │
    ├── Produk B
    │   └── Varian 1
    │
    └── Produk C
        └── Varian 1
```

---

# 13. Struktur Navigasi Final yang Saya Rekomendasikan

Kalau dibuat lebih sederhana untuk implementasi awal:

```text
                    ┌─────────────────┐
                    │     OWNER       │
                    └────────┬────────┘
                             │
      ┌──────────────────────┼─────────────────────┐
      │                      │                     │
      ▼                      ▼                     ▼
  MONITORING              LAPORAN              PENGATURAN


                    ┌─────────────────┐
                    │     ADMIN       │
                    └────────┬────────┘
                             │
 ┌─────────┬──────────┬──────┼──────┬─────────┬─────────┐
 ▼         ▼          ▼      ▼      ▼         ▼         ▼
Produk  Produksi     Stok Distribusi Agen     Toko    Retur
 │         │          │      │       │         │        │
 │         │          │      │       │         │        │
 └─────────┴──────────┴──────┴───────┴─────────┴────────┘
                             │
                             ▼
                          Display
                             │
                             ▼
                          Laporan


                    ┌─────────────────┐
                    │      SALES      │
                    └────────┬────────┘
                             │
            ┌────────────────┼────────────────┐
            ▼                ▼                ▼
        Kunjungan          Toko          Stok Saya
            │
            ▼
       Cek Stok Lama
            │
      ┌─────┼──────┐
      ▼     ▼      ▼
   Terjual Sisa   Retur
      │     │      │
      └─────┼──────┘
            ▼
      Titip Produk
            │
       ┌────┴────┐
       ▼         ▼
   Tanpa       Dengan
   Display     Display
                 │
                 ▼
              Display
```

## 14. Bottom Navigation PWA untuk Sales

Untuk penggunaan mobile, saya bahkan akan membuatnya lebih ringkas:

```text
┌────────────────────────────────────────────┐
│                                            │
│              CONTENT AREA                 │
│                                            │
│                                            │
├────────────────────────────────────────────┤
│                                            │
│  🏠       🏪        ＋        📦       ⋯  │
│ Beranda   Toko    Kunjungan   Stok    Lainnya
│                                            │
└────────────────────────────────────────────┘
```

Dengan:

```text
Lainnya
│
├── Display
├── Riwayat Kunjungan
├── Riwayat Retur
├── Profil
└── Pengaturan
```

**Intinya:** untuk Sales, **"Kunjungan" adalah pusat aplikasi**, sedangkan untuk Admin, **"Produk → Produksi → Stok → Distribusi → Retur" adalah pusat operasional**, dan untuk Owner, **"Monitoring → Laporan → Pengaturan" adalah pusat aplikasi**. Struktur ini paling dekat dengan alur kerja nyata yang Anda jelaskan dan sekaligus cocok diterapkan dengan **Refine + Hono + shadcn/ui + PWA + Cloudflare D1/R2**.
