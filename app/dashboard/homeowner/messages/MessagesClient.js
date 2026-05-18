'use client'
import { useState } from 'react'
import { MessageSquare, Send, User, Clock, Tag, ChevronRight, ArrowLeft } from 'lucide-react'

const TYPE_CONFIG = {
  general:      { label:'Message',      cls:'bg-[#f0f2f5] text-[#65676b]' },
  value_update: { label:'Value Update', cls:'bg-[#e7f0fd] text-[#1877F2]' },
  rate_alert:   { label:'Rate Alert',   cls:'bg-purple-50 text-purple-600' },
}

export default function MessagesClient({ messages, userId }) {
  const [selected, setSelected] = useState(messages[0] || null)
  const [reply, setReply]       = useState('')
  const [sending, setSending]   = useState(false)

  const handleReply = async () => {
    if (!reply.trim() || !selected) return
    setSending(true)
    try {
      await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to_id:        selected.from_id,
          property_id:  selected.property_id,
          subject:      `Re: ${selected.subject || 'Message'}`,
          body:         reply,
          message_type: 'general',
        }),
      })
      setReply('')
    } catch {}
    finally { setSending(false) }
  }

  return (
    <div className="max-w-5xl mx-auto pb-10">
      <h1 className="text-2xl font-bold text-[#1a1a2e] mb-5 flex items-center gap-2">
        <MessageSquare className="w-6 h-6 text-[#1877F2]" /> Messages
      </h1>

      {messages.length === 0 ? (
        <div className="bg-white rounded-2xl border border-[#e4e6eb] shadow-card p-12 text-center">
          <MessageSquare className="w-12 h-12 text-[#e4e6eb] mx-auto mb-4" />
          <h3 className="text-[#1a1a2e] font-bold text-lg mb-1">No messages yet</h3>
          <p className="text-[#65676b] text-sm">Messages from your agent and lender will appear here</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-[600px]">
          {/* Message list */}
          <div className="bg-white rounded-2xl border border-[#e4e6eb] shadow-card overflow-hidden flex flex-col">
            <div className="px-4 py-3 border-b border-[#e4e6eb] bg-[#f8f9fa]">
              <h2 className="text-[#1a1a2e] font-bold text-sm">Inbox ({messages.length})</h2>
            </div>
            <div className="flex-1 overflow-y-auto divide-y divide-[#f0f2f5]">
              {messages.map(msg => {
                const cfg = TYPE_CONFIG[msg.message_type] || TYPE_CONFIG.general
                const isSelected = selected?.id === msg.id
                return (
                  <button key={msg.id} onClick={() => setSelected(msg)}
                    className={`w-full text-left px-4 py-3.5 hover:bg-[#f8f9fa] transition-colors ${isSelected ? 'bg-[#e7f0fd] border-l-2 border-[#1877F2]' : ''}`}>
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-7 h-7 rounded-full bg-[#e7f0fd] flex items-center justify-center text-[#1877F2] font-bold text-xs flex-shrink-0">
                          {msg.from?.full_name?.charAt(0) || '?'}
                        </div>
                        <span className="text-[#1a1a2e] font-semibold text-xs truncate">{msg.from?.full_name}</span>
                      </div>
                      <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold flex-shrink-0 ${cfg.cls}`}>{cfg.label}</span>
                    </div>
                    <div className="text-[#65676b] text-xs font-medium truncate ml-9">{msg.subject || msg.body}</div>
                    <div className="text-[#9ca3af] text-[10px] mt-1 ml-9 flex items-center gap-1">
                      <Clock className="w-2.5 h-2.5" />
                      {new Date(msg.created_at).toLocaleDateString('en-US', {month:'short', day:'numeric', hour:'2-digit', minute:'2-digit'})}
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Message detail */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-[#e4e6eb] shadow-card overflow-hidden flex flex-col">
            {selected ? (
              <>
                {/* Header */}
                <div className="px-5 py-4 border-b border-[#e4e6eb] bg-[#f8f9fa]">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#e7f0fd] flex items-center justify-center text-[#1877F2] font-bold flex-shrink-0">
                      {selected.from?.full_name?.charAt(0) || '?'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[#1a1a2e] font-bold text-sm">{selected.from?.full_name}</span>
                        <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold ${(TYPE_CONFIG[selected.message_type]||TYPE_CONFIG.general).cls}`}>
                          {(TYPE_CONFIG[selected.message_type]||TYPE_CONFIG.general).label}
                        </span>
                      </div>
                      <div className="text-[#65676b] font-semibold text-sm mt-0.5">{selected.subject || 'Message'}</div>
                      <div className="text-[#9ca3af] text-xs flex items-center gap-1 mt-0.5">
                        <Clock className="w-3 h-3" />
                        {new Date(selected.created_at).toLocaleString('en-US', {month:'long', day:'numeric', year:'numeric', hour:'2-digit', minute:'2-digit'})}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-5">
                  <div className="bg-[#f8f9fa] rounded-2xl p-5 text-[#1a1a2e] text-sm leading-relaxed border border-[#e4e6eb]">
                    {selected.body}
                  </div>
                </div>

                {/* Reply */}
                <div className="border-t border-[#e4e6eb] p-4">
                  <div className="flex gap-2">
                    <textarea value={reply} onChange={e => setReply(e.target.value)}
                      placeholder="Write a reply..."
                      rows={2}
                      className="flex-1 px-3 py-2.5 bg-[#f8f9fa] border border-[#e4e6eb] rounded-xl text-[#1a1a2e] placeholder-[#9ca3af] focus:outline-none focus:border-[#1877F2] text-sm resize-none" />
                    <button onClick={handleReply} disabled={!reply.trim() || sending}
                      className="px-4 py-2.5 bg-[#1877F2] hover:bg-[#1665d8] text-white rounded-xl font-bold text-sm transition-colors disabled:opacity-40 flex items-center gap-2 self-end">
                      <Send className="w-4 h-4" />
                      {sending ? 'Sending...' : 'Send'}
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-center p-10">
                <div>
                  <MessageSquare className="w-10 h-10 text-[#e4e6eb] mx-auto mb-3" />
                  <p className="text-[#9ca3af] text-sm">Select a message to read</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
