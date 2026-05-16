'use client'

import { useState } from 'react'
import { Users, MessageSquare, TrendingUp, Home, ChevronRight, Send, UserPlus } from 'lucide-react'
import AddClientModal from './AddClientModal'
import SendMessageModal from './SendMessageModal'
import Link from 'next/link'

function fmt(n) { return n ? '$' + Math.round(n).toLocaleString() : '—' }

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

export default function AgentDashboardClient({ profile, relationships, recentMessages }) {
  const [showAddClient, setShowAddClient]   = useState(false)
  const [showSendMsg, setShowSendMsg]       = useState(false)
  const [selectedClients, setSelectedClients] = useState([])

  const clients = relationships.map(r => r.homeowner).filter(Boolean)
  const totalPortfolioValue = clients.reduce((sum, c) => {
    const props = c.properties || []
    return sum + props.reduce((s, p) => s + (p.purchase_price || 0), 0)
  }, 0)
  const totalProperties = clients.reduce((sum, c) => sum + (c.properties?.length || 0), 0)

  const handleSendToAll = () => {
    setSelectedClients(clients.map(c => ({ id: c.id, full_name: c.full_name })))
    setShowSendMsg(true)
  }

  const handleSendToClient = (client) => {
    setSelectedClients([{ id: client.id, full_name: client.full_name }])
    setShowSendMsg(true)
  }

  return (
    <div className="space-y-6 max-w-7xl">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">
            {profile?.full_name?.split(' ')[0]}&apos;s Dashboard
          </h1>
          <p className="text-[#8fa1ad] text-sm mt-0.5">
            {profile?.company || 'Agent Portal'} · Real Estate Agent
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={handleSendToAll} disabled={clients.length === 0}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#344a57] hover:bg-[#344a57]/80 text-white rounded-xl font-medium text-sm transition-colors disabled:opacity-40 border border-[#344a57]">
            <Send className="w-4 h-4" /> Broadcast
          </button>
          <button onClick={() => setShowAddClient(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#c9a84c] hover:bg-[#d4b560] text-[#0f1623] rounded-xl font-semibold text-sm transition-colors shadow-lg">
            <UserPlus className="w-4 h-4" /> Add Client
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Users}        label="Total Clients"    value={clients.length}         sub="Connected homeowners" />
        <StatCard icon={Home}         label="Properties"       value={totalProperties}        sub="Across all clients"   color="text-green-400" />
        <StatCard icon={TrendingUp}   label="Portfolio Value"  value={totalPortfolioValue > 0 ? '$' + (totalPortfolioValue / 1e6).toFixed(1) + 'M' : '—'} sub="Combined purchase prices" color="text-blue-400" />
        <StatCard icon={MessageSquare} label="Messages Sent"   value={recentMessages.length > 0 ? recentMessages.length + '+' : '0'} sub="Recent activity" color="text-purple-400" />
      </div>

      {/* Client list + Recent messages */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Clients */}
        <div className="lg:col-span-2 bg-[#1a2332] border border-[#344a57]/30 rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-[#344a57]/20">
            <h3 className="text-white font-semibold text-sm">Your Clients</h3>
            <Link href="/dashboard/agent/clients"
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
                Add Your First Client
              </button>
            </div>
          ) : (
            <div className="divide-y divide-[#344a57]/10">
              {clients.slice(0, 6).map(client => {
                const props = client.properties || []
                const primaryProp = props[0]
                return (
                  <div key={client.id} className="flex items-center justify-between px-6 py-4 hover:bg-[#344a57]/10 transition-colors group">
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#344a57] to-[#1a2332] border border-[#344a57] flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
                        {client.full_name?.charAt(0) || '?'}
                      </div>
                      <div className="min-w-0">
                        <div className="text-white text-sm font-medium">{client.full_name}</div>
                        <div className="text-[#8fa1ad] text-xs truncate">
                          {primaryProp
                            ? `${primaryProp.address}, ${primaryProp.city}`
                            : client.email}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 flex-shrink-0">
                      <div className="text-right hidden md:block">
                        {primaryProp?.purchase_price && (
                          <div className="text-white text-xs font-medium">{fmt(primaryProp.purchase_price)}</div>
                        )}
                        <div className="text-[#8fa1ad] text-xs">{props.length} propert{props.length !== 1 ? 'ies' : 'y'}</div>
                      </div>
                      <button onClick={() => handleSendToClient(client)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-2 bg-[#344a57] hover:bg-[#344a57]/80 rounded-lg">
                        <MessageSquare className="w-3.5 h-3.5 text-[#c9a84c]" />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Recent Messages Sent */}
        <div className="bg-[#1a2332] border border-[#344a57]/30 rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-[#344a57]/20">
            <h3 className="text-white font-semibold text-sm">Recent Activity</h3>
            <Link href="/dashboard/agent/messages"
              className="text-[#8fa1ad] hover:text-[#c9a84c] text-xs flex items-center gap-1 transition-colors">
              All <ChevronRight className="w-3 h-3" />
            </Link>
          </div>

          {recentMessages.length === 0 ? (
            <div className="p-8 text-center">
              <MessageSquare className="w-8 h-8 text-[#344a57] mx-auto mb-2" />
              <p className="text-[#464d4f] text-xs">No messages sent yet</p>
            </div>
          ) : (
            <div className="divide-y divide-[#344a57]/10">
              {recentMessages.map(msg => (
                <div key={msg.id} className="px-6 py-3">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-white text-xs font-medium truncate">{msg.to?.full_name || 'Unknown'}</span>
                    <span className={`text-[9px] px-1.5 py-0.5 rounded-full flex-shrink-0 ml-2 ${
                      msg.message_type === 'value_update' ? 'bg-[#c9a84c]/20 text-[#c9a84c]' :
                      msg.message_type === 'rate_alert'   ? 'bg-blue-900/30 text-blue-400' :
                      'bg-[#344a57]/40 text-[#8fa1ad]'
                    }`}>
                      {msg.message_type === 'value_update' ? 'Value' : msg.message_type === 'rate_alert' ? 'Rate' : 'Msg'}
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
        <SendMessageModal
          recipients={selectedClients}
          onClose={() => setShowSendMsg(false)}
          onSent={() => { setShowSendMsg(false); window.location.reload() }}
        />
      )}
    </div>
  )
}
