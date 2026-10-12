## Dokumentasi Alur Sistem Konsinyasi & Distribusi

Sistem ini dirancang untuk mendigitalkan proses bisnis yang berbasis konsinyasi dan penjualan agen. Aplikasi menggunakan model *multi-tenant* (SaaS), di mana pengguna pertama mendaftar sebagai Owner untuk membangun profil usahanya.

### 1. Sumber Pengadaan Produk (Inbound)

Semua produk yang masuk akan didata oleh **Admin** dengan detail: *Batch produksi, Tanggal produksi, Tanggal kedaluwarsa (exp), Nama produk, Jumlah, Harga produksi, Harga sales, dan Harga agen*.

* **Pola 1 (Produksi Internal):** Produk dihasilkan sendiri. Setelah proses produksi selesai, produk diserahkan ke admin untuk pendataan stok dan penetapan harga.
* **Pola 2 (Produksi Rekanan):** Produk diproduksi oleh pihak luar (rekanan/maklon). Setelah selesai, produk diserahkan kepada admin untuk didata.

### 2. Jalur Distribusi (Outbound)

Setelah stok terdata oleh Admin, produk didistribusikan melalui dua jalur utama:

* **Jalur Agen (Beli Putus):** Agen membeli produk dengan harga khusus (lebih murah dari harga sales) disertai syarat minimal order. Terdapat jaminan garansi di mana produk retur akan diganti langsung dengan produk baru sesuai jumlah retur.
* **Jalur Sales (Konsinyasi):** Sales membawa produk untuk dititipkan ke toko-toko mitra.

### 3. Operasional Sales di Lapangan

Dalam menjalankan sistem konsinyasi, Sales memiliki alur kerja spesifik saat beroperasi di lapangan:

* **Toko Baru (Belum Terdata):** Sales mendaftarkan data profil toko ke dalam sistem terlebih dahulu, lalu menitipkan produk. Toko ini otomatis masuk dalam siklus kunjungan berikutnya.
* **Toko Lama (Sudah Terdata):** Sales mendata sisa stok titipan periode sebelumnya meliputi: **Produk Terjual, Produk Belum Terjual, dan Retur**. Setelah opname selesai, Sales meletakkan stok produk baru.

**Pelacakan Aset Display:**
Saat menitipkan produk, Sales memiliki dua skenario penempatan:

1. Hanya meletakkan produk di rak milik toko.
2. Menitipkan produk beserta **wadah/rak display milik perusahaan**. Satu wadah dapat memuat beberapa produk dengan berbagai varian. Sistem akan melacak titik lokasi setiap wadah display beserta rincian produk yang ada di dalamnya secara *real-time*.

### 4. Manajemen Retur

Sistem mengakomodasi pengembalian produk dengan penanganan yang disesuaikan berdasarkan penyebab kerusakan:

| Kondisi Retur | Tindakan Penanganan |
| --- | --- |
| **Cacat Produksi** | Dikembalikan ke Rekanan atau Tempat Produksi Internal |
| **Cacat Pengiriman** | Dikembalikan ke Gudang / Kantor Admin |
| **Kedaluwarsa (Expired)** | Dikembalikan ke Gudang / Kantor Admin |
| **Cacat Display** (Rusak di toko) | Dikembalikan ke Gudang / Kantor Admin |

### 5. Hierarki Pengguna & Hak Akses

Sistem memiliki antarmuka (dashboard) yang disesuaikan dengan tugas pokok masing-masing peran:

* **Owner:** Melakukan registrasi awal, mendaftarkan entitas usaha, dan mengelola master data (tambah produk, tambah pengguna/karyawan).
* **Admin:** Berfokus pada manajemen inventaris, pendataan produk masuk (produksi/rekanan), pengaturan harga operasional, dan penerimaan retur di gudang.
* **Sales:** Berfokus pada operasional aplikasi berbasis *mobile*, manajemen kunjungan toko, pelacakan wadah display, dan pencatatan transaksi konsinyasi.

### 6. Arsitektur & Stack Teknologi

Sistem ini akan dibangun menggunakan tumpukan teknologi modern yang sepenuhnya dioptimalkan untuk ekosistem *Edge Computing*:

* **Frontend & Backend:** Refine, Hono
* **UI/Styling:** Tailwind CSS, Shadcn UI
* **Platform Target:** Progressive Web App (PWA) untuk performa *mobile-first* bagi petugas lapangan.
* **Infrastruktur Deployment:** Cloudflare (Pages / Workers)
* **Database:** Cloudflare D1 (SQLite)
* **Storage:** Cloudflare R2 (Object Storage)