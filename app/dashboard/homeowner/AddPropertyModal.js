'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { X, Home, AlertCircle } from 'lucide-react'
import AddressAutocomplete from '@/components/AddressAutocomplete'

function formatNumber(val) {
  if (!val) return ''
  const num = val.toString().replace(/,/g, '')
  if (isNaN(num)) return val
  return Number(num).toLocaleString('en-US')
}

function parseNumber(val) {
  return parseFloat(val.toString().replace(/,/g, '')) || ''
}

export default function AddPropertyModal({ onClose, onAdded }) {
  const [step, setStep]     = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError]   = useState(null)
  const [form, setForm] = useState({
    address: '', city: '', state: 'CA', zip: '',
    purchase_price: '', purchase_date: '', loan_balance: '',
    loan_rate: '', loan_type: 'Conventional',
    bedrooms: '', bathrooms: '', sqft: '', year_built: '',
  })

  const update = (f) => (e) => setForm(p => ({ ...p, [f]: e.target.value }))

  const handleAddressSelect = (suggestion) => {
    setForm(p => ({
      ...p,
      address: suggestion.address || p.address,
      city:    suggestion.city    || p.city,
      state:   suggestion.state   || p.state,
      zip:     suggestion.zip     || p.zip,
    }))
  }

  const handleNumberChange = (field) => (e) => {
    const raw = e.target.value.replace(/,/g, '')
    setForm(p => ({ ...p, [field]: raw }))
  }

  const inp = "w-full px-3 py-3 bg-white border border-[#e4e6eb] rounded-xl text-[#1a1a2e] placeholder-[#9ca3af] focus:outline-none focus:border-[#1877F2] focus:ring-2 focus:ring-[#1877F2]/20 transition-all text-sm"
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
        purchase_price: form.purchase_price ? parseFloat(form.purchase_price.toString().replace(/,/g,'')) : null,
        purchase_date:  form.purchase_date || null,
        loan_balance:   form.loan_balance  ? parseFloat(form.loan_balance.toString().replace(/,/g,''))  : null,
        loan_rate:      form.loan_rate     ? parseFloat(form.loan_rate)     : null,
        loan_type:      form.loan_type,
        bedrooms:       form.bedrooms      ? parseInt(form.bedrooms)      : null,
        bathrooms:      form.bathrooms     ? parseFloat(form.bathrooms)   : null,
        sqft:           form.sqft          ? parseInt(form.sqft.toString().replace(/,/g,'')) : null,
        year_built:     form.year_built    ? parseInt(form.year_built)    : null,
      })
      if (error) throw error
      onAdded()
    } catch (err) { setError(err.message); setLoading(false) }
  }

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-cardHv border border-[#e4e6eb]">

        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-[#e4e6eb]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#e7f0fd] flex items-center justify-center">
              <Home className="w-4 h-4 text-[#1877F2]" />
            </div>
            <div>
              <h2 className="text-[#1a1a2e] font-bold">Add Property</h2>
              <p className="text-[#65676b] text-xs">Step {step} of 2</p>
            </div>
          </div>
          <button onClick={onClose} className="text-[#65676b] hover:text-[#1a1a2e] transition-colors p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress */}
        <div className="px-5 pt-4 flex gap-2">
          {[1, 2].map(s => (
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
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className={lbl}>Beds</label>
                  <input type="number" value={form.bedrooms} onChange={update('bedrooms')} placeholder="4" className={inp} />
                </div>
                <div>
                  <label className={lbl}>Baths</label>
                  <input type="number" step="0.5" value={form.bathrooms} onChange={update('bathrooms')} placeholder="2.5" className={inp} />
                </div>
                <div>
                  <label className={lbl}>Sq Ft</label>
                  <input value={form.sqft ? formatNumber(form.sqft) : ''} onChange={handleNumberChange('sqft')} placeholder="2,100" className={inp} />
                </div>
              </div>
              <div>
                <label className={lbl}>Year Built</label>
                <input type="number" value={form.year_built} onChange={update('year_built')} placeholder="2005" className={inp} />
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={lbl}>Purchase Price</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9ca3af] text-sm">$</span>
                    <input value={form.purchase_price ? formatNumber(form.purchase_price) : ''}
                      onChange={handleNumberChange('purchase_price')} placeholder="850,000" className={`${inp} pl-7`} />
                  </div>
                </div>
                <div>
                  <label className={lbl}>Purchase Date</label>
                  <input type="date" value={form.purchase_date} onChange={update('purchase_date')} className={inp} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={lbl}>Loan Balance</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9ca3af] text-sm">$</span>
                    <input value={form.loan_balance ? formatNumber(form.loan_balance) : ''}
                      onChange={handleNumberChange('loan_balance')} placeholder="620,000" className={`${inp} pl-7`} />
                  </div>
                </div>
                <div>
                  <label className={lbl}>Your Loan Rate %</label>
                  <input type="number" step="0.001" value={form.loan_rate} onChange={update('loan_rate')} placeholder="3.250" className={inp} />
                </div>
              </div>
              <div>
                <label className={lbl}>Loan Type</label>
                <select value={form.loan_type} onChange={update('loan_type')} className={inp}>
                  {['Conventional','FHA','VA','USDA','Jumbo','ARM'].map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center gap-3 px-5 pb-5 pt-1">
          <button onClick={step === 1 ? onClose : () => setStep(1)}
            className="flex-1 py-3 border border-[#e4e6eb] text-[#65676b] hover:bg-[#f0f2f5] rounded-xl text-sm font-semibold transition-colors">
            {step === 1 ? 'Cancel' : 'Back'}
          </button>
          {step === 1 ? (
            <button onClick={() => setStep(2)} disabled={!form.address || !form.city || !form.zip}
              className="flex-1 py-3 bg-[#1877F2] hover:bg-[#1665d8] text-white rounded-xl font-semibold text-sm transition-colors disabled:opacity-40 shadow-sm">
              Next: Loan Details
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
