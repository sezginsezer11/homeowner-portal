'use client'

import { useState } from 'react'
import { Send, X, AlertCircle, CheckCircle, Percent, MessageSquare } from 'lucide-react'

const MSG_TYPES = [
  { id: 'rate_alert', label: 'Rate Alert',  icon: Percent,       color: 'text-blue-400',  desc: 'Notify clients about rate changes or refi opportunities' },
  { id: 'general',   label: 'General',      icon: MessageSquare, color: 'text-[#8fa1ad]', desc: 'General communication with your client' },
]

export default function LenderSendMessageModal({ recipients, defaultType = 'rate_alert', currentRate, onClose, onSent }) {
  const [type, setType]       = useState(defaultType)
  const [subject, setSubject] = useState(
    defaultType === 'rate_alert'
      ? `Rate Alert — Today's 30-Year Fixed: ${currentRate}%`
      : ''
  )
  const [body, setBody] = useState(
    defaultType === 'rate_alert'
      ? `Hi,

I wanted to reach out because today's 30-year fixed mortgage rate is ${currentRate}%, and based on your current loan details, you may have a refinancing opportunity worth exploring.

If your current rate is significantly higher than today's market rate, a refinance could potentially lower your monthly payment and save you thousands over the life of your loan.

I'd love to run the numbers for you with no obligation. Would you be open to a quick call this week?

Best regards`
      : ''
  )
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState(null)
  const [success, setSuccess] = useState(false)

  const handleTypeChange = (t) => {
    setType(t)
    if (t === 'rate_alert') {
      setSubject(`Rate Alert — Today's 30-Year Fixed: ${currentRate}%`)
      setBody(`Hi,\n\nI wanted to reach out because today's 30-year fixed mortgage rate is ${currentRate}%, and based on your current loan details, you may have a refinancing opportunity worth exploring.\n\nIf your current rate is significantly higher than today's market rate, a refinance could potentially lower your monthly payment and save you thousands over the life of your loan.\n\nI'd love to run the numbers for you with no obligation. Would you be open to a quick call this week?\n\nBest regards`)
    } else {
      setSubject('')
      setBody('')
    }
  }

  const handleSend = async () => {
    if (!body.trim()) { setError('Message body is required'); return }
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to_ids: recipients.map(r => r.id),
          subject: subject.trim() || null,
          body: body.trim(),
          message_type: type,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setSuccess(true)
      setTimeout(() => onSent(), 1500)
    } catch (err) {
      setError(err.message)
      setLoading(false)
    }
  }

  const inp = "w-full px-3 py-2.5 bg-[#0f1623] border border-[#344a57]/40 rounded-lg text-white placeholder-[#464d4f] focus:outline-none focus:border-[#c9a84c] transition-colors text-sm"

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[#1a2332] border border-[#344a57]/30 rounded-2xl w-full max-w-xl shadow-2xl max-h-[90vh] overflow-y-auto">

        <div className="flex items-center justify-between p-6 border-b border-[#344a57]/20 sticky top-0 bg-[#1a2332] z-10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-900/30 border border-blue-500/20 flex items-center justify-center">
              <Send className="w-4 h-4 text-blue-400" />
            </div>
            <div>
              <h2 className="text-white font-semibold">Send Message</h2>
              <p className="text-[#8fa1ad] text-xs">
                To: {recipients.length === 1 ? recipients[0].full_name : `${recipients.length} clients`}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-[#8fa1ad] hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {error && (
            <div className="flex items-center gap-2 bg-red-900/20 border border-red-500/30 text-red-400 rounded-xl p-3 text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />{error}
            </div>
          )}
          {success && (
            <div className="flex items-center gap-2 bg-green-900/20 border border-green-500/30 text-green-400 rounded-xl p-3 text-sm">
              <CheckCircle className="w-4 h-4 flex-shrink-0" />
              Sent to {recipients.length} {recipients.length === 1 ? 'client' : 'clients'}!
            </div>
          )}

          {/* Rate pill */}
          <div className="flex items-center gap-2 bg-blue-900/20 border border-blue-500/20 rounded-xl px-4 py-2.5">
            <Percent className="w-3.5 h-3.5 text-blue-400" />
            <span className="text-[#8fa1ad] text-xs">Current 30yr rate:</span>
            <span className="text-blue-400 font-bold text-sm">{currentRate}%</span>
          </div>

          {/* Recipients */}
          {recipients.length > 1 && (
            <div>
              <label className="block text-xs font-medium text-[#8fa1ad] mb-2 uppercase tracking-wider">Recipients</label>
              <div className="flex flex-wrap gap-2">
                {recipients.map(r => (
                  <span key={r.id} className="px-2.5 py-1 bg-[#344a57]/40 text-white text-xs rounded-full">{r.full_name}</span>
                ))}
              </div>
            </div>
          )}

          {/* Type */}
          <div>
            <label className="block text-xs font-medium text-[#8fa1ad] mb-2 uppercase tracking-wider">Message Type</label>
            <div className="grid grid-cols-2 gap-2">
              {MSG_TYPES.map(t => {
                const Icon = t.icon
                return (
                  <button key={t.id} type="button" onClick={() => handleTypeChange(t.id)}
                    className={`p-3 rounded-xl border text-left transition-all ${type === t.id ? 'border-[#c9a84c] bg-[#c9a84c]/10' : 'border-[#344a57]/40 hover:border-[#344a57]'}`}>
                    <div className="flex items-center gap-2 mb-1">
                      <Icon className={`w-3.5 h-3.5 ${t.color}`} />
                      <span className={`text-xs font-semibold ${type === t.id ? 'text-white' : 'text-[#8fa1ad]'}`}>{t.label}</span>
                    </div>
                    <div className="text-[10px] text-[#464d4f] leading-tight">{t.desc}</div>
                  </button>
                )
              })}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#8fa1ad] mb-2 uppercase tracking-wider">Subject</label>
            <input value={subject} onChange={e => setSubject(e.target.value)} placeholder="Message subject..." className={inp} />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#8fa1ad] mb-2 uppercase tracking-wider">Message</label>
            <textarea value={body} onChange={e => setBody(e.target.value)} rows={10}
              className={`${inp} resize-none leading-relaxed`} />
          </div>

          <div className="flex gap-3 pt-2">
            <button onClick={onClose}
              className="flex-1 py-2.5 border border-[#344a57]/40 text-[#8fa1ad] hover:text-white rounded-xl text-sm transition-colors">
              Cancel
            </button>
            <button onClick={handleSend} disabled={loading || success || !body.trim()}
              className="flex-1 py-2.5 bg-[#c9a84c] hover:bg-[#d4b560] text-[#0f1623] rounded-xl font-semibold text-sm transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
              <Send className="w-4 h-4" />
              {loading ? 'Sending...' : `Send to ${recipients.length === 1 ? recipients[0].full_name?.split(' ')[0] : `${recipients.length} clients`}`}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
