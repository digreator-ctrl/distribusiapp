import { Hono } from 'hono';
import type { Env } from '../types';
import { authMiddleware } from '../middleware/auth';
import { tenantMiddleware } from '../middleware/tenant';
import { parsePagination, generateNumber, validateRequired } from '../middleware/validation';

export const consignmentRoutes = new Hono<{ Bindings: Env }>();
consignmentRoutes.use('/*', authMiddleware, tenantMiddleware);

consignmentRoutes.get('/', async (c) => {
  const businessId = c.get('businessId');
  const { limit, offset } = parsePagination(c);
  
  const query = `
    SELECT c.*, s.name as sales_name, st.name as store_name
    FROM consignments c
    JOIN sales s ON s.id = c.sales_id
    JOIN stores st ON st.id = c.store_id
    WHERE c.business_id = ?
    ORDER BY c.created_at DESC
    LIMIT ? OFFSET ?
  `;
  const { results } = await c.env.DB.prepare(query).bind(businessId, limit, offset).all();
  
  const countQuery = 'SELECT COUNT(*) as total FROM consignments WHERE business_id = ?';
  const totalRes = await c.env.DB.prepare(countQuery).bind(businessId).first();
  
  return c.json({ success: true, data: results, meta: { total: totalRes?.total || 0 } });
});

consignmentRoutes.post('/', async (c) => {
  const businessId = c.get('businessId');
  const body = await c.req.json();
  
  const err = validateRequired(body, ['sales_id', 'store_id', 'consignment_date', 'items']);
  if (err) return c.json({ success: false, message: err }, 400);

  const items = body.items as any[];
  if (!items || items.length === 0) return c.json({ success: false, message: 'Item konsinyasi tidak boleh kosong' }, 400);

  const id = crypto.randomUUID();
  const consignmentNumber = generateNumber('CNS');
  
  const statements = [];
  
  statements.push(
    c.env.DB.prepare(`
      INSERT INTO consignments (id, business_id, sales_id, store_id, visit_id, consignment_number, consignment_date, status, notes) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(id, businessId, body.sales_id, body.store_id, body.visit_id || null, consignmentNumber, body.consignment_date, 'active', body.notes || null)
  );

  for (const item of items) {
    const itemId = crypto.randomUUID();
    statements.push(
      c.env.DB.prepare(`
        INSERT INTO consignment_items (id, consignment_id, product_id, variant_id, batch_id, quantity)
        VALUES (?, ?, ?, ?, ?, ?)
      `).bind(itemId, id, item.product_id, item.variant_id, item.batch_id || null, item.quantity)
    );
  }

  try {
    await c.env.DB.batch(statements);
    return c.json({ success: true, message: 'Dokumen konsinyasi berhasil dibuat', data: { id, consignment_number: consignmentNumber } }, 201);
  } catch (error: any) {
    return c.json({ success: false, message: 'Gagal membuat konsinyasi', error: error.message }, 500);
  }
});

consignmentRoutes.get('/:id', async (c) => {
  const businessId = c.get('businessId');
  const id = c.req.param('id');
  
  const consignment = await c.env.DB.prepare(`
    SELECT c.*, s.name as sales_name, st.name as store_name
    FROM consignments c
    JOIN sales s ON s.id = c.sales_id
    JOIN stores st ON st.id = c.store_id
    WHERE c.id = ? AND c.business_id = ?
  `).bind(id, businessId).first();
  
  if (!consignment) return c.json({ success: false, message: 'Konsinyasi tidak ditemukan' }, 404);
  
  const { results: items } = await c.env.DB.prepare(`
    SELECT ci.*, p.name as product_name, v.name as variant_name, b.batch_number
    FROM consignment_items ci
    JOIN products p ON p.id = ci.product_id
    JOIN product_variants v ON v.id = ci.variant_id
    LEFT JOIN product_batches b ON b.id = ci.batch_id
    WHERE ci.consignment_id = ?
  `).bind(id).all();
  
  return c.json({ success: true, data: { ...consignment, items } });
});

consignmentRoutes.put('/:id/status', async (c) => {
  const businessId = c.get('businessId');
  const id = c.req.param('id');
  const body = await c.req.json();
  
  const newStatus = body.status;
  if (!['active', 'settled', 'cancelled'].includes(newStatus)) {
    return c.json({ success: false, message: 'Status tidak valid' }, 400);
  }

  await c.env.DB.prepare('UPDATE consignments SET status = ?, updated_at = datetime("now") WHERE id = ? AND business_id = ?').bind(newStatus, id, businessId).run();
  
  return c.json({ success: true, message: `Status konsinyasi diperbarui menjadi ${newStatus}` });
});
