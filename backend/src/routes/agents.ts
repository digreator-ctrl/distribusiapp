import { Hono } from 'hono';
import type { Env } from '../types';
import { authMiddleware } from '../middleware/auth';
import { tenantMiddleware } from '../middleware/tenant';
import { parsePagination, generateNumber, validateRequired } from '../middleware/validation';

export const agentRoutes = new Hono<{ Bindings: Env }>();
agentRoutes.use('/*', authMiddleware, tenantMiddleware);

// 5.1 API: Agen — CRUD
agentRoutes.get('/', async (c) => {
  const businessId = c.get('businessId');
  const { limit, offset, search } = parsePagination(c);
  
  let query = 'SELECT * FROM agents WHERE business_id = ?';
  const params: any[] = [businessId];
  
  if (search) {
    query += ' AND (name LIKE ? OR code LIKE ? OR email LIKE ?)';
    params.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }
  
  query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
  params.push(limit, offset);

  const { results } = await c.env.DB.prepare(query).bind(...params).all();
  
  let countQuery = 'SELECT COUNT(*) as total FROM agents WHERE business_id = ?';
  const countParams: any[] = [businessId];
  if (search) {
    countQuery += ' AND (name LIKE ? OR code LIKE ? OR email LIKE ?)';
    countParams.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }
  const totalRes = await c.env.DB.prepare(countQuery).bind(...countParams).first();
  
  return c.json({ success: true, data: results, meta: { total: totalRes?.total || 0 } });
});

agentRoutes.post('/', async (c) => {
  const businessId = c.get('businessId');
  const body = await c.req.json();
  
  const err = validateRequired(body, ['name']);
  if (err) return c.json({ success: false, message: err }, 400);

  const id = crypto.randomUUID();
  const code = body.code || generateNumber('AGN');
  
  await c.env.DB.prepare(
    'INSERT INTO agents (id, business_id, code, name, contact_person, phone, email, address, city, status, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
  ).bind(
    id, businessId, code, body.name, body.contact_person || null, body.phone || null, 
    body.email || null, body.address || null, body.city || null, body.status || 'active', body.notes || null
  ).run();

  return c.json({ success: true, data: { id, code, ...body } }, 201);
});

agentRoutes.get('/:id', async (c) => {
  const businessId = c.get('businessId');
  const id = c.req.param('id');
  const result = await c.env.DB.prepare('SELECT * FROM agents WHERE id = ? AND business_id = ?').bind(id, businessId).first();
  
  if (!result) return c.json({ success: false, message: 'Agen tidak ditemukan' }, 404);
  
  // Ambil ketentuan agen jika ada
  const rule = await c.env.DB.prepare('SELECT * FROM agent_rules WHERE agent_id = ? AND business_id = ? AND status = "active"').bind(id, businessId).first();
  
  return c.json({ success: true, data: { ...result, rule } });
});

agentRoutes.put('/:id', async (c) => {
  const businessId = c.get('businessId');
  const id = c.req.param('id');
  const body = await c.req.json();
  
  await c.env.DB.prepare(
    'UPDATE agents SET name = ?, contact_person = ?, phone = ?, email = ?, address = ?, city = ?, status = ?, notes = ?, updated_at = datetime("now") WHERE id = ? AND business_id = ?'
  ).bind(
    body.name, body.contact_person || null, body.phone || null, body.email || null, 
    body.address || null, body.city || null, body.status || 'active', body.notes || null, 
    id, businessId
  ).run();

  return c.json({ success: true, message: 'Agen diperbarui' });
});

agentRoutes.delete('/:id', async (c) => {
  const businessId = c.get('businessId');
  const id = c.req.param('id');
  
  const orders = await c.env.DB.prepare('SELECT id FROM agent_orders WHERE agent_id = ? AND business_id = ? LIMIT 1').bind(id, businessId).first();
  if (orders) return c.json({ success: false, message: 'Gagal dihapus: Agen sudah memiliki riwayat pesanan' }, 400);

  // Soft delete atau hard delete rules
  await c.env.DB.batch([
    c.env.DB.prepare('DELETE FROM agent_rules WHERE agent_id = ? AND business_id = ?').bind(id, businessId),
    c.env.DB.prepare('DELETE FROM agents WHERE id = ? AND business_id = ?').bind(id, businessId)
  ]);
  
  return c.json({ success: true, message: 'Agen dihapus' });
});

// 5.2 API: Ketentuan Agen (Rules)
agentRoutes.post('/:id/rules', async (c) => {
  const businessId = c.get('businessId');
  const agentId = c.req.param('id');
  const body = await c.req.json();
  
  // Nonaktifkan rule yang lama
  await c.env.DB.prepare('UPDATE agent_rules SET status = "inactive" WHERE agent_id = ? AND business_id = ?').bind(agentId, businessId).run();
  
  const ruleId = crypto.randomUUID();
  await c.env.DB.prepare(
    'INSERT INTO agent_rules (id, business_id, agent_id, minimum_order, price_type, custom_discount_percent, return_policy, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
  ).bind(
    ruleId, businessId, agentId, body.minimum_order || 0, body.price_type || 'agent', 
    body.custom_discount_percent || null, body.return_policy || null, 'active'
  ).run();

  return c.json({ success: true, message: 'Ketentuan agen berhasil diperbarui', data: { id: ruleId } }, 201);
});
