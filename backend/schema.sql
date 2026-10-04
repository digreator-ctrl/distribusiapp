-- Tabel Master Tenant (Pemilik Usaha SaaS)
CREATE TABLE IF NOT EXISTS tenants (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Tabel Pengguna (RBAC: owner, admin, sales)
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL,
    username TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('owner', 'admin', 'sales')),
    nik TEXT,
    full_name TEXT,
    place_of_birth TEXT,
    date_of_birth DATE,
    gender TEXT CHECK(gender IN ('L', 'P')),
    address TEXT,
    phone TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(tenant_id) REFERENCES tenants(id)
);

-- Tabel Master Supplier / Produsen Rekanan (Untuk sistem titipan)
CREATE TABLE IF NOT EXISTS suppliers (
    id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL,
    name TEXT NOT NULL,
    contact_person TEXT,
    phone TEXT,
    address TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(tenant_id) REFERENCES tenants(id)
);

-- Tabel Master Produk (Induk)
CREATE TABLE IF NOT EXISTS products (
    id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL,
    name TEXT NOT NULL,
    base_production_price REAL NOT NULL,
    base_sales_price REAL NOT NULL,
    base_agent_price REAL NOT NULL,
    supplier_id TEXT, -- NULL berarti produk internal (produksi sendiri), jika ada ID berarti titipan supplier
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(tenant_id) REFERENCES tenants(id),
    FOREIGN KEY(supplier_id) REFERENCES suppliers(id)
);

-- Tabel Varian Produk (Anak)
CREATE TABLE IF NOT EXISTS product_variants (
    id TEXT PRIMARY KEY,
    product_id TEXT NOT NULL,
    sku TEXT,
    name TEXT NOT NULL,
    override_production_price REAL,
    override_sales_price REAL,
    override_agent_price REAL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- Tabel Stok Masuk (Inbound Batch)
CREATE TABLE IF NOT EXISTS inbound_batches (
    id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL,
    product_id TEXT NOT NULL,
    source_type TEXT NOT NULL CHECK(source_type IN ('internal', 'rekanan')),
    quantity INTEGER NOT NULL,
    production_date DATE NOT NULL,
    expired_date DATE NOT NULL,
    supplier_id TEXT, -- Asal pengiriman jika dari supplier
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(tenant_id) REFERENCES tenants(id),
    FOREIGN KEY(supplier_id) REFERENCES suppliers(id),
    FOREIGN KEY(product_id) REFERENCES products(id)
);

-- Tabel Master Toko Mitra
CREATE TABLE IF NOT EXISTS stores (
    id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL,
    name TEXT NOT NULL,
    owner_name TEXT NOT NULL,
    latitude REAL,
    longitude REAL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(tenant_id) REFERENCES tenants(id)
);

-- Tabel Aset Wadah Display
CREATE TABLE IF NOT EXISTS display_assets (
    id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL,
    barcode TEXT UNIQUE,
    current_store_id TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(tenant_id) REFERENCES tenants(id),
    FOREIGN KEY(current_store_id) REFERENCES stores(id)
);

-- Relasi Wadah Display dengan Varian Produk di dalamnya
CREATE TABLE IF NOT EXISTS display_asset_items (
    id TEXT PRIMARY KEY,
    asset_id TEXT NOT NULL,
    variant_id TEXT NOT NULL,
    quantity INTEGER NOT NULL,
    FOREIGN KEY(asset_id) REFERENCES display_assets(id),
    FOREIGN KEY(variant_id) REFERENCES product_variants(id)
);

-- Tabel Transaksi Konsinyasi
CREATE TABLE IF NOT EXISTS consignments (
    id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL,
    sales_id TEXT NOT NULL,
    store_id TEXT NOT NULL,
    variant_id TEXT NOT NULL,
    initial_stock INTEGER NOT NULL,
    sold_qty INTEGER DEFAULT 0,
    return_qty INTEGER DEFAULT 0,
    remaining_qty INTEGER DEFAULT 0,
    status TEXT NOT NULL CHECK(status IN ('active', 'completed')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(tenant_id) REFERENCES tenants(id),
    FOREIGN KEY(sales_id) REFERENCES users(id),
    FOREIGN KEY(store_id) REFERENCES stores(id),
    FOREIGN KEY(variant_id) REFERENCES product_variants(id)
);

-- Tabel Retur Barang
CREATE TABLE IF NOT EXISTS returns (
    id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL,
    variant_id TEXT NOT NULL,
    quantity INTEGER NOT NULL,
    return_type TEXT NOT NULL CHECK(return_type IN ('cacat_produksi', 'cacat_pengiriman', 'expired', 'cacat_display')),
    source TEXT NOT NULL CHECK(source IN ('sales', 'agen')),
    status TEXT NOT NULL CHECK(status IN ('pending', 'resolved')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(tenant_id) REFERENCES tenants(id),
    FOREIGN KEY(variant_id) REFERENCES product_variants(id)
);

-- Permintaan (Sales -> Admin) & Rekomendasi (Admin -> Sales) Stok
CREATE TABLE IF NOT EXISTS stock_requests (
    id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL,
    code TEXT NOT NULL,
    type TEXT NOT NULL CHECK(type IN ('request', 'recommendation')),
    target_type TEXT CHECK(target_type IN ('sales', 'agen')) DEFAULT 'sales',
    sales_id TEXT, -- NULL pada rekomendasi berarti ditujukan ke semua Sales
    agen_id TEXT,
    distribution_date DATE,
    status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'approved', 'rejected')),
    priority TEXT NOT NULL DEFAULT 'normal' CHECK(priority IN ('normal', 'urgent')),
    note TEXT,
    response_note TEXT,
    created_by_role TEXT,
    responded_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(tenant_id) REFERENCES tenants(id)
);

CREATE TABLE IF NOT EXISTS stock_request_items (
    id TEXT PRIMARY KEY,
    request_id TEXT NOT NULL,
    variant_id TEXT NOT NULL,
    batch_id TEXT,
    quantity INTEGER NOT NULL,
    approved_quantity INTEGER,
    FOREIGN KEY(request_id) REFERENCES stock_requests(id) ON DELETE CASCADE,
    FOREIGN KEY(variant_id) REFERENCES product_variants(id)
);
