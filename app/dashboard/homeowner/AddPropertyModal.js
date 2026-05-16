'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { X, Home, AlertCircle } from 'lucide-react'

export default function AddPropertyModal({ onClose, onAdded }) {
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [form, setForm] = useState({
    address: '', city: '', state: 'CA', zip: '',
    purchase_price: '', purchase_date: '', loan_balance: '', loan_rate: '', loan_type: 'Conventional',
    bedrooms: '', bathrooms: '', sqft: '', year_built: '',
  })

  const update = (f) => (e) => setForm(p => ({ ...p, [f]: e.target.value }))

  const inp = "w-full px-3 py-2.5 bg-[#0f1623] border border-[#344a57]/40 rounded-lg text-white placeholder-[#464d4f] focus:outline-none focus:border-[#c9a84c] transition-colors text-sm"
  const lbl = "block text-xs font-medium text-[#8fa1ad] mb-1.5 uppercase tracking-wider"

  const handleSubmit = async () => {
    setLoading(true)
    setError(null)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      const { error } = await supabase.from('properties').insert({
        owner_id: user.id,
        address: form.address,
        city: form.city,
        state: form.state,
        zip: form.zip,
        purchase_price: form.purchase_price ? parseFloat(form.purchase_price) : null,
        purchase_date: form.purchase_date || null,
        loan_balance: form.loan_balance ? parseFloat(form.loan_balance) : null,
        loan_rate: form.loan_rate ? parseFloat(form.loan_rate) : null,
        loan_type: form.loan_type,
        bedrooms: form.bedrooms ? parseInt(form.bedrooms) : null,
        bathrooms: form.bathrooms ? parseFloat(form.bathrooms) : null,
        sqft: form.sqft ? parseInt(form.sqft) : null,
        year_built: form.year_built ? parseInt(form.year_built) : null,
      })
      if (error) throw error
      onAdded()
    } catch (err) {
      setError(err.message)
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[#1a2332] border border-[#344a57]/30 rounded-2xl w-full max-w-lg shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[#344a57]/20">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#344a57] flex items-center justify-center">
              <Home className="w-4 h-4 text-[#c9a84c]" />
            </div>
            <div>
              <h2 className="text-white font-semibold">Add Property</h2>
              <p className="text-[#8fa1ad] text-xs">Step {step} of 2</p>
            </div>
          </div>
          <button onClick={onClose} className="text-[#8fa1ad] hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step indicator */}
        <div className="px-6 pt-4 flex gap-2">
          {[1, 2].map(s => (
            <div key={s} className={`h-1 flex-1 rounded-full transition-colors ${s <= step ? 'bg-[#c9a84c]' : 'bg-[#344a57]/40'}`} />
          ))}
        </div>

        <div className="p-6 space-y-4">
          {error && (
            <div className="flex items-center gap-2 bg-red-900/20 border border-red-500/30 text-red-400 rounded-lg p-3 text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />{error}
            </div>
          )}

          {step === 1 && (
            <>
              <div>
                <label className={lbl}>Street Address</label>
                <input value={form.address} onChange={update('address')} placeholder="123 Main St" className={inp} />
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
                  <input type="number" value={form.sqft} onChange={update('sqft')} placeholder="2100" className={inp} />
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
                  <input type="number" value={form.purchase_price} onChange={update('purchase_price')} placeholder="850000" className={inp} />
                </div>
                <div>
                  <label className={lbl}>Purchase Date</label>
                  <input type="date" value={form.purchase_date} onChange={update('purchase_date')} className={inp} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={lbl}>Loan Balance</label>
                  <input type="number" value={form.loan_balance} onChange={update('loan_balance')} placeholder="620000" className={inp} />
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
        <div className="flex items-center justify-between px-6 pb-6 pt-2 gap-3">
          <button onClick={step === 1 ? onClose : () => setStep(1)}
            className="flex-1 py-2.5 border border-[#344a57]/40 text-[#8fa1ad] hover:text-white rounded-xl text-sm transition-colors">
            {step === 1 ? 'Cancel' : 'Back'}
          </button>
          {step === 1 ? (
            <button onClick={() => setStep(2)} disabled={!form.address || !form.city || !form.zip}
              className="flex-1 py-2.5 bg-[#c9a84c] hover:bg-[#d4b560] text-[#0f1623] rounded-xl font-semibold text-sm transition-colors disabled:opacity-40">
              Next: Loan Details
            </button>
          ) : (
            <button onClick={handleSubmit} disabled={loading}
              className="flex-1 py-2.5 bg-[#c9a84c] hover:bg-[#d4b560] text-[#0f1623] rounded-xl font-semibold text-sm transition-colors disabled:opacity-40">
              {loading ? 'Saving...' : 'Save Property'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
