import { Hono } from 'hono';
import type { Env } from '../types';
import { authMiddleware } from '../middleware/auth';
import { tenantMiddleware } from '../middleware/tenant';
import { validateRequired, parsePagination } from '../middleware/validation';

export const supplierRoutes = new Hono<{ Bindings: Env }>();
supplierRoutes.use('/*', authMiddleware, tenantMiddleware);

supplierRoutes.get('/', async (c) => {
  const businessId = c.get('businessId');
  const { limit, offset, search } = parsePagination(c);
  
  let query = 'SELECT * FROM suppliers WHERE business_id = ?';
  const params: any[] = [businessId];
  
  if (search) {
    query += ' AND name LIKE ?';
    params.push(`%${search}%`);
  }
  
  query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
  params.push(limit, offset);

  const { results } = await c.env.DB.prepare(query).bind(...params).all();
  
  let countQuery = 'SELECT COUNT(*) as total FROM suppliers WHERE business_id = ?';
  const countParams: any[] = [businessId];
  if (search) {
    countQuery += ' AND name LIKE ?';
    countParams.push(`%${search}%`);
  }
  const totalRes = await c.env.DB.prepare(countQuery).bind(...countParams).first();
  
  return c.json({ success: true, data: results, meta: { total: totalRes?.total || 0 } });
});

supplierRoutes.post('/', async (c) => {
  const businessId = c.get('businessId');
  const body = await c.req.json();
  
  const err = validateRequired(body, ['name', 'type']);
  if (err) return c.json({ success: false, message: err }, 400);

  const id = crypto.randomUUID();
  await c.env.DB.prepare(
    'INSERT INTO suppliers (id, business_id, name, contact_person, phone, email, address, city, type, notes, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
  ).bind(
    id, businessId, body.name, body.contact_person || null, body.phone || null, body.email || null, 
    body.address || null, body.city || null, body.type || 'production', body.notes || null, body.status || 'active'
  ).run();

  return c.json({ success: true, data: { id, ...body } }, 201);
});

supplierRoutes.get('/:id', async (c) => {
  const businessId = c.get('businessId');
  const id = c.req.param('id');
  const result = await c.env.DB.prepare('SELECT * FROM suppliers WHERE id = ? AND business_id = ?').bind(id, businessId).first();
  if (!result) return c.json({ success: false, message: 'Supplier tidak ditemukan' }, 404);
  return c.json({ success: true, data: result });
});

supplierRoutes.put('/:id', async (c) => {
  const businessId = c.get('businessId');
  const id = c.req.param('id');
  const body = await c.req.json();
  
  await c.env.DB.prepare(`
    UPDATE suppliers 
    SET name = ?, contact_person = ?, phone = ?, email = ?, address = ?, city = ?, type = ?, notes = ?, status = ?, updated_at = datetime("now") 
    WHERE id = ? AND business_id = ?
  `).bind(
    body.name, body.contact_person || null, body.phone || null, body.email || null, 
    body.address || null, body.city || null, body.type || 'production', body.notes || null, body.status || 'active', 
    id, businessId
  ).run();

  return c.json({ success: true, message: 'Supplier diperbarui' });
});

supplierRoutes.delete('/:id', async (c) => {
  const businessId = c.get('businessId');
  const id = c.req.param('id');
  
  // Checking dependencies (product batches or receipts)
  const batches = await c.env.DB.prepare('SELECT id FROM product_batches WHERE supplier_id = ? AND business_id = ?').bind(id, businessId).first();
  if (batches) return c.json({ success: false, message: 'Gagal dihapus: Supplier sedang digunakan pada data batch produk' }, 400);

  await c.env.DB.prepare('DELETE FROM suppliers WHERE id = ? AND business_id = ?').bind(id, businessId).run();
  return c.json({ success: true, message: 'Supplier dihapus' });
});
