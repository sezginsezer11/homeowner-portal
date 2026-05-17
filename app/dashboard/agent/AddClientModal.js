'use client'

import { useState } from 'react'
import { UserPlus, Mail, X, AlertCircle, CheckCircle, MessageSquare } from 'lucide-react'

export default function AddClientModal({ onClose, onAdded }) {
  const [email, setEmail]     = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState(null)
  const [success, setSuccess] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/connections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, message }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setSuccess(data.homeowner.full_name)
      setTimeout(() => onAdded(), 2000)
    } catch (err) {
      setError(err.message)
      setLoading(false)
    }
  }

  const inp = "w-full pl-10 pr-4 py-3 bg-[#0f1623] border border-[#344a57]/40 rounded-lg text-white placeholder-[#464d4f] focus:outline-none focus:border-[#c9a84c] transition-colors text-sm"

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[#1a2332] border border-[#344a57]/30 rounded-2xl w-full max-w-md shadow-2xl">

        <div className="flex items-center justify-between p-6 border-b border-[#344a57]/20">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#344a57] flex items-center justify-center">
              <UserPlus className="w-4 h-4 text-[#c9a84c]" />
            </div>
            <div>
              <h2 className="text-white font-semibold">Send Connection Request</h2>
              <p className="text-[#8fa1ad] text-xs">Homeowner must approve to connect</p>
            </div>
          </div>
          <button onClick={onClose} className="text-[#8fa1ad] hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          {error && (
            <div className="flex items-center gap-2 bg-red-900/20 border border-red-500/30 text-red-400 rounded-xl p-3 mb-4 text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />{error}
            </div>
          )}
          {success && (
            <div className="flex items-center gap-2 bg-green-900/20 border border-green-500/30 text-green-400 rounded-xl p-3 mb-4 text-sm">
              <CheckCircle className="w-4 h-4 flex-shrink-0" />
              Request sent to {success}! Waiting for their approval.
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-[#8fa1ad] mb-2 uppercase tracking-wider">
                Homeowner&apos;s Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8fa1ad]" />
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
                  placeholder="homeowner@email.com" className={inp} />
              </div>
              <p className="text-[#464d4f] text-xs mt-1.5">The homeowner must have an account on this platform</p>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#8fa1ad] mb-2 uppercase tracking-wider">
                Personal Message (optional)
              </label>
              <div className="relative">
                <MessageSquare className="absolute left-3 top-3 w-4 h-4 text-[#8fa1ad]" />
                <textarea value={message} onChange={e => setMessage(e.target.value)} rows={3}
                  placeholder="Hi! I'd love to help you track your home's value..."
                  className="w-full pl-10 pr-4 py-3 bg-[#0f1623] border border-[#344a57]/40 rounded-lg text-white placeholder-[#464d4f] focus:outline-none focus:border-[#c9a84c] transition-colors text-sm resize-none" />
              </div>
            </div>

            <div className="bg-[#0f1623] rounded-xl p-3 text-xs text-[#8fa1ad] space-y-1">
              <p>🔒 <strong className="text-white">Privacy protected:</strong> You cannot browse homeowner profiles</p>
              <p>✅ <strong className="text-white">Homeowner approves:</strong> They must accept before you connect</p>
              <p>📧 <strong className="text-white">Search by email:</strong> Only exact email matches work</p>
            </div>

            <div className="flex gap-3 pt-1">
              <button type="button" onClick={onClose}
                className="flex-1 py-2.5 border border-[#344a57]/40 text-[#8fa1ad] hover:text-white rounded-xl text-sm transition-colors">
                Cancel
              </button>
              <button type="submit" disabled={loading || !!success}
                className="flex-1 py-2.5 bg-[#c9a84c] hover:bg-[#d4b560] text-[#0f1623] rounded-xl font-semibold text-sm transition-colors disabled:opacity-50">
                {loading ? 'Sending...' : 'Send Request'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
