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
  const { results: products } = await c.env.DB.prepare(`
    SELECT p.*, s.name as supplier_name 
    FROM products p 
    LEFT JOIN suppliers s ON p.supplier_id = s.id 
    WHERE p.tenant_id = ? 
    ORDER BY p.created_at DESC
  `).bind(tenant_id).all()
  
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
  const product = await c.env.DB.prepare(`
    SELECT p.*, s.name as supplier_name, s.contact_person as supplier_contact, s.phone as supplier_phone 
    FROM products p 
    LEFT JOIN suppliers s ON p.supplier_id = s.id 
    WHERE p.id = ?
  `).bind(id).first()
  
  if (!product) return c.json({ message: 'Not found' }, 404)
  
  // Ambil varian produk ini
  const { results: variants } = await c.env.DB.prepare('SELECT * FROM product_variants WHERE product_id = ?').bind(id).all()
  
  // Ambil transaksi (konsinyasi) terkait produk ini
  const { results: transactions } = await c.env.DB.prepare(`
    SELECT c.*, pv.name as variant_name, st.name as store_name, u.username as sales_name
    FROM consignments c
    JOIN product_variants pv ON c.variant_id = pv.id
    LEFT JOIN stores st ON c.store_id = st.id
    LEFT JOIN users u ON c.sales_id = u.id
    WHERE pv.product_id = ?
    ORDER BY c.created_at DESC
  `).bind(id).all()
  
  return c.json({ ...product, variants, transactions })
})

app.post('/api/products', async (c) => {
  const body = await c.req.json()
  const id = crypto.randomUUID()
  const tenant_id = 'tenant-1'
  
  // Insert Produk Induk
  await c.env.DB.prepare(
    'INSERT INTO products (id, tenant_id, name, category, brand, base_production_price, base_sales_price, base_agent_price, supplier_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
  ).bind(id, tenant_id, body.name, body.category || null, body.brand || null, body.base_production_price, body.base_sales_price, body.base_agent_price, body.supplier_id || null).run()
  
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
    'UPDATE products SET name = ?, category = ?, brand = ?, base_production_price = ?, base_sales_price = ?, base_agent_price = ?, is_active = ?, supplier_id = ? WHERE id = ?'
  ).bind(body.name, body.category || null, body.brand || null, body.base_production_price, body.base_sales_price, body.base_agent_price, body.is_active ?? 1, body.supplier_id || null, id).run()
  
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
  
  try {
    await c.env.DB.prepare(
      'INSERT INTO inbound_batches (id, tenant_id, product_id, source_type, quantity, production_date, expired_date) VALUES (?, ?, ?, ?, ?, ?, ?)'
    ).bind(id, tenant_id, body.product_id, body.source_type, body.quantity, body.production_date, body.expired_date).run()
    
    const batch = await c.env.DB.prepare('SELECT * FROM inbound_batches WHERE id = ?').bind(id).first()
    return c.json(batch, 201)
  } catch (error: any) {
    console.error(error);
    return c.json({ message: "DB Error", error: error.message }, 500)
  }
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

// ==========================================
// SUPPLIERS API
// ==========================================
app.get('/api/suppliers', async (c) => {
  const tenant_id = 'tenant-1'
  const countResult = await c.env.DB.prepare('SELECT COUNT(*) as count FROM suppliers WHERE tenant_id = ?').bind(tenant_id).first()
  const totalCount = countResult ? (countResult.count as number) : 0
  
  const { results } = await c.env.DB.prepare('SELECT * FROM suppliers WHERE tenant_id = ? ORDER BY created_at DESC').bind(tenant_id).all()
  
  c.header('x-total-count', totalCount.toString())
  return c.json(results)
})

app.get('/api/suppliers/:id', async (c) => {
  const id = c.req.param('id')
  const supplier = await c.env.DB.prepare('SELECT * FROM suppliers WHERE id = ?').bind(id).first()
  
  if (!supplier) return c.json({ message: 'Not found' }, 404)
  
  // Ambil daftar produk yang disuplai oleh supplier ini
  const { results: products } = await c.env.DB.prepare(`
    SELECT p.*, COUNT(pv.id) as variant_count
    FROM products p
    LEFT JOIN product_variants pv ON p.id = pv.product_id
    WHERE p.supplier_id = ?
    GROUP BY p.id
    ORDER BY p.created_at DESC
  `).bind(id).all()

  return c.json({ ...supplier, products })
})

app.post('/api/suppliers', async (c) => {
  const body = await c.req.json()
  const id = crypto.randomUUID()
  const tenant_id = 'tenant-1'
  
  await c.env.DB.prepare(
    'INSERT INTO suppliers (id, tenant_id, name, contact_person, phone, address) VALUES (?, ?, ?, ?, ?, ?)'
  ).bind(id, tenant_id, body.name, body.contact_person || null, body.phone || null, body.address || null).run()
  
  const supplier = await c.env.DB.prepare('SELECT * FROM suppliers WHERE id = ?').bind(id).first()
  return c.json(supplier, 201)
})

app.put('/api/suppliers/:id', async (c) => {
  const id = c.req.param('id')
  const body = await c.req.json()
  
  await c.env.DB.prepare(
    'UPDATE suppliers SET name = ?, contact_person = ?, phone = ?, address = ?, is_active = ? WHERE id = ?'
  ).bind(body.name, body.contact_person || null, body.phone || null, body.address || null, body.is_active ?? 1, id).run()
  
  const supplier = await c.env.DB.prepare('SELECT * FROM suppliers WHERE id = ?').bind(id).first()
  return c.json(supplier)
})

app.delete('/api/suppliers/:id', async (c) => {
  const id = c.req.param('id')
  
  // Note: we might want to check if supplier has products before deleting, 
  // but for now we'll just delete or let the foreign key constraint fail if there are products without CASCADE.
  // Actually, products have supplier_id foreign key. Let's just run delete and if it fails, it returns 500.
  try {
    await c.env.DB.prepare('DELETE FROM suppliers WHERE id = ?').bind(id).run()
    return c.json({ success: true })
  } catch (err: any) {
    return c.json({ message: 'Gagal menghapus supplier, mungkin ada produk yang terikat dengannya.', error: err.message }, 400)
  }
})

export default app
