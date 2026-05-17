'use client'
import { useState, useEffect } from 'react'
import { Calculator, TrendingDown, Percent, GitCompare, ShoppingCart, Info, ChevronDown, ArrowUpRight } from 'lucide-react'
import Link from 'next/link'

const LOAN_ADJ = { '30yr_fixed':0,'20yr_fixed':-0.25,'15yr_fixed':-0.75,'10yr_fixed':-1.0,'fha_30yr':0.25,'va_30yr':-0.5,'jumbo_30yr':0.25,'arm_5_1':-1.25,'arm_7_1':-0.875,'arm_10_1':-0.5 }
const LOAN_LABELS = { '30yr_fixed':'30-Year Fixed','20yr_fixed':'20-Year Fixed','15yr_fixed':'15-Year Fixed','10yr_fixed':'10-Year Fixed','fha_30yr':'FHA 30-Year','va_30yr':'VA 30-Year','jumbo_30yr':'Jumbo 30-Year','arm_5_1':'5/1 ARM','arm_7_1':'7/1 ARM','arm_10_1':'10/1 ARM' }
const LOAN_TERMS = { '30yr_fixed':360,'20yr_fixed':240,'15yr_fixed':180,'10yr_fixed':120,'fha_30yr':360,'va_30yr':360,'jumbo_30yr':360,'arm_5_1':360,'arm_7_1':360,'arm_10_1':360 }
function fmt(n) { return '$' + Math.round(n).toLocaleString('en-US') }
function calcMonthly(p,r,m) { if(!p||!r||!m)return 0;const mr=r/100/12;return p*(mr*Math.pow(1+mr,m))/(Math.pow(1+mr,m)-1) }
function amortize(p,r,m) {
  const mr=r/100/12,pmt=calcMonthly(p,r,m);let bal=p,ti=0;
  const schedule=[];
  for(let i=1;i<=m;i++){const ip=bal*mr,pp=pmt-ip;bal=Math.max(0,bal-pp);ti+=ip;if(i%12===0||i===1||i===m)schedule.push({month:i,year:Math.ceil(i/12),payment:pmt,principal:pp,interest:ip,balance:bal,totalInterest:ti})}
  return{schedule,totalInterest:ti,totalPaid:pmt*m}
}

const TABS = [
  { id:'calculator', label:'Calculator',  icon:Calculator },
  { id:'refi',       label:'Refi Savings', icon:TrendingDown },
  { id:'rates',      label:'Live Rates',   icon:Percent },
  { id:'scenario',   label:'Compare Scenarios', icon:GitCompare },
]



export default function MortgageClient({ currentRate, properties }) {
  const [tab, setTab] = useState('calculator')

  // Calculator state
  const [homePrice, setHomePrice]       = useState(800000)
  const [downPct, setDownPct]           = useState(20)
  const [loanType, setLoanType]         = useState('30yr_fixed')
  const [propertyTax, setPropertyTax]   = useState(1.25)
  const [insurance, setInsurance]       = useState(1200)
  const [hoa, setHoa]                   = useState(0)
  const [extraPayment, setExtraPayment] = useState(0)
  const [showAmort, setShowAmort]       = useState(false)

  // Refi state
  const [selectedProp, setSelectedProp] = useState(properties[0] || null)
  const [newLoanType, setNewLoanType]   = useState('15yr_fixed')
  const [closingCosts, setClosingCosts] = useState(5000)
  const [cashOut, setCashOut]           = useState(0)

  const downPayment   = homePrice * (downPct / 100)
  const loanAmount    = homePrice - downPayment
  const rate          = currentRate + (LOAN_ADJ[loanType] || 0)
  const months        = LOAN_TERMS[loanType] || 360
  const monthlyPI     = calcMonthly(loanAmount, rate, months)
  const monthlyTax    = (homePrice * propertyTax / 100) / 12
  const monthlyIns    = insurance / 12
  const monthlyPMI    = downPct < 20 ? (loanAmount * 0.85 / 100) / 12 : 0
  const totalMonthly  = monthlyPI + monthlyTax + monthlyIns + monthlyPMI + (hoa || 0)
  const { schedule, totalInterest, totalPaid } = amortize(loanAmount, rate, months)

  // Extra payment savings
  let extraMonths = months, extraSavings = 0, monthsSaved = 0
  if (extraPayment > 0) {
    let bal = loanAmount, m = 0, r = rate / 100 / 12
    while (bal > 0 && m < months * 2) { bal = bal * (1 + r) - (monthlyPI + extraPayment); m++ }
    extraMonths = m; monthsSaved = months - m
    extraSavings = totalInterest - amortize(loanAmount, rate, m).totalInterest
  }

  // Refi
  const currentLoanBal  = selectedProp?.loan_balance || 0
  const currentLoanRate = selectedProp?.loan_rate || currentRate
  const newRate         = currentRate + (LOAN_ADJ[newLoanType] || 0)
  const newMonths       = LOAN_TERMS[newLoanType] || 360
  const newLoanBalance  = currentLoanBal + cashOut
  const currentPayment  = calcMonthly(currentLoanBal, currentLoanRate, 360)
  const newPayment      = calcMonthly(newLoanBalance, newRate, newMonths)
  const monthlySavings  = currentPayment - newPayment
  const breakEven       = monthlySavings > 0 ? Math.ceil(closingCosts / monthlySavings) : null
  const lifetimeSavings = monthlySavings > 0 ? (monthlySavings * newMonths) - closingCosts : (newPayment * newMonths) - (currentPayment * 360)

  const inp = "w-full px-3 py-2.5 bg-white border border-[#e4e6eb] rounded-xl text-[#1a1a2e] placeholder-[#9ca3af] focus:outline-none focus:border-[#1877F2] focus:ring-2 focus:ring-[#1877F2]/20 transition-all text-sm"
  const lbl = "block text-xs font-semibold text-[#65676b] mb-1.5 uppercase tracking-wider"

  return (
    <div className="max-w-5xl mx-auto space-y-5 pb-20">
      <div>
        <h1 className="text-2xl font-bold text-[#1a1a2e] flex items-center gap-2">
          <Calculator className="w-6 h-6 text-[#1877F2]" /> Mortgage Center
        </h1>
        <p className="text-[#65676b] text-sm mt-0.5">Calculate payments, compare loans, and analyze refinancing</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-white border border-[#e4e6eb] rounded-2xl p-1 shadow-card overflow-x-auto">
        {TABS.map(t => {
          const Icon = t.icon
          return (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex-shrink-0 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-semibold transition-all ${
                tab === t.id ? 'bg-[#1877F2] text-white shadow-sm' : 'text-[#65676b] hover:text-[#1a1a2e] hover:bg-[#f0f2f5]'
              }`}>
              <Icon className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="hidden sm:inline">{t.label}</span>
            </button>
          )
        })}
      </div>

      {/* CALCULATOR TAB */}
      {tab === 'calculator' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-white rounded-2xl border border-[#e4e6eb] shadow-card p-5 space-y-4">
              <h2 className="text-[#1a1a2e] font-bold text-sm">Loan Details</h2>
              <div>
                <label className={lbl}>Home Price</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9ca3af] text-sm">$</span>
                  <input type="number" value={homePrice} onChange={e => setHomePrice(+e.target.value)} className={`${inp} pl-7`} />
                </div>
                <input type="range" min="100000" max="5000000" step="10000" value={homePrice} onChange={e => setHomePrice(+e.target.value)} className="w-full mt-2 accent-[#1877F2]" />
              </div>
              <div>
                <label className={lbl}>Down Payment — {downPct}% ({fmt(downPayment)})</label>
                <div className="flex gap-2 mb-2 flex-wrap">
                  {[5,10,15,20,25,30].map(p => (
                    <button key={p} onClick={() => setDownPct(p)}
                      className={`flex-1 min-w-0 py-1.5 rounded-lg text-xs font-bold transition-all ${downPct===p?'bg-[#1877F2] text-white':'bg-[#f0f2f5] text-[#65676b] hover:bg-[#e7f0fd] hover:text-[#1877F2]'}`}>{p}%</button>
                  ))}
                </div>
                <input type="range" min="3" max="50" step="1" value={downPct} onChange={e => setDownPct(+e.target.value)} className="w-full accent-[#1877F2]" />
              </div>
              <div>
                <label className={lbl}>Loan Type</label>
                <div className="relative">
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9ca3af] pointer-events-none" />
                  <select value={loanType} onChange={e => setLoanType(e.target.value)} className={`${inp} appearance-none cursor-pointer pr-8`}>
                    {Object.entries(LOAN_LABELS).map(([k,v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
                <div className="flex items-center justify-between mt-1.5">
                  <span className="text-[#9ca3af] text-xs">Rate for this loan</span>
                  <span className="text-[#1877F2] font-bold text-sm">{rate.toFixed(3)}%</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={lbl}>Property Tax %</label>
                  <input type="number" step="0.01" value={propertyTax} onChange={e => setPropertyTax(+e.target.value)} className={inp} />
                </div>
                <div>
                  <label className={lbl}>Insurance/yr</label>
                  <div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9ca3af] text-sm">$</span>
                    <input type="number" value={insurance} onChange={e => setInsurance(+e.target.value)} className={`${inp} pl-7`} />
                  </div>
                </div>
                <div>
                  <label className={lbl}>HOA/mo</label>
                  <div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9ca3af] text-sm">$</span>
                    <input type="number" value={hoa} onChange={e => setHoa(+e.target.value)} className={`${inp} pl-7`} />
                  </div>
                </div>
                <div>
                  <label className={lbl}>Extra Payment/mo</label>
                  <div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9ca3af] text-sm">$</span>
                    <input type="number" value={extraPayment} onChange={e => setExtraPayment(+e.target.value)} className={`${inp} pl-7`} />
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="bg-gradient-to-br from-[#1877F2] to-[#1665d8] rounded-2xl p-5 text-center">
                <div className="text-white/70 text-xs uppercase tracking-wider mb-1">Total Monthly Payment</div>
                <div className="text-5xl font-bold text-white">{fmt(totalMonthly)}</div>
                <div className="text-white/60 text-xs mt-1">per month</div>
                <div className="space-y-2 mt-4 pt-4 border-t border-white/20">
                  {[
                    { label:'Principal & Interest', value:monthlyPI,  color:'bg-white' },
                    { label:'Property Tax',          value:monthlyTax, color:'bg-yellow-300' },
                    { label:'Home Insurance',         value:monthlyIns, color:'bg-green-300' },
                    ...(monthlyPMI>0?[{label:'PMI',value:monthlyPMI,color:'bg-red-300'}]:[]),
                    ...(hoa>0?[{label:'HOA',value:hoa,color:'bg-purple-300'}]:[]),
                  ].map(item => (
                    <div key={item.label} className="flex items-center justify-between">
                      <div className="flex items-center gap-2"><div className={`w-2.5 h-2.5 rounded-full ${item.color}`} /><span className="text-white/70 text-xs">{item.label}</span></div>
                      <span className="text-white text-xs font-bold">{fmt(item.value)}/mo</span>
                    </div>
                  ))}
                </div>
                <div className="flex rounded-full overflow-hidden h-1.5 mt-3">
                  <div className="bg-white" style={{width:`${(monthlyPI/totalMonthly)*100}%`}} />
                  <div className="bg-yellow-300" style={{width:`${(monthlyTax/totalMonthly)*100}%`}} />
                  <div className="bg-green-300" style={{width:`${(monthlyIns/totalMonthly)*100}%`}} />
                  {monthlyPMI>0 && <div className="bg-red-300" style={{width:`${(monthlyPMI/totalMonthly)*100}%`}} />}
                  {hoa>0 && <div className="bg-purple-300" style={{width:`${(hoa/totalMonthly)*100}%`}} />}
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-[#e4e6eb] shadow-card p-5">
                <h3 className="text-[#1a1a2e] font-bold text-sm mb-3">Loan Summary</h3>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    {label:'Loan Amount',  value:fmt(loanAmount)},
                    {label:'Down Payment', value:fmt(downPayment)},
                    {label:'Interest Rate',value:`${rate.toFixed(3)}%`},
                    {label:'Loan Term',    value:LOAN_LABELS[loanType]},
                    {label:'Total Interest',value:fmt(totalInterest)},
                    {label:'Total Cost',   value:fmt(totalPaid+downPayment)},
                  ].map(({label,value}) => (
                    <div key={label} className="bg-[#f8f9fa] rounded-xl p-3">
                      <div className="text-[#9ca3af] text-[10px] uppercase tracking-wider">{label}</div>
                      <div className="text-[#1a1a2e] font-bold text-sm mt-0.5">{value}</div>
                    </div>
                  ))}
                </div>
              </div>

              {extraPayment > 0 && (
                <div className="bg-green-50 border border-green-200 rounded-2xl p-4">
                  <h3 className="text-green-700 font-bold text-sm mb-2 flex items-center gap-2"><TrendingDown className="w-4 h-4" />Extra Payment Savings</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white rounded-xl p-3"><div className="text-[#9ca3af] text-[10px] uppercase">Interest Saved</div><div className="text-green-600 font-bold text-lg">{fmt(extraSavings)}</div></div>
                    <div className="bg-white rounded-xl p-3"><div className="text-[#9ca3af] text-[10px] uppercase">Time Saved</div><div className="text-green-600 font-bold text-lg">{Math.floor(monthsSaved/12)}y {monthsSaved%12}m</div></div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Amortization */}
          <div className="bg-white rounded-2xl border border-[#e4e6eb] shadow-card overflow-hidden">
            <button onClick={() => setShowAmort(!showAmort)} className="w-full flex items-center justify-between px-5 py-4 text-[#1a1a2e] font-bold text-sm hover:bg-[#f8f9fa] transition-colors">
              <span>Amortization Schedule</span>
              <ChevronDown className={`w-4 h-4 text-[#9ca3af] transition-transform ${showAmort?'rotate-180':''}`} />
            </button>
            {showAmort && (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead><tr className="border-t border-[#e4e6eb]">{['Year','Payment','Principal','Interest','Balance','Total Interest'].map(h=><th key={h} className="px-4 py-3 text-left text-[#9ca3af] uppercase tracking-wider font-semibold bg-[#f8f9fa] whitespace-nowrap">{h}</th>)}</tr></thead>
                  <tbody>{schedule.map((row,i)=>(
                    <tr key={i} className="border-t border-[#f0f2f5] hover:bg-[#f8f9fa]">
                      <td className="px-4 py-2.5 text-[#1a1a2e] font-bold">Yr {row.year}</td>
                      <td className="px-4 py-2.5 text-[#1a1a2e]">{fmt(row.payment)}</td>
                      <td className="px-4 py-2.5 text-green-600">{fmt(row.principal)}</td>
                      <td className="px-4 py-2.5 text-red-500">{fmt(row.interest)}</td>
                      <td className="px-4 py-2.5 text-[#1a1a2e]">{fmt(row.balance)}</td>
                      <td className="px-4 py-2.5 text-[#65676b]">{fmt(row.totalInterest)}</td>
                    </tr>
                  ))}</tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* REFI TAB */}
      {tab === 'refi' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-white rounded-2xl border border-[#e4e6eb] shadow-card p-5 space-y-4">
              <h2 className="text-[#1a1a2e] font-bold text-sm">Refinance Details</h2>
              {properties.length > 0 && (
                <div>
                  <label className={lbl}>Your Property</label>
                  <div className="relative"><ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9ca3af] pointer-events-none" />
                    <select value={selectedProp?.id||''} onChange={e => setSelectedProp(properties.find(p=>p.id===e.target.value))} className={`${inp} appearance-none cursor-pointer pr-8`}>
                      {properties.map(p=><option key={p.id} value={p.id}>{p.address}</option>)}
                    </select>
                  </div>
                </div>
              )}
              <div className="bg-[#f8f9fa] rounded-xl p-4">
                <div className="text-xs font-bold text-[#65676b] uppercase tracking-wider mb-3">Current Loan</div>
                <div className="grid grid-cols-2 gap-3">
                  {[{l:'Balance',v:fmt(currentLoanBal)},{l:'Rate',v:`${currentLoanRate}%`},{l:'Monthly P&I',v:fmt(currentPayment)},{l:'Type',v:selectedProp?.loan_type||'—'}].map(({l,v})=>(
                    <div key={l}><div className="text-[#9ca3af] text-[10px]">{l}</div><div className="text-[#1a1a2e] font-bold text-sm">{v}</div></div>
                  ))}
                </div>
              </div>
              <div>
                <label className={lbl}>New Loan Type</label>
                <div className="relative"><ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9ca3af] pointer-events-none" />
                  <select value={newLoanType} onChange={e => setNewLoanType(e.target.value)} className={`${inp} appearance-none cursor-pointer pr-8`}>
                    {Object.entries(LOAN_LABELS).map(([k,v])=><option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
                <div className="flex items-center justify-between mt-1.5">
                  <span className="text-[#9ca3af] text-xs">New rate</span>
                  <span className="text-[#1877F2] font-bold text-sm">{newRate.toFixed(3)}%</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className={lbl}>Closing Costs</label><div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9ca3af] text-sm">$</span><input type="number" value={closingCosts} onChange={e=>setClosingCosts(+e.target.value)} className={`${inp} pl-7`}/></div></div>
                <div><label className={lbl}>Cash Out</label><div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9ca3af] text-sm">$</span><input type="number" value={cashOut} onChange={e=>setCashOut(+e.target.value)} className={`${inp} pl-7`}/></div></div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="bg-white rounded-2xl border border-[#e4e6eb] shadow-card p-5">
                <h3 className="text-[#1a1a2e] font-bold text-sm mb-4">Payment Comparison</h3>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div className="bg-[#f8f9fa] rounded-xl p-4 text-center"><div className="text-[#9ca3af] text-xs uppercase tracking-wider mb-1">Current</div><div className="text-2xl font-bold text-[#1a1a2e]">{fmt(currentPayment)}</div><div className="text-[#9ca3af] text-xs mt-1">{currentLoanRate}% rate</div></div>
                  <div className="bg-[#e7f0fd] border border-[#1877F2]/20 rounded-xl p-4 text-center"><div className="text-[#1877F2] text-xs uppercase tracking-wider mb-1">New</div><div className="text-2xl font-bold text-[#1a1a2e]">{fmt(newPayment)}</div><div className="text-[#9ca3af] text-xs mt-1">{newRate.toFixed(3)}% rate</div></div>
                </div>
                <div className={`rounded-xl p-4 text-center ${monthlySavings>0?'bg-green-50 border border-green-200':'bg-red-50 border border-red-200'}`}>
                  <div className="text-xs uppercase tracking-wider mb-1 text-[#65676b]">Monthly Difference</div>
                  <div className={`text-3xl font-bold ${monthlySavings>0?'text-green-600':'text-red-500'}`}>{monthlySavings>0?'+':''}{fmt(Math.abs(monthlySavings))}</div>
                  <div className="text-xs text-[#65676b] mt-1">{monthlySavings>0?'saved per month':'more per month'}</div>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-[#e4e6eb] shadow-card p-5">
                <h3 className="text-[#1a1a2e] font-bold text-sm mb-3">Analysis</h3>
                <div className="space-y-3">
                  {[
                    {label:'Break-Even',value:breakEven?`${breakEven} months (${(breakEven/12).toFixed(1)} yrs)`:'N/A',color:breakEven&&breakEven<36?'text-green-600':'text-[#c9a84c]'},
                    {label:'Lifetime Savings',value:fmt(Math.abs(lifetimeSavings)),color:lifetimeSavings>0?'text-green-600':'text-red-500'},
                    {label:'New Balance',value:fmt(newLoanBalance),color:'text-[#1a1a2e]'},
                    {label:'Rate Diff',value:`${(currentLoanRate-newRate).toFixed(3)}%`,color:currentLoanRate>newRate?'text-green-600':'text-red-500'},
                  ].map(item=>(
                    <div key={item.label} className="flex items-center justify-between py-2 border-b border-[#f0f2f5] last:border-0">
                      <span className="text-[#65676b] text-xs">{item.label}</span>
                      <span className={`text-sm font-bold ${item.color}`}>{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className={`rounded-2xl p-4 border ${monthlySavings>0&&breakEven&&breakEven<36?'bg-green-50 border-green-200':monthlySavings>0?'bg-[#e7f0fd] border-[#1877F2]/20':'bg-red-50 border-red-200'}`}>
                <div className={`text-sm font-bold mb-1 ${monthlySavings>0&&breakEven&&breakEven<36?'text-green-600':monthlySavings>0?'text-[#1877F2]':'text-red-500'}`}>
                  {monthlySavings>0&&breakEven&&breakEven<36?'✅ Strong Refi Candidate':monthlySavings>0?'⚠️ Possible Opportunity':'❌ Not Beneficial'}
                </div>
                <p className="text-[#65676b] text-xs">
                  {monthlySavings>0&&breakEven&&breakEven<36?`Save ${fmt(monthlySavings)}/mo, break even in ${breakEven} months, lifetime savings: ${fmt(lifetimeSavings)}.`:monthlySavings>0?`Save ${fmt(monthlySavings)}/mo but break-even is ${breakEven} months. Consider how long you plan to stay.`:'The new rate is higher than your current rate — not recommended.'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* LIVE RATES TAB */}
      {tab === 'rates' && (
        <div className="space-y-4">
          <div className="bg-gradient-to-r from-[#1877F2] to-[#1665d8] rounded-2xl p-6 text-center">
            <div className="text-white/70 text-xs uppercase tracking-wider mb-2">30-Year Fixed — Freddie Mac National Average</div>
            <div className="text-6xl font-bold text-white">{currentRate}%</div>
            <div className="text-white/60 text-sm mt-2">Updated Weekly</div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {Object.entries(LOAN_LABELS).map(([key,label]) => {
              const r = (currentRate + (LOAN_ADJ[key]||0)).toFixed(3)
              const diff = LOAN_ADJ[key]||0
              const payment = calcMonthly(500000, +r, LOAN_TERMS[key]||360)
              return (
                <div key={key} className="bg-white rounded-2xl border border-[#e4e6eb] shadow-card p-4 hover:shadow-cardHv transition-all">
                  <div className="text-[#65676b] text-xs font-semibold mb-2">{label}</div>
                  <div className="text-2xl font-bold text-[#1877F2]">{r}%</div>
                  <div className={`text-xs mt-1 font-semibold ${diff<0?'text-green-600':diff>0?'text-red-500':'text-[#9ca3af]'}`}>
                    {diff===0?'Base rate':diff>0?`+${diff}% vs 30yr`:`${diff}% vs 30yr`}
                  </div>
                  <div className="text-[#9ca3af] text-xs mt-2">{fmt(payment)}/mo on $500K</div>
                </div>
              )
            })}
          </div>
          <Link href="/dashboard/homeowner/rates"
            className="flex items-center justify-center gap-2 w-full py-3 bg-[#1877F2] hover:bg-[#1665d8] text-white rounded-2xl font-bold text-sm transition-colors shadow-sm">
            <ShoppingCart className="w-4 h-4" /> Shop Rates — Find Lenders for These Programs
            <ArrowUpRight className="w-4 h-4" />
          </Link>
          <div className="bg-[#f8f9fa] border border-[#e4e6eb] rounded-xl p-3">
            <p className="text-[#9ca3af] text-xs flex items-start gap-2"><Info className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />Rates are estimates based on Freddie Mac data. Contact a licensed lender for personalized quotes.</p>
          </div>
        </div>
      )}

      {/* SCENARIO COMPARATOR TAB */}
      {tab === 'scenario' && (
        <div className="bg-white rounded-2xl border border-[#e4e6eb] shadow-card overflow-hidden" style={{height:'85vh'}}>
          <iframe
            src="/mortgage-scenario.html"
            className="w-full h-full border-0"
            title="Mortgage Scenario Comparator"
            sandbox="allow-scripts allow-same-origin"
          />
        </div>
      )}
    </div>
  )
}
