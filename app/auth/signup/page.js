'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Home, Lock, Mail, User, Building2, AlertCircle, CheckCircle } from 'lucide-react'

const ROLES = [
  { id: 'homeowner', label: 'Homeowner',  desc: 'Track your home value & equity',         color: 'border-[#c9a84c] bg-[#c9a84c]/5 text-[#c9a84c]' },
  { id: 'agent',     label: 'Agent',      desc: 'Manage clients & send market updates',    color: 'border-green-500 bg-green-50 text-green-600' },
  { id: 'lender',    label: 'Lender',     desc: 'Monitor equity & send rate alerts',       color: 'border-blue-500 bg-blue-50 text-blue-600' },
]

export default function SignupPage() {
  const [form, setForm]     = useState({ full_name: '', email: '', password: '', role: 'homeowner', company: '' })
  const [error, setError]   = useState(null)
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  const update = (f) => (e) => setForm(p => ({ ...p, [f]: e.target.value }))

  const handleSignup = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const supabase = createClient()
    const { error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        data: { full_name: form.full_name, role: form.role, company: form.company },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    if (error) { setError(error.message); setLoading(false) }
    else setSuccess(true)
  }

  const inp = "w-full pl-10 pr-4 py-3 bg-white border border-[#e4e6eb] rounded-xl text-[#1a1a2e] placeholder-[#9ca3af] focus:outline-none focus:border-[#1877F2] focus:ring-2 focus:ring-[#1877F2]/20 transition-all text-sm"

  if (success) return (
    <div className="min-h-screen bg-[#f8f9fa] flex items-center justify-center p-4">
      <div className="text-center max-w-sm">
        <div className="w-16 h-16 rounded-2xl bg-green-100 border border-green-200 flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-8 h-8 text-green-500" />
        </div>
        <h2 className="text-2xl font-bold text-[#1a1a2e] mb-2">Check your email</h2>
        <p className="text-[#65676b] text-sm">
          We sent a confirmation link to <span className="font-semibold text-[#1a1a2e]">{form.email}</span>
        </p>
        <Link href="/auth/login" className="inline-block mt-5 text-[#1877F2] hover:underline text-sm font-semibold">Back to sign in</Link>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-[#f8f9fa] flex items-center justify-center p-4 py-10">
      <div className="w-full max-w-lg">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#1877F2] mb-4 shadow-lg">
            <Home className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-[#1a1a2e]">Create your account</h1>
          <p className="text-[#65676b] mt-1 text-sm">Join the HomeOwner Portal</p>
        </div>

        <div className="bg-white rounded-2xl shadow-card border border-[#e4e6eb] p-8">
          {error && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 rounded-xl p-3 mb-5 text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />{error}
            </div>
          )}

          <form onSubmit={handleSignup} className="space-y-4">
            {/* Role */}
            <div>
              <label className="block text-xs font-semibold text-[#65676b] mb-2 uppercase tracking-wider">I am a...</label>
              <div className="grid grid-cols-3 gap-2">
                {ROLES.map(r => (
                  <button key={r.id} type="button" onClick={() => setForm(f => ({ ...f, role: r.id }))}
                    className={`p-3 rounded-xl border-2 text-left transition-all ${
                      form.role === r.id ? r.color : 'border-[#e4e6eb] text-[#65676b] hover:border-[#c8d0dc]'
                    }`}>
                    <div className="font-bold text-xs">{r.label}</div>
                    <div className="text-[10px] mt-0.5 opacity-70 leading-tight">{r.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#65676b] mb-2 uppercase tracking-wider">Full Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9ca3af]" />
                <input type="text" value={form.full_name} onChange={update('full_name')} required placeholder="Jane Smith" className={inp} />
              </div>
            </div>

            {(form.role === 'agent' || form.role === 'lender') && (
              <div>
                <label className="block text-xs font-semibold text-[#65676b] mb-2 uppercase tracking-wider">Company</label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9ca3af]" />
                  <input type="text" value={form.company} onChange={update('company')} placeholder="Keller Williams Realty" className={inp} />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-[#65676b] mb-2 uppercase tracking-wider">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9ca3af]" />
                <input type="email" value={form.email} onChange={update('email')} required placeholder="you@example.com" className={inp} />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#65676b] mb-2 uppercase tracking-wider">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9ca3af]" />
                <input type="password" value={form.password} onChange={update('password')} required placeholder="Min 8 characters" minLength={8} className={inp} />
              </div>
            </div>

            <button type="submit" disabled={loading}
              className="w-full py-3 bg-[#1877F2] hover:bg-[#1665d8] text-white font-semibold rounded-xl transition-colors disabled:opacity-50 text-sm shadow-sm">
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>

          <p className="text-center text-[#65676b] text-sm mt-5">
            Already have an account?{' '}
            <Link href="/auth/login" className="text-[#1877F2] hover:underline font-semibold">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
