/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout } from './components/Layout';
import { AuthProvider } from './auth/AuthContext';
import LandingPage from './pages/LandingPage';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import LoginForm from './components/auth/LoginForm';
import SetupWizard from './components/auth/SetupWizard';
import { useAuth } from './hooks/useAuth';
import { ThemeProvider } from './context/ThemeContext';
import { AdminProvider, useAdmin } from './features/admin/AdminContext';
import { AdminLogin } from './features/admin/AdminLogin';
import { AdminDashboard } from './features/admin/AdminDashboard';
import { AdminUserList } from './features/admin/AdminUserList';
import { AdminAuditLog } from './features/admin/AdminAuditLog';
import { Loader2 } from 'lucide-react';

function PublicLanding() {
  const { isAuthenticated } = useAuth();
  if (isAuthenticated) return <Navigate to="/dashboard" replace />;
  return <LandingPage />;
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AdminProvider>
          <BrowserRouter>
            <AppRoutes />
          </BrowserRouter>
        </AdminProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

import { useNavigate } from 'react-router-dom';

function AppRoutes() {
  const navigate = useNavigate();
  return (
    <Routes>
      <Route path="/" element={<PublicLanding />} />
      <Route path="/login" element={
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-4 transition-colors duration-300">
          <LoginForm onSuccess={() => navigate('/dashboard')} onBack={() => navigate('/')} />
        </div>
      } />
      <Route path="/setup" element={
        <SetupWizard onComplete={() => navigate('/dashboard')} />
      } />
      <Route path="/dashboard/*" element={
        <ProtectedRoute>
          <AppLayout />
        </ProtectedRoute>
      } />

      {/* SuperAdmin Routes */}
      <Route path="/admin" element={<AdminLogin />} />
      <Route path="/admin/dashboard" element={
        <AdminProtectedRoute><AdminDashboard /></AdminProtectedRoute>
      } />
      <Route path="/admin/users" element={
        <AdminProtectedRoute><AdminUserList /></AdminProtectedRoute>
      } />
      <Route path="/admin/audit" element={
        <AdminProtectedRoute><AdminAuditLog /></AdminProtectedRoute>
      } />
    </Routes>
  );
}

function AdminProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAdmin, isChecking } = useAdmin();

  if (isChecking) {
    return (
      <div className="min-h-screen bg-[#0f1419] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
      </div>
    );
  }

  if (!isAdmin) return <Navigate to="/admin" replace />;
  return <>{children}</>;
}

