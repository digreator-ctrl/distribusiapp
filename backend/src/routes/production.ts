import { Hono } from 'hono';
import type { Env } from '../types';
import { authMiddleware } from '../middleware/auth';
import { tenantMiddleware } from '../middleware/tenant';
import { parsePagination, generateNumber, validateRequired } from '../middleware/validation';

export const productionRoutes = new Hono<{ Bindings: Env }>();
productionRoutes.use('/*', authMiddleware, tenantMiddleware);

productionRoutes.get('/', async (c) => {
  const businessId = c.get('businessId');
  const { limit, offset } = parsePagination(c);
  
  const { results } = await c.env.DB.prepare(`
    SELECT po.*, u.name as created_by_name 
    FROM production_orders po
    JOIN users u ON u.id = po.created_by
    WHERE po.business_id = ?
    ORDER BY po.created_at DESC LIMIT ? OFFSET ?
  `).bind(businessId, limit, offset).all();
  
  const totalRes = await c.env.DB.prepare('SELECT COUNT(*) as total FROM production_orders WHERE business_id = ?').bind(businessId).first();

  return c.json({ success: true, data: results, meta: { total: totalRes?.total || 0 } });
});

productionRoutes.post('/', async (c) => {
  const businessId = c.get('businessId');
  const user = c.get('user');
  const body = await c.req.json();
  
  const err = validateRequired(body, ['production_date', 'items']);
  if (err) return c.json({ success: false, message: err }, 400);

  const items = body.items as any[];
  if (!items || items.length === 0) return c.json({ success: false, message: 'Item produksi tidak boleh kosong' }, 400);

  const orderId = crypto.randomUUID();
  const productionNumber = generateNumber('PRD-ORD');
  
  // Cari gudang utama
  const location = await c.env.DB.prepare("SELECT id FROM stock_locations WHERE business_id = ? AND type = 'warehouse' LIMIT 1").bind(businessId).first();
  if (!location) return c.json({ success: false, message: 'Lokasi gudang utama belum disetup. Silahkan setup di master data lokasi.' }, 400);
  const locationId = location.id;

  const statements = [];
  
  // 1. Insert Production Order
  statements.push(
    c.env.DB.prepare(`
      INSERT INTO production_orders (id, business_id, production_number, production_date, status, notes, created_by) 
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(orderId, businessId, productionNumber, body.production_date, 'completed', body.notes || null, user.userId)
  );

  for (const item of items) {
    const itemId = crypto.randomUUID();
    const batchId = crypto.randomUUID();
    const batchNumber = item.batch_number || generateNumber('BCH');
    
    // 2. Create Batch
    statements.push(
       c.env.DB.prepare(`
         INSERT INTO product_batches 
         (id, business_id, product_id, variant_id, batch_number, source_type, production_date, expired_date, quantity_initial, quantity_available, production_cost) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       `).bind(
         batchId, businessId, item.product_id, item.variant_id, batchNumber, 'self_production',
         body.production_date, item.expired_date || '2099-12-31', item.quantity, item.quantity, item.production_cost || 0
       )
    );
    
    // 3. Create Order Item
    statements.push(
      c.env.DB.prepare(`
        INSERT INTO production_order_items (id, production_order_id, product_id, variant_id, batch_id, quantity, production_cost)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).bind(itemId, orderId, item.product_id, item.variant_id, batchId, item.quantity, item.production_cost || 0)
    );
    
    // 4. Create Stock Movement (Production In)
    const movementId = crypto.randomUUID();
    statements.push(
       c.env.DB.prepare(`
         INSERT INTO stock_movements 
         (id, business_id, product_id, variant_id, batch_id, to_location_id, quantity, movement_type, reference_type, reference_id, created_by)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       `).bind(movementId, businessId, item.product_id, item.variant_id, batchId, locationId, item.quantity, 'production_in', 'production_orders', orderId, user.userId)
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
    return c.json({ success: true, message: 'Produksi berhasil dicatat', data: { id: orderId } }, 201);
  } catch (error: any) {
    return c.json({ success: false, message: 'Gagal mencatat produksi', error: error.message }, 500);
  }
});
