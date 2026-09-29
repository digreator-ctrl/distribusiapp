import { Context, Next } from 'hono';
import type { Env } from '../types';

/**
 * Tenant middleware — Resolves business context from header or query
 * Ensures user has access to the requested business
 * Sets businessId and role in context
 */
export const tenantMiddleware = async (c: Context<{ Bindings: Env }>, next: Next) => {
  const user = c.get('user');

  if (!user) {
    return c.json(
      {
        success: false,
        error: 'Unauthorized',
        message: 'Autentikasi diperlukan.',
      },
      401
    );
  }

  // Get business ID from header or query param
  const businessId =
    c.req.header('X-Business-Id') || c.req.query('businessId');

  if (!businessId) {
    return c.json(
      {
        success: false,
        error: 'Bad Request',
        message: 'Business ID diperlukan. Kirim via header X-Business-Id.',
      },
      400
    );
  }

  try {
    // Verify user is a member of this business
    const member = await c.env.DB.prepare(
      `SELECT bm.id, bm.status, r.name as role_name
       FROM business_members bm
       JOIN roles r ON r.id = bm.role_id
       WHERE bm.business_id = ? AND bm.user_id = ? AND bm.status = 'active'`
    )
      .bind(businessId, user.userId)
      .first();

    if (!member) {
      return c.json(
        {
          success: false,
          error: 'Forbidden',
          message: 'Anda tidak memiliki akses ke usaha ini.',
        },
        403
      );
    }

    c.set('businessId', businessId);
    c.set('role', member.role_name as string);

    await next();
  } catch (error) {
    return c.json(
      {
        success: false,
        error: 'Internal Server Error',
        message: 'Gagal memverifikasi akses usaha.',
      },
      500
    );
  }
};
