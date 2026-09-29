import { Hono } from 'hono';
import type { Env } from '../types';
import { authMiddleware } from '../middleware/auth';
import { tenantMiddleware } from '../middleware/tenant';
import { validateRequired, parsePagination } from '../middleware/validation';

export const locationRoutes = new Hono<{ Bindings: Env }>();
locationRoutes.use('/*', authMiddleware, tenantMiddleware);

locationRoutes.get('/', async (c) => {
  const businessId = c.get('businessId');
  const { limit, offset, search } = parsePagination(c);
  
  let query = 'SELECT * FROM stock_locations WHERE business_id = ?';
  const params: any[] = [businessId];
  
  if (search) {
    query += ' AND name LIKE ?';
    params.push(`%${search}%`);
  }
  
  query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
  params.push(limit, offset);

  const { results } = await c.env.DB.prepare(query).bind(...params).all();
  
  let countQuery = 'SELECT COUNT(*) as total FROM stock_locations WHERE business_id = ?';
  const countParams: any[] = [businessId];
  if (search) {
    countQuery += ' AND name LIKE ?';
    countParams.push(`%${search}%`);
  }
  const totalRes = await c.env.DB.prepare(countQuery).bind(...countParams).first();
  
  return c.json({ success: true, data: results, meta: { total: totalRes?.total || 0 } });
});

locationRoutes.post('/', async (c) => {
  const businessId = c.get('businessId');
  const body = await c.req.json();
  
  const err = validateRequired(body, ['name', 'type']);
  if (err) return c.json({ success: false, message: err }, 400);

  const id = crypto.randomUUID();
  await c.env.DB.prepare(
    'INSERT INTO stock_locations (id, business_id, type, reference_id, name) VALUES (?, ?, ?, ?, ?)'
  ).bind(id, businessId, body.type, body.reference_id || null, body.name).run();

  return c.json({ success: true, data: { id, ...body } }, 201);
});

locationRoutes.put('/:id', async (c) => {
  const businessId = c.get('businessId');
  const id = c.req.param('id');
  const body = await c.req.json();
  
  await c.env.DB.prepare(
    'UPDATE stock_locations SET name = ?, type = ?, reference_id = ?, updated_at = datetime("now") WHERE id = ? AND business_id = ?'
  ).bind(body.name, body.type, body.reference_id || null, id, businessId).run();

  return c.json({ success: true, message: 'Lokasi diperbarui' });
});

locationRoutes.delete('/:id', async (c) => {
  const businessId = c.get('businessId');
  const id = c.req.param('id');
  
  const balances = await c.env.DB.prepare('SELECT id FROM stock_balances WHERE location_id = ? AND business_id = ? AND quantity > 0').bind(id, businessId).first();
  if (balances) return c.json({ success: false, message: 'Gagal dihapus: Masih terdapat stok di lokasi ini' }, 400);

  await c.env.DB.prepare('DELETE FROM stock_locations WHERE id = ? AND business_id = ?').bind(id, businessId).run();
  return c.json({ success: true, message: 'Lokasi dihapus' });
});
