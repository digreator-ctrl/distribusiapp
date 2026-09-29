import { Hono } from 'hono';
import type { Env } from '../types';
import { authMiddleware } from '../middleware/auth';
import { tenantMiddleware } from '../middleware/tenant';
import { parsePagination, generateNumber, validateRequired } from '../middleware/validation';

export const agentOrderRoutes = new Hono<{ Bindings: Env }>();
agentOrderRoutes.use('/*', authMiddleware, tenantMiddleware);

// 5.5 API: Transaksi Agen (List Orders)
agentOrderRoutes.get('/', async (c) => {
  const businessId = c.get('businessId');
  const { limit, offset } = parsePagination(c);
  const status = c.req.query('status');
  
  let query = `
    SELECT ao.*, a.name as agent_name, u.name as created_by_name 
    FROM agent_orders ao
    JOIN agents a ON a.id = ao.agent_id
    LEFT JOIN users u ON u.id = ao.created_by
    WHERE ao.business_id = ?
  `;
  const params: any[] = [businessId];
  
  if (status) {
    query += ' AND ao.status = ?';
    params.push(status);
  }
  
  query += ' ORDER BY ao.created_at DESC LIMIT ? OFFSET ?';
  params.push(limit, offset);

  const { results } = await c.env.DB.prepare(query).bind(...params).all();
  
  let countQuery = 'SELECT COUNT(*) as total FROM agent_orders WHERE business_id = ?';
  const countParams: any[] = [businessId];
  if (status) {
    countQuery += ' AND status = ?';
    countParams.push(status);
  }
  const totalRes = await c.env.DB.prepare(countQuery).bind(...countParams).first();
  
  return c.json({ success: true, data: results, meta: { total: totalRes?.total || 0 } });
});

// 5.3 API: Pesanan Agen (Create Order)
agentOrderRoutes.post('/', async (c) => {
  const businessId = c.get('businessId');
  const user = c.get('user');
  const body = await c.req.json();
  
  const err = validateRequired(body, ['agent_id', 'order_date', 'items']);
  if (err) return c.json({ success: false, message: err }, 400);

  const items = body.items as any[];
  if (!items || items.length === 0) return c.json({ success: false, message: 'Item pesanan tidak boleh kosong' }, 400);

  // Validate MOQ
  const rule = await c.env.DB.prepare('SELECT minimum_order FROM agent_rules WHERE agent_id = ? AND business_id = ? AND status = "active"').bind(body.agent_id, businessId).first();
  
  const totalQty = items.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
  if (rule && rule.minimum_order > 0 && totalQty < rule.minimum_order) {
    return c.json({ success: false, message: `Minimum order agen ini adalah ${rule.minimum_order} item, saat ini total ${totalQty} item` }, 400);
  }

  const orderId = crypto.randomUUID();
  const orderNumber = generateNumber('AGN-ORD');
  
  let total = 0;
  items.forEach(item => {
    total += (item.quantity * item.price);
  });

  const statements = [];
  
  // Insert Order
  statements.push(
    c.env.DB.prepare(`
      INSERT INTO agent_orders (id, business_id, agent_id, order_number, order_date, status, total, notes, created_by) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(orderId, businessId, body.agent_id, orderNumber, body.order_date, 'pending', total, body.notes || null, user.userId)
  );

  for (const item of items) {
    const itemId = crypto.randomUUID();
    statements.push(
      c.env.DB.prepare(`
        INSERT INTO agent_order_items (id, order_id, product_id, variant_id, batch_id, quantity, price, subtotal)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(itemId, orderId, item.product_id, item.variant_id, item.batch_id || null, item.quantity, item.price, item.quantity * item.price)
    );
  }

  try {
    await c.env.DB.batch(statements);
    return c.json({ success: true, message: 'Pesanan agen berhasil dibuat', data: { id: orderId } }, 201);
  } catch (error: any) {
    return c.json({ success: false, message: 'Gagal membuat pesanan', error: error.message }, 500);
  }
});

// Detail Pesanan
agentOrderRoutes.get('/:id', async (c) => {
  const businessId = c.get('businessId');
  const id = c.req.param('id');
  
  const order = await c.env.DB.prepare(`
    SELECT ao.*, a.name as agent_name 
    FROM agent_orders ao
    JOIN agents a ON a.id = ao.agent_id
    WHERE ao.id = ? AND ao.business_id = ?
  `).bind(id, businessId).first();
  
  if (!order) return c.json({ success: false, message: 'Pesanan tidak ditemukan' }, 404);
  
  const { results: items } = await c.env.DB.prepare(`
    SELECT aoi.*, p.name as product_name, v.name as variant_name, b.batch_number
    FROM agent_order_items aoi
    JOIN products p ON p.id = aoi.product_id
    JOIN product_variants v ON v.id = aoi.variant_id
    LEFT JOIN product_batches b ON b.id = aoi.batch_id
    WHERE aoi.order_id = ?
  `).bind(id).all();
  
  return c.json({ success: true, data: { ...order, items } });
});

// 5.4 API: Distribusi Agen (Update Status & Keluarkan Stok)
agentOrderRoutes.put('/:id/status', async (c) => {
  const businessId = c.get('businessId');
  const user = c.get('user');
  const id = c.req.param('id');
  const body = await c.req.json();
  
  const newStatus = body.status;
  if (!['pending', 'approved', 'preparing', 'shipped', 'completed', 'cancelled'].includes(newStatus)) {
    return c.json({ success: false, message: 'Status tidak valid' }, 400);
  }

  const order = await c.env.DB.prepare('SELECT status FROM agent_orders WHERE id = ? AND business_id = ?').bind(id, businessId).first();
  if (!order) return c.json({ success: false, message: 'Pesanan tidak ditemukan' }, 404);

  const currentStatus = order.status;
  
  // Jika berubah menjadi shipped dan sebelumnya bukan shipped/completed, maka distribusikan stok
  if (newStatus === 'shipped' && currentStatus !== 'shipped' && currentStatus !== 'completed') {
    // Cari gudang utama
    const location = await c.env.DB.prepare("SELECT id FROM stock_locations WHERE business_id = ? AND type = 'warehouse' LIMIT 1").bind(businessId).first();
    if (!location) return c.json({ success: false, message: 'Lokasi gudang utama belum disetup.' }, 400);
    const locationId = location.id;

    // Ambil item
    const { results: items } = await c.env.DB.prepare('SELECT * FROM agent_order_items WHERE order_id = ?').bind(id).all();
    
    const statements = [];
    
    // Update order status
    statements.push(
      c.env.DB.prepare('UPDATE agent_orders SET status = ?, updated_at = datetime("now") WHERE id = ?').bind(newStatus, id)
    );

    for (const item of items) {
      // Create Stock Movement (Agent Distribution Out)
      const movementId = crypto.randomUUID();
      statements.push(
         c.env.DB.prepare(`
           INSERT INTO stock_movements 
           (id, business_id, product_id, variant_id, batch_id, from_location_id, quantity, movement_type, reference_type, reference_id, created_by)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         `).bind(movementId, businessId, item.product_id, item.variant_id, item.batch_id || null, locationId, item.quantity, 'agent_distribution', 'agent_orders', id, user.userId)
      );
      
      // Kurangi stok
      statements.push(
        c.env.DB.prepare(`
          UPDATE stock_balances SET quantity = quantity - ?, updated_at = datetime('now')
          WHERE business_id = ? AND location_id = ? AND product_id = ? AND variant_id = ? AND (batch_id = ? OR (? IS NULL AND batch_id IS NULL))
        `).bind(item.quantity, businessId, locationId, item.product_id, item.variant_id, item.batch_id, item.batch_id)
      );
    }

    try {
      await c.env.DB.batch(statements);
      return c.json({ success: true, message: 'Status pesanan diperbarui dan stok berhasil didistribusikan' });
    } catch (error: any) {
      return c.json({ success: false, message: 'Gagal mendistribusikan stok', error: error.message }, 500);
    }
  } else {
    // Hanya update status
    await c.env.DB.prepare('UPDATE agent_orders SET status = ?, updated_at = datetime("now") WHERE id = ?').bind(newStatus, id).run();
    return c.json({ success: true, message: `Status pesanan diperbarui menjadi ${newStatus}` });
  }
});
