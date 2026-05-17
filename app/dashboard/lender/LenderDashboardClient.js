'use client'

import { useState } from 'react'
import { Users, TrendingUp, DollarSign, Percent, ChevronRight, UserPlus, Send, AlertTriangle, Home } from 'lucide-react'
import Link from 'next/link'
import AddClientModal from '../agent/AddClientModal'
import LenderSendMessageModal from './LenderSendMessageModal'

function fmt(n) { return n ? '$' + Math.round(n).toLocaleString() : '—' }
function pct(n)  { return n ? n.toFixed(3) + '%' : '—' }

function StatCard({ icon: Icon, label, value, sub, color = 'text-[#c9a84c]' }) {
  return (
    <div className="bg-[#1a2332] border border-[#344a57]/30 rounded-2xl p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-medium text-[#8fa1ad] uppercase tracking-wider">{label}</span>
        <Icon className={`w-4 h-4 ${color}`} />
      </div>
      <div className="text-3xl font-bold text-white">{value}</div>
      {sub && <div className="text-xs text-[#8fa1ad] mt-1">{sub}</div>}
    </div>
  )
}

export default function LenderDashboardClient({ profile, relationships, recentMessages, currentRate }) {
  const [showAddClient, setShowAddClient] = useState(false)
  const [showSendMsg, setShowSendMsg]     = useState(false)
  const [msgRecipients, setMsgRecipients] = useState([])
  const [msgType, setMsgType]             = useState('rate_alert')

  const clients = relationships.map(r => r.homeowner).filter(Boolean)

  // Calculate portfolio stats
  const totalLoanBalance = clients.reduce((sum, c) =>
    sum + (c.properties || []).reduce((s, p) => s + (p.loan_balance || 0), 0), 0)

  const totalEquity = clients.reduce((sum, c) =>
    sum + (c.properties || []).reduce((s, p) =>
      s + (p.purchase_price && p.loan_balance ? p.purchase_price - p.loan_balance : 0), 0), 0)

  // Refi opportunities — clients with loan_rate > currentRate + 0.5
  const refiOpportunities = clients.filter(c =>
    (c.properties || []).some(p => p.loan_rate && p.loan_rate > currentRate + 0.5)
  )

  const handleSendToAll = (type = 'rate_alert') => {
    setMsgRecipients(clients.map(c => ({ id: c.id, full_name: c.full_name })))
    setMsgType(type)
    setShowSendMsg(true)
  }

  const handleSendToClient = (client, type = 'rate_alert') => {
    setMsgRecipients([{ id: client.id, full_name: client.full_name }])
    setMsgType(type)
    setShowSendMsg(true)
  }

  return (
    <div className="space-y-6 max-w-7xl">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">
            {profile?.full_name?.split(' ')[0]}&apos;s Lender Dashboard
          </h1>
          <p className="text-[#8fa1ad] text-sm mt-0.5">
            {profile?.company || 'Lender Portal'} · Mortgage Professional
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => handleSendToAll('rate_alert')} disabled={clients.length === 0}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#344a57] hover:bg-[#344a57]/80 text-white rounded-xl font-medium text-sm transition-colors disabled:opacity-40 border border-[#344a57]">
            <Send className="w-4 h-4" /> Rate Blast
          </button>
          <button onClick={() => setShowAddClient(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#c9a84c] hover:bg-[#d4b560] text-[#0f1623] rounded-xl font-semibold text-sm transition-colors shadow-lg">
            <UserPlus className="w-4 h-4" /> Add Client
          </button>
        </div>
      </div>

      {/* Rate Banner */}
      <div className="bg-gradient-to-r from-[#1a2332] to-[#1e2d3d] border border-blue-500/20 rounded-2xl p-5 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-900/30 border border-blue-500/20 flex items-center justify-center">
            <Percent className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <div className="text-xs text-[#8fa1ad] uppercase tracking-wider mb-0.5">Current 30-Year Fixed — Freddie Mac</div>
            <div className="text-3xl font-bold text-blue-400">{currentRate}%</div>
          </div>
        </div>
        {refiOpportunities.length > 0 && (
          <div className="flex items-center gap-3 bg-[#c9a84c]/10 border border-[#c9a84c]/20 rounded-xl px-4 py-3">
            <AlertTriangle className="w-4 h-4 text-[#c9a84c]" />
            <div>
              <div className="text-white font-semibold text-sm">{refiOpportunities.length} Refi {refiOpportunities.length === 1 ? 'Opportunity' : 'Opportunities'}</div>
              <div className="text-[#8fa1ad] text-xs">Clients with rates 0.5%+ above market</div>
            </div>
            <button onClick={() => { setMsgRecipients(refiOpportunities.map(c => ({ id: c.id, full_name: c.full_name }))); setMsgType('rate_alert'); setShowSendMsg(true) }}
              className="ml-2 px-3 py-1.5 bg-[#c9a84c] hover:bg-[#d4b560] text-[#0f1623] rounded-lg text-xs font-semibold transition-colors">
              Alert Them
            </button>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Users}      label="Total Clients"   value={clients.length}       sub="Connected homeowners"     />
        <StatCard icon={DollarSign} label="Loan Portfolio"  value={totalLoanBalance > 0 ? '$' + (totalLoanBalance / 1e6).toFixed(1) + 'M' : '—'} sub="Total loan balances" color="text-blue-400" />
        <StatCard icon={TrendingUp} label="Client Equity"   value={totalEquity > 0 ? '$' + (totalEquity / 1e6).toFixed(1) + 'M' : '—'} sub="Combined home equity" color="text-green-400" />
        <StatCard icon={AlertTriangle} label="Refi Alerts"  value={refiOpportunities.length} sub="Above-market rate clients" color="text-[#c9a84c]" />
      </div>

      {/* Client list + Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Clients */}
        <div className="lg:col-span-2 bg-[#1a2332] border border-[#344a57]/30 rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-[#344a57]/20">
            <h3 className="text-white font-semibold text-sm">Client Portfolio</h3>
            <Link href="/dashboard/lender/clients"
              className="text-[#8fa1ad] hover:text-[#c9a84c] text-xs flex items-center gap-1 transition-colors">
              View all <ChevronRight className="w-3 h-3" />
            </Link>
          </div>

          {clients.length === 0 ? (
            <div className="p-12 text-center">
              <Users className="w-10 h-10 text-[#344a57] mx-auto mb-3" />
              <p className="text-white font-semibold text-sm">No clients yet</p>
              <p className="text-[#8fa1ad] text-xs mt-1 mb-4">Add homeowners by their email address</p>
              <button onClick={() => setShowAddClient(true)}
                className="px-4 py-2 bg-[#c9a84c] hover:bg-[#d4b560] text-[#0f1623] rounded-lg font-semibold text-sm transition-colors">
                Add First Client
              </button>
            </div>
          ) : (
            <div className="divide-y divide-[#344a57]/10">
              {clients.slice(0, 6).map(client => {
                const props = client.properties || []
                const primaryProp = props[0]
                const equity = primaryProp?.purchase_price && primaryProp?.loan_balance
                  ? primaryProp.purchase_price - primaryProp.loan_balance : null
                const equityPct = equity && primaryProp?.purchase_price
                  ? (equity / primaryProp.purchase_price) * 100 : null
                const isRefiCandidate = props.some(p => p.loan_rate && p.loan_rate > currentRate + 0.5)

                return (
                  <div key={client.id} className="flex items-center gap-4 px-6 py-4 hover:bg-[#344a57]/10 transition-colors group">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#344a57] to-[#0f1623] border border-[#344a57] flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
                      {client.full_name?.charAt(0) || '?'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-white text-sm font-medium">{client.full_name}</span>
                        {isRefiCandidate && (
                          <span className="text-[9px] bg-[#c9a84c]/20 text-[#c9a84c] border border-[#c9a84c]/20 px-1.5 py-0.5 rounded-full">
                            Refi Ready
                          </span>
                        )}
                      </div>
                      <div className="text-[#8fa1ad] text-xs truncate">
                        {primaryProp ? `${primaryProp.address}, ${primaryProp.city}` : client.email}
                      </div>
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
                          <div className="text-[#8fa1ad] text-[10px] uppercase tracking-wider">Their Rate</div>
                          <div className={`text-xs font-medium ${primaryProp.loan_rate > currentRate + 0.5 ? 'text-[#c9a84c]' : 'text-white'}`}>
                            {pct(primaryProp.loan_rate)}
                          </div>
                        </div>
                      )}
                      {equityPct != null && (
                        <div className="text-right">
                          <div className="text-[#8fa1ad] text-[10px] uppercase tracking-wider">Equity</div>
                          <div className="text-green-400 text-xs font-medium">{equityPct.toFixed(0)}%</div>
                        </div>
                      )}
                    </div>
                    <button onClick={() => handleSendToClient(client, 'rate_alert')}
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-2 bg-[#344a57] hover:bg-[#344a57]/80 rounded-lg">
                      <Send className="w-3.5 h-3.5 text-[#c9a84c]" />
                    </button>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Recent Activity */}
        <div className="bg-[#1a2332] border border-[#344a57]/30 rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-[#344a57]/20">
            <h3 className="text-white font-semibold text-sm">Recent Activity</h3>
            <Link href="/dashboard/lender/messages"
              className="text-[#8fa1ad] hover:text-[#c9a84c] text-xs flex items-center gap-1 transition-colors">
              All <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
          {recentMessages.length === 0 ? (
            <div className="p-8 text-center">
              <Send className="w-8 h-8 text-[#344a57] mx-auto mb-2" />
              <p className="text-[#464d4f] text-xs">No messages sent yet</p>
            </div>
          ) : (
            <div className="divide-y divide-[#344a57]/10">
              {recentMessages.map(msg => (
                <div key={msg.id} className="px-6 py-3">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-white text-xs font-medium truncate">{msg.to?.full_name}</span>
                    <span className={`text-[9px] px-1.5 py-0.5 rounded-full flex-shrink-0 ml-2 ${
                      msg.message_type === 'rate_alert' ? 'bg-blue-900/30 text-blue-400' : 'bg-[#344a57]/40 text-[#8fa1ad]'
                    }`}>
                      {msg.message_type === 'rate_alert' ? 'Rate' : 'Msg'}
                    </span>
                  </div>
                  <p className="text-[#8fa1ad] text-xs truncate">{msg.subject || msg.body}</p>
                  <p className="text-[#464d4f] text-[10px] mt-0.5">{new Date(msg.created_at).toLocaleDateString()}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {showAddClient && (
        <AddClientModal onClose={() => setShowAddClient(false)} onAdded={() => { setShowAddClient(false); window.location.reload() }} />
      )}
      {showSendMsg && (
        <LenderSendMessageModal
          recipients={msgRecipients}
          defaultType={msgType}
          currentRate={currentRate}
          onClose={() => setShowSendMsg(false)}
          onSent={() => { setShowSendMsg(false); window.location.reload() }}
        />
      )}
    </div>
  )
}
