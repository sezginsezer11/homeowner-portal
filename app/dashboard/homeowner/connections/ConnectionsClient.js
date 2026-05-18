'use client'
import { useState } from 'react'
import { Users, CheckCircle, X, Clock, Building2, Mail, Phone, Globe, Award, MessageSquare, Search, UserPlus } from 'lucide-react'
import Link from 'next/link'

const STATUS_CONFIG = {
  pending:  { label:'Pending',   cls:'bg-yellow-50 text-yellow-600 border-yellow-200', icon:Clock },
  accepted: { label:'Connected', cls:'bg-green-50 text-green-600 border-green-200',   icon:CheckCircle },
  declined: { label:'Declined',  cls:'bg-red-50 text-red-500 border-red-200',          icon:X },
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
        <h1 className="text-2xl font-bold text-[#1a1a2e] flex items-center gap-2">
          <Users className="w-6 h-6 text-[#1877F2]" /> My Connections
        </h1>
        <p className="text-[#65676b] text-sm mt-0.5">Manage your agent and lender connections</p>
      </div>

      {/* Pending */}
      {pending.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-[#1a1a2e] font-bold text-sm flex items-center gap-2">
            <Clock className="w-4 h-4 text-yellow-500" /> Pending Requests
            <span className="bg-yellow-100 text-yellow-700 text-[10px] font-bold px-1.5 py-0.5 rounded-full border border-yellow-200">{pending.length}</span>
          </h2>
          {pending.map(req => (
            <div key={req.id} className="bg-white rounded-2xl border-2 border-yellow-200 shadow-card p-5">
              <ProfCard req={req} />
              {req.message && (
                <div className="mt-3 p-3 bg-[#f8f9fa] rounded-xl border border-[#e4e6eb]">
                  <p className="text-[#65676b] text-xs italic">"{req.message}"</p>
                </div>
              )}
              <div className="flex gap-3 mt-4">
                <button onClick={() => handleAction(req.id,'declined')} disabled={!!loading}
                  className="flex-1 py-2.5 border-2 border-red-200 text-red-500 hover:bg-red-50 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2">
                  <X className="w-4 h-4" /> Decline
                </button>
                <button onClick={() => handleAction(req.id,'accepted')} disabled={!!loading}
                  className="flex-1 py-2.5 bg-[#1877F2] hover:bg-[#1665d8] text-white rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 shadow-sm">
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
          <h2 className="text-[#1a1a2e] font-bold text-sm flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-500" /> Connected
          </h2>
          {accepted.map(req => (
            <div key={req.id} className="bg-white rounded-2xl border border-green-200 shadow-card p-5">
              <ProfCard req={req} showContact />
              <div className="flex gap-3 mt-4">
                <Link href="/dashboard/homeowner/messages"
                  className="flex-1 py-2.5 bg-[#e7f0fd] hover:bg-[#1877F2] text-[#1877F2] hover:text-white rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2">
                  <MessageSquare className="w-4 h-4" /> Message
                </Link>
                <button onClick={() => handleRemove(req.id)} disabled={!!loading}
                  className="px-4 py-2.5 border border-red-200 text-red-500 hover:bg-red-50 rounded-xl text-sm font-semibold transition-all">
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
          <h2 className="text-[#1a1a2e] font-bold text-sm text-[#9ca3af]">Declined</h2>
          {declined.map(req => (
            <div key={req.id} className="bg-white rounded-2xl border border-[#e4e6eb] p-5 opacity-60">
              <ProfCard req={req} />
            </div>
          ))}
        </div>
      )}

      {/* Empty */}
      {requests.length === 0 && (
        <div className="bg-white rounded-2xl border-2 border-dashed border-[#e4e6eb] p-12 text-center">
          <div className="w-14 h-14 bg-[#e7f0fd] rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Users className="w-7 h-7 text-[#1877F2]" />
          </div>
          <h3 className="text-[#1a1a2e] font-bold text-lg mb-1">No connections yet</h3>
          <p className="text-[#65676b] text-sm mb-5">Agents and lenders will appear here when they send you a request. You can also search for them.</p>
          <div className="flex gap-3 justify-center">
            <Link href="/dashboard/homeowner/agent"
              className="flex items-center gap-2 px-5 py-2.5 bg-[#1877F2] text-white rounded-xl font-bold text-sm hover:bg-[#1665d8] transition-colors">
              <Search className="w-4 h-4" /> Find an Agent
            </Link>
            <Link href="/dashboard/homeowner/lender"
              className="flex items-center gap-2 px-5 py-2.5 bg-white border border-[#e4e6eb] text-[#65676b] rounded-xl font-bold text-sm hover:border-[#1877F2] hover:text-[#1877F2] transition-colors">
              <UserPlus className="w-4 h-4" /> Find a Lender
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}

function ProfCard({ req, showContact }) {
  const p = req.professional
  const roleColor = req.professional_role === 'agent' ? 'text-green-600' : 'text-blue-600'
  const roleLabel = req.professional_role === 'agent' ? 'Real Estate Agent' : 'Lender'
  const cfg = STATUS_CONFIG[req.status]
  const StatusIcon = cfg.icon

  return (
    <div className="flex items-start gap-4">
      <div className="w-12 h-12 rounded-full bg-[#e7f0fd] flex items-center justify-center text-[#1877F2] font-bold text-lg flex-shrink-0 border-2 border-[#c7d9f8] overflow-hidden">
        {p?.avatar_url ? <img src={p.avatar_url} alt="" className="w-full h-full object-cover" /> : p?.full_name?.charAt(0) || '?'}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2 flex-wrap">
          <div>
            <div className="text-[#1a1a2e] font-bold">{p?.full_name}</div>
            <div className={`text-xs font-semibold ${roleColor}`}>{roleLabel}</div>
            {p?.company && <div className="text-[#65676b] text-xs">{p.company}</div>}
          </div>
          <span className={`text-[10px] px-2 py-1 rounded-full border flex items-center gap-1 flex-shrink-0 font-bold ${cfg.cls}`}>
            <StatusIcon className="w-3 h-3" /> {cfg.label}
          </span>
        </div>
        {p?.bio && <p className="text-[#65676b] text-xs mt-2 leading-relaxed">{p.bio}</p>}
        {showContact && (
          <div className="flex flex-wrap gap-2 mt-3">
            {p?.email && <a href={`mailto:${p.email}`} className="flex items-center gap-1.5 text-xs text-[#65676b] hover:text-[#1877F2] bg-[#f8f9fa] border border-[#e4e6eb] px-2.5 py-1.5 rounded-lg transition-colors"><Mail className="w-3 h-3" />{p.email}</a>}
            {p?.phone && <a href={`tel:${p.phone}`} className="flex items-center gap-1.5 text-xs text-[#65676b] hover:text-[#1877F2] bg-[#f8f9fa] border border-[#e4e6eb] px-2.5 py-1.5 rounded-lg transition-colors"><Phone className="w-3 h-3" />{p.phone}</a>}
            {p?.website && <a href={p.website.startsWith('http')?p.website:`https://${p.website}`} target="_blank" className="flex items-center gap-1.5 text-xs text-[#65676b] hover:text-[#1877F2] bg-[#f8f9fa] border border-[#e4e6eb] px-2.5 py-1.5 rounded-lg transition-colors"><Globe className="w-3 h-3" />Website</a>}
            {p?.license_number && <span className="flex items-center gap-1.5 text-xs text-[#9ca3af] bg-[#f8f9fa] border border-[#e4e6eb] px-2.5 py-1.5 rounded-lg"><Award className="w-3 h-3" />DRE #{p.license_number}</span>}
          </div>
        )}
        <div className="text-[#9ca3af] text-[10px] mt-2">
          Requested {new Date(req.created_at).toLocaleDateString('en-US', {month:'short', day:'numeric', year:'numeric'})}
        </div>
      </div>
    </div>
  )
}
