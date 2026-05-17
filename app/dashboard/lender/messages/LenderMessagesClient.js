'use client'

import { useState } from 'react'
import { MessageSquare, Send, Edit3, Percent } from 'lucide-react'
import LenderSendMessageModal from '../LenderSendMessageModal'

const TYPE_BADGE = {
  rate_alert: { label: 'Rate Alert', cls: 'bg-blue-900/30 text-blue-400' },
  general:    { label: 'General',    cls: 'bg-[#344a57]/40 text-[#8fa1ad]' },
}

export default function LenderMessagesClient({ sentMessages, clients, currentRate }) {
  const [selected, setSelected]     = useState(sentMessages[0] || null)
  const [showCompose, setShowCompose] = useState(false)
  const [composeRecipients, setComposeRecipients] = useState([])
  const [composeType, setComposeType] = useState('rate_alert')

  const handleCompose = (client = null, type = 'rate_alert') => {
    setComposeRecipients(client
      ? [{ id: client.id, full_name: client.full_name }]
      : clients.map(c => ({ id: c.id, full_name: c.full_name }))
    )
    setComposeType(type)
    setShowCompose(true)
  }

  return (
    <div className="space-y-4 max-w-7xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Messages</h1>
          <p className="text-[#8fa1ad] text-sm mt-0.5">{sentMessages.length} sent</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => handleCompose(null, 'rate_alert')}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-900/30 hover:bg-blue-900/50 text-blue-400 rounded-xl font-medium text-sm border border-blue-500/20 transition-colors">
            <Percent className="w-4 h-4" /> Rate Alert
          </button>
          <button onClick={() => handleCompose(null, 'general')}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#c9a84c] hover:bg-[#d4b560] text-[#0f1623] rounded-xl font-semibold text-sm transition-colors shadow-lg">
            <Edit3 className="w-4 h-4" /> New Message
          </button>
        </div>
      </div>

      {sentMessages.length === 0 ? (
        <div className="bg-[#1a2332] border border-[#344a57]/30 rounded-2xl p-16 text-center">
          <MessageSquare className="w-12 h-12 text-[#344a57] mx-auto mb-4" />
          <p className="text-white font-semibold">No messages sent yet</p>
          <p className="text-[#8fa1ad] text-sm mt-1 mb-6">Send your first rate alert or message to a client</p>
          <button onClick={() => handleCompose(null, 'rate_alert')}
            className="px-5 py-2.5 bg-[#c9a84c] hover:bg-[#d4b560] text-[#0f1623] rounded-xl font-semibold text-sm transition-colors">
            Send Rate Alert
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 h-[calc(100vh-160px)]">
          <div className="lg:col-span-2 bg-[#1a2332] border border-[#344a57]/30 rounded-2xl overflow-hidden flex flex-col">
            <div className="px-4 py-3 border-b border-[#344a57]/20">
              <p className="text-[#8fa1ad] text-xs">Sent messages</p>
            </div>
            <div className="overflow-y-auto flex-1">
              {sentMessages.map(msg => {
                const badge = TYPE_BADGE[msg.message_type] || TYPE_BADGE.general
                return (
                  <button key={msg.id} onClick={() => setSelected(msg)}
                    className={`w-full text-left px-4 py-3.5 border-b border-[#344a57]/10 hover:bg-[#344a57]/10 transition-colors ${selected?.id === msg.id ? 'bg-[#344a57]/20' : ''}`}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-white text-xs font-medium truncate">{msg.to?.full_name}</span>
                      <span className={`text-[9px] px-1.5 py-0.5 rounded-full flex-shrink-0 ml-2 ${badge.cls}`}>{badge.label}</span>
                    </div>
                    <p className="text-[#8fa1ad] text-xs truncate">{msg.subject || msg.body}</p>
                    <p className="text-[#464d4f] text-[10px] mt-1">{new Date(msg.created_at).toLocaleDateString()}</p>
                  </button>
                )
              })}
            </div>
          </div>

          <div className="lg:col-span-3 bg-[#1a2332] border border-[#344a57]/30 rounded-2xl flex flex-col">
            {selected ? (
              <div className="p-6 flex flex-col h-full">
                <div className="pb-5 border-b border-[#344a57]/20">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h2 className="text-white font-semibold">{selected.subject || '(No subject)'}</h2>
                      <p className="text-[#8fa1ad] text-sm mt-1">To: <span className="text-white">{selected.to?.full_name}</span></p>
                      <p className="text-[#464d4f] text-xs mt-0.5">{new Date(selected.created_at).toLocaleString()}</p>
                    </div>
                    <button
                      onClick={() => { setComposeRecipients([{ id: selected.to_id, full_name: selected.to?.full_name }]); setComposeType(selected.message_type || 'general'); setShowCompose(true) }}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-[#344a57]/40 hover:bg-[#344a57] text-[#8fa1ad] hover:text-white rounded-lg text-xs transition-all flex-shrink-0">
                      <Send className="w-3 h-3" /> Follow Up
                    </button>
                  </div>
                </div>
                <div className="flex-1 pt-5 overflow-y-auto">
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

      {showCompose && (
        <LenderSendMessageModal
          recipients={composeRecipients}
          defaultType={composeType}
          currentRate={currentRate}
          onClose={() => setShowCompose(false)}
          onSent={() => { setShowCompose(false); window.location.reload() }}
        />
      )}
    </div>
  )
}
