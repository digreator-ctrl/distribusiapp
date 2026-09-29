import { Hono } from 'hono';
import type { Env } from '../types';
import { authMiddleware } from '../middleware/auth';
import { tenantMiddleware } from '../middleware/tenant';
import { parsePagination, generateNumber, validateRequired } from '../middleware/validation';

export const distributionRoutes = new Hono<{ Bindings: Env }>();
distributionRoutes.use('/*', authMiddleware, tenantMiddleware);

distributionRoutes.get('/', async (c) => {
  const businessId = c.get('businessId');
  const { limit, offset } = parsePagination(c);
  const type = c.req.query('type') || 'sales'; // default to sales
  
  let query = `
    SELECT d.*, 
           CASE WHEN d.type = 'sales' THEN s.name ELSE a.name END as target_name
    FROM distributions d
    LEFT JOIN sales s ON s.id = d.target_id AND d.type = 'sales'
    LEFT JOIN agents a ON a.id = d.target_id AND d.type = 'agent'
    WHERE d.business_id = ? AND d.type = ?
    ORDER BY d.created_at DESC LIMIT ? OFFSET ?
  `;
  const params: any[] = [businessId, type, limit, offset];

  const { results } = await c.env.DB.prepare(query).bind(...params).all();
  
  const countQuery = 'SELECT COUNT(*) as total FROM distributions WHERE business_id = ? AND type = ?';
  const totalRes = await c.env.DB.prepare(countQuery).bind(businessId, type).first();
  
  return c.json({ success: true, data: results, meta: { total: totalRes?.total || 0 } });
});

distributionRoutes.post('/', async (c) => {
  const businessId = c.get('businessId');
  const user = c.get('user');
  const body = await c.req.json();
  
  const err = validateRequired(body, ['target_id', 'distribution_date', 'items']);
  if (err) return c.json({ success: false, message: err }, 400);

  const items = body.items as any[];
  if (!items || items.length === 0) return c.json({ success: false, message: 'Item distribusi tidak boleh kosong' }, 400);

  const distributionId = crypto.randomUUID();
  const distributionNumber = generateNumber('DST');
  const type = body.type || 'sales'; // 'sales' or 'agent'
  
  const statements = [];
  
  statements.push(
    c.env.DB.prepare(`
      INSERT INTO distributions (id, business_id, distribution_number, type, target_id, distribution_date, status, notes, created_by) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(distributionId, businessId, distributionNumber, type, body.target_id, body.distribution_date, 'draft', body.notes || null, user.userId)
  );

  for (const item of items) {
    const itemId = crypto.randomUUID();
    statements.push(
      c.env.DB.prepare(`
        INSERT INTO distribution_items (id, distribution_id, product_id, variant_id, batch_id, quantity)
        VALUES (?, ?, ?, ?, ?, ?)
      `).bind(itemId, distributionId, item.product_id, item.variant_id, item.batch_id || null, item.quantity)
    );
  }

  try {
    await c.env.DB.batch(statements);
    return c.json({ success: true, message: 'Distribusi berhasil dibuat', data: { id: distributionId } }, 201);
  } catch (error: any) {
    return c.json({ success: false, message: 'Gagal membuat distribusi', error: error.message }, 500);
  }
});

distributionRoutes.get('/:id', async (c) => {
  const businessId = c.get('businessId');
  const id = c.req.param('id');
  
  const distribution = await c.env.DB.prepare(`
    SELECT d.*, 
           CASE WHEN d.type = 'sales' THEN s.name ELSE a.name END as target_name
    FROM distributions d
    LEFT JOIN sales s ON s.id = d.target_id AND d.type = 'sales'
    LEFT JOIN agents a ON a.id = d.target_id AND d.type = 'agent'
    WHERE d.id = ? AND d.business_id = ?
  `).bind(id, businessId).first();
  
  if (!distribution) return c.json({ success: false, message: 'Distribusi tidak ditemukan' }, 404);
  
  const { results: items } = await c.env.DB.prepare(`
    SELECT di.*, p.name as product_name, v.name as variant_name, b.batch_number
    FROM distribution_items di
    JOIN products p ON p.id = di.product_id
    JOIN product_variants v ON v.id = di.variant_id
    LEFT JOIN product_batches b ON b.id = di.batch_id
    WHERE di.distribution_id = ?
  `).bind(id).all();
  
  return c.json({ success: true, data: { ...distribution, items } });
});

distributionRoutes.put('/:id/status', async (c) => {
  const businessId = c.get('businessId');
  const user = c.get('user');
  const id = c.req.param('id');
  const body = await c.req.json();
  
  const newStatus = body.status;
  if (!['draft', 'approved', 'in_transit', 'completed', 'cancelled'].includes(newStatus)) {
    return c.json({ success: false, message: 'Status tidak valid' }, 400);
  }

  const distribution = await c.env.DB.prepare('SELECT type, target_id, status FROM distributions WHERE id = ? AND business_id = ?').bind(id, businessId).first();
  if (!distribution) return c.json({ success: false, message: 'Distribusi tidak ditemukan' }, 404);

  const currentStatus = distribution.status;
  
  // Jika berubah menjadi in_transit/completed dari draft/approved, proses pindah stok
  if ((newStatus === 'in_transit' || newStatus === 'completed') && (currentStatus === 'draft' || currentStatus === 'approved')) {
    
    // Cari gudang utama
    const warehouse = await c.env.DB.prepare("SELECT id FROM stock_locations WHERE business_id = ? AND type = 'warehouse' LIMIT 1").bind(businessId).first();
    if (!warehouse) return c.json({ success: false, message: 'Lokasi gudang utama belum disetup.' }, 400);
    
    // Cari lokasi target (Sales atau Agent)
    const targetLoc = await c.env.DB.prepare("SELECT id FROM stock_locations WHERE business_id = ? AND type = ? AND reference_id = ? LIMIT 1").bind(businessId, distribution.type, distribution.target_id).first();
    if (!targetLoc) return c.json({ success: false, message: `Lokasi ${distribution.type} tidak ditemukan.` }, 400);

    const warehouseId = warehouse.id;
    const targetLocId = targetLoc.id;

    const { results: items } = await c.env.DB.prepare('SELECT * FROM distribution_items WHERE distribution_id = ?').bind(id).all();
    
    const statements = [];
    statements.push(
      c.env.DB.prepare('UPDATE distributions SET status = ?, updated_at = datetime("now") WHERE id = ?').bind(newStatus, id)
    );

    for (const item of items) {
      // Keluar dari Gudang
      const movementOutId = crypto.randomUUID();
      statements.push(
         c.env.DB.prepare(`
           INSERT INTO stock_movements 
           (id, business_id, product_id, variant_id, batch_id, from_location_id, quantity, movement_type, reference_type, reference_id, created_by)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         `).bind(movementOutId, businessId, item.product_id, item.variant_id, item.batch_id || null, warehouseId, item.quantity, 'transfer_out', 'distributions', id, user.userId)
      );
      statements.push(
        c.env.DB.prepare(`
          UPDATE stock_balances SET quantity = quantity - ?, updated_at = datetime('now')
          WHERE business_id = ? AND location_id = ? AND product_id = ? AND variant_id = ? AND (batch_id = ? OR (? IS NULL AND batch_id IS NULL))
        `).bind(item.quantity, businessId, warehouseId, item.product_id, item.variant_id, item.batch_id, item.batch_id)
      );

      // Masuk ke Sales/Agent
      const movementInId = crypto.randomUUID();
      statements.push(
         c.env.DB.prepare(`
           INSERT INTO stock_movements 
           (id, business_id, product_id, variant_id, batch_id, to_location_id, quantity, movement_type, reference_type, reference_id, created_by)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         `).bind(movementInId, businessId, item.product_id, item.variant_id, item.batch_id || null, targetLocId, item.quantity, 'transfer_in', 'distributions', id, user.userId)
      );
      
      // Update/Insert saldo di target (Upsert logic via INSERT ON CONFLICT is not straight forward in D1 without unique constraint on business_id, location_id, product_id, variant_id, batch_id).
      // Sebaiknya kita cek dulu apakah sudah ada saldonya. Karena kita menggunakan batching, kita pakai UPDATE, lalu kita asumsikan upsert. 
      // Tapi kita tidak bisa pakai query result di dalam batch.
      // D1 SQLite UPSERT:
      statements.push(
        c.env.DB.prepare(`
          INSERT INTO stock_balances (id, business_id, location_id, product_id, variant_id, batch_id, quantity)
          VALUES (lower(hex(randomblob(16))), ?, ?, ?, ?, ?, ?)
          ON CONFLICT(location_id, product_id, variant_id, batch_id) 
          DO UPDATE SET quantity = quantity + excluded.quantity, updated_at = datetime('now')
        `).bind(businessId, targetLocId, item.product_id, item.variant_id, item.batch_id || null, item.quantity)
      );
    }

    try {
      await c.env.DB.batch(statements);
      return c.json({ success: true, message: 'Distribusi diproses, stok berhasil dipindahkan' });
    } catch (error: any) {
      return c.json({ success: false, message: 'Gagal mendistribusikan stok', error: error.message }, 500);
    }
  } else {
    // Hanya update status
    await c.env.DB.prepare('UPDATE distributions SET status = ?, updated_at = datetime("now") WHERE id = ?').bind(newStatus, id).run();
    return c.json({ success: true, message: `Status distribusi diperbarui menjadi ${newStatus}` });
  }
});
