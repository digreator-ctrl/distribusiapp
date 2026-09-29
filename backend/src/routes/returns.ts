import { Hono } from 'hono';
import type { Env } from '../types';
import { authMiddleware } from '../middleware/auth';
import { tenantMiddleware } from '../middleware/tenant';
import { parsePagination, generateNumber, validateRequired } from '../middleware/validation';

export const returnRoutes = new Hono<{ Bindings: Env }>();
returnRoutes.use('/*', authMiddleware, tenantMiddleware);

returnRoutes.get('/', async (c) => {
  const businessId = c.get('businessId');
  const { limit, offset, search } = parsePagination(c);
  
  let query = `
    SELECT r.*, u.name as created_by_name 
    FROM returns r
    LEFT JOIN users u ON u.id = r.created_by
    WHERE r.business_id = ?
  `;
  const params: any[] = [businessId];
  
  if (search) {
    query += ' AND r.return_number LIKE ?';
    params.push(`%${search}%`);
  }
  
  query += ' ORDER BY r.created_at DESC LIMIT ? OFFSET ?';
  params.push(limit, offset);

  const { results } = await c.env.DB.prepare(query).bind(...params).all();
  
  let countQuery = 'SELECT COUNT(*) as total FROM returns WHERE business_id = ?';
  const countParams: any[] = [businessId];
  if (search) {
    countQuery += ' AND return_number LIKE ?';
    countParams.push(`%${search}%`);
  }
  const totalRes = await c.env.DB.prepare(countQuery).bind(...countParams).first();
  
  return c.json({ success: true, data: results, meta: { total: totalRes?.total || 0 } });
});

returnRoutes.post('/', async (c) => {
  const businessId = c.get('businessId');
  const user = c.get('user');
  const body = await c.req.json();
  
  const err = validateRequired(body, ['source_type', 'return_type', 'return_date', 'items']);
  if (err) return c.json({ success: false, message: err }, 400);

  const items = body.items as any[];
  if (!items || items.length === 0) return c.json({ success: false, message: 'Item retur tidak boleh kosong' }, 400);

  const id = crypto.randomUUID();
  const returnNumber = generateNumber('RTR');
  
  // 7.7 Logic Routing Retur
  // cacat produksi -> supplier/production, selain itu -> warehouse
  let destinationType = 'warehouse';
  if (body.return_type === 'production_defect') {
    destinationType = 'supplier'; // default to supplier if production defect, could be 'production'
  }

  const statements = [];
  
  statements.push(
    c.env.DB.prepare(`
      INSERT INTO returns (id, business_id, return_number, source_type, source_id, return_type, destination_type, destination_id, return_date, status, notes, created_by) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      id, businessId, returnNumber, body.source_type, body.source_id || null, 
      body.return_type, destinationType, body.destination_id || null, 
      body.return_date, 'pending', body.notes || null, user.userId
    )
  );

  for (const item of items) {
    statements.push(
      c.env.DB.prepare(`
        INSERT INTO return_items (id, return_id, product_id, variant_id, batch_id, quantity, condition, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        crypto.randomUUID(), id, item.product_id, item.variant_id, item.batch_id || null, 
        item.quantity, item.condition || 'damaged', item.notes || null
      )
    );
  }

  try {
    await c.env.DB.batch(statements);
    return c.json({ success: true, message: 'Dokumen retur dibuat', data: { id, return_number: returnNumber } }, 201);
  } catch (error: any) {
    return c.json({ success: false, message: 'Gagal membuat retur', error: error.message }, 500);
  }
});

returnRoutes.get('/:id', async (c) => {
  const businessId = c.get('businessId');
  const id = c.req.param('id');
  
  const result = await c.env.DB.prepare(`
    SELECT r.*, u.name as created_by_name 
    FROM returns r
    LEFT JOIN users u ON u.id = r.created_by
    WHERE r.id = ? AND r.business_id = ?
  `).bind(id, businessId).first();
  
  if (!result) return c.json({ success: false, message: 'Retur tidak ditemukan' }, 404);
  
  const { results: items } = await c.env.DB.prepare(`
    SELECT ri.*, p.name as product_name, v.name as variant_name, b.batch_number
    FROM return_items ri
    JOIN products p ON p.id = ri.product_id
    JOIN product_variants v ON v.id = ri.variant_id
    LEFT JOIN product_batches b ON b.id = ri.batch_id
    WHERE ri.return_id = ?
  `).bind(id).all();
  
  return c.json({ success: true, data: { ...result, items } });
});

returnRoutes.put('/:id/status', async (c) => {
  const businessId = c.get('businessId');
  const user = c.get('user');
  const id = c.req.param('id');
  const body = await c.req.json();
  
  const newStatus = body.status;
  if (!['verified', 'approved', 'in_process', 'completed', 'rejected'].includes(newStatus)) {
    return c.json({ success: false, message: 'Status tidak valid' }, 400);
  }

  const ret = await c.env.DB.prepare('SELECT status, source_type, source_id, destination_type FROM returns WHERE id = ? AND business_id = ?').bind(id, businessId).first();
  if (!ret) return c.json({ success: false, message: 'Retur tidak ditemukan' }, 404);

  const statements = [];
  
  // Jika diverifikasi, simpan verified_by
  let query = 'UPDATE returns SET status = ?, updated_at = datetime("now")';
  const params: any[] = [newStatus];
  
  if (newStatus === 'verified' || newStatus === 'approved') {
    query += ', verified_by = ?';
    params.push(user.userId);
  }
  
  query += ' WHERE id = ?';
  params.push(id);
  
  statements.push(c.env.DB.prepare(query).bind(...params));

  // Jika status berubah ke completed, trigger mutasi stok (tarik dari sumber, masuk ke tujuan)
  if (newStatus === 'completed' && ret.status !== 'completed') {
    // 1. Tentukan sumber lokasi
    let sourceLocId = null;
    if (ret.source_type === 'store' || ret.source_type === 'sales') {
      const loc = await c.env.DB.prepare("SELECT id FROM stock_locations WHERE type = ? AND reference_id = ? AND business_id = ? LIMIT 1").bind(ret.source_type, ret.source_id, businessId).first();
      sourceLocId = loc?.id;
    } else if (ret.source_type === 'agent') {
      const loc = await c.env.DB.prepare("SELECT id FROM stock_locations WHERE type = 'agent' AND reference_id = ? AND business_id = ? LIMIT 1").bind(ret.source_id, businessId).first();
      sourceLocId = loc?.id;
    } else {
      // jika warehouse, default ke main warehouse
      const loc = await c.env.DB.prepare("SELECT id FROM stock_locations WHERE type = 'warehouse' AND business_id = ? LIMIT 1").bind(businessId).first();
      sourceLocId = loc?.id;
    }

    // 2. Tentukan tujuan lokasi (warehouse retur)
    let destLocId = null;
    if (ret.destination_type === 'warehouse') {
      // Asumsikan ada gudang retur atau gudang utama
      let loc = await c.env.DB.prepare("SELECT id FROM stock_locations WHERE type = 'return' AND business_id = ? LIMIT 1").bind(businessId).first();
      if (!loc) {
        loc = await c.env.DB.prepare("SELECT id FROM stock_locations WHERE type = 'warehouse' AND business_id = ? LIMIT 1").bind(businessId).first();
      }
      destLocId = loc?.id;
    }
    
    // Jika retur kembali ke supplier (cacat), stok akan keluar total. Kita catat movement-nya saja (atau kurangi jika dari gudang).
    
    const { results: items } = await c.env.DB.prepare('SELECT * FROM return_items WHERE return_id = ?').bind(id).all();

    for (const item of items) {
      if (sourceLocId) {
        // Kurangi dari sumber
        statements.push(
          c.env.DB.prepare(`
            UPDATE stock_balances SET quantity = quantity - ?, updated_at = datetime('now')
            WHERE location_id = ? AND product_id = ? AND variant_id = ? AND (batch_id = ? OR (? IS NULL AND batch_id IS NULL))
          `).bind(item.quantity, sourceLocId, item.product_id, item.variant_id, item.batch_id, item.batch_id)
        );
        statements.push(
           c.env.DB.prepare(`
             INSERT INTO stock_movements (id, business_id, product_id, variant_id, batch_id, from_location_id, quantity, movement_type, reference_type, reference_id, created_by)
             VALUES (lower(hex(randomblob(16))), ?, ?, ?, ?, ?, ?, 'return', 'returns', ?, ?)
           `).bind(businessId, item.product_id, item.variant_id, item.batch_id || null, sourceLocId, item.quantity, id, user.userId)
        );
      }

      if (destLocId) {
        // Masuk ke tujuan (misal Gudang Retur)
        statements.push(
          c.env.DB.prepare(`
            INSERT INTO stock_balances (id, business_id, location_id, product_id, variant_id, batch_id, quantity)
            VALUES (lower(hex(randomblob(16))), ?, ?, ?, ?, ?, ?)
            ON CONFLICT(location_id, product_id, variant_id, batch_id) 
            DO UPDATE SET quantity = quantity + excluded.quantity, updated_at = datetime('now')
          `).bind(businessId, destLocId, item.product_id, item.variant_id, item.batch_id || null, item.quantity)
        );
      }

      // 7.9 Penggantian Produk
      if (item.replacement_quantity > 0 && sourceLocId) {
        // Asumsikan stok pengganti diambil dari main warehouse
        const mainWh = await c.env.DB.prepare("SELECT id FROM stock_locations WHERE type = 'warehouse' AND business_id = ? LIMIT 1").bind(businessId).first();
        if (mainWh) {
          // Kurangi dari gudang utama
          statements.push(
            c.env.DB.prepare(`
              UPDATE stock_balances SET quantity = quantity - ?, updated_at = datetime('now')
              WHERE location_id = ? AND product_id = ? AND variant_id = ? AND (batch_id = ? OR (? IS NULL AND batch_id IS NULL))
            `).bind(item.replacement_quantity, mainWh.id, item.product_id, item.variant_id, item.batch_id, item.batch_id)
          );
          // Tambah ke sumber (Agen/Toko)
          statements.push(
            c.env.DB.prepare(`
              INSERT INTO stock_balances (id, business_id, location_id, product_id, variant_id, batch_id, quantity)
              VALUES (lower(hex(randomblob(16))), ?, ?, ?, ?, ?, ?)
              ON CONFLICT(location_id, product_id, variant_id, batch_id) 
              DO UPDATE SET quantity = quantity + excluded.quantity, updated_at = datetime('now')
            `).bind(businessId, sourceLocId, item.product_id, item.variant_id, item.batch_id || null, item.replacement_quantity)
          );
          // Catat movement
          statements.push(
             c.env.DB.prepare(`
               INSERT INTO stock_movements (id, business_id, product_id, variant_id, batch_id, from_location_id, to_location_id, quantity, movement_type, reference_type, reference_id, created_by)
               VALUES (lower(hex(randomblob(16))), ?, ?, ?, ?, ?, ?, ?, 'replacement', 'returns', ?, ?)
             `).bind(businessId, item.product_id, item.variant_id, item.batch_id || null, mainWh.id, sourceLocId, item.replacement_quantity, id, user.userId)
          );
        }
      }
    }
  }

  try {
    await c.env.DB.batch(statements);
    return c.json({ success: true, message: `Status retur diperbarui menjadi ${newStatus}` });
  } catch (error: any) {
    return c.json({ success: false, message: 'Gagal memperbarui status', error: error.message }, 500);
  }
});
