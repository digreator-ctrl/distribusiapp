Berdasarkan alur konsinyasi yang Anda rancang, pendekatan terbaik untuk PWA sales adalah desain *mobile-first* yang bisa dioperasikan dengan satu tangan (layar sentuh) saat sales berada di lapangan. UI harus fokus pada kecepatan input data dan kejelasan informasi stok.

Berikut adalah rancangan arsitektur UI, menu, dan fitur yang ideal untuk PWA sales Anda.

### 📱 Struktur Navigasi Utama (Bottom Navigation Bar)

Karena ini PWA untuk penggunaan *mobile*, gunakan navigasi bawah dengan 4 menu utama agar sales bisa berpindah halaman dengan cepat:

1. 🏠 **Beranda** (Dashboard ringkasan)
2. 🏪 **Toko** (Daftar & operasional toko)
3. 📦 **Stok Saya** (Manajemen inventori di mobil/motor sales)
4. 🕒 **Riwayat** (Jejak aktivitas harian)

---

### 📋 Rincian Halaman & Fitur

#### 1. Halaman Beranda (Dashboard)

Halaman pertama yang dilihat sales saat membuka aplikasi. Harus memberikan ringkasan performa hari ini.

* **Kartu Ringkasan (Top Section):**
* Total Uang Diterima Hari Ini (Rp).
* Jumlah Toko Dikunjungi vs Target.
* Total Item Terjual Hari Ini.


* **Aksi Cepat (Quick Actions):**
* Tombol besar: **"Ambil Stok Gudang"**
* Tombol besar: **"Kunjungi Toko"**


* **Tugas Tertunda (Pending Tasks):** Daftar toko di rute hari ini yang belum dikunjungi.

#### 2. Halaman Stok Saya (Inventori Sales)

Halaman ini mengelola pergerakan barang antara gudang dan bagasi/kendaraan sales.

* **Tab 1: Stok di Tangan (Stok Aktif):** Menampilkan daftar item dan jumlah fisik yang saat ini dibawa oleh sales.
* **Tab 2: Ambil Gudang (Stok Masuk):**
* Form untuk memilih barang dan jumlah yang diambil dari gudang sebelum berangkat.
* *(Opsional)* Fitur scan barcode barang atau *approval* dari admin gudang.


* **Tab 3: Rekap Keluar:** Ringkasan total barang yang sudah dititipkan atau laku pada hari tersebut.

#### 3. Halaman Toko (Mitra Konsinyasi)

Pusat operasional sales saat berada di lokasi mitra.

* **Daftar Toko:** List toko dengan fitur pencarian dan filter (Toko Searah/Satu Rute, Toko Jatuh Tempo).
* **Tambah Toko Baru:** Form input data toko baru (Nama, Alamat, Titik GPS, Nama Pemilik, Nomor WA).
* **Detail Toko:** Saat satu toko diklik, muncul riwayat kunjungan terakhir dan status piutang/konsinyasi yang sedang berjalan.

#### 4. Alur Kunjungan Toko (Fitur Inti / *Core Flow*)

Ini adalah tampilan *Wizard* (langkah demi langkah) atau *Bottom Sheet/Drawer* yang muncul saat sales menekan tombol **"Mulai Kunjungan"** di sebuah toko. Alurnya dibuat berurutan agar tidak ada data terlewat:

1. **Cek Stok Lama:** Layar menampilkan data **Stok Awal** (barang yang dititipkan pada kunjungan sebelumnya).
2. **Input Stok Sisa:** Sales menghitung fisik barang di rak dan menginput angka sisa.
* *Sistem UI otomatis menghitung:* `[Stok Awal] - [Stok Sisa] = [Stok Terjual]` dan menampilkan nominal tagihan (Rp).


3. **Pembayaran:** Form input **Uang Diterima**. (Bisa penuh atau sebagian jika toko berhutang).
4. **Titip Stok Baru:** Form untuk memilih barang dari "Stok di Tangan" untuk dititipkan kembali ke rak toko. Sistem otomatis memvalidasi agar sales tidak menitipkan barang melebihi stok yang ia bawa.
5. **Konfirmasi & Selesai:** Ringkasan transaksi. Tombol "Simpan Kunjungan" yang akan memperbarui database, memotong stok di tangan, dan mencetak nota (via printer Bluetooth) atau mengirim struk digital otomatis via WhatsApp ke pemilik toko.

#### 5. Halaman Riwayat

* **Daftar Aktivitas harian:** *Timeline* (garis waktu) kunjungan toko, setoran uang, dan pengambilan stok dari gudang. Berguna untuk kroscek jika ada selisih uang/barang di penghujung hari.

### 💡 Tips UX & Komponen Visual untuk PWA

* **Gunakan *Bottom Drawer*:** Untuk form input angka (stok sisa, titip baru), gunakan *drawer* yang muncul dari bawah (seperti desain Shadcn UI) ketimbang memindahkan user ke halaman baru. Ini menjaga konteks visual toko tetap terlihat.
* **Indikator Warna (Status):** Gunakan warna Hijau untuk uang masuk/toko beres, Merah untuk toko tutup/nunggak bayar, dan Kuning untuk stok di tangan yang hampir habis.
* **Dukungan Offline:** Karena jaringan di lapangan bisa blank, pastikan PWA bisa menyimpan data *cache* transaksi sementara dan melakukan *sinkronisasi* otomatis saat sinyal kembali stabil.