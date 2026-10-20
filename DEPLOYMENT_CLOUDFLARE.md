# Panduan Deploy ke Cloudflare (Workers, Pages & D1)

Sistem **distribusiapp** telah dirancang dengan arsitektur Cloudflare-native:
- **Backend API**: Cloudflare Workers (berbasis framework Hono).
- **Database**: Cloudflare D1 (Database serverless SQLite terdistribusi).
- **Frontend**: Cloudflare Pages (React + Vite + Tailwind CSS + PWA).

---

## 1. Persiapan Awal

Pastikan Anda telah memiliki akun di [Cloudflare Dashboard](https://dash.cloudflare.com/) dan Node.js terpasang.

Masuk ke akun Cloudflare melalui CLI terminal:
```bash
npx wrangler login
```
*Browser akan terbuka untuk konfirmasi otorisasi akun Cloudflare Anda.*

---

## 2. Setup Database Cloudflare D1

### A. Buat Database D1 di Cloudflare
Jalankan perintah ini dari folder root proyek:
```bash
cd backend
npx wrangler d1 create distribusiapp-db
```

Output terminal akan menampilkan konfigurasi binding, contoh:
```toml
[[d1_databases]]
binding = "DB"
database_name = "distribusiapp-db"
database_id = "xxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
```

### B. Masukkan `database_id` ke `backend/wrangler.toml`
Buka file `backend/wrangler.toml` dan ganti `"your-database-id-here"` dengan `database_id` yang Anda dapatkan di langkah A:
```toml
name = "distribusiapp-backend"
compatibility_date = "2024-03-20"

[[d1_databases]]
binding = "DB"
database_name = "distribusiapp-db"
database_id = "xxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" # <- Ganti dengan ID asli
```

### C. Eksekusi Schema ke Cloudflare D1 Remote
Inisialisasi semua tabel dan data awal ke database D1 remote Cloudflare:
```bash
# Dari folder backend:
npm run d1:init:remote
```
*(Atau `npx wrangler d1 execute distribusiapp-db --remote --file=./schema.sql`)*

---

## 3. Deploy Backend (Cloudflare Worker)

Setelah database D1 terhubung, deploy backend:
```bash
# Dari folder backend:
npm run deploy
```
*(Atau dari folder root: `npm run deploy:backend`)*

Setelah selesai, Anda akan mendapatkan URL endpoint publik, misalnya:
`https://distribusiapp-backend.<subdomain-cloudflare>.workers.dev`

Endpoint API aktif di:
`https://distribusiapp-backend.<subdomain-cloudflare>.workers.dev/api`

---

## 4. Deploy Frontend (Cloudflare Pages)

Ada 2 cara mudah untuk mendeploy Frontend:

### Opsi A: Otomatis via GitHub (Sangat Disarankan untuk CI/CD)
1. Buka [Cloudflare Dashboard](https://dash.cloudflare.com/) > **Workers & Pages** > **Create application** > **Pages** > **Connect to Git**.
2. Pilih repository `distribusiapp`.
3. Masukkan konfigurasi build:
   - **Framework preset**: `Vite`
   - **Build command**: `npm run build:frontend` *(atau `cd frontend && npm run build`)*
   - **Build output directory**: `frontend/dist`
   - **Root directory**: `/` *(atau `frontend` jika langsung menargetkan folder frontend)*
4. Pada menu **Environment variables**, tambahkan:
   - **Variable name**: `VITE_API_URL`
   - **Value**: `https://distribusiapp-backend.<subdomain-cloudflare>.workers.dev/api`
5. Klik **Save and Deploy**.

### Opsi B: Deploy Langsung via CLI Terminal
1. Buat build frontend dengan environment variable URL backend:
   ```bash
   cd frontend
   # Set VITE_API_URL (PowerShell di Windows):
   $env:VITE_API_URL="https://distribusiapp-backend.<subdomain-cloudflare>.workers.dev/api"
   npm run build
   ```
2. Deploy folder `dist` ke Cloudflare Pages:
   ```bash
   npx wrangler pages deploy dist --project-name=distribusiapp
   ```

---

## 5. Menjalankan Pengembangan Lokal (Tetap Berjalan Bersamaan)

Pengembangan lokal tetap dapat berjalan tanpa terpengaruh deployment:
- Local Worker menggunakan simulator SQLite D1 lokal (`.wrangler/state/v3/d1`).
- Frontend lokal otomatis fallback ke `http://localhost:8787/api` bila `VITE_API_URL` tidak diisi.
- Jalankan keduanya bersamaan cukup dengan:
  ```bash
  npm run dev
  ```
