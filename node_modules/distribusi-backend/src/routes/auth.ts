import { Hono } from 'hono';
import { SignJWT } from 'jose';
import { compareSync, hashSync } from 'bcrypt-ts';
import type { Env, JWTPayload } from '../types';
import { validateRequired, validateEmail } from '../middleware/validation';
import { authMiddleware } from '../middleware/auth';

export const authRoutes = new Hono<{ Bindings: Env }>();

// 2.1 API: Register
authRoutes.post('/register', async (c) => {
  const body = await c.req.json();
  const { name, email, password, phone } = body;

  const err = validateRequired(body, ['name', 'email', 'password']);
  if (err) return c.json({ success: false, message: err }, 400);

  if (!validateEmail(email)) {
    return c.json({ success: false, message: 'Format email tidak valid.' }, 400);
  }

  const db = c.env.DB;

  try {
    // Check if email exists
    const existing = await db.prepare('SELECT id FROM users WHERE email = ?').bind(email).first();
    if (existing) {
      return c.json({ success: false, message: 'Email sudah terdaftar.' }, 400);
    }

    const password_hash = hashSync(password, 10);
    const userId = crypto.randomUUID();

    await db.prepare(
      'INSERT INTO users (id, name, email, password_hash, phone) VALUES (?, ?, ?, ?, ?)'
    ).bind(userId, name, email, password_hash, phone || null).run();

    // Create JWT
    const payload: JWTPayload = { userId, email, name };
    const secret = new TextEncoder().encode(c.env.JWT_SECRET);
    const token = await new SignJWT(payload as any)
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime('7d')
      .sign(secret);

    return c.json({
      success: true,
      message: 'Registrasi berhasil',
      data: { token, user: { id: userId, name, email, phone } }
    }, 201);
  } catch (error: any) {
    return c.json({ success: false, message: 'Registrasi gagal.', error: error.message }, 500);
  }
});

// 2.2 API: Login
authRoutes.post('/login', async (c) => {
  const body = await c.req.json();
  const { email, password } = body;

  const err = validateRequired(body, ['email', 'password']);
  if (err) return c.json({ success: false, message: err }, 400);

  const db = c.env.DB;

  try {
    const user = await db.prepare('SELECT * FROM users WHERE email = ? AND status = \'active\'').bind(email).first();
    if (!user) {
      return c.json({ success: false, message: 'Email atau password salah.' }, 401);
    }

    const isValid = compareSync(password, user.password_hash as string);
    if (!isValid) {
      return c.json({ success: false, message: 'Email atau password salah.' }, 401);
    }

    // Check if user has a business
    const business = await db.prepare(`
      SELECT b.*, bm.role_id, r.name as role_name 
      FROM business_members bm
      JOIN businesses b ON b.id = bm.business_id
      JOIN roles r ON r.id = bm.role_id
      WHERE bm.user_id = ? AND bm.status = 'active' AND b.status = 'active'
      LIMIT 1
    `).bind(user.id).first();

    const payload: JWTPayload = { userId: user.id as string, email: user.email as string, name: user.name as string };
    const secret = new TextEncoder().encode(c.env.JWT_SECRET);
    const token = await new SignJWT(payload as any)
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime('7d')
      .sign(secret);

    return c.json({
      success: true,
      message: 'Login berhasil',
      data: {
        token,
        user: { id: user.id, name: user.name, email: user.email, phone: user.phone, avatar_url: user.avatar_url },
        business: business ? { id: business.id, name: business.name, slug: business.slug } : null,
        role: business ? business.role_name : null
      }
    });
  } catch (error: any) {
    return c.json({ success: false, message: 'Login gagal.', error: error.message }, 500);
  }
});

// Profile endpoints requiring auth
authRoutes.use('/*', authMiddleware);

// 2.3 API: Get Profile
authRoutes.get('/profile', async (c) => {
  const userPayload = c.get('user');
  const db = c.env.DB;
  
  try {
    const user = await db.prepare('SELECT id, name, email, phone, avatar_url, status, created_at FROM users WHERE id = ?').bind(userPayload.userId).first();
    
    // Get user's businesses
    const businesses = await db.prepare(`
      SELECT b.id, b.name, b.slug, r.name as role
      FROM business_members bm
      JOIN businesses b ON b.id = bm.business_id
      JOIN roles r ON r.id = bm.role_id
      WHERE bm.user_id = ? AND bm.status = 'active'
    `).bind(userPayload.userId).all();

    return c.json({
      success: true,
      data: {
        user,
        businesses: businesses.results
      }
    });
  } catch (error: any) {
    return c.json({ success: false, message: 'Gagal mengambil profil.' }, 500);
  }
});

// 2.3 API: Update Profile
authRoutes.put('/profile', async (c) => {
  const userPayload = c.get('user');
  const body = await c.req.json();
  const { name, phone } = body;
  
  const err = validateRequired(body, ['name']);
  if (err) return c.json({ success: false, message: err }, 400);

  const db = c.env.DB;
  
  try {
    await db.prepare('UPDATE users SET name = ?, phone = ?, updated_at = datetime(\'now\') WHERE id = ?')
      .bind(name, phone || null, userPayload.userId).run();
      
    return c.json({
      success: true,
      message: 'Profil berhasil diperbarui'
    });
  } catch (error: any) {
    return c.json({ success: false, message: 'Gagal memperbarui profil.' }, 500);
  }
});
