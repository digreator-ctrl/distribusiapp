-- ========================================================
-- DATA DUMMY COMPREHENSIVE UNTUK TRIAL & ERROR
-- DISTRIBUSIAPP (Cloudflare D1 & Workers)
-- ========================================================

-- 1. TENANTS
INSERT OR REPLACE INTO tenants (id, name) 
VALUES ('tenant-1', 'Distribusi Nusantara Jaya');

-- 2. USERS (Admin, Owner, Sales)
INSERT OR REPLACE INTO users (id, tenant_id, username, password_hash, role, full_name, phone, address) VALUES
('user-admin-default', 'tenant-1', 'admin', 'admin123', 'admin', 'Administrator Sistem', '081234567800', 'Kantor Pusat Distribusi Surabaya'),
('user-owner-1', 'tenant-1', 'owner', 'owner123', 'owner', 'Budi Hartono (Owner)', '081234567801', 'Surabaya'),
('user-sales-1', 'tenant-1', 'andi_sales', 'sales123', 'sales', 'Andi Pratama', '081234567891', 'Jl. Ngagel Rejo No. 10, Surabaya'),
('user-sales-2', 'tenant-1', 'budi_sales', 'sales123', 'sales', 'Budi Santoso', '081234567892', 'Jl. Barata Jaya No. 15, Surabaya'),
('user-sales-3', 'tenant-1', 'citra_sales', 'sales123', 'sales', 'Citra Dewi', '081234567893', 'Jl. Dharmahusada No. 8, Surabaya');

-- 3. SUPPLIERS (Produsen Rekanan)
INSERT OR REPLACE INTO suppliers (id, tenant_id, name, contact_person, phone, address, is_active) VALUES
('sup-1', 'tenant-1', 'PT Sumber Pangan Sejahtera', 'Hendra Wijaya', '08123450001', 'Kawasan Industri Rungkut Blok A-5, Surabaya', 1),
('sup-2', 'tenant-1', 'CV Snack Nusantara Jaya', 'Dewi Lestari', '08123450002', 'Jl. Raya Gempol No. 45, Pasuruan', 1),
('sup-3', 'tenant-1', 'UD Berkah Minuman Alami', 'Ahmad Fauzi', '08123450003', 'Jl. Raya Karanglo No. 12, Malang', 1);

-- 4. PRODUCTS
INSERT OR REPLACE INTO products (id, tenant_id, name, category, brand, base_production_price, base_sales_price, base_agent_price, supplier_id, is_active) VALUES
('prod-1', 'tenant-1', 'Keripik Singkong Crispy', 'Makanan Ringan', 'Kripiku', 7000, 12000, 10000, NULL, 1),
('prod-2', 'tenant-1', 'Kacang Bawang Renyah', 'Makanan Ringan', 'Kacangku', 11000, 17000, 14500, 'sup-2', 1),
('prod-3', 'tenant-1', 'Kopi Susu Gula Aren Botol', 'Minuman', 'Kopita', 5500, 10000, 8500, NULL, 1),
('prod-4', 'tenant-1', 'Sari Apel Murni Segar', 'Minuman', 'Apel Segar', 4500, 8000, 6800, 'sup-3', 1);

-- 5. PRODUCT VARIANTS
INSERT OR REPLACE INTO product_variants (id, product_id, sku, name, override_production_price, override_sales_price, override_agent_price) VALUES
('var-1', 'prod-1', 'KRP-PDS-150', 'Keripik Singkong Pedas 150g', 7000, 12000, 10000),
('var-2', 'prod-1', 'KRP-BLD-150', 'Keripik Singkong Balado 150g', 7000, 12000, 10000),
('var-3', 'prod-1', 'KRP-ORI-150', 'Keripik Singkong Original 150g', 6500, 11000, 9500),
('var-4', 'prod-2', 'KCG-GRH-200', 'Kacang Bawang Gurih 200g', 11000, 17000, 14500),
('var-5', 'prod-2', 'KCG-PDS-200', 'Kacang Bawang Pedas 200g', 11500, 18000, 15000),
('var-6', 'prod-3', 'KOP-ARN-250', 'Kopi Susu Aren 250ml', 5500, 10000, 8500),
('var-7', 'prod-3', 'KOP-CLD-250', 'Kopi Cold Brew 250ml', 6000, 12000, 10000),
('var-8', 'prod-4', 'APL-BTL-330', 'Sari Apel Botol 330ml', 4500, 8000, 6800),
('var-9', 'prod-4', 'APL-CUP-DUS', 'Sari Apel Cup 120ml Dus', 20000, 28000, 24500);

-- 6. INBOUND BATCHES (Stok Masuk Gudang)
INSERT OR REPLACE INTO inbound_batches (id, tenant_id, product_id, variant_id, source_type, quantity, current_quantity, production_date, expired_date, supplier_id) VALUES
('batch-1', 'tenant-1', 'prod-1', 'var-1', 'internal', 250, 180, '2026-03-01', '2026-11-01', NULL),
('batch-2', 'tenant-1', 'prod-1', 'var-2', 'internal', 250, 200, '2026-03-01', '2026-11-01', NULL),
('batch-3', 'tenant-1', 'prod-1', 'var-3', 'internal', 300, 250, '2026-03-05', '2026-11-05', NULL),
('batch-4', 'tenant-1', 'prod-2', 'var-4', 'rekanan', 150, 100, '2026-02-20', '2026-10-20', 'sup-2'),
('batch-5', 'tenant-1', 'prod-2', 'var-5', 'rekanan', 150, 120, '2026-02-20', '2026-10-20', 'sup-2'),
('batch-6', 'tenant-1', 'prod-3', 'var-6', 'internal', 120, 75, '2026-03-15', '2026-07-15', NULL),
('batch-7', 'tenant-1', 'prod-3', 'var-7', 'internal', 100, 65, '2026-03-15', '2026-07-15', NULL),
('batch-8', 'tenant-1', 'prod-4', 'var-8', 'rekanan', 200, 150, '2026-03-10', '2026-11-10', 'sup-3'),
('batch-9', 'tenant-1', 'prod-4', 'var-9', 'rekanan', 80, 60, '2026-03-10', '2026-12-10', 'sup-3');

-- 7. AGENTS
INSERT OR REPLACE INTO agents (id, tenant_id, name, contact, status, notes) VALUES
('agent-1', 'tenant-1', 'Toko Grosir Berkah Abadi', '08123456701', 'Aktif', 'Wilayah Surabaya Timur - Langganan grosir mingguan'),
('agent-2', 'tenant-1', 'Agen Sembako Maju Lancar', '08123456702', 'Aktif', 'Wilayah Sidoarjo Kota - Plafon kredit Rp 15.000.000'),
('agent-3', 'tenant-1', 'Depo Snack Nusantara', '08123456703', 'Aktif', 'Wilayah Gresik Kota - Pengambilan partai besar');

-- 8. STORES (Mitra Toko Konsinyasi)
INSERT OR REPLACE INTO stores (id, tenant_id, name, owner_name, latitude, longitude, address, wa_number, province, city, district, village, status) VALUES
('store-1', 'tenant-1', 'Toko Barokah Jaya', 'H. Mahmud', -7.2891, 112.7485, 'Jl. Raya Ngagel No. 45', '081211112222', 'Jawa Timur', 'Kota Surabaya', 'Wonokromo', 'Ngagel', 'Aktif'),
('store-2', 'tenant-1', 'Warung Bu Siti', 'Siti Aminah', -7.2715, 112.7582, 'Jl. Dharmawangsa No. 12', '081333334444', 'Jawa Timur', 'Kota Surabaya', 'Gubeng', 'Airlangga', 'Aktif'),
('store-3', 'tenant-1', 'Minimarket Sumber Rejeki', 'Ko Steven', -7.2942, 112.7154, 'Jl. Mayjen Sungkono No. 88', '081555556666', 'Jawa Timur', 'Kota Surabaya', 'Dukuh Pakis', 'Gunung Sari', 'Aktif'),
('store-4', 'tenant-1', 'Toko Berkah Mandiri', 'Pak Joko', -7.4478, 112.7183, 'Jl. Pahlawan No. 23', '081777778888', 'Jawa Timur', 'Kab. Sidoarjo', 'Sidoarjo', 'Sidokumpul', 'Aktif'),
('store-5', 'tenant-1', 'Warung Kopi & Snack Pojok', 'Mas Rian', -7.3235, 112.7268, 'Jl. Gayung Kebonsari No. 17', '081999990000', 'Jawa Timur', 'Kota Surabaya', 'Gayungan', 'Ketintang', 'Aktif');

-- 9. DISPLAY ASSETS & ITEMS
INSERT OR REPLACE INTO display_assets (id, tenant_id, barcode, current_store_id) VALUES
('disp-1', 'tenant-1', 'DSP-001', 'store-1'),
('disp-2', 'tenant-1', 'DSP-002', 'store-2'),
('disp-3', 'tenant-1', 'DSP-003', 'store-3');

INSERT OR REPLACE INTO display_asset_items (id, asset_id, variant_id, quantity) VALUES
('dai-1', 'disp-1', 'var-1', 10),
('dai-2', 'disp-2', 'var-2', 10),
('dai-3', 'disp-3', 'var-4', 10);

-- 10. STOCK REQUESTS & ITEMS (Distribusi Stok ke Sales & Rekomendasi)
INSERT OR REPLACE INTO stock_requests (id, tenant_id, code, type, target_type, sales_id, distribution_date, status, priority, note, response_note, created_by_role, responded_at) VALUES
('req-1', 'tenant-1', 'REQ-20260320-001', 'request', 'sales', 'user-sales-1', '2026-03-20', 'approved', 'normal', 'Alokasi stok awal mobil sales Andi Pratama', 'Disetujui Gudang Penuh', 'sales', '2026-03-20 09:00:00'),
('req-2', 'tenant-1', 'REQ-20260321-002', 'request', 'sales', 'user-sales-2', '2026-03-21', 'approved', 'normal', 'Alokasi stok awal mobil sales Budi Santoso', 'Disetujui Gudang Penuh', 'sales', '2026-03-21 09:30:00'),
('req-3', 'tenant-1', 'REC-20260401-001', 'recommendation', 'sales', 'user-sales-1', '2026-04-02', 'pending', 'normal', 'Rekomendasi Admin: Tambahan stok Keripik Balado untuk area Ngagel', NULL, 'admin', NULL),
('req-4', 'tenant-1', 'REC-20260402-002', 'recommendation', 'sales', NULL, '2026-04-03', 'pending', 'urgent', 'Promo Weekend: Rekomendasi Sari Apel Murni untuk semua sales', NULL, 'admin', NULL);

INSERT OR REPLACE INTO stock_request_items (id, request_id, variant_id, batch_id, quantity, approved_quantity) VALUES
('sri-1', 'req-1', 'var-1', 'batch-1', 50, 50),
('sri-2', 'req-1', 'var-2', 'batch-2', 40, 40),
('sri-3', 'req-1', 'var-3', 'batch-3', 40, 40),
('sri-4', 'req-1', 'var-6', 'batch-6', 30, 30),
('sri-5', 'req-2', 'var-4', 'batch-4', 35, 35),
('sri-6', 'req-2', 'var-5', 'batch-5', 30, 30),
('sri-7', 'req-2', 'var-7', 'batch-7', 30, 30),
('sri-8', 'req-2', 'var-8', 'batch-8', 40, 40),
('sri-9', 'req-3', 'var-2', 'batch-2', 20, NULL),
('sri-10', 'req-3', 'var-6', 'batch-6', 15, NULL),
('sri-11', 'req-4', 'var-8', 'batch-8', 25, NULL);

-- 11. CONSIGNMENTS (Stok Titipan yang Aktif di Toko)
INSERT OR REPLACE INTO consignments (id, tenant_id, sales_id, store_id, variant_id, initial_stock, sold_qty, return_qty, remaining_qty, status, batch_id, expired_date) VALUES
('csg-1', 'tenant-1', 'user-sales-1', 'store-1', 'var-1', 30, 12, 0, 18, 'active', 'batch-1', '2026-11-01'),
('csg-2', 'tenant-1', 'user-sales-1', 'store-1', 'var-3', 25, 10, 0, 15, 'active', 'batch-3', '2026-11-05'),
('csg-3', 'tenant-1', 'user-sales-1', 'store-1', 'var-6', 20, 15, 0, 5, 'active', 'batch-6', '2026-07-15'),
('csg-4', 'tenant-1', 'user-sales-1', 'store-2', 'var-2', 20, 8, 0, 12, 'active', 'batch-2', '2026-11-01'),
('csg-5', 'tenant-1', 'user-sales-2', 'store-3', 'var-4', 25, 15, 0, 10, 'active', 'batch-4', '2026-10-20'),
('csg-6', 'tenant-1', 'user-sales-2', 'store-3', 'var-7', 20, 14, 0, 6, 'active', 'batch-7', '2026-07-15'),
('csg-7', 'tenant-1', 'user-sales-2', 'store-4', 'var-5', 15, 5, 0, 10, 'active', 'batch-5', '2026-10-20');

-- 12. VISITS & VISIT ITEMS (Kunjungan & Riwayat Penjualan)
INSERT OR REPLACE INTO visits (id, tenant_id, sales_id, store_id, visit_date, status, total_sold_amount, payment_received, outstanding_amount, notes, latitude, longitude) VALUES
('visit-1', 'tenant-1', 'user-sales-1', 'store-1', '2026-03-25 10:30:00', 'completed', 144000, 144000, 0, 'Kunjungan rutin pertama, lunas tunai', -7.2891, 112.7485),
('visit-2', 'tenant-1', 'user-sales-1', 'store-2', '2026-03-26 14:15:00', 'completed', 96000, 50000, 46000, 'Ada sisa piutang Rp 46.000 dibayar kunjungan depan', -7.2715, 112.7582),
('visit-3', 'tenant-1', 'user-sales-2', 'store-3', '2026-03-27 11:00:00', 'completed', 255000, 255000, 0, 'Restock toples display dan lunas', -7.2942, 112.7154);

INSERT OR REPLACE INTO visit_items (id, visit_id, variant_id, previous_stock, remaining_stock, sold_qty, new_consignment_qty, unit_price) VALUES
('vi-1', 'visit-1', 'var-1', 30, 18, 12, 0, 12000),
('vi-2', 'visit-2', 'var-2', 20, 12, 8, 0, 12000),
('vi-3', 'visit-3', 'var-4', 25, 10, 15, 0, 17000);

-- 13. VISIT SCHEDULES (Jadwal Kunjungan)
INSERT OR REPLACE INTO visit_schedules (id, tenant_id, sales_id, store_id, scheduled_date, notes, status) VALUES
('vsc-1', 'tenant-1', 'user-sales-1', 'store-1', '2026-11-02', 'Cek sisa stok keripik dan penagihan nota rutin', 'pending'),
('vsc-2', 'tenant-1', 'user-sales-1', 'store-2', '2026-11-03', 'Follow up sisa piutang Rp 46.000 dan restock balado', 'pending'),
('vsc-3', 'tenant-1', 'user-sales-2', 'store-3', '2026-11-04', 'Kunjungan mingguan dan cek stok toples display', 'pending'),
('vsc-4', 'tenant-1', 'user-sales-2', 'store-4', '2026-11-05', 'Restock kacang bawang pedas', 'pending'),
('vsc-5', 'tenant-1', 'user-sales-1', 'store-5', '2026-11-06', 'Kunjungan perdana pengenalan produk & penempatan toples', 'pending');

-- 14. RETURNS (Retur Barang)
INSERT OR REPLACE INTO returns (id, tenant_id, variant_id, quantity, return_type, source, status) VALUES
('ret-1', 'tenant-1', 'var-1', 2, 'cacat_pengiriman', 'sales', 'resolved'),
('ret-2', 'tenant-1', 'var-6', 1, 'cacat_display', 'sales', 'pending');
