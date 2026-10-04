-- Permintaan (Sales -> Admin) & Rekomendasi (Admin -> Sales) Stok
CREATE TABLE IF NOT EXISTS stock_requests (
    id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL,
    code TEXT NOT NULL,
    type TEXT NOT NULL CHECK(type IN ('request', 'recommendation')),
    sales_id TEXT, -- NULL pada rekomendasi berarti ditujukan ke semua Sales
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
    quantity INTEGER NOT NULL,
    approved_quantity INTEGER,
    FOREIGN KEY(request_id) REFERENCES stock_requests(id) ON DELETE CASCADE,
    FOREIGN KEY(variant_id) REFERENCES product_variants(id)
);
