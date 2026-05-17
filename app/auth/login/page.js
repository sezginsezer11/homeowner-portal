'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Home, Lock, Mail, AlertCircle } from 'lucide-react'

export default function LoginPage() {
  const [email, setEmail]     = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]     = useState(null)
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

  const inp = "w-full pl-10 pr-4 py-3 bg-white border border-[#e4e6eb] rounded-xl text-[#1a1a2e] placeholder-[#9ca3af] focus:outline-none focus:border-[#1877F2] focus:ring-2 focus:ring-[#1877F2]/20 transition-all text-sm"

  return (
    <div className="min-h-screen bg-[#f8f9fa] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#1877F2] mb-4 shadow-lg">
            <Home className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-[#1a1a2e]">Welcome back</h1>
          <p className="text-[#65676b] mt-1 text-sm">Sign in to your HomeOwner Portal</p>
        </div>

        <div className="bg-white rounded-2xl shadow-card border border-[#e4e6eb] p-8">
          {error && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 rounded-xl p-3 mb-5 text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />{error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#65676b] mb-2 uppercase tracking-wider">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9ca3af]" />
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="you@example.com" className={inp} />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#65676b] mb-2 uppercase tracking-wider">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9ca3af]" />
                <input type="password" value={password} onChange={e => setPassword(e.target.value)} required placeholder="••••••••" className={inp} />
              </div>
            </div>
            <button type="submit" disabled={loading}
              className="w-full py-3 bg-[#1877F2] hover:bg-[#1665d8] text-white font-semibold rounded-xl transition-colors disabled:opacity-50 text-sm shadow-sm mt-2">
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <p className="text-center text-[#65676b] text-sm mt-5">
            Don&apos;t have an account?{' '}
            <Link href="/auth/signup" className="text-[#1877F2] hover:underline font-semibold">Create one</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
