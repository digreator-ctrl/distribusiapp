import { Authenticated, Refine } from '@refinedev/core';
import routerProvider, {
  CatchAllNavigate,
  DocumentTitleHandler,
  UnsavedChangesNotifier,
} from '@refinedev/react-router';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

import { dataProvider } from './providers/dataProvider';
import { authProvider } from './providers/authProvider';

import { AppLayout } from './components/layout/AppLayout';
import { Login } from './pages/auth/Login';
import { Register } from './pages/auth/Register';
import { Onboarding } from './pages/onboarding/Onboarding';
import { Dashboard } from './pages/dashboard/Dashboard';
import { UserList } from './pages/users/UserList';

import { ProductList } from './pages/products/ProductList';
import { ProductCreate } from './pages/products/ProductCreate';
import { CategoryList } from './pages/categories/CategoryList';
import { SupplierList } from './pages/suppliers/SupplierList';

// Phase 4
import { InventoryList } from './pages/inventory/InventoryList';
import { MovementList } from './pages/inventory/MovementList';
import { ProductionCreate } from './pages/production/ProductionCreate';
import { ReceiptCreate } from './pages/receipts/ReceiptCreate';

// Phase 5
import { AgentList } from './pages/agents/AgentList';
import { AgentShow } from './pages/agents/AgentShow';
import { AgentOrderList } from './pages/agent-orders/AgentOrderList';
import { AgentOrderCreate } from './pages/agent-orders/AgentOrderCreate';
import { AgentOrderShow } from './pages/agent-orders/AgentOrderShow';

// Phase 6
import { SalesList } from './pages/sales/SalesList';
import { StoreList } from './pages/stores/StoreList';
import { StoreShow } from './pages/stores/StoreShow';
import { DistributionCreate } from './pages/distributions/DistributionCreate';
import { SalesVisitList } from './pages/sales-visits/SalesVisitList';
import { SalesVisitCreate } from './pages/sales-visits/SalesVisitCreate';

// Phase 7
import { DisplayList } from './pages/displays/DisplayList';
import { DisplayShow } from './pages/displays/DisplayShow';
import { ReturnList } from './pages/returns/ReturnList';
import { ReturnCreate } from './pages/returns/ReturnCreate';
import { ReturnShow } from './pages/returns/ReturnShow';

// Phase 8
import { ReportList } from './pages/reports/ReportList';
import { Settings } from './pages/settings/Settings';

import { ErrorBoundary } from './components/ErrorBoundary';
import './index.css';

function App() {
  return (
    <BrowserRouter>
      <Refine
        dataProvider={dataProvider}
        authProvider={authProvider}
        routerProvider={routerProvider}
        resources={[
          {
            name: "dashboard",
            list: "/",
          },
          {
            name: "users",
            list: "/users",
          },
          {
            name: "products",
            list: "/products",
            create: "/products/create",
          },
          {
            name: "product_categories",
            list: "/categories",
          },
          {
            name: "suppliers",
            list: "/suppliers",
          },
          {
            name: "inventory",
            list: "/inventory",
          },
          {
            name: "production",
            create: "/production/create",
          },
          {
            name: "receipts",
            create: "/receipts/create",
          },
          {
            name: "agents",
            list: "/agents",
            show: "/agents/:id",
          },
          {
            name: "agent_orders",
            list: "/agent-orders",
            create: "/agent-orders/create",
            show: "/agent-orders/:id",
          },
          {
            name: "stores",
            list: "/stores",
            show: "/stores/:id",
          },
          {
            name: "sales",
            list: "/sales",
          },
          {
            name: "distributions",
            create: "/distributions/create",
          },
          {
            name: "sales_visits",
            list: "/sales-visits",
            create: "/sales-visits/create",
          },
          {
            name: "displays",
            list: "/displays",
            show: "/displays/:id",
          },
          {
            name: "returns",
            list: "/returns",
            create: "/returns/create",
            show: "/returns/:id",
          },
          {
            name: "reports",
            list: "/reports",
          },
          {
            name: "settings",
            list: "/settings",
          }
        ]}
        options={{
          syncWithLocation: true,
          warnWhenUnsavedChanges: true,
          projectId: 'distribusi-app',
        }}
      >
        <Routes>
          {/* Public Auth Pages */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/onboarding" element={<Onboarding />} />

          {/* Authenticated Routes */}
          <Route
            element={
              <Authenticated
                key="authenticated-layout"
                fallback={<CatchAllNavigate to="/login" />}
              >
                <ErrorBoundary>
                  <AppLayout />
                </ErrorBoundary>
              </Authenticated>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="/users" element={<UserList />} />
            
            {/* Phase 3 UI */}
            <Route path="/products">
               <Route index element={<ProductList />} />
               <Route path="create" element={<ProductCreate />} />
            </Route>
            <Route path="/categories" element={<CategoryList />} />
            <Route path="/suppliers" element={<SupplierList />} />
            
            {/* Phase 4 UI */}
            <Route path="/inventory">
               <Route index element={<InventoryList />} />
               <Route path="movements" element={<MovementList />} />
            </Route>
            <Route path="/production/create" element={<ProductionCreate />} />
            <Route path="/receipts/create" element={<ReceiptCreate />} />
            
            {/* Phase 5 UI */}
            <Route path="/agents">
               <Route index element={<AgentList />} />
               <Route path=":id" element={<AgentShow />} />
            </Route>
            <Route path="/agent-orders">
               <Route index element={<AgentOrderList />} />
               <Route path="create" element={<AgentOrderCreate />} />
               <Route path=":id" element={<AgentOrderShow />} />
            </Route>

            {/* Phase 6 UI */}
            <Route path="/sales" element={<SalesList />} />
            <Route path="/stores">
              <Route index element={<StoreList />} />
              <Route path=":id" element={<StoreShow />} />
            </Route>
            <Route path="/distributions/create" element={<DistributionCreate />} />
            <Route path="/sales-visits">
              <Route index element={<SalesVisitList />} />
              <Route path="create" element={<SalesVisitCreate />} />
            </Route>

            {/* Phase 7 UI */}
            <Route path="/displays">
              <Route index element={<DisplayList />} />
              <Route path=":id" element={<DisplayShow />} />
            </Route>
            <Route path="/returns">
              <Route index element={<ReturnList />} />
              <Route path="create" element={<ReturnCreate />} />
              <Route path=":id" element={<ReturnShow />} />
            </Route>

            {/* Phase 8 UI */}
            <Route path="/reports" element={<ReportList />} />
            <Route path="/settings" element={<Settings />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<CatchAllNavigate to="/" />} />
        </Routes>

        <UnsavedChangesNotifier />
        <DocumentTitleHandler />
      </Refine>
    </BrowserRouter>
  );
}

export default App;
