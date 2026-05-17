'use client'

import { useState } from 'react'
import { Percent, TrendingDown, TrendingUp, Users, Send, AlertTriangle } from 'lucide-react'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'
import LenderSendMessageModal from '../LenderSendMessageModal'

function fmt(n) { return n ? '$' + Math.round(n).toLocaleString() : '—' }

export default function RatesClient({ clients, rateHistory, currentRate }) {
  const [showMsg, setShowMsg]         = useState(false)
  const [msgRecipients, setMsgRecipients] = useState([])

  const prevRate   = rateHistory.length > 1 ? rateHistory[rateHistory.length - 2]?.rate : currentRate
  const rateChange = currentRate - prevRate
  const rateUp     = rateChange > 0

  // Refi candidates
  const refiCandidates = clients.filter(c =>
    c.properties?.some(p => p.loan_rate && p.loan_rate > currentRate + 0.5)
  ).map(c => ({
    ...c,
    property: c.properties?.find(p => p.loan_rate && p.loan_rate > currentRate + 0.5),
  }))

  const handleAlertAll = () => {
    setMsgRecipients(refiCandidates.map(c => ({ id: c.id, full_name: c.full_name })))
    setShowMsg(true)
  }

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold text-white">Rate Center</h1>
        <p className="text-[#8fa1ad] text-sm mt-0.5">Live mortgage rates and refi opportunity tracking</p>
      </div>

      {/* Current rate + trend */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-[#1a2332] to-[#1e2d3d] border border-blue-500/20 rounded-2xl p-6 md:col-span-1">
          <div className="text-xs text-[#8fa1ad] uppercase tracking-wider mb-2">30-Year Fixed Today</div>
          <div className="text-5xl font-bold text-blue-400">{currentRate}%</div>
          <div className={`flex items-center gap-1.5 mt-3 text-sm font-medium ${rateUp ? 'text-red-400' : 'text-green-400'}`}>
            {rateUp ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
            {Math.abs(rateChange).toFixed(2)}% from last week
          </div>
          <div className="text-[#464d4f] text-xs mt-1">Source: Freddie Mac via FRED</div>
        </div>

        <div className="md:col-span-2 bg-[#1a2332] border border-[#344a57]/30 rounded-2xl p-6">
          <h3 className="text-white font-semibold text-sm mb-4">10-Week Rate History</h3>
          {rateHistory.length > 0 ? (
            <ResponsiveContainer width="100%" height={160}>
              <AreaChart data={rateHistory}>
                <defs>
                  <linearGradient id="rateGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" tick={{ fill: '#8fa1ad', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#8fa1ad', fontSize: 10 }} axisLine={false} tickLine={false}
                  domain={['auto', 'auto']} tickFormatter={v => v + '%'} />
                <Tooltip
                  contentStyle={{ background: '#0f1623', border: '1px solid #344a57', borderRadius: '8px' }}
                  formatter={v => [v + '%', '30yr Rate']}
                />
                <Area type="monotone" dataKey="rate" stroke="#3b82f6" strokeWidth={2} fill="url(#rateGrad)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-40 flex items-center justify-center text-[#464d4f] text-sm">Loading rate data...</div>
          )}
        </div>
      </div>

      {/* Refi Opportunities */}
      <div className="bg-[#1a2332] border border-[#344a57]/30 rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#344a57]/20">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-4 h-4 text-[#c9a84c]" />
            <div>
              <h3 className="text-white font-semibold text-sm">Refi Opportunities</h3>
              <p className="text-[#8fa1ad] text-xs">Clients with rates 0.5%+ above today&apos;s market</p>
            </div>
          </div>
          {refiCandidates.length > 0 && (
            <button onClick={handleAlertAll}
              className="flex items-center gap-2 px-4 py-2 bg-[#c9a84c] hover:bg-[#d4b560] text-[#0f1623] rounded-xl font-semibold text-sm transition-colors">
              <Send className="w-3.5 h-3.5" /> Alert All ({refiCandidates.length})
            </button>
          )}
        </div>

        {refiCandidates.length === 0 ? (
          <div className="p-10 text-center">
            <Percent className="w-10 h-10 text-[#344a57] mx-auto mb-3" />
            <p className="text-white font-semibold text-sm">No refi candidates right now</p>
            <p className="text-[#8fa1ad] text-xs mt-1">All clients are within 0.5% of today&apos;s market rate</p>
          </div>
        ) : (
          <div className="divide-y divide-[#344a57]/10">
            {refiCandidates.map(client => {
              const savings = client.property?.loan_balance
                ? Math.round((client.property.loan_rate - currentRate) / 100 * client.property.loan_balance / 12)
                : null
              return (
                <div key={client.id} className="flex items-center gap-4 px-6 py-4 hover:bg-[#344a57]/10 transition-colors group">
                  <div className="w-10 h-10 rounded-full bg-[#344a57] flex items-center justify-center text-white font-bold flex-shrink-0">
                    {client.full_name?.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-white font-medium text-sm">{client.full_name}</div>
                    <div className="text-[#8fa1ad] text-xs">{client.property?.address}</div>
                  </div>
                  <div className="hidden md:flex items-center gap-8 flex-shrink-0">
                    <div className="text-right">
                      <div className="text-[#8fa1ad] text-[10px] uppercase tracking-wider">Their Rate</div>
                      <div className="text-[#c9a84c] font-bold text-sm">{client.property?.loan_rate}%</div>
                    </div>
                    <div className="text-right">
                      <div className="text-[#8fa1ad] text-[10px] uppercase tracking-wider">Market Rate</div>
                      <div className="text-blue-400 font-bold text-sm">{currentRate}%</div>
                    </div>
                    <div className="text-right">
                      <div className="text-[#8fa1ad] text-[10px] uppercase tracking-wider">Difference</div>
                      <div className="text-white font-bold text-sm">+{(client.property?.loan_rate - currentRate).toFixed(2)}%</div>
                    </div>
                    {savings && (
                      <div className="text-right">
                        <div className="text-[#8fa1ad] text-[10px] uppercase tracking-wider">Est. Mo. Savings</div>
                        <div className="text-green-400 font-bold text-sm">{fmt(savings)}/mo</div>
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => { setMsgRecipients([{ id: client.id, full_name: client.full_name }]); setShowMsg(true) }}
                    className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1.5 px-3 py-2 bg-[#c9a84c] hover:bg-[#d4b560] text-[#0f1623] rounded-lg text-xs font-semibold">
                    <Send className="w-3 h-3" /> Alert
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {showMsg && (
        <LenderSendMessageModal
          recipients={msgRecipients}
          defaultType="rate_alert"
          currentRate={currentRate}
          onClose={() => setShowMsg(false)}
          onSent={() => { setShowMsg(false); window.location.reload() }}
        />
      )}
    </div>
  )
}
