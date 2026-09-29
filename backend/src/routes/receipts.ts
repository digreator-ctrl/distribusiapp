import { Hono } from 'hono';
import type { Env } from '../types';
import { authMiddleware } from '../middleware/auth';
import { tenantMiddleware } from '../middleware/tenant';
import { parsePagination, generateNumber, validateRequired } from '../middleware/validation';

export const receiptRoutes = new Hono<{ Bindings: Env }>();
receiptRoutes.use('/*', authMiddleware, tenantMiddleware);

receiptRoutes.get('/', async (c) => {
  const businessId = c.get('businessId');
  const { limit, offset } = parsePagination(c);
  
  const { results } = await c.env.DB.prepare(`
    SELECT sr.*, s.name as supplier_name, u.name as created_by_name 
    FROM supplier_receipts sr
    JOIN suppliers s ON s.id = sr.supplier_id
    JOIN users u ON u.id = sr.created_by
    WHERE sr.business_id = ?
    ORDER BY sr.created_at DESC LIMIT ? OFFSET ?
  `).bind(businessId, limit, offset).all();
  
  const totalRes = await c.env.DB.prepare('SELECT COUNT(*) as total FROM supplier_receipts WHERE business_id = ?').bind(businessId).first();

  return c.json({ success: true, data: results, meta: { total: totalRes?.total || 0 } });
});

receiptRoutes.post('/', async (c) => {
  const businessId = c.get('businessId');
  const user = c.get('user');
  const body = await c.req.json();
  
  const err = validateRequired(body, ['supplier_id', 'receipt_date', 'items']);
  if (err) return c.json({ success: false, message: err }, 400);

  const items = body.items as any[];
  if (!items || items.length === 0) return c.json({ success: false, message: 'Item penerimaan tidak boleh kosong' }, 400);

  const receiptId = crypto.randomUUID();
  const receiptNumber = generateNumber('RCV');
  
  // Cari gudang utama
  const location = await c.env.DB.prepare("SELECT id FROM stock_locations WHERE business_id = ? AND type = 'warehouse' LIMIT 1").bind(businessId).first();
  if (!location) return c.json({ success: false, message: 'Lokasi gudang utama belum disetup. Silahkan setup di master data lokasi.' }, 400);
  const locationId = location.id;

  const statements = [];
  
  // 1. Insert Receipt
  statements.push(
    c.env.DB.prepare(`
      INSERT INTO supplier_receipts (id, business_id, supplier_id, receipt_number, receipt_date, status, notes, created_by) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(receiptId, businessId, body.supplier_id, receiptNumber, body.receipt_date, 'completed', body.notes || null, user.userId)
  );

  for (const item of items) {
    const itemId = crypto.randomUUID();
    const batchId = crypto.randomUUID();
    const batchNumber = item.batch_number || generateNumber('BCH-S');
    
    // 2. Create Batch for Supplier items
    statements.push(
       c.env.DB.prepare(`
         INSERT INTO product_batches 
         (id, business_id, product_id, variant_id, batch_number, source_type, supplier_id, production_date, expired_date, quantity_initial, quantity_available, production_cost) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       `).bind(
         batchId, businessId, item.product_id, item.variant_id, batchNumber, 'supplier', body.supplier_id,
         body.receipt_date, item.expired_date || '2099-12-31', item.quantity, item.quantity, item.cost || 0
       )
    );
    
    // 3. Create Receipt Item
    statements.push(
      c.env.DB.prepare(`
        INSERT INTO supplier_receipt_items (id, receipt_id, product_id, variant_id, batch_id, quantity, cost)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).bind(itemId, receiptId, item.product_id, item.variant_id, batchId, item.quantity, item.cost || 0)
    );
    
    // 4. Create Stock Movement (Supplier Receipt)
    const movementId = crypto.randomUUID();
    statements.push(
       c.env.DB.prepare(`
         INSERT INTO stock_movements 
         (id, business_id, product_id, variant_id, batch_id, to_location_id, quantity, movement_type, reference_type, reference_id, created_by)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       `).bind(movementId, businessId, item.product_id, item.variant_id, batchId, locationId, item.quantity, 'supplier_receipt', 'supplier_receipts', receiptId, user.userId)
    );
    
    // 5. Update/Insert Stock Balance
    statements.push(
      c.env.DB.prepare(`
        INSERT INTO stock_balances (id, business_id, location_id, product_id, variant_id, batch_id, quantity)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(location_id, product_id, variant_id, batch_id) DO UPDATE SET quantity = quantity + excluded.quantity, updated_at = datetime('now')
      `).bind(crypto.randomUUID(), businessId, locationId, item.product_id, item.variant_id, batchId, item.quantity)
    );
  }

  try {
    await c.env.DB.batch(statements);
    return c.json({ success: true, message: 'Penerimaan berhasil dicatat', data: { id: receiptId } }, 201);
  } catch (error: any) {
    return c.json({ success: false, message: 'Gagal mencatat penerimaan', error: error.message }, 500);
  }
});
