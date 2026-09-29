import { Hono } from 'hono';
import type { Env } from '../types';
import { authMiddleware } from '../middleware/auth';
import { tenantMiddleware } from '../middleware/tenant';
import { parsePagination, validateRequired } from '../middleware/validation';

export const salesVisitRoutes = new Hono<{ Bindings: Env }>();
salesVisitRoutes.use('/*', authMiddleware, tenantMiddleware);

salesVisitRoutes.get('/', async (c) => {
  const businessId = c.get('businessId');
  const { limit, offset } = parsePagination(c);
  
  const query = `
    SELECT sv.*, s.name as sales_name, st.name as store_name
    FROM sales_visits sv
    JOIN sales s ON s.id = sv.sales_id
    JOIN stores st ON st.id = sv.store_id
    WHERE sv.business_id = ?
    ORDER BY sv.visit_date DESC, sv.visit_time DESC
    LIMIT ? OFFSET ?
  `;
  const { results } = await c.env.DB.prepare(query).bind(businessId, limit, offset).all();
  
  const countQuery = 'SELECT COUNT(*) as total FROM sales_visits WHERE business_id = ?';
  const totalRes = await c.env.DB.prepare(countQuery).bind(businessId).first();
  
  return c.json({ success: true, data: results, meta: { total: totalRes?.total || 0 } });
});

salesVisitRoutes.post('/', async (c) => {
  const businessId = c.get('businessId');
  const body = await c.req.json();
  
  const err = validateRequired(body, ['sales_id', 'store_id', 'visit_date']);
  if (err) return c.json({ success: false, message: err }, 400);

  const id = crypto.randomUUID();
  const time = body.visit_time || new Date().toISOString().split('T')[1].substring(0, 5);
  
  await c.env.DB.prepare(
    'INSERT INTO sales_visits (id, business_id, sales_id, store_id, visit_date, visit_time, latitude, longitude, notes, photo_url, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
  ).bind(
    id, businessId, body.sales_id, body.store_id, body.visit_date, time, 
    body.latitude || null, body.longitude || null, body.notes || null, body.photo_url || null, 'in_progress'
  ).run();

  return c.json({ success: true, data: { id, ...body } }, 201);
});

salesVisitRoutes.get('/:id', async (c) => {
  const businessId = c.get('businessId');
  const id = c.req.param('id');
  
  const visit = await c.env.DB.prepare(`
    SELECT sv.*, s.name as sales_name, st.name as store_name
    FROM sales_visits sv
    JOIN sales s ON s.id = sv.sales_id
    JOIN stores st ON st.id = sv.store_id
    WHERE sv.id = ? AND sv.business_id = ?
  `).bind(id, businessId).first();
  
  if (!visit) return c.json({ success: false, message: 'Kunjungan tidak ditemukan' }, 404);
  
  const { results: items } = await c.env.DB.prepare(`
    SELECT svi.*, p.name as product_name, v.name as variant_name, b.batch_number
    FROM sales_visit_items svi
    JOIN products p ON p.id = svi.product_id
    JOIN product_variants v ON v.id = svi.variant_id
    LEFT JOIN product_batches b ON b.id = svi.batch_id
    WHERE svi.visit_id = ?
  `).bind(id).all();
  
  return c.json({ success: true, data: { ...visit, items } });
});

salesVisitRoutes.post('/:id/items', async (c) => {
  const businessId = c.get('businessId');
  const visitId = c.req.param('id');
  const body = await c.req.json();
  const items = body.items as any[];
  
  if (!items || !items.length) return c.json({ success: false, message: 'Items kosong' }, 400);

  const visit = await c.env.DB.prepare('SELECT status FROM sales_visits WHERE id = ? AND business_id = ?').bind(visitId, businessId).first();
  if (!visit) return c.json({ success: false, message: 'Kunjungan tidak ditemukan' }, 404);
  if (visit.status !== 'in_progress') return c.json({ success: false, message: 'Kunjungan sudah selesai/batal' }, 400);

  // Clear existing items if we're replacing them
  const statements = [
    c.env.DB.prepare('DELETE FROM sales_visit_items WHERE visit_id = ?').bind(visitId)
  ];

  for (const item of items) {
    const itemId = crypto.randomUUID();
    statements.push(
      c.env.DB.prepare(`
        INSERT INTO sales_visit_items 
        (id, visit_id, product_id, variant_id, batch_id, previous_quantity, sold_quantity, return_quantity, new_quantity, remaining_quantity, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        itemId, visitId, item.product_id, item.variant_id, item.batch_id || null,
        item.previous_quantity || 0, item.sold_quantity || 0, item.return_quantity || 0,
        item.new_quantity || 0, item.remaining_quantity || 0, item.notes || null
      )
    );
  }

  await c.env.DB.batch(statements);
  return c.json({ success: true, message: 'Item kunjungan disimpan' });
});

salesVisitRoutes.post('/:id/complete', async (c) => {
  const businessId = c.get('businessId');
  const user = c.get('user');
  const visitId = c.req.param('id');
  
  const visit = await c.env.DB.prepare('SELECT * FROM sales_visits WHERE id = ? AND business_id = ?').bind(visitId, businessId).first();
  if (!visit) return c.json({ success: false, message: 'Kunjungan tidak ditemukan' }, 404);
  if (visit.status !== 'in_progress') return c.json({ success: false, message: 'Kunjungan sudah diproses sebelumnya' }, 400);

  // Ambil lokasi Sales dan Toko
  const salesLoc = await c.env.DB.prepare("SELECT id FROM stock_locations WHERE type = 'sales' AND reference_id = ? AND business_id = ?").bind(visit.sales_id, businessId).first();
  const storeLoc = await c.env.DB.prepare("SELECT id FROM stock_locations WHERE type = 'store' AND reference_id = ? AND business_id = ?").bind(visit.store_id, businessId).first();
  
  if (!salesLoc || !storeLoc) return c.json({ success: false, message: 'Data lokasi stock sales/toko tidak valid' }, 400);

  const { results: items } = await c.env.DB.prepare('SELECT * FROM sales_visit_items WHERE visit_id = ?').bind(visitId).all();
  
  const statements = [];
  statements.push(
    c.env.DB.prepare('UPDATE sales_visits SET status = "completed", updated_at = datetime("now") WHERE id = ?').bind(visitId)
  );

  for (const item of items) {
    const { product_id, variant_id, batch_id, sold_quantity, return_quantity, new_quantity } = item;
    
    // 1. SOLD (Toko stok berkurang)
    if (sold_quantity > 0) {
      statements.push(
        c.env.DB.prepare(`
          INSERT INTO stock_movements (id, business_id, product_id, variant_id, batch_id, from_location_id, quantity, movement_type, reference_type, reference_id, created_by)
          VALUES (lower(hex(randomblob(16))), ?, ?, ?, ?, ?, ?, 'sale', 'sales_visits', ?, ?)
        `).bind(businessId, product_id, variant_id, batch_id || null, storeLoc.id, sold_quantity, visitId, user.userId)
      );
      statements.push(
        c.env.DB.prepare(`
          UPDATE stock_balances SET quantity = quantity - ?, updated_at = datetime('now')
          WHERE location_id = ? AND product_id = ? AND variant_id = ? AND (batch_id = ? OR (? IS NULL AND batch_id IS NULL))
        `).bind(sold_quantity, storeLoc.id, product_id, variant_id, batch_id, batch_id)
      );
    }
    
    // 2. RETURN (Toko -> Sales)
    if (return_quantity > 0) {
      statements.push(
        c.env.DB.prepare(`
          INSERT INTO stock_movements (id, business_id, product_id, variant_id, batch_id, from_location_id, to_location_id, quantity, movement_type, reference_type, reference_id, created_by)
          VALUES (lower(hex(randomblob(16))), ?, ?, ?, ?, ?, ?, ?, 'return', 'sales_visits', ?, ?)
        `).bind(businessId, product_id, variant_id, batch_id || null, storeLoc.id, salesLoc.id, return_quantity, visitId, user.userId)
      );
      // Kurangi dari toko
      statements.push(
        c.env.DB.prepare(`
          UPDATE stock_balances SET quantity = quantity - ?, updated_at = datetime('now')
          WHERE location_id = ? AND product_id = ? AND variant_id = ? AND (batch_id = ? OR (? IS NULL AND batch_id IS NULL))
        `).bind(return_quantity, storeLoc.id, product_id, variant_id, batch_id, batch_id)
      );
      // Tambah ke sales
      statements.push(
        c.env.DB.prepare(`
          INSERT INTO stock_balances (id, business_id, location_id, product_id, variant_id, batch_id, quantity)
          VALUES (lower(hex(randomblob(16))), ?, ?, ?, ?, ?, ?)
          ON CONFLICT(location_id, product_id, variant_id, batch_id) 
          DO UPDATE SET quantity = quantity + excluded.quantity, updated_at = datetime('now')
        `).bind(businessId, salesLoc.id, product_id, variant_id, batch_id || null, return_quantity)
      );
    }
    
    // 3. NEW DROP (Sales -> Toko)
    if (new_quantity > 0) {
      statements.push(
        c.env.DB.prepare(`
          INSERT INTO stock_movements (id, business_id, product_id, variant_id, batch_id, from_location_id, to_location_id, quantity, movement_type, reference_type, reference_id, created_by)
          VALUES (lower(hex(randomblob(16))), ?, ?, ?, ?, ?, ?, ?, 'transfer', 'sales_visits', ?, ?)
        `).bind(businessId, product_id, variant_id, batch_id || null, salesLoc.id, storeLoc.id, new_quantity, visitId, user.userId)
      );
      // Kurangi dari sales
      statements.push(
        c.env.DB.prepare(`
          UPDATE stock_balances SET quantity = quantity - ?, updated_at = datetime('now')
          WHERE location_id = ? AND product_id = ? AND variant_id = ? AND (batch_id = ? OR (? IS NULL AND batch_id IS NULL))
        `).bind(new_quantity, salesLoc.id, product_id, variant_id, batch_id, batch_id)
      );
      // Tambah ke toko
      statements.push(
        c.env.DB.prepare(`
          INSERT INTO stock_balances (id, business_id, location_id, product_id, variant_id, batch_id, quantity)
          VALUES (lower(hex(randomblob(16))), ?, ?, ?, ?, ?, ?)
          ON CONFLICT(location_id, product_id, variant_id, batch_id) 
          DO UPDATE SET quantity = quantity + excluded.quantity, updated_at = datetime('now')
        `).bind(businessId, storeLoc.id, product_id, variant_id, batch_id || null, new_quantity)
      );
    }
  }

  try {
    await c.env.DB.batch(statements);
    return c.json({ success: true, message: 'Kunjungan selesai dan stok diperbarui' });
  } catch (error: any) {
    return c.json({ success: false, message: 'Gagal memproses kunjungan', error: error.message }, 500);
  }
});
