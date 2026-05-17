'use client'

import { useState, useEffect } from 'react'
import { Calculator, TrendingDown, DollarSign, Percent, Home, RefreshCw, ChevronDown, Info } from 'lucide-react'

// Loan type rates relative to 30yr fixed
const LOAN_ADJUSTMENTS = {
  '30yr_fixed':  0,
  '20yr_fixed': -0.25,
  '15yr_fixed': -0.75,
  '10yr_fixed': -1.0,
  'fha_30yr':    0.25,
  'va_30yr':    -0.5,
  'jumbo_30yr':  0.25,
  'arm_5_1':    -1.25,
  'arm_7_1':    -0.875,
  'arm_10_1':   -0.5,
}

const LOAN_LABELS = {
  '30yr_fixed':  '30-Year Fixed',
  '20yr_fixed':  '20-Year Fixed',
  '15yr_fixed':  '15-Year Fixed',
  '10yr_fixed':  '10-Year Fixed',
  'fha_30yr':    'FHA 30-Year',
  'va_30yr':     'VA 30-Year',
  'jumbo_30yr':  'Jumbo 30-Year',
  'arm_5_1':     '5/1 ARM',
  'arm_7_1':     '7/1 ARM',
  'arm_10_1':    '10/1 ARM',
}

const LOAN_TERMS = {
  '30yr_fixed': 360, '20yr_fixed': 240, '15yr_fixed': 180,
  '10yr_fixed': 120, 'fha_30yr': 360, 'va_30yr': 360,
  'jumbo_30yr': 360, 'arm_5_1': 360, 'arm_7_1': 360, 'arm_10_1': 360,
}

function fmt(n) { return '$' + Math.round(n).toLocaleString() }
function fmtD(n) { return '$' + n.toFixed(2) }

function calcMonthly(principal, annualRate, months) {
  if (!principal || !annualRate || !months) return 0
  const r = annualRate / 100 / 12
  if (r === 0) return principal / months
  return principal * r * Math.pow(1 + r, months) / (Math.pow(1 + r, months) - 1)
}

function amortize(principal, annualRate, months) {
  const r = annualRate / 100 / 12
  const payment = calcMonthly(principal, annualRate, months)
  let balance = principal
  const schedule = []
  let totalInterest = 0

  for (let i = 1; i <= months; i++) {
    const interestPaid = balance * r
    const principalPaid = payment - interestPaid
    balance = Math.max(0, balance - principalPaid)
    totalInterest += interestPaid
    if (i % 12 === 0 || i === 1 || i === months) {
      schedule.push({
        month: i,
        year: Math.ceil(i / 12),
        payment,
        principal: principalPaid,
        interest: interestPaid,
        balance,
        totalInterest,
      })
    }
  }
  return { schedule, totalInterest, totalPaid: payment * months }
}

export default function MortgageClient({ currentRate, properties }) {
  const [tab, setTab] = useState('calculator')

  // Calculator state
  const [homePrice, setHomePrice]       = useState(800000)
  const [downPct, setDownPct]           = useState(20)
  const [loanType, setLoanType]         = useState('30yr_fixed')
  const [propertyTax, setPropertyTax]   = useState(1.25)
  const [insurance, setInsurance]       = useState(1200)
  const [hoa, setHoa]                   = useState(0)
  const [pmi, setPmi]                   = useState(0.5)
  const [extraPayment, setExtraPayment] = useState(0)
  const [showAmort, setShowAmort]       = useState(false)

  // Refi state
  const [selectedProp, setSelectedProp] = useState(properties[0] || null)
  const [newLoanType, setNewLoanType]   = useState('30yr_fixed')
  const [closingCosts, setClosingCosts] = useState(5000)
  const [cashOut, setCashOut]           = useState(0)

  const downPayment  = homePrice * (downPct / 100)
  const loanAmount   = homePrice - downPayment
  const rate         = currentRate + (LOAN_ADJUSTMENTS[loanType] || 0)
  const months       = LOAN_TERMS[loanType] || 360
  const monthlyPI    = calcMonthly(loanAmount, rate, months)
  const monthlyTax   = (homePrice * propertyTax / 100) / 12
  const monthlyIns   = insurance / 12
  const monthlyPMI   = downPct < 20 ? (loanAmount * pmi / 100) / 12 : 0
  const totalMonthly = monthlyPI + monthlyTax + monthlyIns + monthlyPMI + (hoa || 0)

  const { schedule, totalInterest, totalPaid } = amortize(loanAmount, rate, months)

  // Extra payment savings
  const extraMonths  = extraPayment > 0 ? (() => {
    let bal = loanAmount, m = 0
    const r = rate / 100 / 12
    while (bal > 0 && m < months * 2) {
      bal = bal * (1 + r) - (monthlyPI + extraPayment)
      m++
    }
    return m
  })() : months

  const extraSavings = extraPayment > 0 ? totalInterest - amortize(loanAmount, rate, extraMonths).totalInterest : 0
  const monthsSaved  = months - extraMonths

  // Refi calculations
  const currentLoanBal  = selectedProp?.loan_balance || 0
  const currentLoanRate = selectedProp?.loan_rate || currentRate
  const newRate         = currentRate + (LOAN_ADJUSTMENTS[newLoanType] || 0)
  const newMonths       = LOAN_TERMS[newLoanType] || 360
  const newLoanBalance  = currentLoanBal + cashOut
  const currentPayment  = calcMonthly(currentLoanBal, currentLoanRate, 360)
  const newPayment      = calcMonthly(newLoanBalance, newRate, newMonths)
  const monthlySavings  = currentPayment - newPayment
  const breakEven       = monthlySavings > 0 ? Math.ceil(closingCosts / monthlySavings) : null
  const lifetimeSavings = monthlySavings > 0
    ? (monthlySavings * newMonths) - closingCosts
    : (newPayment * newMonths) - (currentPayment * 360)

  const inp = "w-full px-3 py-2.5 bg-[#0f1623] border border-[#344a57]/40 rounded-xl text-white focus:outline-none focus:border-[#c9a84c] transition-colors text-sm"
  const lbl = "block text-xs font-medium text-[#8fa1ad] mb-1.5 uppercase tracking-wider"

  const TABS = [
    { id: 'calculator', label: 'Mortgage Calculator', icon: Calculator },
    { id: 'refi',       label: 'Refi Savings',        icon: TrendingDown },
    { id: 'rates',      label: 'Live Rates',           icon: Percent },
  ]

  return (
    <div className="max-w-4xl mx-auto space-y-5 pb-20">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Calculator className="w-6 h-6 text-[#c9a84c]" /> Mortgage Center
        </h1>
        <p className="text-[#8fa1ad] text-sm mt-0.5">Calculate payments, compare loans, and analyze refinancing</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-[#1a2332] border border-[#344a57]/30 rounded-2xl p-1">
        {TABS.map(t => {
          const Icon = t.icon
          return (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl text-xs font-medium transition-all ${
                tab === t.id ? 'bg-[#344a57] text-white' : 'text-[#8fa1ad] hover:text-white'
              }`}>
              <Icon className={`w-3.5 h-3.5 flex-shrink-0 ${tab === t.id ? 'text-[#c9a84c]' : ''}`} />
              <span className="hidden sm:inline">{t.label}</span>
            </button>
          )
        })}
      </div>

      {/* MORTGAGE CALCULATOR TAB */}
      {tab === 'calculator' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

            {/* Inputs */}
            <div className="bg-[#1a2332] border border-[#344a57]/30 rounded-2xl p-5 space-y-4">
              <h2 className="text-white font-semibold text-sm">Loan Details</h2>

              <div>
                <label className={lbl}>Home Price</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8fa1ad] text-sm">$</span>
                  <input type="number" value={homePrice} onChange={e => setHomePrice(+e.target.value)}
                    className={`${inp} pl-7`} />
                </div>
                <input type="range" min="100000" max="5000000" step="10000" value={homePrice}
                  onChange={e => setHomePrice(+e.target.value)}
                  className="w-full mt-2 accent-[#c9a84c]" />
                <div className="flex justify-between text-[10px] text-[#464d4f] mt-0.5">
                  <span>$100K</span><span>$5M</span>
                </div>
              </div>

              <div>
                <label className={lbl}>Down Payment — {downPct}% ({fmt(downPayment)})</label>
                <div className="flex gap-2 mb-2">
                  {[5, 10, 15, 20, 25, 30].map(p => (
                    <button key={p} onClick={() => setDownPct(p)}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-all ${
                        downPct === p ? 'bg-[#c9a84c] text-[#0f1623]' : 'bg-[#0f1623] text-[#8fa1ad] hover:text-white'
                      }`}>{p}%</button>
                  ))}
                </div>
                <input type="range" min="3" max="50" step="1" value={downPct}
                  onChange={e => setDownPct(+e.target.value)}
                  className="w-full accent-[#c9a84c]" />
              </div>

              <div>
                <label className={lbl}>Loan Type</label>
                <div className="relative">
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8fa1ad] pointer-events-none" />
                  <select value={loanType} onChange={e => setLoanType(e.target.value)}
                    className={`${inp} appearance-none cursor-pointer pr-8`}>
                    {Object.entries(LOAN_LABELS).map(([k, v]) => (
                      <option key={k} value={k}>{v}</option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center justify-between mt-1.5">
                  <span className="text-[#8fa1ad] text-xs">Rate for this loan type</span>
                  <span className="text-[#c9a84c] font-bold text-sm">{rate.toFixed(3)}%</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={lbl}>Property Tax %</label>
                  <div className="relative">
                    <Percent className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#8fa1ad]" />
                    <input type="number" step="0.01" value={propertyTax} onChange={e => setPropertyTax(+e.target.value)}
                      className={`${inp} pl-9`} />
                  </div>
                </div>
                <div>
                  <label className={lbl}>Insurance/yr</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8fa1ad] text-sm">$</span>
                    <input type="number" value={insurance} onChange={e => setInsurance(+e.target.value)}
                      className={`${inp} pl-7`} />
                  </div>
                </div>
                <div>
                  <label className={lbl}>HOA/mo</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8fa1ad] text-sm">$</span>
                    <input type="number" value={hoa} onChange={e => setHoa(+e.target.value)}
                      className={`${inp} pl-7`} />
                  </div>
                </div>
                <div>
                  <label className={lbl}>Extra Payment/mo</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8fa1ad] text-sm">$</span>
                    <input type="number" value={extraPayment} onChange={e => setExtraPayment(+e.target.value)}
                      className={`${inp} pl-7`} />
                  </div>
                </div>
              </div>

              {downPct < 20 && (
                <div>
                  <label className={lbl}>PMI Rate %</label>
                  <input type="number" step="0.01" value={pmi} onChange={e => setPmi(+e.target.value)} className={inp} />
                  <p className="text-[#c9a84c] text-xs mt-1">PMI required — down payment under 20%</p>
                </div>
              )}
            </div>

            {/* Results */}
            <div className="space-y-3">

              {/* Monthly breakdown */}
              <div className="bg-gradient-to-br from-[#1a2332] to-[#1e2d3d] border border-[#c9a84c]/20 rounded-2xl p-5">
                <div className="text-center mb-4">
                  <div className="text-[#8fa1ad] text-xs uppercase tracking-wider mb-1">Total Monthly Payment</div>
                  <div className="text-5xl font-bold text-white">{fmt(totalMonthly)}</div>
                  <div className="text-[#8fa1ad] text-xs mt-1">per month</div>
                </div>

                <div className="space-y-2 pt-4 border-t border-[#344a57]/20">
                  {[
                    { label: 'Principal & Interest', value: monthlyPI,  color: 'bg-[#c9a84c]' },
                    { label: 'Property Tax',          value: monthlyTax, color: 'bg-blue-400' },
                    { label: 'Home Insurance',         value: monthlyIns, color: 'bg-green-400' },
                    ...(monthlyPMI > 0 ? [{ label: 'PMI', value: monthlyPMI, color: 'bg-red-400' }] : []),
                    ...(hoa > 0 ? [{ label: 'HOA', value: hoa, color: 'bg-purple-400' }] : []),
                  ].map(item => (
                    <div key={item.label} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`w-2.5 h-2.5 rounded-full ${item.color}`} />
                        <span className="text-[#8fa1ad] text-xs">{item.label}</span>
                      </div>
                      <span className="text-white text-xs font-medium">{fmt(item.value)}/mo</span>
                    </div>
                  ))}
                </div>

                {/* Visual bar */}
                <div className="flex rounded-full overflow-hidden h-2 mt-3">
                  <div className="bg-[#c9a84c]" style={{ width: `${(monthlyPI / totalMonthly) * 100}%` }} />
                  <div className="bg-blue-400" style={{ width: `${(monthlyTax / totalMonthly) * 100}%` }} />
                  <div className="bg-green-400" style={{ width: `${(monthlyIns / totalMonthly) * 100}%` }} />
                  {monthlyPMI > 0 && <div className="bg-red-400" style={{ width: `${(monthlyPMI / totalMonthly) * 100}%` }} />}
                  {hoa > 0 && <div className="bg-purple-400" style={{ width: `${(hoa / totalMonthly) * 100}%` }} />}
                </div>
              </div>

              {/* Loan summary */}
              <div className="bg-[#1a2332] border border-[#344a57]/30 rounded-2xl p-5">
                <h3 className="text-white font-semibold text-sm mb-3">Loan Summary</h3>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: 'Loan Amount',     value: fmt(loanAmount) },
                    { label: 'Down Payment',    value: fmt(downPayment) },
                    { label: 'Interest Rate',   value: `${rate.toFixed(3)}%` },
                    { label: 'Loan Term',       value: LOAN_LABELS[loanType] },
                    { label: 'Total Interest',  value: fmt(totalInterest) },
                    { label: 'Total Cost',      value: fmt(totalPaid + downPayment) },
                  ].map(({ label, value }) => (
                    <div key={label} className="bg-[#0f1623] rounded-xl p-3">
                      <div className="text-[#8fa1ad] text-[10px] uppercase tracking-wider">{label}</div>
                      <div className="text-white font-semibold text-sm mt-0.5">{value}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Extra payment savings */}
              {extraPayment > 0 && (
                <div className="bg-green-900/20 border border-green-500/20 rounded-2xl p-5">
                  <h3 className="text-green-400 font-semibold text-sm mb-3 flex items-center gap-2">
                    <TrendingDown className="w-4 h-4" /> Extra Payment Savings
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-[#0f1623] rounded-xl p-3">
                      <div className="text-[#8fa1ad] text-[10px] uppercase tracking-wider">Interest Saved</div>
                      <div className="text-green-400 font-bold text-lg mt-0.5">{fmt(extraSavings)}</div>
                    </div>
                    <div className="bg-[#0f1623] rounded-xl p-3">
                      <div className="text-[#8fa1ad] text-[10px] uppercase tracking-wider">Time Saved</div>
                      <div className="text-green-400 font-bold text-lg mt-0.5">
                        {Math.floor(monthsSaved / 12)}y {monthsSaved % 12}m
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Amortization Table */}
          <div className="bg-[#1a2332] border border-[#344a57]/30 rounded-2xl overflow-hidden">
            <button onClick={() => setShowAmort(!showAmort)}
              className="w-full flex items-center justify-between px-5 py-4 text-white font-semibold text-sm hover:bg-[#344a57]/10 transition-colors">
              <span>Amortization Schedule</span>
              <ChevronDown className={`w-4 h-4 text-[#8fa1ad] transition-transform ${showAmort ? 'rotate-180' : ''}`} />
            </button>

            {showAmort && (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-t border-[#344a57]/20">
                      {['Year', 'Payment', 'Principal', 'Interest', 'Balance', 'Total Interest'].map(h => (
                        <th key={h} className="px-4 py-3 text-left text-[#8fa1ad] uppercase tracking-wider font-medium whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {schedule.filter((_, i) => i % 1 === 0).map((row, i) => (
                      <tr key={i} className="border-t border-[#344a57]/10 hover:bg-[#344a57]/10">
                        <td className="px-4 py-2.5 text-white font-medium">Year {row.year}</td>
                        <td className="px-4 py-2.5 text-white">{fmt(row.payment)}</td>
                        <td className="px-4 py-2.5 text-green-400">{fmt(row.principal)}</td>
                        <td className="px-4 py-2.5 text-red-400">{fmt(row.interest)}</td>
                        <td className="px-4 py-2.5 text-white">{fmt(row.balance)}</td>
                        <td className="px-4 py-2.5 text-[#8fa1ad]">{fmt(row.totalInterest)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* REFI SAVINGS TAB */}
      {tab === 'refi' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

            {/* Refi inputs */}
            <div className="bg-[#1a2332] border border-[#344a57]/30 rounded-2xl p-5 space-y-4">
              <h2 className="text-white font-semibold text-sm">Refinance Details</h2>

              {/* Property selector */}
              {properties.length > 0 && (
                <div>
                  <label className={lbl}>Your Property</label>
                  <div className="relative">
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8fa1ad] pointer-events-none" />
                    <select value={selectedProp?.id || ''} onChange={e => setSelectedProp(properties.find(p => p.id === e.target.value))}
                      className={`${inp} appearance-none cursor-pointer pr-8`}>
                      {properties.map(p => <option key={p.id} value={p.id}>{p.address}</option>)}
                    </select>
                  </div>
                </div>
              )}

              {/* Current loan info */}
              <div className="bg-[#0f1623] rounded-xl p-4 space-y-2">
                <div className="text-xs font-medium text-[#8fa1ad] uppercase tracking-wider mb-2">Current Loan</div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="text-[#464d4f] text-[10px]">Balance</div>
                    <div className="text-white font-semibold text-sm">{fmt(currentLoanBal)}</div>
                  </div>
                  <div>
                    <div className="text-[#464d4f] text-[10px]">Rate</div>
                    <div className="text-white font-semibold text-sm">{currentLoanRate}%</div>
                  </div>
                  <div>
                    <div className="text-[#464d4f] text-[10px]">Monthly P&I</div>
                    <div className="text-white font-semibold text-sm">{fmt(currentPayment)}</div>
                  </div>
                  <div>
                    <div className="text-[#464d4f] text-[10px]">Loan Type</div>
                    <div className="text-white font-semibold text-sm">{selectedProp?.loan_type || '—'}</div>
                  </div>
                </div>
              </div>

              <div>
                <label className={lbl}>New Loan Type</label>
                <div className="relative">
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8fa1ad] pointer-events-none" />
                  <select value={newLoanType} onChange={e => setNewLoanType(e.target.value)}
                    className={`${inp} appearance-none cursor-pointer pr-8`}>
                    {Object.entries(LOAN_LABELS).map(([k, v]) => (
                      <option key={k} value={k}>{v}</option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center justify-between mt-1.5">
                  <span className="text-[#8fa1ad] text-xs">New rate</span>
                  <span className="text-[#c9a84c] font-bold text-sm">{newRate.toFixed(3)}%</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={lbl}>Closing Costs</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8fa1ad] text-sm">$</span>
                    <input type="number" value={closingCosts} onChange={e => setClosingCosts(+e.target.value)}
                      className={`${inp} pl-7`} />
                  </div>
                </div>
                <div>
                  <label className={lbl}>Cash Out</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8fa1ad] text-sm">$</span>
                    <input type="number" value={cashOut} onChange={e => setCashOut(+e.target.value)}
                      className={`${inp} pl-7`} />
                  </div>
                </div>
              </div>
            </div>

            {/* Refi results */}
            <div className="space-y-3">

              {/* Monthly comparison */}
              <div className="bg-[#1a2332] border border-[#344a57]/30 rounded-2xl p-5">
                <h3 className="text-white font-semibold text-sm mb-4">Payment Comparison</h3>
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="bg-[#0f1623] rounded-xl p-4 text-center">
                    <div className="text-[#8fa1ad] text-xs uppercase tracking-wider mb-1">Current</div>
                    <div className="text-2xl font-bold text-white">{fmt(currentPayment)}</div>
                    <div className="text-[#8fa1ad] text-xs mt-1">{currentLoanRate}% rate</div>
                  </div>
                  <div className="bg-[#0f1623] rounded-xl p-4 text-center border border-[#c9a84c]/20">
                    <div className="text-[#c9a84c] text-xs uppercase tracking-wider mb-1">New</div>
                    <div className="text-2xl font-bold text-white">{fmt(newPayment)}</div>
                    <div className="text-[#8fa1ad] text-xs mt-1">{newRate.toFixed(3)}% rate</div>
                  </div>
                </div>

                {/* Monthly savings */}
                <div className={`rounded-xl p-4 text-center ${monthlySavings > 0 ? 'bg-green-900/20 border border-green-500/20' : 'bg-red-900/20 border border-red-500/20'}`}>
                  <div className="text-xs uppercase tracking-wider mb-1 text-[#8fa1ad]">Monthly Difference</div>
                  <div className={`text-3xl font-bold ${monthlySavings > 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {monthlySavings > 0 ? '+' : ''}{fmt(Math.abs(monthlySavings))}
                  </div>
                  <div className="text-xs text-[#8fa1ad] mt-1">
                    {monthlySavings > 0 ? 'saved per month' : 'more per month'}
                  </div>
                </div>
              </div>

              {/* Key metrics */}
              <div className="bg-[#1a2332] border border-[#344a57]/30 rounded-2xl p-5">
                <h3 className="text-white font-semibold text-sm mb-3">Refinance Analysis</h3>
                <div className="space-y-3">
                  {[
                    {
                      label: 'Break-Even Point',
                      value: breakEven ? `${breakEven} months (${(breakEven / 12).toFixed(1)} years)` : 'N/A',
                      desc: 'How long until savings cover closing costs',
                      color: breakEven && breakEven < 36 ? 'text-green-400' : 'text-[#c9a84c]',
                    },
                    {
                      label: 'Lifetime Savings',
                      value: fmt(Math.abs(lifetimeSavings)),
                      desc: lifetimeSavings > 0 ? 'Total interest savings over loan life' : 'Additional cost over loan life',
                      color: lifetimeSavings > 0 ? 'text-green-400' : 'text-red-400',
                    },
                    {
                      label: 'New Loan Balance',
                      value: fmt(newLoanBalance),
                      desc: cashOut > 0 ? `Includes ${fmt(cashOut)} cash out` : 'Current balance rolled into new loan',
                      color: 'text-white',
                    },
                    {
                      label: 'Rate Difference',
                      value: `${(currentLoanRate - newRate).toFixed(3)}%`,
                      desc: currentLoanRate > newRate ? 'Lower than current rate' : 'Higher than current rate',
                      color: currentLoanRate > newRate ? 'text-green-400' : 'text-red-400',
                    },
                  ].map(item => (
                    <div key={item.label} className="flex items-start justify-between py-2.5 border-b border-[#344a57]/20 last:border-0">
                      <div>
                        <div className="text-white text-xs font-medium">{item.label}</div>
                        <div className="text-[#464d4f] text-[10px] mt-0.5">{item.desc}</div>
                      </div>
                      <div className={`text-sm font-bold flex-shrink-0 ml-4 ${item.color}`}>{item.value}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recommendation */}
              <div className={`rounded-2xl p-4 border ${
                monthlySavings > 0 && breakEven && breakEven < 36
                  ? 'bg-green-900/20 border-green-500/20'
                  : monthlySavings > 0
                  ? 'bg-[#c9a84c]/10 border-[#c9a84c]/20'
                  : 'bg-red-900/20 border-red-500/20'
              }`}>
                <div className={`text-sm font-semibold mb-1 ${
                  monthlySavings > 0 && breakEven && breakEven < 36 ? 'text-green-400' :
                  monthlySavings > 0 ? 'text-[#c9a84c]' : 'text-red-400'
                }`}>
                  {monthlySavings > 0 && breakEven && breakEven < 36
                    ? '✅ Strong Refinance Candidate'
                    : monthlySavings > 0
                    ? '⚠️ Possible Refinance Opportunity'
                    : '❌ Refinance May Not Be Beneficial'}
                </div>
                <p className="text-[#8fa1ad] text-xs">
                  {monthlySavings > 0 && breakEven && breakEven < 36
                    ? `You'd save ${fmt(monthlySavings)}/month and break even in ${breakEven} months. Over the loan life, you'd save ${fmt(lifetimeSavings)}.`
                    : monthlySavings > 0
                    ? `You'd save ${fmt(monthlySavings)}/month but the break-even period is ${breakEven} months. Consider how long you plan to stay.`
                    : `The new rate is higher than your current rate. Refinancing would increase your monthly payment.`}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* LIVE RATES TAB */}
      {tab === 'rates' && (
        <div className="space-y-4">
          <div className="bg-gradient-to-br from-[#1a2332] to-[#1e2d3d] border border-blue-500/20 rounded-2xl p-6 text-center">
            <div className="text-[#8fa1ad] text-xs uppercase tracking-wider mb-2">30-Year Fixed — Freddie Mac</div>
            <div className="text-6xl font-bold text-blue-400">{currentRate}%</div>
            <div className="text-[#8fa1ad] text-sm mt-2">National Average · Updated Weekly</div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {Object.entries(LOAN_LABELS).map(([key, label]) => {
              const r = (currentRate + LOAN_ADJUSTMENTS[key]).toFixed(3)
              const diff = LOAN_ADJUSTMENTS[key]
              return (
                <div key={key} className="bg-[#1a2332] border border-[#344a57]/30 rounded-2xl p-4">
                  <div className="text-[#8fa1ad] text-xs font-medium mb-2">{label}</div>
                  <div className="text-2xl font-bold text-white">{r}%</div>
                  <div className={`text-xs mt-1 ${diff < 0 ? 'text-green-400' : diff > 0 ? 'text-red-400' : 'text-[#8fa1ad]'}`}>
                    {diff === 0 ? 'Base rate' : diff > 0 ? `+${diff}% vs 30yr` : `${diff}% vs 30yr`}
                  </div>
                  <div className="text-[#464d4f] text-xs mt-2">
                    {fmt(calcMonthly(500000, +r, LOAN_TERMS[key]))}/mo on $500K
                  </div>
                </div>
              )
            })}
          </div>

          <div className="bg-[#1a2332] border border-[#344a57]/30 rounded-2xl p-4">
            <p className="text-[#464d4f] text-xs flex items-start gap-2">
              <Info className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
              Rates shown are estimates based on current Freddie Mac data. Actual rates vary by lender, credit score, and loan details. Contact a licensed lender for personalized rates.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
