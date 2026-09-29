-- ============================================================
-- DATABASE SCHEMA — Sistem Manajemen Penjualan & Konsinyasi
-- ============================================================
-- Target: Cloudflare D1 (SQLite)
-- Total: 34 Tables
-- Architecture: Multi-tenant (business_id as tenant boundary)
-- Stock: Ledger-based (stock_movements)
-- ============================================================

-- ============================================================
-- A. CORE TABLES (4)
-- ============================================================

-- 1. Users — Data akun pengguna
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  phone TEXT,
  avatar_url TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 2. Roles — Definisi role
CREATE TABLE IF NOT EXISTS roles (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  name TEXT NOT NULL UNIQUE CHECK (name IN ('owner', 'admin', 'sales')),
  description TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 3. Businesses — Data usaha/tenant
CREATE TABLE IF NOT EXISTS businesses (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  owner_user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  logo_url TEXT,
  phone TEXT,
  email TEXT,
  address TEXT,
  city TEXT,
  province TEXT,
  postal_code TEXT,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (owner_user_id) REFERENCES users(id)
);

-- 4. Business Members — Hubungan user ↔ business + role
CREATE TABLE IF NOT EXISTS business_members (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  business_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  role_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
  joined_at TEXT NOT NULL DEFAULT (datetime('now')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (business_id) REFERENCES businesses(id),
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (role_id) REFERENCES roles(id),
  UNIQUE (business_id, user_id)
);

-- ============================================================
-- B. MASTER DATA TABLES (5)
-- ============================================================

-- 5. Product Categories — Kategori produk
CREATE TABLE IF NOT EXISTS product_categories (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  business_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (business_id) REFERENCES businesses(id)
);

-- 6. Units — Satuan produk
CREATE TABLE IF NOT EXISTS units (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  business_id TEXT NOT NULL,
  name TEXT NOT NULL,
  symbol TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (business_id) REFERENCES businesses(id)
);

-- 7. Products — Data produk
CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  business_id TEXT NOT NULL,
  category_id TEXT,
  name TEXT NOT NULL,
  sku TEXT,
  description TEXT,
  product_type TEXT NOT NULL DEFAULT 'self' CHECK (product_type IN ('self', 'supplier')),
  image_url TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'discontinued')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (business_id) REFERENCES businesses(id),
  FOREIGN KEY (category_id) REFERENCES product_categories(id)
);

-- 8. Product Variants — Varian produk + harga
CREATE TABLE IF NOT EXISTS product_variants (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  business_id TEXT NOT NULL,
  product_id TEXT NOT NULL,
  name TEXT NOT NULL,
  sku TEXT,
  barcode TEXT,
  unit_id TEXT,
  price_production REAL NOT NULL DEFAULT 0,
  price_sales REAL NOT NULL DEFAULT 0,
  price_agent REAL NOT NULL DEFAULT 0,
  weight REAL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (business_id) REFERENCES businesses(id),
  FOREIGN KEY (product_id) REFERENCES products(id),
  FOREIGN KEY (unit_id) REFERENCES units(id)
);

-- 9. Suppliers — Data rekanan
CREATE TABLE IF NOT EXISTS suppliers (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  business_id TEXT NOT NULL,
  name TEXT NOT NULL,
  contact_person TEXT,
  phone TEXT,
  email TEXT,
  address TEXT,
  city TEXT,
  type TEXT NOT NULL DEFAULT 'production' CHECK (type IN ('production', 'other')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (business_id) REFERENCES businesses(id)
);

-- ============================================================
-- C. PRODUKSI & BATCH TABLES (5)
-- ============================================================

-- 10. Product Batches — Batch produk
CREATE TABLE IF NOT EXISTS product_batches (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  business_id TEXT NOT NULL,
  product_id TEXT NOT NULL,
  variant_id TEXT NOT NULL,
  batch_number TEXT NOT NULL,
  source_type TEXT NOT NULL CHECK (source_type IN ('self_production', 'supplier')),
  supplier_id TEXT,
  production_date TEXT NOT NULL,
  expired_date TEXT NOT NULL,
  quantity_initial INTEGER NOT NULL DEFAULT 0,
  quantity_available INTEGER NOT NULL DEFAULT 0,
  production_cost REAL NOT NULL DEFAULT 0,
  condition TEXT NOT NULL DEFAULT 'good' CHECK (condition IN ('good', 'damaged', 'expired')),
  storage_location TEXT,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'depleted', 'expired', 'recalled')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (business_id) REFERENCES businesses(id),
  FOREIGN KEY (product_id) REFERENCES products(id),
  FOREIGN KEY (variant_id) REFERENCES product_variants(id),
  FOREIGN KEY (supplier_id) REFERENCES suppliers(id)
);

-- 11. Production Orders — Order produksi
CREATE TABLE IF NOT EXISTS production_orders (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  business_id TEXT NOT NULL,
  production_number TEXT NOT NULL,
  production_date TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'in_progress', 'completed', 'cancelled')),
  notes TEXT,
  created_by TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (business_id) REFERENCES businesses(id),
  FOREIGN KEY (created_by) REFERENCES users(id)
);

-- 12. Production Order Items — Detail item per order produksi
CREATE TABLE IF NOT EXISTS production_order_items (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  production_order_id TEXT NOT NULL,
  product_id TEXT NOT NULL,
  variant_id TEXT NOT NULL,
  batch_id TEXT,
  quantity INTEGER NOT NULL DEFAULT 0,
  production_cost REAL NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (production_order_id) REFERENCES production_orders(id),
  FOREIGN KEY (product_id) REFERENCES products(id),
  FOREIGN KEY (variant_id) REFERENCES product_variants(id),
  FOREIGN KEY (batch_id) REFERENCES product_batches(id)
);

-- 13. Supplier Receipts — Penerimaan produk dari rekanan
CREATE TABLE IF NOT EXISTS supplier_receipts (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  business_id TEXT NOT NULL,
  supplier_id TEXT NOT NULL,
  receipt_number TEXT NOT NULL,
  receipt_date TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'verified', 'completed', 'cancelled')),
  notes TEXT,
  created_by TEXT NOT NULL,
  verified_by TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (business_id) REFERENCES businesses(id),
  FOREIGN KEY (supplier_id) REFERENCES suppliers(id),
  FOREIGN KEY (created_by) REFERENCES users(id),
  FOREIGN KEY (verified_by) REFERENCES users(id)
);

-- 14. Supplier Receipt Items — Detail penerimaan rekanan
CREATE TABLE IF NOT EXISTS supplier_receipt_items (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  receipt_id TEXT NOT NULL,
  product_id TEXT NOT NULL,
  variant_id TEXT NOT NULL,
  batch_id TEXT,
  quantity INTEGER NOT NULL DEFAULT 0,
  cost REAL NOT NULL DEFAULT 0,
  condition TEXT NOT NULL DEFAULT 'good' CHECK (condition IN ('good', 'damaged')),
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (receipt_id) REFERENCES supplier_receipts(id),
  FOREIGN KEY (product_id) REFERENCES products(id),
  FOREIGN KEY (variant_id) REFERENCES product_variants(id),
  FOREIGN KEY (batch_id) REFERENCES product_batches(id)
);

-- ============================================================
-- D. INVENTORY TABLES (3)
-- ============================================================

-- 15. Stock Locations — Lokasi stok
CREATE TABLE IF NOT EXISTS stock_locations (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  business_id TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('warehouse', 'sales', 'store', 'display', 'sold', 'return', 'reject')),
  reference_id TEXT,
  name TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (business_id) REFERENCES businesses(id)
);

-- 16. Stock Movements — LEDGER stok (tabel terpenting)
CREATE TABLE IF NOT EXISTS stock_movements (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  business_id TEXT NOT NULL,
  product_id TEXT NOT NULL,
  variant_id TEXT NOT NULL,
  batch_id TEXT,
  from_location_id TEXT,
  to_location_id TEXT,
  quantity INTEGER NOT NULL,
  movement_type TEXT NOT NULL CHECK (movement_type IN (
    'production_in',
    'supplier_receipt',
    'distribution_to_sales',
    'distribution_to_agent',
    'consignment_to_store',
    'consignment_sold',
    'return_from_store',
    'return_from_agent',
    'return_to_supplier',
    'return_to_warehouse',
    'display_placement',
    'display_removal',
    'adjustment',
    'stock_opname',
    'transfer'
  )),
  reference_type TEXT,
  reference_id TEXT,
  notes TEXT,
  created_by TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (business_id) REFERENCES businesses(id),
  FOREIGN KEY (product_id) REFERENCES products(id),
  FOREIGN KEY (variant_id) REFERENCES product_variants(id),
  FOREIGN KEY (batch_id) REFERENCES product_batches(id),
  FOREIGN KEY (from_location_id) REFERENCES stock_locations(id),
  FOREIGN KEY (to_location_id) REFERENCES stock_locations(id),
  FOREIGN KEY (created_by) REFERENCES users(id)
);

-- 17. Stock Balances — Cache saldo stok per lokasi (derived from movements)
CREATE TABLE IF NOT EXISTS stock_balances (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  business_id TEXT NOT NULL,
  location_id TEXT NOT NULL,
  product_id TEXT NOT NULL,
  variant_id TEXT NOT NULL,
  batch_id TEXT,
  quantity INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (business_id) REFERENCES businesses(id),
  FOREIGN KEY (location_id) REFERENCES stock_locations(id),
  FOREIGN KEY (product_id) REFERENCES products(id),
  FOREIGN KEY (variant_id) REFERENCES product_variants(id),
  FOREIGN KEY (batch_id) REFERENCES product_batches(id),
  UNIQUE (location_id, product_id, variant_id, batch_id)
);

-- ============================================================
-- E. AGEN TABLES (4)
-- ============================================================

-- 18. Agents — Data agen
CREATE TABLE IF NOT EXISTS agents (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  business_id TEXT NOT NULL,
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  contact_person TEXT,
  phone TEXT,
  email TEXT,
  address TEXT,
  city TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (business_id) REFERENCES businesses(id)
);

-- 19. Agent Rules — Ketentuan agen (MOQ, harga, retur)
CREATE TABLE IF NOT EXISTS agent_rules (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  business_id TEXT NOT NULL,
  agent_id TEXT NOT NULL,
  minimum_order INTEGER NOT NULL DEFAULT 0,
  price_type TEXT NOT NULL DEFAULT 'agent' CHECK (price_type IN ('agent', 'custom')),
  custom_discount_percent REAL,
  return_policy TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (business_id) REFERENCES businesses(id),
  FOREIGN KEY (agent_id) REFERENCES agents(id)
);

-- 20. Agent Orders — Pesanan agen
CREATE TABLE IF NOT EXISTS agent_orders (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  business_id TEXT NOT NULL,
  agent_id TEXT NOT NULL,
  order_number TEXT NOT NULL,
  order_date TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'preparing', 'shipped', 'completed', 'cancelled')),
  total REAL NOT NULL DEFAULT 0,
  notes TEXT,
  created_by TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (business_id) REFERENCES businesses(id),
  FOREIGN KEY (agent_id) REFERENCES agents(id),
  FOREIGN KEY (created_by) REFERENCES users(id)
);

-- 21. Agent Order Items — Detail pesanan agen
CREATE TABLE IF NOT EXISTS agent_order_items (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  order_id TEXT NOT NULL,
  product_id TEXT NOT NULL,
  variant_id TEXT NOT NULL,
  batch_id TEXT,
  quantity INTEGER NOT NULL DEFAULT 0,
  price REAL NOT NULL DEFAULT 0,
  subtotal REAL NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (order_id) REFERENCES agent_orders(id),
  FOREIGN KEY (product_id) REFERENCES products(id),
  FOREIGN KEY (variant_id) REFERENCES product_variants(id),
  FOREIGN KEY (batch_id) REFERENCES product_batches(id)
);

-- ============================================================
-- F. SALES & DISTRIBUSI TABLES (3)
-- ============================================================

-- 22. Sales — Data sales
CREATE TABLE IF NOT EXISTS sales (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  business_id TEXT NOT NULL,
  user_id TEXT,
  sales_code TEXT NOT NULL,
  name TEXT NOT NULL,
  phone TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
  area TEXT,
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (business_id) REFERENCES businesses(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- 23. Distributions — Distribusi barang (gudang → sales/agen)
CREATE TABLE IF NOT EXISTS distributions (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  business_id TEXT NOT NULL,
  distribution_number TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('agent', 'sales')),
  target_id TEXT NOT NULL,
  distribution_date TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'approved', 'in_transit', 'completed', 'cancelled')),
  notes TEXT,
  created_by TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (business_id) REFERENCES businesses(id),
  FOREIGN KEY (created_by) REFERENCES users(id)
);

-- 24. Distribution Items — Detail distribusi
CREATE TABLE IF NOT EXISTS distribution_items (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  distribution_id TEXT NOT NULL,
  product_id TEXT NOT NULL,
  variant_id TEXT NOT NULL,
  batch_id TEXT,
  quantity INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (distribution_id) REFERENCES distributions(id),
  FOREIGN KEY (product_id) REFERENCES products(id),
  FOREIGN KEY (variant_id) REFERENCES product_variants(id),
  FOREIGN KEY (batch_id) REFERENCES product_batches(id)
);

-- ============================================================
-- G. TOKO & KONSINYASI TABLES (5)
-- ============================================================

-- 25. Stores — Data toko
CREATE TABLE IF NOT EXISTS stores (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  business_id TEXT NOT NULL,
  store_code TEXT,
  name TEXT NOT NULL,
  owner_name TEXT,
  phone TEXT,
  address TEXT,
  district TEXT,
  city TEXT,
  latitude REAL,
  longitude REAL,
  type TEXT DEFAULT 'retail' CHECK (type IN ('retail', 'wholesale', 'minimarket', 'supermarket', 'other')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'blacklisted')),
  notes TEXT,
  photo_url TEXT,
  registered_by TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (business_id) REFERENCES businesses(id),
  FOREIGN KEY (registered_by) REFERENCES users(id)
);

-- 26. Sales Visits — Kunjungan sales ke toko
CREATE TABLE IF NOT EXISTS sales_visits (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  business_id TEXT NOT NULL,
  sales_id TEXT NOT NULL,
  store_id TEXT NOT NULL,
  visit_date TEXT NOT NULL,
  visit_time TEXT,
  latitude REAL,
  longitude REAL,
  notes TEXT,
  photo_url TEXT,
  status TEXT NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'cancelled')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (business_id) REFERENCES businesses(id),
  FOREIGN KEY (sales_id) REFERENCES sales(id),
  FOREIGN KEY (store_id) REFERENCES stores(id)
);

-- 27. Sales Visit Items — Detail per produk di kunjungan
CREATE TABLE IF NOT EXISTS sales_visit_items (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  visit_id TEXT NOT NULL,
  product_id TEXT NOT NULL,
  variant_id TEXT NOT NULL,
  batch_id TEXT,
  previous_quantity INTEGER NOT NULL DEFAULT 0,
  sold_quantity INTEGER NOT NULL DEFAULT 0,
  return_quantity INTEGER NOT NULL DEFAULT 0,
  new_quantity INTEGER NOT NULL DEFAULT 0,
  remaining_quantity INTEGER NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (visit_id) REFERENCES sales_visits(id),
  FOREIGN KEY (product_id) REFERENCES products(id),
  FOREIGN KEY (variant_id) REFERENCES product_variants(id),
  FOREIGN KEY (batch_id) REFERENCES product_batches(id)
);

-- 28. Consignments — Transaksi konsinyasi
CREATE TABLE IF NOT EXISTS consignments (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  business_id TEXT NOT NULL,
  sales_id TEXT NOT NULL,
  store_id TEXT NOT NULL,
  visit_id TEXT,
  consignment_number TEXT NOT NULL,
  consignment_date TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'settled', 'cancelled')),
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (business_id) REFERENCES businesses(id),
  FOREIGN KEY (sales_id) REFERENCES sales(id),
  FOREIGN KEY (store_id) REFERENCES stores(id),
  FOREIGN KEY (visit_id) REFERENCES sales_visits(id)
);

-- 29. Consignment Items — Detail produk konsinyasi
CREATE TABLE IF NOT EXISTS consignment_items (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  consignment_id TEXT NOT NULL,
  product_id TEXT NOT NULL,
  variant_id TEXT NOT NULL,
  batch_id TEXT,
  quantity INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (consignment_id) REFERENCES consignments(id),
  FOREIGN KEY (product_id) REFERENCES products(id),
  FOREIGN KEY (variant_id) REFERENCES product_variants(id),
  FOREIGN KEY (batch_id) REFERENCES product_batches(id)
);

-- ============================================================
-- H. DISPLAY TABLES (3)
-- ============================================================

-- 30. Displays — Data display/wadah
CREATE TABLE IF NOT EXISTS displays (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  business_id TEXT NOT NULL,
  display_code TEXT NOT NULL,
  name TEXT NOT NULL,
  type TEXT,
  capacity INTEGER,
  condition TEXT NOT NULL DEFAULT 'good' CHECK (condition IN ('good', 'fair', 'damaged', 'broken')),
  photo_url TEXT,
  status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'in_use', 'maintenance', 'retired')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (business_id) REFERENCES businesses(id)
);

-- 31. Display Assignments — Penempatan display (sales → toko)
CREATE TABLE IF NOT EXISTS display_assignments (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  business_id TEXT NOT NULL,
  display_id TEXT NOT NULL,
  sales_id TEXT,
  store_id TEXT,
  assigned_at TEXT NOT NULL DEFAULT (datetime('now')),
  released_at TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'released', 'transferred')),
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (business_id) REFERENCES businesses(id),
  FOREIGN KEY (display_id) REFERENCES displays(id),
  FOREIGN KEY (sales_id) REFERENCES sales(id),
  FOREIGN KEY (store_id) REFERENCES stores(id)
);

-- 32. Display Items — Produk dalam display
CREATE TABLE IF NOT EXISTS display_items (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  display_id TEXT NOT NULL,
  product_id TEXT NOT NULL,
  variant_id TEXT NOT NULL,
  batch_id TEXT,
  quantity INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (display_id) REFERENCES displays(id),
  FOREIGN KEY (product_id) REFERENCES products(id),
  FOREIGN KEY (variant_id) REFERENCES product_variants(id),
  FOREIGN KEY (batch_id) REFERENCES product_batches(id)
);

-- ============================================================
-- I. RETUR TABLES (2)
-- ============================================================

-- 33. Returns — Header retur
CREATE TABLE IF NOT EXISTS returns (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  business_id TEXT NOT NULL,
  return_number TEXT NOT NULL,
  source_type TEXT NOT NULL CHECK (source_type IN ('store', 'agent', 'sales', 'warehouse')),
  source_id TEXT,
  return_type TEXT NOT NULL CHECK (return_type IN ('production_defect', 'shipping_damage', 'expired', 'display_damage')),
  destination_type TEXT NOT NULL CHECK (destination_type IN ('warehouse', 'supplier', 'production')),
  destination_id TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'approved', 'in_process', 'completed', 'rejected')),
  return_date TEXT NOT NULL,
  notes TEXT,
  created_by TEXT,
  verified_by TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (business_id) REFERENCES businesses(id),
  FOREIGN KEY (created_by) REFERENCES users(id),
  FOREIGN KEY (verified_by) REFERENCES users(id)
);

-- 34. Return Items — Detail produk retur
CREATE TABLE IF NOT EXISTS return_items (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  return_id TEXT NOT NULL,
  product_id TEXT NOT NULL,
  variant_id TEXT NOT NULL,
  batch_id TEXT,
  quantity INTEGER NOT NULL DEFAULT 0,
  condition TEXT NOT NULL CHECK (condition IN ('defect', 'damaged', 'expired', 'display_damaged')),
  replacement_quantity INTEGER NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (return_id) REFERENCES returns(id),
  FOREIGN KEY (product_id) REFERENCES products(id),
  FOREIGN KEY (variant_id) REFERENCES product_variants(id),
  FOREIGN KEY (batch_id) REFERENCES product_batches(id)
);

-- ============================================================
-- INDEXES
-- ============================================================

-- Users
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Business Members
CREATE INDEX IF NOT EXISTS idx_bm_business ON business_members(business_id);
CREATE INDEX IF NOT EXISTS idx_bm_user ON business_members(user_id);

-- Products
CREATE INDEX IF NOT EXISTS idx_products_business ON products(business_id);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_status ON products(business_id, status);

-- Product Variants
CREATE INDEX IF NOT EXISTS idx_variants_product ON product_variants(product_id);
CREATE INDEX IF NOT EXISTS idx_variants_business ON product_variants(business_id);

-- Product Batches
CREATE INDEX IF NOT EXISTS idx_batches_product ON product_batches(product_id);
CREATE INDEX IF NOT EXISTS idx_batches_variant ON product_batches(variant_id);
CREATE INDEX IF NOT EXISTS idx_batches_business ON product_batches(business_id);
CREATE INDEX IF NOT EXISTS idx_batches_expired ON product_batches(business_id, expired_date);
CREATE INDEX IF NOT EXISTS idx_batches_status ON product_batches(business_id, status);

-- Stock Movements (most critical index)
CREATE INDEX IF NOT EXISTS idx_sm_business ON stock_movements(business_id);
CREATE INDEX IF NOT EXISTS idx_sm_product ON stock_movements(product_id);
CREATE INDEX IF NOT EXISTS idx_sm_variant ON stock_movements(variant_id);
CREATE INDEX IF NOT EXISTS idx_sm_batch ON stock_movements(batch_id);
CREATE INDEX IF NOT EXISTS idx_sm_from ON stock_movements(from_location_id);
CREATE INDEX IF NOT EXISTS idx_sm_to ON stock_movements(to_location_id);
CREATE INDEX IF NOT EXISTS idx_sm_type ON stock_movements(movement_type);
CREATE INDEX IF NOT EXISTS idx_sm_created ON stock_movements(created_at);

-- Stock Balances
CREATE INDEX IF NOT EXISTS idx_sb_location ON stock_balances(location_id);
CREATE INDEX IF NOT EXISTS idx_sb_product ON stock_balances(product_id);

-- Stores
CREATE INDEX IF NOT EXISTS idx_stores_business ON stores(business_id);
CREATE INDEX IF NOT EXISTS idx_stores_status ON stores(business_id, status);

-- Sales
CREATE INDEX IF NOT EXISTS idx_sales_business ON sales(business_id);
CREATE INDEX IF NOT EXISTS idx_sales_user ON sales(user_id);

-- Sales Visits
CREATE INDEX IF NOT EXISTS idx_visits_sales ON sales_visits(sales_id);
CREATE INDEX IF NOT EXISTS idx_visits_store ON sales_visits(store_id);
CREATE INDEX IF NOT EXISTS idx_visits_date ON sales_visits(business_id, visit_date);

-- Consignments
CREATE INDEX IF NOT EXISTS idx_consign_store ON consignments(store_id);
CREATE INDEX IF NOT EXISTS idx_consign_sales ON consignments(sales_id);
CREATE INDEX IF NOT EXISTS idx_consign_business ON consignments(business_id);

-- Displays
CREATE INDEX IF NOT EXISTS idx_displays_business ON displays(business_id);
CREATE INDEX IF NOT EXISTS idx_display_assign_display ON display_assignments(display_id);
CREATE INDEX IF NOT EXISTS idx_display_assign_store ON display_assignments(store_id);

-- Returns
CREATE INDEX IF NOT EXISTS idx_returns_business ON returns(business_id);
CREATE INDEX IF NOT EXISTS idx_returns_type ON returns(return_type);
CREATE INDEX IF NOT EXISTS idx_returns_status ON returns(business_id, status);

-- Agents
CREATE INDEX IF NOT EXISTS idx_agents_business ON agents(business_id);
CREATE INDEX IF NOT EXISTS idx_agent_orders_agent ON agent_orders(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_orders_business ON agent_orders(business_id);

-- Suppliers
CREATE INDEX IF NOT EXISTS idx_suppliers_business ON suppliers(business_id);
