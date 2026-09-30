Tentu. Berdasarkan **alur bisnis yang Anda jelaskan** dan **struktur navigasi Owner, Admin, dan Sales** sebelumnya, setiap menu sebaiknya tidak hanya didefinisikan sebagai halaman, tetapi juga memiliki **modul/komponen di dalam page**, sehingga nantinya lebih mudah diturunkan menjadi PRD, wireframe, dan implementasi Refine + React.

Saya susun dari **Page → Section/Modul → Fitur/Aksi → Data yang ditampilkan**.

---

# 1. OWNER

Owner berfungsi sebagai **pengawas bisnis dan pengambil keputusan**, sehingga halaman Owner lebih banyak berupa monitoring, laporan, konfigurasi, dan manajemen pengguna.

## 1.1 Beranda

### Modul

* Ringkasan Penjualan
* Ringkasan Stok
* Ringkasan Konsinyasi
* Ringkasan Agen
* Ringkasan Sales
* Ringkasan Toko
* Ringkasan Retur
* Aktivitas Terbaru
* Notifikasi

### Data utama

```text
Penjualan Hari Ini
Penjualan Bulan Ini
Produk Terjual
Stok Gudang
Stok Sales
Stok Toko
Nilai Konsinyasi
Jumlah Agen
Jumlah Sales
Jumlah Toko
Jumlah Retur
```

---

# 2. OWNER → MONITORING

## 2.1 Ringkasan Penjualan

### Modul

* Filter periode
* Total penjualan
* Penjualan per produk
* Penjualan per varian
* Penjualan per sales
* Penjualan per toko
* Penjualan agen
* Grafik penjualan
* Daftar transaksi terbaru

### Aksi

* Filter
* Lihat detail
* Export laporan

---

## 2.2 Ringkasan Stok

### Modul

* Total stok
* Stok gudang
* Stok sales
* Stok toko
* Stok display
* Stok berdasarkan produk
* Stok berdasarkan batch
* Stok mendekati expired

### Aksi

* Lihat detail stok
* Lihat riwayat mutasi

---

## 2.3 Stok Gudang

### Modul

* Daftar produk
* Varian
* Batch
* Qty tersedia
* Tanggal produksi
* Tanggal expired
* Lokasi
* Status stok

### Aksi

* Detail stok
* Riwayat mutasi
* Stock opname

---

## 2.4 Stok Sales

### Modul

* Daftar sales
* Total stok masing-masing sales
* Produk
* Varian
* Batch
* Qty dibawa
* Qty terjual
* Qty tersisa

### Aksi

* Lihat detail sales
* Lihat detail stok
* Lihat riwayat distribusi

---

## 2.5 Stok Toko

### Modul

* Daftar toko
* Produk
* Varian
* Batch
* Qty dititipkan
* Qty terjual
* Qty tersisa
* Qty retur

### Aksi

* Detail toko
* Detail konsinyasi
* Riwayat kunjungan

---

## 2.6 Stok Display

### Modul

* Daftar display
* Kode display
* Toko
* Sales
* Status
* Isi display
* Jumlah produk
* Kondisi display

### Aksi

* Detail display
* Lihat isi
* Lihat riwayat perpindahan

---

# 3. OWNER → KONSINYASI

## Modul

### Ringkasan

* Total toko aktif
* Total produk dititipkan
* Total produk terjual
* Total produk tersisa
* Total retur

### Daftar konsinyasi

* Nomor konsinyasi
* Tanggal
* Sales
* Toko
* Total produk
* Status

### Detail

* Produk
* Varian
* Batch
* Qty awal
* Qty terjual
* Qty tersisa
* Qty retur

### Aksi

* Lihat detail
* Filter
* Export

---

# 4. OWNER → AGEN

## Modul

### Daftar agen

* Nama agen
* Kontak
* Status
* Total transaksi
* Total pembelian

### Ringkasan

* Total agen
* Agen aktif
* Penjualan agen
* Retur agen

### Detail agen

* Profil
* Riwayat pembelian
* Produk yang dibeli
* Retur
* Saldo/tagihan jika nantinya diperlukan

---

# 5. OWNER → SALES

## Modul

### Daftar sales

* Nama
* Kontak
* Status
* Stok dibawa
* Jumlah toko
* Jumlah kunjungan
* Penjualan

### Detail sales

* Profil
* Stok
* Distribusi
* Kunjungan
* Toko yang ditangani
* Konsinyasi
* Retur
* Display

---

# 6. OWNER → TOKO

## Modul

### Daftar toko

* Nama toko
* Pemilik
* Kontak
* Alamat
* Sales
* Status
* Jumlah produk
* Status konsinyasi

### Detail toko

* Profil toko
* Konsinyasi
* Stok
* Penjualan
* Retur
* Kunjungan
* Display

---

# 7. OWNER → DISPLAY

## Modul

### Daftar display

* Kode display
* Nama/jenis
* Kondisi
* Sales
* Toko
* Status

### Detail display

* Identitas display
* Lokasi saat ini
* Sales penanggung jawab
* Isi display
* Produk
* Varian
* Batch
* Riwayat perpindahan

---

# 8. OWNER → RETUR

## Modul

### Ringkasan

* Total retur
* Retur produksi
* Retur pengiriman
* Retur expired
* Retur display

### Daftar retur

* Nomor retur
* Tanggal
* Sumber
* Produk
* Qty
* Alasan
* Tujuan
* Status

### Detail retur

* Informasi pengirim
* Produk
* Batch
* Qty
* Alasan
* Foto/dokumentasi
* Tujuan retur
* Status pemeriksaan
* Tindakan

---

# 9. OWNER → PRODUK

## 9.1 Semua Produk

### Modul

* Search
* Filter kategori
* Filter sumber
* Filter status
* Daftar produk

### Data

* SKU
* Nama
* Kategori
* Varian
* Sumber
* Harga produksi
* Harga agen
* Harga jual
* Status

---

## 9.2 Produk Produksi Sendiri

### Modul

* Daftar produk
* Produksi
* Batch
* Stok
* Harga
* Riwayat produksi

---

## 9.3 Produk Rekanan

### Modul

* Daftar produk
* Rekanan
* Batch penerimaan
* Harga
* Stok
* Riwayat penerimaan

---

# 10. OWNER → LAPORAN

### Laporan Penjualan

* Periode
* Produk
* Varian
* Sales
* Toko
* Agen
* Total qty
* Total nilai

### Laporan Stok

* Gudang
* Sales
* Toko
* Display
* Batch
* Expired

### Laporan Konsinyasi

* Toko
* Sales
* Produk
* Qty titip
* Qty terjual
* Qty tersisa
* Qty retur

### Laporan Agen

* Agen
* Produk
* Qty
* Nilai transaksi
* Retur

### Laporan Sales

* Sales
* Kunjungan
* Toko
* Penjualan
* Retur
* Distribusi

### Laporan Toko

* Toko
* Produk
* Penjualan
* Sisa
* Retur

### Laporan Retur

* Jenis retur
* Produk
* Batch
* Sumber
* Tujuan
* Qty
* Status

---

# 11. OWNER → PENGGUNA

## Daftar Pengguna

### Modul

* Daftar pengguna
* Nama
* Email
* Nomor HP
* Role
* Status
* Last login

### Aksi

* Tambah pengguna
* Edit
* Nonaktifkan
* Reset akses

---

## Admin

### Modul

* Daftar admin
* Role
* Status
* Hak akses

---

## Sales

### Modul

* Daftar sales
* Profil
* Status
* Area
* Toko yang ditangani

---

# 12. OWNER → PENGATURAN

## Profil Usaha

* Nama usaha
* Logo
* Alamat
* Kontak
* Informasi usaha

## Pengaturan Harga

* Harga produksi
* Harga agen
* Harga jual
* Harga konsinyasi jika diperlukan

## Aturan Agen

* Minimum order
* Harga agen
* Ketentuan pembayaran
* Ketentuan retur

## Aturan Konsinyasi

* Periode kunjungan
* Mekanisme pencatatan
* Ketentuan retur
* Batas waktu

## Aturan Retur

* Produksi
* Pengiriman
* Expired
* Display
* Tujuan retur

---

# 13. ADMIN → BERANDA

Admin adalah **pusat operasional**.

### Modul

* Stok gudang
* Produksi hari ini
* Penerimaan rekanan
* Distribusi
* Retur menunggu verifikasi
* Stock alert
* Produk mendekati expired
* Aktivitas terbaru

---

# 14. ADMIN → PRODUK

## 14.1 Semua Produk

### Modul

* Search
* Filter
* Daftar produk
* Kategori
* Sumber produk
* Varian
* Harga
* Status

### Aksi

* Tambah
* Edit
* Nonaktifkan
* Detail

---

## 14.2 Kategori

### Modul

* Daftar kategori
* Nama
* Deskripsi
* Status

### Aksi

* Tambah
* Edit
* Hapus/nonaktifkan

---

## 14.3 Varian

### Modul

* Produk induk
* Nama varian
* SKU
* Barcode
* Satuan
* Harga produksi
* Harga agen
* Harga jual

---

## 14.4 Satuan

### Modul

* Nama satuan
* Simbol
* Status

Contoh:

```text
pcs
box
pack
kg
liter
```

---

## 14.5 Harga

### Modul

* Produk
* Varian
* Harga produksi
* Harga agen
* Harga jual
* Riwayat perubahan harga

---

# 15. ADMIN → PRODUKSI

## 15.1 Produksi Sendiri

### Modul

* Nomor produksi
* Tanggal produksi
* Produk
* Varian
* Qty produksi
* Batch
* Expired
* Biaya produksi
* Status

### Aksi

* Buat produksi
* Simpan
* Konfirmasi produksi
* Cetak label batch

---

## 15.2 Penerimaan Rekanan

### Modul

* Rekanan
* Nomor penerimaan
* Tanggal
* Produk
* Varian
* Batch
* Qty
* Tanggal produksi
* Expired
* Harga beli
* Dokumentasi

### Aksi

* Terima
* Tolak
* Koreksi
* Konfirmasi

---

## 15.3 Batch Produksi

### Modul

* Nomor batch
* Produk
* Varian
* Sumber
* Rekanan
* Tanggal produksi
* Expired
* Qty awal
* Qty tersedia
* Status

---

## 15.4 Riwayat Produksi

### Modul

* Riwayat produksi
* Filter periode
* Produk
* Batch
* Qty
* Sumber
* Operator

---

# 16. ADMIN → STOK

## 16.1 Stok Gudang

Menampilkan:

```text
Produk
Varian
Batch
Qty tersedia
Tanggal produksi
Expired
Lokasi
```

---

## 16.2 Stok Sales

Menampilkan:

```text
Sales
Produk
Varian
Batch
Qty dibawa
Qty terjual
Qty tersisa
```

---

## 16.3 Stok Toko

Menampilkan:

```text
Toko
Produk
Varian
Batch
Qty titip
Qty terjual
Qty tersisa
```

---

## 16.4 Stok Display

Menampilkan:

```text
Display
Toko
Produk
Varian
Batch
Qty
```

---

## 16.5 Mutasi Stok

Ini merupakan halaman penting karena menjadi **jejak pergerakan barang**.

### Modul

* Nomor mutasi
* Tanggal
* Produk
* Batch
* Dari lokasi
* Ke lokasi
* Qty
* Jenis mutasi
* Referensi transaksi
* Operator

Contoh:

```text
GUDANG
   ↓ 20 pcs
SALES A
   ↓ 10 pcs
TOKO A
```

---

## 16.6 Stock Opname

### Modul

* Pilih lokasi
* Daftar produk
* Stok sistem
* Stok fisik
* Selisih
* Alasan selisih
* Dokumentasi
* Approval

---

# 17. ADMIN → DISTRIBUSI

## 17.1 Distribusi ke Agen

### Modul

* Agen
* Produk
* Varian
* Batch
* Qty
* Harga agen
* Total
* Status transaksi

---

## 17.2 Distribusi ke Sales

### Modul

* Sales
* Produk
* Varian
* Batch
* Qty
* Tanggal
* Status

Akan menghasilkan:

```text
GUDANG
   ↓
STOK SALES
```

---

## 17.3 Riwayat Distribusi

### Modul

* Nomor distribusi
* Tanggal
* Tujuan
* Produk
* Batch
* Qty
* Operator
* Status

---

# 18. ADMIN → AGEN

## Daftar Agen

### Modul

* Profil agen
* Kontak
* Alamat
* Status
* Ketentuan

## Ketentuan Agen

### Modul

* Minimum order
* Harga agen
* Ketentuan pembayaran
* Ketentuan retur
* Produk yang diperbolehkan

## Pesanan Agen

### Modul

* Nomor pesanan
* Agen
* Produk
* Qty
* Harga
* Total
* Status

## Penjualan Agen

### Modul

* Riwayat transaksi
* Produk
* Qty
* Nilai
* Tanggal

## Retur Agen

### Modul

* Nomor retur
* Agen
* Produk
* Batch
* Qty
* Alasan
* Status

---

# 19. ADMIN → SALES

## Daftar Sales

### Modul

* Profil sales
* Area
* Status
* Jumlah toko
* Stok
* Aktivitas

## Stok Sales

### Modul

* Produk
* Varian
* Batch
* Qty
* Mutasi

## Distribusi Sales

### Modul

* Distribusi dari gudang
* Produk
* Batch
* Qty
* Tanggal

## Aktivitas Sales

### Modul

* Kunjungan
* Toko
* Penjualan
* Retur
* Penempatan display

## Kunjungan

### Modul

* Daftar kunjungan
* Sales
* Toko
* Tanggal
* Hasil kunjungan
* Transaksi

---

# 20. ADMIN → TOKO

## Daftar Toko

### Modul

* Identitas toko
* Pemilik
* Kontak
* Alamat
* Sales
* Status

## Data Konsinyasi

### Modul

* Nomor konsinyasi
* Tanggal
* Produk
* Batch
* Qty
* Status

## Stok Toko

### Modul

* Produk
* Batch
* Qty titip
* Terjual
* Sisa

## Penjualan Toko

### Modul

* Produk
* Qty terjual
* Periode
* Nilai

## Retur Toko

### Modul

* Produk
* Batch
* Qty
* Alasan
* Status

## Riwayat Kunjungan

### Modul

* Tanggal
* Sales
* Produk terjual
* Sisa
* Retur
* Produk baru
* Display

---

# 21. ADMIN → DISPLAY

## Daftar Display

### Modul

* Kode display
* Jenis
* Kondisi
* Status
* Lokasi
* Sales

## Penempatan Display

### Modul

* Display
* Sales
* Toko
* Tanggal penempatan
* Status

## Isi Display

### Modul

* Produk
* Varian
* Batch
* Qty

## Perpindahan Display

### Modul

* Dari toko
* Ke toko
* Sales
* Tanggal
* Alasan

## Riwayat Display

### Modul

* Riwayat lokasi
* Riwayat isi
* Riwayat penggunaan
* Riwayat kerusakan

---

# 22. ADMIN → RETUR

## Semua Retur

### Modul

* Nomor retur
* Tanggal
* Sumber
* Produk
* Batch
* Qty
* Alasan
* Tujuan
* Status

---

## Menunggu Verifikasi

### Modul

```text
Data Retur
     ↓
Pemeriksaan
     ↓
Validasi
     ↓
Tentukan Tindakan
```

Tindakan:

```text
DITERIMA
DITOLAK
DIGANTI
DIMUSNAHKAN
DIKEMBALIKAN KE REKANAN
```

---

## Retur Produksi

Tujuan:

```text
Produksi sendiri
        atau
Rekanan
```

---

## Retur Pengiriman

Tujuan:

```text
Gudang / Admin
```

---

## Retur Expired

Tujuan:

```text
Gudang / Admin
```

---

## Retur Display

Tujuan:

```text
Gudang / Admin
```

---

# 23. ADMIN → REKANAN

## Daftar Rekanan

### Modul

* Nama
* Kontak
* Alamat
* Produk
* Status

## Produk Rekanan

### Modul

* Produk
* Varian
* Rekanan
* Harga
* Batch
* Status

## Riwayat Penerimaan

### Modul

* Nomor penerimaan
* Rekanan
* Produk
* Batch
* Qty
* Tanggal
* Status

---

# 24. ADMIN → LAPORAN

Laporan Admin lebih bersifat **operasional**.

### Produk

* Daftar produk
* Produk aktif/nonaktif
* Produk per kategori

### Produksi

* Produksi per periode
* Produksi per batch
* Produksi sendiri
* Penerimaan rekanan

### Stok

* Stok gudang
* Stok sales
* Stok toko
* Stok display
* Mutasi

### Distribusi

* Distribusi agen
* Distribusi sales
* Distribusi per produk

### Agen

* Transaksi agen
* Produk terjual
* Retur

### Sales

* Distribusi
* Kunjungan
* Penjualan
* Retur

### Toko

* Konsinyasi
* Penjualan
* Stok
* Retur

### Display

* Display aktif
* Isi display
* Perpindahan

---

# 25. SALES → BERANDA

Karena Sales bekerja di lapangan, dashboard sebaiknya **sangat sederhana**.

### Modul

* Kunjungan hari ini
* Toko yang harus dikunjungi
* Stok saya
* Penjualan hari ini
* Produk perlu ditindaklanjuti
* Retur
* Aktivitas terakhir

---

# 26. SALES → KUNJUNGAN

Ini adalah **page paling penting bagi Sales**.

## Kunjungan Baru

### Step 1 — Pilih Toko

```text
[ Pilih Toko ]

○ Toko Terdaftar
○ Toko Baru
```

Jika toko baru:

```text
Nama Toko
Pemilik
No. HP
Alamat
Lokasi
Catatan
```

---

## Step 2 — Cek Stok Lama

Sistem menampilkan:

```text
Produk
Varian
Batch
Qty Sebelumnya
```

---

## Step 3 — Catat Penjualan

```text
Produk
Varian
Batch
Qty Terjual
```

---

## Step 4 — Catat Sisa

Sistem dapat menghitung:

```text
Qty Awal
- Qty Terjual
- Qty Retur
= Qty Sisa
```

---

## Step 5 — Catat Retur

```text
Produk
Batch
Qty
Alasan
Dokumentasi
```

---

## Step 6 — Titip Produk Baru

```text
Produk
Varian
Batch
Qty
```

---

## Step 7 — Pilih Display

```text
○ Tanpa Display
○ Menggunakan Display
```

Jika menggunakan display:

```text
Pilih Display
       ↓
Isi Display
       ↓
Produk + Varian + Batch + Qty
```

---

## Step 8 — Simpan Kunjungan

Hasil:

```text
Kunjungan
├── Toko
├── Penjualan
├── Sisa
├── Retur
├── Produk Baru
└── Display
```

---

# 27. SALES → TOKO

## Daftar Toko

### Modul

* Search
* Filter
* Toko terdekat
* Toko aktif
* Toko baru

## Tambah Toko

### Modul

* Nama
* Pemilik
* Kontak
* Alamat
* Lokasi
* Catatan

## Detail Toko

### Modul

* Profil
* Stok
* Penjualan
* Konsinyasi
* Retur
* Display
* Riwayat kunjungan

---

# 28. SALES → KONSINYASI

## Stok Toko

```text
Produk
Varian
Batch
Qty Dititipkan
Qty Terjual
Qty Tersisa
```

## Produk Terjual

```text
Tanggal
Produk
Varian
Batch
Qty
```

## Produk Tersisa

```text
Produk
Batch
Qty
```

## Retur

```text
Produk
Batch
Qty
Alasan
Status
```

## Titip Produk Baru

```text
Pilih Produk
      ↓
Pilih Varian
      ↓
Pilih Batch
      ↓
Masukkan Qty
      ↓
Simpan
```

---

# 29. SALES → STOK SAYA

## Stok Produk

### Modul

* Produk
* Varian
* Batch
* Qty tersedia

## Stok per Batch

### Modul

* Batch
* Tanggal produksi
* Expired
* Qty

Ini penting untuk **traceability dan FIFO/FEFO**.

## Riwayat Stok

### Modul

* Masuk
* Keluar
* Terjual
* Retur
* Transfer

---

# 30. SALES → DISPLAY

## Display Saya

### Modul

* Kode display
* Toko
* Status
* Kondisi

## Penempatan Display

### Modul

* Pilih display
* Pilih toko
* Tanggal
* Catatan

## Isi Display

### Modul

* Produk
* Varian
* Batch
* Qty

## Riwayat Display

### Modul

* Toko sebelumnya
* Toko sekarang
* Tanggal
* Sales
* Isi display

---

# 31. SALES → PROFIL

### Modul

* Foto/profil
* Nama
* Nomor HP
* Email
* Area kerja
* Status akun

### Pengaturan

* Notifikasi
* Password
* Logout

---

# 32. ALUR PAGE SALES SECARA UTUH

Jika disederhanakan, seluruh halaman Sales sebenarnya berpusat pada **Kunjungan**:

```text
                    SALES
                      │
                      ▼
                  BERANDA
                      │
                      ▼
              + KUNJUNGAN BARU
                      │
              ┌───────┴────────┐
              │                │
              ▼                ▼
        TOKO TERDAFTAR     TOKO BARU
              │                │
              └───────┬────────┘
                      ▼
                CEK STOK LAMA
                      │
          ┌───────────┼───────────┐
          ▼           ▼           ▼
       TERJUAL      SISA        RETUR
          │           │           │
          └───────────┼───────────┘
                      ▼
              TITIP PRODUK BARU
                      │
                      ▼
               PILIH DISPLAY?
                  /       \
                TIDAK      YA
                 │          │
                 │          ▼
                 │      PILIH DISPLAY
                 │          │
                 │          ▼
                 │      ISI DISPLAY
                 │          │
                 └────┬─────┘
                      ▼
              SIMPAN KUNJUNGAN
                      │
                      ▼
               UPDATE STOCK LEDGER
                      │
          ┌───────────┼────────────┐
          ▼           ▼            ▼
       SALES         TOKO       DISPLAY
        STOCK        STOCK        STOCK
```

---

# 33. HUBUNGAN ANTAR PAGE UTAMA

Kalau seluruh aplikasi diringkas menjadi hubungan antar modul:

```text
                         ┌──────────────┐
                         │   ACCOUNT    │
                         │  & BUSINESS  │
                         └──────┬───────┘
                                │
                                ▼
                     ┌────────────────────┐
                     │       PRODUK       │
                     └─────────┬──────────┘
                               │
                ┌──────────────┴──────────────┐
                │                             │
                ▼                             ▼
       ┌────────────────┐            ┌────────────────┐
       │ PRODUKSI SENDIRI│            │    REKANAN     │
       └───────┬────────┘            └───────┬────────┘
               │                             │
               └──────────────┬──────────────┘
                              ▼
                       ┌─────────────┐
                       │    BATCH    │
                       └──────┬──────┘
                              │
                              ▼
                       ┌─────────────┐
                       │    GUDANG   │
                       └──────┬──────┘
                              │
                 ┌────────────┴────────────┐
                 │                         │
                 ▼                         ▼
             ┌────────┐               ┌────────┐
             │  AGEN  │               │ SALES  │
             └────┬───┘               └───┬────┘
                  │                       │
                  ▼                       ▼
             PENJUALAN               KUNJUNGAN
                                          │
                                          ▼
                                        TOKO
                                          │
                              ┌───────────┴───────────┐
                              │                       │
                              ▼                       ▼
                         TANPA DISPLAY          DENGAN DISPLAY
                                                      │
                                                      ▼
                                                   DISPLAY
                                                      │
                              ┌───────────────────────┘
                              │
                              ▼
                            RETUR
                              │
                ┌─────────────┼─────────────┐
                ▼             ▼             ▼
            PRODUKSI       GUDANG        REKANAN
```

## 34. Prinsip penting untuk implementasi Page

Ada satu hal yang saya sarankan kita pertahankan dari arsitektur sebelumnya: **jangan membuat setiap page sebagai data yang berdiri sendiri**.

Contohnya:

```text
PAGE STOK TOKO
      │
      ▼
STOCK LEDGER
      │
      ├── Distribusi
      ├── Konsinyasi
      ├── Penjualan
      ├── Retur
      └── Mutasi
```

Jadi ketika Sales mencatat:

> Toko A menjual 5 pcs

sistem **tidak sekadar mengubah angka `stok_toko = stok_toko - 5`**, tetapi membuat transaksi/mutasi yang dapat dilacak:

```text
Konsinyasi
     │
     └── Penjualan 5 pcs
             │
             ▼
      STOCK MOVEMENT
             │
             ▼
      Toko A - Batch X
      Qty berkurang 5
```

Dengan demikian, **Produk → Batch → Gudang → Sales → Toko → Display → Penjualan/Retur** tetap memiliki jejak yang konsisten.

Struktur di atas sudah cukup kuat untuk diturunkan ke tahap berikutnya menjadi **PRD per halaman**, misalnya setiap page dibuat dengan format:

```text
PAGE
├── Tujuan
├── Role Access
├── Header
├── Filter
├── Summary
├── Data Table
├── Detail
├── Form
├── Action
├── Validation
├── Business Rule
├── Status
└── Empty/Error State
```

Ini akan membuat rancangan UI, API Hono, database D1, dan permission Refine nantinya jauh lebih mudah diselaraskan.
