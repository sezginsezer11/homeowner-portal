'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { X, Home, AlertCircle, CheckCircle, Loader, Bed, Bath, Maximize, Calendar, DollarSign, ChevronDown } from 'lucide-react'
import AddressAutocomplete from '@/components/AddressAutocomplete'

function formatNum(val) {
  if (!val && val !== 0) return ''
  const num = val.toString().replace(/,/g, '')
  if (isNaN(num) || num === '') return val
  return Number(num).toLocaleString('en-US')
}
function parseNum(val) {
  if (!val) return null
  return parseFloat(val.toString().replace(/,/g, '')) || null
}

const PROP_TYPES = ['Single Family','Condo/Townhome','Townhome','Multi-Family','Land','Other']
const LOAN_TYPES = ['Conventional','FHA','VA','USDA','Jumbo','ARM']

export default function AddPropertyModal({ onClose, onAdded }) {
  const [step, setStep]           = useState(1)
  const [loading, setLoading]     = useState(false)
  const [fetching, setFetching]   = useState(false)
  const [error, setError]         = useState(null)
  const [prefilled, setPrefilled] = useState(false)

  const [form, setForm] = useState({
    address: '', city: '', state: 'CA', zip: '',
    property_type: 'Single Family',
    bedrooms: '', bathrooms: '', sqft: '', year_built: '',
    estimated_value: '',
    last_sale_price: '', last_sale_date: '',
    purchase_price: '', purchase_date: '',
    loan_balance: '', loan_rate: '', loan_type: 'Conventional',
  })

  const update = (f) => (e) => setForm(p => ({ ...p, [f]: e.target.value }))
  const updateNum = (f) => (e) => setForm(p => ({ ...p, [f]: e.target.value.replace(/,/g, '') }))

  const handleAddressSelect = async (suggestion) => {
    const updated = {
      ...form,
      address: suggestion.address || form.address,
      city:    suggestion.city    || form.city,
      state:   suggestion.state   || form.state,
      zip:     suggestion.zip     || form.zip,
    }
    setForm(updated)

    // Auto-fetch property details from Redfin
    if (suggestion.address && suggestion.city) {
      setFetching(true)
      setPrefilled(false)
      try {
        const q = new URLSearchParams({
          address: suggestion.address,
          city:    suggestion.city,
          state:   suggestion.state || 'CA',
          zip:     suggestion.zip   || '',
        })
        const res  = await fetch(`/api/property-details?${q}`)
        const data = await res.json()

        if (data.found) {
          setForm(p => ({
            ...p,
            property_type:  data.propertyType  || p.property_type,
            bedrooms:       data.beds           || p.bedrooms,
            bathrooms:      data.baths          || p.bathrooms,
            sqft:           data.sqft           || p.sqft,
            year_built:     data.yearBuilt      || p.year_built,
            last_sale_price: data.lastSalePrice || p.last_sale_price,
            last_sale_date:  data.lastSaleDate  || p.last_sale_date,
            estimated_value: data.estimatedValue || p.estimated_value,
          }))
          setPrefilled(true)
        }
      } catch {}
      finally { setFetching(false) }
    }
  }

  const inp = "w-full px-3 py-2.5 bg-white border border-[#e4e6eb] rounded-xl text-[#1a1a2e] placeholder-[#9ca3af] focus:outline-none focus:border-[#1877F2] focus:ring-2 focus:ring-[#1877F2]/20 transition-all text-sm"
  const lbl = "block text-xs font-semibold text-[#65676b] mb-1.5 uppercase tracking-wider"

  const handleSubmit = async () => {
    setLoading(true); setError(null)
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
      })
      if (error) throw error
      onAdded()
    } catch (err) { setError(err.message); setLoading(false) }
  }

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-cardHv border border-[#e4e6eb] max-h-[90vh] overflow-y-auto">

        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-[#e4e6eb] sticky top-0 bg-white z-10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#e7f0fd] flex items-center justify-center">
              <Home className="w-4 h-4 text-[#1877F2]" />
            </div>
            <div>
              <h2 className="text-[#1a1a2e] font-bold">Add Property</h2>
              <p className="text-[#65676b] text-xs">Step {step} of 2</p>
            </div>
          </div>
          <button onClick={onClose} className="text-[#65676b] hover:text-[#1a1a2e] p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress */}
        <div className="px-5 pt-4 flex gap-2">
          {[1,2].map(s => (
            <div key={s} className={`h-1.5 flex-1 rounded-full transition-colors ${s <= step ? 'bg-[#1877F2]' : 'bg-[#e4e6eb]'}`} />
          ))}
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
                <AddressAutocomplete
                  value={form.address}
                  onChange={handleAddressSelect}
                  placeholder="Start typing your address..."
                />
                {fetching && (
                  <div className="flex items-center gap-2 mt-2 text-xs text-[#1877F2]">
                    <Loader className="w-3.5 h-3.5 animate-spin" />
                    Looking up property details...
                  </div>
                )}
                {prefilled && !fetching && (
                  <div className="flex items-center gap-2 mt-2 text-xs text-green-600 bg-green-50 px-3 py-2 rounded-lg border border-green-200">
                    <CheckCircle className="w-3.5 h-3.5 flex-shrink-0" />
                    Property details auto-filled from Redfin! Review and edit below.
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={lbl}>City</label>
                  <input value={form.city} onChange={update('city')} placeholder="San Diego" className={inp} />
                </div>
                <div>
                  <label className={lbl}>ZIP</label>
                  <input value={form.zip} onChange={update('zip')} placeholder="92130" className={inp} />
                </div>
              </div>

              <div>
                <label className={lbl}>Property Type</label>
                <div className="relative">
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9ca3af] pointer-events-none" />
                  <select value={form.property_type} onChange={update('property_type')}
                    className={`${inp} appearance-none cursor-pointer pr-8`}>
                    {PROP_TYPES.map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className={lbl}>Beds</label>
                  <div className="relative">
                    <Bed className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#9ca3af]" />
                    <input type="number" value={form.bedrooms} onChange={update('bedrooms')} placeholder="4" className={`${inp} pl-8`} />
                  </div>
                </div>
                <div>
                  <label className={lbl}>Baths</label>
                  <div className="relative">
                    <Bath className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#9ca3af]" />
                    <input type="number" step="0.5" value={form.bathrooms} onChange={update('bathrooms')} placeholder="2.5" className={`${inp} pl-8`} />
                  </div>
                </div>
                <div>
                  <label className={lbl}>Sq Ft</label>
                  <div className="relative">
                    <Maximize className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#9ca3af]" />
                    <input value={form.sqft ? formatNum(form.sqft) : ''} onChange={updateNum('sqft')} placeholder="2,100" className={`${inp} pl-8`} />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={lbl}>Year Built</label>
                  <input type="number" value={form.year_built} onChange={update('year_built')} placeholder="2005" className={inp} />
                </div>
                <div>
                  <label className={lbl}>Redfin Estimate</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9ca3af] text-sm">$</span>
                    <input value={form.estimated_value ? formatNum(form.estimated_value) : ''} readOnly
                      placeholder="Auto-filled" className={`${inp} pl-7 bg-[#f8f9fa] cursor-not-allowed`} />
                  </div>
                </div>
              </div>

              {/* Last sale info from Redfin */}
              {(form.last_sale_price || form.last_sale_date) && (
                <div className="bg-[#f8f9fa] border border-[#e4e6eb] rounded-xl p-4">
                  <div className="text-xs font-semibold text-[#65676b] uppercase tracking-wider mb-2">Last Sale (from Redfin)</div>
                  <div className="grid grid-cols-2 gap-3">
                    {form.last_sale_price && (
                      <div>
                        <div className="text-[#9ca3af] text-[10px]">Sale Price</div>
                        <div className="text-[#1a1a2e] font-bold text-sm">${Number(form.last_sale_price).toLocaleString()}</div>
                      </div>
                    )}
                    {form.last_sale_date && (
                      <div>
                        <div className="text-[#9ca3af] text-[10px]">Sale Date</div>
                        <div className="text-[#1a1a2e] font-bold text-sm">{form.last_sale_date}</div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}

          {step === 2 && (
            <>
              <div className="bg-[#e7f0fd] border border-[#1877F2]/20 rounded-xl p-4 mb-1">
                <p className="text-[#1877F2] text-xs font-semibold">
                  Now tell us about your current loan. This stays private and is used to calculate your equity.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={lbl}>Purchase Price</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9ca3af] text-sm">$</span>
                    <input value={form.purchase_price ? formatNum(form.purchase_price) : ''}
                      onChange={updateNum('purchase_price')}
                      placeholder={form.last_sale_price ? formatNum(form.last_sale_price) : '850,000'}
                      className={`${inp} pl-7`} />
                  </div>
                  {form.last_sale_price && !form.purchase_price && (
                    <button onClick={() => setForm(p => ({ ...p, purchase_price: p.last_sale_price }))}
                      className="text-[#1877F2] text-[10px] mt-1 hover:underline">
                      Use last sale price (${Number(form.last_sale_price).toLocaleString()})
                    </button>
                  )}
                </div>
                <div>
                  <label className={lbl}>Purchase Date</label>
                  <input type="date" value={form.purchase_date} onChange={update('purchase_date')}
                    placeholder={form.last_sale_date || ''}
                    className={inp} />
                  {form.last_sale_date && !form.purchase_date && (
                    <button onClick={() => setForm(p => ({ ...p, purchase_date: '' }))}
                      className="text-[#9ca3af] text-[10px] mt-1">
                      Last sold: {form.last_sale_date}
                    </button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={lbl}>Current Loan Balance</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9ca3af] text-sm">$</span>
                    <input value={form.loan_balance ? formatNum(form.loan_balance) : ''}
                      onChange={updateNum('loan_balance')} placeholder="620,000" className={`${inp} pl-7`} />
                  </div>
                </div>
                <div>
                  <label className={lbl}>Your Interest Rate %</label>
                  <input type="number" step="0.001" value={form.loan_rate} onChange={update('loan_rate')} placeholder="3.250" className={inp} />
                </div>
              </div>

              <div>
                <label className={lbl}>Loan Type</label>
                <div className="relative">
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9ca3af] pointer-events-none" />
                  <select value={form.loan_type} onChange={update('loan_type')}
                    className={`${inp} appearance-none cursor-pointer pr-8`}>
                    {LOAN_TYPES.map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-5 pb-5 pt-1 sticky bottom-0 bg-white border-t border-[#e4e6eb] pt-4">
          <button onClick={step === 1 ? onClose : () => setStep(1)}
            className="flex-1 py-3 border border-[#e4e6eb] text-[#65676b] hover:bg-[#f0f2f5] rounded-xl text-sm font-semibold transition-colors">
            {step === 1 ? 'Cancel' : 'Back'}
          </button>
          {step === 1 ? (
            <button onClick={() => setStep(2)} disabled={!form.address || !form.city || !form.zip || fetching}
              className="flex-1 py-3 bg-[#1877F2] hover:bg-[#1665d8] text-white rounded-xl font-semibold text-sm transition-colors disabled:opacity-40 shadow-sm">
              {fetching ? 'Loading details...' : 'Next: Loan Details'}
            </button>
          ) : (
            <button onClick={handleSubmit} disabled={loading}
              className="flex-1 py-3 bg-[#1877F2] hover:bg-[#1665d8] text-white rounded-xl font-semibold text-sm transition-colors disabled:opacity-40 shadow-sm">
              {loading ? 'Saving...' : 'Save Property'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
