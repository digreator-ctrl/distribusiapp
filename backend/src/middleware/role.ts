import { Context, Next } from 'hono';
import type { Env } from '../types';

/**
 * Role middleware factory — Restricts route access to specific roles
 * Must be used AFTER authMiddleware and tenantMiddleware
 *
 * Usage:
 *   app.get('/admin-only', roleMiddleware('admin', 'owner'), handler)
 *   app.get('/owner-only', roleMiddleware('owner'), handler)
 */
export const roleMiddleware = (...allowedRoles: string[]) => {
  return async (c: Context<{ Bindings: Env }>, next: Next) => {
    const role = c.get('role');

    if (!role) {
      return c.json(
        {
          success: false,
          error: 'Forbidden',
          message: 'Role tidak ditemukan. Pastikan autentikasi berhasil.',
        },
        403
      );
    }

    if (!allowedRoles.includes(role)) {
      return c.json(
        {
          success: false,
          error: 'Forbidden',
          message: `Akses ditolak. Hanya role ${allowedRoles.join(', ')} yang dapat mengakses fitur ini.`,
        },
        403
      );
    }

    await next();
  };
};
