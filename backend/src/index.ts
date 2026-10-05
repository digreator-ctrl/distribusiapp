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
    SELECT ib.*, p.name as product_name, s.name as supplier_name 
    FROM inbound_batches ib 
    LEFT JOIN products p ON ib.product_id = p.id 
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
      'INSERT INTO inbound_batches (id, tenant_id, product_id, source_type, quantity, production_date, expired_date) VALUES (?, ?, ?, ?, ?, ?, ?)'
    ).bind(id, tenant_id, body.product_id, body.source_type, body.quantity, body.production_date, body.expired_date).run()
    
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
    SELECT ib.*, p.name as product_name, s.name as supplier_name 
    FROM inbound_batches ib 
    LEFT JOIN products p ON ib.product_id = p.id 
    LEFT JOIN suppliers s ON p.supplier_id = s.id
    WHERE ib.id = ?
  `).bind(id).first()
  
  if (!batch) return c.json({ error: 'Not found' }, 404)
  return c.json(batch)
})

// ==========================================
// STORES (AGEN) API
// ==========================================
app.get('/api/stores', async (c) => {
  const tenant_id = 'tenant-1'
  const { results } = await c.env.DB.prepare('SELECT id, name, owner_name FROM stores WHERE tenant_id = ? ORDER BY created_at DESC').bind(tenant_id).all()
  return c.json(results)
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

  const where: string[] = ['sr.tenant_id = ?']
  const params: any[] = [tenant_id]
  if (type) { where.push('sr.type = ?'); params.push(type) }
  if (status) { where.push('sr.status = ?'); params.push(status) }
  // Untuk sisi Sales: tampilkan milik sendiri + rekomendasi broadcast (sales_id NULL)
  if (sales_id !== undefined) {
    if (sales_id) { where.push('(sr.sales_id = ? OR sr.sales_id IS NULL)'); params.push(sales_id) }
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
    SELECT i.*, pv.name as variant_name, pv.sku, p.name as product_name
    FROM stock_request_items i
    LEFT JOIN product_variants pv ON i.variant_id = pv.id
    LEFT JOIN products p ON pv.product_id = p.id
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

  const countRow = await c.env.DB.prepare('SELECT MAX(CAST(SUBSTR(code, 5) AS INTEGER)) as maxseq FROM stock_requests WHERE tenant_id = ? AND type = ?').bind(tenant_id, body.type).first()
  const seq = ((countRow?.maxseq as number) || 0) + 1
  const code = `${body.type === 'request' ? 'REQ' : 'REC'}-${String(seq).padStart(4, '0')}`

  try {
    const targetType = body.target_type || 'sales';
    const stmts = [
      c.env.DB.prepare(
        'INSERT INTO stock_requests (id, tenant_id, code, type, target_type, sales_id, agen_id, distribution_date, status, priority, note, created_by_role) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
      ).bind(
        id, tenant_id, code, body.type, targetType, 
        targetType === 'sales' ? (body.sales_id || null) : null,
        targetType === 'agen' ? (body.agen_id || null) : null,
        body.distribution_date || null,
        targetType === 'agen' ? 'approved' : 'pending',
        body.priority === 'urgent' ? 'urgent' : 'normal', 
        body.note || null, 
        body.created_by_role || null
      ),
      ...items.map((i: any) =>
        c.env.DB.prepare('INSERT INTO stock_request_items (id, request_id, variant_id, batch_id, quantity, approved_quantity) VALUES (?, ?, ?, ?, ?, ?)')
          .bind(crypto.randomUUID(), id, i.variant_id, i.batch_id || null, Number(i.quantity), targetType === 'agen' ? Number(i.quantity) : null)
      ),
    ]
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
    if (Array.isArray(body.items) && body.items.length > 0) {
      for (const i of body.items) {
        stmts.push(
          c.env.DB.prepare('UPDATE stock_request_items SET approved_quantity = ? WHERE id = ? AND request_id = ?')
            .bind(Math.max(0, Number(i.approved_quantity) || 0), i.id, id)
        )
      }
    } else {
      stmts.push(c.env.DB.prepare('UPDATE stock_request_items SET approved_quantity = quantity WHERE request_id = ?').bind(id))
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

export default app
