'use client'
import { useState, useEffect } from 'react'
import { Home, DollarSign, TrendingUp, ShoppingCart, Info, ChevronDown, Phone, Mail, Globe, Star } from 'lucide-react'
import Link from 'next/link'

function fmt(n) { return n ? '$' + Math.round(n).toLocaleString('en-US') : '—' }

const LTV_OPTIONS = [
  { pct: 75, label: '75% LTV', risk: 'Conservative', color: 'bg-green-50 border-green-200', badge: 'bg-green-100 text-green-700', bar: 'bg-green-500' },
  { pct: 80, label: '80% LTV', risk: 'Standard',     color: 'bg-blue-50 border-blue-200',   badge: 'bg-blue-100 text-blue-700',   bar: 'bg-blue-500' },
  { pct: 85, label: '85% LTV', risk: 'Moderate',     color: 'bg-purple-50 border-purple-200', badge: 'bg-purple-100 text-purple-700', bar: 'bg-purple-500' },
  { pct: 90, label: '90% LTV', risk: 'High',         color: 'bg-orange-50 border-orange-200', badge: 'bg-orange-100 text-orange-700', bar: 'bg-orange-500' },
  { pct: 95, label: '95% LTV', risk: 'Very High',    color: 'bg-red-50 border-red-200',     badge: 'bg-red-100 text-red-700',     bar: 'bg-red-500' },
]

// Sample lenders — will be replaced with real lenders later
const SAMPLE_LENDERS = [
  { name: 'Pacific Coast Lending', rate: '7.25%', type: 'HELOC', min: 50000, max: 2000000, ltv: 90, stars: 4.8, phone: '(858) 555-0101', specialty: 'Jumbo HELOC specialist' },
  { name: 'SoCal Home Equity',     rate: '7.49%', type: 'HELOC', min: 25000, max: 1500000, ltv: 85, stars: 4.6, phone: '(858) 555-0102', specialty: 'Fast approval — 10 days' },
  { name: 'Carmel Valley Funding', rate: '7.75%', type: 'HELOC', min: 50000, max: 3000000, ltv: 95, stars: 4.9, phone: '(858) 555-0103', specialty: 'Luxury home equity experts' },
  { name: 'Del Mar Mortgage',      rate: '8.00%', type: 'HELOC', min: 100000, max: 5000000, ltv: 80, stars: 4.7, phone: '(858) 555-0104', specialty: 'High-value property specialists' },
]

export default function HelocClient({ properties }) {
  const [selectedProp, setSelectedProp] = useState(properties[0] || null)
  const [homeValue, setHomeValue]       = useState('')
  const [loanBalance, setLoanBalance]   = useState('')
  const [avmLoading, setAvmLoading]     = useState(false)

  useEffect(() => {
    if (!selectedProp) return
    setLoanBalance(selectedProp.loan_balance || '')
    // Try to get cached AVM value
    if (selectedProp.avm_value) {
      setHomeValue(selectedProp.avm_value)
    } else {
      fetchValue()
    }
  }, [selectedProp?.id])

  const fetchValue = async () => {
    if (!selectedProp) return
    setAvmLoading(true)
    try {
      const q = new URLSearchParams({ address: selectedProp.address, city: selectedProp.city, state: selectedProp.state, zip: selectedProp.zip, property_id: selectedProp.id, force: 'false' })
      const res  = await fetch(`/api/avm?${q}`)
      const data = await res.json()
      if (data.estimatedValue) setHomeValue(data.estimatedValue)
    } catch {}
    finally { setAvmLoading(false) }
  }

  const val  = parseFloat(homeValue) || 0
  const loan = parseFloat(loanBalance) || 0
  const equity = val > loan ? val - loan : 0

  const inp = "w-full px-3 py-2.5 bg-white border border-[#e4e6eb] rounded-xl text-[#1a1a2e] focus:outline-none focus:border-[#1877F2] focus:ring-2 focus:ring-[#1877F2]/20 transition-all text-sm"
  const lbl = "block text-xs font-semibold text-[#65676b] mb-1.5 uppercase tracking-wider"

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-20">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[#1a1a2e] flex items-center gap-2">
          <DollarSign className="w-6 h-6 text-[#1877F2]" /> HELOC Options
        </h1>
        <p className="text-[#65676b] text-sm mt-0.5">Home Equity Line of Credit — explore how much you can access</p>
      </div>

      {/* Property selector + inputs */}
      <div className="bg-white rounded-2xl border border-[#e4e6eb] shadow-card p-5">
        <h2 className="text-[#1a1a2e] font-bold text-sm mb-4">Your Property</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {properties.length > 0 && (
            <div>
              <label className={lbl}>Property</label>
              <div className="relative">
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9ca3af] pointer-events-none" />
                <select value={selectedProp?.id || ''} onChange={e => setSelectedProp(properties.find(p => p.id === e.target.value))}
                  className={`${inp} appearance-none cursor-pointer pr-8`}>
                  {properties.map(p => <option key={p.id} value={p.id}>{p.address}</option>)}
                </select>
              </div>
            </div>
          )}
          <div>
            <label className={lbl}>Est. Home Value</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9ca3af] text-sm">$</span>
              <input type="number" value={homeValue} onChange={e => setHomeValue(e.target.value)}
                placeholder={avmLoading ? 'Loading...' : '1,200,000'} className={`${inp} pl-7`} />
            </div>
          </div>
          <div>
            <label className={lbl}>Current Loan Balance</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9ca3af] text-sm">$</span>
              <input type="number" value={loanBalance} onChange={e => setLoanBalance(e.target.value)}
                placeholder="750,000" className={`${inp} pl-7`} />
            </div>
          </div>
        </div>

        {/* Equity summary */}
        {equity > 0 && (
          <div className="mt-4 grid grid-cols-3 gap-3">
            {[
              { label: 'Home Value',   value: fmt(val),    color: 'text-[#1877F2]' },
              { label: 'Loan Balance', value: fmt(loan),   color: 'text-[#65676b]' },
              { label: 'Your Equity',  value: fmt(equity), color: 'text-green-600' },
            ].map(item => (
              <div key={item.label} className="bg-[#f8f9fa] rounded-xl p-3 text-center">
                <div className="text-[10px] text-[#65676b] uppercase tracking-wider mb-1">{item.label}</div>
                <div className={`font-bold text-lg ${item.color}`}>{item.value}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* LTV Options */}
      {val > 0 && loan >= 0 && (
        <div className="space-y-3">
          <h2 className="text-[#1a1a2e] font-bold text-sm flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-[#1877F2]" /> HELOC Amounts by LTV Ratio
          </h2>
          <div className="bg-[#e7f0fd] border border-[#1877F2]/20 rounded-xl p-3 flex items-start gap-2">
            <Info className="w-4 h-4 text-[#1877F2] flex-shrink-0 mt-0.5" />
            <p className="text-xs text-[#1877F2]">HELOC Amount = (Home Value × LTV%) − Current Loan Balance. Higher LTV = more money available but higher risk and rates.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
            {LTV_OPTIONS.map(opt => {
              const maxLoan   = val * (opt.pct / 100)
              const helocAmt  = Math.max(0, maxLoan - loan)
              const available = helocAmt > 0
              const ltvCurrent = loan > 0 ? (loan / val) * 100 : 0
              const needsMoreEquity = ltvCurrent >= opt.pct

              return (
                <div key={opt.pct} className={`rounded-2xl border p-4 ${available && !needsMoreEquity ? opt.color : 'bg-[#f8f9fa] border-[#e4e6eb]'}`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${available && !needsMoreEquity ? opt.badge : 'bg-[#e4e6eb] text-[#9ca3af]'}`}>
                      {opt.label}
                    </span>
                    <span className="text-[10px] text-[#9ca3af]">{opt.risk}</span>
                  </div>

                  <div className={`text-2xl font-bold mt-3 mb-1 ${available && !needsMoreEquity ? 'text-[#1a1a2e]' : 'text-[#9ca3af]'}`}>
                    {needsMoreEquity ? 'N/A' : fmt(helocAmt)}
                  </div>
                  <div className="text-[10px] text-[#65676b] mb-3">
                    {needsMoreEquity ? 'Current LTV exceeds this limit' : 'Available HELOC'}
                  </div>

                  {/* LTV bar */}
                  <div className="mb-3">
                    <div className="flex justify-between text-[9px] text-[#9ca3af] mb-1">
                      <span>Current LTV: {ltvCurrent.toFixed(0)}%</span>
                      <span>Limit: {opt.pct}%</span>
                    </div>
                    <div className="h-1.5 bg-[#e4e6eb] rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${needsMoreEquity ? 'bg-red-400' : opt.bar}`}
                        style={{ width: `${Math.min(100, (ltvCurrent / opt.pct) * 100)}%` }} />
                    </div>
                  </div>

                  <div className="text-[10px] text-[#65676b] space-y-0.5">
                    <div>Max loan: <span className="font-semibold text-[#1a1a2e]">{fmt(maxLoan)}</span></div>
                    <div>Your loan: <span className="font-semibold text-[#1a1a2e]">{fmt(loan)}</span></div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Lenders section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-[#1a1a2e] font-bold text-sm flex items-center gap-2">
            <ShoppingCart className="w-4 h-4 text-[#1877F2]" /> HELOC Lenders
          </h2>
          <span className="text-[10px] bg-[#e7f0fd] text-[#1877F2] px-2 py-1 rounded-full font-semibold">Sample lenders — real lenders coming soon</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {SAMPLE_LENDERS.map(lender => (
            <div key={lender.name} className="bg-white rounded-2xl border border-[#e4e6eb] shadow-card p-5">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="text-[#1a1a2e] font-bold">{lender.name}</div>
                  <div className="text-[#65676b] text-xs mt-0.5">{lender.specialty}</div>
                </div>
                <div className="flex items-center gap-1">
                  <Star className="w-3.5 h-3.5 text-[#c9a84c] fill-[#c9a84c]" />
                  <span className="text-xs font-bold text-[#1a1a2e]">{lender.stars}</span>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 mb-3">
                {[
                  { label: 'Rate',    value: lender.rate },
                  { label: 'Max LTV', value: `${lender.ltv}%` },
                  { label: 'Min',     value: `$${(lender.min/1000).toFixed(0)}K` },
                ].map(item => (
                  <div key={item.label} className="bg-[#f8f9fa] rounded-xl p-2 text-center">
                    <div className="text-[9px] text-[#65676b] uppercase tracking-wider">{item.label}</div>
                    <div className="text-sm font-bold text-[#1a1a2e] mt-0.5">{item.value}</div>
                  </div>
                ))}
              </div>
              <a href={`tel:${lender.phone}`}
                className="flex items-center justify-center gap-2 w-full py-2.5 bg-[#1877F2] hover:bg-[#1665d8] text-white rounded-xl text-xs font-bold transition-colors">
                <Phone className="w-3.5 h-3.5" /> {lender.phone}
              </a>
            </div>
          ))}
        </div>

        <div className="bg-[#f8f9fa] border border-[#e4e6eb] rounded-2xl p-5 text-center">
          <p className="text-[#65676b] text-sm mb-3">Are you a lender offering HELOC products?</p>
          <Link href="/dashboard/profile"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#1877F2] hover:bg-[#1665d8] text-white rounded-xl text-sm font-bold transition-colors">
            Join as a Lender
          </Link>
        </div>
      </div>
    </div>
  )
}
