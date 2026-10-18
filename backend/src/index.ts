import { Hono } from 'hono'
import { cors } from 'hono/cors'

type Bindings = {
  DB: D1Database
}

const app = new Hono<{ Bindings: Bindings }>()

app.onError((err, c) => {
  console.error('API Error:', err)
  return c.json({ error: err.message, stack: err.stack }, 500)
})

// Refine membutuhkan CORS untuk mengakses API
app.use('*', cors({
  origin: '*', // Pada produksi sebaiknya disesuaikan dengan URL frontend
  exposeHeaders: ['x-total-count'], // Header ini dibutuhkan oleh dataProvider Refine untuk pagination
}))

app.get('/', (c) => c.text('Distribusi App API is running!'))

// Endpoint untuk migrasi sementara
app.get('/api/_migrate', async (c) => {
  try {
    await c.env.DB.prepare('ALTER TABLE inbound_batches ADD COLUMN variant_id TEXT').run()
  } catch (e) { console.log('variant_id may already exist') }
  try {
    await c.env.DB.prepare('ALTER TABLE inbound_batches ADD COLUMN current_quantity INTEGER DEFAULT 0').run()
  } catch (e) { console.log('current_quantity may already exist') }
  try {
    // Set default current_quantity = quantity if existing
    await c.env.DB.prepare('UPDATE inbound_batches SET current_quantity = quantity WHERE current_quantity IS NULL OR current_quantity = 0').run()
  } catch (e) { console.log('update failed') }
  
  // Fix old data: assign the first variant_id of the product to the batch if variant_id is null
  try {
    const { results: batches } = await c.env.DB.prepare('SELECT id, product_id FROM inbound_batches WHERE variant_id IS NULL').all()
    for (const batch of batches) {
      const { results: variants } = await c.env.DB.prepare('SELECT id FROM product_variants WHERE product_id = ?').bind(batch.product_id).all()
      if (variants && variants.length > 0) {
        await c.env.DB.prepare('UPDATE inbound_batches SET variant_id = ? WHERE id = ?').bind(variants[0].id, batch.id).run()
      }
    }
  } catch (e) { console.log('Fix old data failed', e) }
  
  return c.json({ message: 'Migration and data fix applied' })
})

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
  
  // Ambil semua varian untuk produk-produk ini beserta stok terkini di gudang
  const { results: variants } = await c.env.DB.prepare(`
    SELECT pv.*, 
      COALESCE((SELECT SUM(ib.current_quantity) FROM inbound_batches ib WHERE ib.variant_id = pv.id), 0) as current_stock
    FROM product_variants pv 
    WHERE pv.product_id IN (SELECT id FROM products WHERE tenant_id = ?)
  `).bind(tenant_id).all()
  
  // Gabungkan varian ke dalam produk (pastikan selalu ada minimal 1 varian)
  const formattedProducts = products.map((p: any) => {
    let pVariants = variants.filter((v: any) => v.product_id === p.id)
    if (pVariants.length === 0) {
      pVariants = [{
        id: p.id,
        product_id: p.id,
        name: 'Standar',
        sku: null,
        current_stock: 0
      }]
    }
    return {
      ...p,
      variants: pVariants
    }
  })
  
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
  
  // Ambil varian produk ini beserta stok terkini
  const { results: variants } = await c.env.DB.prepare(`
    SELECT pv.*, 
      COALESCE((SELECT SUM(ib.current_quantity) FROM inbound_batches ib WHERE ib.variant_id = pv.id), 0) as current_stock
    FROM product_variants pv 
    WHERE pv.product_id = ?
  `).bind(id).all()
  
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

  // Ambil riwayat stok masuk (inbound batches)
  const { results: inbound_batches } = await c.env.DB.prepare(`
    SELECT ib.*, pv.name as variant_name, COALESCE(s.name, 'Internal') as supplier_name
    FROM inbound_batches ib
    LEFT JOIN product_variants pv ON ib.variant_id = pv.id
    LEFT JOIN products p ON ib.product_id = p.id
    LEFT JOIN suppliers s ON p.supplier_id = s.id
    WHERE ib.product_id = ?
    ORDER BY ib.production_date DESC, ib.created_at DESC
  `).bind(id).all()

  // Ambil riwayat stok keluar (distribusi stock requests yang approved)
  const { results: outbound_history } = await c.env.DB.prepare(`
    SELECT 
      sri.id,
      sr.code as request_code,
      sr.type,
      sr.target_type,
      sr.distribution_date,
      sr.created_at,
      sr.status,
      COALESCE(sri.approved_quantity, sri.quantity) as quantity,
      pv.name as variant_name,
      COALESCE(u.full_name, u.username, a.name, 'Gudang') as recipient_name,
      sr.note
    FROM stock_request_items sri
    JOIN stock_requests sr ON sri.request_id = sr.id
    JOIN product_variants pv ON sri.variant_id = pv.id
    LEFT JOIN users u ON sr.sales_id = u.id
    LEFT JOIN agents a ON sr.agen_id = a.id
    WHERE pv.product_id = ? AND sr.status = 'approved'
    ORDER BY sr.distribution_date DESC, sr.created_at DESC
  `).bind(id).all()
  
  return c.json({ ...product, variants, transactions, inbound_batches, outbound_history })
})

app.post('/api/products', async (c) => {
  const body = await c.req.json()
  const id = crypto.randomUUID()
  const tenant_id = 'tenant-1'
  
  // Insert Produk Induk
  await c.env.DB.prepare(
    'INSERT INTO products (id, tenant_id, name, category, brand, base_production_price, base_sales_price, base_agent_price, supplier_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
  ).bind(id, tenant_id, body.name, body.category || null, body.brand || null, body.base_production_price, body.base_sales_price, body.base_agent_price, body.supplier_id || null).run()
  
  // Insert Varian (jika ada, atau buat varian default Standar jika kosong)
  if (body.variants && Array.isArray(body.variants) && body.variants.length > 0) {
    for (const v of body.variants) {
      const v_id = crypto.randomUUID()
      await c.env.DB.prepare(
        'INSERT INTO product_variants (id, product_id, sku, name, override_production_price, override_sales_price, override_agent_price) VALUES (?, ?, ?, ?, ?, ?, ?)'
      ).bind(v_id, id, v.sku || null, v.name, v.override_production_price || null, v.override_sales_price || null, v.override_agent_price || null).run()
    }
  } else {
    const v_id = crypto.randomUUID()
    await c.env.DB.prepare(
      'INSERT INTO product_variants (id, product_id, sku, name) VALUES (?, ?, ?, ?)'
    ).bind(v_id, id, null, 'Standar').run()
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
    SELECT ib.*, p.name as product_name, pv.name as variant_name, s.name as supplier_name 
    FROM inbound_batches ib 
    LEFT JOIN products p ON ib.product_id = p.id 
    LEFT JOIN product_variants pv ON ib.variant_id = pv.id
    LEFT JOIN suppliers s ON p.supplier_id = s.id
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
      'INSERT INTO inbound_batches (id, tenant_id, product_id, variant_id, source_type, quantity, current_quantity, production_date, expired_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
    ).bind(id, tenant_id, body.product_id, body.variant_id || null, body.source_type, body.quantity, body.quantity, body.production_date, body.expired_date).run()
    
    const batch = await c.env.DB.prepare('SELECT * FROM inbound_batches WHERE id = ?').bind(id).first()
    return c.json(batch, 201)
  } catch (error: any) {
    console.error(error);
    return c.json({ message: "DB Error", error: error.message }, 500)
  }
})

app.get('/api/inbound_batches/:id', async (c) => {
  const id = c.req.param('id')
  const batch = await c.env.DB.prepare(`
    SELECT ib.*, p.name as product_name, pv.name as variant_name, s.name as supplier_name 
    FROM inbound_batches ib 
    LEFT JOIN products p ON ib.product_id = p.id 
    LEFT JOIN product_variants pv ON ib.variant_id = pv.id
    LEFT JOIN suppliers s ON p.supplier_id = s.id
    WHERE ib.id = ?
  `).bind(id).first()
  
  if (!batch) return c.json({ error: 'Not found' }, 404)
  return c.json(batch)
})



// ==========================================
// AGENTS API
// ==========================================
app.get('/api/agents', async (c) => {
  const tenant_id = 'tenant-1'
  const countResult = await c.env.DB.prepare('SELECT COUNT(*) as count FROM agents WHERE tenant_id = ?').bind(tenant_id).first()
  const totalCount = countResult ? (countResult.count as number) : 0
  
  const { results } = await c.env.DB.prepare('SELECT * FROM agents WHERE tenant_id = ? ORDER BY created_at DESC').bind(tenant_id).all()
  
  c.header('x-total-count', totalCount.toString())
  return c.json(results)
})

app.post('/api/agents', async (c) => {
  const body = await c.req.json()
  const id = crypto.randomUUID()
  const tenant_id = 'tenant-1'
  
  try {
    await c.env.DB.prepare(
      'INSERT INTO agents (id, tenant_id, name, contact, status, notes) VALUES (?, ?, ?, ?, ?, ?)'
    ).bind(id, tenant_id, body.name, body.contact, body.status || 'Aktif', body.notes || null).run()
    
    const agent = await c.env.DB.prepare('SELECT * FROM agents WHERE id = ?').bind(id).first()
    return c.json(agent, 201)
  } catch (error: any) {
    return c.json({ error: error.message }, 500)
  }
})

app.get('/api/agents/:id', async (c) => {
  const id = c.req.param('id')
  const agent = await c.env.DB.prepare('SELECT * FROM agents WHERE id = ?').bind(id).first()
  
  if (!agent) return c.json({ message: 'Not found' }, 404)
  
  // Ambil riwayat distribusi stok ke agen ini
  const { results: distributions } = await c.env.DB.prepare(`
    SELECT sr.*,
      (SELECT COUNT(*) FROM stock_request_items i WHERE i.request_id = sr.id) as item_count,
      (SELECT COALESCE(SUM(i.quantity), 0) FROM stock_request_items i WHERE i.request_id = sr.id) as total_qty
    FROM stock_requests sr
    WHERE sr.agen_id = ?
    ORDER BY sr.distribution_date DESC, sr.created_at DESC
  `).bind(id).all()
  
  return c.json({ ...agent, distributions })
})

app.put('/api/agents/:id', async (c) => {
  const id = c.req.param('id')
  const body = await c.req.json()
  
  try {
    await c.env.DB.prepare(
      'UPDATE agents SET name = ?, contact = ?, status = ?, notes = ? WHERE id = ?'
    ).bind(body.name, body.contact, body.status || 'Aktif', body.notes || null, id).run()
    
    const agent = await c.env.DB.prepare('SELECT * FROM agents WHERE id = ?').bind(id).first()
    return c.json(agent)
  } catch (error: any) {
    return c.json({ error: error.message }, 500)
  }
})

app.delete('/api/agents/:id', async (c) => {
  const id = c.req.param('id')
  try {
    await c.env.DB.prepare('DELETE FROM agents WHERE id = ?').bind(id).run()
    return c.json({ success: true })
  } catch (error: any) {
    return c.json({ error: error.message }, 500)
  }
})

// ==========================================
// USERS API
// ==========================================
app.get('/api/users', async (c) => {
  const tenant_id = 'tenant-1'
  const countResult = await c.env.DB.prepare('SELECT COUNT(*) as count FROM users WHERE tenant_id = ?').bind(tenant_id).first()
  const totalCount = countResult ? (countResult.count as number) : 0
  
  const { results } = await c.env.DB.prepare('SELECT id, username, full_name, role, created_at FROM users WHERE tenant_id = ? ORDER BY created_at DESC').bind(tenant_id).all()
  
  c.header('x-total-count', totalCount.toString())
  return c.json(results)
})

app.post('/api/users', async (c) => {
  const body = await c.req.json()
  const id = crypto.randomUUID()
  const tenant_id = 'tenant-1'
  
  try {
    // Basic password hashing logic isn't strictly necessary for a mockup, but we store it anyway
    await c.env.DB.prepare(
      `INSERT INTO users (
        id, tenant_id, username, password_hash, role, 
        nik, full_name, place_of_birth, date_of_birth, gender, address, phone
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(
      id, tenant_id, body.username, body.password || 'password123', body.role,
      body.nik || null, body.full_name || null, body.place_of_birth || null, body.date_of_birth || null, body.gender || null, body.address || null, body.phone || null
    ).run()
    
    return c.json({ id, username: body.username, full_name: body.full_name, role: body.role }, 201)
  } catch (error: any) {
    return c.json({ error: error.message }, 500)
  }
})

app.get('/api/users/:id', async (c) => {
  const { id } = c.req.param()
  const tenant_id = 'tenant-1'
  
  const user = await c.env.DB.prepare(
    'SELECT id, username, role, nik, full_name, place_of_birth, date_of_birth, gender, address, phone, created_at FROM users WHERE id = ? AND tenant_id = ?'
  ).bind(id, tenant_id).first()
  
  if (!user) return c.json({ error: 'Not found' }, 404)
  return c.json(user)
})

app.put('/api/users/:id', async (c) => {
  const { id } = c.req.param()
  const tenant_id = 'tenant-1'
  const body = await c.req.json()
  
  try {
    const stmts = []
    
    // Check if user exists
    const existing = await c.env.DB.prepare('SELECT id FROM users WHERE id = ? AND tenant_id = ?').bind(id, tenant_id).first()
    if (!existing) return c.json({ error: 'Not found' }, 404)
    
    if (body.password) {
      stmts.push(c.env.DB.prepare(
        'UPDATE users SET username = ?, password_hash = ?, role = ?, nik = ?, full_name = ?, place_of_birth = ?, date_of_birth = ?, gender = ?, address = ?, phone = ? WHERE id = ? AND tenant_id = ?'
      ).bind(body.username, body.password, body.role, body.nik || null, body.full_name || null, body.place_of_birth || null, body.date_of_birth || null, body.gender || null, body.address || null, body.phone || null, id, tenant_id))
    } else {
      stmts.push(c.env.DB.prepare(
        'UPDATE users SET username = ?, role = ?, nik = ?, full_name = ?, place_of_birth = ?, date_of_birth = ?, gender = ?, address = ?, phone = ? WHERE id = ? AND tenant_id = ?'
      ).bind(body.username, body.role, body.nik || null, body.full_name || null, body.place_of_birth || null, body.date_of_birth || null, body.gender || null, body.address || null, body.phone || null, id, tenant_id))
    }
    
    await c.env.DB.batch(stmts)
    return c.json({ success: true, id })
  } catch (err: any) {
    return c.json({ error: err.message }, 500)
  }
})

app.delete('/api/users/:id', async (c) => {
  const { id } = c.req.param()
  const tenant_id = 'tenant-1'
  
  try {
    await c.env.DB.prepare('DELETE FROM users WHERE id = ? AND tenant_id = ?').bind(id, tenant_id).run()
    return c.json({ success: true })
  } catch (err: any) {
    return c.json({ error: err.message }, 500)
  }
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

// ==========================================
// STOCK REQUESTS API
// type = 'request'        -> Sales mengajukan stok ke Admin
// type = 'recommendation' -> Admin merekomendasikan stok ke Sales
// ==========================================
app.get('/api/stock-requests', async (c) => {
  const tenant_id = 'tenant-1'
  const type = c.req.query('type')
  const status = c.req.query('status')
  const sales_id = c.req.query('sales_id')
  const target_type = c.req.query('target_type')

  const where: string[] = ['sr.tenant_id = ?']
  const params: any[] = [tenant_id]
  if (type) { where.push('sr.type = ?'); params.push(type) }
  if (status) { where.push('sr.status = ?'); params.push(status) }
  if (target_type) {
    if (target_type === 'sales') {
      where.push('(sr.target_type = "sales" OR sr.target_type IS NULL)')
    } else {
      where.push('sr.target_type = ?')
      params.push(target_type)
    }
  }
  
  // Untuk sisi Sales: tampilkan hanya target_type = 'sales' milik sendiri atau rekomendasi broadcast sales
  if (sales_id !== undefined && sales_id !== '') {
    where.push('((sr.target_type = "sales" OR sr.target_type IS NULL) AND (sr.sales_id = ? OR (sr.type = "recommendation" AND sr.sales_id IS NULL)))')
    params.push(sales_id)
  }

  const { results } = await c.env.DB.prepare(`
    SELECT sr.*, u.full_name as sales_full_name, u.username as sales_username,
      a.name as agen_name,
      (SELECT COUNT(*) FROM stock_request_items i WHERE i.request_id = sr.id) as item_count,
      (SELECT COALESCE(SUM(i.quantity), 0) FROM stock_request_items i WHERE i.request_id = sr.id) as total_qty
    FROM stock_requests sr
    LEFT JOIN users u ON sr.sales_id = u.id
    LEFT JOIN agents a ON sr.agen_id = a.id
    WHERE ${where.join(' AND ')}
    ORDER BY sr.created_at DESC
  `).bind(...params).all()

  c.header('x-total-count', String(results.length))
  return c.json(results)
})

app.get('/api/stock-requests/:id', async (c) => {
  const id = c.req.param('id')
  const request = await c.env.DB.prepare(`
    SELECT sr.*, u.full_name as sales_full_name, u.username as sales_username,
      a.name as agen_name
    FROM stock_requests sr
    LEFT JOIN users u ON sr.sales_id = u.id
    LEFT JOIN agents a ON sr.agen_id = a.id
    WHERE sr.id = ?
  `).bind(id).first()
  if (!request) return c.json({ message: 'Not found' }, 404)

  const { results: items } = await c.env.DB.prepare(`
    SELECT i.*, pv.name as variant_name, pv.sku, p.name as product_name, p.category as product_category, ib.expired_date
    FROM stock_request_items i
    LEFT JOIN product_variants pv ON i.variant_id = pv.id
    LEFT JOIN products p ON pv.product_id = p.id
    LEFT JOIN inbound_batches ib ON i.batch_id = ib.id
    WHERE i.request_id = ?
  `).bind(id).all()

  return c.json({ ...request, items })
})

app.post('/api/stock-requests', async (c) => {
  const body = await c.req.json()
  const tenant_id = 'tenant-1'
  const id = crypto.randomUUID()

  if (!['request', 'recommendation'].includes(body.type)) {
    return c.json({ message: 'Tipe tidak valid' }, 400)
  }
  const items = Array.isArray(body.items) ? body.items.filter((i: any) => i.variant_id && Number(i.quantity) > 0) : []
  if (items.length === 0) return c.json({ message: 'Minimal 1 item dengan jumlah > 0' }, 400)

  const now = new Date()
  const year = now.getFullYear().toString()
  const month = (now.getMonth() + 1).toString().padStart(2, '0')
  const ym = `${year}-${month}`

  const counts = await c.env.DB.prepare(`
    SELECT
      COUNT(CASE WHEN strftime('%Y-%m', created_at) = ? THEN 1 END) as month_count,
      COUNT(CASE WHEN strftime('%Y', created_at) = ? THEN 1 END) as year_count
    FROM stock_requests
    WHERE tenant_id = ? AND type = ?
  `).bind(ym, year, tenant_id, body.type).first()

  const monthSeq = ((counts?.month_count as number) || 0) + 1
  const yearSeq = ((counts?.year_count as number) || 0) + 1

  const prefix = body.type === 'request' ? 'REQ' : 'REC'
  const code = `${prefix}-${year}${month}-${String(monthSeq).padStart(3, '0')}-${String(yearSeq).padStart(4, '0')}`

  try {
    const targetType = body.target_type || 'sales';
    const status = targetType === 'agen' ? 'approved' : 'pending';
    const stmts = [
      c.env.DB.prepare(
        'INSERT INTO stock_requests (id, tenant_id, code, type, target_type, sales_id, agen_id, distribution_date, status, priority, note, created_by_role) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
      ).bind(
        id, tenant_id, code, body.type, targetType, 
        targetType === 'sales' ? (body.sales_id || null) : null,
        targetType === 'agen' ? (body.agen_id || null) : null,
        body.distribution_date || null,
        status,
        body.priority === 'urgent' ? 'urgent' : 'normal', 
        body.note || null, 
        body.created_by_role || null
      )
    ]

    for (const i of items) {
      const qty = Number(i.quantity)
      const appQty = status === 'approved' ? qty : null
      stmts.push(
        c.env.DB.prepare('INSERT INTO stock_request_items (id, request_id, variant_id, batch_id, quantity, approved_quantity) VALUES (?, ?, ?, ?, ?, ?)')
          .bind(crypto.randomUUID(), id, i.variant_id, i.batch_id || null, qty, appQty)
      )

      if (status === 'approved') {
        let remaining = qty

        // 1. Potong batch spesifik jika dipilih
        if (i.batch_id) {
          const specificBatch = await c.env.DB.prepare('SELECT id, current_quantity FROM inbound_batches WHERE id = ? AND current_quantity > 0').bind(i.batch_id).first()
          if (specificBatch) {
            const bQty = specificBatch.current_quantity as number
            const deduct = Math.min(remaining, bQty)
            stmts.push(
              c.env.DB.prepare('UPDATE inbound_batches SET current_quantity = current_quantity - ? WHERE id = ?').bind(deduct, i.batch_id)
            )
            remaining -= deduct
          }
        }

        // 2. Jika masih bersisa, potong batch sesuai variant_id (FEFO)
        if (remaining > 0 && i.variant_id) {
          const batches = await c.env.DB.prepare('SELECT id, current_quantity FROM inbound_batches WHERE variant_id = ? AND current_quantity > 0 ORDER BY expired_date ASC, created_at ASC').bind(i.variant_id).all()
          for (const batch of (batches.results || [])) {
            if (remaining <= 0) break
            if (i.batch_id && batch.id === i.batch_id) continue
            const bQty = batch.current_quantity as number
            const deduct = Math.min(remaining, bQty)
            stmts.push(
              c.env.DB.prepare('UPDATE inbound_batches SET current_quantity = current_quantity - ? WHERE id = ?').bind(deduct, batch.id)
            )
            remaining -= deduct
          }
        }

        // 3. Fallback: Jika masih bersisa, potong batch dari produk yang sama (FEFO)
        if (remaining > 0 && i.variant_id) {
          const variantRow = await c.env.DB.prepare('SELECT product_id FROM product_variants WHERE id = ?').bind(i.variant_id).first()
          const pId = variantRow?.product_id
          if (pId) {
            const pBatches = await c.env.DB.prepare('SELECT id, current_quantity FROM inbound_batches WHERE product_id = ? AND current_quantity > 0 ORDER BY expired_date ASC, created_at ASC').bind(pId).all()
            for (const batch of (pBatches.results || [])) {
              if (remaining <= 0) break
              if (i.batch_id && batch.id === i.batch_id) continue
              const bQty = batch.current_quantity as number
              const deduct = Math.min(remaining, bQty)
              stmts.push(
                c.env.DB.prepare('UPDATE inbound_batches SET current_quantity = current_quantity - ? WHERE id = ?').bind(deduct, batch.id)
              )
              remaining -= deduct
            }
          }
        }
      }
    }

    await c.env.DB.batch(stmts)
    return c.json({ id, code }, 201)
  } catch (error: any) {
    return c.json({ message: 'DB Error', error: error.message }, 500)
  }
})

app.put('/api/stock-requests/:id/respond', async (c) => {
  const id = c.req.param('id')
  const body = await c.req.json()
  if (!['approved', 'rejected'].includes(body.status)) {
    return c.json({ message: 'Status tidak valid' }, 400)
  }

  const existing = await c.env.DB.prepare('SELECT status FROM stock_requests WHERE id = ?').bind(id).first()
  if (!existing) return c.json({ message: 'Not found' }, 404)
  if (existing.status !== 'pending') return c.json({ message: 'Pengajuan sudah diproses sebelumnya' }, 400)

  const stmts = [
    c.env.DB.prepare('UPDATE stock_requests SET status = ?, response_note = ?, responded_at = CURRENT_TIMESTAMP WHERE id = ?')
      .bind(body.status, body.response_note || null, id),
  ]
  
  if (body.status === 'approved') {
    const origItems = await c.env.DB.prepare('SELECT id, variant_id, batch_id, quantity FROM stock_request_items WHERE request_id = ?').bind(id).all()
    const origMap = new Map((origItems.results || []).map((o: any) => [o.id, o]))

    let itemsToProcess = []
    if (Array.isArray(body.items) && body.items.length > 0) {
      itemsToProcess = body.items
    } else {
      itemsToProcess = (origItems.results || []).map((o: any) => ({ id: o.id, variant_id: o.variant_id, batch_id: o.batch_id, approved_quantity: o.quantity }))
    }

    for (const i of itemsToProcess) {
      const orig = origMap.get(i.id) as any
      const appQty = Math.max(0, Number(i.approved_quantity) || 0)
      stmts.push(
        c.env.DB.prepare('UPDATE stock_request_items SET approved_quantity = ? WHERE id = ? AND request_id = ?')
          .bind(appQty, i.id, id)
      )

      if (appQty > 0) {
        const vId = i.variant_id || orig?.variant_id
        const bId = i.batch_id || orig?.batch_id
        let remaining = appQty

        // 1. Potong batch spesifik jika dipilih
        if (bId) {
          const specificBatch = await c.env.DB.prepare('SELECT id, current_quantity FROM inbound_batches WHERE id = ? AND current_quantity > 0').bind(bId).first()
          if (specificBatch) {
            const bQty = specificBatch.current_quantity as number
            const deduct = Math.min(remaining, bQty)
            stmts.push(
              c.env.DB.prepare('UPDATE inbound_batches SET current_quantity = current_quantity - ? WHERE id = ?').bind(deduct, bId)
            )
            remaining -= deduct
          }
        }

        // 2. Jika masih bersisa, potong batch sesuai variant_id (FEFO)
        if (remaining > 0 && vId) {
          const vBatches = await c.env.DB.prepare('SELECT id, current_quantity FROM inbound_batches WHERE variant_id = ? AND current_quantity > 0 ORDER BY expired_date ASC, created_at ASC').bind(vId).all()
          for (const batch of (vBatches.results || [])) {
            if (remaining <= 0) break
            if (bId && batch.id === bId) continue
            const bQty = batch.current_quantity as number
            const deduct = Math.min(remaining, bQty)
            stmts.push(
              c.env.DB.prepare('UPDATE inbound_batches SET current_quantity = current_quantity - ? WHERE id = ?').bind(deduct, batch.id)
            )
            remaining -= deduct
          }
        }

        // 3. Fallback: Jika masih bersisa, potong batch dari produk yang sama (FEFO)
        if (remaining > 0 && vId) {
          const variantRow = await c.env.DB.prepare('SELECT product_id FROM product_variants WHERE id = ?').bind(vId).first()
          const pId = variantRow?.product_id
          if (pId) {
            const pBatches = await c.env.DB.prepare('SELECT id, current_quantity FROM inbound_batches WHERE product_id = ? AND current_quantity > 0 ORDER BY expired_date ASC, created_at ASC').bind(pId).all()
            for (const batch of (pBatches.results || [])) {
              if (remaining <= 0) break
              if (bId && batch.id === bId) continue
              const bQty = batch.current_quantity as number
              const deduct = Math.min(remaining, bQty)
              stmts.push(
                c.env.DB.prepare('UPDATE inbound_batches SET current_quantity = current_quantity - ? WHERE id = ?').bind(deduct, batch.id)
              )
              remaining -= deduct
            }
          }
        }
      }
    }
  }
  
  await c.env.DB.batch(stmts)
  return c.json({ success: true })
})

app.delete('/api/stock-requests/:id', async (c) => {
  const id = c.req.param('id')
  const existing = await c.env.DB.prepare('SELECT status FROM stock_requests WHERE id = ?').bind(id).first()
  if (!existing) return c.json({ message: 'Not found' }, 404)
  if (existing.status !== 'pending') return c.json({ message: 'Hanya pengajuan berstatus menunggu yang bisa dibatalkan' }, 400)
  await c.env.DB.batch([
    c.env.DB.prepare('DELETE FROM stock_request_items WHERE request_id = ?').bind(id),
    c.env.DB.prepare('DELETE FROM stock_requests WHERE id = ?').bind(id),
  ])
  return c.json({ success: true })
})

app.get('/api/inventory', async (c) => {
  const tenant_id = 'tenant-1'
  try {
    const { results } = await c.env.DB.prepare(`
      SELECT 
        COALESCE(pv.id, p.id) as id,
        p.id as product_id,
        p.name as product_name,
        p.category,
        p.brand,
        COALESCE(s.name, 'Internal') as supplier_name,
        pv.name as variant_name,
        pv.sku,
        COALESCE(SUM(ib.current_quantity), 0) as total_stock
      FROM products p
      LEFT JOIN product_variants pv ON pv.product_id = p.id
      LEFT JOIN suppliers s ON p.supplier_id = s.id
      LEFT JOIN inbound_batches ib ON ib.variant_id = pv.id
      WHERE p.tenant_id = ?
      GROUP BY pv.id, p.id, p.name, p.category, p.brand, s.name, pv.name, pv.sku
      ORDER BY p.name ASC, pv.name ASC
    `).bind(tenant_id).all()
    
    // We map id to the variant_id for Refine data provider (requires id)
    c.header('x-total-count', String(results.length))
    return c.json(results)
  } catch (error: any) {
    return c.json({ message: 'DB Error', error: error.message }, 500)
  }
})

// ==========================================
// CONSIGNMENTS API (Stok Keluar Sales ke Toko)
// ==========================================
app.get('/api/consignments', async (c) => {
  const tenant_id = 'tenant-1'
  const sales_id = c.req.query('sales_id')
  const where = ['c.tenant_id = ?']
  const params: any[] = [tenant_id]

  if (sales_id) {
    where.push('c.sales_id = ?')
    params.push(sales_id)
  }

  const variant_id = c.req.query('variant_id')
  if (variant_id) {
    where.push('c.variant_id = ?')
    params.push(variant_id)
  }

  const { results } = await c.env.DB.prepare(`
    SELECT c.*, 
      pv.name as variant_name, pv.sku, p.name as product_name, p.category as product_category,
      COALESCE(a.name, st.name, 'Toko Mitra') as store_name,
      COALESCE(a.contact, st.owner_name, '') as store_contact
    FROM consignments c
    JOIN product_variants pv ON c.variant_id = pv.id
    JOIN products p ON pv.product_id = p.id
    LEFT JOIN agents a ON c.store_id = a.id
    LEFT JOIN stores st ON c.store_id = st.id
    WHERE ${where.join(' AND ')}
    ORDER BY c.created_at DESC
  `).bind(...params).all()

  return c.json(results)
})

app.post('/api/consignments', async (c) => {
  const tenant_id = 'tenant-1'
  const body = await c.req.json()
  const sales_id = body.sales_id
  const store_id = body.store_id

  if (!sales_id || !store_id) {
    return c.json({ message: 'Sales dan Toko/Agen tujuan wajib diisi' }, 400)
  }

  // Pastikan store_id ada di tabel stores (jika store_id berasal dari agents)
  const existingStore = await c.env.DB.prepare('SELECT id FROM stores WHERE id = ?').bind(store_id).first()
  if (!existingStore) {
    const agent = await c.env.DB.prepare('SELECT id, name, contact FROM agents WHERE id = ?').bind(store_id).first()
    if (agent) {
      await c.env.DB.prepare('INSERT OR IGNORE INTO stores (id, tenant_id, name, owner_name) VALUES (?, ?, ?, ?)').bind(agent.id, tenant_id, agent.name, agent.contact || 'Mitra').run()
    }
  }

  const items = Array.isArray(body.items) ? body.items : [{ variant_id: body.variant_id, quantity: body.initial_stock || body.quantity }]
  const validItems = items.filter((i: any) => i.variant_id && Number(i.quantity) > 0)

  if (validItems.length === 0) {
    return c.json({ message: 'Minimal 1 item dengan kuantitas > 0' }, 400)
  }

  const stmts = validItems.map((i: any) => {
    const cid = crypto.randomUUID()
    const qty = Number(i.quantity)
    return c.env.DB.prepare(`
      INSERT INTO consignments (id, tenant_id, sales_id, store_id, variant_id, initial_stock, remaining_qty, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'active')
    `).bind(cid, tenant_id, sales_id, store_id, i.variant_id, qty, qty)
  })

  await c.env.DB.batch(stmts)
  return c.json({ success: true, count: validItems.length }, 201)
})

app.delete('/api/consignments/:id', async (c) => {
  const id = c.req.param('id')
  await c.env.DB.prepare('DELETE FROM consignments WHERE id = ?').bind(id).run()
  return c.json({ success: true })
})

// ==========================================
// SALES INVENTORY (Stok yang Dibawa Sales)
// ==========================================
app.get('/api/sales-inventory/:sales_id', async (c) => {
  const sales_id = c.req.param('sales_id')
  const tenant_id = 'tenant-1'

  // 1. Ambil semua item stok masuk yang disetujui untuk sales ini
  const { results: inboundItems } = await c.env.DB.prepare(`
    SELECT 
      sri.variant_id,
      pv.name as variant_name,
      pv.sku,
      p.id as product_id,
      p.name as product_name,
      p.category as product_category,
      SUM(COALESCE(sri.approved_quantity, sri.quantity)) as total_inbound
    FROM stock_request_items sri
    JOIN stock_requests sr ON sri.request_id = sr.id
    JOIN product_variants pv ON sri.variant_id = pv.id
    JOIN products p ON pv.product_id = p.id
    WHERE sr.tenant_id = ? 
      AND sr.status = 'approved'
      AND (sr.target_type = 'sales' OR sr.target_type IS NULL)
      AND (sr.sales_id = ? OR (sr.type = 'recommendation' AND sr.sales_id IS NULL))
    GROUP BY sri.variant_id, pv.name, pv.sku, p.id, p.name, p.category
  `).bind(tenant_id, sales_id).all()

  // 1b. Ambil detail per batch untuk setiap inbound item yang disetujui
  const { results: rawBatchItems } = await c.env.DB.prepare(`
    SELECT 
      sri.variant_id,
      sri.batch_id,
      COALESCE(sri.approved_quantity, sri.quantity) as qty
    FROM stock_request_items sri
    JOIN stock_requests sr ON sri.request_id = sr.id
    WHERE sr.tenant_id = ? 
      AND sr.status = 'approved'
      AND (sr.target_type = 'sales' OR sr.target_type IS NULL)
      AND (sr.sales_id = ? OR (sr.type = 'recommendation' AND sr.sales_id IS NULL))
  `).bind(tenant_id, sales_id).all()

  // 1c. Ambil referensi master inbound_batches
  const { results: batchMaster } = await c.env.DB.prepare(`
    SELECT id, variant_id, product_id, production_date, expired_date
    FROM inbound_batches
    WHERE tenant_id = ?
    ORDER BY expired_date ASC
  `).bind(tenant_id).all()

  const batchMap = new Map((batchMaster || []).map((b: any) => [b.id, b]))
  const defaultBatchPerVariant = new Map<string, any>()
  for (const b of (batchMaster || [])) {
    if (b.variant_id && !defaultBatchPerVariant.has(b.variant_id)) {
      defaultBatchPerVariant.set(b.variant_id, b)
    }
  }

  // Akumulasikan kuantitas inbound per (variant_id, batch_id / expired_date)
  const variantBatchesMap = new Map<string, Map<string, { batch_id: string; expired_date: string; production_date: string; inbound_qty: number }>>()

  for (const row of ((rawBatchItems || []) as any[])) {
    const vId = row.variant_id
    if (!vId) continue

    let bInfo = row.batch_id ? batchMap.get(row.batch_id) : null
    if (!bInfo) {
      bInfo = defaultBatchPerVariant.get(vId)
    }

    const bId = bInfo ? bInfo.id : (row.batch_id || 'batch-default')
    const expDate = bInfo ? bInfo.expired_date : '2027-12-31'
    const prodDate = bInfo ? bInfo.production_date : ''
    const qty = Number(row.qty) || 0

    if (!variantBatchesMap.has(vId)) {
      variantBatchesMap.set(vId, new Map())
    }
    const bSubMap = variantBatchesMap.get(vId)!
    const key = `${bId}_${expDate}`
    if (!bSubMap.has(key)) {
      bSubMap.set(key, {
        batch_id: bId,
        expired_date: expDate,
        production_date: prodDate,
        inbound_qty: 0
      })
    }
    bSubMap.get(key)!.inbound_qty += qty
  }

  // 2. Ambil semua item stok keluar (konsinyasi / titipan toko) oleh sales ini
  const { results: outboundItems } = await c.env.DB.prepare(`
    SELECT 
      c.variant_id,
      SUM(c.initial_stock) as total_outbound
    FROM consignments c
    WHERE c.tenant_id = ? AND c.sales_id = ?
    GROUP BY c.variant_id
  `).bind(tenant_id, sales_id).all()

  const outboundMap = new Map((outboundItems || []).map((o: any) => [o.variant_id, Number(o.total_outbound) || 0]))

  // 3. Gabungkan menjadi data saldo stok yang dibawa sales
  const inventory = (inboundItems || []).map((item: any) => {
    const totalIn = Number(item.total_inbound) || 0
    const totalOut = Number(outboundMap.get(item.variant_id)) || 0
    const currentHolding = Math.max(0, totalIn - totalOut)

    // Hitung sisa stok per batch (FEFO)
    const bSubMap = variantBatchesMap.get(item.variant_id)
    let batchList: any[] = []
    if (bSubMap) {
      batchList = Array.from(bSubMap.values()).sort((a, b) => (a.expired_date > b.expired_date ? 1 : -1))
      let remOut = totalOut
      batchList = batchList.map((b) => {
        const deduct = Math.min(b.inbound_qty, remOut)
        const holdingInBatch = Math.max(0, b.inbound_qty - deduct)
        remOut = Math.max(0, remOut - deduct)
        return {
          batch_id: b.batch_id,
          expired_date: b.expired_date,
          production_date: b.production_date,
          inbound_qty: b.inbound_qty,
          current_holding: holdingInBatch
        }
      }).filter((b) => b.current_holding > 0)
    }

    if (batchList.length === 0 && currentHolding > 0) {
      const def = defaultBatchPerVariant.get(item.variant_id)
      batchList = [{
        batch_id: def?.id || 'batch-standard',
        expired_date: def?.expired_date || '2027-12-31',
        production_date: def?.production_date || '',
        inbound_qty: totalIn,
        current_holding: currentHolding
      }]
    }

    return {
      variant_id: item.variant_id,
      variant_name: item.variant_name,
      sku: item.sku,
      product_id: item.product_id,
      product_name: item.product_name,
      product_category: item.product_category,
      total_inbound: totalIn,
      total_outbound: totalOut,
      current_holding: currentHolding,
      batches: batchList
    }
  })

  return c.json(inventory)
})

// ==========================================
// STORES API (Extended for Sales PWA)
// ==========================================
app.get('/api/stores', async (c) => {
  const tenant_id = 'tenant-1'
  
  try {
    // Pastikan kolom wilayah dan status tersedia di tabel stores
    try { await c.env.DB.prepare('ALTER TABLE stores ADD COLUMN address TEXT').run() } catch (e) {}
    try { await c.env.DB.prepare('ALTER TABLE stores ADD COLUMN wa_number TEXT').run() } catch (e) {}
    try { await c.env.DB.prepare('ALTER TABLE stores ADD COLUMN province TEXT').run() } catch (e) {}
    try { await c.env.DB.prepare('ALTER TABLE stores ADD COLUMN city TEXT').run() } catch (e) {}
    try { await c.env.DB.prepare('ALTER TABLE stores ADD COLUMN district TEXT').run() } catch (e) {}
    try { await c.env.DB.prepare('ALTER TABLE stores ADD COLUMN village TEXT').run() } catch (e) {}
    try { await c.env.DB.prepare("ALTER TABLE stores ADD COLUMN status TEXT DEFAULT 'Aktif'").run() } catch (e) {}
    try { await c.env.DB.prepare('ALTER TABLE consignments ADD COLUMN batch_id TEXT').run() } catch (e) {}
    try { await c.env.DB.prepare('ALTER TABLE consignments ADD COLUMN expired_date DATE').run() } catch (e) {}

    const { results: stores } = await c.env.DB.prepare(`
      SELECT s.*,
        (SELECT COUNT(DISTINCT c.variant_id) FROM consignments c WHERE c.store_id = s.id AND c.status = 'active') as active_variants_count,
        (SELECT COALESCE(SUM(c.remaining_qty), 0) FROM consignments c WHERE c.store_id = s.id AND c.status = 'active') as total_remaining_stock,
        (SELECT COALESCE(SUM(v.outstanding_amount), 0) FROM visits v WHERE v.store_id = s.id) as total_debt,
        (SELECT MAX(v.visit_date) FROM visits v WHERE v.store_id = s.id) as last_visit_date,
        (SELECT COUNT(v.id) FROM visits v WHERE v.store_id = s.id) as total_visits_count,
        (
          SELECT MIN(COALESCE(c.expired_date, ib.expired_date))
          FROM consignments c
          LEFT JOIN inbound_batches ib ON ib.variant_id = c.variant_id
          WHERE c.store_id = s.id AND c.status = 'active' AND c.remaining_qty > 0
        ) as nearest_expired_date,
        (
          SELECT p.name
          FROM consignments c
          LEFT JOIN inbound_batches ib ON ib.variant_id = c.variant_id
          LEFT JOIN product_variants pv ON pv.id = c.variant_id
          LEFT JOIN products p ON pv.product_id = p.id
          WHERE c.store_id = s.id AND c.status = 'active' AND c.remaining_qty > 0
          ORDER BY COALESCE(c.expired_date, ib.expired_date) ASC
          LIMIT 1
        ) as nearest_expiring_product_name,
        (
          SELECT pv.name
          FROM consignments c
          LEFT JOIN inbound_batches ib ON ib.variant_id = c.variant_id
          LEFT JOIN product_variants pv ON pv.id = c.variant_id
          WHERE c.store_id = s.id AND c.status = 'active' AND c.remaining_qty > 0
          ORDER BY COALESCE(c.expired_date, ib.expired_date) ASC
          LIMIT 1
        ) as nearest_expiring_variant_name,
        (
          SELECT c.remaining_qty
          FROM consignments c
          LEFT JOIN inbound_batches ib ON ib.variant_id = c.variant_id
          WHERE c.store_id = s.id AND c.status = 'active' AND c.remaining_qty > 0
          ORDER BY COALESCE(c.expired_date, ib.expired_date) ASC
          LIMIT 1
        ) as nearest_expiring_qty
      FROM stores s
      WHERE s.tenant_id = ?
      ORDER BY s.name ASC
    `).bind(tenant_id).all()
    
    return c.json(stores || [])
  } catch (error: any) {
    return c.json({ error: error.message }, 500)
  }
})

app.post('/api/stores', async (c) => {
  const body = await c.req.json()
  const id = crypto.randomUUID()
  const tenant_id = 'tenant-1'
  
  try {
    try { await c.env.DB.prepare('ALTER TABLE stores ADD COLUMN province TEXT').run() } catch (e) {}
    try { await c.env.DB.prepare('ALTER TABLE stores ADD COLUMN city TEXT').run() } catch (e) {}
    try { await c.env.DB.prepare('ALTER TABLE stores ADD COLUMN district TEXT').run() } catch (e) {}
    try { await c.env.DB.prepare('ALTER TABLE stores ADD COLUMN village TEXT').run() } catch (e) {}
    try { await c.env.DB.prepare("ALTER TABLE stores ADD COLUMN status TEXT DEFAULT 'Aktif'").run() } catch (e) {}

    const status = body.status || 'Aktif'
    await c.env.DB.prepare(
      'INSERT INTO stores (id, tenant_id, name, owner_name, address, wa_number, latitude, longitude, province, city, district, village, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
    ).bind(
      id,
      tenant_id,
      body.name,
      body.owner_name || '',
      body.address || null,
      body.wa_number || null,
      body.latitude || null,
      body.longitude || null,
      body.province || null,
      body.city || null,
      body.district || null,
      body.village || null,
      status
    ).run()
    
    const store = await c.env.DB.prepare('SELECT * FROM stores WHERE id = ?').bind(id).first()
    return c.json(store, 201)
  } catch (error: any) {
    return c.json({ error: error.message }, 500)
  }
})

app.get('/api/stores/:id', async (c) => {
  const id = c.req.param('id')
  const store = await c.env.DB.prepare(`
    SELECT s.*,
      (SELECT COUNT(DISTINCT c.variant_id) FROM consignments c WHERE c.store_id = s.id AND c.status = 'active') as active_variants_count,
      (SELECT COALESCE(SUM(c.remaining_qty), 0) FROM consignments c WHERE c.store_id = s.id AND c.status = 'active') as total_remaining_stock,
      (SELECT COALESCE(SUM(v.outstanding_amount), 0) FROM visits v WHERE v.store_id = s.id) as total_debt,
      (SELECT MAX(v.visit_date) FROM visits v WHERE v.store_id = s.id) as last_visit_date
    FROM stores s
    WHERE s.id = ?
  `).bind(id).first()
  if (!store) return c.json({ message: 'Toko tidak ditemukan' }, 404)

  // Ambil ringkasan konsinyasi aktif dengan harga produk
  const { results: consignments } = await c.env.DB.prepare(`
    SELECT c.*, pv.name as variant_name, p.name as product_name, pv.sku,
      COALESCE(c.expired_date, ib.expired_date) as expired_date,
      COALESCE(pv.override_sales_price, p.base_sales_price, 0) as price,
      u.full_name as sales_name
    FROM consignments c
    LEFT JOIN product_variants pv ON c.variant_id = pv.id
    LEFT JOIN products p ON pv.product_id = p.id
    LEFT JOIN users u ON c.sales_id = u.id
    LEFT JOIN inbound_batches ib ON ib.id = c.batch_id OR (c.batch_id IS NULL AND ib.variant_id = c.variant_id)
    WHERE c.store_id = ? AND c.status = 'active'
    ORDER BY COALESCE(c.expired_date, ib.expired_date) ASC, c.created_at DESC
  `).bind(id).all()

  // Ambil Riwayat Stok Masuk (Seluruh konsinyasi / stok masuk ke toko ini)
  const { results: inboundHistory } = await c.env.DB.prepare(`
    SELECT c.id, c.created_at as date, c.initial_stock as qty, c.remaining_qty, c.sold_qty, c.status,
      pv.name as variant_name, p.name as product_name, pv.sku,
      COALESCE(pv.override_sales_price, p.base_sales_price, 0) as price,
      u.full_name as sales_name
    FROM consignments c
    LEFT JOIN product_variants pv ON c.variant_id = pv.id
    LEFT JOIN products p ON pv.product_id = p.id
    LEFT JOIN users u ON c.sales_id = u.id
    WHERE c.store_id = ?
    ORDER BY c.created_at DESC
    LIMIT 100
  `).bind(id).all()

  // Ambil Riwayat Terjual (Dari item kunjungan penjualan)
  const { results: visitSold } = await c.env.DB.prepare(`
    SELECT vi.id, vi.sold_qty as qty, vi.unit_price, (vi.sold_qty * vi.unit_price) as total_price,
      v.visit_date as date, u.full_name as sales_name,
      pv.name as variant_name, p.name as product_name, pv.sku
    FROM visit_items vi
    JOIN visits v ON vi.visit_id = v.id
    LEFT JOIN product_variants pv ON vi.variant_id = pv.id
    LEFT JOIN products p ON pv.product_id = p.id
    LEFT JOIN users u ON v.sales_id = u.id
    WHERE v.store_id = ? AND vi.sold_qty > 0
    ORDER BY v.visit_date DESC, vi.id DESC
    LIMIT 100
  `).bind(id).all()

  // Fallback riwayat terjual dari consignments jika belum ada visit_items
  let soldHistory = visitSold || []
  if (soldHistory.length === 0) {
    const { results: consSold } = await c.env.DB.prepare(`
      SELECT c.id, c.updated_at as date, c.sold_qty as qty,
        COALESCE(pv.override_sales_price, p.base_sales_price, 0) as unit_price,
        (c.sold_qty * COALESCE(pv.override_sales_price, p.base_sales_price, 0)) as total_price,
        u.full_name as sales_name,
        pv.name as variant_name, p.name as product_name, pv.sku
      FROM consignments c
      LEFT JOIN product_variants pv ON c.variant_id = pv.id
      LEFT JOIN products p ON pv.product_id = p.id
      LEFT JOIN users u ON c.sales_id = u.id
      WHERE c.store_id = ? AND c.sold_qty > 0
      ORDER BY c.updated_at DESC
      LIMIT 100
    `).bind(id).all()
    soldHistory = consSold || []
  }

  // Ambil riwayat kunjungan terakhir
  const { results: recentVisits } = await c.env.DB.prepare(`
    SELECT v.*, u.full_name as sales_name
    FROM visits v
    LEFT JOIN users u ON v.sales_id = u.id
    WHERE v.store_id = ?
    ORDER BY v.visit_date DESC
    LIMIT 10
  `).bind(id).all()

  return c.json({
    ...store,
    consignments: consignments || [],
    inbound_history: inboundHistory || [],
    sold_history: soldHistory || [],
    recent_visits: recentVisits || []
  })
})

app.put('/api/stores/:id', async (c) => {
  const id = c.req.param('id')
  const body = await c.req.json()
  
  try {
    try { await c.env.DB.prepare("ALTER TABLE stores ADD COLUMN status TEXT DEFAULT 'Aktif'").run() } catch (e) {}

    await c.env.DB.prepare(
      'UPDATE stores SET name = ?, owner_name = ?, address = ?, wa_number = ?, latitude = ?, longitude = ?, province = ?, city = ?, district = ?, village = ?, status = ? WHERE id = ?'
    ).bind(
      body.name,
      body.owner_name || '',
      body.address || null,
      body.wa_number || null,
      body.latitude || null,
      body.longitude || null,
      body.province || null,
      body.city || null,
      body.district || null,
      body.village || null,
      body.status || 'Aktif',
      id
    ).run()
    
    const store = await c.env.DB.prepare('SELECT * FROM stores WHERE id = ?').bind(id).first()
    return c.json(store)
  } catch (error: any) {
    return c.json({ error: error.message }, 500)
  }
})

app.delete('/api/stores/:id', async (c) => {
  const id = c.req.param('id')
  try {
    try { await c.env.DB.prepare('DELETE FROM visit_schedules WHERE store_id = ?').bind(id).run() } catch (_) {}
    try { await c.env.DB.prepare('DELETE FROM consignments WHERE store_id = ?').bind(id).run() } catch (_) {}
    try { 
      const { results: vIds } = await c.env.DB.prepare('SELECT id FROM visits WHERE store_id = ?').bind(id).all()
      for (const v of (vIds || [])) {
        await c.env.DB.prepare('DELETE FROM visit_items WHERE visit_id = ?').bind((v as any).id).run()
      }
      await c.env.DB.prepare('DELETE FROM visits WHERE store_id = ?').bind(id).run()
    } catch (_) {}

    await c.env.DB.prepare('DELETE FROM stores WHERE id = ?').bind(id).run()
    return c.json({ success: true })
  } catch (error: any) {
    return c.json({ error: error.message }, 500)
  }
})

// ==========================================
// VISITS API (Kunjungan Toko - Core Flow)
// ==========================================
app.get('/api/visits', async (c) => {
  const tenant_id = 'tenant-1'
  const sales_id = c.req.query('sales_id')
  const store_id = c.req.query('store_id')
  const date = c.req.query('date') // format: YYYY-MM-DD
  
  let query = `
    SELECT v.*, s.name as store_name, s.address as store_address, u.full_name as sales_name,
      (SELECT COALESCE(SUM(vi.sold_qty * vi.unit_price), 0) FROM visit_items vi WHERE vi.visit_id = v.id) as computed_sold_amount
    FROM visits v
    LEFT JOIN stores s ON v.store_id = s.id
    LEFT JOIN users u ON v.sales_id = u.id
    WHERE v.tenant_id = ?
  `
  const params: any[] = [tenant_id]
  
  if (sales_id) { query += ' AND v.sales_id = ?'; params.push(sales_id) }
  if (store_id) { query += ' AND v.store_id = ?'; params.push(store_id) }
  if (date) { query += ' AND DATE(v.visit_date) = ?'; params.push(date) }
  
  query += ' ORDER BY v.visit_date DESC, v.created_at DESC'
  
  const stmt = c.env.DB.prepare(query)
  const { results } = await stmt.bind(...params).all()
  return c.json(results || [])
})

app.get('/api/visits/:id', async (c) => {
  const id = c.req.param('id')
  const visit = await c.env.DB.prepare(`
    SELECT v.*, s.name as store_name, s.address as store_address, s.owner_name as store_owner,
           u.full_name as sales_name
    FROM visits v
    LEFT JOIN stores s ON v.store_id = s.id
    LEFT JOIN users u ON v.sales_id = u.id
    WHERE v.id = ?
  `).bind(id).first()
  
  if (!visit) return c.json({ message: 'Kunjungan tidak ditemukan' }, 404)
  
  const { results: items } = await c.env.DB.prepare(`
    SELECT vi.*, pv.name as variant_name, p.name as product_name, pv.sku
    FROM visit_items vi
    LEFT JOIN product_variants pv ON vi.variant_id = pv.id
    LEFT JOIN products p ON pv.product_id = p.id
    WHERE vi.visit_id = ?
  `).bind(id).all()
  
  return c.json({ ...visit, items: items || [] })
})

app.post('/api/visits', async (c) => {
  const body = await c.req.json()
  const id = crypto.randomUUID()
  const tenant_id = 'tenant-1'
  
  try {
    // 1. Simpan data kunjungan utama
    await c.env.DB.prepare(`
      INSERT INTO visits (id, tenant_id, sales_id, store_id, visit_date, status, total_sold_amount, payment_received, outstanding_amount, notes, latitude, longitude)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      id, tenant_id, body.sales_id, body.store_id,
      body.visit_date || new Date().toISOString(),
      'completed',
      Number(body.total_sold_amount) || 0,
      Number(body.payment_received) || 0,
      Number(body.outstanding_amount) || 0,
      body.notes || null,
      body.latitude || null,
      body.longitude || null
    ).run()
    
    // 2. Simpan item-item kunjungan
    const items = body.items || []
    for (const item of items) {
      const itemId = crypto.randomUUID()
      await c.env.DB.prepare(`
        INSERT INTO visit_items (id, visit_id, variant_id, previous_stock, remaining_stock, sold_qty, new_consignment_qty, unit_price)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        itemId, id, item.variant_id,
        Number(item.previous_stock) || 0,
        Number(item.remaining_stock) || 0,
        Number(item.sold_qty) || 0,
        Number(item.new_consignment_qty) || 0,
        Number(item.unit_price) || 0
      ).run()
      
      // 3. Update konsinyasi lama: kurangi remaining_qty sesuai sold
      if (Number(item.sold_qty) > 0) {
        // Update consignment remaining_qty
        const existingConsignment = await c.env.DB.prepare(`
          SELECT id, remaining_qty FROM consignments 
          WHERE store_id = ? AND variant_id = ? AND status = 'active'
          ORDER BY created_at ASC LIMIT 1
        `).bind(body.store_id, item.variant_id).first()
        
        if (existingConsignment) {
          const newRemaining = Math.max(0, Number(existingConsignment.remaining_qty) - Number(item.sold_qty))
          await c.env.DB.prepare(`
            UPDATE consignments SET sold_qty = sold_qty + ?, remaining_qty = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
          `).bind(Number(item.sold_qty), newRemaining, existingConsignment.id).run()
        }
      }
      
      // 4. Buat konsinyasi baru jika ada titip stok baru
      if (Number(item.new_consignment_qty) > 0) {
        const consId = crypto.randomUUID()
        let expDate = null
        let bId = null
        try {
          const batchInfo: any = await c.env.DB.prepare(
            'SELECT id, expired_date FROM inbound_batches WHERE variant_id = ? AND current_quantity > 0 ORDER BY expired_date ASC LIMIT 1'
          ).bind(item.variant_id).first()
          if (batchInfo) {
            expDate = batchInfo.expired_date
            bId = batchInfo.id
          }
        } catch (_) {}

        await c.env.DB.prepare(`
          INSERT INTO consignments (id, tenant_id, sales_id, store_id, variant_id, initial_stock, remaining_qty, status, batch_id, expired_date)
          VALUES (?, ?, ?, ?, ?, ?, ?, 'active', ?, ?)
        `).bind(
          consId, tenant_id, body.sales_id, body.store_id, item.variant_id,
          Number(item.new_consignment_qty), Number(item.new_consignment_qty),
          bId, expDate
        ).run()
      }
    }
    
    // 5. Update status jadwal kunjungan toko jika ada jadwal pending untuk toko ini
    try {
      await c.env.DB.prepare(`
        UPDATE visit_schedules SET status = 'completed', updated_at = CURRENT_TIMESTAMP
        WHERE store_id = ? AND status = 'pending'
      `).bind(body.store_id).run()
    } catch (_) {
      // ignore if table doesn't exist yet
    }

    const visit = await c.env.DB.prepare('SELECT * FROM visits WHERE id = ?').bind(id).first()
    return c.json(visit, 201)
  } catch (error: any) {
    console.error('Error creating visit:', error)
    return c.json({ error: error.message }, 500)
  }
})

// ==========================================
// VISIT SCHEDULES API (Jadwal Kunjungan Toko)
// ==========================================
app.get('/api/visit-schedules', async (c) => {
  const tenant_id = 'tenant-1'
  const sales_id = c.req.query('sales_id')
  const date = c.req.query('date')

  try {
    await c.env.DB.prepare(`
      CREATE TABLE IF NOT EXISTS visit_schedules (
        id TEXT PRIMARY KEY,
        tenant_id TEXT NOT NULL,
        sales_id TEXT,
        store_id TEXT NOT NULL,
        scheduled_date DATE NOT NULL,
        notes TEXT,
        status TEXT DEFAULT 'pending',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `).run()

    let query = `
      SELECT vs.*, s.name as store_name, s.owner_name, s.address, s.wa_number, s.latitude, s.longitude,
        (SELECT COUNT(DISTINCT c.variant_id) FROM consignments c WHERE c.store_id = s.id AND c.status = 'active') as active_variants_count,
        (SELECT COALESCE(SUM(c.remaining_qty), 0) FROM consignments c WHERE c.store_id = s.id AND c.status = 'active') as total_remaining_stock,
        (SELECT COALESCE(SUM(v.outstanding_amount), 0) FROM visits v WHERE v.store_id = s.id) as total_debt,
        (SELECT MAX(v.visit_date) FROM visits v WHERE v.store_id = s.id) as last_visit_date
      FROM visit_schedules vs
      JOIN stores s ON vs.store_id = s.id
      WHERE vs.tenant_id = ?
    `
    const params: any[] = [tenant_id]
    if (sales_id) { query += ' AND (vs.sales_id = ? OR vs.sales_id IS NULL)'; params.push(sales_id) }
    if (date) { query += ' AND vs.scheduled_date = ?'; params.push(date) }
    query += ' ORDER BY vs.scheduled_date ASC, vs.created_at DESC'

    const { results } = await c.env.DB.prepare(query).bind(...params).all()
    return c.json(results || [])
  } catch (err: any) {
    return c.json({ error: err.message }, 500)
  }
})

app.post('/api/visit-schedules', async (c) => {
  const tenant_id = 'tenant-1'
  const body = await c.req.json()
  const id = crypto.randomUUID()

  try {
    await c.env.DB.prepare(`
      CREATE TABLE IF NOT EXISTS visit_schedules (
        id TEXT PRIMARY KEY,
        tenant_id TEXT NOT NULL,
        sales_id TEXT,
        store_id TEXT NOT NULL,
        scheduled_date DATE NOT NULL,
        notes TEXT,
        status TEXT DEFAULT 'pending',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `).run()

    await c.env.DB.prepare(`
      INSERT INTO visit_schedules (id, tenant_id, sales_id, store_id, scheduled_date, notes, status)
      VALUES (?, ?, ?, ?, ?, ?, 'pending')
    `).bind(id, tenant_id, body.sales_id || null, body.store_id, body.scheduled_date, body.notes || '').run()

    const item = await c.env.DB.prepare(`
      SELECT vs.*, s.name as store_name, s.owner_name, s.address, s.wa_number, s.latitude, s.longitude
      FROM visit_schedules vs
      JOIN stores s ON vs.store_id = s.id
      WHERE vs.id = ?
    `).bind(id).first()
    return c.json(item, 201)
  } catch (err: any) {
    return c.json({ error: err.message }, 500)
  }
})

app.put('/api/visit-schedules/:id', async (c) => {
  const id = c.req.param('id')
  const body = await c.req.json()

  try {
    const fields: string[] = []
    const params: any[] = []

    if (body.scheduled_date !== undefined) { fields.push('scheduled_date = ?'); params.push(body.scheduled_date) }
    if (body.notes !== undefined) { fields.push('notes = ?'); params.push(body.notes) }
    if (body.status !== undefined) { fields.push('status = ?'); params.push(body.status) }
    fields.push('updated_at = CURRENT_TIMESTAMP')

    params.push(id)
    await c.env.DB.prepare(`UPDATE visit_schedules SET ${fields.join(', ')} WHERE id = ?`).bind(...params).run()
    const item = await c.env.DB.prepare(`
      SELECT vs.*, s.name as store_name, s.owner_name, s.address, s.wa_number, s.latitude, s.longitude
      FROM visit_schedules vs
      JOIN stores s ON vs.store_id = s.id
      WHERE vs.id = ?
    `).bind(id).first()
    return c.json(item)
  } catch (err: any) {
    return c.json({ error: err.message }, 500)
  }
})

app.delete('/api/visit-schedules/:id', async (c) => {
  const id = c.req.param('id')
  try {
    await c.env.DB.prepare('DELETE FROM visit_schedules WHERE id = ?').bind(id).run()
    return c.json({ success: true })
  } catch (err: any) {
    return c.json({ error: err.message }, 500)
  }
})

// ==========================================
// SALES DASHBOARD API
// ==========================================
app.get('/api/sales-dashboard/:sales_id', async (c) => {
  const sales_id = c.req.param('sales_id')
  const tenant_id = 'tenant-1'
  const today = new Date().toISOString().split('T')[0]
  
  try {
    // 1. Kunjungan hari ini
    const todayVisits = await c.env.DB.prepare(`
      SELECT COUNT(*) as count, COALESCE(SUM(payment_received), 0) as total_payment
      FROM visits
      WHERE tenant_id = ? AND sales_id = ? AND DATE(visit_date) = ?
    `).bind(tenant_id, sales_id, today).first()

    // 2. Total item terjual hari ini
    const todaySold = await c.env.DB.prepare(`
      SELECT COALESCE(SUM(vi.sold_qty), 0) as total_sold
      FROM visit_items vi
      INNER JOIN visits v ON vi.visit_id = v.id
      WHERE v.tenant_id = ? AND v.sales_id = ? AND DATE(v.visit_date) = ?
    `).bind(tenant_id, sales_id, today).first()

    // 3. Total toko mitra (semua)
    const totalStores = await c.env.DB.prepare(`
      SELECT COUNT(DISTINCT store_id) as count FROM consignments WHERE tenant_id = ? AND sales_id = ?
    `).bind(tenant_id, sales_id).first()

    // 4. Stok di tangan sales (real-time)
    const holdingStock = await c.env.DB.prepare(`
      SELECT COALESCE(SUM(total_inbound - total_outbound), 0) as total_holding FROM (
        SELECT
          (SELECT COALESCE(SUM(sri.approved_quantity), 0) FROM stock_request_items sri
           INNER JOIN stock_requests sr ON sri.request_id = sr.id
           WHERE sr.sales_id = ? AND sr.status = 'approved' AND sr.tenant_id = ?
           AND sri.variant_id = pv.id) as total_inbound,
          (SELECT COALESCE(SUM(c.initial_stock), 0) FROM consignments c
           WHERE c.sales_id = ? AND c.tenant_id = ?
           AND c.variant_id = pv.id) as total_outbound
        FROM product_variants pv
        INNER JOIN products p ON pv.product_id = p.id
        WHERE p.tenant_id = ?
      )
    `).bind(sales_id, tenant_id, sales_id, tenant_id, tenant_id).first()

    // 5. Rekomendasi pending
    const pendingRecs = await c.env.DB.prepare(`
      SELECT COUNT(*) as count FROM stock_requests
      WHERE tenant_id = ? AND sales_id = ? AND type = 'recommendation' AND status = 'pending'
    `).bind(tenant_id, sales_id).first()

    // 6. Toko yang belum dikunjungi hari ini (punya konsinyasi aktif tapi belum kunjung hari ini)
    const { results: pendingStores } = await c.env.DB.prepare(`
      SELECT DISTINCT s.id, s.name, s.address, s.owner_name
      FROM consignments c
      INNER JOIN stores s ON c.store_id = s.id
      WHERE c.tenant_id = ? AND c.sales_id = ? AND c.status = 'active'
      AND s.id NOT IN (
        SELECT store_id FROM visits WHERE sales_id = ? AND DATE(visit_date) = ?
      )
      LIMIT 20
    `).bind(tenant_id, sales_id, sales_id, today).all()
    
    return c.json({
      today_visits: Number(todayVisits?.count) || 0,
      today_payment: Number(todayVisits?.total_payment) || 0,
      today_sold_items: Number(todaySold?.total_sold) || 0,
      total_partner_stores: Number(totalStores?.count) || 0,
      holding_stock: Number(holdingStock?.total_holding) || 0,
      pending_recommendations: Number(pendingRecs?.count) || 0,
      pending_stores: pendingStores || []
    })
  } catch (error: any) {
    console.error('Dashboard error:', error)
    return c.json({ error: error.message }, 500)
  }
})

// ==========================================
// STORE VISITS HISTORY (Per Store)
// ==========================================
app.get('/api/store-visits/:store_id', async (c) => {
  const store_id = c.req.param('store_id')
  const tenant_id = 'tenant-1'
  
  const { results } = await c.env.DB.prepare(`
    SELECT v.*, u.full_name as sales_name,
      (SELECT COALESCE(SUM(vi.sold_qty), 0) FROM visit_items vi WHERE vi.visit_id = v.id) as total_items_sold,
      (SELECT COALESCE(SUM(vi.sold_qty * vi.unit_price), 0) FROM visit_items vi WHERE vi.visit_id = v.id) as total_amount
    FROM visits v
    LEFT JOIN users u ON v.sales_id = u.id
    WHERE v.store_id = ? AND v.tenant_id = ?
    ORDER BY v.visit_date DESC
    LIMIT 50
  `).bind(store_id, tenant_id).all()
  
  return c.json(results || [])
})

export default app

