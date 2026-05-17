'use client'

import { useState } from 'react'
import { Users, CheckCircle, X, Clock, Building2, Mail, Phone, Globe, Award, MessageSquare, Search } from 'lucide-react'

const STATUS_CONFIG = {
  pending:  { label: 'Pending',  cls: 'bg-[#c9a84c]/20 text-[#c9a84c] border-[#c9a84c]/30',   icon: Clock },
  accepted: { label: 'Connected', cls: 'bg-green-900/20 text-green-400 border-green-500/30',   icon: CheckCircle },
  declined: { label: 'Declined',  cls: 'bg-red-900/20 text-red-400 border-red-500/30',          icon: X },
}

export default function ConnectionsClient({ requests }) {
  const [loading, setLoading] = useState(null)

  const handleAction = async (relationship_id, action) => {
    setLoading(relationship_id + action)
    await fetch('/api/connections', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ relationship_id, action }),
    })
    window.location.reload()
  }

  const handleRemove = async (relationship_id) => {
    if (!confirm('Remove this connection?')) return
    setLoading(relationship_id + 'remove')
    await fetch('/api/connections', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ relationship_id }),
    })
    window.location.reload()
  }

  const pending  = requests.filter(r => r.status === 'pending')
  const accepted = requests.filter(r => r.status === 'accepted')
  const declined = requests.filter(r => r.status === 'declined')

  return (
    <div className="max-w-3xl mx-auto space-y-5 pb-20">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Users className="w-6 h-6 text-[#c9a84c]" /> My Connections
        </h1>
        <p className="text-[#8fa1ad] text-sm mt-0.5">Manage your agent and lender connections</p>
      </div>

      {/* Pending requests */}
      {pending.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-white font-semibold text-sm flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#c9a84c]" />
            Pending Requests
            <span className="bg-[#c9a84c] text-[#0f1623] text-[10px] font-bold px-1.5 py-0.5 rounded-full">{pending.length}</span>
          </h2>
          {pending.map(req => (
            <div key={req.id} className="bg-[#1a2332] border border-[#c9a84c]/20 rounded-2xl p-5">
              <ProfessionalCard req={req} />
              {req.message && (
                <div className="mt-3 p-3 bg-[#0f1623] rounded-xl">
                  <p className="text-[#8fa1ad] text-xs italic">"{req.message}"</p>
                </div>
              )}
              <div className="flex gap-3 mt-4">
                <button onClick={() => handleAction(req.id, 'declined')}
                  disabled={!!loading}
                  className="flex-1 py-2.5 border border-red-500/30 text-red-400 hover:bg-red-900/20 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2">
                  <X className="w-4 h-4" /> Decline
                </button>
                <button onClick={() => handleAction(req.id, 'accepted')}
                  disabled={!!loading}
                  className="flex-1 py-2.5 bg-[#c9a84c] hover:bg-[#d4b560] text-[#0f1623] rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2">
                  <CheckCircle className="w-4 h-4" /> Accept
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Connected */}
      {accepted.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-white font-semibold text-sm flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-400" /> Connected
          </h2>
          {accepted.map(req => (
            <div key={req.id} className="bg-[#1a2332] border border-green-500/20 rounded-2xl p-5">
              <ProfessionalCard req={req} showContact />
              <div className="flex gap-3 mt-4">
                <a href="/dashboard/homeowner/messages"
                  className="flex-1 py-2.5 bg-[#344a57] hover:bg-[#344a57]/80 text-white rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2">
                  <MessageSquare className="w-4 h-4 text-[#c9a84c]" /> Message
                </a>
                <button onClick={() => handleRemove(req.id)} disabled={!!loading}
                  className="px-4 py-2.5 border border-red-500/20 text-red-400 hover:bg-red-900/20 rounded-xl text-sm transition-all">
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Declined */}
      {declined.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-white font-semibold text-sm text-[#464d4f]">Declined</h2>
          {declined.map(req => (
            <div key={req.id} className="bg-[#1a2332] border border-[#344a57]/20 rounded-2xl p-5 opacity-60">
              <ProfessionalCard req={req} />
            </div>
          ))}
        </div>
      )}

      {requests.length === 0 && (
        <div className="bg-[#1a2332] border border-dashed border-[#344a57]/40 rounded-2xl p-12 text-center">
          <Users className="w-12 h-12 text-[#344a57] mx-auto mb-4" />
          <p className="text-white font-semibold">No connection requests yet</p>
          <p className="text-[#8fa1ad] text-sm mt-1">Agents and lenders will appear here when they send you a request</p>
        </div>
      )}
    </div>
  )
}

function ProfessionalCard({ req, showContact }) {
  const p = req.professional
  const roleColor = req.professional_role === 'agent' ? 'text-green-400' : 'text-blue-400'
  const roleLabel = req.professional_role === 'agent' ? 'Real Estate Agent' : 'Lender'
  const cfg = STATUS_CONFIG[req.status]
  const StatusIcon = cfg.icon

  return (
    <div className="flex items-start gap-4">
      <div className="w-14 h-14 rounded-full bg-[#344a57] flex items-center justify-center text-white text-xl font-bold flex-shrink-0 border-2 border-[#344a57]">
        {p?.avatar_url
          ? <img src={p.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
          : p?.full_name?.charAt(0) || '?'}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2 flex-wrap">
          <div>
            <div className="text-white font-semibold">{p?.full_name}</div>
            <div className={`text-xs ${roleColor}`}>{roleLabel}</div>
            {p?.company && <div className="text-[#8fa1ad] text-xs">{p.company}</div>}
          </div>
          <span className={`text-[10px] px-2 py-1 rounded-full border flex items-center gap-1 flex-shrink-0 ${cfg.cls}`}>
            <StatusIcon className="w-3 h-3" /> {cfg.label}
          </span>
        </div>

        {p?.bio && <p className="text-[#8fa1ad] text-xs mt-2 leading-relaxed">{p.bio}</p>}

        {showContact && (
          <div className="flex flex-wrap gap-2 mt-3">
            {p?.email && (
              <a href={`mailto:${p.email}`} className="flex items-center gap-1.5 text-xs text-[#8fa1ad] hover:text-white bg-[#0f1623] px-2.5 py-1.5 rounded-lg transition-colors">
                <Mail className="w-3 h-3" /> {p.email}
              </a>
            )}
            {p?.phone && (
              <a href={`tel:${p.phone}`} className="flex items-center gap-1.5 text-xs text-[#8fa1ad] hover:text-white bg-[#0f1623] px-2.5 py-1.5 rounded-lg transition-colors">
                <Phone className="w-3 h-3" /> {p.phone}
              </a>
            )}
            {p?.website && (
              <a href={p.website.startsWith('http') ? p.website : `https://${p.website}`} target="_blank"
                className="flex items-center gap-1.5 text-xs text-[#8fa1ad] hover:text-white bg-[#0f1623] px-2.5 py-1.5 rounded-lg transition-colors">
                <Globe className="w-3 h-3" /> Website
              </a>
            )}
            {p?.license_number && (
              <span className="flex items-center gap-1.5 text-xs text-[#464d4f] bg-[#0f1623] px-2.5 py-1.5 rounded-lg">
                <Award className="w-3 h-3" /> DRE #{p.license_number}
              </span>
            )}
          </div>
        )}

        <div className="text-[#464d4f] text-[10px] mt-2">
          Requested {new Date(req.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
        </div>
      </div>
    </div>
  )
}
