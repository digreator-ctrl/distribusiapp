import { Context, Next } from 'hono';
import { jwtVerify } from 'jose';
import type { Env, JWTPayload } from '../types';

// Extend Hono context with auth data
declare module 'hono' {
  interface ContextVariableMap {
    user: JWTPayload;
    businessId: string;
    role: string;
  }
}

/**
 * Auth middleware — Validates JWT token from Authorization header
 * Sets user info in context for downstream handlers
 */
export const authMiddleware = async (c: Context<{ Bindings: Env }>, next: Next) => {
  const authHeader = c.req.header('Authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json(
      {
        success: false,
        error: 'Unauthorized',
        message: 'Token tidak ditemukan. Silakan login terlebih dahulu.',
      },
      401
    );
  }

  const token = authHeader.substring(7);

  try {
    const secret = new TextEncoder().encode(c.env.JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);

    const user: JWTPayload = {
      userId: payload.userId as string,
      email: payload.email as string,
      name: payload.name as string,
    };

    c.set('user', user);
    await next();
  } catch (error) {
    return c.json(
      {
        success: false,
        error: 'Unauthorized',
        message: 'Token tidak valid atau sudah expired.',
      },
      401
    );
  }
};
