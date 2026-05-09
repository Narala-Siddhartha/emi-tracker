import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AuthProvider } from "./context/AuthContext";
import { EMIProvider }  from "./context/EMIContext";
import ProtectedRoute, { PublicRoute } from "./components/common/ProtectedRoute";
import AppLayout from "./components/layout/AppLayout";
import LoginPage    from "./pages/auth/LoginPage";
import RegisterPage from "./pages/auth/RegisterPage";

const DashboardPage = React.lazy(() => import("./pages/dashboard/DashboardPage"));
const EMIsPage      = React.lazy(() => import("./pages/emis/EMIsPage"));
const AnalyticsPage = React.lazy(() => import("./pages/dashboard/AnalyticsPage"));

const PageLoader = () => (
  <div style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
    <div style={{ width: 36, height: 36, borderRadius: "50%", border: "3px solid var(--border)", borderTopColor: "var(--accent)", animation: "spin 0.8s linear infinite" }} />
    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
  </div>
);

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <EMIProvider>
          <Toaster position="top-right"
            toastOptions={{
              style: { background: "var(--bg-card)", color: "var(--text-primary)", border: "1px solid var(--border)", fontFamily: "'Cabinet Grotesk', sans-serif", fontSize: "14px" },
              success: { iconTheme: { primary: "#10b981", secondary: "white" } },
              error:   { iconTheme: { primary: "#ef4444", secondary: "white" } },
            }}
          />
          <Routes>
            <Route path="/login"    element={<PublicRoute><LoginPage /></PublicRoute>} />
            <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />
            <Route path="/dashboard" element={<ProtectedRoute><AppLayout><React.Suspense fallback={<PageLoader />}><DashboardPage /></React.Suspense></AppLayout></ProtectedRoute>} />
            <Route path="/emis"      element={<ProtectedRoute><AppLayout><React.Suspense fallback={<PageLoader />}><EMIsPage /></React.Suspense></AppLayout></ProtectedRoute>} />
            <Route path="/analytics" element={<ProtectedRoute><AppLayout><React.Suspense fallback={<PageLoader />}><AnalyticsPage /></React.Suspense></AppLayout></ProtectedRoute>} />
            <Route path="/"  element={<Navigate to="/dashboard" replace />} />
            <Route path="*"  element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </EMIProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
