import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth()
  const location = useLocation()

  if (!isAuthenticated) {
    return <Navigate to="/" state={{ from: location }} replace />
  }

  return <>{children}</>
}
