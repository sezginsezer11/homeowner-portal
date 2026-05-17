'use client'

import { useState, useEffect } from 'react'
import {
  Home, TrendingUp, DollarSign, MessageSquare,
  Plus, RefreshCw, ChevronRight, User, AlertCircle,
  Building2, Percent, ArrowUpRight, ArrowDownRight,
  Clock, Trash2, ShoppingCart, BarChart2, X
} from 'lucide-react'
import AddPropertyModal from './AddPropertyModal'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import Link from 'next/link'

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

// Multi-property comparison modal
function MultiPropertyModal({ properties, avmCache, onClose }) {
  const totalEquity = properties.reduce((sum, p) => {
    const val = avmCache[p.id]?.estimatedValue || p.avm_value || 0
    const eq = val && p.loan_balance ? val - p.loan_balance : 0
    return sum + eq
  }, 0)
  const totalValue = properties.reduce((sum, p) => {
    return sum + (avmCache[p.id]?.estimatedValue || p.avm_value || 0)
  }, 0)

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-4xl shadow-cardHv border border-[#e4e6eb] max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-[#e4e6eb] sticky top-0 bg-white z-10">
          <div>
            <h2 className="text-[#1a1a2e] font-bold text-lg">Portfolio Overview</h2>
            <p className="text-[#65676b] text-xs mt-0.5">All your properties side by side</p>
          </div>
          <button onClick={onClose} className="text-[#65676b] hover:text-[#1a1a2e] p-1"><X className="w-5 h-5" /></button>
        </div>

        {/* Portfolio totals */}
        <div className="p-5 grid grid-cols-2 sm:grid-cols-4 gap-3 border-b border-[#e4e6eb] bg-[#f8f9fa]">
          {[
            { label: 'Total Portfolio Value', value: fmt(totalValue), color: 'text-[#1877F2]' },
            { label: 'Total Equity',          value: fmt(totalEquity), color: 'text-green-600' },
            { label: 'Properties',            value: properties.length, color: 'text-[#1a1a2e]' },
            { label: 'Avg Equity %',          value: totalValue ? `${((totalEquity/totalValue)*100).toFixed(0)}%` : '—', color: 'text-purple-600' },
          ].map(item => (
            <div key={item.label} className="bg-white rounded-xl border border-[#e4e6eb] p-3 text-center shadow-card">
              <div className="text-[10px] text-[#65676b] uppercase tracking-wider mb-1">{item.label}</div>
              <div className={`text-lg font-bold ${item.color}`}>{item.value}</div>
            </div>
          ))}
        </div>

        {/* Property cards */}
        <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {properties.map(p => {
            const val    = avmCache[p.id]?.estimatedValue || p.avm_value || null
            const equity = val && p.loan_balance ? val - p.loan_balance : null
            const gain   = val && p.purchase_price ? val - p.purchase_price : null
            const equityPct = equity && val ? (equity / val) * 100 : null
            const monthlyPI = p.loan_balance && p.loan_rate
              ? (() => {
                  const r = p.loan_rate / 100 / 12
                  const n = 360
                  return p.loan_balance * r * Math.pow(1+r,n) / (Math.pow(1+r,n)-1)
                })()
              : null

            return (
              <div key={p.id} className="bg-white rounded-2xl border border-[#e4e6eb] shadow-card overflow-hidden">
                <div className="bg-[#1877F2] px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Home className="w-4 h-4 text-white/70 flex-shrink-0" />
                    <div className="text-white font-semibold text-sm truncate">{p.address}</div>
                  </div>
                  <div className="text-white/60 text-xs mt-0.5">{p.city}, {p.state} {p.zip}</div>
                </div>
                <div className="p-4 space-y-2">
                  {[
                    { label: 'Est. Home Value',     value: fmt(val),        color: 'text-[#1877F2]' },
                    { label: 'Home Equity',          value: fmt(equity),     color: 'text-green-600' },
                    { label: 'Equity %',             value: equityPct ? `${equityPct.toFixed(0)}%` : '—', color: 'text-green-600' },
                    { label: 'Loan Balance',         value: fmt(p.loan_balance), color: 'text-[#1a1a2e]' },
                    { label: 'Interest Rate',        value: p.loan_rate ? `${p.loan_rate}%` : '—', color: 'text-[#1a1a2e]' },
                    { label: 'Est. Mo. Payment',     value: monthlyPI ? fmt(monthlyPI) : '—', color: 'text-[#1a1a2e]' },
                    { label: 'Purchase Price',       value: fmt(p.purchase_price), color: 'text-[#65676b]' },
                    { label: 'Total Gain',           value: gain ? fmt(Math.abs(gain)) : '—', color: gain >= 0 ? 'text-green-600' : 'text-red-500' },
                  ].map(({ label, value, color }) => (
                    <div key={label} className="flex items-center justify-between py-1.5 border-b border-[#f0f2f5] last:border-0">
                      <span className="text-[#65676b] text-xs">{label}</span>
                      <span className={`text-xs font-bold ${color}`}>{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default function HomeownerDashboardClient({ profile, properties, unreadMessages, relationships }) {
  const [selectedProp, setSelectedProp]   = useState(properties[0] || null)
  const [avmCache, setAvmCache]           = useState({}) // { property_id: avmData }
  const [avmLoading, setAvmLoading]       = useState({})
  const [avmError, setAvmError]           = useState(null)
  const [showAddModal, setShowAddModal]   = useState(false)
  const [showPortfolio, setShowPortfolio] = useState(false)
  const [deletingId, setDeletingId]       = useState(null)
  const [rate, setRate]                   = useState(null)
  const [valueHistory, setValueHistory]   = useState([])

  const agent  = relationships.find(r => r.professional?.role === 'agent')?.professional
  const lender = relationships.find(r => r.professional?.role === 'lender')?.professional

  useEffect(() => {
    fetch('/api/rates').then(r => r.json()).then(d => setRate(d.rate)).catch(() => {})
  }, [])

  // Auto-fetch AVM for ALL properties (with caching)
  useEffect(() => {
    properties.forEach(p => {
      fetchAVM(p, false)
    })
  }, [properties.length])

  useEffect(() => {
    if (!selectedProp) return
    const avm = avmCache[selectedProp.id]
    if (avm && selectedProp.purchase_price) {
      const purchase = selectedProp.purchase_price || avm.estimatedValue * 0.85
      setValueHistory(Array.from({ length: 6 }, (_, i) => ({
        month: ['Jan','Feb','Mar','Apr','May','Jun'][i],
        value: Math.round(purchase + ((avm.estimatedValue - purchase) * (i / 5))),
      })))
    }
  }, [selectedProp?.id, avmCache])

  const fetchAVM = async (prop, force = false) => {
    if (avmLoading[prop.id]) return
    setAvmLoading(prev => ({ ...prev, [prop.id]: true }))
    setAvmError(null)
    try {
      const q = new URLSearchParams({
        address:     prop.address,
        city:        prop.city,
        state:       prop.state,
        zip:         prop.zip,
        property_id: prop.id,
        force:       force ? 'true' : 'false',
      })
      const res  = await fetch(`/api/avm?${q}`)
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setAvmCache(prev => ({ ...prev, [prop.id]: data }))
    } catch (err) {
      if (prop.id === selectedProp?.id) setAvmError(err.message)
    } finally {
      setAvmLoading(prev => ({ ...prev, [prop.id]: false }))
    }
  }

  const handleDelete = async (propId) => {
    if (!confirm('Delete this property? This cannot be undone.')) return
    setDeletingId(propId)
    try {
      await fetch('/api/property', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ property_id: propId }),
      })
      window.location.reload()
    } catch {
      setDeletingId(null)
    }
  }

  const avm      = selectedProp ? avmCache[selectedProp.id] : null
  const loading  = selectedProp ? avmLoading[selectedProp.id] : false
  const equity   = avm?.estimatedValue && selectedProp?.loan_balance ? avm.estimatedValue - selectedProp.loan_balance : null
  const gainLoss = avm?.estimatedValue && selectedProp?.purchase_price ? avm.estimatedValue - selectedProp.purchase_price : null
  const gainPct  = gainLoss && selectedProp?.purchase_price ? (gainLoss / selectedProp.purchase_price) * 100 : null

  // Total portfolio equity across all properties
  const totalPortfolioEquity = properties.reduce((sum, p) => {
    const val = avmCache[p.id]?.estimatedValue || p.avm_value || 0
    const eq  = val && p.loan_balance ? val - p.loan_balance : 0
    return sum + eq
  }, 0)

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

      {/* Total Portfolio Equity Banner (if multiple properties) */}
      {properties.length > 1 && totalPortfolioEquity > 0 && (
        <button onClick={() => setShowPortfolio(true)}
          className="w-full bg-gradient-to-r from-[#1877F2] to-[#1665d8] rounded-2xl p-4 text-left hover:shadow-cardHv transition-all">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-white/70 text-xs uppercase tracking-wider mb-1">Total Portfolio Equity</div>
              <div className="text-white text-3xl font-bold">{fmt(totalPortfolioEquity)}</div>
              <div className="text-white/60 text-xs mt-1">Across {properties.length} properties · Click to compare</div>
            </div>
            <div className="flex items-center gap-2">
              <BarChart2 className="w-8 h-8 text-white/40" />
              <ChevronRight className="w-5 h-5 text-white/60" />
            </div>
          </div>
        </button>
      )}

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

      {/* Property selector tabs */}
      {properties.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 lg:mx-0 lg:px-0">
          {properties.map(p => (
            <div key={p.id} className="flex items-center gap-1 flex-shrink-0">
              <button onClick={() => setSelectedProp(p)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border ${
                  selectedProp?.id === p.id
                    ? 'bg-[#1877F2] border-[#1877F2] text-white'
                    : 'bg-white border-[#e4e6eb] text-[#65676b] hover:border-[#1877F2] hover:text-[#1877F2]'
                }`}>
                {p.address}
              </button>
              <button onClick={() => handleDelete(p.id)} disabled={deletingId === p.id}
                className="w-6 h-6 rounded-lg flex items-center justify-center text-[#9ca3af] hover:text-red-500 hover:bg-red-50 transition-all flex-shrink-0"
                title="Delete property">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {selectedProp && (
        <>
          {/* Address bar */}
          <div className="bg-white rounded-xl border border-[#e4e6eb] shadow-card px-4 py-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 min-w-0">
              <Home className="w-3.5 h-3.5 text-[#1877F2] flex-shrink-0" />
              <span className="text-[#1a1a2e] font-medium text-xs truncate">
                {selectedProp.address}, {selectedProp.city}, {selectedProp.state} {selectedProp.zip}
              </span>
            </div>
            <div className="flex items-center gap-3 flex-shrink-0">
              {avm?.lastUpdated && (
                <div className="hidden sm:flex items-center gap-1 text-[#9ca3af] text-[10px]">
                  <Clock className="w-3 h-3" />
                  <span>Updated {daysAgo(avm.lastUpdated)} · Next {daysUntil(avm.nextUpdate)}</span>
                </div>
              )}
              <button onClick={() => fetchAVM(selectedProp, true)} disabled={loading}
                className="flex items-center gap-1 text-[#1877F2] hover:text-[#1665d8] transition-colors text-xs font-semibold">
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">{loading ? 'Updating...' : 'Refresh'}</span>
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
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">

            {/* Value */}
            <div className="bg-white rounded-2xl border border-[#e4e6eb] shadow-card p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-semibold text-[#65676b] uppercase tracking-wider">Est. Value</span>
                <div className="w-7 h-7 rounded-xl bg-[#e7f0fd] flex items-center justify-center">
                  <TrendingUp className="w-3.5 h-3.5 text-[#1877F2]" />
                </div>
              </div>
              <div className="text-xl lg:text-2xl font-bold text-[#1a1a2e]">
                {loading ? <span className="text-[#9ca3af] text-base animate-pulse">Loading...</span> : fmt(avm?.estimatedValue)}
              </div>
              {avm && <div className="text-[10px] text-[#65676b] mt-1">{fmt(avm.lowValue)} — {fmt(avm.highValue)}</div>}
              {selectedProp.purchase_price && <div className="text-[10px] text-[#9ca3af] mt-0.5">Purchased: {fmt(selectedProp.purchase_price)}</div>}
            </div>

            {/* Equity */}
            <div className="bg-white rounded-2xl border border-[#e4e6eb] shadow-card p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-semibold text-[#65676b] uppercase tracking-wider">Equity</span>
                <div className="w-7 h-7 rounded-xl bg-green-50 flex items-center justify-center">
                  <DollarSign className="w-3.5 h-3.5 text-green-600" />
                </div>
              </div>
              <div className="text-xl lg:text-2xl font-bold text-green-600">{loading ? '—' : fmt(equity)}</div>
              {selectedProp.loan_balance && <div className="text-[10px] text-[#65676b] mt-1">Loan: {fmt(selectedProp.loan_balance)}</div>}
              <EquityMeter equity={equity} value={avm?.estimatedValue} />
              {equity && avm?.estimatedValue && (
                <Link href="/dashboard/homeowner/heloc"
                  className="mt-2 flex items-center justify-center gap-1.5 w-full py-1.5 bg-[#e7f0fd] hover:bg-[#1877F2] text-[#1877F2] hover:text-white rounded-lg text-[10px] font-bold transition-all">
                  <ShoppingCart className="w-3 h-3" /> Shop HELOC Options
                </Link>
              )}
            </div>

            {/* Gain */}
            <div className="bg-white rounded-2xl border border-[#e4e6eb] shadow-card p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-semibold text-[#65676b] uppercase tracking-wider">Total Gain</span>
                <div className={`w-7 h-7 rounded-xl flex items-center justify-center ${gainLoss >= 0 ? 'bg-green-50' : 'bg-red-50'}`}>
                  {gainLoss >= 0
                    ? <ArrowUpRight className="w-3.5 h-3.5 text-green-600" />
                    : <ArrowDownRight className="w-3.5 h-3.5 text-red-500" />}
                </div>
              </div>
              <div className={`text-xl lg:text-2xl font-bold ${gainLoss >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                {loading ? '—' : gainLoss ? fmt(Math.abs(gainLoss)) : '—'}
              </div>
              {gainPct != null && (
                <div className={`text-xs font-semibold mt-1 ${gainPct >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                  {gainPct >= 0 ? '+' : ''}{gainPct.toFixed(1)}% since purchase
                </div>
              )}
            </div>

            {/* Rate */}
            <div className="bg-white rounded-2xl border border-[#e4e6eb] shadow-card p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-semibold text-[#65676b] uppercase tracking-wider">30yr Rate</span>
                <div className="w-7 h-7 rounded-xl bg-purple-50 flex items-center justify-center">
                  <Percent className="w-3.5 h-3.5 text-purple-600" />
                </div>
              </div>
              <div className="text-xl lg:text-2xl font-bold text-purple-600">{rate ? `${rate}%` : '—'}</div>
              <div className="text-[10px] text-[#65676b] mt-1">Freddie Mac avg</div>
              {selectedProp.loan_rate && (
                <div className="mt-2 bg-[#f8f9fa] rounded-lg px-2 py-1.5 text-[10px]">
                  <span className="text-[#65676b]">Your rate: </span>
                  <span className="text-[#1a1a2e] font-bold">{selectedProp.loan_rate}%</span>
                  {rate && selectedProp.loan_rate > rate && (
                    <span className="text-[#1877F2] font-bold ml-1">↓ Refi?</span>
                  )}
                </div>
              )}
              <Link href="/dashboard/homeowner/mortgage"
                className="mt-2 flex items-center justify-center gap-1.5 w-full py-1.5 bg-purple-50 hover:bg-purple-600 text-purple-600 hover:text-white rounded-lg text-[10px] font-bold transition-all">
                <ShoppingCart className="w-3 h-3" /> Shop Rates
              </Link>
            </div>
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
                      contentStyle={{ background: 'white', border: '1px solid #e4e6eb', borderRadius: '12px', fontSize: '12px' }}
                      formatter={v => [fmt(v), 'Est. Value']} />
                    <Area type="monotone" dataKey="value" stroke="#1877F2" strokeWidth={2.5} fill="url(#valGrad)" dot={false} />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[180px] flex items-center justify-center text-[#9ca3af] text-sm">
                  {loading ? 'Loading chart...' : 'Add your purchase price to see trend'}
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
                <Link href="/dashboard/homeowner/messages" className="text-[#1877F2] hover:underline text-xs font-semibold flex items-center gap-1">
                  All <ChevronRight className="w-3 h-3" />
                </Link>
              </div>
              {unreadMessages.length === 0 ? (
                <div className="text-center py-5">
                  <MessageSquare className="w-8 h-8 text-[#e4e6eb] mx-auto mb-2" />
                  <p className="text-[#9ca3af] text-xs">No new messages</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {unreadMessages.map(msg => (
                    <div key={msg.id} className="flex items-start gap-3 p-3 bg-[#f8f9fa] rounded-xl">
                      <div className="w-8 h-8 rounded-full bg-[#e7f0fd] flex items-center justify-center flex-shrink-0 text-[#1877F2] text-xs font-bold">
                        {msg.from?.full_name?.charAt(0) || '?'}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[#1a1a2e] text-xs font-semibold">{msg.from?.full_name}</span>
                          <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-semibold ${
                            msg.message_type === 'rate_alert' ? 'bg-purple-100 text-purple-600' :
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
                  { label: 'Agent',  data: agent,  color: 'text-green-600',  bg: 'bg-green-50 border-green-200',  dot: 'bg-green-500' },
                  { label: 'Lender', data: lender, color: 'text-blue-600',   bg: 'bg-blue-50 border-blue-200',    dot: 'bg-blue-500' },
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
      {showPortfolio && (
        <MultiPropertyModal properties={properties} avmCache={avmCache} onClose={() => setShowPortfolio(false)} />
      )}
    </div>
  )
}
