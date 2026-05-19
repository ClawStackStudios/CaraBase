/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout } from './components/Layout';
import { AuthProvider } from './auth/AuthContext';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import LoginForm from './components/auth/LoginForm';
import SetupWizard from './components/auth/SetupWizard';
import { useAuth } from './hooks/useAuth';
import { ThemeProvider } from './context/ThemeContext';

function PublicLanding() {
  const { isAuthenticated } = useAuth();
  
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4 transition-colors duration-300">
      <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-2xl shadow-xl border-t-2 border-emerald-500 dark:border-slate-800 p-8 text-center transition-colors duration-300">
        <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-rose-600 rounded-2xl flex items-center justify-center shadow-lg mx-auto mb-6">
          <span className="text-3xl">🦞</span>
        </div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-50 tracking-tight mb-2">CaraBase</h1>
        <p className="text-slate-500 dark:text-slate-400 mb-8">ClawStack Studios©™ Data Layer</p>
        
        <div className="space-y-4">
          <a href="/login" className="block w-full py-3 bg-gradient-to-br from-emerald-400 to-teal-500 text-white rounded-xl font-medium shadow-md shadow-emerald-500/20 hover:shadow-emerald-500/40 transition">
            Login with ClawKey
          </a>
          <a href="/setup" className="block w-full py-3 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-350 rounded-xl font-medium hover:bg-slate-200 dark:hover:bg-slate-700 transition">
            Hatch New Identity
          </a>
        </div>
      </div>
    </div>
  );
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

