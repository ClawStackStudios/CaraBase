import React, { useState } from 'react'
import { validateIdentityFile, hashToken } from '../../lib/crypto'
import { getApiBaseUrl } from '../../config/apiConfig'
import { useAuth } from '../../hooks/useAuth'
import { ArrowLeft, Lock, Upload, Key, FileText } from 'lucide-react'

type LoginMode = 'upload' | 'paste'

interface LoginFormProps {
  onSuccess: () => void
  onBack: () => void
}

const LoginForm: React.FC<LoginFormProps> = ({ onSuccess, onBack }) => {
  const { login } = useAuth()
  const [mode, setMode] = useState<LoginMode>('upload')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [pastedKey, setPastedKey] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleFileSelect = (file: File) => {
    if (!file.name.endsWith('.json')) {
      setError('Please select a .json identity file')
      setSelectedFile(null)
      return
    }
    setSelectedFile(file)
    setError(null)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.currentTarget.classList.add('bg-emerald-50')
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.currentTarget.classList.remove('bg-emerald-50')
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.currentTarget.classList.remove('bg-emerald-50')
    const files = e.dataTransfer.files
    if (files.length > 0) {
      handleFileSelect(files[0])
    }
  }

  const validateKeyFormat = (key: string): boolean => {
    const trimmed = key.trim()
    return trimmed.startsWith('hu-') && trimmed.length === 67
  }

  const handleLogin = async () => {
    if (mode === 'upload' && !selectedFile) return
    if (mode === 'paste' && !validateKeyFormat(pastedKey)) return

    setIsLoading(true)
    setError(null)

    try {
      if (mode === 'upload') {
        const text = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader()
          reader.onload = (e) => resolve(e.target?.result as string)
          reader.onerror = () => reject(new Error('Failed to read file'))
          reader.readAsText(selectedFile!)
        })

        const parsed = JSON.parse(text)
        const identity = validateIdentityFile(parsed)
        const keyHash = await hashToken(identity.token)

        const response = await fetch(`${getApiBaseUrl()}/api/auth/token`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'human',
            uuid: identity.uuid,
            keyHash
          })
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Login failed')
        }

        const { token } = await response.json()
        login(identity.username, identity.uuid, token, 'human')
        setTimeout(() => onSuccess(), 0)
      } else {
        const trimmedPastedKey = pastedKey.trim()
        const keyHash = await hashToken(trimmedPastedKey)

        const lookupResponse = await fetch(`${getApiBaseUrl()}/api/auth/lookup`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ keyHash })
        })

        if (!lookupResponse.ok) {
          const errorData = await lookupResponse.json()
          throw new Error(errorData.error || 'Key not found')
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

        const { token } = await tokenResponse.json()
        login(username, uuid, token, 'human')
        setTimeout(() => onSuccess(), 0)
      }
    } catch (err: any) {
      setError(err.message || 'Login failed')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="w-full max-w-sm mx-auto p-6 bg-white rounded-2xl shadow-xl border-t-2 border-emerald-500 relative">
      <button 
        onClick={onBack}
        className="absolute top-6 left-6 text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1 bg-transparent hover:bg-slate-50 py-1 px-2 rounded transition-colors"
      >
        <ArrowLeft className="w-3 h-3" /> Back to Home
      </button>

      <div className="flex flex-col items-center mt-12 mb-8">
        <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-rose-600 rounded-2xl flex items-center justify-center shadow-lg mb-4">
          <span className="text-3xl">🦞</span>
        </div>
        <div className="text-center">
            <h2 className="text-sm font-semibold text-slate-900 tracking-tight flex items-center gap-1 justify-center">
                Cara<span className="text-emerald-700">Base©™</span>
            </h2>
        </div>
        <h1 className="text-xl font-bold text-slate-900 mt-4 tracking-tight">Welcome Back</h1>
        <p className="text-sm text-slate-500 mt-1">Login with your CaraBase©™ identity</p>
      </div>

      <div className="flex rounded-md overflow-hidden bg-slate-100 mb-6 p-1 border border-slate-200">
        <button
          onClick={() => setMode('upload')}
          className={`flex-1 py-2 text-sm font-medium rounded transition-colors flex items-center justify-center gap-2 ${
            mode === 'upload' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
          }`}
        >
          <Upload className="w-4 h-4" /> Upload File
        </button>
        <button
          onClick={() => setMode('paste')}
          className={`flex-1 py-2 text-sm font-medium rounded transition-colors flex items-center justify-center gap-2 ${
             mode === 'paste' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
          }`}
        >
          <FileText className="w-4 h-4" /> Paste ClawKey™
        </button>
      </div>

      {mode === 'upload' && (
        <div className="mb-6">
            <div className="text-sm font-medium text-slate-900 mb-2">Your Identity File</div>
            <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => document.getElementById('identity-upload')?.click()}
                className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
                    selectedFile ? 'border-emerald-500 bg-emerald-50' : 'border-slate-300 hover:border-emerald-400 hover:bg-slate-50'
                }`}
            >
                <input
                    type="file"
                    id="identity-upload"
                    accept=".json"
                    className="hidden"
                    onChange={(e) => {
                        if (e.target.files && e.target.files.length > 0) {
                            handleFileSelect(e.target.files[0])
                        }
                    }}
                />
                
                {selectedFile ? (
                    <div className="text-emerald-700 font-medium text-sm flex items-center justify-center gap-2">
                        <FileText className="w-5 h-5" /> {selectedFile.name}
                    </div>
                ) : (
                    <div className="flex flex-col items-center">
                        <Upload className="w-6 h-6 text-slate-400 mb-2" />
                        <p className="text-sm font-medium text-slate-900 mb-1">Click to upload your identity file</p>
                        <p className="text-xs text-slate-500">.json files only</p>
                    </div>
                )}
            </div>

            <div className="mt-6 bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3">
                <Lock className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                <div>
                    <h3 className="text-xs font-semibold text-amber-800 mb-1">Can't find your identity file?</h3>
                    <p className="text-[11px] leading-relaxed text-amber-700">
                        Your identity file is the only way to access your account. If you've lost it, you'll need to create a new account.
                    </p>
                </div>
            </div>
        </div>
      )}

      {mode === 'paste' && (
        <div className="mb-6">
             <div className="text-sm font-medium text-slate-900 mb-2">ClawKey™</div>
             <input 
                type="password"
                placeholder="hu-..."
                value={pastedKey}
                onChange={(e) => setPastedKey(e.target.value)}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 mb-6"
             />

             <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 flex gap-3">
                 <div className="text-emerald-600 bg-white rounded-full p-0.5 shadow-sm">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                 </div>
                 <div>
                    <h3 className="text-xs font-semibold text-emerald-800 mb-1">One-Field Login</h3>
                    <p className="text-[11px] leading-relaxed text-emerald-700">
                        Your ClawKey™ is all you need to login. Advanced options are available for troubleshooting.
                    </p>
                 </div>
             </div>
             
             <button className="text-[11px] text-slate-500 mt-4 hover:text-slate-800 transition-colors">
                 Show Advanced Options (UUID/Username)
             </button>
        </div>
      )}

      {error && <div className="mb-4 text-xs font-medium text-rose-600 text-center">{error}</div>}

      <button
        onClick={handleLogin}
        disabled={isLoading || (mode === 'upload' && !selectedFile) || (mode === 'paste' && !validateKeyFormat(pastedKey))}
        className="w-full py-3 bg-gradient-to-br from-emerald-400 to-teal-500 text-white rounded-lg font-medium text-sm shadow-md shadow-emerald-500/20 hover:shadow-emerald-500/40 transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <Key className="w-4 h-4" /> 
        {isLoading ? 'Authenticating...' : (mode === 'upload' ? 'Login with Identity File' : 'Login with ClawKey™')}
      </button>

    </div>
  )

}

export default LoginForm
