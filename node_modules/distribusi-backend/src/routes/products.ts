import { Hono } from 'hono';
import type { Env } from '../types';
import { authMiddleware } from '../middleware/auth';
import { tenantMiddleware } from '../middleware/tenant';
import { validateRequired, parsePagination, generateNumber } from '../middleware/validation';

export const productRoutes = new Hono<{ Bindings: Env }>();
productRoutes.use('/*', authMiddleware, tenantMiddleware);

productRoutes.get('/', async (c) => {
  const businessId = c.get('businessId');
  const { limit, offset, search } = parsePagination(c);
  
  let query = `
    SELECT p.*, c.name as category_name 
    FROM products p
    LEFT JOIN product_categories c ON c.id = p.category_id
    WHERE p.business_id = ?
  `;
  const params: any[] = [businessId];
  
  if (search) {
    query += ' AND (p.name LIKE ? OR p.sku LIKE ?)';
    params.push(`%${search}%`, `%${search}%`);
  }
  
  query += ' ORDER BY p.created_at DESC LIMIT ? OFFSET ?';
  params.push(limit, offset);

  const { results } = await c.env.DB.prepare(query).bind(...params).all();
  
  let countQuery = 'SELECT COUNT(*) as total FROM products WHERE business_id = ?';
  const countParams: any[] = [businessId];
  if (search) {
    countQuery += ' AND (name LIKE ? OR sku LIKE ?)';
    countParams.push(`%${search}%`, `%${search}%`);
  }
  const totalRes = await c.env.DB.prepare(countQuery).bind(...countParams).first();
  
  return c.json({ success: true, data: results, meta: { total: totalRes?.total || 0 } });
});

productRoutes.post('/', async (c) => {
  const businessId = c.get('businessId');
  const body = await c.req.json();
  
  const err = validateRequired(body, ['name']);
  if (err) return c.json({ success: false, message: err }, 400);

  const id = crypto.randomUUID();
  const sku = body.sku || generateNumber('PRD');
  
  await c.env.DB.prepare(
    'INSERT INTO products (id, business_id, category_id, name, sku, description, product_type, image_url, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
  ).bind(id, businessId, body.category_id || null, body.name, sku, body.description || null, body.product_type || 'self', body.image_url || null, body.status || 'active').run();

  return c.json({ success: true, data: { id, ...body, sku } }, 201);
});

productRoutes.get('/:id', async (c) => {
  const businessId = c.get('businessId');
  const id = c.req.param('id');
  const result = await c.env.DB.prepare('SELECT * FROM products WHERE id = ? AND business_id = ?').bind(id, businessId).first();
  if (!result) return c.json({ success: false, message: 'Produk tidak ditemukan' }, 404);
  
  // Get variants
  const { results: variants } = await c.env.DB.prepare('SELECT * FROM product_variants WHERE product_id = ? AND business_id = ?').bind(id, businessId).all();
  
  return c.json({ success: true, data: { ...result, variants } });
});

productRoutes.put('/:id', async (c) => {
  const businessId = c.get('businessId');
  const id = c.req.param('id');
  const body = await c.req.json();
  
  await c.env.DB.prepare(
    'UPDATE products SET category_id = ?, name = ?, sku = ?, description = ?, product_type = ?, image_url = ?, status = ?, updated_at = datetime("now") WHERE id = ? AND business_id = ?'
  ).bind(body.category_id || null, body.name, body.sku, body.description || null, body.product_type || 'self', body.image_url || null, body.status || 'active', id, businessId).run();

  return c.json({ success: true, message: 'Produk diperbarui' });
});

productRoutes.delete('/:id', async (c) => {
  const businessId = c.get('businessId');
  const id = c.req.param('id');
  
  // Checking dependencies (stock movements or variants)
  const variants = await c.env.DB.prepare('SELECT id FROM product_variants WHERE product_id = ? AND business_id = ?').bind(id, businessId).first();
  if (variants) return c.json({ success: false, message: 'Gagal dihapus: Hapus varian terlebih dahulu' }, 400);

  await c.env.DB.prepare('DELETE FROM products WHERE id = ? AND business_id = ?').bind(id, businessId).run();
  return c.json({ success: true, message: 'Produk dihapus' });
});

// Varian Produk (Sub-resource)
productRoutes.get('/:id/variants', async (c) => {
  const businessId = c.get('businessId');
  const productId = c.req.param('id');
  
  const { results } = await c.env.DB.prepare(`
    SELECT v.*, u.name as unit_name, u.symbol as unit_symbol 
    FROM product_variants v
    LEFT JOIN units u ON u.id = v.unit_id
    WHERE v.product_id = ? AND v.business_id = ?
  `).bind(productId, businessId).all();
  
  return c.json({ success: true, data: results });
});

productRoutes.post('/:id/variants', async (c) => {
  const businessId = c.get('businessId');
  const productId = c.req.param('id');
  const body = await c.req.json();
  
  const err = validateRequired(body, ['name']);
  if (err) return c.json({ success: false, message: err }, 400);

  const id = crypto.randomUUID();
  const sku = body.sku || generateNumber('VAR');
  
  await c.env.DB.prepare(`
    INSERT INTO product_variants 
    (id, business_id, product_id, name, sku, barcode, unit_id, price_production, price_sales, price_agent, weight, status) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(id, businessId, productId, body.name, sku, body.barcode || null, body.unit_id || null, 
          body.price_production || 0, body.price_sales || 0, body.price_agent || 0, body.weight || 0, body.status || 'active').run();

  return c.json({ success: true, data: { id, ...body, sku } }, 201);
});

productRoutes.put('/:id/variants/:variantId', async (c) => {
  const businessId = c.get('businessId');
  const productId = c.req.param('id');
  const variantId = c.req.param('variantId');
  const body = await c.req.json();
  
  await c.env.DB.prepare(`
    UPDATE product_variants 
    SET name = ?, sku = ?, barcode = ?, unit_id = ?, price_production = ?, price_sales = ?, price_agent = ?, weight = ?, status = ?, updated_at = datetime("now")
    WHERE id = ? AND product_id = ? AND business_id = ?
  `).bind(body.name, body.sku, body.barcode || null, body.unit_id || null, body.price_production || 0, body.price_sales || 0, body.price_agent || 0, body.weight || 0, body.status || 'active', variantId, productId, businessId).run();

  return c.json({ success: true, message: 'Varian diperbarui' });
});

productRoutes.delete('/:id/variants/:variantId', async (c) => {
  const businessId = c.get('businessId');
  const productId = c.req.param('id');
  const variantId = c.req.param('variantId');
  
  await c.env.DB.prepare('DELETE FROM product_variants WHERE id = ? AND product_id = ? AND business_id = ?').bind(variantId, productId, businessId).run();
  
  return c.json({ success: true, message: 'Varian dihapus' });
});
