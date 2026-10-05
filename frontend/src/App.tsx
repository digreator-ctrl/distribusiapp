import { Refine, Authenticated } from "@refinedev/core";
import dataProvider from "@refinedev/simple-rest";
import { BrowserRouter, Route, Routes, Outlet, Navigate } from "react-router-dom";
import routerProvider, { CatchAllNavigate, NavigateToResource } from "@refinedev/react-router-v6";

import { authProvider } from "./providers/authProvider";
import { AppLayout } from "./components/layout/AppLayout";
import { ProductList } from "./pages/products/list";
import { ProductCreate } from "./pages/products/create";
import { ProductShow } from "./pages/products/show";
import { ProductEdit } from "./pages/products/edit";
import { InboundList } from "./pages/inbound/list";
import { InboundCreate } from "./pages/inbound/create";
import { InboundShow } from "./pages/inbound/show";
import { SupplierList } from "./pages/suppliers/list";
import { SupplierCreate } from "./pages/suppliers/create";
import { SupplierShow } from "./pages/suppliers/show";
import { SupplierEdit } from "./pages/suppliers/edit";
import { UserList } from "./pages/users/list";
import { UserCreate } from "./pages/users/create";
import { UserShow } from "./pages/users/show";
import { UserEdit } from "./pages/users/edit";
import { RbacList } from "./pages/rbac/list";
import { RbacCreate } from "./pages/rbac/create";
import { RbacShow } from "./pages/rbac/show";
import { StockRequestList } from "./pages/stock-requests/list";
import { StockRequestCreate } from "./pages/stock-requests/create";
import { StockRequestShow } from "./pages/stock-requests/show";
import { AgentList } from "./pages/agents/list";
import { AgentCreate } from "./pages/agents/create";
import { InventoryList } from "./pages/inventory/list";
import { SalesLayout } from "./components/layout/SalesLayout";
import { MobileVisit } from "./pages/sales/visit";
import { MobileOpname } from "./pages/sales/opname";
import { MobileAsset } from "./pages/sales/asset";

// Endpoint Hono lokal (Port default wrangler dev biasanya 8787)
const API_URL = "http://localhost:8787/api";

function App() {
  return (
    <BrowserRouter>
      <Refine
        routerProvider={routerProvider}
        dataProvider={dataProvider(API_URL)}
        authProvider={authProvider}
        resources={[
          {
            name: "dashboard",
            meta: { label: "Dashboard", group: "Utama" },
            list: "/",
          },
          {
            name: "products",
            meta: { label: "Katalog Produk", group: "Manajemen Stok" },
            list: "/products",
            create: "/products/create",
            show: "/products/:id",
            edit: "/products/:id/edit",
          },
          {
            name: "inbound_batches",
            meta: { label: "Inbound (Stok Masuk)", group: "Manajemen Stok" },
            list: "/inbound_batches",
            create: "/inbound_batches/create",
          },
          {
            name: "inventory",
            meta: { label: "Stok Gudang", group: "Manajemen Stok" },
            list: "/inventory",
          },
          {
            name: "stock-requests",
            meta: { label: "Distribusi & Approval", group: "Operasional Distribusi" },
            list: "/stock-requests",
            create: "/stock-requests/create",
            show: "/stock-requests/:id",
          },
          {
            name: "suppliers",
            meta: { label: "Supplier", group: "Mitra Bisnis" },
            list: "/suppliers",
            create: "/suppliers/create",
            show: "/suppliers/:id",
            edit: "/suppliers/:id/edit",
          },
          {
            name: "agents",
            meta: { label: "Agen", group: "Mitra Bisnis" },
            list: "/agents",
            create: "/agents/create",
          },
          {
            name: "users",
            meta: { label: "Karyawan", group: "Pengaturan" },
            list: "/users",
            create: "/users/create",
            show: "/users/:id",
            edit: "/users/:id/edit",
          },
          {
            name: "rbac",
            meta: { label: "RBAC", group: "Pengaturan" },
            list: "/rbac",
            create: "/rbac/create",
            show: "/rbac/:id",
          },
        ]}
      >
        <Routes>
          {/* Rute yang memerlukan login */}
          <Route
            element={
              <Authenticated key="authenticated-routes" fallback={<CatchAllNavigate to="/login" />}>
                <AppLayout />
              </Authenticated>
            }
          >
            <Route index element={
              <div className="bg-card p-8 rounded-2xl border shadow-sm">
                <h1 className="text-3xl font-bold tracking-tight">
                  Dashboard {localStorage.getItem("distribusi_role") === "owner" ? "Owner" : "Admin Gudang"}
                </h1>
                <p className="text-muted-foreground mt-2">Selamat datang di Sistem Manajemen Distribusi dan Konsinyasi.</p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
                  {/* Khusus Owner */}
                  {localStorage.getItem("distribusi_role") === "owner" && (
                    <div className="p-6 rounded-xl bg-purple-500/5 border border-purple-500/20 md:col-span-3">
                      <h3 className="text-purple-600 font-semibold mb-1">Ringkasan Keuangan (Bulan Ini)</h3>
                      <div className="flex justify-between items-end mt-2">
                        <p className="text-4xl font-black text-purple-700">Rp 145.500.000</p>
                        <p className="text-xs font-semibold bg-purple-100 text-purple-700 px-2 py-1 rounded-full border border-purple-200">Hak Akses: Eksekutif / Owner</p>
                      </div>
                    </div>
                  )}

                  {/* Operational Data (Admin & Owner) */}
                  <div className="p-6 rounded-xl bg-primary/5 border border-primary/20">
                    <h3 className="text-primary font-semibold mb-1">Total Produk Aktif</h3>
                    <p className="text-4xl font-black">24</p>
                  </div>
                  <div className="p-6 rounded-xl bg-blue-500/5 border border-blue-500/20">
                    <h3 className="text-blue-600 font-semibold mb-1">Stok Masuk (Hari Ini)</h3>
                    <p className="text-4xl font-black text-blue-700">1.250 <span className="text-sm font-normal">pcs</span></p>
                  </div>
                  <div className="p-6 rounded-xl bg-green-500/5 border border-green-500/20">
                    <h3 className="text-green-600 font-semibold mb-1">Pengiriman Berjalan</h3>
                    <p className="text-4xl font-black text-green-700">8 <span className="text-sm font-normal">rute</span></p>
                  </div>
                </div>
              </div>
            } />
            <Route path="/products" element={<ProductList />} />
            <Route path="/products/create" element={<ProductCreate />} />
            <Route path="/products/:id" element={<ProductShow />} />
            <Route path="/products/:id/edit" element={<ProductEdit />} />
            <Route path="/inbound_batches" element={<InboundList />} />
            <Route path="/inbound_batches/create" element={<InboundCreate />} />
            <Route path="/inbound_batches/:id" element={<InboundShow />} />
            <Route path="/suppliers" element={<SupplierList />} />
            <Route path="/suppliers/create" element={<SupplierCreate />} />
            <Route path="/suppliers/:id" element={<SupplierShow />} />
            <Route path="/suppliers/:id/edit" element={<SupplierEdit />} />
            <Route path="/users" element={<UserList />} />
            <Route path="/users/create" element={<UserCreate />} />
            <Route path="/users/:id" element={<UserShow />} />
            <Route path="/users/:id/edit" element={<UserEdit />} />
            <Route path="/rbac" element={<RbacList />} />
            <Route path="/rbac/create" element={<RbacCreate />} />
            <Route path="/rbac/:id" element={<RbacShow />} />
            <Route path="/stock-requests" element={<StockRequestList />} />
            <Route path="/stock-requests/create" element={<StockRequestCreate />} />
            <Route path="/stock-requests/:id" element={<StockRequestShow />} />
            <Route path="/agents" element={<AgentList />} />
            <Route path="/agents/create" element={<AgentCreate />} />
            <Route path="/inventory" element={<InventoryList />} />
          </Route>

          {/* Rute Aplikasi Sales (Mobile-first PWA) */}
          <Route
            path="/sales"
            element={
              <Authenticated key="authenticated-sales" fallback={<CatchAllNavigate to="/login" />}>
                <SalesLayout />
              </Authenticated>
            }
          >
            <Route index element={<MobileVisit />} />
            <Route path="opname" element={<MobileOpname />} />
            <Route path="asset" element={<MobileAsset />} />
            <Route path="stock-requests" element={<StockRequestList />} />
            <Route path="stock-requests/create" element={<StockRequestCreate />} />
            <Route path="stock-requests/:id" element={<StockRequestShow />} />
            <Route path="profile" element={
              <div className="bg-card p-6 rounded-xl border text-center shadow-sm">
                <div className="w-20 h-20 bg-primary/10 text-primary mx-auto rounded-full flex items-center justify-center text-2xl font-bold mb-4">S</div>
                <h2 className="font-bold text-xl">Andi (Sales)</h2>
                <p className="text-muted-foreground text-sm">Area: Jakarta Selatan</p>
                <div className="mt-6 flex justify-center gap-4">
                  <div className="text-center">
                    <p className="text-2xl font-black text-primary">12</p>
                    <p className="text-[10px] uppercase text-muted-foreground font-semibold tracking-wider">Kunjungan</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-black text-primary">100%</p>
                    <p className="text-[10px] uppercase text-muted-foreground font-semibold tracking-wider">Target</p>
                  </div>
                </div>
              </div>
            } />
          </Route>

          {/* Rute Halaman Login */}
          <Route
            element={
              <Authenticated key="auth-pages" fallback={<Outlet />}>
                <NavigateToResource />
              </Authenticated>
            }
          >
            <Route path="/login" element={
              <div className="min-h-screen bg-muted/30 flex flex-col items-center justify-center p-8">
                <div className="bg-card p-8 rounded-2xl shadow-xl border w-full max-w-sm text-center">
                  <h1 className="text-3xl font-black text-primary tracking-tight mb-2">Distribusi<span className="text-muted-foreground font-medium">App</span></h1>
                  <p className="text-muted-foreground text-sm mb-8">Masuk untuk mengelola sistem operasional Anda.</p>

                  <div className="space-y-3">
                    <button
                      onClick={() => {
                        localStorage.setItem("distribusi_token", "dummy");
                        localStorage.setItem("distribusi_role", "owner");
                        window.location.href = "/";
                      }}
                      className="w-full px-4 py-3 bg-blue-600 text-white font-semibold rounded-xl shadow-md hover:bg-blue-700 transition-all active:scale-[0.98]"
                    >
                      Masuk (Demo Owner)
                    </button>

                    <button
                      onClick={() => {
                        localStorage.setItem("distribusi_token", "dummy");
                        localStorage.setItem("distribusi_role", "admin");
                        window.location.href = "/";
                      }}
                      className="w-full px-4 py-3 bg-primary text-primary-foreground font-semibold rounded-xl shadow-md hover:bg-primary/90 transition-all active:scale-[0.98]"
                    >
                      Masuk (Demo Admin Gudang)
                    </button>

                    <button
                      onClick={() => {
                        // Bypass login untuk keperluan demonstrasi
                        localStorage.setItem("distribusi_token", "dummy");
                        localStorage.setItem("distribusi_role", "sales");
                        window.location.href = "/sales";
                      }}
                      className="w-full px-4 py-3 bg-muted text-foreground font-semibold rounded-xl border hover:bg-muted/80 transition-all active:scale-[0.98]"
                    >
                      Masuk (Demo Sales Mobile)
                    </button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-6">Versi SaaS Multi-tenant (v2.0)</p>
                </div>
              </div>
            } />
          </Route>

          <Route path="*" element={<CatchAllNavigate to="/login" />} />
        </Routes>
      </Refine>
    </BrowserRouter>
  );
}

export default App;
