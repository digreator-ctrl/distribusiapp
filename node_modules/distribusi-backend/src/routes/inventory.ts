import { Hono } from 'hono';
import type { Env } from '../types';
import { authMiddleware } from '../middleware/auth';
import { tenantMiddleware } from '../middleware/tenant';
import { parsePagination } from '../middleware/validation';

export const inventoryRoutes = new Hono<{ Bindings: Env }>();
inventoryRoutes.use('/*', authMiddleware, tenantMiddleware);

// 4.6 API: Stock by location
inventoryRoutes.get('/balances', async (c) => {
  const businessId = c.get('businessId');
  const { limit, offset, search } = parsePagination(c);
  const locationId = c.req.query('location_id');
  
  let query = `
    SELECT sb.*, p.name as product_name, p.sku as product_sku, v.name as variant_name, b.batch_number, l.name as location_name 
    FROM stock_balances sb
    JOIN products p ON p.id = sb.product_id
    JOIN product_variants v ON v.id = sb.variant_id
    JOIN stock_locations l ON l.id = sb.location_id
    LEFT JOIN product_batches b ON b.id = sb.batch_id
    WHERE sb.business_id = ? AND sb.quantity > 0
  `;
  const params: any[] = [businessId];
  
  if (locationId) {
    query += ' AND sb.location_id = ?';
    params.push(locationId);
  }
  
  if (search) {
    query += ' AND (p.name LIKE ? OR p.sku LIKE ?)';
    params.push(`%${search}%`, `%${search}%`);
  }
  
  query += ' ORDER BY p.name ASC LIMIT ? OFFSET ?';
  params.push(limit, offset);

  const { results } = await c.env.DB.prepare(query).bind(...params).all();
  
  // Total count
  let countQuery = `
    SELECT COUNT(*) as total 
    FROM stock_balances sb
    JOIN products p ON p.id = sb.product_id
    WHERE sb.business_id = ? AND sb.quantity > 0
  `;
  const countParams: any[] = [businessId];
  if (locationId) { countQuery += ' AND sb.location_id = ?'; countParams.push(locationId); }
  if (search) { countQuery += ' AND (p.name LIKE ? OR p.sku LIKE ?)'; countParams.push(`%${search}%`, `%${search}%`); }
  
  const totalRes = await c.env.DB.prepare(countQuery).bind(...countParams).first();

  return c.json({ success: true, data: results, meta: { total: totalRes?.total || 0 } });
});

// 4.7 API: Stock Movements (Mutation History)
inventoryRoutes.get('/movements', async (c) => {
  const businessId = c.get('businessId');
  const { limit, offset } = parsePagination(c);
  
  const { results } = await c.env.DB.prepare(`
    SELECT sm.*, p.name as product_name, v.name as variant_name, 
           lf.name as from_location, lt.name as to_location, u.name as actor_name
    FROM stock_movements sm
    JOIN products p ON p.id = sm.product_id
    JOIN product_variants v ON v.id = sm.variant_id
    LEFT JOIN stock_locations lf ON lf.id = sm.from_location_id
    LEFT JOIN stock_locations lt ON lt.id = sm.to_location_id
    LEFT JOIN users u ON u.id = sm.created_by
    WHERE sm.business_id = ?
    ORDER BY sm.created_at DESC LIMIT ? OFFSET ?
  `).bind(businessId, limit, offset).all();
  
  const totalRes = await c.env.DB.prepare('SELECT COUNT(*) as total FROM stock_movements WHERE business_id = ?').bind(businessId).first();
  
  return c.json({ success: true, data: results, meta: { total: totalRes?.total || 0 } });
});
