'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Home, Lock, Mail, AlertCircle } from 'lucide-react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) { setError(error.message); setLoading(false) }
    else { router.push('/dashboard'); router.refresh() }
  }

  const inp = "w-full pl-10 pr-4 py-3 bg-[#0f1623] border border-[#344a57]/40 rounded-lg text-white placeholder-[#464d4f] focus:outline-none focus:border-[#c9a84c] transition-colors text-sm"

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f1623] to-[#1a2332] flex items-center justify-center p-4">
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#344a57] mb-4 shadow-lg">
            <Home className="w-8 h-8 text-[#c9a84c]" />
          </div>
          <h1 className="text-2xl font-bold text-white">HomeOwner Portal</h1>
          <p className="text-[#8fa1ad] mt-1 text-sm">Sign in to your account</p>
        </div>

        {/* Card */}
        <div className="bg-[#1a2332] border border-[#344a57]/30 rounded-2xl p-8 shadow-2xl">
          {error && (
            <div className="flex items-center gap-2 bg-red-900/20 border border-red-500/30 text-red-400 rounded-lg p-3 mb-6 text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-xs font-medium text-[#8fa1ad] mb-2 uppercase tracking-wider">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8fa1ad]" />
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="you@example.com" className={inp} />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#8fa1ad] mb-2 uppercase tracking-wider">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8fa1ad]" />
                <input type="password" value={password} onChange={e => setPassword(e.target.value)} required placeholder="••••••••" className={inp} />
              </div>
            </div>

            <button type="submit" disabled={loading}
              className="w-full py-3 bg-[#c9a84c] hover:bg-[#d4b560] text-[#0f1623] font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm">
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <p className="text-center text-[#8fa1ad] text-sm mt-6">
            Don&apos;t have an account?{' '}
            <Link href="/auth/signup" className="text-[#c9a84c] hover:underline font-medium">Create one</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
