import { Routes, Route, Navigate } from "react-router-dom";
import AppLayout from "./components/layout/AppLayout.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import RegisterPage from "./pages/RegisterPage.jsx";
import DashboardPage from "./pages/DashboardPage.jsx";
import PropertiesPage from "./pages/PropertiesPage.jsx";
import ContractsPage from "./pages/ContractsPage.jsx";
import TenantDashboardPage from "./pages/TenantDashboardPage.jsx";
import TenantContractPage from "./pages/TenantContractPage.jsx";
import { FinancesPage } from "./pages/PlaceholderPages.jsx";
import { useAuthStore } from "./store/authStore.js";

function RoleRedirect() {
  const { user } = useAuthStore();
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to="/dashboard" replace />;
}

export default function App() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/login"    element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* ── Bailleur / Admin ── */}
      <Route path="/*" element={
        <ProtectedRoute allowedRoles={["bailleur", "admin"]}>
          <AppLayout>
            <Routes>
              <Route path="dashboard"  element={<DashboardPage />} />
              <Route path="properties" element={<PropertiesPage />} />
              <Route path="contracts"  element={<ContractsPage />} />
              <Route path="finances"   element={<FinancesPage />} />
              <Route path="*"          element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </AppLayout>
        </ProtectedRoute>
      } />

      {/* ── Locataire ── */}
      <Route path="/tenant/*" element={
        <ProtectedRoute allowedRoles={["locataire"]}>
          <AppLayout>
            <Routes>
              <Route path="dashboard"   element={<TenantDashboardPage />} />
              <Route path="mon-contrat" element={<TenantContractPage />} />
              <Route path="*"           element={<Navigate to="/tenant/dashboard" replace />} />
            </Routes>
          </AppLayout>
        </ProtectedRoute>
      } />

      <Route path="/" element={<RoleRedirect />} />
    </Routes>
  );
}
