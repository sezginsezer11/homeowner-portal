'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Home, Lock, Mail, User, Building2, AlertCircle, CheckCircle } from 'lucide-react'

const ROLES = [
  { id: 'homeowner', label: 'Homeowner', desc: 'Track your property value & equity' },
  { id: 'agent',     label: 'Agent',     desc: 'Manage clients & send market updates' },
  { id: 'lender',    label: 'Lender',    desc: 'Monitor equity & send rate alerts' },
]

export default function SignupPage() {
  const [form, setForm] = useState({ full_name: '', email: '', password: '', role: 'homeowner', company: '' })
  const [error, setError] = useState(null)
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

  const inp = "w-full pl-10 pr-4 py-3 bg-[#0f1623] border border-[#344a57]/40 rounded-lg text-white placeholder-[#464d4f] focus:outline-none focus:border-[#c9a84c] transition-colors text-sm"

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0f1623] to-[#1a2332] flex items-center justify-center p-4">
        <div className="text-center max-w-sm">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-green-900/30 border border-green-500/20 mb-4">
            <CheckCircle className="w-8 h-8 text-green-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Check your email</h2>
          <p className="text-[#8fa1ad] text-sm">
            We sent a confirmation link to <span className="text-white font-medium">{form.email}</span>. Click it to activate your account.
          </p>
          <Link href="/auth/login" className="inline-block mt-6 text-[#c9a84c] hover:underline text-sm">Back to sign in</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f1623] to-[#1a2332] flex items-center justify-center p-4">
      <div className="w-full max-w-lg">

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#344a57] mb-4 shadow-lg">
            <Home className="w-8 h-8 text-[#c9a84c]" />
          </div>
          <h1 className="text-2xl font-bold text-white">Create Account</h1>
          <p className="text-[#8fa1ad] mt-1 text-sm">Join the HomeOwner Portal</p>
        </div>

        <div className="bg-[#1a2332] border border-[#344a57]/30 rounded-2xl p-8 shadow-2xl">
          {error && (
            <div className="flex items-center gap-2 bg-red-900/20 border border-red-500/30 text-red-400 rounded-lg p-3 mb-6 text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />{error}
            </div>
          )}

          <form onSubmit={handleSignup} className="space-y-5">
            {/* Role */}
            <div>
              <label className="block text-xs font-medium text-[#8fa1ad] mb-3 uppercase tracking-wider">I am a...</label>
              <div className="grid grid-cols-3 gap-2">
                {ROLES.map(r => (
                  <button key={r.id} type="button" onClick={() => setForm(f => ({ ...f, role: r.id }))}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      form.role === r.id
                        ? 'border-[#c9a84c] bg-[#c9a84c]/10 text-white'
                        : 'border-[#344a57]/40 text-[#8fa1ad] hover:border-[#344a57]'
                    }`}>
                    <div className="font-semibold text-xs">{r.label}</div>
                    <div className="text-[10px] mt-0.5 opacity-70 leading-tight">{r.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Name */}
            <div>
              <label className="block text-xs font-medium text-[#8fa1ad] mb-2 uppercase tracking-wider">Full Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8fa1ad]" />
                <input type="text" value={form.full_name} onChange={update('full_name')} required placeholder="Jane Smith" className={inp} />
              </div>
            </div>

            {/* Company (agents/lenders only) */}
            {(form.role === 'agent' || form.role === 'lender') && (
              <div>
                <label className="block text-xs font-medium text-[#8fa1ad] mb-2 uppercase tracking-wider">Company</label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8fa1ad]" />
                  <input type="text" value={form.company} onChange={update('company')} placeholder="Keller Williams Realty" className={inp} />
                </div>
              </div>
            )}

            {/* Email */}
            <div>
              <label className="block text-xs font-medium text-[#8fa1ad] mb-2 uppercase tracking-wider">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8fa1ad]" />
                <input type="email" value={form.email} onChange={update('email')} required placeholder="you@example.com" className={inp} />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-medium text-[#8fa1ad] mb-2 uppercase tracking-wider">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8fa1ad]" />
                <input type="password" value={form.password} onChange={update('password')} required placeholder="Min 8 characters" minLength={8} className={inp} />
              </div>
            </div>

            <button type="submit" disabled={loading}
              className="w-full py-3 bg-[#c9a84c] hover:bg-[#d4b560] text-[#0f1623] font-semibold rounded-lg transition-colors disabled:opacity-50 text-sm">
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>

          <p className="text-center text-[#8fa1ad] text-sm mt-6">
            Already have an account?{' '}
            <Link href="/auth/login" className="text-[#c9a84c] hover:underline font-medium">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
