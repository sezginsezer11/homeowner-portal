'use client'

import { useState } from 'react'
import { Users, Search, Send, UserPlus, Trash2, ChevronDown, ChevronUp, AlertTriangle, Home } from 'lucide-react'
import AddClientModal from '../../agent/AddClientModal'
import LenderSendMessageModal from '../LenderSendMessageModal'

function fmt(n) { return n ? '$' + Math.round(n).toLocaleString() : '—' }

export default function LenderClientsClient({ relationships, currentRate }) {
  const [search, setSearch]           = useState('')
  const [showAdd, setShowAdd]         = useState(false)
  const [showMsg, setShowMsg]         = useState(false)
  const [msgRecipients, setMsgRecipients] = useState([])
  const [msgType, setMsgType]         = useState('rate_alert')
  const [expanded, setExpanded]       = useState(null)
  const [removing, setRemoving]       = useState(null)

  const clients = relationships.map(r => ({ ...r.homeowner, rel_id: r.id, joined: r.created_at })).filter(Boolean)

  const filtered = clients.filter(c =>
    c.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    c.email?.toLowerCase().includes(search.toLowerCase()) ||
    c.properties?.some(p => p.address?.toLowerCase().includes(search.toLowerCase()))
  )

  const refiCandidates = filtered.filter(c =>
    c.properties?.some(p => p.loan_rate && p.loan_rate > currentRate + 0.5)
  )

  const handleMessage = (client, type = 'rate_alert') => {
    setMsgRecipients([{ id: client.id, full_name: client.full_name }])
    setMsgType(type)
    setShowMsg(true)
  }

  const handleRemove = async (homeowner_id) => {
    if (!confirm('Remove this client?')) return
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Clients</h1>
          <p className="text-[#8fa1ad] text-sm mt-0.5">
            {clients.length} homeowner{clients.length !== 1 ? 's' : ''}
            {refiCandidates.length > 0 && <span className="text-[#c9a84c] ml-2">· {refiCandidates.length} refi {refiCandidates.length === 1 ? 'candidate' : 'candidates'}</span>}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {refiCandidates.length > 0 && (
            <button onClick={() => { setMsgRecipients(refiCandidates.map(c => ({ id: c.id, full_name: c.full_name }))); setMsgType('rate_alert'); setShowMsg(true) }}
              className="flex items-center gap-2 px-4 py-2.5 bg-[#c9a84c]/10 hover:bg-[#c9a84c]/20 text-[#c9a84c] rounded-xl font-medium text-sm border border-[#c9a84c]/20 transition-colors">
              <AlertTriangle className="w-4 h-4" /> Alert Refi Candidates
            </button>
          )}
          <button onClick={() => setShowAdd(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#c9a84c] hover:bg-[#d4b560] text-[#0f1623] rounded-xl font-semibold text-sm transition-colors shadow-lg">
            <UserPlus className="w-4 h-4" /> Add Client
          </button>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8fa1ad]" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search clients..."
          className="w-full pl-10 pr-4 py-3 bg-[#1a2332] border border-[#344a57]/30 rounded-xl text-white placeholder-[#464d4f] focus:outline-none focus:border-[#c9a84c] transition-colors text-sm" />
      </div>

      {filtered.length === 0 ? (
        <div className="bg-[#1a2332] border border-[#344a57]/30 rounded-2xl p-16 text-center">
          <Users className="w-12 h-12 text-[#344a57] mx-auto mb-4" />
          <p className="text-white font-semibold">{clients.length === 0 ? 'No clients yet' : 'No results'}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(client => {
            const props = client.properties || []
            const primaryProp = props[0]
            const isExpanded = expanded === client.id
            const equity = primaryProp?.purchase_price && primaryProp?.loan_balance
              ? primaryProp.purchase_price - primaryProp.loan_balance : null
            const isRefi = props.some(p => p.loan_rate && p.loan_rate > currentRate + 0.5)
            const ltv = primaryProp?.loan_balance && primaryProp?.purchase_price
              ? (primaryProp.loan_balance / primaryProp.purchase_price) * 100 : null

            return (
              <div key={client.id} className="bg-[#1a2332] border border-[#344a57]/30 rounded-2xl overflow-hidden">
                <div className="flex items-center gap-4 px-6 py-4">
                  <div className="w-11 h-11 rounded-full bg-gradient-to-br from-[#344a57] to-[#0f1623] border border-[#344a57] flex items-center justify-center text-white font-bold flex-shrink-0">
                    {client.full_name?.charAt(0) || '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-white font-semibold text-sm">{client.full_name}</span>
                      {isRefi && (
                        <span className="text-[9px] bg-[#c9a84c]/20 text-[#c9a84c] border border-[#c9a84c]/20 px-1.5 py-0.5 rounded-full">
                          Refi Candidate
                        </span>
                      )}
                    </div>
                    <div className="text-[#8fa1ad] text-xs">{client.email}</div>
                  </div>

                  <div className="hidden md:flex items-center gap-6 flex-shrink-0">
                    {primaryProp?.loan_balance && (
                      <div className="text-right">
                        <div className="text-[#8fa1ad] text-[10px] uppercase tracking-wider">Loan Bal.</div>
                        <div className="text-white text-xs font-medium">{fmt(primaryProp.loan_balance)}</div>
                      </div>
                    )}
                    {primaryProp?.loan_rate && (
                      <div className="text-right">
                        <div className="text-[#8fa1ad] text-[10px] uppercase tracking-wider">Rate</div>
                        <div className={`text-xs font-medium ${isRefi ? 'text-[#c9a84c]' : 'text-white'}`}>
                          {primaryProp.loan_rate}%
                        </div>
                      </div>
                    )}
                    {ltv != null && (
                      <div className="text-right">
                        <div className="text-[#8fa1ad] text-[10px] uppercase tracking-wider">LTV</div>
                        <div className="text-white text-xs font-medium">{ltv.toFixed(0)}%</div>
                      </div>
                    )}
                    {equity != null && (
                      <div className="text-right">
                        <div className="text-[#8fa1ad] text-[10px] uppercase tracking-wider">Equity</div>
                        <div className="text-green-400 text-xs font-medium">{fmt(equity)}</div>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button onClick={() => handleMessage(client, 'rate_alert')}
                      className="p-2 bg-[#344a57]/40 hover:bg-[#344a57] text-[#8fa1ad] hover:text-[#c9a84c] rounded-lg transition-all" title="Send rate alert">
                      <Send className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleRemove(client.id)} disabled={removing === client.id}
                      className="p-2 bg-[#344a57]/40 hover:bg-red-900/30 text-[#8fa1ad] hover:text-red-400 rounded-lg transition-all">
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

                {isExpanded && props.length > 0 && (
                  <div className="border-t border-[#344a57]/20 px-6 py-4 bg-[#0f1623]/40">
                    <p className="text-[#8fa1ad] text-xs uppercase tracking-wider mb-3">Properties</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {props.map(p => (
                        <div key={p.id} className="p-3 bg-[#1a2332] rounded-xl border border-[#344a57]/20">
                          <div className="flex items-start gap-2">
                            <Home className="w-4 h-4 text-[#c9a84c] mt-0.5 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <div className="text-white text-xs font-medium">{p.address}</div>
                              <div className="text-[#8fa1ad] text-xs">{p.city}, {p.state}</div>
                              <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-2 text-[10px]">
                                {p.loan_balance  && <span className="text-[#8fa1ad]">Loan: <span className="text-white">{fmt(p.loan_balance)}</span></span>}
                                {p.loan_rate     && <span className="text-[#8fa1ad]">Rate: <span className={p.loan_rate > currentRate + 0.5 ? 'text-[#c9a84c] font-semibold' : 'text-white'}>{p.loan_rate}%</span></span>}
                                {p.loan_type     && <span className="text-[#8fa1ad]">Type: <span className="text-white">{p.loan_type}</span></span>}
                                {p.purchase_price && <span className="text-[#8fa1ad]">Value: <span className="text-white">{fmt(p.purchase_price)}</span></span>}
                              </div>
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
      {showMsg && <LenderSendMessageModal recipients={msgRecipients} defaultType={msgType} currentRate={currentRate} onClose={() => setShowMsg(false)} onSent={() => { setShowMsg(false); window.location.reload() }} />}
    </div>
  )
}
