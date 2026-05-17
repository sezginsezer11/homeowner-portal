'use client'
import { useState } from 'react'
import { X, Save, Trash2, AlertCircle, CheckCircle, DollarSign, Percent, Calendar, TrendingUp, AlertTriangle } from 'lucide-react'

function fmt(n) { return n ? '$' + Math.round(n).toLocaleString('en-US') : '' }
function parseNum(v) { return v ? parseFloat(v.toString().replace(/,/g,'')) || null : null }

export default function EditPropertyModal({ property, onClose, onSaved, onDeleted }) {
  const [form, setForm] = useState({
    purchase_price:  property.purchase_price  || '',
    purchase_date:   property.purchase_date   || '',
    loan_balance:    property.loan_balance     || '',
    loan_rate:       property.loan_rate        || '',
    loan_type:       property.loan_type        || 'Conventional',
    bedrooms:        property.bedrooms         || '',
    bathrooms:       property.bathrooms        || '',
    sqft:            property.sqft             || '',
    year_built:      property.year_built       || '',
  })
  const [saving, setSaving]   = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError]     = useState(null)
  const [saved, setSaved]     = useState(false)

  const homeValue = property.avm_value || 0
  const LTV_OPTIONS = [70,75,80,85,90,95].map(pct => ({
    pct,
    amount: homeValue ? Math.round(homeValue * pct / 100) : null
  }))

  const update = (f) => (e) => setForm(p => ({ ...p, [f]: e.target.value }))

  const handleSave = async () => {
    setSaving(true); setError(null)
    try {
      const res = await fetch('/api/property', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          property_id:    property.id,
          purchase_price: parseNum(form.purchase_price),
          purchase_date:  form.purchase_date || null,
          loan_balance:   parseNum(form.loan_balance),
          loan_rate:      form.loan_rate ? parseFloat(form.loan_rate) : null,
          loan_type:      form.loan_type,
          bedrooms:       form.bedrooms ? parseInt(form.bedrooms) : null,
          bathrooms:      form.bathrooms ? parseFloat(form.bathrooms) : null,
          sqft:           parseNum(form.sqft),
          year_built:     form.year_built ? parseInt(form.year_built) : null,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setSaved(true)
      setTimeout(() => onSaved(), 1000)
    } catch (err) { setError(err.message) }
    finally { setSaving(false) }
  }

  const handleDelete = async () => {
    if (!confirm(`Delete ${property.address}? This cannot be undone.`)) return
    setDeleting(true)
    try {
      await fetch('/api/property', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ property_id: property.id }),
      })
      onDeleted()
    } catch { setDeleting(false) }
  }

  const inp = "w-full px-3 py-2.5 bg-white border border-[#e4e6eb] rounded-xl text-[#1a1a2e] placeholder-[#9ca3af] focus:outline-none focus:border-[#1877F2] focus:ring-2 focus:ring-[#1877F2]/20 transition-all text-sm"
  const lbl = "block text-xs font-semibold text-[#65676b] mb-1.5 uppercase tracking-wider"

  // Check for incomplete data
  const incomplete = !form.loan_balance || !form.loan_rate || !form.purchase_price
  const incompleteFields = [
    !form.purchase_price && 'Purchase Price',
    !form.loan_balance   && 'Loan Balance',
    !form.loan_rate      && 'Interest Rate',
  ].filter(Boolean)

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-cardHv border border-[#e4e6eb] max-h-[90vh] overflow-y-auto">

        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-[#e4e6eb] sticky top-0 bg-white z-10">
          <div>
            <h2 className="text-[#1a1a2e] font-bold">Edit Property</h2>
            <p className="text-[#65676b] text-xs mt-0.5 truncate max-w-xs">{property.address}, {property.city}</p>
          </div>
          <button onClick={onClose} className="text-[#65676b] hover:text-[#1a1a2e] p-1"><X className="w-5 h-5" /></button>
        </div>

        <div className="p-5 space-y-5">
          {error && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 rounded-xl p-3 text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />{error}
            </div>
          )}
          {saved && (
            <div className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-600 rounded-xl p-3 text-sm">
              <CheckCircle className="w-4 h-4 flex-shrink-0" />Saved successfully!
            </div>
          )}

          {/* Incomplete warning */}
          {incomplete && (
            <div className="flex items-start gap-2 bg-orange-50 border border-orange-200 rounded-xl p-3">
              <AlertTriangle className="w-4 h-4 text-orange-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-orange-700 text-xs font-semibold">Missing information affects your equity calculations</p>
                <p className="text-orange-600 text-xs mt-0.5">Please complete: {incompleteFields.join(', ')}</p>
              </div>
            </div>
          )}

          {/* Financial Details */}
          <div>
            <h3 className="text-[#1a1a2e] font-bold text-xs uppercase tracking-wider mb-3 flex items-center gap-2">
              <DollarSign className="w-3.5 h-3.5 text-[#1877F2]" /> Financial Details
            </h3>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={lbl}>Purchase Price</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9ca3af] text-sm">$</span>
                    <input value={form.purchase_price ? Number(form.purchase_price).toLocaleString('en-US') : ''}
                      onChange={e => setForm(p => ({...p, purchase_price: e.target.value.replace(/,/g,'')}))}
                      placeholder="1,200,000" className={`${inp} pl-7`} />
                  </div>
                </div>
                <div>
                  <label className={lbl}>Purchase Date</label>
                  <input type="date" value={form.purchase_date} onChange={update('purchase_date')} className={inp} />
                </div>
              </div>

              {/* Loan Balance with LTV shortcuts */}
              <div>
                <label className={lbl}>
                  Current Loan Balance
                  {homeValue > 0 && <span className="ml-1 text-[#9ca3af] normal-case font-normal">(based on {fmt(homeValue)} value)</span>}
                </label>
                {homeValue > 0 && (
                  <div className="flex gap-1.5 mb-2 flex-wrap">
                    {LTV_OPTIONS.map(opt => (
                      <button key={opt.pct} type="button"
                        onClick={() => setForm(p => ({...p, loan_balance: opt.amount?.toString() || ''}))}
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all border ${
                          parseInt(form.loan_balance) === opt.amount
                            ? 'bg-[#1877F2] text-white border-[#1877F2]'
                            : 'bg-[#f0f2f5] text-[#65676b] border-[#e4e6eb] hover:border-[#1877F2] hover:text-[#1877F2]'
                        }`}>
                        {opt.pct}% LTV
                        {opt.amount && <span className="ml-1 opacity-70">{fmt(opt.amount)}</span>}
                      </button>
                    ))}
                  </div>
                )}
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9ca3af] text-sm">$</span>
                  <input value={form.loan_balance ? Number(form.loan_balance).toLocaleString('en-US') : ''}
                    onChange={e => setForm(p => ({...p, loan_balance: e.target.value.replace(/,/g,'')}))}
                    placeholder="750,000" className={`${inp} pl-7`} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={lbl}>Interest Rate %</label>
                  <div className="relative">
                    <Percent className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#9ca3af]" />
                    <input type="number" step="0.001" value={form.loan_rate} onChange={update('loan_rate')} placeholder="3.250" className={`${inp} pl-9`} />
                  </div>
                </div>
                <div>
                  <label className={lbl}>Loan Type</label>
                  <select value={form.loan_type} onChange={update('loan_type')} className={inp}>
                    {['Conventional','FHA','VA','USDA','Jumbo','ARM'].map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Property Details */}
          <div>
            <h3 className="text-[#1a1a2e] font-bold text-xs uppercase tracking-wider mb-3 flex items-center gap-2">
              <TrendingUp className="w-3.5 h-3.5 text-[#1877F2]" /> Property Details
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={lbl}>Bedrooms</label>
                <input type="number" value={form.bedrooms} onChange={update('bedrooms')} placeholder="4" className={inp} />
              </div>
              <div>
                <label className={lbl}>Bathrooms</label>
                <input type="number" step="0.5" value={form.bathrooms} onChange={update('bathrooms')} placeholder="2.5" className={inp} />
              </div>
              <div>
                <label className={lbl}>Sq Ft</label>
                <input value={form.sqft ? Number(form.sqft).toLocaleString('en-US') : ''}
                  onChange={e => setForm(p => ({...p, sqft: e.target.value.replace(/,/g,'')}))}
                  placeholder="2,100" className={inp} />
              </div>
              <div>
                <label className={lbl}>Year Built</label>
                <input type="number" value={form.year_built} onChange={update('year_built')} placeholder="2005" className={inp} />
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-[#e4e6eb] space-y-3 sticky bottom-0 bg-white">
          <div className="flex gap-3">
            <button onClick={onClose} className="flex-1 py-3 border border-[#e4e6eb] text-[#65676b] hover:bg-[#f0f2f5] rounded-xl text-sm font-semibold transition-colors">
              Cancel
            </button>
            <button onClick={handleSave} disabled={saving || saved}
              className="flex-1 py-3 bg-[#1877F2] hover:bg-[#1665d8] text-white rounded-xl font-semibold text-sm transition-colors disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm">
              <Save className="w-4 h-4" />
              {saving ? 'Saving...' : saved ? 'Saved!' : 'Save Changes'}
            </button>
          </div>
          <button onClick={handleDelete} disabled={deleting}
            className="w-full py-2.5 border border-red-200 text-red-500 hover:bg-red-50 rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-2 disabled:opacity-50">
            <Trash2 className="w-4 h-4" />
            {deleting ? 'Deleting...' : 'Delete Property'}
          </button>
        </div>
      </div>
    </div>
  )
}
