import React, { useState } from 'react'
import { generateHumanKey, generateUUID, hashToken } from '../../lib/crypto'
import { getApiBaseUrl } from '../../config/apiConfig'
import { useAuth } from '../../hooks/useAuth'
import { 
  User, Shield, ArrowRight, Loader2, Copy, CheckCircle, 
  Download, Zap, Key, ArrowLeft 
} from 'lucide-react'
import { BouncyBrand } from '../ui/BouncyBrand'

type Step = 'hatching' | 'verification' | 'success'

interface SetupWizardProps {
  onComplete: () => void
}

const SetupWizard: React.FC<SetupWizardProps> = ({ onComplete }) => {
  const { login } = useAuth()
  const [step, setStep] = useState<Step>('hatching')
  const [username, setUsername] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [generatedKey, setGeneratedKey] = useState<string | null>(null)
  const [generatedUUID, setGeneratedUUID] = useState<string | null>(null)
  const [hasDownloaded, setHasDownloaded] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [copied, setCopied] = useState(false)

  const handleHatch = async () => {
    if (!username.trim()) return

    setIsProcessing(true)
    setError(null)

    // Simulate the loading time for visual feedback
    setTimeout(() => {
      try {
        const key = generateHumanKey()
        const uuid = generateUUID()
        setGeneratedKey(key)
        setGeneratedUUID(uuid)
        setHasDownloaded(false)
        setStep('verification')
      } catch (err: any) {
        setError(err.message || 'Failed to generate key')
      } finally {
        setIsProcessing(false)
      }
    }, 1200)
  }

  const copyKey = async () => {
    if (!generatedKey) return
    try {
      await navigator.clipboard.writeText(generatedKey)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err: any) {
      setError('Failed to copy to clipboard: ' + err.message)
    }
  }

  const downloadKey = () => {
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
    } finally {
      setHasDownloaded(true)
    }
  }

  const completeWizard = async () => {
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
          displayName: displayName.trim() || undefined,
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

      setStep('success')
      setTimeout(() => onComplete(), 2000)
    } catch (err: any) {
      setError(err.message || 'Setup failed. Check server connectivity.')
      setIsProcessing(false)
    }
  }

  return (
    <div className="bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-50 antialiased min-h-screen flex flex-col overflow-auto transition-colors duration-300">
      <div className="flex-1 flex items-center justify-center p-4 overflow-auto">
        <div className="w-full max-w-lg bg-white dark:bg-[#0f1419] rounded-xl shadow-xl border-2 border-emerald-500 overflow-hidden max-h-screen flex flex-col transition-colors duration-300">
          
          {/* Header */}
          <div className="p-6 text-center pb-4 border-b border-slate-100 dark:border-slate-800 flex-shrink-0">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-200 dark:shadow-emerald-900/20">
                <span className="text-3xl select-none">🦞</span>
              </div>
            </div>
            <BouncyBrand 
              variant="subtle" 
              className="text-2xl justify-center text-slate-900 dark:text-slate-50 tracking-tight" 
              suffix={<span className="ml-2">Wizard<span className="text-slate-400 text-[0.6em] font-normal ml-0.5 self-end mb-1 tracking-tighter">©™</span></span>}
            />
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-600 dark:text-emerald-500 mt-1 text-center">Hatch Your Sovereign Identity</p>
          </div>

          <div className="p-8 space-y-8 flex-1 overflow-auto">
            {/* Progress Indicators */}
            {step !== 'success' && (
              <div className="flex items-center justify-center gap-3">
                <div className={`h-1.5 w-24 rounded-full transition-all duration-500 ${step === 'hatching' || step === 'verification' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-slate-200 dark:bg-slate-800'}`}></div>
                <div className={`h-1.5 w-24 rounded-full transition-all duration-500 ${step === 'verification' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-slate-200 dark:bg-slate-800'}`}></div>
              </div>
            )}

            {/* Error Banner */}
            {error && (
              <div className="flex items-start gap-3 p-4 bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/40 rounded-xl">
                <Shield className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-800 dark:text-red-400">{error}</p>
              </div>
            )}

            {/* STEP 1: HATCHING */}
            {step === 'hatching' && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="text-center mb-8">
                  <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <User className="w-8 h-8 text-emerald-500" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">Initialize Your Identity</h3>
                  <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
                    Choose your handle in the reef. This will be anchored to your cryptographic key.
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-1">Username <span className="text-emerald-500">*</span></label>
                    <input 
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                      placeholder="larry_lobster"
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-sm transition-all"
                      autoComplete="off"
                      maxLength={32}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-1">Display Name <span className="text-slate-400 font-normal lowercase tracking-normal">(optional)</span></label>
                    <input 
                      type="text"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="Larry Lobster"
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-sm transition-all"
                      autoComplete="off"
                      maxLength={64}
                    />
                  </div>
                </div>

                <button 
                  onClick={handleHatch}
                  disabled={!username.trim() || isProcessing}
                  className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold uppercase tracking-widest text-xs rounded-xl shadow-lg shadow-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 transition-all"
                >
                  {isProcessing ? (
                    <span className="flex items-center gap-3">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Hatching...
                    </span>
                  ) : (
                    <span className="flex items-center gap-3">
                      Hatch Identity
                      <ArrowRight className="w-4 h-4" />
                    </span>
                  )}
                </button>
              </div>
            )}

            {/* STEP 2: VERIFICATION */}
            {step === 'verification' && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Shield className="w-8 h-8 text-green-500" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">Identity Hatched!</h3>
                  <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed italic">
                    "A lobster without a shell is just a snack. Harden your identity."
                  </p>
                </div>

                {/* Key Display Card */}
                <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-5 border border-slate-200 dark:border-slate-800 space-y-4 shadow-inner">
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex-1 min-w-0">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">ClawKey©™</span>
                      <p className="font-mono text-xs text-emerald-600 dark:text-emerald-400 break-all leading-tight mt-1">
                        {generatedKey}
                      </p>
                    </div>
                    <button 
                      onClick={copyKey}
                      className={`p-2 rounded-lg transition-colors ${copied ? 'bg-green-500/10 text-green-500' : 'bg-slate-200 dark:bg-slate-800 text-slate-500 hover:text-emerald-500'}`}
                    >
                      {copied ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>

                  <div className="pt-3 border-t border-slate-200 dark:border-slate-800">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Sovereign UUID</span>
                    <p className="font-mono text-xs text-slate-600 dark:text-slate-400 mt-1">{generatedUUID}</p>
                  </div>
                </div>

                {/* Warning Banner */}
                <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40 rounded-xl p-4 flex gap-3 italic">
                  <Zap className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                  <p className="text-[10px] text-emerald-800 dark:text-emerald-500 leading-relaxed font-medium">
                    YOUR KEY IS NOT STORED ON OUR SERVERS. DOWNLOAD THE IDENTITY FILE OR LOSE ACCESS FOREVER.
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="grid grid-cols-1 gap-3">
                  <button 
                    onClick={downloadKey}
                    className={`w-full py-4 flex items-center justify-center gap-3 font-bold uppercase tracking-widest text-[10px] rounded-xl transition-all border-2 ${hasDownloaded ? 'border-green-500 text-green-600 bg-green-50 dark:bg-green-950/10' : 'border-emerald-500 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/10'}`}
                  >
                    <Download className="w-4 h-4" />
                    <span>{hasDownloaded ? 'Identity File Stashed!' : 'Download Identity File'}</span>
                  </button>

                  <button 
                    onClick={completeWizard}
                    disabled={!hasDownloaded || isProcessing}
                    className="w-full py-4 bg-red-600 hover:bg-red-700 text-white font-bold uppercase tracking-widest text-xs rounded-xl shadow-lg shadow-red-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-3"
                  >
                    {isProcessing ? (
                      <span className="flex items-center gap-3">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Securing...
                      </span>
                    ) : (
                      <span className="flex items-center gap-3">
                        Confirm & Complete
                        <ArrowRight className="w-4 h-4" />
                      </span>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: SUCCESS */}
            {step === 'success' && (
              <div className="py-8 animate-in zoom-in duration-500">
                <div className="w-24 h-24 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle className="w-12 h-12 text-green-500" />
                </div>
                <h2 className="text-3xl font-black mb-4 text-center">Welcome to the Burrow</h2>
                <p className="text-slate-500 dark:text-slate-400 mb-8 max-w-xs mx-auto text-center">
                  Your shell is hardened. Your identity is sovereign. Scuttling into CaraBase...
                </p>
                <div className="flex justify-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-emerald-500"></div>
                </div>
              </div>
            )}

            {/* Footer Navigation */}
            {step !== 'success' && (
              <div className="flex justify-center gap-6 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button 
                  onClick={() => window.location.href = '/'}
                  className="text-[10px] font-bold uppercase tracking-widest text-slate-400 hover:text-emerald-500 transition-colors flex items-center bg-transparent border-none p-0 cursor-pointer focus:outline-none"
                >
                  <ArrowLeft className="w-3 h-3 mr-2" />
                  Back to Reef
                </button>
                <button 
                  onClick={() => window.location.href = '/login'}
                  className="text-[10px] font-bold uppercase tracking-widest text-slate-400 hover:text-emerald-500 transition-colors flex items-center bg-transparent border-none p-0 cursor-pointer focus:outline-none"
                >
                  <Key className="w-3 h-3 mr-2" />
                  Existing Burrow
                </button>
              </div>
            )}

            <p className="text-[10px] text-center text-slate-400 dark:text-slate-600 uppercase tracking-[0.2em] font-medium mt-4">
              Stabilized by CrustAgent©™ — 2026
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SetupWizard
