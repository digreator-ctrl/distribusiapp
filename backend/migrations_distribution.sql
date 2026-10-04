ALTER TABLE stock_requests ADD COLUMN target_type TEXT CHECK(target_type IN ('sales', 'agen')) DEFAULT 'sales';
ALTER TABLE stock_requests ADD COLUMN agen_id TEXT;
ALTER TABLE stock_requests ADD COLUMN distribution_date DATE;
ALTER TABLE stock_request_items ADD COLUMN batch_id TEXT;
