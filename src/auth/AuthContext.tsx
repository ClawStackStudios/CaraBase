import React, { createContext, useState, useEffect, ReactNode } from 'react'
import { safeGetItem, safeSetItem, safeRemoveItem } from '../lib/storage'

export interface AuthContextType {
  isAuthenticated: boolean
  username: string | null
  userUuid: string | null
  keyType: 'human' | 'agent' | null
  apiToken: string | null
  role: 'viewer' | 'admin' | 'superadmin' | null
  login: (username: string, uuid: string, token: string, keyType: 'human' | 'agent', role?: 'viewer' | 'admin' | 'superadmin') => void
  logout: () => void
}

export const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return !!safeGetItem('cb_api_token')
  })
  const [username, setUsername] = useState<string | null>(() => {
    return safeGetItem('cb_username')
  })
  const [userUuid, setUserUuid] = useState<string | null>(() => {
    return safeGetItem('cb_user_uuid')
  })
  const [keyType, setKeyType] = useState<'human' | 'agent' | null>(() => {
    return safeGetItem('cb_key_type') as ('human' | 'agent' | null)
  })
  const [apiToken, setApiToken] = useState<string | null>(() => {
    return safeGetItem('cb_api_token')
  })
  const [role, setRole] = useState<'viewer' | 'admin' | 'superadmin' | null>(() => {
    return safeGetItem('cb_user_role') as ('viewer' | 'admin' | 'superadmin' | null) || null
  })

  // Keep an empty useEffect if needed, but not required for init now.
  useEffect(() => {}, [])

  const login = (username: string, uuid: string, token: string, keyType: 'human' | 'agent', userRole?: 'viewer' | 'admin' | 'superadmin') => {
    const finalRole = userRole || 'viewer'
    safeSetItem('cb_api_token', token)
    safeSetItem('cb_username', username)
    safeSetItem('cb_user_uuid', uuid)
    safeSetItem('cb_key_type', keyType)
    safeSetItem('cb_user_role', finalRole)

    setApiToken(token)
    setUsername(username)
    setUserUuid(uuid)
    setKeyType(keyType)
    setRole(finalRole)
    setIsAuthenticated(true)
  }

  const logout = () => {
    safeRemoveItem('cb_api_token')
    safeRemoveItem('cb_username')
    safeRemoveItem('cb_user_uuid')
    safeRemoveItem('cb_key_type')
    safeRemoveItem('cb_user_role')

    setApiToken(null)
    setUsername(null)
    setUserUuid(null)
    setKeyType(null)
    setRole(null)
    setIsAuthenticated(false)
  }

  return (
    <AuthContext.Provider value={{
      isAuthenticated,
      username,
      userUuid,
      keyType,
      apiToken,
      role,
      login,
      logout
    }}>
      {children}
    </AuthContext.Provider>
  )
}
