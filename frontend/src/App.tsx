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
            name: "stores",
            list: "/stores",
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
                <AppLayout />
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
            
            {/* Placeholders for upcoming phases */}
            <Route path="/stores" element={<div className="p-4">Halaman Toko & Konsinyasi (Fase 6)</div>} />
            <Route path="/settings" element={<div className="p-4">Halaman Pengaturan (Fase 8)</div>} />
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
