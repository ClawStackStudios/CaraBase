import React, { useState } from 'react'
import { generateHumanKey, generateUUID, hashToken } from '../../lib/crypto'
import { getApiBaseUrl } from '../../config/apiConfig'
import { useAuth } from '../../hooks/useAuth'

type Step = 'welcome' | 'profile' | 'generating' | 'complete'

interface SetupWizardProps {
  onComplete: () => void
}

const SetupWizard: React.FC<SetupWizardProps> = ({ onComplete }) => {
  const { login } = useAuth()
  const [step, setStep] = useState<Step>('welcome')
  const [username, setUsername] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [generatedKey, setGeneratedKey] = useState<string | null>(null)
  const [generatedUUID, setGeneratedUUID] = useState<string | null>(null)
  const [hasDownloaded, setHasDownloaded] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [clipboardMessage, setClipboardMessage] = useState('')

  // Step 1: Welcome screen
  const renderWelcome = () => (
    <div className="max-w-md w-full mx-auto p-8 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border-t-2 border-emerald-500 dark:border-slate-800 transition-colors duration-300">
      <h1 className="text-3xl font-bold mb-6 text-slate-900 dark:text-slate-50 tracking-tight">Before we begin...</h1>
      <div className="space-y-5 text-slate-700 dark:text-slate-300 text-sm leading-relaxed">
        <p>
          <strong className="text-slate-900 dark:text-slate-100 font-semibold block mb-1">No password required.</strong> Your identity lives in a single, unique key file.
        </p>
        <p>
          <strong className="text-slate-900 dark:text-slate-100 font-semibold block mb-1">This file IS your account.</strong> Lose it, and your account is gone forever — there is no recovery.
        </p>
        <p>
          <strong className="text-slate-900 dark:text-slate-100 font-semibold block mb-1">Store it safely.</strong> Keep copies in secure locations (password manager, encrypted drive).
        </p>
        <p>
          <strong className="text-slate-900 dark:text-slate-100 font-semibold block mb-1">You are in control.</strong> No cloud, no accounts, no servers deciding your fate. Your key, your ocean.
        </p>
      </div>
      <button
        onClick={() => setStep('profile')}
        className="mt-8 w-full px-4 py-3 bg-gradient-to-br from-emerald-400 to-teal-500 text-white font-medium rounded-xl hover:shadow-lg hover:shadow-emerald-500/30 transition-all"
      >
        Get Started
      </button>
    </div>
  )

  // Step 2: Profile entry
  const renderProfile = () => (
    <div className="max-w-md w-full mx-auto p-8 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border-t-2 border-emerald-500 dark:border-slate-800 transition-colors duration-300">
      <h1 className="text-2xl font-bold mb-6 text-slate-900 dark:text-slate-50 tracking-tight">Create Your Identity</h1>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            Username <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
            placeholder="alice"
            className="w-full px-4 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            Display Name <span className="text-slate-400 font-normal">(optional)</span>
          </label>
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Alice"
            className="w-full px-4 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
          />
        </div>
      </div>

      <button
        onClick={() => handleGenerateKey()}
        disabled={username.trim() === '' || isProcessing}
        className="mt-8 w-full px-4 py-3 bg-gradient-to-br from-emerald-400 to-teal-500 text-white font-medium rounded-xl hover:shadow-lg hover:shadow-emerald-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none"
      >
        {isProcessing ? 'Generating...' : 'Generate Key'}
      </button>

      {error && <div className="mt-4 text-rose-500 text-sm font-medium text-center">{error}</div>}
    </div>
  )

  const handleGenerateKey = () => {
    setIsProcessing(true)
    setError(null)
    setStep('generating')
  }

  // Step 3: Generating spinner
  const renderGenerating = () => (
    <div className="max-w-md w-full mx-auto p-8 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border-t-2 border-emerald-500 dark:border-slate-800 text-center transition-colors duration-300">
      <div className="animate-spin inline-block w-12 h-12 border-4 border-emerald-100 dark:border-emerald-950/20 border-t-emerald-500 rounded-full mb-6"></div>
      <h1 className="text-2xl font-bold mb-3 text-slate-900 dark:text-slate-50 tracking-tight">Hatching your identity...</h1>
      <p className="text-slate-500 dark:text-slate-400 text-sm">Generating cryptographic keys from the chaos of randomness.</p>
    </div>
  )

  React.useEffect(() => {
    if (step === 'generating') {
      const timer = setTimeout(async () => {
        try {
          const key = generateHumanKey()
          const uuid = generateUUID()
          setGeneratedKey(key)
          setGeneratedUUID(uuid)
          setStep('complete')
        } catch (err: any) {
          setError(err.message)
          setStep('profile')
        } finally {
          setIsProcessing(false)
        }
      }, 1500)

      return () => clearTimeout(timer)
    }
  }, [step])

  // Step 4: Complete
  const renderComplete = () => (
    <div className="max-w-md w-full mx-auto p-8 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border-t-2 border-emerald-500 dark:border-slate-800 transition-colors duration-300">
      <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-950/40 rounded-full flex items-center justify-center mb-4 text-emerald-600 text-xl font-bold">✓</div>
      <h1 className="text-2xl font-bold mb-6 text-slate-900 dark:text-slate-50 tracking-tight">Identity Hatched!</h1>

      <div className="space-y-4 mb-8 bg-slate-50 dark:bg-slate-950 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-inner">
        <div>
          <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">Username</p>
          <p className="font-mono text-sm text-slate-800 dark:text-slate-200">{username}</p>
        </div>
        <div>
          <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1 flex justify-between items-center">
            <span>ClawKey</span>
            <span className="text-emerald-600">{clipboardMessage}</span>
          </p>
          <p className="font-mono text-xs text-slate-800 dark:text-slate-200 break-all leading-relaxed">
            {generatedKey}
          </p>
        </div>
        <div>
          <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">UUID</p>
          <p className="font-mono text-[11px] text-slate-600 dark:text-slate-400">{generatedUUID}</p>
        </div>
      </div>

      <div className="space-y-3">
        <button
          onClick={() => copyClawKey()}
          className="w-full px-4 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 font-medium rounded-xl transition-colors text-sm border border-slate-300 dark:border-slate-700 cursor-pointer"
        >
          Copy ClawKey
        </button>

        <button
          onClick={() => downloadIdentityFile()}
          className="w-full px-4 py-2.5 bg-slate-800 dark:bg-slate-950 text-white dark:text-slate-250 hover:bg-slate-900 dark:hover:bg-slate-900/80 font-medium rounded-xl transition-colors text-sm shadow-md cursor-pointer border-0"
        >
          Download Identity File
        </button>

        <button
          onClick={() => completeSetup()}
          disabled={!hasDownloaded || isProcessing}
          className="w-full px-4 py-3 bg-gradient-to-br from-emerald-400 to-teal-500 text-white font-medium rounded-xl transition-all shadow-md shadow-emerald-500/20 hover:shadow-emerald-500/40 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none cursor-pointer border-0"
        >
          {isProcessing ? 'Setting up...' : 'Complete Setup'}
        </button>
        
        <button
          onClick={onComplete}
          className="w-full px-4 py-2 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 text-sm font-medium pt-4 bg-transparent border-0 cursor-pointer"
        >
          Cancel & Back to Home
        </button>
      </div>

      {!hasDownloaded && (
        <p className="mt-4 text-xs font-medium text-amber-600 dark:text-amber-400 text-center bg-amber-50 dark:bg-amber-950/20 py-2 rounded-lg">
          Download the identity file before proceeding.
        </p>
      )}

      {error && <div className="mt-4 text-rose-500 text-sm text-center font-medium">{error}</div>}
    </div>
  )

  const copyClawKey = async () => {
    if (!generatedKey) return
    try {
      await navigator.clipboard.writeText(generatedKey)
      setClipboardMessage('Copied!')
      setTimeout(() => setClipboardMessage(''), 2000)
    } catch (err: any) {
      setError('Failed to copy to clipboard: ' + err.message)
    }
  }

  const downloadIdentityFile = () => {
    if (!generatedKey || !generatedUUID) return

    try {
      const identityFile = {
        username,
        uuid: generatedUUID,
        token: generatedKey,
        createdAt: new Date().toISOString()
      }

      const blob = new Blob([JSON.stringify(identityFile, null, 2)], {
        type: 'application/json'
      })

      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `carabase_identity_${username}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Failed to trigger download automatically', err)
      // Ignore download errors in iFrame environments
    } finally {
      // Unconditionally allow proceeding to next step
      setHasDownloaded(true)
    }
  }

  const completeSetup = async () => {
    if (!generatedKey || !generatedUUID || !hasDownloaded) return

    setIsProcessing(true)
    setError(null)

    try {
      const keyHash = await hashToken(generatedKey)

      const registerUrl = `${getApiBaseUrl()}/api/auth/register`
      const registerResponse = await fetch(registerUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uuid: generatedUUID,
          username,
          keyHash
        })
      })

      if (!registerResponse.ok) {
        const errorData = await registerResponse.json()
        throw new Error(errorData.error || 'Registration failed')
      }

      const tokenUrl = `${getApiBaseUrl()}/api/auth/token`
      const tokenResponse = await fetch(tokenUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'human',
          uuid: generatedUUID,
          keyHash
        })
      })

      if (!tokenResponse.ok) {
        const errorData = await tokenResponse.json()
        throw new Error(errorData.error || 'Token exchange failed')
      }

      const { token } = await tokenResponse.json()

      login(username, generatedUUID, token, 'human')

      setTimeout(() => onComplete(), 0)
    } catch (err: any) {
      setError(err.message || 'Setup failed. Check server connectivity.')
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-4 transition-colors duration-300">
      {step === 'welcome' && renderWelcome()}
      {step === 'profile' && renderProfile()}
      {step === 'generating' && renderGenerating()}
      {step === 'complete' && renderComplete()}
    </div>
  )
}

export default SetupWizard
