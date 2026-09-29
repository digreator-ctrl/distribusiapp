import { Hono } from 'hono';
import type { Env } from '../types';
import { authMiddleware } from '../middleware/auth';
import { tenantMiddleware } from '../middleware/tenant';
import { parsePagination, generateNumber, validateRequired } from '../middleware/validation';

export const storeRoutes = new Hono<{ Bindings: Env }>();
storeRoutes.use('/*', authMiddleware, tenantMiddleware);

storeRoutes.get('/', async (c) => {
  const businessId = c.get('businessId');
  const { limit, offset, search } = parsePagination(c);
  
  let query = 'SELECT * FROM stores WHERE business_id = ?';
  const params: any[] = [businessId];
  
  if (search) {
    query += ' AND (name LIKE ? OR store_code LIKE ?)';
    params.push(`%${search}%`, `%${search}%`);
  }
  
  query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
  params.push(limit, offset);

  const { results } = await c.env.DB.prepare(query).bind(...params).all();
  
  let countQuery = 'SELECT COUNT(*) as total FROM stores WHERE business_id = ?';
  const countParams: any[] = [businessId];
  if (search) {
    countQuery += ' AND (name LIKE ? OR store_code LIKE ?)';
    countParams.push(`%${search}%`, `%${search}%`);
  }
  const totalRes = await c.env.DB.prepare(countQuery).bind(...countParams).first();
  
  return c.json({ success: true, data: results, meta: { total: totalRes?.total || 0 } });
});

storeRoutes.post('/', async (c) => {
  const businessId = c.get('businessId');
  const user = c.get('user');
  const body = await c.req.json();
  
  const err = validateRequired(body, ['name']);
  if (err) return c.json({ success: false, message: err }, 400);

  const id = crypto.randomUUID();
  const storeCode = body.store_code || generateNumber('TOK');
  
  const statements = [];

  statements.push(
    c.env.DB.prepare(
      `INSERT INTO stores 
      (id, business_id, store_code, name, owner_name, phone, address, district, city, latitude, longitude, type, status, notes, registered_by) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(
      id, businessId, storeCode, body.name, body.owner_name || null, body.phone || null, 
      body.address || null, body.district || null, body.city || null, 
      body.latitude || null, body.longitude || null, 
      body.type || 'retail', body.status || 'active', body.notes || null, user.userId
    )
  );

  // Automatically create a stock location for this store
  const locationId = crypto.randomUUID();
  statements.push(
    c.env.DB.prepare(
      'INSERT INTO stock_locations (id, business_id, type, reference_id, name) VALUES (?, ?, ?, ?, ?)'
    ).bind(locationId, businessId, 'store', id, `Toko: ${body.name}`)
  );

  await c.env.DB.batch(statements);

  return c.json({ success: true, data: { id, store_code: storeCode, ...body } }, 201);
});

storeRoutes.get('/:id', async (c) => {
  const businessId = c.get('businessId');
  const id = c.req.param('id');
  const result = await c.env.DB.prepare('SELECT * FROM stores WHERE id = ? AND business_id = ?').bind(id, businessId).first();
  
  if (!result) return c.json({ success: false, message: 'Toko tidak ditemukan' }, 404);
  
  return c.json({ success: true, data: result });
});

storeRoutes.put('/:id', async (c) => {
  const businessId = c.get('businessId');
  const id = c.req.param('id');
  const body = await c.req.json();
  
  const statements = [];

  statements.push(
    c.env.DB.prepare(
      `UPDATE stores SET 
        name = ?, owner_name = ?, phone = ?, address = ?, district = ?, city = ?, 
        latitude = ?, longitude = ?, type = ?, status = ?, notes = ?, updated_at = datetime("now") 
      WHERE id = ? AND business_id = ?`
    ).bind(
      body.name, body.owner_name || null, body.phone || null, body.address || null, 
      body.district || null, body.city || null, body.latitude || null, body.longitude || null, 
      body.type || 'retail', body.status || 'active', body.notes || null, id, businessId
    )
  );

  // Update location name if store name changed
  statements.push(
    c.env.DB.prepare(
      'UPDATE stock_locations SET name = ?, updated_at = datetime("now") WHERE reference_id = ? AND type = "store" AND business_id = ?'
    ).bind(`Toko: ${body.name}`, id, businessId)
  );

  await c.env.DB.batch(statements);

  return c.json({ success: true, message: 'Toko diperbarui' });
});

storeRoutes.delete('/:id', async (c) => {
  const businessId = c.get('businessId');
  const id = c.req.param('id');
  
  // Checking dependencies (visits)
  const visits = await c.env.DB.prepare('SELECT id FROM sales_visits WHERE store_id = ? AND business_id = ? LIMIT 1').bind(id, businessId).first();
  if (visits) return c.json({ success: false, message: 'Gagal dihapus: Toko memiliki riwayat kunjungan' }, 400);

  const statements = [
    c.env.DB.prepare('DELETE FROM stock_locations WHERE reference_id = ? AND type = "store" AND business_id = ?').bind(id, businessId),
    c.env.DB.prepare('DELETE FROM stores WHERE id = ? AND business_id = ?').bind(id, businessId)
  ];

  await c.env.DB.batch(statements);

  return c.json({ success: true, message: 'Toko dihapus' });
});
