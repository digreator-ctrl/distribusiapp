import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { prettyJSON } from 'hono/pretty-json';
import type { Env } from './types';

// Import route modules
import { authRoutes } from './routes/auth';
import { businessRoutes } from './routes/businesses';
import { productRoutes } from './routes/products';
import { categoryRoutes } from './routes/categories';
import { unitRoutes } from './routes/units';
import { supplierRoutes } from './routes/suppliers';
import { uploadRoutes } from './routes/uploads';
import { locationRoutes } from './routes/locations';
import { batchRoutes } from './routes/batches';
import { inventoryRoutes } from './routes/inventory';
import { productionRoutes } from './routes/production';
import { receiptRoutes } from './routes/receipts';
import { agentRoutes } from './routes/agents';
import { agentOrderRoutes } from './routes/agent_orders';
import { salesRoutes } from './routes/sales';
import { storeRoutes } from './routes/stores';
import { distributionRoutes } from './routes/distributions';
import { salesVisitRoutes } from './routes/sales_visits';
import { consignmentRoutes } from './routes/consignments';
import { displayRoutes } from './routes/displays';
import { returnRoutes } from './routes/returns';
import { dashboardRoutes } from './routes/dashboard';
import { reportRoutes } from './routes/reports';

// Create Hono app with Env type
const app = new Hono<{ Bindings: Env }>();

// Global middleware
app.use('*', logger());
app.use('*', prettyJSON());
app.use(
  '/api/*',
  cors({
    origin: (origin, c) => {
      const allowed = c.env.CORS_ORIGIN || 'http://localhost:5173';
      return allowed;
    },
    allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
    maxAge: 86400,
  })
);

// Health check
app.get('/', (c) => {
  return c.json({
    success: true,
    message: 'DistribusiApp API is running',
    version: '0.1.0',
  });
});

app.get('/api/health', (c) => {
  return c.json({
    success: true,
    message: 'API is healthy',
    timestamp: new Date().toISOString(),
  });
});

// Mount route modules
app.route('/api/auth', authRoutes);
app.route('/api/businesses', businessRoutes);
app.route('/api/products', productRoutes);
app.route('/api/categories', categoryRoutes);
app.route('/api/units', unitRoutes);
app.route('/api/suppliers', supplierRoutes);
app.route('/api/uploads', uploadRoutes);
app.route('/api/locations', locationRoutes);
app.route('/api/batches', batchRoutes);
app.route('/api/inventory', inventoryRoutes);
app.route('/api/production', productionRoutes);
app.route('/api/receipts', receiptRoutes);
app.route('/api/agents', agentRoutes);
app.route('/api/agent_orders', agentOrderRoutes);
app.route('/api/sales', salesRoutes);
app.route('/api/stores', storeRoutes);
app.route('/api/distributions', distributionRoutes);
app.route('/api/sales_visits', salesVisitRoutes);
app.route('/api/consignments', consignmentRoutes);
app.route('/api/displays', displayRoutes);
app.route('/api/returns', returnRoutes);
app.route('/api/dashboard', dashboardRoutes);
app.route('/api/reports', reportRoutes);

// 404 handler
app.notFound((c) => {
  return c.json(
    {
      success: false,
      error: 'Not Found',
      message: `Route ${c.req.method} ${c.req.path} not found`,
    },
    404
  );
});

// Error handler
app.onError((err, c) => {
  console.error('Unhandled error:', err);
  return c.json(
    {
      success: false,
      error: 'Internal Server Error',
      message: err.message,
    },
    500
  );
});

export default app;
