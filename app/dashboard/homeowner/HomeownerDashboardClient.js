'use client'
import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { Home, TrendingUp, DollarSign, MessageSquare, Plus, RefreshCw, ChevronRight, User, AlertCircle, Building2, Percent, ArrowUpRight, ArrowDownRight, Clock, ShoppingCart, Edit2, Search, BarChart2, Calendar, Zap } from 'lucide-react'
import AddPropertyModal from './AddPropertyModal'
import GetOfferModal from './GetOfferModal'
import EditPropertyModal from './EditPropertyModal'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import Link from 'next/link'

function fmt(n) { if(!n&&n!==0)return'—'; return'$'+Math.round(n).toLocaleString('en-US') }
function pct(n) { if(!n)return'—'; return(n*100).toFixed(1)+'%' }
function daysAgo(d) { if(!d)return null; const days=Math.floor((Date.now()-new Date(d).getTime())/(86400000)); return days===0?'Today':days===1?'Yesterday':`${days}d ago` }
function daysUntil(d) { if(!d)return null; const days=Math.ceil((new Date(d).getTime()-Date.now())/(86400000)); return days<=0?'Now':days===1?'Tomorrow':`In ${days}d` }

function yearsSince(dateStr) {
  if (!dateStr) return null
  const years = (Date.now() - new Date(dateStr).getTime()) / (365.25 * 86400000)
  return years > 0 ? years : null
}

function calcYoY(current, purchase, purchaseDate) {
  if (!current || !purchase || !purchaseDate) return null
  const years = yearsSince(purchaseDate)
  if (!years || years < 0.1) return null
  const totalReturn = (current - purchase) / purchase
  const annualized = (Math.pow(1 + totalReturn, 1 / years) - 1) * 100
  return annualized
}

function EquityMeter({equity, value}) {
  if(!value||!equity)return null
  const ratio=Math.min(Math.max(equity/value,0),1),degrees=ratio*180,r=60,cx=75,cy=75
  const toRad=d=>(d-180)*Math.PI/180,x=cx+r*Math.cos(toRad(degrees)),y=cy+r*Math.sin(toRad(degrees))
  const color=ratio>0.5?'#22c55e':ratio>0.25?'#f59e0b':'#ef4444'
  return <svg viewBox="0 0 150 85" className="w-full max-w-[160px] mx-auto"><path d={`M ${cx-r} ${cy} A ${r} ${r} 0 0 1 ${cx+r} ${cy}`} fill="none" stroke="#f0f2f5" strokeWidth="12" strokeLinecap="round"/><path d={`M ${cx-r} ${cy} A ${r} ${r} 0 0 1 ${x} ${y}`} fill="none" stroke={color} strokeWidth="12" strokeLinecap="round"/><circle cx={x} cy={y} r="5" fill="white" stroke={color} strokeWidth="2"/><text x={cx} y={cy-6} textAnchor="middle" fill="#1a1a2e" fontSize="13" fontWeight="bold">{pct(ratio)}</text><text x={cx} y={cy+8} textAnchor="middle" fill="#65676b" fontSize="6">EQUITY</text></svg>
}

function PropertyCard({ prop, avm, avmLoading, onSelect, onEdit, onGetOffer, selected, rate }) {
  const val    = avm?.estimatedValue || prop.avm_value || null
  const equity = val && prop.loan_balance ? val - prop.loan_balance : null
  const gain   = val && prop.purchase_price ? val - prop.purchase_price : null
  const gainPct = gain && prop.purchase_price ? (gain / prop.purchase_price) * 100 : null
  const yoyValue = calcYoY(val, prop.purchase_price, prop.purchase_date)
  const equityAtPurchase = prop.purchase_price && prop.loan_balance ? prop.purchase_price - prop.loan_balance : null
  const yoyEquity = equity && equityAtPurchase && equityAtPurchase > 0 ? calcYoY(equity, equityAtPurchase, prop.purchase_date) : null
  const loading = avmLoading

  return (
    <div onClick={onSelect}
      className={`bg-white rounded-2xl border-2 transition-all cursor-pointer hover:shadow-cardHv ${selected ? 'border-[#1877F2] shadow-cardHv' : 'border-[#e4e6eb] shadow-card hover:border-[#1877F2]/30'}`}>
      {/* Card header */}
      <div className={`px-4 py-3 rounded-t-2xl flex items-center justify-between ${selected ? 'bg-[#1877F2]' : 'bg-[#f8f9fa]'}`}>
        <div className="flex items-center gap-2 min-w-0">
          <Home className={`w-3.5 h-3.5 flex-shrink-0 ${selected ? 'text-white/70' : 'text-[#1877F2]'}`} />
          <div className="min-w-0">
            <div className={`font-bold text-sm truncate ${selected ? 'text-white' : 'text-[#1a1a2e]'}`}>{prop.address}</div>
            <div className={`text-[10px] ${selected ? 'text-white/60' : 'text-[#9ca3af]'}`}>{prop.city}, {prop.state} {prop.zip}</div>
          </div>
        </div>
        <button onClick={e => { e.stopPropagation(); onEdit() }}
          className={`p-1.5 rounded-lg transition-all flex-shrink-0 ${selected ? 'hover:bg-white/20 text-white/70 hover:text-white' : 'hover:bg-[#e4e6eb] text-[#9ca3af] hover:text-[#1877F2]'}`}>
          <Edit2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Stats grid */}
      <div className="p-4 grid grid-cols-2 gap-3">
        <div>
          <div className="text-[9px] text-[#9ca3af] uppercase tracking-wider mb-0.5">Est. Value</div>
          <div className="text-base font-bold text-[#1a1a2e]">{loading ? <span className="text-[#9ca3af] text-xs">Loading...</span> : fmt(val)}</div>
          {yoyValue != null && (
            <div className={`text-[10px] font-semibold flex items-center gap-0.5 mt-0.5 ${yoyValue >= 0 ? 'text-green-600' : 'text-red-500'}`}>
              {yoyValue >= 0 ? '↑' : '↓'} {Math.abs(yoyValue).toFixed(1)}%/yr avg
            </div>
          )}
        </div>
        <div>
          <div className="text-[9px] text-[#9ca3af] uppercase tracking-wider mb-0.5">Equity</div>
          <div className="text-base font-bold text-green-600">{loading ? '—' : fmt(equity)}</div>
          {yoyEquity != null && (
            <div className={`text-[10px] font-semibold flex items-center gap-0.5 mt-0.5 ${yoyEquity >= 0 ? 'text-green-600' : 'text-red-500'}`}>
              {yoyEquity >= 0 ? '↑' : '↓'} {Math.abs(yoyEquity).toFixed(1)}%/yr equity
            </div>
          )}
        </div>
        <div>
          <div className="text-[9px] text-[#9ca3af] uppercase tracking-wider mb-0.5">Loan Balance</div>
          <div className="text-sm font-semibold text-[#1a1a2e]">{fmt(prop.loan_balance)}</div>
        </div>
        <div>
          <div className="text-[9px] text-[#9ca3af] uppercase tracking-wider mb-0.5">Total Gain</div>
          <div className={`text-sm font-semibold ${gain >= 0 ? 'text-green-600' : 'text-red-500'}`}>
            {gain != null ? fmt(Math.abs(gain)) : '—'}
            {gainPct != null && <span className="text-[10px] ml-1">({gainPct >= 0 ? '+' : ''}{gainPct.toFixed(1)}%)</span>}
          </div>
        </div>
        {prop.purchase_date && (
          <div className="col-span-2">
            <div className="text-[9px] text-[#9ca3af] uppercase tracking-wider mb-0.5 flex items-center gap-1"><Calendar className="w-2.5 h-2.5" />Owned since</div>
            <div className="text-[10px] text-[#65676b]">
              {new Date(prop.purchase_date).toLocaleDateString('en-US', {month:'short', year:'numeric'})}
              {yearsSince(prop.purchase_date) && ` · ${yearsSince(prop.purchase_date).toFixed(1)} years`}
            </div>
          </div>
        )}
      </div>

      {/* AVM cache info */}
      {avm?.lastUpdated && (
        <div className="px-4 pb-3">
          <div className="text-[9px] text-[#9ca3af] flex items-center gap-1">
            <Clock className="w-2.5 h-2.5" />
            Updated {daysAgo(avm.lastUpdated)} · Next {daysUntil(avm.nextUpdate)}
            {avm.cached && <span className="ml-1 bg-[#e7f0fd] text-[#1877F2] px-1.5 py-0.5 rounded-full text-[8px] font-bold">CACHED</span>}
          </div>
        </div>
      )}
    </div>
  )
}

export default function HomeownerDashboardClient({profile, properties, unreadMessages, relationships}) {
  const searchParams = useSearchParams()
  const [selectedProp, setSelectedProp]   = useState(properties[0] || null)
  const [avmCache, setAvmCache]           = useState({})
  const [avmLoading, setAvmLoading]       = useState({})
  const [avmError, setAvmError]           = useState(null)
  const [showAddModal, setShowAddModal]   = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingProp, setEditingProp]     = useState(null)
  const [showOfferModal, setShowOfferModal] = useState(false)
  const [offerProp, setOfferProp]           = useState(null)
  const [rate, setRate]                   = useState(null)
  const [valueHistory, setValueHistory]   = useState([])

  const agent  = relationships.find(r => r.professional?.role === 'agent')?.professional
  const lender = relationships.find(r => r.professional?.role === 'lender')?.professional

  useEffect(() => { fetch('/api/rates').then(r => r.json()).then(d => setRate(d.rate)).catch(() => {}) }, [])

  // Handle URL params from homepage CTAs
  useEffect(() => {
    const offerParam = searchParams.get('offer')
    const addPropParam = searchParams.get('add_property')
    if (offerParam === 'true') {
      setShowOfferModal(true)
      setOfferProp(properties[0] || null)
    }
    if (addPropParam) {
      setShowAddModal(true)
    }
  }, [searchParams])

  useEffect(() => {
    properties.forEach(p => fetchAVM(p, false))
  }, [properties.length])

  useEffect(() => {
    if (!selectedProp) return
    const avm = avmCache[selectedProp.id]
    if (avm && selectedProp.purchase_price) {
      const purchase = selectedProp.purchase_price || avm.estimatedValue * 0.85
      setValueHistory(Array.from({length: 6}, (_, i) => ({
        month: ['Jan','Feb','Mar','Apr','May','Jun'][i],
        value: Math.round(purchase + ((avm.estimatedValue - purchase) * (i / 5))),
      })))
    }
  }, [selectedProp?.id, avmCache])

  const fetchAVM = async (prop, force = false) => {
    if (avmLoading[prop.id] && !force) return
    setAvmLoading(p => ({...p, [prop.id]: true}))
    setAvmError(null)
    try {
      const q = new URLSearchParams({ address: prop.address, city: prop.city, state: prop.state, zip: prop.zip, property_id: prop.id, force: force ? 'true' : 'false' })
      const res  = await fetch(`/api/avm?${q}`)
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setAvmCache(p => ({...p, [prop.id]: data}))
    } catch (err) {
      if (prop.id === selectedProp?.id) setAvmError(err.message)
    } finally {
      setAvmLoading(p => ({...p, [prop.id]: false}))
    }
  }

  const openEdit = (prop, e) => { e?.stopPropagation(); setEditingProp(prop); setShowEditModal(true) }

  // Portfolio totals
  const totalValue  = properties.reduce((s, p) => s + (avmCache[p.id]?.estimatedValue || p.avm_value || 0), 0)
  const totalEquity = properties.reduce((s, p) => { const v = avmCache[p.id]?.estimatedValue || p.avm_value || 0; return s + (v && p.loan_balance ? v - p.loan_balance : 0) }, 0)
  const totalLoan   = properties.reduce((s, p) => s + (p.loan_balance || 0), 0)

  const avm     = selectedProp ? avmCache[selectedProp.id] : null
  const loading = selectedProp ? avmLoading[selectedProp.id] : false
  const equity  = avm?.estimatedValue && selectedProp?.loan_balance ? avm.estimatedValue - selectedProp.loan_balance : null
  const gainLoss = avm?.estimatedValue && selectedProp?.purchase_price ? avm.estimatedValue - selectedProp.purchase_price : null
  const gainPct  = gainLoss && selectedProp?.purchase_price ? (gainLoss / selectedProp.purchase_price) * 100 : null
  const yoyValue = calcYoY(avm?.estimatedValue, selectedProp?.purchase_price, selectedProp?.purchase_date)
  const equityAtPurchase = selectedProp?.purchase_price && selectedProp?.loan_balance ? selectedProp.purchase_price - selectedProp.loan_balance : null
  const yoyEquity = calcYoY(equity, equityAtPurchase, selectedProp?.purchase_date)

  return (
    <div className="space-y-5 pb-10">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-[#1a1a2e]">Welcome back, {profile?.full_name?.split(' ')[0] || 'there'} 👋</h1>
          <p className="text-[#65676b] text-sm mt-0.5">Your home intelligence dashboard</p>
        </div>
        <button onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#1877F2] hover:bg-[#1665d8] text-white rounded-xl font-semibold text-sm transition-colors shadow-sm">
          <Plus className="w-4 h-4" /> Add Property
        </button>
      </div>

      {/* Portfolio totals — light strip */}
      {properties.length > 0 && totalValue > 0 && (
        <div className="bg-white rounded-2xl border border-[#e4e6eb] shadow-card p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-[#1a1a2e] font-bold text-sm flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-[#1877F2]" /> Portfolio Summary
            </h2>
            <span className="text-[10px] text-[#9ca3af]">{properties.length} {properties.length === 1 ? 'property' : 'properties'}</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label:'Total Value',  value: fmt(totalValue),  color:'text-[#1877F2]' },
              { label:'Total Equity', value: fmt(totalEquity), color:'text-green-600' },
              { label:'Total Loans',  value: fmt(totalLoan),   color:'text-[#65676b]' },
              { label:'Avg LTV',      value: totalValue ? `${(totalLoan/totalValue*100).toFixed(0)}%` : '—', color:'text-purple-600' },
            ].map(item => (
              <div key={item.label} className="bg-[#f8f9fa] rounded-xl p-3 text-center border border-[#e4e6eb]">
                <div className="text-[9px] text-[#9ca3af] uppercase tracking-wider mb-1">{item.label}</div>
                <div className={`font-bold text-base ${item.color}`}>{item.value}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* No properties */}
      {properties.length === 0 && (
        <div className="bg-white rounded-2xl border-2 border-dashed border-[#e4e6eb] p-12 text-center shadow-card">
          <div className="w-14 h-14 bg-[#e7f0fd] rounded-2xl flex items-center justify-center mx-auto mb-4"><Home className="w-7 h-7 text-[#1877F2]" /></div>
          <h3 className="text-[#1a1a2e] font-bold text-lg mb-1">Add your first property</h3>
          <p className="text-[#65676b] text-sm mb-5">Start tracking your home value, equity, and more</p>
          <button onClick={() => setShowAddModal(true)} className="px-6 py-3 bg-[#1877F2] hover:bg-[#1665d8] text-white rounded-xl font-semibold text-sm transition-colors shadow-sm">Add Property</button>
        </div>
      )}

      {/* Properties SIDE BY SIDE */}
      {properties.length > 0 && (
        <div className={`grid gap-4 ${properties.length === 1 ? 'grid-cols-1 max-w-md' : properties.length === 2 ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'}`}>
          {properties.map(p => (
            <PropertyCard key={p.id} prop={p} avm={avmCache[p.id]} avmLoading={avmLoading[p.id]}
              selected={selectedProp?.id === p.id} rate={rate}
              onSelect={() => setSelectedProp(p)}
              onEdit={() => openEdit(p)}
              onGetOffer={() => { setOfferProp({...p, avm_value: avmCache[p.id]?.estimatedValue || p.avm_value}); setShowOfferModal(true) }} />
          ))}
        </div>
      )}

      {/* Selected property detail */}
      {selectedProp && (
        <>
          {/* Address bar */}
          <div className="bg-white rounded-xl border border-[#e4e6eb] shadow-card px-4 py-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 min-w-0">
              <Home className="w-3.5 h-3.5 text-[#1877F2] flex-shrink-0" />
              <span className="text-[#1a1a2e] font-semibold text-xs truncate">{selectedProp.address}, {selectedProp.city}, {selectedProp.state} {selectedProp.zip}</span>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {avm?.lastUpdated && <div className="hidden sm:flex items-center gap-1 text-[#9ca3af] text-[10px]"><Clock className="w-3 h-3" /><span>Next {daysUntil(avm.nextUpdate)}</span></div>}
              <button onClick={e => openEdit(selectedProp, e)} className="flex items-center gap-1 text-[#65676b] hover:text-[#1877F2] transition-colors text-xs font-semibold px-2 py-1 rounded-lg hover:bg-[#e7f0fd]">
                <Edit2 className="w-3.5 h-3.5" /> Edit
              </button>
              <button onClick={() => { setOfferProp({...selectedProp, avm_value: avm?.estimatedValue || selectedProp.avm_value}); setShowOfferModal(true) }}
                className="flex items-center gap-1.5 text-[#1877F2] font-bold text-xs px-2.5 py-1.5 bg-[#e7f0fd] hover:bg-[#1877F2] hover:text-white rounded-lg transition-all">
                <Zap className="w-3 h-3" /> Get Offer
              </button>
              <button onClick={() => fetchAVM(selectedProp, true)} disabled={loading}
                className="flex items-center gap-1 text-[#1877F2] hover:text-[#1665d8] transition-colors text-xs font-semibold px-2 py-1 rounded-lg hover:bg-[#e7f0fd]">
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">{loading ? 'Updating...' : 'Refresh'}</span>
              </button>
            </div>
          </div>

          {avmError && <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 rounded-xl p-4 text-sm"><AlertCircle className="w-4 h-4 flex-shrink-0" />{avmError}</div>}

          {/* 4 stat cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="bg-white rounded-2xl border border-[#e4e6eb] shadow-card p-4">
              <div className="flex items-center justify-between mb-2"><span className="text-[10px] font-semibold text-[#65676b] uppercase tracking-wider">Est. Value</span><div className="w-7 h-7 rounded-xl bg-[#e7f0fd] flex items-center justify-center"><TrendingUp className="w-3.5 h-3.5 text-[#1877F2]" /></div></div>
              <div className="text-xl lg:text-2xl font-bold text-[#1a1a2e]">{loading ? <span className="text-[#9ca3af] text-base animate-pulse">Loading...</span> : fmt(avm?.estimatedValue)}</div>
              {avm && <div className="text-[10px] text-[#65676b] mt-1">{fmt(avm.lowValue)} — {fmt(avm.highValue)}</div>}
              {yoyValue != null && <div className={`text-[10px] font-semibold mt-1 ${yoyValue >= 0 ? 'text-green-600' : 'text-red-500'}`}>{yoyValue >= 0 ? '↑' : '↓'} {Math.abs(yoyValue).toFixed(1)}%/yr avg since purchase</div>}
            </div>

            <div className="bg-white rounded-2xl border border-[#e4e6eb] shadow-card p-4">
              <div className="flex items-center justify-between mb-2"><span className="text-[10px] font-semibold text-[#65676b] uppercase tracking-wider">Equity</span><div className="w-7 h-7 rounded-xl bg-green-50 flex items-center justify-center"><DollarSign className="w-3.5 h-3.5 text-green-600" /></div></div>
              <div className="text-xl lg:text-2xl font-bold text-green-600">{loading ? '—' : fmt(equity)}</div>
              {selectedProp.loan_balance && <div className="text-[10px] text-[#65676b] mt-1">Loan: {fmt(selectedProp.loan_balance)}</div>}
              {yoyEquity != null && <div className={`text-[10px] font-semibold mt-1 ${yoyEquity >= 0 ? 'text-green-600' : 'text-red-500'}`}>{yoyEquity >= 0 ? '↑' : '↓'} {Math.abs(yoyEquity).toFixed(1)}%/yr equity growth</div>}
              <EquityMeter equity={equity} value={avm?.estimatedValue} />
              {equity && avm?.estimatedValue && <Link href="/dashboard/homeowner/heloc" className="mt-2 flex items-center justify-center gap-1.5 w-full py-1.5 bg-[#e7f0fd] hover:bg-[#1877F2] text-[#1877F2] hover:text-white rounded-lg text-[10px] font-bold transition-all"><ShoppingCart className="w-3 h-3" />Shop HELOC</Link>}
            </div>

            <div className="bg-white rounded-2xl border border-[#e4e6eb] shadow-card p-4">
              <div className="flex items-center justify-between mb-2"><span className="text-[10px] font-semibold text-[#65676b] uppercase tracking-wider">Total Gain</span><div className={`w-7 h-7 rounded-xl flex items-center justify-center ${gainLoss >= 0 ? 'bg-green-50' : 'bg-red-50'}`}>{gainLoss >= 0 ? <ArrowUpRight className="w-3.5 h-3.5 text-green-600" /> : <ArrowDownRight className="w-3.5 h-3.5 text-red-500" />}</div></div>
              <div className={`text-xl lg:text-2xl font-bold ${gainLoss >= 0 ? 'text-green-600' : 'text-red-500'}`}>{loading ? '—' : gainLoss ? fmt(Math.abs(gainLoss)) : '—'}</div>
              {gainPct != null && <div className={`text-xs font-semibold mt-1 ${gainPct >= 0 ? 'text-green-600' : 'text-red-500'}`}>{gainPct >= 0 ? '+' : ''}{gainPct.toFixed(1)}% total since purchase</div>}
              {selectedProp.purchase_date && <div className="text-[10px] text-[#9ca3af] mt-1">Since {new Date(selectedProp.purchase_date).toLocaleDateString('en-US', {month:'short', year:'numeric'})}</div>}
            </div>

            <div className="bg-white rounded-2xl border border-[#e4e6eb] shadow-card p-4">
              <div className="flex items-center justify-between mb-2"><span className="text-[10px] font-semibold text-[#65676b] uppercase tracking-wider">30yr Rate</span><div className="w-7 h-7 rounded-xl bg-purple-50 flex items-center justify-center"><Percent className="w-3.5 h-3.5 text-purple-600" /></div></div>
              <div className="text-xl lg:text-2xl font-bold text-purple-600">{rate ? `${rate}%` : '—'}</div>
              <div className="text-[10px] text-[#65676b] mt-1">Freddie Mac avg</div>
              {selectedProp.loan_rate && <div className="mt-2 bg-[#f8f9fa] rounded-lg px-2 py-1.5 text-[10px]"><span className="text-[#65676b]">Your rate: </span><span className="text-[#1a1a2e] font-bold">{selectedProp.loan_rate}%</span>{rate && selectedProp.loan_rate > rate && <span className="text-[#1877F2] font-bold ml-1">↓ Refi?</span>}</div>}
              <Link href="/dashboard/homeowner/rates" className="mt-2 flex items-center justify-center gap-1.5 w-full py-1.5 bg-purple-50 hover:bg-purple-600 text-purple-600 hover:text-white rounded-lg text-[10px] font-bold transition-all"><ShoppingCart className="w-3 h-3" />Shop Rates</Link>
            </div>
          </div>

          {/* Chart + Details */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2 bg-white rounded-2xl border border-[#e4e6eb] shadow-card p-5">
              <h3 className="text-[#1a1a2e] font-bold mb-1 text-sm">Value Trend</h3>
              {yoyValue != null && <p className="text-[#65676b] text-xs mb-3">Annualized return: <span className={`font-bold ${yoyValue >= 0 ? 'text-green-600' : 'text-red-500'}`}>{yoyValue >= 0 ? '+' : ''}{yoyValue.toFixed(2)}%/year</span></p>}
              {valueHistory.length > 0 ? (
                <ResponsiveContainer width="100%" height={180}>
                  <AreaChart data={valueHistory}>
                    <defs><linearGradient id="valGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#1877F2" stopOpacity={0.15} /><stop offset="95%" stopColor="#1877F2" stopOpacity={0} /></linearGradient></defs>
                    <XAxis dataKey="month" tick={{ fill: '#65676b', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: '#65676b', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => '$' + (v / 1000).toFixed(0) + 'k'} />
                    <Tooltip contentStyle={{ background: 'white', border: '1px solid #e4e6eb', borderRadius: '12px', fontSize: '12px' }} formatter={v => [fmt(v), 'Est. Value']} />
                    <Area type="monotone" dataKey="value" stroke="#1877F2" strokeWidth={2.5} fill="url(#valGrad)" dot={false} />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[180px] flex items-center justify-center text-[#9ca3af] text-sm">{loading ? 'Loading chart...' : 'Add purchase price & date to see trend'}</div>
              )}
            </div>
            <div className="bg-white rounded-2xl border border-[#e4e6eb] shadow-card p-5">
              <div className="flex items-center justify-between mb-3"><h3 className="text-[#1a1a2e] font-bold text-sm">Property Details</h3><button onClick={e => openEdit(selectedProp, e)} className="text-[#1877F2] text-xs font-semibold flex items-center gap-1 hover:underline"><Edit2 className="w-3 h-3" />Edit</button></div>
              <div className="space-y-2">
                {[['Type',selectedProp.loan_type||'—'],['Bedrooms',selectedProp.bedrooms||'—'],['Bathrooms',selectedProp.bathrooms||'—'],['Sq Ft',selectedProp.sqft?selectedProp.sqft.toLocaleString():'—'],['Year Built',selectedProp.year_built||'—'],['Loan Rate',selectedProp.loan_rate?`${selectedProp.loan_rate}%`:'—'],['Purchase Price',fmt(selectedProp.purchase_price)]].map(([k,v]) => (
                  <div key={k} className="flex items-center justify-between py-1.5 border-b border-[#f0f2f5] last:border-0">
                    <span className="text-[#65676b] text-xs">{k}</span><span className="text-[#1a1a2e] text-xs font-semibold">{v}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Messages + My Team */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-white rounded-2xl border border-[#e4e6eb] shadow-card p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-[#1a1a2e] font-bold text-sm flex items-center gap-2"><MessageSquare className="w-4 h-4 text-[#1877F2]" />Messages{unreadMessages.length > 0 && <span className="bg-[#1877F2] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">{unreadMessages.length}</span>}</h3>
                <Link href="/dashboard/homeowner/messages" className="text-[#1877F2] hover:underline text-xs font-semibold flex items-center gap-1">All<ChevronRight className="w-3 h-3" /></Link>
              </div>
              {unreadMessages.length === 0 ? (
                <div className="text-center py-5"><MessageSquare className="w-8 h-8 text-[#e4e6eb] mx-auto mb-2" /><p className="text-[#9ca3af] text-xs">No new messages</p></div>
              ) : (
                <div className="space-y-2">{unreadMessages.map(msg => (
                  <div key={msg.id} className="flex items-start gap-3 p-3 bg-[#f8f9fa] rounded-xl">
                    <div className="w-8 h-8 rounded-full bg-[#e7f0fd] flex items-center justify-center flex-shrink-0 text-[#1877F2] text-xs font-bold">{msg.from?.full_name?.charAt(0) || '?'}</div>
                    <div className="min-w-0"><div className="flex items-center gap-2"><span className="text-[#1a1a2e] text-xs font-semibold">{msg.from?.full_name}</span></div><p className="text-[#65676b] text-xs mt-0.5 truncate">{msg.subject || msg.body}</p></div>
                  </div>
                ))}</div>
              )}
            </div>

            <div className="bg-white rounded-2xl border border-[#e4e6eb] shadow-card p-5">
              <h3 className="text-[#1a1a2e] font-bold text-sm flex items-center gap-2 mb-3"><User className="w-4 h-4 text-[#1877F2]" />My Team</h3>
              <div className="space-y-3">
                {[
                  { label:'Agent',  data:agent,  color:'text-green-600', bg:'bg-green-50 border-green-200', dot:'bg-green-500', searchLabel:'Find an Agent' },
                  { label:'Lender', data:lender, color:'text-blue-600',  bg:'bg-blue-50 border-blue-200',   dot:'bg-blue-500',  searchLabel:'Find a Lender' },
                ].map(({label, data, color, bg, dot, searchLabel}) => (
                  <div key={label} className={`flex items-center gap-3 p-3 rounded-xl border ${data ? bg : 'bg-[#f8f9fa] border-[#e4e6eb]'}`}>
                    <div className="relative flex-shrink-0">
                      <div className="w-10 h-10 rounded-full bg-white border border-[#e4e6eb] flex items-center justify-center text-[#1a1a2e] font-bold text-sm">{data?.full_name?.charAt(0) || <Building2 className="w-4 h-4 text-[#9ca3af]" />}</div>
                      {data && <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${dot}`} />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className={`text-[10px] font-bold uppercase tracking-wider ${data ? color : 'text-[#9ca3af]'}`}>{label}</div>
                      {data ? (<><div className="text-[#1a1a2e] text-sm font-semibold">{data.full_name}</div>{data.company && <div className="text-[#65676b] text-xs">{data.company}</div>}</>) :
                        <Link href="/dashboard/homeowner/connections" className="flex items-center gap-1.5 mt-0.5 text-xs text-[#1877F2] font-semibold hover:underline"><Search className="w-3 h-3" />{searchLabel}</Link>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      {showAddModal && <AddPropertyModal onClose={() => setShowAddModal(false)} onAdded={() => { setShowAddModal(false); window.location.reload() }} />}
      {showOfferModal && <GetOfferModal property={offerProp} onClose={() => setShowOfferModal(false)} onSubmitted={() => setShowOfferModal(false)} />}
      {showEditModal && editingProp && <EditPropertyModal property={{...editingProp, avm_value: avmCache[editingProp.id]?.estimatedValue || editingProp.avm_value}} onClose={() => setShowEditModal(false)} onSaved={() => { setShowEditModal(false); window.location.reload() }} onDeleted={() => { setShowEditModal(false); window.location.reload() }} />}
    </div>
  )
}
