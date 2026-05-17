'use client'
import { useState } from 'react'
import { Users, MessageSquare, TrendingUp, Home, Plus, ChevronDown, ChevronUp, Send } from 'lucide-react'
import AddClientModal from './AddClientModal'
import SendMessageModal from './SendMessageModal'

function fmt(n) { return n ? '$' + Math.round(n).toLocaleString('en-US') : '—' }

export default function AgentDashboardClient({ profile, clients, messages }) {
  const [showAddModal, setShowAddModal]     = useState(false)
  const [showMsgModal, setShowMsgModal]     = useState(false)
  const [selectedClient, setSelectedClient] = useState(null)
  const [expanded, setExpanded]             = useState({})

  const toggleExpand = (id) => setExpanded(p => ({ ...p, [id]: !p[id] }))

  const stats = [
    { label:'Total Clients', value:clients.length,                               icon:Users,      color:'text-[#1877F2]', bg:'bg-[#e7f0fd]' },
    { label:'Properties',    value:clients.reduce((s,c)=>s+(c.properties?.length||0),0), icon:Home, color:'text-green-600', bg:'bg-green-50' },
    { label:'Messages Sent', value:messages.length,                              icon:MessageSquare, color:'text-purple-600', bg:'bg-purple-50' },
    { label:'Avg Equity',    value:(() => { const vals=clients.flatMap(c=>(c.properties||[]).map(p=>p.avm_value&&p.loan_balance?p.avm_value-p.loan_balance:0)).filter(Boolean); return vals.length?fmt(vals.reduce((a,b)=>a+b,0)/vals.length):'—'; })(), icon:TrendingUp, color:'text-[#c9a84c]', bg:'bg-yellow-50' },
  ]

  return (
    <div className="space-y-5 pb-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-[#1a1a2e]">Agent Dashboard</h1>
          <p className="text-[#65676b] text-sm mt-0.5">Welcome back, {profile?.full_name?.split(' ')[0]}</p>
        </div>
        <button onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#1877F2] hover:bg-[#1665d8] text-white rounded-xl font-semibold text-sm transition-colors shadow-sm">
          <Plus className="w-4 h-4" /> Add Client
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {stats.map(s => (
          <div key={s.label} className="bg-white rounded-2xl border border-[#e4e6eb] shadow-card p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-semibold text-[#65676b] uppercase tracking-wider">{s.label}</span>
              <div className={`w-7 h-7 rounded-xl flex items-center justify-center ${s.bg}`}>
                <s.icon className={`w-3.5 h-3.5 ${s.color}`} />
              </div>
            </div>
            <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-[#e4e6eb] shadow-card overflow-hidden">
        <div className="px-5 py-4 border-b border-[#e4e6eb] flex items-center justify-between">
          <h2 className="text-[#1a1a2e] font-bold text-sm flex items-center gap-2"><Users className="w-4 h-4 text-[#1877F2]" /> My Clients</h2>
        </div>
        {clients.length === 0 ? (
          <div className="p-10 text-center">
            <Users className="w-10 h-10 text-[#e4e6eb] mx-auto mb-3" />
            <p className="text-[#65676b] text-sm">No clients yet — send connection requests to homeowners</p>
            <button onClick={() => setShowAddModal(true)} className="mt-3 px-4 py-2 bg-[#1877F2] text-white rounded-xl text-sm font-semibold hover:bg-[#1665d8] transition-colors">Add First Client</button>
          </div>
        ) : (
          <div className="divide-y divide-[#f0f2f5]">
            {clients.map(client => (
              <div key={client.id}>
                <div className="flex items-center justify-between px-5 py-3.5 hover:bg-[#f8f9fa] transition-colors cursor-pointer" onClick={() => toggleExpand(client.id)}>
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-[#e7f0fd] flex items-center justify-center text-[#1877F2] font-bold text-sm flex-shrink-0">
                      {client.full_name?.charAt(0) || '?'}
                    </div>
                    <div>
                      <div className="text-[#1a1a2e] font-semibold text-sm">{client.full_name}</div>
                      <div className="text-[#9ca3af] text-xs">{client.email} · {client.properties?.length || 0} properties</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={e => { e.stopPropagation(); setSelectedClient(client); setShowMsgModal(true); }}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-[#e7f0fd] text-[#1877F2] hover:bg-[#1877F2] hover:text-white rounded-lg text-xs font-semibold transition-all">
                      <Send className="w-3 h-3" /> Message
                    </button>
                    {expanded[client.id] ? <ChevronUp className="w-4 h-4 text-[#9ca3af]" /> : <ChevronDown className="w-4 h-4 text-[#9ca3af]" />}
                  </div>
                </div>
                {expanded[client.id] && (
                  <div className="px-5 pb-4 bg-[#f8f9fa]">
                    {(client.properties||[]).length === 0 ? (
                      <p className="text-[#9ca3af] text-xs py-2">No properties added</p>
                    ) : (
                      <div className="space-y-2 mt-2">
                        {(client.properties||[]).map(p => {
                          const equity = p.avm_value && p.loan_balance ? p.avm_value - p.loan_balance : null
                          return (
                            <div key={p.id} className="bg-white rounded-xl border border-[#e4e6eb] p-3">
                              <div className="text-[#1a1a2e] font-semibold text-xs">{p.address}, {p.city}</div>
                              <div className="grid grid-cols-3 gap-2 mt-2">
                                {[{l:'Est. Value',v:fmt(p.avm_value)},{l:'Equity',v:fmt(equity)},{l:'Loan',v:fmt(p.loan_balance)}].map(item=>(
                                  <div key={item.l}><div className="text-[#9ca3af] text-[9px] uppercase tracking-wider">{item.l}</div><div className="text-[#1a1a2e] font-bold text-xs">{item.v}</div></div>
                                ))}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {showAddModal && <AddClientModal onClose={() => setShowAddModal(false)} onAdded={() => { setShowAddModal(false); window.location.reload() }} />}
      {showMsgModal && selectedClient && <SendMessageModal client={selectedClient} onClose={() => setShowMsgModal(false)} />}
    </div>
  )
}
