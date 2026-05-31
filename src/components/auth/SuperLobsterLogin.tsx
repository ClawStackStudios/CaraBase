import React, { useState } from 'react'
import { hashToken } from '../../lib/crypto'
import { getApiBaseUrl } from '../../config/apiConfig'
import { useAuth } from '../../hooks/useAuth'
import { BouncyBrand } from '../ui/BouncyBrand'
import { ArrowLeft, Key, Shield } from 'lucide-react'

interface SuperLobsterLoginProps {
  onSuccess: () => void
  onBack: () => void
}

const SuperLobsterLogin: React.FC<SuperLobsterLoginProps> = ({ onSuccess, onBack }) => {
  const { login } = useAuth()
  const [adminToken, setAdminToken] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleLogin = async () => {
    if (!adminToken.trim()) return

    setIsLoading(true)
    setError(null)

    try {
      const trimmedKey = adminToken.trim()
      const keyHash = await hashToken(trimmedKey)

      const lookupResponse = await fetch(`${getApiBaseUrl()}/api/auth/lookup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keyHash })
      })

      if (!lookupResponse.ok) {
        const errorData = await lookupResponse.json()
        throw new Error(errorData.error || 'Token not found')
      }

      const { uuid, username } = await lookupResponse.json()

      const tokenResponse = await fetch(`${getApiBaseUrl()}/api/auth/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'human',
          uuid,
          keyHash
        })
      })

      if (!tokenResponse.ok) {
        const errorData = await tokenResponse.json()
        throw new Error(errorData.error || 'Authentication failed')
      }

      const { token, data } = await tokenResponse.json()
      
      if (data.user.role !== 'superadmin') {
         throw new Error('Provided token lacks superadmin privileges')
      }

      login(username, uuid, token, 'human', data.user.role)
      setTimeout(() => onSuccess(), 0)
    } catch (err: any) {
      setError(err.message || 'Login failed')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="w-full max-w-sm mx-auto p-6 bg-[#0f1419] rounded-2xl shadow-2xl border-t-2 border-emerald-500 relative transition-colors duration-300">
      <button 
        onClick={onBack}
        className="absolute top-6 left-6 text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1 bg-transparent hover:bg-slate-800 py-1 px-2 rounded transition-colors"
      >
        <ArrowLeft className="w-3 h-3" /> Back
      </button>

      <div className="flex flex-col items-center mt-12 mb-8">
          <div className="w-16 h-16 bg-emerald-500/10 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/20 overflow-hidden border border-emerald-500/30">
            <Shield className="w-8 h-8 text-emerald-500" />
          </div>
        <div className="text-center mb-1 flex justify-center mt-4">
          <BouncyBrand variant="subtle" className="text-2xl justify-center tracking-tight text-white" />
        </div>
        <h1 className="text-xl font-bold text-white mt-2 tracking-tight">SuperLobster Login</h1>
        <p className="text-sm text-emerald-500/80 mt-1">Sovereign Data Policy Enforced</p>
      </div>

      <div className="mb-6">
            <div className="text-sm font-medium text-slate-300 mb-2">Admin Token</div>
            <input 
            type="password"
            placeholder="Enter Admin Token..."
            value={adminToken}
            onChange={(e) => setAdminToken(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleLogin() }}
            className="w-full px-4 py-3 border border-slate-700 bg-slate-900 text-slate-100 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500"
            />
      </div>

      {error && <div className="mb-4 text-xs font-medium text-rose-500 text-center">{error}</div>}

      <button
        onClick={handleLogin}
        disabled={isLoading || !adminToken.trim()}
        className="w-full py-3 bg-emerald-600 text-black rounded-lg font-bold text-sm shadow-md shadow-emerald-600/20 hover:shadow-emerald-600/40 hover:bg-emerald-500 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <Key className="w-4 h-4" /> 
        {isLoading ? 'Authenticating...' : 'Login With Admin Token'}
      </button>

    </div>
  )
}

export default SuperLobsterLogin
