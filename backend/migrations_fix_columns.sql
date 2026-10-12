ALTER TABLE products ADD COLUMN category TEXT;
ALTER TABLE products ADD COLUMN brand TEXT;
ALTER TABLE inbound_batches ADD COLUMN variant_id TEXT;
ALTER TABLE inbound_batches ADD COLUMN current_quantity INTEGER DEFAULT 0;
