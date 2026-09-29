# Deskripsi Kebutuhan Sistem Manajemen Penjualan & Konsinyasi

## 1. Gambaran Umum Usaha

Usaha ini memiliki model bisnis yang menyerupai sistem sales, tetapi menggunakan **dua pola pengadaan dan distribusi produk**, yaitu:

1. **Produk milik sendiri**, yang diproduksi oleh perusahaan sendiri.
2. **Produk dari rekanan**, yang diproduksi oleh pihak lain dan kemudian didistribusikan melalui perusahaan.

Setelah produk tersedia, seluruh produk akan didata dan dikelola oleh **Admin** sebelum didistribusikan melalui agen maupun sales dengan sistem konsinyasi.

Sistem yang akan dibangun bertujuan untuk **mendigitalisasi seluruh proses tersebut**, mulai dari pengelolaan usaha, produk, produksi, stok, agen, toko, sales, distribusi, konsinyasi, retur, hingga monitoring wadah/display produk.

---

# 2. Pola Pengadaan Produk

## 2.1. Pola 1 — Produksi Sendiri

Pada pola ini, produk diproduksi oleh perusahaan sendiri.

Setelah proses produksi selesai, produk akan diserahkan kepada Admin untuk didata ke dalam sistem.

### Data produksi yang dicatat

* Nomor/ID Batch Produksi
* Nama Produk
* Varian Produk
* Kategori Produk
* Tanggal Produksi
* Tanggal Kedaluwarsa (Expired Date)
* Jumlah Produksi
* Satuan
* Nomor batch/lot
* Kondisi produk
* Lokasi penyimpanan
* Catatan produksi
* Dokumentasi produk jika diperlukan

Setelah produk tercatat, Admin juga mengelola informasi harga:

* Harga Produksi
* Harga Sales
* Harga Agen
* Harga lain jika diperlukan

Dengan demikian, Admin memiliki informasi lengkap mengenai produk yang telah selesai diproduksi beserta jumlah, batch, masa berlaku, dan harga jualnya.

---

## 2.2. Pola 2 — Produksi oleh Rekanan

Pada pola ini, produk diproduksi oleh pihak rekanan.

Setelah produk selesai diproduksi oleh rekanan, produk diserahkan kepada perusahaan untuk didistribusikan.

Produk tersebut kemudian diterima dan didata oleh Admin.

### Data yang dicatat

Pada dasarnya data produk yang diterima dari rekanan memiliki struktur yang sama dengan produk produksi sendiri, antara lain:

* Rekanan
* Nama Produk
* Varian Produk
* Kategori Produk
* Nomor Batch/Lot
* Tanggal Produksi
* Tanggal Kedaluwarsa
* Jumlah Produk
* Satuan
* Kondisi Produk
* Lokasi Penyimpanan
* Harga Produksi/Pembelian dari Rekanan
* Harga Sales
* Harga Agen
* Catatan
* Dokumentasi jika diperlukan

Dengan demikian, sistem dapat membedakan sumber produk:

**Produksi Sendiri** atau **Produksi Rekanan**.

---

# 3. Distribusi Produk

Setelah produk selesai didata oleh Admin, produk dapat didistribusikan melalui dua jalur utama:

1. **Agen**
2. **Sales dengan sistem konsinyasi**

---

# 4. Distribusi melalui Agen

Agen membeli produk dengan ketentuan yang telah ditetapkan oleh perusahaan.

### Karakteristik transaksi agen

* Agen membeli produk dengan **Harga Agen**.
* Harga Agen lebih rendah dibandingkan Harga Sales.
* Terdapat ketentuan Minimum Order (MOQ) jika berlaku.
* Produk menjadi transaksi penjualan kepada agen.
* Ketentuan retur mengikuti kebijakan perusahaan.

### Alur

```text
Produk tersedia
      ↓
Admin mendata produk
      ↓
Agen melakukan pemesanan
      ↓
Sistem memeriksa ketentuan agen
      ↓
Memenuhi Minimum Order?
      ↓
    Ya
      ↓
Produk disiapkan
      ↓
Produk diserahkan kepada Agen
      ↓
Stok perusahaan berkurang
      ↓
Transaksi tercatat
```

Apabila terdapat produk yang memenuhi ketentuan retur, maka proses retur dilakukan sesuai dengan aturan retur yang berlaku.

---

# 5. Distribusi melalui Sales dengan Sistem Konsinyasi

Selain melalui agen, produk juga dapat dibawa oleh Sales untuk dititipkan ke toko-toko menggunakan sistem **konsinyasi**.

Dalam sistem konsinyasi, produk tetap berada dalam pengelolaan perusahaan sampai produk tersebut terjual kepada konsumen, sesuai dengan ketentuan kerja sama.

Sales bertugas mendistribusikan dan melakukan monitoring produk yang dititipkan pada toko.

---

# 6. Alur Sales ke Toko

Terdapat dua kondisi ketika Sales akan melakukan kunjungan ke toko.

## 6.1. Toko Sudah Terdaftar

Jika toko sudah pernah didatangi dan memiliki riwayat konsinyasi, Sales dapat langsung melakukan monitoring stok.

Sales mendata:

* Produk Terjual
* Produk Belum Terjual
* Produk Retur
* Stok yang masih berada di toko
* Kondisi produk
* Produk yang akan ditambahkan

Setelah melakukan pengecekan, Sales kemudian menitipkan stok baru.

### Alur

```text
Sales datang ke toko
        ↓
Identifikasi toko
        ↓
Toko sudah terdaftar
        ↓
Cek stok konsinyasi sebelumnya
        ↓
Catat:
- Terjual
- Belum terjual
- Retur
        ↓
Hitung stok aktual
        ↓
Catat stok baru
        ↓
Produk dititipkan
        ↓
Transaksi/kunjungan tersimpan
```

---

## 6.2. Toko Belum Terdaftar

Jika toko belum pernah terdaftar, Sales harus melakukan pendataan toko terlebih dahulu.

### Data toko dapat meliputi:

* Nama Toko
* Nama Pemilik/Penanggung Jawab
* Nomor Telepon/WhatsApp
* Alamat
* Kecamatan
* Kabupaten/Kota
* Titik lokasi jika diperlukan
* Jenis toko
* Status toko
* Catatan
* Dokumentasi toko
* Data kerja sama jika diperlukan

Setelah toko berhasil didaftarkan, Sales dapat langsung melakukan penitipan produk.

### Alur

```text
Sales datang ke toko
        ↓
Toko belum terdaftar
        ↓
Input data toko
        ↓
Toko tersimpan
        ↓
Pilih produk
        ↓
Tentukan jumlah titipan
        ↓
Produk dititipkan
        ↓
Kunjungan tersimpan
```

Pada kunjungan berikutnya, toko tersebut akan mengikuti alur **toko yang sudah terdaftar**.

---

# 7. Sistem Retur Produk

Dalam proses distribusi, terdapat kemungkinan produk mengalami retur.

Retur harus dikategorikan berdasarkan penyebab dan lokasi pengembaliannya.

## 7.1. Retur karena Rusak/Cacat Produksi

Jika produk mengalami kerusakan atau cacat yang disebabkan oleh proses produksi:

```text
Produk Rusak/Cacat
        ↓
Kategori: Cacat Produksi
        ↓
Retur
        ↓
Dikembalikan ke:
- Tempat Produksi Sendiri
atau
- Rekanan
```

---

## 7.2. Retur karena Rusak/Cacat Pengiriman

Jika kerusakan terjadi selama proses pengiriman:

```text
Produk Rusak/Cacat
        ↓
Kategori: Cacat Pengiriman
        ↓
Retur
        ↓
Gudang/Kantor Admin
```

---

## 7.3. Retur karena Expired

Jika produk telah melewati tanggal kedaluwarsa:

```text
Produk Expired
        ↓
Retur
        ↓
Gudang/Kantor Admin
```

---

## 7.4. Retur karena Rusak/Cacat Display

Produk yang telah berada di toko dapat mengalami kerusakan akibat kondisi display atau penyimpanan di toko sehingga tidak layak untuk dijual atau dikonsumsi.

```text
Produk Rusak/Cacat
        ↓
Kategori: Cacat Display
        ↓
Retur
        ↓
Gudang/Kantor Admin
```

---

# 8. Pengelolaan Display/Wadah Produk

Selain penitipan produk secara langsung, Sales juga dapat membawa **wadah/display produk**.

Satu wadah display dapat digunakan untuk menampung:

* Beberapa produk
* Beberapa varian
* Jumlah produk yang berbeda

Oleh karena itu, sistem perlu memiliki pengelolaan **Display/Wadah** secara khusus.

## 8.1. Data Display/Wadah

Setiap wadah dapat memiliki:

* ID/Kode Display
* Nama/Jenis Display
* Ukuran
* Kapasitas
* Kondisi
* Status
* Foto
* Lokasi saat ini
* Sales yang membawa
* Toko tempat display berada
* Tanggal penempatan
* Riwayat perpindahan

## 8.2. Isi Display

Sistem juga perlu mengetahui produk yang berada di dalam setiap display.

Contoh:

```text
DISPLAY-001
│
├── Produk A
│   ├── Varian Original
│   └── Varian Cokelat
│
├── Produk B
│   ├── Varian Pedas
│   └── Varian Original
│
└── Produk C
    └── Varian Original
```

Dengan demikian, Admin dapat mengetahui:

* Display berada di toko mana.
* Display sedang dibawa oleh Sales siapa.
* Produk apa saja yang berada dalam display.
* Varian apa saja yang berada dalam display.
* Jumlah produk dalam display.
* Riwayat perpindahan display.
* Kondisi display.

---

# 9. Dua Metode Penitipan oleh Sales

Sistem harus mendukung dua metode distribusi Sales.

### Metode A — Tanpa Display

```text
Sales
  ↓
Membawa Produk
  ↓
Toko
  ↓
Produk Dititipkan
```

Produk langsung dititipkan kepada toko tanpa menggunakan wadah/display khusus.

### Metode B — Menggunakan Display

```text
Sales
  ↓
Membawa Display
  ↓
Display ditempatkan di Toko
  ↓
Produk dimasukkan ke Display
  ↓
Produk dimonitor berdasarkan Display
```

Sistem harus dapat membedakan kedua metode tersebut.

---

# 10. Konsep Stok

Karena menggunakan sistem konsinyasi, stok tidak hanya berada di gudang.

Sistem perlu mengenali beberapa lokasi/status stok, misalnya:

```text
STOK PRODUK
│
├── Gudang
│
├── Dibawa Sales
│
├── Dititipkan di Toko
│
├── Dititipkan melalui Display
│
├── Terjual
│
├── Retur
│
└── Rusak/Reject
```

Hal ini memungkinkan Admin mengetahui posisi stok secara lebih akurat.

---

# 11. Konsep Kunjungan Sales

Setiap kunjungan Sales ke toko sebaiknya dicatat sebagai sebuah aktivitas.

Data kunjungan dapat meliputi:

* Sales
* Toko
* Tanggal dan waktu
* Produk yang dibawa
* Stok sebelumnya
* Produk terjual
* Produk tersisa
* Produk retur
* Produk baru yang dititipkan
* Display yang dibawa/ditempatkan
* Catatan kunjungan
* Dokumentasi
* Status kunjungan

Dengan demikian, sistem memiliki **riwayat aktivitas Sales** yang dapat ditelusuri.

---

# 12. Struktur Pengguna dan Akses

Sistem menggunakan konsep akun dan usaha.

### Tahap 1 — Registrasi Akun

Setiap pengguna melakukan registrasi akun.

Setelah berhasil melakukan registrasi, pengguna pertama tersebut secara otomatis menjadi:

**Owner**

### Tahap 2 — Pendaftaran Usaha

Owner kemudian wajib melengkapi profil usaha.

Data usaha dapat meliputi:

* Nama Usaha
* Logo
* Alamat
* Nomor Telepon
* Email
* Informasi legalitas jika diperlukan
* Informasi usaha lainnya

Setelah profil usaha selesai, Owner dapat mulai menggunakan aplikasi.

### Tahap 3 — Pengelolaan Pengguna

Owner dapat menambahkan pengguna lain sesuai kebutuhan usaha.

Contoh role:

```text
OWNER
  │
  ├── ADMIN
  │
  └── SALES
```

Masing-masing role memiliki hak akses dan interface yang berbeda sesuai dengan tugasnya.

---

# 13. Interface Berdasarkan Role

## Owner

Owner berfokus pada:

* Ringkasan usaha
* Monitoring penjualan
* Monitoring stok
* Monitoring konsinyasi
* Monitoring sales
* Monitoring agen
* Monitoring toko
* Laporan
* Pengguna
* Pengaturan usaha

## Admin

Admin berfokus pada operasional dan pengelolaan data:

* Produk
* Produksi
* Rekanan
* Stok
* Harga
* Agen
* Toko
* Sales
* Distribusi
* Konsinyasi
* Retur
* Display
* Laporan
* Administrasi data

## Sales

Sales berfokus pada aktivitas lapangan:

* Daftar toko
* Tambah toko
* Kunjungan toko
* Cek stok
* Input produk terjual
* Input produk tersisa
* Input retur
* Penitipan produk
* Pengelolaan display
* Riwayat kunjungan

---

# 14. Alur Besar Sistem

Secara keseluruhan, proses bisnis dapat digambarkan sebagai berikut:

```text
                    ┌──────────────────┐
                    │      OWNER       │
                    │ Registrasi Akun  │
                    └────────┬─────────┘
                             │
                             ▼
                    ┌──────────────────┐
                    │  Profil Usaha    │
                    └────────┬─────────┘
                             │
                             ▼
                    ┌──────────────────┐
                    │ Tambah Pengguna  │
                    └────────┬─────────┘
                             │
              ┌──────────────┴──────────────┐
              ▼                             ▼
        ┌───────────┐                 ┌───────────┐
        │ PRODUKSI  │                 │  REKANAN  │
        │  SENDIRI  │                 │           │
        └─────┬─────┘                 └─────┬─────┘
              │                             │
              └──────────────┬──────────────┘
                             ▼
                    ┌──────────────────┐
                    │  DATA PRODUK     │
                    │  & BATCH         │
                    └────────┬─────────┘
                             │
                             ▼
                    ┌──────────────────┐
                    │      ADMIN       │
                    │ Kelola Produk &  │
                    │      Stok        │
                    └────────┬─────────┘
                             │
                    ┌────────┴────────┐
                    ▼                 ▼
              ┌──────────┐      ┌─────────────┐
              │   AGEN   │      │    SALES    │
              └────┬─────┘      └──────┬──────┘
                   │                   │
                   │                   ▼
                   │             ┌─────────────┐
                   │             │    TOKO     │
                   │             └──────┬──────┘
                   │                    │
                   │             ┌──────┴──────┐
                   │             ▼             ▼
                   │        Tanpa Display  Dengan Display
                   │
                   └──────────────┬──────────────┘
                                  │
                                  ▼
                            ┌─────────────┐
                            │   RETUR     │
                            └──────┬──────┘
                                   │
                  ┌────────────────┼────────────────┐
                  ▼                ▼                ▼
            Cacat Produksi   Cacat Pengiriman   Expired/
                  │                │             Display
                  ▼                ▼                ▼
              Rekanan/          Gudang/          Gudang/
              Produksi           Admin            Admin
```

---

# 15. Teknologi yang Digunakan

Sistem direncanakan menggunakan teknologi yang ramah terhadap ekosistem Cloudflare.

### Frontend

* **React**
* **Refine**
* **Tailwind CSS**
* **shadcn/ui**
* **PWA**

### Backend

* **Hono**

### Database

* **Cloudflare D1**

### Storage

* **Cloudflare R2**

### Deployment

* **Cloudflare**

Arsitektur teknologi secara sederhana:

```text
┌─────────────────────────────────────────────┐
│                  USER                       │
│                                             │
│       Browser / PWA                         │
└──────────────────────┬──────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────┐
│              FRONTEND                       │
│                                             │
│ React + Refine                              │
│ Tailwind CSS + shadcn/ui                    │
│ PWA                                         │
└──────────────────────┬──────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────┐
│               BACKEND                       │
│                  Hono                       │
│             Cloudflare Workers              │
└───────────────┬─────────────────────────────┘
                │
        ┌───────┴────────┐
        ▼                ▼
┌──────────────┐   ┌──────────────┐
│ Cloudflare   │   │ Cloudflare   │
│     D1       │   │     R2       │
│  Database    │   │   Storage    │
└──────────────┘   └──────────────┘
```

---

# 16. Tujuan Utama Sistem

Sistem digital ini diharapkan dapat menggantikan proses manual dan menyediakan satu sumber data terpusat untuk:

1. Pengelolaan usaha.
2. Pengelolaan pengguna.
3. Pengelolaan produk.
4. Pengelolaan produksi sendiri.
5. Pengelolaan produk dari rekanan.
6. Pengelolaan batch dan expired date.
7. Pengelolaan harga.
8. Pengelolaan stok.
9. Pengelolaan agen.
10. Pengelolaan sales.
11. Pengelolaan toko.
12. Pengelolaan konsinyasi.
13. Pengelolaan kunjungan sales.
14. Pengelolaan retur.
15. Pengelolaan display/wadah.
16. Monitoring distribusi produk.
17. Pelacakan posisi produk.
18. Pelacakan riwayat transaksi dan aktivitas.
19. Pelaporan dan monitoring usaha.

Dengan struktur tersebut, sistem tidak hanya berfungsi sebagai aplikasi pencatatan penjualan, tetapi sebagai **sistem manajemen distribusi produk berbasis konsinyasi** yang menghubungkan Owner, Admin, Sales, Agen, Toko, Rekanan, Produk, Stok, Display, dan Retur dalam satu sistem.
