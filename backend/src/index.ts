import { Hono } from 'hono'
import { cors } from 'hono/cors'

type Bindings = {
  DB: D1Database
}

const app = new Hono<{ Bindings: Bindings }>()

// Refine membutuhkan CORS untuk mengakses API
app.use('*', cors({
  origin: '*', // Pada produksi sebaiknya disesuaikan dengan URL frontend
  exposeHeaders: ['x-total-count'], // Header ini dibutuhkan oleh dataProvider Refine untuk pagination
}))

app.get('/', (c) => c.text('Distribusi App API is running!'))

// ==========================================
// PRODUCTS API (Refine Simple REST Provider)
// ==========================================

app.get('/api/products', async (c) => {
  const tenant_id = 'tenant-1' 
  
  const countResult = await c.env.DB.prepare('SELECT COUNT(*) as count FROM products WHERE tenant_id = ?').bind(tenant_id).first()
  const totalCount = countResult ? (countResult.count as number) : 0
  
  // Mengambil produk master
  const { results: products } = await c.env.DB.prepare('SELECT * FROM products WHERE tenant_id = ? ORDER BY created_at DESC').bind(tenant_id).all()
  
  // Ambil semua varian untuk produk-produk ini
  const { results: variants } = await c.env.DB.prepare('SELECT * FROM product_variants WHERE product_id IN (SELECT id FROM products WHERE tenant_id = ?)').bind(tenant_id).all()
  
  // Gabungkan varian ke dalam produk
  const formattedProducts = products.map((p: any) => ({
    ...p,
    variants: variants.filter((v: any) => v.product_id === p.id)
  }))
  
  c.header('x-total-count', totalCount.toString())
  return c.json(formattedProducts)
})

app.get('/api/products/:id', async (c) => {
  const id = c.req.param('id')
  const product = await c.env.DB.prepare('SELECT * FROM products WHERE id = ?').bind(id).first()
  
  if (!product) return c.json({ message: 'Not found' }, 404)
  
  // Ambil varian produk ini
  const { results: variants } = await c.env.DB.prepare('SELECT * FROM product_variants WHERE product_id = ?').bind(id).all()
  
  return c.json({ ...product, variants })
})

app.post('/api/products', async (c) => {
  const body = await c.req.json()
  const id = crypto.randomUUID()
  const tenant_id = 'tenant-1'
  
  // Insert Produk Induk
  await c.env.DB.prepare(
    'INSERT INTO products (id, tenant_id, name, category, brand, base_production_price, base_sales_price, base_agent_price) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
  ).bind(id, tenant_id, body.name, body.category || null, body.brand || null, body.base_production_price, body.base_sales_price, body.base_agent_price).run()
  
  // Insert Varian (jika ada)
  if (body.variants && Array.isArray(body.variants)) {
    for (const v of body.variants) {
      const v_id = crypto.randomUUID()
      await c.env.DB.prepare(
        'INSERT INTO product_variants (id, product_id, sku, name, override_production_price, override_sales_price, override_agent_price) VALUES (?, ?, ?, ?, ?, ?, ?)'
      ).bind(v_id, id, v.sku || null, v.name, v.override_production_price || null, v.override_sales_price || null, v.override_agent_price || null).run()
    }
  }
  
  const product = await c.env.DB.prepare('SELECT * FROM products WHERE id = ?').bind(id).first()
  return c.json(product, 201)
})

app.put('/api/products/:id', async (c) => {
  const id = c.req.param('id')
  const body = await c.req.json()
  
  await c.env.DB.prepare(
    'UPDATE products SET name = ?, category = ?, brand = ?, base_production_price = ?, base_sales_price = ?, base_agent_price = ?, is_active = ? WHERE id = ?'
  ).bind(body.name, body.category || null, body.brand || null, body.base_production_price, body.base_sales_price, body.base_agent_price, body.is_active ?? 1, id).run()
  
  const product = await c.env.DB.prepare('SELECT * FROM products WHERE id = ?').bind(id).first()
  return c.json(product)
})

app.delete('/api/products/:id', async (c) => {
  const id = c.req.param('id')
  // Hapus varian terlebih dahulu (foreign key)
  await c.env.DB.prepare('DELETE FROM product_variants WHERE product_id = ?').bind(id).run()
  await c.env.DB.prepare('DELETE FROM products WHERE id = ?').bind(id).run()
  return c.json({ success: true })
})

// ==========================================
// INBOUND BATCHES API
// ==========================================
app.get('/api/inbound_batches', async (c) => {
  const tenant_id = 'tenant-1'
  const countResult = await c.env.DB.prepare('SELECT COUNT(*) as count FROM inbound_batches WHERE tenant_id = ?').bind(tenant_id).first()
  const totalCount = countResult ? (countResult.count as number) : 0
  
  const { results } = await c.env.DB.prepare(`
    SELECT ib.*, p.name as product_name 
    FROM inbound_batches ib 
    LEFT JOIN products p ON ib.product_id = p.id 
    WHERE ib.tenant_id = ? 
    ORDER BY ib.created_at DESC
  `).bind(tenant_id).all()
  
  c.header('x-total-count', totalCount.toString())
  return c.json(results)
})

app.post('/api/inbound_batches', async (c) => {
  const body = await c.req.json()
  const id = crypto.randomUUID()
  const tenant_id = 'tenant-1'
  
  await c.env.DB.prepare(
    'INSERT INTO inbound_batches (id, tenant_id, product_id, source_type, quantity, production_date, expired_date) VALUES (?, ?, ?, ?, ?, ?, ?)'
  ).bind(id, tenant_id, body.product_id, body.source_type, body.quantity, body.production_date, body.expired_date).run()
  
  const batch = await c.env.DB.prepare('SELECT * FROM inbound_batches WHERE id = ?').bind(id).first()
  return c.json(batch, 201)
})

// ==========================================
// USERS API
// ==========================================
app.get('/api/users', async (c) => {
  const tenant_id = 'tenant-1'
  const countResult = await c.env.DB.prepare('SELECT COUNT(*) as count FROM users WHERE tenant_id = ?').bind(tenant_id).first()
  const totalCount = countResult ? (countResult.count as number) : 0
  
  const { results } = await c.env.DB.prepare('SELECT id, username, role, created_at FROM users WHERE tenant_id = ? ORDER BY created_at DESC').bind(tenant_id).all()
  
  c.header('x-total-count', totalCount.toString())
  return c.json(results)
})

export default app
