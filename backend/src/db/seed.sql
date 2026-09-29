-- ============================================================
-- SEED DATA — Development only
-- ============================================================

-- Insert default roles
INSERT OR IGNORE INTO roles (id, name, description) VALUES
  ('role-owner', 'owner', 'Pemilik usaha — monitoring, pengelolaan pengguna, pengaturan'),
  ('role-admin', 'admin', 'Administrator — operasional harian, kelola produk, stok, distribusi'),
  ('role-sales', 'sales', 'Sales lapangan — kunjungan toko, konsinyasi, display');
