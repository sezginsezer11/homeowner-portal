'use client'

import { useState, useEffect } from 'react'
import {
  Home, TrendingUp, DollarSign, MessageSquare,
  Plus, RefreshCw, ChevronRight, User, AlertCircle,
  Building2, Percent, ArrowUpRight, ArrowDownRight
} from 'lucide-react'
import AddPropertyModal from './AddPropertyModal'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

function fmt(n) {
  if (!n) return '—'
  return '$' + Math.round(n).toLocaleString()
}
function pct(n) {
  if (!n) return '—'
  return (n * 100).toFixed(1) + '%'
}

function EquityMeter({ equity, value }) {
  if (!value || !equity) return null
  const ratio = Math.min(Math.max(equity / value, 0), 1)
  const degrees = ratio * 180
  const r = 70, cx = 90, cy = 90
  const toRad = (d) => (d - 180) * Math.PI / 180
  const x = cx + r * Math.cos(toRad(degrees))
  const y = cy + r * Math.sin(toRad(degrees))
  const color = ratio > 0.5 ? '#22c55e' : ratio > 0.25 ? '#c9a84c' : '#ef4444'

  return (
    <svg viewBox="0 0 180 100" className="w-full max-w-[200px] mx-auto">
      <path d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
        fill="none" stroke="#1a2332" strokeWidth="16" strokeLinecap="round" />
      <path d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
        fill="none" stroke="#344a57" strokeWidth="14" strokeLinecap="round" />
      <path d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${x} ${y}`}
        fill="none" stroke={color} strokeWidth="14" strokeLinecap="round" />
      <circle cx={x} cy={y} r="6" fill="white" />
      <text x={cx} y={cy - 8} textAnchor="middle" fill="white" fontSize="15" fontWeight="bold">{pct(ratio)}</text>
      <text x={cx} y={cy + 8} textAnchor="middle" fill="#8fa1ad" fontSize="7">EQUITY RATIO</text>
    </svg>
  )
}

export default function HomeownerDashboardClient({ profile, properties, unreadMessages, relationships }) {
  const [selectedProp, setSelectedProp] = useState(properties[0] || null)
  const [avm, setAvm] = useState(null)
  const [avmLoading, setAvmLoading] = useState(false)
  const [avmError, setAvmError] = useState(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [rate, setRate] = useState(null)
  const [valueHistory, setValueHistory] = useState([])

  const agent  = relationships.find(r => r.professional?.role === 'agent')?.professional
  const lender = relationships.find(r => r.professional?.role === 'lender')?.professional

  useEffect(() => {
    fetch('/api/rates').then(r => r.json()).then(d => setRate(d.rate)).catch(() => {})
  }, [])

  useEffect(() => {
    if (!selectedProp) return
    fetchAVM(selectedProp)
  }, [selectedProp])

  const fetchAVM = async (prop) => {
    setAvmLoading(true)
    setAvmError(null)
    try {
      const q = new URLSearchParams({ address: prop.address, city: prop.city, state: prop.state, zip: prop.zip })
      const res = await fetch(`/api/avm?${q}`)
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setAvm(data)
      // Build simple value history (simulate trend with purchase price)
      const purchase = prop.purchase_price || data.estimatedValue * 0.85
      const steps = 6
      const history = Array.from({ length: steps }, (_, i) => ({
        month: ['Jan','Feb','Mar','Apr','May','Jun'][i],
        value: Math.round(purchase + ((data.estimatedValue - purchase) * (i / (steps - 1)))),
      }))
      setValueHistory(history)
    } catch (err) {
      setAvmError(err.message)
    } finally {
      setAvmLoading(false)
    }
  }

  const equity = avm?.estimatedValue && selectedProp?.loan_balance
    ? avm.estimatedValue - selectedProp.loan_balance : null

  const gainLoss = avm?.estimatedValue && selectedProp?.purchase_price
    ? avm.estimatedValue - selectedProp.purchase_price : null

  const gainPct = gainLoss && selectedProp?.purchase_price
    ? (gainLoss / selectedProp.purchase_price) * 100 : null

  return (
    <div className="space-y-6 max-w-7xl">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">
            Welcome back, {profile?.full_name?.split(' ')[0] || 'there'} 👋
          </h1>
          <p className="text-[#8fa1ad] text-sm mt-0.5">Your home intelligence dashboard</p>
        </div>
        <button onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#c9a84c] hover:bg-[#d4b560] text-[#0f1623] rounded-xl font-semibold text-sm transition-colors shadow-lg">
          <Plus className="w-4 h-4" /> Add Property
        </button>
      </div>

      {/* No properties state */}
      {properties.length === 0 && (
        <div className="bg-[#1a2332] border border-dashed border-[#344a57]/60 rounded-2xl p-12 text-center">
          <Home className="w-12 h-12 text-[#344a57] mx-auto mb-4" />
          <h3 className="text-white font-semibold text-lg mb-2">Add your first property</h3>
          <p className="text-[#8fa1ad] text-sm mb-6">Start tracking your home value, equity, and more</p>
          <button onClick={() => setShowAddModal(true)}
            className="px-6 py-3 bg-[#c9a84c] hover:bg-[#d4b560] text-[#0f1623] rounded-xl font-semibold text-sm transition-colors">
            <Plus className="inline w-4 h-4 mr-2" />Add Property
          </button>
        </div>
      )}

      {/* Property selector (if multiple) */}
      {properties.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {properties.map(p => (
            <button key={p.id} onClick={() => setSelectedProp(p)}
              className={`flex-shrink-0 px-4 py-2 rounded-xl text-sm font-medium transition-all border ${
                selectedProp?.id === p.id
                  ? 'bg-[#344a57] border-[#c9a84c]/40 text-white'
                  : 'bg-[#1a2332] border-[#344a57]/30 text-[#8fa1ad] hover:text-white'
              }`}>
              {p.address}
            </button>
          ))}
        </div>
      )}

      {selectedProp && (
        <>
          {/* Address bar */}
          <div className="flex items-center justify-between bg-[#1a2332] border border-[#344a57]/30 rounded-xl px-5 py-3">
            <div className="flex items-center gap-3">
              <Home className="w-4 h-4 text-[#c9a84c]" />
              <span className="text-white font-medium text-sm">{selectedProp.address}, {selectedProp.city}, {selectedProp.state} {selectedProp.zip}</span>
            </div>
            <button onClick={() => fetchAVM(selectedProp)} disabled={avmLoading}
              className="flex items-center gap-1.5 text-[#8fa1ad] hover:text-white transition-colors text-xs">
              <RefreshCw className={`w-3.5 h-3.5 ${avmLoading ? 'animate-spin' : ''}`} />
              {avmLoading ? 'Updating...' : 'Refresh Value'}
            </button>
          </div>

          {avmError && (
            <div className="flex items-center gap-2 bg-red-900/20 border border-red-500/30 text-red-400 rounded-xl p-4 text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {avmError}
            </div>
          )}

          {/* Main stats grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">

            {/* Current Value */}
            <div className="bg-[#1a2332] border border-[#344a57]/30 rounded-2xl p-5 col-span-1">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-[#8fa1ad] uppercase tracking-wider">Est. Home Value</span>
                <TrendingUp className="w-4 h-4 text-[#c9a84c]" />
              </div>
              <div className="text-3xl font-bold text-white mt-2">
                {avmLoading ? <span className="text-[#8fa1ad] text-xl animate-pulse">Loading...</span> : fmt(avm?.estimatedValue)}
              </div>
              {avm && (
                <div className="text-[10px] text-[#8fa1ad] mt-1">
                  Range: {fmt(avm.lowValue)} — {fmt(avm.highValue)}
                </div>
              )}
              {selectedProp.purchase_price && (
                <div className="text-xs text-[#8fa1ad] mt-1">Purchased: {fmt(selectedProp.purchase_price)}</div>
              )}
            </div>

            {/* Equity */}
            <div className="bg-[#1a2332] border border-[#344a57]/30 rounded-2xl p-5">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-[#8fa1ad] uppercase tracking-wider">Home Equity</span>
                <DollarSign className="w-4 h-4 text-green-400" />
              </div>
              <div className="text-3xl font-bold text-green-400 mt-2">
                {avmLoading ? '—' : equity ? fmt(equity) : '—'}
              </div>
              {selectedProp.loan_balance && (
                <div className="text-xs text-[#8fa1ad] mt-1">Loan balance: {fmt(selectedProp.loan_balance)}</div>
              )}
              <EquityMeter equity={equity} value={avm?.estimatedValue} />
            </div>

            {/* Gain / Loss */}
            <div className="bg-[#1a2332] border border-[#344a57]/30 rounded-2xl p-5">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-[#8fa1ad] uppercase tracking-wider">Total Gain</span>
                {gainLoss >= 0
                  ? <ArrowUpRight className="w-4 h-4 text-green-400" />
                  : <ArrowDownRight className="w-4 h-4 text-red-400" />}
              </div>
              <div className={`text-3xl font-bold mt-2 ${gainLoss >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {avmLoading ? '—' : gainLoss ? fmt(Math.abs(gainLoss)) : '—'}
              </div>
              {gainPct != null && (
                <div className={`text-sm font-medium mt-1 ${gainPct >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {gainPct >= 0 ? '+' : ''}{gainPct?.toFixed(1)}% since purchase
                </div>
              )}
              {selectedProp.purchase_date && (
                <div className="text-xs text-[#8fa1ad] mt-1">Bought: {new Date(selectedProp.purchase_date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</div>
              )}
            </div>

            {/* Mortgage Rate */}
            <div className="bg-[#1a2332] border border-[#344a57]/30 rounded-2xl p-5">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-[#8fa1ad] uppercase tracking-wider">30yr Rate</span>
                <Percent className="w-4 h-4 text-blue-400" />
              </div>
              <div className="text-3xl font-bold text-blue-400 mt-2">
                {rate ? `${rate}%` : '—'}
              </div>
              <div className="text-xs text-[#8fa1ad] mt-1">National avg — Freddie Mac</div>
              {selectedProp.loan_rate && (
                <div className="text-xs mt-3 bg-[#0f1623] rounded-lg px-3 py-2">
                  <span className="text-[#8fa1ad]">Your rate: </span>
                  <span className="text-white font-semibold">{selectedProp.loan_rate}%</span>
                  {rate && selectedProp.loan_rate > rate && (
                    <span className="text-[#c9a84c] text-[10px] ml-1">Refi opportunity</span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Value Chart + Property Details */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

            {/* Value History Chart */}
            <div className="lg:col-span-2 bg-[#1a2332] border border-[#344a57]/30 rounded-2xl p-6">
              <h3 className="text-white font-semibold mb-4 text-sm">Value Trend</h3>
              {valueHistory.length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={valueHistory}>
                    <defs>
                      <linearGradient id="valGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor="#c9a84c" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#c9a84c" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="month" tick={{ fill: '#8fa1ad', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: '#8fa1ad', fontSize: 11 }} axisLine={false} tickLine={false}
                      tickFormatter={v => '$' + (v / 1000).toFixed(0) + 'k'} />
                    <Tooltip
                      contentStyle={{ background: '#0f1623', border: '1px solid #344a57', borderRadius: '8px' }}
                      labelStyle={{ color: '#8fa1ad' }}
                      formatter={v => [fmt(v), 'Estimated Value']}
                    />
                    <Area type="monotone" dataKey="value" stroke="#c9a84c" strokeWidth={2}
                      fill="url(#valGrad)" dot={false} />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[200px] flex items-center justify-center text-[#464d4f] text-sm">
                  {avmLoading ? 'Loading chart...' : 'Add your purchase price to see trend'}
                </div>
              )}
            </div>

            {/* Property Details */}
            <div className="bg-[#1a2332] border border-[#344a57]/30 rounded-2xl p-6">
              <h3 className="text-white font-semibold mb-4 text-sm">Property Details</h3>
              <div className="space-y-3">
                {[
                  ['Type', selectedProp.loan_type || '—'],
                  ['Bedrooms', selectedProp.bedrooms || '—'],
                  ['Bathrooms', selectedProp.bathrooms || '—'],
                  ['Sq Ft', selectedProp.sqft ? selectedProp.sqft.toLocaleString() : '—'],
                  ['Year Built', selectedProp.year_built || '—'],
                  ['Loan Rate', selectedProp.loan_rate ? `${selectedProp.loan_rate}%` : '—'],
                ].map(([k, v]) => (
                  <div key={k} className="flex items-center justify-between py-1.5 border-b border-[#344a57]/20 last:border-0">
                    <span className="text-[#8fa1ad] text-xs">{k}</span>
                    <span className="text-white text-xs font-medium">{v}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Messages + Team */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

            {/* Unread Messages */}
            <div className="bg-[#1a2332] border border-[#344a57]/30 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-white font-semibold text-sm flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-[#c9a84c]" /> Messages
                  {unreadMessages.length > 0 && (
                    <span className="bg-[#c9a84c] text-[#0f1623] text-[10px] font-bold px-1.5 py-0.5 rounded-full">{unreadMessages.length}</span>
                  )}
                </h3>
                <a href="/dashboard/homeowner/messages" className="text-[#8fa1ad] hover:text-[#c9a84c] text-xs flex items-center gap-1">
                  View all <ChevronRight className="w-3 h-3" />
                </a>
              </div>
              {unreadMessages.length === 0 ? (
                <div className="text-center py-6">
                  <MessageSquare className="w-8 h-8 text-[#344a57] mx-auto mb-2" />
                  <p className="text-[#464d4f] text-xs">No new messages</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {unreadMessages.map(msg => (
                    <div key={msg.id} className="flex items-start gap-3 p-3 bg-[#0f1623] rounded-xl hover:bg-[#0f1623]/60 transition-colors cursor-pointer">
                      <div className="w-8 h-8 rounded-full bg-[#344a57] flex items-center justify-center flex-shrink-0 text-white text-xs font-semibold">
                        {msg.from?.full_name?.charAt(0) || '?'}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-white text-xs font-medium">{msg.from?.full_name}</span>
                          <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${
                            msg.message_type === 'rate_alert' ? 'bg-blue-900/40 text-blue-400' :
                            msg.message_type === 'value_update' ? 'bg-[#c9a84c]/20 text-[#c9a84c]' :
                            'bg-[#344a57] text-[#8fa1ad]'
                          }`}>
                            {msg.message_type === 'rate_alert' ? 'Rate Alert' :
                             msg.message_type === 'value_update' ? 'Value Update' : 'General'}
                          </span>
                        </div>
                        <p className="text-[#8fa1ad] text-xs mt-0.5 truncate">{msg.subject || msg.body}</p>
                        <p className="text-[#464d4f] text-[10px] mt-0.5">
                          {new Date(msg.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* My Team */}
            <div className="bg-[#1a2332] border border-[#344a57]/30 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-white font-semibold text-sm flex items-center gap-2">
                  <User className="w-4 h-4 text-[#c9a84c]" /> My Team
                </h3>
              </div>
              <div className="space-y-3">
                {[
                  { label: 'Real Estate Agent', data: agent, color: 'text-green-400', bg: 'bg-green-900/20 border-green-500/20' },
                  { label: 'Lender',             data: lender, color: 'text-blue-400',  bg: 'bg-blue-900/20 border-blue-500/20' },
                ].map(({ label, data, color, bg }) => (
                  <div key={label} className={`flex items-start gap-3 p-4 rounded-xl border ${data ? bg : 'bg-[#0f1623] border-[#344a57]/20'}`}>
                    <div className="w-10 h-10 rounded-full bg-[#344a57] flex items-center justify-center flex-shrink-0 text-white text-sm font-semibold">
                      {data?.full_name?.charAt(0) || <Building2 className="w-4 h-4 text-[#8fa1ad]" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className={`text-[10px] font-medium uppercase tracking-wider ${data ? color : 'text-[#464d4f]'}`}>{label}</div>
                      {data ? (
                        <>
                          <div className="text-white text-sm font-medium mt-0.5">{data.full_name}</div>
                          {data.company && <div className="text-[#8fa1ad] text-xs">{data.company}</div>}
                          {data.email && <div className="text-[#8fa1ad] text-xs">{data.email}</div>}
                        </>
                      ) : (
                        <div className="text-[#464d4f] text-xs mt-0.5">Not connected yet</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </>
      )}

      {showAddModal && (
        <AddPropertyModal onClose={() => setShowAddModal(false)} onAdded={() => { setShowAddModal(false); window.location.reload() }} />
      )}
    </div>
  )
}
