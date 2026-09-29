import { Hono } from 'hono';
import type { Env } from '../types';
import { authMiddleware } from '../middleware/auth';
import { tenantMiddleware } from '../middleware/tenant';
import { parsePagination, generateNumber, validateRequired } from '../middleware/validation';

export const displayRoutes = new Hono<{ Bindings: Env }>();
displayRoutes.use('/*', authMiddleware, tenantMiddleware);

// ==========================================
// 1. DISPLAYS CRUD
// ==========================================
displayRoutes.get('/', async (c) => {
  const businessId = c.get('businessId');
  const { limit, offset, search } = parsePagination(c);
  
  let query = 'SELECT * FROM displays WHERE business_id = ?';
  const params: any[] = [businessId];
  
  if (search) {
    query += ' AND (name LIKE ? OR display_code LIKE ?)';
    params.push(`%${search}%`, `%${search}%`);
  }
  
  query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
  params.push(limit, offset);

  const { results } = await c.env.DB.prepare(query).bind(...params).all();
  
  let countQuery = 'SELECT COUNT(*) as total FROM displays WHERE business_id = ?';
  const countParams: any[] = [businessId];
  if (search) {
    countQuery += ' AND (name LIKE ? OR display_code LIKE ?)';
    countParams.push(`%${search}%`, `%${search}%`);
  }
  const totalRes = await c.env.DB.prepare(countQuery).bind(...countParams).first();
  
  return c.json({ success: true, data: results, meta: { total: totalRes?.total || 0 } });
});

displayRoutes.post('/', async (c) => {
  const businessId = c.get('businessId');
  const body = await c.req.json();
  
  const err = validateRequired(body, ['name']);
  if (err) return c.json({ success: false, message: err }, 400);

  const id = crypto.randomUUID();
  const displayCode = body.display_code || generateNumber('DSP');
  
  await c.env.DB.prepare(
    'INSERT INTO displays (id, business_id, display_code, name, type, capacity, condition, status, photo_url) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
  ).bind(
    id, businessId, displayCode, body.name, body.type || null, 
    body.capacity || null, body.condition || 'good', body.status || 'available', body.photo_url || null
  ).run();

  return c.json({ success: true, data: { id, display_code: displayCode, ...body } }, 201);
});

displayRoutes.get('/:id', async (c) => {
  const businessId = c.get('businessId');
  const id = c.req.param('id');
  
  const display = await c.env.DB.prepare('SELECT * FROM displays WHERE id = ? AND business_id = ?').bind(id, businessId).first();
  if (!display) return c.json({ success: false, message: 'Display tidak ditemukan' }, 404);
  
  // Get active assignment
  const assignment = await c.env.DB.prepare(`
    SELECT da.*, s.name as sales_name, st.name as store_name
    FROM display_assignments da
    LEFT JOIN sales s ON s.id = da.sales_id
    LEFT JOIN stores st ON st.id = da.store_id
    WHERE da.display_id = ? AND da.status = 'active'
    ORDER BY da.assigned_at DESC LIMIT 1
  `).bind(id).first();

  // Get items
  const { results: items } = await c.env.DB.prepare(`
    SELECT di.*, p.name as product_name, v.name as variant_name
    FROM display_items di
    JOIN products p ON p.id = di.product_id
    JOIN product_variants v ON v.id = di.variant_id
    WHERE di.display_id = ?
  `).bind(id).all();

  return c.json({ success: true, data: { ...display, active_assignment: assignment, items } });
});

displayRoutes.put('/:id', async (c) => {
  const businessId = c.get('businessId');
  const id = c.req.param('id');
  const body = await c.req.json();
  
  await c.env.DB.prepare(
    'UPDATE displays SET name = ?, type = ?, capacity = ?, condition = ?, status = ?, photo_url = ?, updated_at = datetime("now") WHERE id = ? AND business_id = ?'
  ).bind(
    body.name, body.type || null, body.capacity || null, 
    body.condition || 'good', body.status || 'available', body.photo_url || null, id, businessId
  ).run();

  return c.json({ success: true, message: 'Display diperbarui' });
});

displayRoutes.delete('/:id', async (c) => {
  const businessId = c.get('businessId');
  const id = c.req.param('id');
  
  const check = await c.env.DB.prepare('SELECT status FROM displays WHERE id = ? AND business_id = ?').bind(id, businessId).first();
  if (!check) return c.json({ success: false, message: 'Display tidak ditemukan' }, 404);
  if (check.status === 'in_use') return c.json({ success: false, message: 'Display masih digunakan' }, 400);

  const statements = [
    c.env.DB.prepare('DELETE FROM display_items WHERE display_id = ?').bind(id),
    c.env.DB.prepare('DELETE FROM display_assignments WHERE display_id = ?').bind(id),
    c.env.DB.prepare('DELETE FROM displays WHERE id = ? AND business_id = ?').bind(id, businessId)
  ];
  
  await c.env.DB.batch(statements);

  return c.json({ success: true, message: 'Display dihapus' });
});

// ==========================================
// 2. DISPLAY ASSIGNMENTS
// ==========================================
displayRoutes.post('/:id/assign', async (c) => {
  const businessId = c.get('businessId');
  const id = c.req.param('id');
  const body = await c.req.json();
  
  if (!body.sales_id && !body.store_id) return c.json({ success: false, message: 'Pilih sales atau toko' }, 400);

  const statements = [];
  
  // Set existing assignments for this display to released
  statements.push(
    c.env.DB.prepare(`
      UPDATE display_assignments 
      SET status = 'released', released_at = datetime('now'), updated_at = datetime('now') 
      WHERE display_id = ? AND status = 'active'
    `).bind(id)
  );
  
  // Create new assignment
  const assignmentId = crypto.randomUUID();
  statements.push(
    c.env.DB.prepare(`
      INSERT INTO display_assignments (id, business_id, display_id, sales_id, store_id, status, notes)
      VALUES (?, ?, ?, ?, ?, 'active', ?)
    `).bind(assignmentId, businessId, id, body.sales_id || null, body.store_id || null, body.notes || null)
  );
  
  // Update display status
  statements.push(
    c.env.DB.prepare('UPDATE displays SET status = "in_use", updated_at = datetime("now") WHERE id = ? AND business_id = ?').bind(id, businessId)
  );

  await c.env.DB.batch(statements);

  return c.json({ success: true, message: 'Display berhasil ditugaskan' });
});

displayRoutes.post('/:id/release', async (c) => {
  const businessId = c.get('businessId');
  const id = c.req.param('id');
  
  const statements = [
    c.env.DB.prepare(`
      UPDATE display_assignments 
      SET status = 'released', released_at = datetime('now'), updated_at = datetime('now') 
      WHERE display_id = ? AND status = 'active'
    `).bind(id),
    c.env.DB.prepare('UPDATE displays SET status = "available", updated_at = datetime("now") WHERE id = ? AND business_id = ?').bind(id, businessId)
  ];
  
  await c.env.DB.batch(statements);
  return c.json({ success: true, message: 'Display ditarik kembali' });
});

// ==========================================
// 3. DISPLAY ITEMS
// ==========================================
displayRoutes.post('/:id/items', async (c) => {
  const id = c.req.param('id');
  const body = await c.req.json();
  const items = body.items as any[];
  
  if (!items || !items.length) return c.json({ success: false, message: 'Items kosong' }, 400);

  const statements = [
    c.env.DB.prepare('DELETE FROM display_items WHERE display_id = ?').bind(id)
  ];

  for (const item of items) {
    statements.push(
      c.env.DB.prepare(`
        INSERT INTO display_items (id, display_id, product_id, variant_id, batch_id, quantity)
        VALUES (?, ?, ?, ?, ?, ?)
      `).bind(crypto.randomUUID(), id, item.product_id, item.variant_id, item.batch_id || null, item.quantity || 1)
    );
  }

  await c.env.DB.batch(statements);
  return c.json({ success: true, message: 'Isi display diperbarui' });
});
