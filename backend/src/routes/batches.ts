import { Hono } from 'hono';
import type { Env } from '../types';
import { authMiddleware } from '../middleware/auth';
import { tenantMiddleware } from '../middleware/tenant';
import { parsePagination, generateNumber, validateRequired } from '../middleware/validation';

export const batchRoutes = new Hono<{ Bindings: Env }>();
batchRoutes.use('/*', authMiddleware, tenantMiddleware);

batchRoutes.get('/', async (c) => {
  const businessId = c.get('businessId');
  const { limit, offset, search } = parsePagination(c);
  
  let query = `
    SELECT b.*, p.name as product_name, v.name as variant_name 
    FROM product_batches b
    JOIN products p ON p.id = b.product_id
    JOIN product_variants v ON v.id = b.variant_id
    WHERE b.business_id = ?
  `;
  const params: any[] = [businessId];
  
  if (search) {
    query += ' AND (b.batch_number LIKE ? OR p.name LIKE ?)';
    params.push(`%${search}%`, `%${search}%`);
  }
  
  query += ' ORDER BY b.created_at DESC LIMIT ? OFFSET ?';
  params.push(limit, offset);

  const { results } = await c.env.DB.prepare(query).bind(...params).all();
  
  let countQuery = 'SELECT COUNT(*) as total FROM product_batches WHERE business_id = ?';
  const countParams: any[] = [businessId];
  const totalRes = await c.env.DB.prepare(countQuery).bind(...countParams).first();
  
  return c.json({ success: true, data: results, meta: { total: totalRes?.total || 0 } });
});

batchRoutes.post('/', async (c) => {
  const businessId = c.get('businessId');
  const body = await c.req.json();
  
  const err = validateRequired(body, ['product_id', 'variant_id', 'source_type', 'production_date', 'expired_date']);
  if (err) return c.json({ success: false, message: err }, 400);

  const id = crypto.randomUUID();
  const batchNumber = body.batch_number || generateNumber('BCH');
  
  await c.env.DB.prepare(`
    INSERT INTO product_batches 
    (id, business_id, product_id, variant_id, batch_number, source_type, supplier_id, production_date, expired_date, quantity_initial, quantity_available, production_cost, notes) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    id, businessId, body.product_id, body.variant_id, batchNumber, body.source_type, body.supplier_id || null,
    body.production_date, body.expired_date, body.quantity_initial || 0, body.quantity_initial || 0, body.production_cost || 0, body.notes || null
  ).run();

  return c.json({ success: true, data: { id, batch_number: batchNumber } }, 201);
});

batchRoutes.get('/:id', async (c) => {
  const businessId = c.get('businessId');
  const id = c.req.param('id');
  const result = await c.env.DB.prepare('SELECT * FROM product_batches WHERE id = ? AND business_id = ?').bind(id, businessId).first();
  if (!result) return c.json({ success: false, message: 'Batch tidak ditemukan' }, 404);
  return c.json({ success: true, data: result });
});
