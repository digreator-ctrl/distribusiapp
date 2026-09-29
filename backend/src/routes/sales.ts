import { Hono } from 'hono';
import type { Env } from '../types';
import { authMiddleware } from '../middleware/auth';
import { tenantMiddleware } from '../middleware/tenant';
import { parsePagination, generateNumber, validateRequired } from '../middleware/validation';

export const salesRoutes = new Hono<{ Bindings: Env }>();
salesRoutes.use('/*', authMiddleware, tenantMiddleware);

salesRoutes.get('/', async (c) => {
  const businessId = c.get('businessId');
  const { limit, offset, search } = parsePagination(c);
  
  let query = 'SELECT s.*, u.name as user_name FROM sales s LEFT JOIN users u ON u.id = s.user_id WHERE s.business_id = ?';
  const params: any[] = [businessId];
  
  if (search) {
    query += ' AND (s.name LIKE ? OR s.sales_code LIKE ?)';
    params.push(`%${search}%`, `%${search}%`);
  }
  
  query += ' ORDER BY s.created_at DESC LIMIT ? OFFSET ?';
  params.push(limit, offset);

  const { results } = await c.env.DB.prepare(query).bind(...params).all();
  
  let countQuery = 'SELECT COUNT(*) as total FROM sales WHERE business_id = ?';
  const countParams: any[] = [businessId];
  if (search) {
    countQuery += ' AND (name LIKE ? OR sales_code LIKE ?)';
    countParams.push(`%${search}%`, `%${search}%`);
  }
  const totalRes = await c.env.DB.prepare(countQuery).bind(...countParams).first();
  
  return c.json({ success: true, data: results, meta: { total: totalRes?.total || 0 } });
});

salesRoutes.post('/', async (c) => {
  const businessId = c.get('businessId');
  const body = await c.req.json();
  
  const err = validateRequired(body, ['name']);
  if (err) return c.json({ success: false, message: err }, 400);

  const id = crypto.randomUUID();
  const salesCode = body.sales_code || generateNumber('SLS');
  
  const statements = [];

  // Create sales record
  statements.push(
    c.env.DB.prepare(
      'INSERT INTO sales (id, business_id, user_id, sales_code, name, phone, status, area, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
    ).bind(
      id, businessId, body.user_id || null, salesCode, body.name, body.phone || null, 
      body.status || 'active', body.area || null, body.notes || null
    )
  );

  // Automatically create a stock location for this sales person
  const locationId = crypto.randomUUID();
  statements.push(
    c.env.DB.prepare(
      'INSERT INTO stock_locations (id, business_id, type, reference_id, name) VALUES (?, ?, ?, ?, ?)'
    ).bind(locationId, businessId, 'sales', id, `Mobil/Motor Sales: ${body.name}`)
  );

  await c.env.DB.batch(statements);

  return c.json({ success: true, data: { id, sales_code: salesCode, ...body } }, 201);
});

salesRoutes.get('/:id', async (c) => {
  const businessId = c.get('businessId');
  const id = c.req.param('id');
  const result = await c.env.DB.prepare('SELECT s.*, u.name as user_name FROM sales s LEFT JOIN users u ON u.id = s.user_id WHERE s.id = ? AND s.business_id = ?').bind(id, businessId).first();
  
  if (!result) return c.json({ success: false, message: 'Sales tidak ditemukan' }, 404);
  
  return c.json({ success: true, data: result });
});

salesRoutes.put('/:id', async (c) => {
  const businessId = c.get('businessId');
  const id = c.req.param('id');
  const body = await c.req.json();
  
  const statements = [];

  statements.push(
    c.env.DB.prepare(
      'UPDATE sales SET user_id = ?, name = ?, phone = ?, status = ?, area = ?, notes = ?, updated_at = datetime("now") WHERE id = ? AND business_id = ?'
    ).bind(
      body.user_id || null, body.name, body.phone || null, body.status || 'active', 
      body.area || null, body.notes || null, id, businessId
    )
  );

  // Update location name if sales name changed
  statements.push(
    c.env.DB.prepare(
      'UPDATE stock_locations SET name = ?, updated_at = datetime("now") WHERE reference_id = ? AND type = "sales" AND business_id = ?'
    ).bind(`Mobil/Motor Sales: ${body.name}`, id, businessId)
  );

  await c.env.DB.batch(statements);

  return c.json({ success: true, message: 'Sales diperbarui' });
});

salesRoutes.delete('/:id', async (c) => {
  const businessId = c.get('businessId');
  const id = c.req.param('id');
  
  // Checking dependencies (visits)
  const visits = await c.env.DB.prepare('SELECT id FROM sales_visits WHERE sales_id = ? AND business_id = ? LIMIT 1').bind(id, businessId).first();
  if (visits) return c.json({ success: false, message: 'Gagal dihapus: Sales memiliki riwayat kunjungan' }, 400);

  const statements = [
    c.env.DB.prepare('DELETE FROM stock_locations WHERE reference_id = ? AND type = "sales" AND business_id = ?').bind(id, businessId),
    c.env.DB.prepare('DELETE FROM sales WHERE id = ? AND business_id = ?').bind(id, businessId)
  ];

  await c.env.DB.batch(statements);

  return c.json({ success: true, message: 'Sales dihapus' });
});
