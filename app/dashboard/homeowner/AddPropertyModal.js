'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { X, Home, AlertCircle, CheckCircle, Loader, ChevronDown, AlertTriangle } from 'lucide-react'
import AddressAutocomplete from '@/components/AddressAutocomplete'

// Historical 30yr fixed mortgage rates by year
const HIST_RATES = {
  2010:4.69,2011:4.45,2012:3.66,2013:3.98,2014:4.17,2015:3.85,
  2016:3.65,2017:3.99,2018:4.54,2019:3.94,2020:3.11,2021:2.96,
  2022:5.34,2023:6.81,2024:6.72,2025:6.84,2026:6.87
}
function getHistoricalRate(dateStr) {
  if (!dateStr) return null
  const year = new Date(dateStr).getFullYear()
  return HIST_RATES[year] || HIST_RATES[2026]
}

function fmtNum(val) {
  if (!val && val !== 0) return ''
  const num = val.toString().replace(/,/g,'')
  if (isNaN(num) || num === '') return val
  return Number(num).toLocaleString('en-US')
}
function parseNum(val) { return val ? parseFloat(val.toString().replace(/,/g,'')) || null : null }

const LOAN_TYPES = ['Conventional','FHA','VA','USDA','Jumbo','ARM']

export default function AddPropertyModal({ onClose, onAdded }) {
  const [step, setStep]           = useState(1)
  const [loading, setLoading]     = useState(false)
  const [fetching, setFetching]   = useState(false)
  const [error, setError]         = useState(null)
  const [prefilled, setPrefilled] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [incomplete, setIncomplete]   = useState([])

  const [form, setForm] = useState({
    address:'', city:'', state:'CA', zip:'',
    property_type:'Single Family',
    bedrooms:'', bathrooms:'', sqft:'', year_built:'',
    estimated_value:'',
    last_sale_price:'', last_sale_date:'',
    purchase_price:'', purchase_date:'',
    loan_balance:'', loan_rate:'', loan_type:'Conventional',
  })

  const update = (f) => (e) => setForm(p => ({...p, [f]: e.target.value}))
  const updateNum = (f) => (e) => setForm(p => ({...p, [f]: e.target.value.replace(/,/g,'')}))

  const homeValue = parseNum(form.estimated_value) || parseNum(form.purchase_price) || 0
  const LTV_OPTIONS = [70,75,80,85,90,95].map(pct => ({
    pct, amount: homeValue ? Math.round(homeValue * pct / 100) : null
  }))

  const handleAddressSelect = async (suggestion) => {
    const updated = {
      ...form,
      address: suggestion.address || form.address,
      city:    suggestion.city    || form.city,
      state:   suggestion.state   || form.state,
      zip:     suggestion.zip     || form.zip,
    }
    setForm(updated)

    if (suggestion.address && suggestion.city) {
      setFetching(true); setPrefilled(false)
      try {
        const q = new URLSearchParams({ address: suggestion.address, city: suggestion.city, state: suggestion.state||'CA', zip: suggestion.zip||'' })
        const res  = await fetch(`/api/property-details?${q}`)
        const data = await res.json()
        if (data.found) {
          setForm(p => ({
            ...p,
            property_type:   data.propertyType  || p.property_type,
            bedrooms:        data.beds           || p.bedrooms,
            bathrooms:       data.baths          || p.bathrooms,
            sqft:            data.sqft           || p.sqft,
            year_built:      data.yearBuilt      || p.year_built,
            last_sale_price: data.lastSalePrice  || p.last_sale_price,
            last_sale_date:  data.lastSaleDate   || p.last_sale_date,
            estimated_value: data.estimatedValue || p.estimated_value,
            // Pre-fill purchase info from last sale
            purchase_price:  data.lastSalePrice ? data.lastSalePrice.toString() : p.purchase_price,
            purchase_date:   data.lastSaleDate   || p.purchase_date,
          }))
          setPrefilled(true)
        }
      } catch {}
      finally { setFetching(false) }
    }
  }

  // When purchase date changes, suggest historical rate
  const handlePurchaseDateChange = (e) => {
    const date = e.target.value
    setForm(p => ({
      ...p,
      purchase_date: date,
      loan_rate: p.loan_rate || getHistoricalRate(date)?.toString() || '',
    }))
  }

  const handleNextStep = () => {
    // Auto-fill loan rate if purchase date set and no rate yet
    if (form.purchase_date && !form.loan_rate) {
      const rate = getHistoricalRate(form.purchase_date)
      if (rate) setForm(p => ({...p, loan_rate: rate.toString()}))
    }
    setStep(2)
  }

  const handleCheckIncomplete = () => {
    const missing = []
    if (!form.purchase_price) missing.push('Purchase Price')
    if (!form.purchase_date)  missing.push('Purchase Date')
    if (!form.loan_balance)   missing.push('Loan Balance')
    if (!form.loan_rate)      missing.push('Interest Rate')

    if (missing.length > 0) {
      setIncomplete(missing)
      setShowConfirm(true)
    } else {
      handleSubmit()
    }
  }

  const handleSubmit = async (completeNow = true) => {
    setLoading(true); setError(null); setShowConfirm(false)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      const { error } = await supabase.from('properties').insert({
        owner_id:       user.id,
        address:        form.address,
        city:           form.city,
        state:          form.state,
        zip:            form.zip,
        loan_type:      form.property_type,
        bedrooms:       form.bedrooms  ? parseInt(form.bedrooms)  : null,
        bathrooms:      form.bathrooms ? parseFloat(form.bathrooms) : null,
        sqft:           parseNum(form.sqft),
        year_built:     form.year_built ? parseInt(form.year_built) : null,
        purchase_price: parseNum(form.purchase_price) || parseNum(form.last_sale_price) || null,
        purchase_date:  form.purchase_date || form.last_sale_date || null,
        loan_balance:   parseNum(form.loan_balance),
        loan_rate:      form.loan_rate ? parseFloat(form.loan_rate) : null,
        // Flag incomplete properties
        avm_value:      parseNum(form.estimated_value) || null,
      })
      if (error) throw error
      onAdded()
    } catch (err) { setError(err.message); setLoading(false) }
  }

  const inp = "w-full px-3 py-2.5 bg-white border border-[#e4e6eb] rounded-xl text-[#1a1a2e] placeholder-[#9ca3af] focus:outline-none focus:border-[#1877F2] focus:ring-2 focus:ring-[#1877F2]/20 transition-all text-sm"
  const lbl = "block text-xs font-semibold text-[#65676b] mb-1.5 uppercase tracking-wider"
  const histRate = getHistoricalRate(form.purchase_date)

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-cardHv border border-[#e4e6eb] max-h-[90vh] overflow-y-auto">

        {/* Confirm incomplete modal */}
        {showConfirm && (
          <div className="absolute inset-0 bg-white rounded-2xl z-20 flex flex-col p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-5 h-5 text-orange-500" />
              </div>
              <div>
                <h3 className="text-[#1a1a2e] font-bold">Missing Information</h3>
                <p className="text-[#65676b] text-xs mt-0.5">This affects your equity calculations</p>
              </div>
            </div>
            <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 mb-4">
              <p className="text-orange-700 text-sm font-semibold mb-2">The following fields are incomplete:</p>
              {incomplete.map(f => (
                <div key={f} className="flex items-center gap-2 text-orange-600 text-sm">
                  <span className="w-1.5 h-1.5 rounded-full bg-orange-500 flex-shrink-0" />
                  {f}
                </div>
              ))}
            </div>
            <p className="text-[#65676b] text-sm mb-5">Would you like to go back and complete them now, or save and complete later?</p>
            <div className="space-y-2 mt-auto">
              <button onClick={() => setShowConfirm(false)}
                className="w-full py-3 bg-[#1877F2] hover:bg-[#1665d8] text-white rounded-xl font-semibold text-sm transition-colors">
                Go Back & Complete Now
              </button>
              <button onClick={() => handleSubmit(false)}
                className="w-full py-3 border-2 border-orange-300 text-orange-600 hover:bg-orange-50 rounded-xl font-semibold text-sm transition-colors flex items-center justify-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                Save & Complete Later
              </button>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-[#e4e6eb] sticky top-0 bg-white z-10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#e7f0fd] flex items-center justify-center flex-shrink-0">
              <Home className="w-4 h-4 text-[#1877F2]" />
            </div>
            <div>
              <h2 className="text-[#1a1a2e] font-bold">Add Property</h2>
              <p className="text-[#65676b] text-xs">Step {step} of 2</p>
            </div>
          </div>
          <button onClick={onClose} className="text-[#65676b] hover:text-[#1a1a2e] p-1"><X className="w-5 h-5" /></button>
        </div>

        {/* Progress */}
        <div className="px-5 pt-4 flex gap-2">
          {[1,2].map(s => <div key={s} className={`h-1.5 flex-1 rounded-full transition-colors ${s<=step?'bg-[#1877F2]':'bg-[#e4e6eb]'}`} />)}
        </div>

        <div className="p-5 space-y-4">
          {error && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 rounded-xl p-3 text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />{error}
            </div>
          )}

          {step === 1 && (
            <>
              <div>
                <label className={lbl}>Street Address</label>
                <AddressAutocomplete value={form.address} onChange={handleAddressSelect} placeholder="Start typing your address..." />
                {fetching && (
                  <div className="flex items-center gap-2 mt-2 text-xs text-[#1877F2]">
                    <Loader className="w-3.5 h-3.5 animate-spin" /> Looking up property details...
                  </div>
                )}
                {prefilled && !fetching && (
                  <div className="flex items-center gap-2 mt-2 text-xs text-green-600 bg-green-50 px-3 py-2 rounded-lg border border-green-200">
                    <CheckCircle className="w-3.5 h-3.5 flex-shrink-0" /> Property details auto-filled from Redfin!
                  </div>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className={lbl}>City</label><input value={form.city} onChange={update('city')} placeholder="San Diego" className={inp} /></div>
                <div><label className={lbl}>ZIP</label><input value={form.zip} onChange={update('zip')} placeholder="92130" className={inp} /></div>
              </div>
              <div>
                <label className={lbl}>Property Type</label>
                <div className="relative">
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9ca3af] pointer-events-none" />
                  <select value={form.property_type} onChange={update('property_type')} className={`${inp} appearance-none pr-8`}>
                    {['Single Family','Condo/Townhome','Townhome','Multi-Family','Land','Other'].map(t=><option key={t}>{t}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div><label className={lbl}>Beds</label><input type="number" value={form.bedrooms} onChange={update('bedrooms')} placeholder="4" className={inp} /></div>
                <div><label className={lbl}>Baths</label><input type="number" step="0.5" value={form.bathrooms} onChange={update('bathrooms')} placeholder="2.5" className={inp} /></div>
                <div><label className={lbl}>Sq Ft</label><input value={form.sqft?fmtNum(form.sqft):''} onChange={updateNum('sqft')} placeholder="2,100" className={inp} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className={lbl}>Year Built</label><input type="number" value={form.year_built} onChange={update('year_built')} placeholder="2005" className={inp} /></div>
                <div>
                  <label className={lbl}>Redfin Estimate</label>
                  <div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9ca3af] text-sm">$</span>
                    <input value={form.estimated_value?fmtNum(form.estimated_value):''} readOnly placeholder="Auto-filled" className={`${inp} pl-7 bg-[#f8f9fa]`} />
                  </div>
                </div>
              </div>
              {(form.last_sale_price || form.last_sale_date) && (
                <div className="bg-[#f8f9fa] border border-[#e4e6eb] rounded-xl p-4">
                  <div className="text-xs font-semibold text-[#65676b] uppercase tracking-wider mb-2">Last Sale (from Redfin)</div>
                  <div className="grid grid-cols-2 gap-3">
                    {form.last_sale_price && <div><div className="text-[#9ca3af] text-[10px]">Sale Price</div><div className="text-[#1a1a2e] font-bold text-sm">${Number(form.last_sale_price).toLocaleString()}</div></div>}
                    {form.last_sale_date && <div><div className="text-[#9ca3af] text-[10px]">Sale Date</div><div className="text-[#1a1a2e] font-bold text-sm">{form.last_sale_date}</div></div>}
                  </div>
                </div>
              )}
            </>
          )}

          {step === 2 && (
            <>
              <div className="bg-[#e7f0fd] border border-[#1877F2]/20 rounded-xl p-4">
                <p className="text-[#1877F2] text-xs font-semibold">Now tell us about your current loan. This stays private and is used to calculate your equity.</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={lbl}>Purchase Price</label>
                  <div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9ca3af] text-sm">$</span>
                    <input value={form.purchase_price?fmtNum(form.purchase_price):''}
                      onChange={updateNum('purchase_price')}
                      placeholder={form.last_sale_price?fmtNum(form.last_sale_price):'850,000'}
                      className={`${inp} pl-7`} />
                  </div>
                  {form.last_sale_price && !form.purchase_price && (
                    <button onClick={() => setForm(p=>({...p,purchase_price:p.last_sale_price}))}
                      className="text-[#1877F2] text-[10px] mt-1 hover:underline font-semibold">
                      Use last sale: ${Number(form.last_sale_price).toLocaleString()}
                    </button>
                  )}
                </div>
                <div>
                  <label className={lbl}>Purchase Date</label>
                  <input type="date" value={form.purchase_date} onChange={handlePurchaseDateChange} className={inp} />
                  {form.last_sale_date && !form.purchase_date && (
                    <button onClick={() => { setForm(p=>({...p,purchase_date:p.last_sale_date})); handlePurchaseDateChange({target:{value:form.last_sale_date}}) }}
                      className="text-[#1877F2] text-[10px] mt-1 hover:underline font-semibold">
                      Use last sale date: {form.last_sale_date}
                    </button>
                  )}
                </div>
              </div>

              {/* Loan Balance with LTV shortcuts */}
              <div>
                <label className={lbl}>
                  Current Loan Balance
                  {homeValue>0 && <span className="ml-1 text-[#9ca3af] normal-case font-normal">· Based on {fmtNum(homeValue)} value</span>}
                </label>
                {homeValue > 0 && (
                  <div className="flex gap-1.5 mb-2 flex-wrap">
                    {LTV_OPTIONS.map(opt=>(
                      <button key={opt.pct} type="button"
                        onClick={()=>setForm(p=>({...p,loan_balance:opt.amount?.toString()||''}))}
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all border ${
                          Math.round(parseNum(form.loan_balance)||0)===opt.amount
                            ?'bg-[#1877F2] text-white border-[#1877F2]'
                            :'bg-[#f0f2f5] text-[#65676b] border-[#e4e6eb] hover:border-[#1877F2] hover:text-[#1877F2]'
                        }`}>
                        {opt.pct}% LTV {opt.amount?`· $${(opt.amount/1000).toFixed(0)}K`:''}
                      </button>
                    ))}
                  </div>
                )}
                <div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9ca3af] text-sm">$</span>
                  <input value={form.loan_balance?fmtNum(form.loan_balance):''} onChange={updateNum('loan_balance')} placeholder="620,000" className={`${inp} pl-7`} />
                </div>
              </div>

              {/* Interest Rate with historical suggestion */}
              <div>
                <label className={lbl}>Your Interest Rate %</label>
                {histRate && !form.loan_rate && form.purchase_date && (
                  <div className="flex items-center gap-2 mb-2 bg-[#f8f9fa] rounded-lg px-3 py-2 text-xs">
                    <span className="text-[#65676b]">Based on {new Date(form.purchase_date).getFullYear()} avg:</span>
                    <span className="font-bold text-[#1877F2]">{histRate}%</span>
                    <button onClick={()=>setForm(p=>({...p,loan_rate:histRate.toString()}))} className="text-[#1877F2] hover:underline font-semibold ml-auto">Use this</button>
                  </div>
                )}
                {form.purchase_date && form.loan_rate && parseFloat(form.loan_rate)===histRate && (
                  <div className="flex items-center gap-1.5 mb-2 text-xs text-[#65676b]">
                    <CheckCircle className="w-3.5 h-3.5 text-green-500" />
                    Using {new Date(form.purchase_date).getFullYear()} historical avg ({histRate}%) — edit if different
                  </div>
                )}
                <input type="number" step="0.001" value={form.loan_rate} onChange={update('loan_rate')} placeholder={histRate?.toString()||'3.250'} className={inp} />
              </div>

              <div>
                <label className={lbl}>Loan Type</label>
                <div className="relative">
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9ca3af] pointer-events-none" />
                  <select value={form.loan_type} onChange={update('loan_type')} className={`${inp} appearance-none pr-8`}>
                    {LOAN_TYPES.map(t=><option key={t}>{t}</option>)}
                  </select>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-5 pb-5 pt-1 sticky bottom-0 bg-white border-t border-[#e4e6eb] pt-4">
          <button onClick={step===1?onClose:()=>setStep(1)}
            className="flex-1 py-3 border border-[#e4e6eb] text-[#65676b] hover:bg-[#f0f2f5] rounded-xl text-sm font-semibold transition-colors">
            {step===1?'Cancel':'Back'}
          </button>
          {step===1?(
            <button onClick={handleNextStep} disabled={!form.address||!form.city||!form.zip||fetching}
              className="flex-1 py-3 bg-[#1877F2] hover:bg-[#1665d8] text-white rounded-xl font-semibold text-sm transition-colors disabled:opacity-40 shadow-sm">
              {fetching?'Loading...':'Next: Loan Details'}
            </button>
          ):(
            <button onClick={handleCheckIncomplete} disabled={loading}
              className="flex-1 py-3 bg-[#1877F2] hover:bg-[#1665d8] text-white rounded-xl font-semibold text-sm transition-colors disabled:opacity-40 shadow-sm">
              {loading?'Saving...':'Save Property'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
