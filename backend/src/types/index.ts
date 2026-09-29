// Backend Types — Environment bindings for Cloudflare Workers

export type Env = {
  DB: D1Database;
  STORAGE: R2Bucket;
  JWT_SECRET: string;
  CORS_ORIGIN: string;
};

// User payload stored in JWT
export type JWTPayload = {
  userId: string;
  email: string;
  name: string;
};

// Authenticated request context
export type AuthContext = {
  user: JWTPayload;
  businessId?: string;
  role?: string;
};

// API Response wrapper
export type ApiResponse<T = unknown> = {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
};

// Pagination params
export type PaginationParams = {
  page: number;
  limit: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
};
