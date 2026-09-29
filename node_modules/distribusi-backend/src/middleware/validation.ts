import { Context, Next } from 'hono';
import type { Env } from '../types';

/**
 * Validation helpers for request body validation
 */

// Check required fields in request body
export const validateRequired = (body: Record<string, unknown>, fields: string[]): string | null => {
  for (const field of fields) {
    if (body[field] === undefined || body[field] === null || body[field] === '') {
      return `Field '${field}' wajib diisi.`;
    }
  }
  return null;
};

// Validate email format
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Validate phone format (Indonesia)
export const validatePhone = (phone: string): boolean => {
  const phoneRegex = /^(\+62|62|0)[0-9]{8,13}$/;
  return phoneRegex.test(phone.replace(/[\s-]/g, ''));
};

// Sanitize string input
export const sanitize = (input: string): string => {
  return input.trim().replace(/[<>]/g, '');
};

// Generate slug from string
export const generateSlug = (text: string): string => {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/[\s]+/g, '-')
    .replace(/-+/g, '-')
    .trim();
};

// Parse pagination params from query string
export const parsePagination = (c: Context<{ Bindings: Env }>) => {
  const page = Math.max(1, parseInt(c.req.query('page') || '1'));
  const limit = Math.min(100, Math.max(1, parseInt(c.req.query('limit') || '20')));
  const search = c.req.query('search') || '';
  const sortBy = c.req.query('sortBy') || 'created_at';
  const sortOrder = (c.req.query('sortOrder') || 'desc') as 'asc' | 'desc';

  return {
    page,
    limit,
    offset: (page - 1) * limit,
    search,
    sortBy,
    sortOrder,
  };
};

// Generate unique number with prefix (e.g., PRD-20260929-001)
export const generateNumber = (prefix: string): string => {
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}-${dateStr}-${random}`;
};
