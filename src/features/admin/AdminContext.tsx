/**
 * AdminContext.tsx — CaraBase©™
 *
 * State management for the SuperAdmin session.
 * Adapted from ClawChives SuperAdmin feature.
 *
 * Maintained by CrustAgent©™
 */

import React, { createContext, useContext, useState, useEffect } from 'react';

interface AdminContextType {
  isAdmin: boolean;
  isChecking: boolean;
  login: (token: string) => Promise<void>;
  logout: () => Promise<void>;
  verify: () => Promise<boolean>;
}

const AdminContext = createContext<AdminContextType | null>(null);

export function AdminProvider({ children }: { children: React.ReactNode }) {
  const [isAdmin, setIsAdmin] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  const verify = async () => {
    try {
      const res = await fetch('/api/admin/verify');
      const data = await res.json();
      setIsAdmin(data.success);
      return data.success;
    } catch {
      setIsAdmin(false);
      return false;
    } finally {
      setIsChecking(false);
    }
  };

  const login = async (token: string) => {
    // SHA-256 hash the token client-side before sending
    const encoder = new TextEncoder();
    const data = encoder.encode(token);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    const res = await fetch('/api/admin/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: hashHex })
    });

    const result = await res.json();
    if (result.success) {
      setIsAdmin(true);
    } else {
      throw new Error(result.error || 'Admin authentication failed');
    }
  };

  const logout = async () => {
    await fetch('/api/admin/logout', { method: 'POST' });
    setIsAdmin(false);
  };

  useEffect(() => {
    verify();
  }, []);

  return (
    <AdminContext.Provider value={{ isAdmin, isChecking, login, logout, verify }}>
      {children}
    </AdminContext.Provider>
  );
}

export function useAdmin() {
  const context = useContext(AdminContext);
  if (!context) throw new Error('useAdmin must be used within AdminProvider');
  return context;
}
