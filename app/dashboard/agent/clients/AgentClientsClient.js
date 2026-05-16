'use client'

import { useState } from 'react'
import { Users, Search, MessageSquare, UserPlus, Trash2, Home, ChevronDown, ChevronUp } from 'lucide-react'
import AddClientModal from '../AddClientModal'
import SendMessageModal from '../SendMessageModal'

function fmt(n) { return n ? '$' + Math.round(n).toLocaleString() : '—' }

export default function AgentClientsClient({ relationships }) {
  const [search, setSearch]         = useState('')
  const [showAdd, setShowAdd]       = useState(false)
  const [showMsg, setShowMsg]       = useState(false)
  const [msgRecipients, setMsgRecipients] = useState([])
  const [expanded, setExpanded]     = useState(null)
  const [removing, setRemoving]     = useState(null)

  const clients = relationships.map(r => ({ ...r.homeowner, rel_id: r.id, joined: r.created_at })).filter(Boolean)

  const filtered = clients.filter(c =>
    c.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    c.email?.toLowerCase().includes(search.toLowerCase()) ||
    c.properties?.some(p => p.address?.toLowerCase().includes(search.toLowerCase()))
  )

  const handleMessage = (client) => {
    setMsgRecipients([{ id: client.id, full_name: client.full_name }])
    setShowMsg(true)
  }

  const handleRemove = async (homeowner_id) => {
    if (!confirm('Remove this client? They will lose access to your connection.')) return
    setRemoving(homeowner_id)
    await fetch('/api/relationships', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ homeowner_id }),
    })
    window.location.reload()
  }

  return (
    <div className="space-y-5 max-w-5xl">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Clients</h1>
          <p className="text-[#8fa1ad] text-sm mt-0.5">{clients.length} connected homeowner{clients.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="flex items-center gap-3">
          {filtered.length > 0 && (
            <button onClick={() => { setMsgRecipients(filtered.map(c => ({ id: c.id, full_name: c.full_name }))); setShowMsg(true) }}
              className="flex items-center gap-2 px-4 py-2.5 bg-[#344a57] hover:bg-[#344a57]/70 text-white rounded-xl font-medium text-sm border border-[#344a57] transition-colors">
              <MessageSquare className="w-4 h-4" /> Message All
            </button>
          )}
          <button onClick={() => setShowAdd(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#c9a84c] hover:bg-[#d4b560] text-[#0f1623] rounded-xl font-semibold text-sm transition-colors shadow-lg">
            <UserPlus className="w-4 h-4" /> Add Client
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8fa1ad]" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name, email, or address..."
          className="w-full pl-10 pr-4 py-3 bg-[#1a2332] border border-[#344a57]/30 rounded-xl text-white placeholder-[#464d4f] focus:outline-none focus:border-[#c9a84c] transition-colors text-sm" />
      </div>

      {/* Client list */}
      {filtered.length === 0 ? (
        <div className="bg-[#1a2332] border border-[#344a57]/30 rounded-2xl p-16 text-center">
          <Users className="w-12 h-12 text-[#344a57] mx-auto mb-4" />
          <p className="text-white font-semibold">{clients.length === 0 ? 'No clients yet' : 'No results'}</p>
          <p className="text-[#8fa1ad] text-sm mt-1">
            {clients.length === 0 ? 'Add homeowners by their email address' : 'Try a different search'}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(client => {
            const props = client.properties || []
            const isExpanded = expanded === client.id
            const equity = props.reduce((sum, p) => {
              if (p.loan_balance && p.purchase_price) return sum + (p.purchase_price - p.loan_balance)
              return sum
            }, 0)

            return (
              <div key={client.id} className="bg-[#1a2332] border border-[#344a57]/30 rounded-2xl overflow-hidden transition-all">

                {/* Client row */}
                <div className="flex items-center gap-4 px-6 py-4">
                  <div className="w-11 h-11 rounded-full bg-gradient-to-br from-[#344a57] to-[#0f1623] border border-[#344a57] flex items-center justify-center text-white font-bold flex-shrink-0">
                    {client.full_name?.charAt(0) || '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3">
                      <span className="text-white font-semibold text-sm">{client.full_name}</span>
                      {props.length > 0 && (
                        <span className="text-[9px] bg-[#344a57]/60 text-[#8fa1ad] px-2 py-0.5 rounded-full">
                          {props.length} propert{props.length !== 1 ? 'ies' : 'y'}
                        </span>
                      )}
                    </div>
                    <div className="text-[#8fa1ad] text-xs mt-0.5">{client.email}</div>
                  </div>

                  {/* Stats */}
                  <div className="hidden md:flex items-center gap-8 flex-shrink-0">
                    {props[0]?.purchase_price && (
                      <div className="text-right">
                        <div className="text-[#8fa1ad] text-[10px] uppercase tracking-wider">Value</div>
                        <div className="text-white text-sm font-medium">{fmt(props[0].purchase_price)}</div>
                      </div>
                    )}
                    {equity > 0 && (
                      <div className="text-right">
                        <div className="text-[#8fa1ad] text-[10px] uppercase tracking-wider">Est. Equity</div>
                        <div className="text-green-400 text-sm font-medium">{fmt(equity)}</div>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button onClick={() => handleMessage(client)}
                      className="p-2 bg-[#344a57]/40 hover:bg-[#344a57] text-[#8fa1ad] hover:text-[#c9a84c] rounded-lg transition-all"
                      title="Send message">
                      <MessageSquare className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleRemove(client.id)} disabled={removing === client.id}
                      className="p-2 bg-[#344a57]/40 hover:bg-red-900/30 text-[#8fa1ad] hover:text-red-400 rounded-lg transition-all"
                      title="Remove client">
                      <Trash2 className="w-4 h-4" />
                    </button>
                    {props.length > 0 && (
                      <button onClick={() => setExpanded(isExpanded ? null : client.id)}
                        className="p-2 bg-[#344a57]/40 hover:bg-[#344a57] text-[#8fa1ad] hover:text-white rounded-lg transition-all">
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    )}
                  </div>
                </div>

                {/* Expanded properties */}
                {isExpanded && props.length > 0 && (
                  <div className="border-t border-[#344a57]/20 px-6 py-4 bg-[#0f1623]/40">
                    <p className="text-[#8fa1ad] text-xs uppercase tracking-wider mb-3">Properties</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {props.map(p => (
                        <div key={p.id} className="flex items-start gap-3 p-3 bg-[#1a2332] rounded-xl border border-[#344a57]/20">
                          <Home className="w-4 h-4 text-[#c9a84c] mt-0.5 flex-shrink-0" />
                          <div>
                            <div className="text-white text-xs font-medium">{p.address}</div>
                            <div className="text-[#8fa1ad] text-xs">{p.city}, {p.state} {p.zip}</div>
                            <div className="flex gap-3 mt-1.5 text-[10px] text-[#8fa1ad]">
                              {p.bedrooms && <span>{p.bedrooms}bd</span>}
                              {p.bathrooms && <span>{p.bathrooms}ba</span>}
                              {p.sqft && <span>{p.sqft?.toLocaleString()} sqft</span>}
                              {p.purchase_price && <span className="text-white font-medium">{fmt(p.purchase_price)}</span>}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {showAdd && <AddClientModal onClose={() => setShowAdd(false)} onAdded={() => { setShowAdd(false); window.location.reload() }} />}
      {showMsg && <SendMessageModal recipients={msgRecipients} onClose={() => setShowMsg(false)} onSent={() => { setShowMsg(false); window.location.reload() }} />}
    </div>
  )
}
