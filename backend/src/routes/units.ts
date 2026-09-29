import { Hono } from 'hono';
import type { Env } from '../types';
import { authMiddleware } from '../middleware/auth';
import { tenantMiddleware } from '../middleware/tenant';
import { validateRequired, parsePagination } from '../middleware/validation';

export const unitRoutes = new Hono<{ Bindings: Env }>();
unitRoutes.use('/*', authMiddleware, tenantMiddleware);

unitRoutes.get('/', async (c) => {
  const businessId = c.get('businessId');
  const { limit, offset, search } = parsePagination(c);
  
  let query = 'SELECT * FROM units WHERE business_id = ?';
  const params: any[] = [businessId];
  
  if (search) {
    query += ' AND name LIKE ?';
    params.push(`%${search}%`);
  }
  
  query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
  params.push(limit, offset);

  const { results } = await c.env.DB.prepare(query).bind(...params).all();
  
  let countQuery = 'SELECT COUNT(*) as total FROM units WHERE business_id = ?';
  const countParams: any[] = [businessId];
  if (search) {
    countQuery += ' AND name LIKE ?';
    countParams.push(`%${search}%`);
  }
  const totalRes = await c.env.DB.prepare(countQuery).bind(...countParams).first();
  
  return c.json({ success: true, data: results, meta: { total: totalRes?.total || 0 } });
});

unitRoutes.post('/', async (c) => {
  const businessId = c.get('businessId');
  const body = await c.req.json();
  
  const err = validateRequired(body, ['name', 'symbol']);
  if (err) return c.json({ success: false, message: err }, 400);

  const id = crypto.randomUUID();
  await c.env.DB.prepare(
    'INSERT INTO units (id, business_id, name, symbol) VALUES (?, ?, ?, ?)'
  ).bind(id, businessId, body.name, body.symbol).run();

  return c.json({ success: true, data: { id, ...body } }, 201);
});

unitRoutes.get('/:id', async (c) => {
  const businessId = c.get('businessId');
  const id = c.req.param('id');
  const result = await c.env.DB.prepare('SELECT * FROM units WHERE id = ? AND business_id = ?').bind(id, businessId).first();
  if (!result) return c.json({ success: false, message: 'Satuan tidak ditemukan' }, 404);
  return c.json({ success: true, data: result });
});

unitRoutes.put('/:id', async (c) => {
  const businessId = c.get('businessId');
  const id = c.req.param('id');
  const body = await c.req.json();
  
  await c.env.DB.prepare(
    'UPDATE units SET name = ?, symbol = ?, updated_at = datetime("now") WHERE id = ? AND business_id = ?'
  ).bind(body.name, body.symbol, id, businessId).run();

  return c.json({ success: true, message: 'Satuan diperbarui' });
});

unitRoutes.delete('/:id', async (c) => {
  const businessId = c.get('businessId');
  const id = c.req.param('id');
  
  // Prevent deletion if used by variants
  const variants = await c.env.DB.prepare('SELECT id FROM product_variants WHERE unit_id = ? AND business_id = ?').bind(id, businessId).first();
  if (variants) return c.json({ success: false, message: 'Gagal dihapus: Satuan sedang digunakan' }, 400);

  await c.env.DB.prepare('DELETE FROM units WHERE id = ? AND business_id = ?').bind(id, businessId).run();
  return c.json({ success: true, message: 'Satuan dihapus' });
});
