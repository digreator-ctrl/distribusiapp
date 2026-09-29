import { Hono } from 'hono';
import type { Env } from '../types';
import { authMiddleware } from '../middleware/auth';
import { tenantMiddleware } from '../middleware/tenant';
import { roleMiddleware } from '../middleware/role';
import { validateRequired, generateSlug } from '../middleware/validation';
import { hashSync } from 'bcrypt-ts';

export const businessRoutes = new Hono<{ Bindings: Env }>();

// All business routes require authentication
businessRoutes.use('/*', authMiddleware);

// 2.4 API: Create Business
businessRoutes.post('/', async (c) => {
  const user = c.get('user');
  const body = await c.req.json();
  const { name, phone, address, city, description } = body;

  const err = validateRequired(body, ['name']);
  if (err) return c.json({ success: false, message: err }, 400);

  const db = c.env.DB;
  let slug = generateSlug(name);
  
  try {
    // Check slug uniqueness
    const existingSlug = await db.prepare('SELECT id FROM businesses WHERE slug = ?').bind(slug).first();
    if (existingSlug) {
      slug = `${slug}-${Math.random().toString(36).substring(2, 6)}`;
    }

    const businessId = crypto.randomUUID();

    // 1. Create Business
    await db.prepare(`
      INSERT INTO businesses (id, owner_user_id, name, slug, phone, address, city, description) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(businessId, user.userId, name, slug, phone || null, address || null, city || null, description || null).run();

    // 2. Add owner to business_members
    await db.prepare(`
      INSERT INTO business_members (business_id, user_id, role_id) 
      VALUES (?, ?, 'role-owner')
    `).bind(businessId, user.userId).run();

    return c.json({
      success: true,
      message: 'Usaha berhasil didaftarkan.',
      data: { id: businessId, name, slug }
    }, 201);
  } catch (error: any) {
    return c.json({ success: false, message: 'Gagal mendaftar usaha.', error: error.message }, 500);
  }
});

// List businesses user belongs to
businessRoutes.get('/', async (c) => {
  const user = c.get('user');
  const db = c.env.DB;
  
  try {
    const { results } = await db.prepare(`
      SELECT b.*, r.name as role_name 
      FROM business_members bm
      JOIN businesses b ON b.id = bm.business_id
      JOIN roles r ON r.id = bm.role_id
      WHERE bm.user_id = ? AND bm.status = 'active'
    `).bind(user.userId).all();
    
    return c.json({ success: true, data: results });
  } catch (error: any) {
    return c.json({ success: false, message: 'Gagal mengambil data usaha.' }, 500);
  }
});

// 2.5 API: Get Business Profile (Requires Tenant Context)
businessRoutes.get('/:id', tenantMiddleware, async (c) => {
  const businessId = c.req.param('id');
  
  if (businessId !== c.get('businessId')) {
    return c.json({ success: false, message: 'ID Usaha tidak cocok dengan konteks.' }, 403);
  }

  const db = c.env.DB;
  
  try {
    const business = await db.prepare('SELECT * FROM businesses WHERE id = ?').bind(businessId).first();
    if (!business) return c.json({ success: false, message: 'Usaha tidak ditemukan.' }, 404);
    
    return c.json({ success: true, data: business });
  } catch (error: any) {
    return c.json({ success: false, message: 'Gagal mengambil data usaha.' }, 500);
  }
});

// 2.5 API: Update Business Profile (Owner/Admin only)
businessRoutes.put('/:id', tenantMiddleware, roleMiddleware('owner', 'admin'), async (c) => {
  const businessId = c.req.param('id');
  const body = await c.req.json();
  const { name, phone, address, city, description } = body;
  
  if (businessId !== c.get('businessId')) {
    return c.json({ success: false, message: 'ID Usaha tidak cocok dengan konteks.' }, 403);
  }

  const db = c.env.DB;
  try {
    await db.prepare(`
      UPDATE businesses 
      SET name = ?, phone = ?, address = ?, city = ?, description = ?, updated_at = datetime('now')
      WHERE id = ?
    `).bind(name, phone || null, address || null, city || null, description || null, businessId).run();
    
    return c.json({ success: true, message: 'Profil usaha diperbarui.' });
  } catch (error: any) {
    return c.json({ success: false, message: 'Gagal memperbarui usaha.' }, 500);
  }
});

// 2.6 API: List Members (Admin/Owner)
businessRoutes.get('/:id/members', tenantMiddleware, roleMiddleware('owner', 'admin'), async (c) => {
  const businessId = c.get('businessId');
  const db = c.env.DB;
  
  try {
    const { results } = await db.prepare(`
      SELECT bm.id as member_id, bm.status, u.id as user_id, u.name, u.email, u.phone, r.name as role_name
      FROM business_members bm
      JOIN users u ON u.id = bm.user_id
      JOIN roles r ON r.id = bm.role_id
      WHERE bm.business_id = ?
    `).bind(businessId).all();
    
    return c.json({ success: true, data: results });
  } catch (error: any) {
    return c.json({ success: false, message: 'Gagal mengambil data anggota.' }, 500);
  }
});

// 2.6 & 2.7 API: Add Member (Owner only)
businessRoutes.post('/:id/members', tenantMiddleware, roleMiddleware('owner'), async (c) => {
  const businessId = c.get('businessId');
  const body = await c.req.json();
  const { name, email, role_name, password, phone } = body;
  
  const err = validateRequired(body, ['name', 'email', 'role_name', 'password']);
  if (err) return c.json({ success: false, message: err }, 400);

  const db = c.env.DB;
  
  try {
    // Resolve role_id
    let roleId = 'role-sales';
    if (role_name === 'admin') roleId = 'role-admin';
    if (role_name === 'owner') roleId = 'role-owner';

    // 1. Check if user already exists globally
    let user = await db.prepare('SELECT id FROM users WHERE email = ?').bind(email).first();
    
    if (!user) {
      // Create new user
      const userId = crypto.randomUUID();
      const password_hash = hashSync(password, 10);
      
      await db.prepare(
        'INSERT INTO users (id, name, email, password_hash, phone) VALUES (?, ?, ?, ?, ?)'
      ).bind(userId, name, email, password_hash, phone || null).run();
      
      user = { id: userId };
    }

    // 2. Add to business members
    const existingMember = await db.prepare('SELECT id FROM business_members WHERE business_id = ? AND user_id = ?')
      .bind(businessId, user.id).first();
      
    if (existingMember) {
      return c.json({ success: false, message: 'Pengguna sudah menjadi anggota di usaha ini.' }, 400);
    }

    await db.prepare(`
      INSERT INTO business_members (business_id, user_id, role_id) 
      VALUES (?, ?, ?)
    `).bind(businessId, user.id, roleId).run();

    return c.json({ success: true, message: 'Anggota berhasil ditambahkan.' }, 201);
  } catch (error: any) {
    return c.json({ success: false, message: 'Gagal menambahkan anggota.', error: error.message }, 500);
  }
});

// 2.6 API: Update Member Role/Status (Owner only)
businessRoutes.put('/:id/members/:memberId', tenantMiddleware, roleMiddleware('owner'), async (c) => {
    const businessId = c.get('businessId');
    const memberId = c.req.param('memberId');
    const body = await c.req.json();
    const { role_name, status } = body;
    
    const db = c.env.DB;
    try {
        if (role_name) {
            let roleId = 'role-sales';
            if (role_name === 'admin') roleId = 'role-admin';
            if (role_name === 'owner') roleId = 'role-owner';
            
            await db.prepare('UPDATE business_members SET role_id = ? WHERE id = ? AND business_id = ?')
                .bind(roleId, memberId, businessId).run();
        }
        
        if (status) {
             await db.prepare('UPDATE business_members SET status = ? WHERE id = ? AND business_id = ?')
                .bind(status, memberId, businessId).run();
        }

        return c.json({ success: true, message: 'Data anggota diperbarui.' });
    } catch (error: any) {
        return c.json({ success: false, message: 'Gagal memperbarui anggota.' }, 500);
    }
});
