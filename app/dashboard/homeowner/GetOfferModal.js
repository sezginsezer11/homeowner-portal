'use client'
import { useState } from 'react'
import { X, DollarSign, Home, Clock, CheckCircle, AlertCircle, ChevronDown, Zap } from 'lucide-react'

const CONDITIONS = [
  { value:'excellent', label:'Excellent', desc:'Move-in ready, updated' },
  { value:'good',      label:'Good',      desc:'Minor repairs needed' },
  { value:'fair',      label:'Fair',      desc:'Some updates needed' },
  { value:'needs_work',label:'Needs Work',desc:'Significant repairs' },
]
const TIMELINES = [
  { value:'asap',        label:'ASAP',             desc:'Within 30 days' },
  { value:'1_3_months',  label:'1–3 Months',       desc:'Flexible timing' },
  { value:'3_6_months',  label:'3–6 Months',       desc:'Planning ahead' },
  { value:'6_plus',      label:'6+ Months',         desc:'No rush' },
  { value:'just_curious',label:'Just Curious',      desc:'Exploring options' },
]

function fmt(n) { return n ? '$' + Number(n).toLocaleString('en-US') : '' }
function parseNum(v) { return v ? parseFloat(v.toString().replace(/,/g,'')) || null : null }

export default function GetOfferModal({ property, onClose, onSubmitted }) {
  const [step, setStep]       = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState(null)
  const [form, setForm] = useState({
    address:          property?.address || '',
    city:             property?.city    || '',
    state:            property?.state   || 'CA',
    zip:              property?.zip     || '',
    asking_price:     property?.avm_value ? Math.round(property.avm_value).toString() : '',
    home_condition:   '',
    timeline:         '',
    cash_offers_only: false,
    notes:            '',
  })

  const update = (f) => (e) => setForm(p => ({
    ...p, [f]: e.target.type === 'checkbox' ? e.target.checked : e.target.value
  }))

  const canNext1 = form.home_condition && form.timeline
  const canSubmit = canNext1 && form.address

  const handleSubmit = async () => {
    setLoading(true); setError(null)
    try {
      const res = await fetch('/api/offers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          property_id:  property?.id || null,
          asking_price: parseNum(form.asking_price),
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setStep(3)
    } catch (err) { setError(err.message) }
    finally { setLoading(false) }
  }

  const inp = "w-full px-3 py-2.5 bg-white border border-[#e4e6eb] rounded-xl text-[#1a1a2e] placeholder-[#9ca3af] focus:outline-none focus:border-[#1877F2] focus:ring-2 focus:ring-[#1877F2]/20 transition-all text-sm"

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl border border-[#e4e6eb] max-h-[90vh] overflow-y-auto">

        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-[#e4e6eb] sticky top-0 bg-white z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#1877F2] to-[#1665d8] flex items-center justify-center shadow-sm">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-[#1a1a2e] font-bold">Get an Offer</h2>
              <p className="text-[#65676b] text-xs">Connect with buyers & cash investors</p>
            </div>
          </div>
          <button onClick={onClose} className="text-[#65676b] hover:text-[#1a1a2e] p-1 rounded-lg hover:bg-[#f0f2f5] transition-all">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress */}
        {step < 3 && (
          <div className="px-5 pt-4 flex gap-2">
            {[1,2].map(s => <div key={s} className={`h-1.5 flex-1 rounded-full transition-all ${s<=step?'bg-[#1877F2]':'bg-[#e4e6eb]'}`}/>)}
          </div>
        )}

        <div className="p-5">
          {error && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 rounded-xl p-3 mb-4 text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0"/>{error}
            </div>
          )}

          {/* STEP 1 — Property & Condition */}
          {step === 1 && (
            <div className="space-y-5">
              <div>
                <h3 className="font-bold text-[#1a1a2e] mb-1">Tell us about your home</h3>
                <p className="text-[#65676b] text-sm">We'll match you with qualified buyers and cash investors.</p>
              </div>

              {/* Address (pre-filled if from property) */}
              {!property && (
                <div>
                  <label className="block text-xs font-semibold text-[#65676b] mb-1.5 uppercase tracking-wider">Property Address</label>
                  <input value={form.address} onChange={update('address')} placeholder="123 Main St" className={inp}/>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <input value={form.city} onChange={update('city')} placeholder="City" className={inp}/>
                    <input value={form.zip} onChange={update('zip')} placeholder="ZIP" className={inp}/>
                  </div>
                </div>
              )}

              {property && (
                <div className="bg-[#f8f9fa] border border-[#e4e6eb] rounded-xl p-3 flex items-center gap-3">
                  <Home className="w-5 h-5 text-[#1877F2] flex-shrink-0"/>
                  <div>
                    <div className="font-semibold text-[#1a1a2e] text-sm">{property.address}</div>
                    <div className="text-[#65676b] text-xs">{property.city}, {property.state} {property.zip}</div>
                  </div>
                </div>
              )}

              {/* Home Condition */}
              <div>
                <label className="block text-xs font-semibold text-[#65676b] mb-2 uppercase tracking-wider">Home Condition</label>
                <div className="grid grid-cols-2 gap-2">
                  {CONDITIONS.map(c => (
                    <button key={c.value} type="button" onClick={() => setForm(p=>({...p,home_condition:c.value}))}
                      className={`p-3 rounded-xl border-2 text-left transition-all ${
                        form.home_condition===c.value
                          ?'border-[#1877F2] bg-[#e7f0fd]'
                          :'border-[#e4e6eb] hover:border-[#1877F2]/40'
                      }`}>
                      <div className={`font-bold text-sm ${form.home_condition===c.value?'text-[#1877F2]':'text-[#1a1a2e]'}`}>{c.label}</div>
                      <div className="text-[#65676b] text-xs mt-0.5">{c.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Timeline */}
              <div>
                <label className="block text-xs font-semibold text-[#65676b] mb-2 uppercase tracking-wider">When do you want to sell?</label>
                <div className="space-y-2">
                  {TIMELINES.map(t => (
                    <button key={t.value} type="button" onClick={() => setForm(p=>({...p,timeline:t.value}))}
                      className={`w-full flex items-center justify-between p-3 rounded-xl border-2 transition-all text-left ${
                        form.timeline===t.value
                          ?'border-[#1877F2] bg-[#e7f0fd]'
                          :'border-[#e4e6eb] hover:border-[#1877F2]/40'
                      }`}>
                      <span className={`font-semibold text-sm ${form.timeline===t.value?'text-[#1877F2]':'text-[#1a1a2e]'}`}>{t.label}</span>
                      <span className="text-[#65676b] text-xs">{t.desc}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* STEP 2 — Price & Preferences */}
          {step === 2 && (
            <div className="space-y-5">
              <div>
                <h3 className="font-bold text-[#1a1a2e] mb-1">Price & Preferences</h3>
                <p className="text-[#65676b] text-sm">Optional details to help match you with the right buyers.</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#65676b] mb-1.5 uppercase tracking-wider">
                  Asking Price <span className="normal-case font-normal text-[#9ca3af]">(optional)</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9ca3af]">$</span>
                  <input value={form.asking_price ? Number(form.asking_price).toLocaleString('en-US') : ''}
                    onChange={e => setForm(p=>({...p,asking_price:e.target.value.replace(/,/g,'')}))}
                    placeholder={property?.avm_value ? Math.round(property.avm_value).toLocaleString('en-US') : '1,200,000'}
                    className={`${inp} pl-7`}/>
                </div>
                {property?.avm_value && (
                  <button onClick={() => setForm(p=>({...p,asking_price:Math.round(property.avm_value).toString()}))}
                    className="text-[#1877F2] text-xs mt-1 hover:underline font-semibold">
                    Use Redfin estimate: ${Math.round(property.avm_value).toLocaleString()}
                  </button>
                )}
              </div>

              {/* Cash buyers toggle */}
              <label className="flex items-start gap-3 p-4 bg-[#f8f9fa] rounded-xl border border-[#e4e6eb] cursor-pointer hover:border-[#1877F2]/40 transition-all">
                <div className="relative flex-shrink-0 mt-0.5">
                  <input type="checkbox" checked={form.cash_offers_only} onChange={update('cash_offers_only')} className="sr-only peer"/>
                  <div className="w-10 h-6 bg-[#e4e6eb] peer-checked:bg-[#1877F2] rounded-full transition-colors"/>
                  <div className="absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-transform peer-checked:translate-x-4"/>
                </div>
                <div>
                  <div className="font-bold text-[#1a1a2e] text-sm flex items-center gap-2">
                    Cash Offers Only
                    <span className="bg-[#e7f0fd] text-[#1877F2] text-[10px] font-bold px-2 py-0.5 rounded-full">Fast Close</span>
                  </div>
                  <div className="text-[#65676b] text-xs mt-0.5">Only show my listing to verified cash buyers. Close in as little as 7 days.</div>
                </div>
              </label>

              <div>
                <label className="block text-xs font-semibold text-[#65676b] mb-1.5 uppercase tracking-wider">
                  Additional Notes <span className="normal-case font-normal text-[#9ca3af]">(optional)</span>
                </label>
                <textarea value={form.notes} onChange={update('notes')} rows={3}
                  placeholder="Any special circumstances, upgrades, or things buyers should know..."
                  className="w-full px-3 py-2.5 bg-white border border-[#e4e6eb] rounded-xl text-[#1a1a2e] placeholder-[#9ca3af] focus:outline-none focus:border-[#1877F2] transition-all text-sm resize-none"/>
              </div>

              {/* Summary */}
              <div className="bg-[#f8f9fa] rounded-xl p-4 space-y-2 text-sm">
                <div className="font-bold text-[#1a1a2e] text-xs uppercase tracking-wider mb-3">Your Request Summary</div>
                {[
                  ['Property', property?.address || form.address],
                  ['Condition', CONDITIONS.find(c=>c.value===form.home_condition)?.label],
                  ['Timeline',  TIMELINES.find(t=>t.value===form.timeline)?.label],
                  ['Asking Price', form.asking_price ? '$'+Number(form.asking_price).toLocaleString() : 'Open to offers'],
                  ['Buyer Type', form.cash_offers_only ? 'Cash buyers only' : 'All qualified buyers'],
                ].map(([k,v]) => (
                  <div key={k} className="flex items-center justify-between">
                    <span className="text-[#65676b] text-xs">{k}</span>
                    <span className="font-semibold text-[#1a1a2e] text-xs">{v || '—'}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* STEP 3 — Success */}
          {step === 3 && (
            <div className="text-center py-6">
              <div className="w-16 h-16 bg-green-50 rounded-2xl flex items-center justify-center mx-auto mb-4 border-2 border-green-200">
                <CheckCircle className="w-8 h-8 text-green-500"/>
              </div>
              <h3 className="text-xl font-bold text-[#1a1a2e] mb-2">You're on the market!</h3>
              <p className="text-[#65676b] text-sm mb-6 max-w-sm mx-auto">
                Your offer request is live. Qualified buyers and agents on 360Everywhere will be notified. We'll reach out within 24 hours.
              </p>
              <div className="bg-[#e7f0fd] border border-[#1877F2]/20 rounded-xl p-4 text-left mb-6">
                <div className="text-[#1877F2] font-bold text-sm mb-2">What happens next?</div>
                <div className="space-y-1.5 text-xs text-[#65676b]">
                  <div className="flex items-start gap-2"><span className="text-[#1877F2] font-bold flex-shrink-0">1.</span>Qualified buyers and agents review your listing</div>
                  <div className="flex items-start gap-2"><span className="text-[#1877F2] font-bold flex-shrink-0">2.</span>You receive offers directly through the platform</div>
                  <div className="flex items-start gap-2"><span className="text-[#1877F2] font-bold flex-shrink-0">3.</span>Accept, counter, or decline — you're in control</div>
                </div>
              </div>
              <button onClick={() => { onSubmitted?.(); onClose() }}
                className="w-full py-3 bg-[#1877F2] hover:bg-[#1665d8] text-white font-bold rounded-xl text-sm transition-colors">
                Done
              </button>
            </div>
          )}
        </div>

        {/* Footer buttons */}
        {step < 3 && (
          <div className="flex gap-3 px-5 pb-5 border-t border-[#e4e6eb] pt-4">
            <button onClick={step===1?onClose:()=>setStep(1)}
              className="flex-1 py-3 border border-[#e4e6eb] text-[#65676b] hover:bg-[#f0f2f5] rounded-xl text-sm font-semibold transition-colors">
              {step===1?'Cancel':'Back'}
            </button>
            {step===1?(
              <button onClick={()=>setStep(2)} disabled={!canNext1}
                className="flex-1 py-3 bg-[#1877F2] hover:bg-[#1665d8] text-white rounded-xl font-bold text-sm transition-colors disabled:opacity-40">
                Next: Pricing →
              </button>
            ):(
              <button onClick={handleSubmit} disabled={loading||!canSubmit}
                className="flex-1 py-3 bg-[#1877F2] hover:bg-[#1665d8] text-white rounded-xl font-bold text-sm transition-colors disabled:opacity-40 flex items-center justify-center gap-2">
                <Zap className="w-4 h-4"/>
                {loading?'Submitting...':'Get Offers Now'}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
