import { Hono } from 'hono';
import type { Env } from '../types';
import { authMiddleware } from '../middleware/auth';
import { tenantMiddleware } from '../middleware/tenant';

export const reportRoutes = new Hono<{ Bindings: Env }>();
reportRoutes.use('/*', authMiddleware, tenantMiddleware);

// 8.4 Laporan Produk (Produk Hampir Kedaluwarsa, dll)
reportRoutes.get('/products/expired', async (c) => {
  const businessId = c.get('businessId');
  
  // Mencari produk yang akan expired dalam 30 hari ke depan atau sudah expired
  const query = `
    SELECT p.name as product_name, v.name as variant_name, b.batch_number, b.expiry_date, 
           l.name as location_name, sb.quantity
    FROM stock_balances sb
    JOIN products p ON p.id = sb.product_id
    JOIN product_variants v ON v.id = sb.variant_id
    JOIN product_batches b ON b.id = sb.batch_id
    JOIN stock_locations l ON l.id = sb.location_id
    WHERE sb.business_id = ? AND sb.quantity > 0 
      AND date(b.expiry_date) <= date('now', '+30 days')
    ORDER BY b.expiry_date ASC
  `;
  
  const { results } = await c.env.DB.prepare(query).bind(businessId).all();
  return c.json({ success: true, data: results });
});

// 8.5 Laporan Stok per Lokasi
reportRoutes.get('/stock-locations', async (c) => {
  const businessId = c.get('businessId');
  
  const query = `
    SELECT l.type as location_type, l.name as location_name, p.name as product_name, sum(sb.quantity) as total_quantity
    FROM stock_balances sb
    JOIN stock_locations l ON l.id = sb.location_id
    JOIN products p ON p.id = sb.product_id
    WHERE sb.business_id = ? AND sb.quantity > 0
    GROUP BY l.id, p.id
    ORDER BY l.type, l.name, p.name
  `;
  
  const { results } = await c.env.DB.prepare(query).bind(businessId).all();
  return c.json({ success: true, data: results });
});

// 8.6 Laporan Penjualan (Dari Kunjungan Sales yang completed)
reportRoutes.get('/sales-performance', async (c) => {
  const businessId = c.get('businessId');
  
  const query = `
    SELECT s.name as sales_name, p.name as product_name, sum(svi.sold_quantity) as total_sold
    FROM sales_visit_items svi
    JOIN sales_visits sv ON sv.id = svi.visit_id
    JOIN sales s ON s.id = sv.sales_id
    JOIN products p ON p.id = svi.product_id
    WHERE sv.business_id = ? AND sv.status = 'completed'
    GROUP BY s.id, p.id
    ORDER BY total_sold DESC
  `;
  
  const { results } = await c.env.DB.prepare(query).bind(businessId).all();
  return c.json({ success: true, data: results });
});

// 8.7 Laporan Retur
reportRoutes.get('/returns-summary', async (c) => {
  const businessId = c.get('businessId');
  
  const query = `
    SELECT r.return_type, p.name as product_name, sum(ri.quantity) as total_returned
    FROM return_items ri
    JOIN returns r ON r.id = ri.return_id
    JOIN products p ON p.id = ri.product_id
    WHERE r.business_id = ? AND r.status = 'completed'
    GROUP BY r.return_type, p.id
    ORDER BY total_returned DESC
  `;
  
  const { results } = await c.env.DB.prepare(query).bind(businessId).all();
  return c.json({ success: true, data: results });
});
