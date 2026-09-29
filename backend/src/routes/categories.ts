import { Hono } from 'hono';
import type { Env } from '../types';
import { authMiddleware } from '../middleware/auth';
import { tenantMiddleware } from '../middleware/tenant';
import { validateRequired, parsePagination } from '../middleware/validation';

export const categoryRoutes = new Hono<{ Bindings: Env }>();
categoryRoutes.use('/*', authMiddleware, tenantMiddleware);

categoryRoutes.get('/', async (c) => {
  const businessId = c.get('businessId');
  const { limit, offset, search } = parsePagination(c);
  
  let query = 'SELECT * FROM product_categories WHERE business_id = ?';
  const params: any[] = [businessId];
  
  if (search) {
    query += ' AND name LIKE ?';
    params.push(`%${search}%`);
  }
  
  query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
  params.push(limit, offset);

  const { results } = await c.env.DB.prepare(query).bind(...params).all();
  
  let countQuery = 'SELECT COUNT(*) as total FROM product_categories WHERE business_id = ?';
  const countParams: any[] = [businessId];
  if (search) {
    countQuery += ' AND name LIKE ?';
    countParams.push(`%${search}%`);
  }
  const totalRes = await c.env.DB.prepare(countQuery).bind(...countParams).first();
  
  return c.json({ success: true, data: results, meta: { total: totalRes?.total || 0 } });
});

categoryRoutes.post('/', async (c) => {
  const businessId = c.get('businessId');
  const body = await c.req.json();
  
  const err = validateRequired(body, ['name']);
  if (err) return c.json({ success: false, message: err }, 400);

  const id = crypto.randomUUID();
  await c.env.DB.prepare(
    'INSERT INTO product_categories (id, business_id, name, description, status) VALUES (?, ?, ?, ?, ?)'
  ).bind(id, businessId, body.name, body.description || null, body.status || 'active').run();

  return c.json({ success: true, data: { id, ...body } }, 201);
});

categoryRoutes.get('/:id', async (c) => {
  const businessId = c.get('businessId');
  const id = c.req.param('id');
  const result = await c.env.DB.prepare('SELECT * FROM product_categories WHERE id = ? AND business_id = ?').bind(id, businessId).first();
  if (!result) return c.json({ success: false, message: 'Kategori tidak ditemukan' }, 404);
  return c.json({ success: true, data: result });
});

categoryRoutes.put('/:id', async (c) => {
  const businessId = c.get('businessId');
  const id = c.req.param('id');
  const body = await c.req.json();
  
  await c.env.DB.prepare(
    'UPDATE product_categories SET name = ?, description = ?, status = ?, updated_at = datetime("now") WHERE id = ? AND business_id = ?'
  ).bind(body.name, body.description || null, body.status || 'active', id, businessId).run();

  return c.json({ success: true, message: 'Kategori diperbarui' });
});

categoryRoutes.delete('/:id', async (c) => {
  const businessId = c.get('businessId');
  const id = c.req.param('id');
  
  // Prevent deletion if products exist
  const products = await c.env.DB.prepare('SELECT id FROM products WHERE category_id = ? AND business_id = ?').bind(id, businessId).first();
  if (products) return c.json({ success: false, message: 'Gagal dihapus: Kategori sedang digunakan oleh produk' }, 400);
  
  await c.env.DB.prepare('DELETE FROM product_categories WHERE id = ? AND business_id = ?').bind(id, businessId).run();
  return c.json({ success: true, message: 'Kategori dihapus' });
});
