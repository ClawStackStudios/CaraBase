/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout } from './components/Layout';
import { AuthProvider } from './auth/AuthContext';
import LandingPage from './pages/LandingPage';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import LoginForm from './components/auth/LoginForm';
import SetupWizard from './components/auth/SetupWizard';
import { useAuth } from './hooks/useAuth';
import { ThemeProvider } from './context/ThemeContext';

function PublicLanding() {
  const { isAuthenticated } = useAuth();
  if (isAuthenticated) return <Navigate to="/dashboard" replace />;
  return <LandingPage />;
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
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
    </Routes>
  );
}

