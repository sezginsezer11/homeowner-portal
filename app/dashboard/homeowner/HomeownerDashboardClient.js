'use client'

import { useState, useEffect } from 'react'
import {
  Home, TrendingUp, DollarSign, MessageSquare,
  Plus, RefreshCw, ChevronRight, User, AlertCircle,
  Building2, Percent, ArrowUpRight, ArrowDownRight, Clock
} from 'lucide-react'
import AddPropertyModal from './AddPropertyModal'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

function fmt(n) {
  if (!n && n !== 0) return '—'
  return '$' + Math.round(n).toLocaleString('en-US')
}
function pct(n) {
  if (!n) return '—'
  return (n * 100).toFixed(1) + '%'
}
function daysAgo(dateStr) {
  if (!dateStr) return null
  const days = Math.floor((Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24))
  if (days === 0) return 'Today'
  if (days === 1) return 'Yesterday'
  return `${days} days ago`
}
function daysUntil(dateStr) {
  if (!dateStr) return null
  const days = Math.ceil((new Date(dateStr).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
  if (days <= 0) return 'Now'
  if (days === 1) return 'Tomorrow'
  return `In ${days} days`
}

function EquityMeter({ equity, value }) {
  if (!value || !equity) return null
  const ratio = Math.min(Math.max(equity / value, 0), 1)
  const degrees = ratio * 180
  const r = 70, cx = 90, cy = 90
  const toRad = (d) => (d - 180) * Math.PI / 180
  const x = cx + r * Math.cos(toRad(degrees))
  const y = cy + r * Math.sin(toRad(degrees))
  const color = ratio > 0.5 ? '#22c55e' : ratio > 0.25 ? '#f59e0b' : '#ef4444'
  return (
    <svg viewBox="0 0 180 100" className="w-full max-w-[180px] mx-auto mt-2">
      <path d={`M ${cx-r} ${cy} A ${r} ${r} 0 0 1 ${cx+r} ${cy}`} fill="none" stroke="#f0f2f5" strokeWidth="16" strokeLinecap="round" />
      <path d={`M ${cx-r} ${cy} A ${r} ${r} 0 0 1 ${cx+r} ${cy}`} fill="none" stroke="#e4e6eb" strokeWidth="14" strokeLinecap="round" />
      <path d={`M ${cx-r} ${cy} A ${r} ${r} 0 0 1 ${x} ${y}`}     fill="none" stroke={color}    strokeWidth="14" strokeLinecap="round" />
      <circle cx={x} cy={y} r="6" fill="white" stroke={color} strokeWidth="2" />
      <text x={cx} y={cy-8}  textAnchor="middle" fill="#1a1a2e" fontSize="14" fontWeight="bold">{pct(ratio)}</text>
      <text x={cx} y={cy+8}  textAnchor="middle" fill="#65676b" fontSize="7">EQUITY RATIO</text>
    </svg>
  )
}

function StatCard({ label, value, sub, sub2, icon: Icon, iconColor, accent, children }) {
  return (
    <div className="bg-white rounded-2xl border border-[#e4e6eb] shadow-card p-5">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-[#65676b] uppercase tracking-wider">{label}</span>
        <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${accent || 'bg-[#e7f0fd]'}`}>
          <Icon className={`w-4 h-4 ${iconColor || 'text-[#1877F2]'}`} />
        </div>
      </div>
      <div className="text-2xl lg:text-3xl font-bold text-[#1a1a2e] mt-1">{value}</div>
      {sub  && <div className="text-xs text-[#65676b] mt-1">{sub}</div>}
      {sub2 && <div className="text-xs text-[#9ca3af] mt-0.5">{sub2}</div>}
      {children}
    </div>
  )
}

export default function HomeownerDashboardClient({ profile, properties, unreadMessages, relationships }) {
  const [selectedProp, setSelectedProp] = useState(properties[0] || null)
  const [avm, setAvm]                   = useState(null)
  const [avmLoading, setAvmLoading]     = useState(false)
  const [avmError, setAvmError]         = useState(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [rate, setRate]                 = useState(null)
  const [valueHistory, setValueHistory] = useState([])

  const agent  = relationships.find(r => r.professional?.role === 'agent')?.professional
  const lender = relationships.find(r => r.professional?.role === 'lender')?.professional

  useEffect(() => {
    fetch('/api/rates').then(r => r.json()).then(d => setRate(d.rate)).catch(() => {})
  }, [])

  useEffect(() => {
    if (!selectedProp) return
    fetchAVM(selectedProp, false)
  }, [selectedProp?.id])

  const fetchAVM = async (prop, force = false) => {
    setAvmLoading(true); setAvmError(null)
    try {
      const q = new URLSearchParams({ address: prop.address, city: prop.city, state: prop.state, zip: prop.zip, property_id: prop.id, force: force ? 'true' : 'false' })
      const res  = await fetch(`/api/avm?${q}`)
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setAvm(data)
      const purchase = prop.purchase_price || data.estimatedValue * 0.85
      setValueHistory(Array.from({ length: 6 }, (_, i) => ({
        month: ['Jan','Feb','Mar','Apr','May','Jun'][i],
        value: Math.round(purchase + ((data.estimatedValue - purchase) * (i / 5))),
      })))
    } catch (err) { setAvmError(err.message) }
    finally { setAvmLoading(false) }
  }

  const equity   = avm?.estimatedValue && selectedProp?.loan_balance ? avm.estimatedValue - selectedProp.loan_balance : null
  const gainLoss = avm?.estimatedValue && selectedProp?.purchase_price ? avm.estimatedValue - selectedProp.purchase_price : null
  const gainPct  = gainLoss && selectedProp?.purchase_price ? (gainLoss / selectedProp.purchase_price) * 100 : null

  return (
    <div className="space-y-5 pb-10">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-[#1a1a2e]">
            Welcome back, {profile?.full_name?.split(' ')[0] || 'there'} 👋
          </h1>
          <p className="text-[#65676b] text-sm mt-0.5">Your home intelligence dashboard</p>
        </div>
        <button onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#1877F2] hover:bg-[#1665d8] text-white rounded-xl font-semibold text-sm transition-colors shadow-sm">
          <Plus className="w-4 h-4" />
          <span className="hidden xs:inline">Add Property</span>
          <span className="xs:hidden">Add</span>
        </button>
      </div>

      {/* No properties */}
      {properties.length === 0 && (
        <div className="bg-white rounded-2xl border-2 border-dashed border-[#e4e6eb] p-12 text-center shadow-card">
          <div className="w-14 h-14 bg-[#e7f0fd] rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Home className="w-7 h-7 text-[#1877F2]" />
          </div>
          <h3 className="text-[#1a1a2e] font-bold text-lg mb-1">Add your first property</h3>
          <p className="text-[#65676b] text-sm mb-5">Start tracking your home value, equity, and more</p>
          <button onClick={() => setShowAddModal(true)}
            className="px-6 py-3 bg-[#1877F2] hover:bg-[#1665d8] text-white rounded-xl font-semibold text-sm transition-colors shadow-sm">
            Add Property
          </button>
        </div>
      )}

      {/* Property selector */}
      {properties.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 lg:mx-0 lg:px-0">
          {properties.map(p => (
            <button key={p.id} onClick={() => setSelectedProp(p)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border ${
                selectedProp?.id === p.id
                  ? 'bg-[#1877F2] border-[#1877F2] text-white'
                  : 'bg-white border-[#e4e6eb] text-[#65676b] hover:border-[#1877F2] hover:text-[#1877F2]'
              }`}>
              {p.address}
            </button>
          ))}
        </div>
      )}

      {selectedProp && (
        <>
          {/* Address bar */}
          <div className="bg-white rounded-xl border border-[#e4e6eb] shadow-card px-4 py-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 min-w-0">
              <Home className="w-3.5 h-3.5 text-[#1877F2] flex-shrink-0" />
              <span className="text-[#1a1a2e] font-medium text-xs truncate">{selectedProp.address}, {selectedProp.city}, {selectedProp.state} {selectedProp.zip}</span>
            </div>
            <div className="flex items-center gap-3 flex-shrink-0">
              {avm?.lastUpdated && (
                <div className="hidden sm:flex items-center gap-1 text-[#9ca3af] text-[10px]">
                  <Clock className="w-3 h-3" />
                  <span>Updated {daysAgo(avm.lastUpdated)} · Next {daysUntil(avm.nextUpdate)}</span>
                </div>
              )}
              <button onClick={() => fetchAVM(selectedProp, true)} disabled={avmLoading}
                className="flex items-center gap-1 text-[#1877F2] hover:text-[#1665d8] transition-colors text-xs font-semibold">
                <RefreshCw className={`w-3.5 h-3.5 ${avmLoading ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">{avmLoading ? 'Updating...' : 'Refresh'}</span>
              </button>
            </div>
          </div>

          {avm?.cached && (
            <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-xl px-4 py-2.5 text-xs text-[#65676b]">
              <Clock className="w-3.5 h-3.5 text-[#1877F2] flex-shrink-0" />
              Showing cached value from {daysAgo(avm.lastUpdated)}. Next auto-refresh {daysUntil(avm.nextUpdate)}.
              <button onClick={() => fetchAVM(selectedProp, true)} className="text-[#1877F2] hover:underline ml-auto flex-shrink-0 font-semibold">
                Refresh now
              </button>
            </div>
          )}

          {avmError && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 rounded-xl p-4 text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />{avmError}
            </div>
          )}

          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
            <StatCard label="Est. Home Value" icon={TrendingUp} iconColor="text-[#1877F2]" accent="bg-[#e7f0fd]"
              value={avmLoading ? <span className="text-base text-[#9ca3af] animate-pulse">Loading...</span> : fmt(avm?.estimatedValue)}
              sub={avm ? `Range: ${fmt(avm.lowValue)} — ${fmt(avm.highValue)}` : null}
              sub2={selectedProp.purchase_price ? `Purchased: ${fmt(selectedProp.purchase_price)}` : null} />

            <StatCard label="Home Equity" icon={DollarSign} iconColor="text-green-600" accent="bg-green-50"
              value={avmLoading ? '—' : equity ? fmt(equity) : '—'}
              sub={selectedProp.loan_balance ? `Loan balance: ${fmt(selectedProp.loan_balance)}` : null}>
              <EquityMeter equity={equity} value={avm?.estimatedValue} />
            </StatCard>

            <StatCard label="Total Gain" icon={gainLoss >= 0 ? ArrowUpRight : ArrowDownRight}
              iconColor={gainLoss >= 0 ? 'text-green-600' : 'text-red-500'}
              accent={gainLoss >= 0 ? 'bg-green-50' : 'bg-red-50'}
              value={<span className={gainLoss >= 0 ? 'text-green-600' : 'text-red-500'}>{avmLoading ? '—' : gainLoss ? fmt(Math.abs(gainLoss)) : '—'}</span>}
              sub={gainPct != null ? `${gainPct >= 0 ? '+' : ''}${gainPct.toFixed(1)}% since purchase` : null}
              sub2={selectedProp.purchase_date ? `Since ${new Date(selectedProp.purchase_date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}` : null} />

            <StatCard label="30yr Rate" icon={Percent} iconColor="text-purple-600" accent="bg-purple-50"
              value={<span className="text-purple-600">{rate ? `${rate}%` : '—'}</span>}
              sub="Freddie Mac national avg">
              {selectedProp.loan_rate && (
                <div className="mt-2 bg-[#f8f9fa] rounded-xl px-3 py-2 text-xs">
                  <span className="text-[#65676b]">Your rate: </span>
                  <span className="text-[#1a1a2e] font-bold">{selectedProp.loan_rate}%</span>
                  {rate && selectedProp.loan_rate > rate && (
                    <span className="text-[#1877F2] font-semibold ml-1">↓ Refi opportunity</span>
                  )}
                </div>
              )}
            </StatCard>
          </div>

          {/* Chart + Details */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2 bg-white rounded-2xl border border-[#e4e6eb] shadow-card p-5">
              <h3 className="text-[#1a1a2e] font-bold mb-4 text-sm">Value Trend</h3>
              {valueHistory.length > 0 ? (
                <ResponsiveContainer width="100%" height={180}>
                  <AreaChart data={valueHistory}>
                    <defs>
                      <linearGradient id="valGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor="#1877F2" stopOpacity={0.15} />
                        <stop offset="95%" stopColor="#1877F2" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="month" tick={{ fill: '#65676b', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: '#65676b', fontSize: 11 }} axisLine={false} tickLine={false}
                      tickFormatter={v => '$' + (v/1000).toFixed(0) + 'k'} />
                    <Tooltip
                      contentStyle={{ background: 'white', border: '1px solid #e4e6eb', borderRadius: '12px', fontSize: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                      formatter={v => [fmt(v), 'Est. Value']} />
                    <Area type="monotone" dataKey="value" stroke="#1877F2" strokeWidth={2.5} fill="url(#valGrad)" dot={false} />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[180px] flex items-center justify-center text-[#9ca3af] text-sm">
                  {avmLoading ? 'Loading chart...' : 'Add your purchase price to see trend'}
                </div>
              )}
            </div>

            <div className="bg-white rounded-2xl border border-[#e4e6eb] shadow-card p-5">
              <h3 className="text-[#1a1a2e] font-bold mb-3 text-sm">Property Details</h3>
              <div className="space-y-2">
                {[
                  ['Type',       selectedProp.loan_type || '—'],
                  ['Bedrooms',   selectedProp.bedrooms || '—'],
                  ['Bathrooms',  selectedProp.bathrooms || '—'],
                  ['Sq Ft',      selectedProp.sqft ? selectedProp.sqft.toLocaleString() : '—'],
                  ['Year Built', selectedProp.year_built || '—'],
                  ['Loan Rate',  selectedProp.loan_rate ? `${selectedProp.loan_rate}%` : '—'],
                ].map(([k, v]) => (
                  <div key={k} className="flex items-center justify-between py-1.5 border-b border-[#f0f2f5] last:border-0">
                    <span className="text-[#65676b] text-xs">{k}</span>
                    <span className="text-[#1a1a2e] text-xs font-semibold">{v}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Messages + Team */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-white rounded-2xl border border-[#e4e6eb] shadow-card p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-[#1a1a2e] font-bold text-sm flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-[#1877F2]" /> Messages
                  {unreadMessages.length > 0 && (
                    <span className="bg-[#1877F2] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">{unreadMessages.length}</span>
                  )}
                </h3>
                <a href="/dashboard/homeowner/messages" className="text-[#1877F2] hover:underline text-xs font-semibold flex items-center gap-1">
                  All <ChevronRight className="w-3 h-3" />
                </a>
              </div>
              {unreadMessages.length === 0 ? (
                <div className="text-center py-5">
                  <MessageSquare className="w-8 h-8 text-[#e4e6eb] mx-auto mb-2" />
                  <p className="text-[#9ca3af] text-xs">No new messages</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {unreadMessages.map(msg => (
                    <div key={msg.id} className="flex items-start gap-3 p-3 bg-[#f8f9fa] rounded-xl hover:bg-[#f0f2f5] transition-colors cursor-pointer">
                      <div className="w-8 h-8 rounded-full bg-[#e7f0fd] flex items-center justify-center flex-shrink-0 text-[#1877F2] text-xs font-bold">
                        {msg.from?.full_name?.charAt(0) || '?'}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[#1a1a2e] text-xs font-semibold">{msg.from?.full_name}</span>
                          <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-semibold ${
                            msg.message_type === 'rate_alert'   ? 'bg-purple-100 text-purple-600' :
                            msg.message_type === 'value_update' ? 'bg-[#e7f0fd] text-[#1877F2]' :
                            'bg-[#f0f2f5] text-[#65676b]'
                          }`}>
                            {msg.message_type === 'rate_alert' ? 'Rate' : msg.message_type === 'value_update' ? 'Value' : 'Msg'}
                          </span>
                        </div>
                        <p className="text-[#65676b] text-xs mt-0.5 truncate">{msg.subject || msg.body}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-white rounded-2xl border border-[#e4e6eb] shadow-card p-5">
              <h3 className="text-[#1a1a2e] font-bold text-sm flex items-center gap-2 mb-3">
                <User className="w-4 h-4 text-[#1877F2]" /> My Team
              </h3>
              <div className="space-y-3">
                {[
                  { label: 'Agent',  data: agent,  color: 'text-green-600',  bg: 'bg-green-50 border-green-200',    dot: 'bg-green-500' },
                  { label: 'Lender', data: lender, color: 'text-blue-600',   bg: 'bg-blue-50 border-blue-200',      dot: 'bg-blue-500' },
                ].map(({ label, data, color, bg, dot }) => (
                  <div key={label} className={`flex items-center gap-3 p-3 rounded-xl border ${data ? bg : 'bg-[#f8f9fa] border-[#e4e6eb]'}`}>
                    <div className="relative flex-shrink-0">
                      <div className="w-10 h-10 rounded-full bg-white border border-[#e4e6eb] flex items-center justify-center text-[#1a1a2e] font-bold text-sm">
                        {data?.full_name?.charAt(0) || <Building2 className="w-4 h-4 text-[#9ca3af]" />}
                      </div>
                      {data && <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${dot}`} />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className={`text-[10px] font-bold uppercase tracking-wider ${data ? color : 'text-[#9ca3af]'}`}>{label}</div>
                      {data ? (
                        <>
                          <div className="text-[#1a1a2e] text-sm font-semibold">{data.full_name}</div>
                          {data.company && <div className="text-[#65676b] text-xs">{data.company}</div>}
                        </>
                      ) : (
                        <div className="text-[#9ca3af] text-xs">Not connected</div>
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
