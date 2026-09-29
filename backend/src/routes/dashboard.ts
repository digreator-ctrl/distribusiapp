import { Hono } from 'hono';
import type { Env } from '../types';
import { authMiddleware } from '../middleware/auth';
import { tenantMiddleware } from '../middleware/tenant';

export const dashboardRoutes = new Hono<{ Bindings: Env }>();
dashboardRoutes.use('/*', authMiddleware, tenantMiddleware);

// 8.1 & 8.2 Dashboard Owner / Admin
dashboardRoutes.get('/overview', async (c) => {
  const businessId = c.get('businessId');
  const user = c.get('user');

  // Dapatkan ringkasan umum
  const queries = {
    totalSales: c.env.DB.prepare('SELECT COUNT(*) as count FROM sales WHERE business_id = ?').bind(businessId),
    totalStores: c.env.DB.prepare('SELECT COUNT(*) as count FROM stores WHERE business_id = ?').bind(businessId),
    totalAgents: c.env.DB.prepare('SELECT COUNT(*) as count FROM agents WHERE business_id = ?').bind(businessId),
    pendingReturns: c.env.DB.prepare("SELECT COUNT(*) as count FROM returns WHERE business_id = ? AND status = 'pending'").bind(businessId),
    todayVisits: c.env.DB.prepare("SELECT COUNT(*) as count FROM sales_visits WHERE business_id = ? AND date(visit_date) = date('now')").bind(businessId),
    activeConsignments: c.env.DB.prepare("SELECT COUNT(*) as count FROM consignments WHERE business_id = ? AND status = 'active'").bind(businessId)
  };

  const results = await c.env.DB.batch([
    queries.totalSales,
    queries.totalStores,
    queries.totalAgents,
    queries.pendingReturns,
    queries.todayVisits,
    queries.activeConsignments
  ]);

  return c.json({
    success: true,
    data: {
      total_sales: results[0].results[0].count,
      total_stores: results[1].results[0].count,
      total_agents: results[2].results[0].count,
      pending_returns: results[3].results[0].count,
      today_visits: results[4].results[0].count,
      active_consignments: results[5].results[0].count,
    }
  });
});

// 8.3 Dashboard Sales
dashboardRoutes.get('/sales', async (c) => {
  const businessId = c.get('businessId');
  const user = c.get('user');
  
  // Ambil sales_id dari user yang login (asumsi: user.id memiliki relasi ke sales)
  // Untuk demo, jika tidak dikirim dari FE, bisa diminta di param
  const salesId = c.req.query('sales_id');
  if (!salesId) return c.json({ success: false, message: 'Sales ID diperlukan' }, 400);

  // 1. Stok Saya (di lokasi bertipe sales dengan reference_id = salesId)
  const myStock = await c.env.DB.prepare(`
    SELECT p.name, sum(sb.quantity) as total_quantity
    FROM stock_balances sb
    JOIN stock_locations l ON l.id = sb.location_id
    JOIN products p ON p.id = sb.product_id
    WHERE l.type = 'sales' AND l.reference_id = ? AND l.business_id = ?
    GROUP BY p.id
  `).bind(salesId, businessId).all();

  // 2. Kunjungan Hari Ini
  const todayVisits = await c.env.DB.prepare(`
    SELECT v.*, s.name as store_name
    FROM sales_visits v
    JOIN stores s ON s.id = v.store_id
    WHERE v.sales_id = ? AND date(v.visit_date) = date('now')
  `).bind(salesId).all();

  return c.json({
    success: true,
    data: {
      my_stock: myStock.results,
      today_visits: todayVisits.results
    }
  });
});
