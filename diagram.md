Tentu. Saya susun **diagram ASCII end-to-end** berdasarkan arsitektur yang sudah kita sepakati, dari **registrasi → usaha → produk → produksi/rekanan → stok → agen/sales → toko → konsinyasi → display → retur → laporan**.

## 1. Diagram Besar Sistem

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│              SISTEM MANAJEMEN PENJUALAN & KONSINYASI                       │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
                         ┌────────────────────────┐
                         │      REGISTRASI        │
                         │         AKUN           │
                         └───────────┬────────────┘
                                     │
                                     ▼
                         ┌────────────────────────┐
                         │        OWNER           │
                         └───────────┬────────────┘
                                     │
                                     ▼
                         ┌────────────────────────┐
                         │     DAFTAR USAHA       │
                         │   / BUSINESS TENANT    │
                         └───────────┬────────────┘
                                     │
                    ┌────────────────┼────────────────┐
                    │                │                │
                    ▼                ▼                ▼
             ┌────────────┐   ┌────────────┐   ┌────────────┐
             │   ADMIN    │   │   SALES    │   │   OWNER    │
             │ Operasional│   │ Lapangan   │   │ Monitoring │
             └─────┬──────┘   └──────┬─────┘   └────────────┘
                   │                 │
                   └────────┬────────┘
                            ▼
                 ┌──────────────────────┐
                 │      PRODUK          │
                 │  Master Produk       │
                 │  Varian              │
                 │  Kategori            │
                 │  Satuan              │
                 └──────────┬───────────┘
                            │
                ┌───────────┴────────────┐
                │                        │
                ▼                        ▼
       ┌─────────────────┐      ┌─────────────────┐
       │ PRODUKSI SENDIRI│      │     REKANAN     │
       └────────┬────────┘      └────────┬────────┘
                │                        │
                │                        ▼
                │               ┌─────────────────┐
                │               │ PENERIMAAN      │
                │               │ PRODUK REKANAN  │
                │               └────────┬────────┘
                │                        │
                └────────────┬───────────┘
                             ▼
                   ┌────────────────────┐
                   │    BATCH PRODUK    │
                   │                    │
                   │ • Batch Number     │
                   │ • Produksi         │
                   │ • Expired          │
                   │ • Quantity         │
                   │ • Cost              │
                   └─────────┬──────────┘
                             │
                             ▼
                   ┌────────────────────┐
                   │    STOK GUDANG     │
                   └─────────┬──────────┘
                             │
                 ┌───────────┴────────────┐
                 │                        │
                 ▼                        ▼
        ┌─────────────────┐      ┌─────────────────┐
        │      AGEN       │      │      SALES      │
        │   PENJUALAN     │      │   DISTRIBUSI    │
        └────────┬────────┘      └────────┬────────┘
                 │                        │
                 │                        ▼
                 │               ┌─────────────────┐
                 │               │      TOKO       │
                 │               │   KONSINYASI    │
                 │               └────────┬────────┘
                 │                        │
                 │             ┌──────────┴──────────┐
                 │             │                     │
                 │             ▼                     ▼
                 │      ┌──────────────┐      ┌──────────────┐
                 │      │ TANPA DISPLAY│      │  DENGAN      │
                 │      │              │      │  DISPLAY     │
                 │      └──────────────┘      └──────┬───────┘
                 │                                   │
                 │                                   ▼
                 │                            ┌──────────────┐
                 │                            │   DISPLAY    │
                 │                            │    / WADAH   │
                 │                            └──────┬───────┘
                 │                                   │
                 └────────────────┬──────────────────┘
                                  │
                                  ▼
                         ┌─────────────────┐
                         │      RETUR      │
                         └────────┬────────┘
                                  │
             ┌────────────────────┼────────────────────┐
             │                    │                    │
             ▼                    ▼                    ▼
       ┌────────────┐      ┌────────────┐      ┌────────────┐
       │   CACAT    │      │  SHIPPING  │      │  EXPIRED   │
       │  PRODUKSI  │      │   DAMAGE   │      │ / DISPLAY  │
       └─────┬──────┘      └─────┬──────┘      └─────┬──────┘
             │                   │                   │
             ▼                   ▼                   ▼
       ┌────────────┐      ┌────────────┐      ┌────────────┐
       │ REKANAN /  │      │   GUDANG   │      │   GUDANG   │
       │ PRODUKSI   │      │   ADMIN    │      │   ADMIN    │
       └────────────┘      └────────────┘      └────────────┘

                                  │
                                  ▼
                         ┌─────────────────┐
                         │     LAPORAN     │
                         ├─────────────────┤
                         │ • Produk        │
                         │ • Stok          │
                         │ • Penjualan     │
                         │ • Konsinyasi    │
                         │ • Sales         │
                         │ • Agen          │
                         │ • Toko          │
                         │ • Retur         │
                         │ • Display       │
                         └─────────────────┘
```

---

# 2. Diagram Role & Akses

```text
                         ┌───────────────────┐
                         │       OWNER       │
                         └─────────┬─────────┘
                                   │
             ┌─────────────────────┼─────────────────────┐
             │                     │                     │
             ▼                     ▼                     ▼
       ┌────────────┐       ┌────────────┐       ┌────────────┐
       │ Monitoring │       │   Laporan  │       │ Pengaturan │
       └────────────┘       └────────────┘       └────────────┘


                         ┌───────────────────┐
                         │       ADMIN       │
                         └─────────┬─────────┘
                                   │
        ┌──────────┬──────────┬────┼────┬──────────┬──────────┐
        ▼          ▼          ▼         ▼          ▼          ▼
     Produk     Produksi     Stok     Agen       Toko       Retur
        │          │          │         │          │          │
        └──────────┴──────────┴─────────┴──────────┴──────────┘
                                   │
                                   ▼
                              Laporan


                         ┌───────────────────┐
                         │       SALES       │
                         └─────────┬─────────┘
                                   │
              ┌────────────────────┼───────────────────┐
              ▼                    ▼                   ▼
          ┌────────┐          ┌───────────┐       ┌─────────┐
          │  Toko  │          │Konsinyasi │       │ Display │
          └────┬───┘          └─────┬─────┘       └────┬────┘
               │                    │                  │
               └────────────────────┼──────────────────┘
                                    ▼
                                Kunjungan
```

---

# 3. Diagram Modul Aplikasi

```text
┌─────────────────────────────────────────────────────────────┐
│                         APLIKASI                            │
└────────────────────────────┬────────────────────────────────┘
                             │
       ┌─────────────────────┼─────────────────────┐
       │                     │                     │
       ▼                     ▼                     ▼
┌─────────────┐       ┌─────────────┐       ┌─────────────┐
│   ACCOUNT   │       │   BUSINESS  │       │   ACCESS    │
│             │       │             │       │             │
│ Register    │       │ Profil      │       │ Role        │
│ Login       │       │ Usaha       │       │ Permission  │
│ Profile     │       │ Pengguna    │       │ Member      │
└─────────────┘       └─────────────┘       └─────────────┘


┌─────────────────────────────────────────────────────────────┐
│                       OPERASIONAL                           │
└────────────────────────────┬────────────────────────────────┘
                             │
     ┌───────────┬───────────┼───────────┬───────────┐
     ▼           ▼           ▼           ▼           ▼
┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐
│ PRODUK  │ │ PRODUKSI│ │  STOK   │ │ DISTRIB.│ │ KONSINY.│
└────┬────┘ └────┬────┘ └────┬────┘ └────┬────┘ └────┬────┘
     │           │           │           │           │
     ▼           ▼           ▼           ▼           ▼
 Variant      Batch       Movement      Agen        Toko
 Kategori     Produksi    Location      Sales       Visit
 Satuan       Rekanan     Ledger        Order       Consign
 Harga                    Opname                    Sold
                                                     Return


                    ┌─────────────────┐
                    │     DISPLAY     │
                    ├─────────────────┤
                    │ Display         │
                    │ Assignment     │
                    │ Display Item   │
                    │ Movement       │
                    └────────┬────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │      RETUR      │
                    ├─────────────────┤
                    │ Production     │
                    │ Shipping       │
                    │ Expired        │
                    │ Display        │
                    └────────┬────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │     LAPORAN     │
                    └─────────────────┘
```

---

# 4. Diagram Alur Produk

```text
                         PRODUK
                           │
             ┌─────────────┴─────────────┐
             │                           │
             ▼                           ▼
      PRODUKSI SENDIRI               REKANAN
             │                           │
             ▼                           ▼
        PRODUKSI                    PRODUK MASUK
             │                           │
             └─────────────┬─────────────┘
                           ▼
                      BATCH PRODUK
                           │
                  ┌────────┴────────┐
                  │                 │
                  ▼                 ▼
             Tanggal           Expired Date
             Produksi
                  │
                  ▼
             STOK GUDANG
                  │
        ┌─────────┴─────────┐
        │                   │
        ▼                   ▼
      AGEN                SALES
        │                   │
        │                   ▼
        │                 TOKO
        │                   │
        │          ┌────────┴────────┐
        │          │                 │
        │          ▼                 ▼
        │      Tanpa Display      Display
        │          │                 │
        │          └────────┬────────┘
        │                   │
        ▼                   ▼
     TERJUAL              TERJUAL
        │                   │
        │                   │
        └─────────┬─────────┘
                  ▼
               RETUR
```

---

# 5. Diagram Pergerakan Stok

Ini bagian yang sangat penting untuk sistem Anda.

```text
                         PRODUKSI
                            │
                            │ +100
                            ▼
                     ┌─────────────┐
                     │   GUDANG    │
                     │     100     │
                     └──────┬──────┘
                            │
                            │ -20
                            ▼
                     ┌─────────────┐
                     │    SALES    │
                     │      20     │
                     └──────┬──────┘
                            │
                       ┌────┴────┐
                       │         │
                    -10│         │-5
                       ▼         ▼
                 ┌──────────┐ ┌──────────┐
                 │  TOKO A  │ │  TOKO B  │
                 │    10    │ │     5    │
                 └────┬─────┘ └────┬─────┘
                      │             │
                   -4 │          -2 │
                      ▼             ▼
                   TERJUAL       TERJUAL
                      │             │
                      │             │
                   -1 │          -1 │
                      ▼             ▼
                    RETUR         RETUR
                      │             │
                      └──────┬──────┘
                             ▼
                          GUDANG
```

Dengan model ini:

```text
STOK = seluruh mutasi masuk - seluruh mutasi keluar
```

dan bukan:

```text
stok_gudang = ...
stok_sales   = ...
stok_toko    = ...
```

yang masing-masing berdiri sendiri tanpa histori.

---

# 6. Diagram Proses Sales ke Toko

```text
                  SALES
                    │
                    ▼
             Pilih / Scan Toko
                    │
             ┌──────┴──────┐
             │             │
             ▼             ▼
       TOKO TERDAFTAR   TOKO BARU
             │             │
             │             ▼
             │       Input Data Toko
             │             │
             └──────┬──────┘
                    ▼
             KUNJUNGAN TOKO
                    │
                    ▼
             Cek Stok Lama
                    │
        ┌───────────┼────────────┐
        ▼           ▼            ▼
      TERJUAL     SISA          RETUR
        │           │            │
        └───────────┼────────────┘
                    ▼
             Input Produk Baru
                    │
                    ▼
             Tentukan Display
                    │
             ┌──────┴──────┐
             ▼             ▼
          TANPA          DENGAN
         DISPLAY         DISPLAY
             │             │
             │             ▼
             │       Pilih Display
             │             │
             └──────┬──────┘
                    ▼
             SIMPAN KUNJUNGAN
                    │
                    ▼
              STOK TERBARU
```

---

# 7. Diagram Display

```text
                     DISPLAY
                        │
                        ▼
                 DISPLAY-001
                        │
               ┌────────┴────────┐
               │                 │
               ▼                 ▼
            Sales A           Toko A
                                 │
                                 ▼
                       ┌──────────────────┐
                       │   DISPLAY ITEMS  │
                       └────────┬─────────┘
                                │
                ┌───────────────┼───────────────┐
                ▼               ▼               ▼
             Produk A        Produk B        Produk C
                │               │               │
             Original         Original         Pedas
                │               │               │
              Batch 01        Batch 02        Batch 03
                │               │               │
                ▼               ▼               ▼
               10               5               8
```

Jika display dipindahkan:

```text
DISPLAY-001
     │
     ▼
   TOKO A
     │
     │ dipindahkan
     ▼
   TOKO B
     │
     │ dipindahkan
     ▼
   TOKO C
```

Sistem tetap memiliki histori:

```text
DISPLAY-001
│
├── Toko A : 01 Sep
├── Toko B : 15 Sep
└── Toko C : 28 Sep
```

---

# 8. Diagram Retur

```text
                         RETUR
                           │
       ┌───────────────────┼───────────────────┐
       │                   │                   │
       ▼                   ▼                   ▼
 CACAT PRODUKSI      CACAT PENGIRIMAN      EXPIRED
       │                   │                   │
       ▼                   ▼                   ▼
 PRODUKSI/REKANAN       GUDANG             GUDANG
                                               │
                                               │
                           ┌───────────────────┘
                           ▼
                     CACAT DISPLAY
                           │
                           ▼
                         GUDANG
```

Kemudian:

```text
RETUR
  │
  ▼
VERIFIKASI
  │
  ├── Ditolak
  │
  └── Disetujui
         │
         ▼
    PROSES RETUR
         │
    ┌────┴─────┐
    ▼          ▼
Kembali      Ganti
ke sumber    Produk
    │          │
    ▼          ▼
SELESAI      SELESAI
```

---

# 9. Diagram Database / ERD ASCII

```text
┌─────────────────┐
│      USERS      │
├─────────────────┤
│ PK id           │
│ name            │
│ email           │
│ password_hash   │
└────────┬────────┘
         │
         │ 1:N
         ▼
┌─────────────────────┐
│  BUSINESS_MEMBERS   │
├─────────────────────┤
│ PK id               │
│ FK business_id      │
│ FK user_id          │
│ FK role_id          │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│     BUSINESSES      │
├─────────────────────┤
│ PK id               │
│ FK owner_user_id    │
│ name                │
│ slug                │
└──────────┬──────────┘
           │
           ├───────────────────────────────┐
           │                               │
           ▼                               ▼
┌─────────────────────┐           ┌─────────────────────┐
│      PRODUCTS       │           │      SUPPLIERS      │
├─────────────────────┤           ├─────────────────────┤
│ PK id               │           │ PK id               │
│ FK business_id      │           │ FK business_id      │
│ category_id         │           │ name                │
│ name                │           │ contact_person      │
└──────────┬──────────┘           └─────────────────────┘
           │
           │ 1:N
           ▼
┌─────────────────────┐
│ PRODUCT_VARIANTS    │
├─────────────────────┤
│ PK id               │
│ FK product_id       │
│ SKU                 │
│ barcode             │
│ price_production    │
│ price_sales         │
│ price_agent         │
└──────────┬──────────┘
           │
           │ 1:N
           ▼
┌─────────────────────┐
│   PRODUCT_BATCHES   │
├─────────────────────┤
│ PK id               │
│ FK product_id       │
│ FK variant_id       │
│ FK supplier_id      │
│ batch_number        │
│ source_type         │
│ production_date     │
│ expired_date        │
│ quantity_initial    │
└──────────┬──────────┘
           │
           │
           ▼
┌─────────────────────┐
│  STOCK_MOVEMENTS    │
├─────────────────────┤
│ PK id               │
│ FK business_id      │
│ FK product_id       │
│ FK variant_id       │
│ FK batch_id         │
│ from_location_id    │
│ to_location_id      │
│ quantity            │
│ movement_type       │
│ reference_type      │
│ reference_id        │
└─────────────────────┘
```

---

# 10. ERD Bagian Sales, Toko & Konsinyasi

```text
┌───────────────┐
│     SALES     │
├───────────────┤
│ PK id         │
│ FK user_id    │
│ FK business   │
└───────┬───────┘
        │
        │ 1:N
        ▼
┌──────────────────┐
│   SALES_VISITS   │
├──────────────────┤
│ PK id            │
│ FK sales_id      │
│ FK store_id      │
│ visit_date       │
└────────┬─────────┘
         │
         │ 1:N
         ▼
┌────────────────────┐
│ SALES_VISIT_ITEMS  │
├────────────────────┤
│ PK id              │
│ FK visit_id        │
│ FK product_id      │
│ FK batch_id        │
│ previous_qty       │
│ sold_qty           │
│ return_qty         │
│ new_qty            │
└────────────────────┘
         
         ▲
         │
         │
┌────────┴──────────┐
│      STORES       │
├───────────────────┤
│ PK id             │
│ FK business_id    │
│ store_code        │
│ name              │
│ owner_name        │
│ phone             │
│ address           │
└─────────┬─────────┘
          │
          │ 1:N
          ▼
┌────────────────────┐
│    CONSIGNMENTS    │
├────────────────────┤
│ PK id              │
│ FK store_id        │
│ FK sales_id        │
│ FK visit_id        │
│ date               │
│ status             │
└─────────┬──────────┘
          │
          │ 1:N
          ▼
┌──────────────────────┐
│  CONSIGNMENT_ITEMS   │
├──────────────────────┤
│ PK id                │
│ FK consignment_id    │
│ FK product_id        │
│ FK variant_id        │
│ FK batch_id          │
│ quantity             │
└──────────────────────┘
```

---

# 11. ERD Display

```text
┌────────────────────┐
│      DISPLAYS      │
├────────────────────┤
│ PK id              │
│ FK business_id     │
│ display_code       │
│ name               │
│ type               │
│ capacity           │
│ condition          │
└─────────┬──────────┘
          │
          │ 1:N
          ▼
┌──────────────────────┐
│ DISPLAY_ASSIGNMENTS  │
├──────────────────────┤
│ PK id                │
│ FK display_id        │
│ FK sales_id          │
│ FK store_id          │
│ assigned_at          │
│ released_at          │
└──────────────────────┘


┌────────────────────┐
│      DISPLAYS      │
└─────────┬──────────┘
          │
          │ 1:N
          ▼
┌────────────────────┐
│   DISPLAY_ITEMS    │
├────────────────────┤
│ PK id              │
│ FK display_id      │
│ FK product_id      │
│ FK variant_id      │
│ FK batch_id        │
│ quantity           │
└────────────────────┘
```

---

# 12. ERD Retur

```text
┌──────────────────────┐
│       RETURNS        │
├──────────────────────┤
│ PK id                │
│ business_id          │
│ return_number        │
│ source_type          │
│ source_id            │
│ return_type          │
│ destination_type     │
│ destination_id       │
│ status               │
│ return_date          │
└──────────┬───────────┘
           │
           │ 1:N
           ▼
┌──────────────────────┐
│     RETURN_ITEMS     │
├──────────────────────┤
│ PK id                │
│ FK return_id         │
│ FK product_id        │
│ FK variant_id        │
│ FK batch_id          │
│ quantity             │
│ condition            │
│ replacement_qty      │
└──────────────────────┘
```

---

# 13. Arsitektur Teknologi

```text
                           USER
                            │
                            ▼
              ┌─────────────────────────┐
              │     PWA / Browser       │
              └────────────┬────────────┘
                           │
                           ▼
              ┌─────────────────────────┐
              │         REACT           │
              │        REFINE           │
              │      TAILWIND CSS       │
              │       SHADCN/UI         │
              └────────────┬────────────┘
                           │
                           │ API
                           ▼
              ┌─────────────────────────┐
              │   CLOUDFLARE WORKER     │
              │                         │
              │          HONO           │
              └────────────┬────────────┘
                           │
                ┌──────────┴──────────┐
                │                     │
                ▼                     ▼
       ┌────────────────┐    ┌────────────────┐
       │ CLOUDFLARE D1  │    │ CLOUDFLARE R2  │
       │                │    │                │
       │ Database       │    │ File Storage   │
       │                │    │                │
       │ Users          │    │ Foto Produk    │
       │ Business       │    │ Foto Toko      │
       │ Products       │    │ Foto Display   │
       │ Stock          │    │ Dokumentasi    │
       │ Sales          │    │                │
       │ Stores         │    │                │
       │ Transactions   │    │                │
       └────────────────┘    └────────────────┘
```

---

# 14. Gambaran Final dalam Satu Diagram

Kalau seluruh sistem ingin dilihat **dalam satu gambar besar**, bentuk konseptualnya adalah:

```text
                                   ┌───────────────┐
                                   │     USER      │
                                   └───────┬───────┘
                                           │
                                           ▼
                                   ┌───────────────┐
                                   │   REGISTER    │
                                   └───────┬───────┘
                                           │
                                           ▼
                                   ┌───────────────┐
                                   │     OWNER     │
                                   └───────┬───────┘
                                           │
                                           ▼
                                   ┌───────────────┐
                                   │    BUSINESS   │
                                   └───────┬───────┘
                                           │
                    ┌──────────────────────┼─────────────────────┐
                    │                      │                     │
                    ▼                      ▼                     ▼
                 OWNER                  ADMIN                  SALES
                    │                      │                     │
                    │              ┌───────┴───────┐             │
                    │              │               │             │
                    │              ▼               ▼             ▼
                    │           PRODUK          PRODUKSI       TOKO
                    │              │               │             │
                    │              │               │             ▼
                    │              │               │        KUNJUNGAN
                    │              │               │             │
                    │              └───────┬───────┘             │
                    │                      ▼                     │
                    │                   BATCH                    │
                    │                      │                     │
                    │                      ▼                     │
                    │                   GUDANG                    │
                    │                      │                     │
                    │              ┌───────┴───────┐             │
                    │              │               │             │
                    │              ▼               ▼             │
                    │             AGEN            SALES ◄────────┘
                    │              │               │
                    │              │               ▼
                    │              │             TOKO
                    │              │               │
                    │              │        ┌──────┴──────┐
                    │              │        │             │
                    │              │        ▼             ▼
                    │              │     PRODUK       DISPLAY
                    │              │    KONSINYASI      │
                    │              │        │             │
                    │              │        └──────┬──────┘
                    │              │               │
                    │              └───────┬───────┘
                    │                      ▼
                    │                    RETUR
                    │                      │
                    │          ┌───────────┼───────────┐
                    │          ▼           ▼           ▼
                    │       PRODUKSI    GUDANG      GUDANG
                    │       /REKANAN    ADMIN       ADMIN
                    │
                    └──────────────────────┐
                                           ▼
                                      ┌───────────┐
                                      │  LAPORAN  │
                                      └───────────┘


         ┌──────────────────────────────────────────────────┐
         │                 STOCK LEDGER                      │
         │                                                  │
         │  PRODUKSI → GUDANG → SALES → TOKO → TERJUAL     │
         │                    │       │                     │
         │                    │       └──→ RETUR            │
         │                    │                             │
         │                    └────────→ DISPLAY            │
         │                                                  │
         │  Semua perpindahan dicatat sebagai STOCK        │
         │  MOVEMENT dan memiliki histori.                 │
         └──────────────────────────────────────────────────┘
```

**Inti arsitektur ini adalah:** `Business → Product/Batch → Stock Movement → Distribution → Store/Agent → Consignment/Sales → Return`, sementara **Display menjadi entitas tersendiri** dan **Stock Movement menjadi pusat pencatatan pergerakan stok**. Ini akan membuat desain database dan implementasi Hono + D1 jauh lebih konsisten ketika nanti masuk ke tahap ERD detail dan migration SQL.
