'use client'

import { useState } from 'react'
import { MessageSquare, TrendingUp, DollarSign, Bell } from 'lucide-react'

const TYPE_CONFIG = {
  value_update: { label: 'Value Update', icon: TrendingUp, color: 'text-[#c9a84c]', bg: 'bg-[#c9a84c]/10 border-[#c9a84c]/20' },
  rate_alert:   { label: 'Rate Alert',   icon: DollarSign, color: 'text-blue-400',  bg: 'bg-blue-900/20 border-blue-500/20' },
  general:      { label: 'Message',      icon: MessageSquare, color: 'text-[#8fa1ad]', bg: 'bg-[#0f1623] border-[#344a57]/20' },
}

export default function MessagesClient({ messages }) {
  const [selected, setSelected] = useState(messages[0] || null)

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-white">Messages</h1>

      {messages.length === 0 ? (
        <div className="bg-[#1a2332] border border-[#344a57]/30 rounded-2xl p-16 text-center">
          <MessageSquare className="w-12 h-12 text-[#344a57] mx-auto mb-4" />
          <p className="text-white font-semibold">No messages yet</p>
          <p className="text-[#8fa1ad] text-sm mt-1">Your agent and lender will reach out here</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-[calc(100vh-160px)]">

          {/* List */}
          <div className="bg-[#1a2332] border border-[#344a57]/30 rounded-2xl overflow-hidden flex flex-col">
            <div className="p-4 border-b border-[#344a57]/20">
              <p className="text-[#8fa1ad] text-xs">{messages.length} message{messages.length !== 1 ? 's' : ''}</p>
            </div>
            <div className="overflow-y-auto flex-1">
              {messages.map(msg => {
                const cfg = TYPE_CONFIG[msg.message_type] || TYPE_CONFIG.general
                const Icon = cfg.icon
                return (
                  <button key={msg.id} onClick={() => setSelected(msg)}
                    className={`w-full text-left p-4 border-b border-[#344a57]/10 hover:bg-[#344a57]/10 transition-colors ${selected?.id === msg.id ? 'bg-[#344a57]/20' : ''}`}>
                    <div className="flex items-start gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 border ${cfg.bg}`}>
                        <Icon className={`w-3.5 h-3.5 ${cfg.color}`} />
                      </div>
                      <div className="min-w-0">
                        <div className="text-white text-xs font-medium truncate">{msg.from?.full_name || 'Unknown'}</div>
                        <div className="text-[#8fa1ad] text-xs truncate mt-0.5">{msg.subject || msg.body}</div>
                        <div className="text-[#464d4f] text-[10px] mt-1">{new Date(msg.created_at).toLocaleDateString()}</div>
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Detail */}
          <div className="lg:col-span-2 bg-[#1a2332] border border-[#344a57]/30 rounded-2xl flex flex-col">
            {selected ? (
              <div className="p-6 flex flex-col h-full">
                <div className="flex items-start gap-4 pb-6 border-b border-[#344a57]/20">
                  <div className="w-12 h-12 rounded-full bg-[#344a57] flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                    {selected.from?.full_name?.charAt(0) || '?'}
                  </div>
                  <div>
                    <h2 className="text-white font-semibold">{selected.subject || 'No subject'}</h2>
                    <div className="text-[#8fa1ad] text-sm mt-0.5">
                      From <span className="text-white">{selected.from?.full_name}</span>
                      {selected.from?.company && <span className="text-[#8fa1ad]"> · {selected.from.company}</span>}
                    </div>
                    <div className="text-[#464d4f] text-xs mt-0.5">{new Date(selected.created_at).toLocaleString()}</div>
                  </div>
                </div>
                <div className="flex-1 pt-6">
                  <p className="text-[#dadde1] leading-relaxed text-sm whitespace-pre-line">{selected.body}</p>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <p className="text-[#464d4f] text-sm">Select a message to read</p>
              </div>
            )}
          </div>

        </div>
      )}
    </div>
  )
}
