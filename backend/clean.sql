-- ========================================================
-- CLEAN SCRIPT: MENGHAPUS SEMUA DATA DUMMY UNTUK PRODUKSI
-- DISTRIBUSIAPP (Cloudflare D1 & SQLite)
-- ========================================================

-- 1. Hapus Semua Riwayat Transaksi & Operasional Lapangan
DELETE FROM returns;
DELETE FROM visit_items;
DELETE FROM visits;
DELETE FROM visit_schedules;
DELETE FROM consignments;
DELETE FROM stock_request_items;
DELETE FROM stock_requests;

-- 2. Hapus Aset Wadah & Inbound
DELETE FROM display_asset_items;
DELETE FROM display_assets;
DELETE FROM inbound_batches;

-- 3. Hapus Master Produk & Mitra
DELETE FROM product_variants;
DELETE FROM products;
DELETE FROM stores;
DELETE FROM agents;
DELETE FROM suppliers;

-- 4. Hapus Akun Demo Sales
DELETE FROM users WHERE username IN ('andi_sales', 'budi_sales', 'citra_sales');

-- 5. Pastikan Tenant & Akun Master Utama Siap Digunakan untuk Produksi
INSERT OR REPLACE INTO tenants (id, name) VALUES ('tenant-1', 'Distribusi Nusantara');

INSERT OR REPLACE INTO users (
    id, tenant_id, username, password_hash, role, full_name, phone, address
) VALUES 
('user-admin-default', 'tenant-1', 'admin', 'admin123', 'admin', 'Administrator Sistem', '081234567800', 'Kantor Pusat'),
('user-owner-1', 'tenant-1', 'owner', 'owner123', 'owner', 'Owner Usaha', '081234567801', 'Kantor Pusat');
