'use client'
import { useState } from 'react'
import { Percent, ShoppingCart, Star, Phone, Filter, TrendingDown, Clock, Building2, AlertCircle } from 'lucide-react'

const LOAN_PROGRAMS = [
  { id: 'all',      label: 'All Programs' },
  { id: 'fixed',    label: '30yr Fixed' },
  { id: '15yr',     label: '15yr Fixed' },
  { id: '20yr',     label: '20yr Fixed' },
  { id: '10yr',     label: '10yr Fixed' },
  { id: 'arm',      label: '5/7yr ARM' },
  { id: 'jumbo',    label: 'Jumbo' },
  { id: 'fha',      label: 'FHA' },
  { id: 'va',       label: 'VA' },
  { id: 'hardmoney', label: 'Hard Money' },
]

const RATE_ADJUSTMENTS = {
  '30yr_fixed':  0, '20yr_fixed': -0.25, '15yr_fixed': -0.75,
  '10yr_fixed': -1.0, 'fha': 0.25, 'va': -0.5, 'jumbo': 0.25,
  'arm_5_1': -1.25, 'arm_7_1': -0.875, 'hardmoney': 3.5,
}

const ALL_RATES = [
  { id: '30yr_fixed',  label: '30-Year Fixed',     term: '30 yr', type: 'fixed',    desc: 'Most popular — stable payment for life of loan', programs: ['all','fixed'] },
  { id: '20yr_fixed',  label: '20-Year Fixed',     term: '20 yr', type: 'fixed',    desc: 'Pay off faster with lower interest cost', programs: ['all','20yr'] },
  { id: '15yr_fixed',  label: '15-Year Fixed',     term: '15 yr', type: 'fixed',    desc: 'Build equity fast — lowest total interest cost', programs: ['all','15yr'] },
  { id: '10yr_fixed',  label: '10-Year Fixed',     term: '10 yr', type: 'fixed',    desc: 'Aggressive payoff — highest monthly payment', programs: ['all','10yr'] },
  { id: 'arm_5_1',     label: '5/1 ARM',           term: '5+1 yr', type: 'arm',    desc: 'Fixed 5 years then adjusts annually', programs: ['all','arm'] },
  { id: 'arm_7_1',     label: '7/1 ARM',           term: '7+1 yr', type: 'arm',    desc: 'Fixed 7 years then adjusts annually', programs: ['all','arm'] },
  { id: 'fha',         label: 'FHA 30-Year',       term: '30 yr', type: 'fha',     desc: '3.5% min down — requires mortgage insurance', programs: ['all','fha'] },
  { id: 'va',          label: 'VA 30-Year',        term: '30 yr', type: 'va',      desc: 'No down payment required for veterans', programs: ['all','va'] },
  { id: 'jumbo',       label: 'Jumbo 30-Year',     term: '30 yr', type: 'jumbo',   desc: 'Loans above conforming limits ($766,550)', programs: ['all','jumbo'] },
  { id: 'hardmoney',   label: 'Hard Money',        term: '1-3 yr', type: 'hardmoney', desc: 'Asset-based, short-term — interest only', programs: ['all','hardmoney'] },
]

// Sample lenders — will connect to real lenders portal later
const SAMPLE_LENDERS = [
  { name: 'Pacific Coast Lending', specialty: 'Conventional & Jumbo', stars: 4.8, phone: '(858) 555-0101', programs: ['fixed','20yr','15yr','10yr','jumbo'], minDown: '5%', closingTime: '21 days' },
  { name: 'SoCal Mortgage Group',  specialty: 'FHA & VA Specialists', stars: 4.7, phone: '(858) 555-0102', programs: ['fha','va','fixed'], minDown: '0-3.5%', closingTime: '30 days' },
  { name: 'Carmel Valley Funding', specialty: 'Jumbo & ARM Experts',  stars: 4.9, phone: '(858) 555-0103', programs: ['jumbo','arm','fixed'], minDown: '10%', closingTime: '18 days' },
  { name: 'Del Mar Capital',       specialty: 'Hard Money & Bridge',  stars: 4.6, phone: '(858) 555-0104', programs: ['hardmoney','arm'], minDown: '30%', closingTime: '7 days' },
]

function fmt(n) { return '$' + Math.round(n).toLocaleString('en-US') }

function calcPayment(loanAmt, annualRate, months) {
  const r = annualRate / 100 / 12
  if (r === 0) return loanAmt / months
  return loanAmt * r * Math.pow(1+r,months) / (Math.pow(1+r,months)-1)
}

export default function ShopRatesClient({ currentRate }) {
  const [filter, setFilter] = useState('all')
  const [loanAmt, setLoanAmt] = useState(750000)

  const filteredRates = ALL_RATES.filter(r => r.programs.includes(filter))

  const TYPE_COLORS = {
    fixed:     'bg-blue-50 border-blue-200 text-blue-700',
    arm:       'bg-purple-50 border-purple-200 text-purple-700',
    fha:       'bg-green-50 border-green-200 text-green-700',
    va:        'bg-red-50 border-red-200 text-red-700',
    jumbo:     'bg-orange-50 border-orange-200 text-orange-700',
    hardmoney: 'bg-yellow-50 border-yellow-200 text-yellow-700',
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-20">
      <div>
        <h1 className="text-2xl font-bold text-[#1a1a2e] flex items-center gap-2">
          <Percent className="w-6 h-6 text-[#1877F2]" /> Shop Mortgage Rates
        </h1>
        <p className="text-[#65676b] text-sm mt-0.5">Compare loan programs and find the right rate for you</p>
      </div>

      {/* Current rate banner */}
      <div className="bg-gradient-to-r from-[#1877F2] to-[#1665d8] rounded-2xl p-5 flex items-center justify-between">
        <div>
          <div className="text-white/70 text-xs uppercase tracking-wider mb-1">Freddie Mac — 30yr Fixed National Average</div>
          <div className="text-white text-4xl font-bold">{currentRate}%</div>
          <div className="text-white/60 text-xs mt-1">Updated weekly · All rates below based on this index</div>
        </div>
        <TrendingDown className="w-12 h-12 text-white/20" />
      </div>

      {/* Loan amount input */}
      <div className="bg-white rounded-2xl border border-[#e4e6eb] shadow-card p-5">
        <label className="block text-xs font-semibold text-[#65676b] mb-2 uppercase tracking-wider">Loan Amount (for payment estimates)</label>
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9ca3af]">$</span>
            <input type="number" value={loanAmt} onChange={e => setLoanAmt(+e.target.value)}
              className="w-full pl-7 pr-4 py-2.5 bg-white border border-[#e4e6eb] rounded-xl text-[#1a1a2e] focus:outline-none focus:border-[#1877F2] text-sm" />
          </div>
          <input type="range" min="100000" max="5000000" step="50000" value={loanAmt}
            onChange={e => setLoanAmt(+e.target.value)} className="flex-1 accent-[#1877F2]" />
          <span className="text-[#1a1a2e] font-bold text-sm w-24">{fmt(loanAmt)}</span>
        </div>
      </div>

      {/* Program filter */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 lg:mx-0 lg:px-0">
        {LOAN_PROGRAMS.map(p => (
          <button key={p.id} onClick={() => setFilter(p.id)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border ${
              filter === p.id ? 'bg-[#1877F2] border-[#1877F2] text-white' : 'bg-white border-[#e4e6eb] text-[#65676b] hover:border-[#1877F2] hover:text-[#1877F2]'
            }`}>{p.label}</button>
        ))}
      </div>

      {/* Rate cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredRates.map(rate => {
          const r      = (currentRate + (RATE_ADJUSTMENTS[rate.id] || 0))
          const months = rate.id === 'arm_5_1' ? 360 : rate.id === 'arm_7_1' ? 360 : rate.id === '20yr_fixed' ? 240 : rate.id === '15yr_fixed' ? 180 : rate.id === '10yr_fixed' ? 120 : 360
          const payment = rate.id === 'hardmoney' ? loanAmt * r / 100 / 12 : calcPayment(loanAmt, r, months)
          const diff    = RATE_ADJUSTMENTS[rate.id] || 0
          const isHM    = rate.id === 'hardmoney'

          return (
            <div key={rate.id} className="bg-white rounded-2xl border border-[#e4e6eb] shadow-card p-5 hover:shadow-cardHv transition-all">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="text-[#1a1a2e] font-bold">{rate.label}</div>
                  <div className="text-[#65676b] text-xs mt-0.5">{rate.desc}</div>
                </div>
                <span className={`text-[9px] px-2 py-0.5 rounded-full border font-bold flex-shrink-0 ml-2 ${TYPE_COLORS[rate.type]}`}>
                  {rate.type.toUpperCase()}
                </span>
              </div>

              <div className="flex items-end gap-2 mb-3">
                <div className="text-3xl font-bold text-[#1877F2]">{r.toFixed(3)}%</div>
                <div className={`text-xs font-semibold mb-1 ${diff < 0 ? 'text-green-600' : diff > 0 ? 'text-red-500' : 'text-[#65676b]'}`}>
                  {diff === 0 ? 'Base rate' : diff > 0 ? `+${diff}%` : `${diff}%`}
                </div>
              </div>

              <div className="bg-[#f8f9fa] rounded-xl p-3 mb-3">
                <div className="text-[10px] text-[#65676b] uppercase tracking-wider mb-0.5">
                  {isHM ? 'Interest Only Payment' : 'Est. Monthly Payment'}
                </div>
                <div className="text-lg font-bold text-[#1a1a2e]">
                  {fmt(payment)}<span className="text-xs text-[#9ca3af] font-normal">/mo</span>
                </div>
                <div className="text-[10px] text-[#9ca3af]">on {fmt(loanAmt)} loan{isHM ? ' — interest only' : ''}</div>
              </div>

              <div className="flex items-center gap-1.5 text-[10px] text-[#65676b]">
                <Clock className="w-3 h-3" />
                <span>{rate.term} term</span>
                {isHM && <span className="ml-1 text-orange-600 font-semibold">· Short-term only</span>}
              </div>
            </div>
          )
        })}
      </div>

      {/* Lenders */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-[#1a1a2e] font-bold text-sm flex items-center gap-2">
            <Building2 className="w-4 h-4 text-[#1877F2]" /> Lenders
          </h2>
          <span className="text-[10px] bg-[#e7f0fd] text-[#1877F2] px-2 py-1 rounded-full font-semibold">Sample lenders — real lenders coming soon</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {SAMPLE_LENDERS.filter(l => filter === 'all' || l.programs.includes(filter)).map(lender => (
            <div key={lender.name} className="bg-white rounded-2xl border border-[#e4e6eb] shadow-card p-5">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="text-[#1a1a2e] font-bold">{lender.name}</div>
                  <div className="text-[#65676b] text-xs mt-0.5">{lender.specialty}</div>
                </div>
                <div className="flex items-center gap-1">
                  <Star className="w-3.5 h-3.5 text-[#c9a84c] fill-[#c9a84c]" />
                  <span className="text-xs font-bold">{lender.stars}</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 mb-3">
                <div className="bg-[#f8f9fa] rounded-xl p-2 text-center">
                  <div className="text-[9px] text-[#65676b]">Min Down</div>
                  <div className="text-sm font-bold text-[#1a1a2e]">{lender.minDown}</div>
                </div>
                <div className="bg-[#f8f9fa] rounded-xl p-2 text-center">
                  <div className="text-[9px] text-[#65676b]">Close Time</div>
                  <div className="text-sm font-bold text-[#1a1a2e]">{lender.closingTime}</div>
                </div>
              </div>
              <div className="flex flex-wrap gap-1 mb-3">
                {lender.programs.map(p => (
                  <span key={p} className="text-[9px] bg-[#e7f0fd] text-[#1877F2] px-2 py-0.5 rounded-full font-semibold uppercase">
                    {LOAN_PROGRAMS.find(lp => lp.id === p)?.label || p}
                  </span>
                ))}
              </div>
              <a href={`tel:${lender.phone}`}
                className="flex items-center justify-center gap-2 w-full py-2.5 bg-[#1877F2] hover:bg-[#1665d8] text-white rounded-xl text-xs font-bold transition-colors">
                <Phone className="w-3.5 h-3.5" /> {lender.phone}
              </a>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-[#f8f9fa] border border-[#e4e6eb] rounded-2xl p-4">
        <p className="text-[#9ca3af] text-xs flex items-start gap-2">
          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
          Rates shown are estimates based on Freddie Mac data. Actual rates vary by lender, credit score, loan amount, and property details. Contact a licensed lender for a personalized rate quote.
        </p>
      </div>
    </div>
  )
}
