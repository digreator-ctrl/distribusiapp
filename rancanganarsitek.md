Rancangan arsitektur informasi dan struktur navigasi ini disusun dengan pendekatan *multi-tenant* (SaaS) dan dioptimalkan untuk eksekusi *mobile-first* (PWA) bagi petugas lapangan, menggunakan Refine sebagai kerangka *frontend/backend* utama.

## 1. Arsitektur Informasi (Information Architecture)

Sistem berpusat pada entitas **Tenant (Usaha)** yang membawahi seluruh data operasional. Alur data dibagi menjadi tiga domain utama berdasarkan aktor:

* **Domain Master & Konfigurasi (Owner):** Mengatur entitas SaaS, konfigurasi dasar, dan hak akses pengguna (RBAC).
* **Domain Inbound & Inventory (Admin):** Mengelola siklus hidup produk dari masuk (produksi internal/rekanan) hingga keluar (distribusi agen/sales), termasuk kontrol *batch* dan tanggal kedaluwarsa.
* **Domain Outbound & Field Ops (Sales):** Mengelola interaksi B2B dengan Agen (Beli Putus) dan Toko (Konsinyasi), pelacakan aset fisik (Display), serta pencatatan retur awal dari lapangan.

## 2. Modul & Fitur Utama

### A. Modul Manajemen Entitas & Pengguna (SaaS Core)

* **Registrasi & Profil Tenant:** Pendaftaran usaha baru oleh Owner.
* **Manajemen Karyawan:** Pembuatan akun dan penugasan peran (Owner, Admin, Sales).

### B. Modul Master Produk & Inventaris

* **Katalog Produk:** Pendataan SKU, nama produk, dan varian.
* **Manajemen Harga:** Penetapan tiga tier harga (Harga Produksi, Harga Sales, Harga Agen).
* **Manajemen Batch (Inbound):** Pencatatan produk masuk dari Produksi Internal atau Rekanan, mencakup pencatatan Tanggal Produksi, Tanggal Kedaluwarsa (Exp), dan Jumlah.

### C. Modul Distribusi & Penjualan (Outbound)

* **Transaksi Agen (Beli Putus):** Pemrosesan pesanan agen dengan minimal order dan harga khusus.
* **Manajemen Konsinyasi:** Pencatatan penitipan barang ke toko mitra oleh Sales.

### D. Modul Operasional Lapangan (Sales PWA)

* **Manajemen Mitra Toko:** Pendaftaran profil toko baru (titik koordinat, nama toko, pemilik).
* **Opname Konsinyasi:** Formulir pendataan stok lama (Terjual, Sisa, Retur) dan penitipan stok baru.
* **Pelacakan Aset Display:** Fitur pemetaan wadah/rak display, mencatat lokasi wadah dan rincian varian produk di dalamnya secara *real-time*.

### E. Modul Manajemen Retur

* **Klasifikasi Retur Lapangan:** Pencatatan retur oleh Sales (Cacat Display).
* **Resolusi Retur Gudang:** Validasi dan alokasi retur oleh Admin berdasarkan kondisi (Cacat Pengiriman, Kedaluwarsa -> Gudang; Cacat Produksi -> Rekanan/Internal).
* **Garansi Agen:** Pemrosesan penggantian produk retur dari Agen dengan produk baru.

---

## 3. Struktur Navigasi & Menu (Role-Based)

Antarmuka dibangun dengan UI Shadcn dan Tailwind CSS, disesuaikan dengan tugas masing-masing *role*.

### 📱 Tampilan Owner (Web Dashboard)

Berfokus pada pemantauan tingkat tinggi dan pengaturan master sistem.

* **Dashboard** (Ringkasan performa usaha, total toko, total agen, tren penjualan)
* **Manajemen Usaha**
* Profil Usaha
* Pengaturan Dasar (Syarat Minimal Order Agen, Aturan Konsinyasi)


* **Manajemen Pengguna**
* Daftar Admin
* Daftar Sales


* **Master Data**
* Master Kategori & Varian
* Master Produk (Setup Harga Produksi, Sales, Agen)
* Master Wadah Display (Registrasi ID/Barcode Wadah)


* **Laporan Eksekutif**
* Laporan Laba/Rugi Kotor
* Laporan Pergerakan Aset



### 💻 Tampilan Admin (Web Dashboard)

Berfokus pada pergerakan barang fisik, pencatatan *batch*, dan penyelesaian retur.

* **Dashboard Inventory** (Notifikasi stok menipis, produk mendekati kedaluwarsa, retur menunggu validasi)
* **Inbound (Barang Masuk)**
* Penerimaan Produksi Internal (Form Input Batch & Expired)
* Penerimaan Rekanan (Form Input Batch & Expired)


* **Outbound (Barang Keluar)**
* Pesanan Agen (Beli Putus)
* Alokasi Stok Sales (Persiapan barang bawaan Sales)


* **Inventory Control**
* Stok Gudang Real-time
* Riwayat Pergerakan Barang


* **Manajemen Retur**
* Retur dari Agen (Klaim Garansi & Penggantian)
* Retur dari Sales (Validasi Cacat Pengiriman, Expired, Cacat Display)
* Pengembalian ke Rekanan (Khusus Cacat Produksi)



### 📲 Tampilan Sales (Progressive Web App / PWA)

Berfokus pada kecepatan input data, dukungan *offline-first* (sinkronisasi ke Cloudflare D1/R2 saat sinyal tersedia), dan navigasi *mobile-friendly*.

* **Home / Beranda**
* Ringkasan Target & Kunjungan Hari Ini
* Stok Bawaan Sales (Sisa barang di kendaraan)


* **Manajemen Kunjungan (Toko Konsinyasi)**
* Daftar Toko Mitra
* Tambah Toko Baru (Form Profil & Lokasi)
* Mulai Kunjungan (Alur: Cek Stok Lama -> Catat Laku/Sisa/Retur -> Drop Stok Baru)


* **Manajemen Aset Display**
* Scan/Input ID Wadah
* Assign Wadah ke Toko
* Isi/Ubah Produk dalam Wadah (Pemetaan Varian dalam 1 Wadah)


* **Riwayat Transaksi**
* Riwayat Drop Konsinyasi
* Daftar Retur Menunggu Diserahkan ke Admin