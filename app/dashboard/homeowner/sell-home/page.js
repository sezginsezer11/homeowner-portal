'use client'
import { useState, useEffect } from 'react'
import { ChevronRight, Home, Hammer, DollarSign, Calculator, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function SellHomePage() {
  const [step, setStep] = useState('option-select') // option-select, confirm-property, remodel-options, summary
  const [saleType, setSaleType] = useState(null) // 'standard', 'remodel', 'cash'
  const [property, setProperty] = useState({
    address: '',
    sqft: '',
    lotSize: '',
    type: 'Single Family',
    beds: '',
    baths: '',
    year: '',
    condition: 'Average'
  })
  const [remodels, setRemodels] = useState({
    kitchen: null,
    fullBaths: { count: 0, tier: null },
    halfBaths: { count: 0, tier: null },
    flooring: null,
    backyard: null,
    paintInterior: null,
    paintExterior: null
  })
  const [costs, setCosts] = useState({})

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const addr = sessionStorage.getItem('sell_home_address')
      if (addr) setProperty(prev => ({ ...prev, address: addr }))
    }
  }, [])

  // Calculate remodel costs based on sqft / lot size
  const calcCost = (tier, sqft, pricePerSqft) => {
    if (!sqft) return 0
    const prices = { a: pricePerSqft[0], b: pricePerSqft[1], c: pricePerSqft[2] }
    return Math.round(sqft * (prices[tier] || 0))
  }

  const updateRemodels = (key, value) => {
    setRemodels(prev => ({ ...prev, [key]: value }))
  }

  const getRemodelCost = (item, tier) => {
    const sqft = parseInt(property.sqft) || 0
    const lotSqft = parseInt(property.lotSize) || 0

    const costs = {
      kitchen: { a: 30000, b: 45000, c: 60000 },
      fullBaths: { a: 13000, b: 20000, c: 30000 },
      halfBaths: { a: 3000, b: 5000, c: 10000 },
      flooring: { a: 10, b: 14, c: 20 }, // per sqft
      backyard: { a: 5, b: 10, c: 15 }, // per sqft
      paintInterior: { a: 4, b: 6, c: 8 }, // per sqft
      paintExterior: { a: 4, b: 6, c: 8 } // per sqft
    }

    if (['flooring', 'paintInterior', 'paintExterior'].includes(item)) {
      return calcCost(tier, sqft, [costs[item].a, costs[item].b, costs[item].c])
    }
    if (item === 'backyard') {
      return calcCost(tier, lotSqft, [costs[item].a, costs[item].b, costs[item].c])
    }
    return costs[item]?.[tier] || 0
  }

  const getTotalRemodelCost = () => {
    let total = 0
    if (remodels.kitchen) total += getRemodelCost('kitchen', remodels.kitchen)
    if (remodels.fullBaths.tier) total += getRemodelCost('fullBaths', remodels.fullBaths.tier) * (remodels.fullBaths.count || 0)
    if (remodels.halfBaths.tier) total += getRemodelCost('halfBaths', remodels.halfBaths.tier) * (remodels.halfBaths.count || 0)
    if (remodels.flooring) total += getRemodelCost('flooring', remodels.flooring)
    if (remodels.backyard) total += getRemodelCost('backyard', remodels.backyard)
    if (remodels.paintInterior) total += getRemodelCost('paintInterior', remodels.paintInterior)
    if (remodels.paintExterior) total += getRemodelCost('paintExterior', remodels.paintExterior)
    return total
  }

  const handleNext = () => {
    if (step === 'option-select' && saleType) {
      setStep('confirm-property')
    } else if (step === 'confirm-property' && property.address && property.sqft && property.lotSize) {
      if (saleType === 'remodel') {
        setStep('remodel-options')
      } else {
        setStep('summary')
      }
    } else if (step === 'remodel-options') {
      setStep('summary')
    }
  }

  const handleBack = () => {
    if (step === 'confirm-property') {
      setStep('option-select')
    } else if (step === 'remodel-options') {
      setStep('confirm-property')
    } else if (step === 'summary') {
      setStep(saleType === 'remodel' ? 'remodel-options' : 'confirm-property')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f8f9fa] to-[#f0f2f5]">
      <div className="max-w-3xl mx-auto px-6 py-8">

        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          {step !== 'option-select' && (
            <button onClick={handleBack} className="p-2 hover:bg-white rounded-full transition">
              <ArrowLeft className="w-5 h-5 text-[#1877F2]" />
            </button>
          )}
          <div>
            <h1 className="text-2xl font-black text-[#1a1a2e]">
              {step === 'option-select' && 'How would you like to sell?'}
              {step === 'confirm-property' && 'Confirm Your Property'}
              {step === 'remodel-options' && 'Remodeling Options'}
              {step === 'summary' && 'Your Selling Strategy'}
            </h1>
            <p className="text-[#65676b] text-sm mt-1">{property.address || 'Enter your property details to get started'}</p>
          </div>
        </div>

        {/* STEP 1: OPTION SELECT */}
        {step === 'option-select' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[
              { id: 'standard', icon: Home, title: 'Standard Sale', desc: 'List and sell at market value' },
              { id: 'remodel', icon: Hammer, title: 'Remodel & Sell', desc: 'Upgrade then sell for more' },
              { id: 'cash', icon: DollarSign, title: 'Sell for Cash', desc: 'Fast sale with cash buyer' }
            ].map(option => (
              <button
                key={option.id}
                onClick={() => setSaleType(option.id)}
                className={`p-6 rounded-2xl border-2 transition-all text-left ${
                  saleType === option.id
                    ? 'bg-[#1877F2] border-[#1877F2] text-white'
                    : 'bg-white border-[#e4e6eb] hover:border-[#1877F2]'
                }`}
              >
                <option.icon className={`w-8 h-8 mb-3 ${saleType === option.id ? 'text-white' : 'text-[#1877F2]'}`} />
                <h3 className="font-bold text-lg">{option.title}</h3>
                <p className={`text-sm mt-1 ${saleType === option.id ? 'text-white/80' : 'text-[#65676b]'}`}>{option.desc}</p>
              </button>
            ))}
          </div>
        )}

        {/* STEP 2: CONFIRM PROPERTY */}
        {step === 'confirm-property' && (
          <div className="bg-white rounded-2xl border border-[#e4e6eb] p-6 shadow-sm space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-xs font-bold text-[#65676b] uppercase tracking-wider mb-2">Address</label>
                <input
                  type="text"
                  value={property.address}
                  onChange={(e) => setProperty({...property, address: e.target.value})}
                  placeholder="123 Ocean View Dr, San Diego, CA 92130"
                  className="w-full px-4 py-2.5 border border-[#e4e6eb] rounded-xl focus:outline-none focus:border-[#1877F2]"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#65676b] uppercase tracking-wider mb-2">Sq Ft</label>
                <input
                  type="number"
                  value={property.sqft}
                  onChange={(e) => setProperty({...property, sqft: e.target.value})}
                  placeholder="3,500"
                  className="w-full px-4 py-2.5 border border-[#e4e6eb] rounded-xl focus:outline-none focus:border-[#1877F2]"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#65676b] uppercase tracking-wider mb-2">Lot Size</label>
                <input
                  type="number"
                  value={property.lotSize}
                  onChange={(e) => setProperty({...property, lotSize: e.target.value})}
                  placeholder="8,200"
                  className="w-full px-4 py-2.5 border border-[#e4e6eb] rounded-xl focus:outline-none focus:border-[#1877F2]"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#65676b] uppercase tracking-wider mb-2">Beds</label>
                <input
                  type="number"
                  value={property.beds}
                  onChange={(e) => setProperty({...property, beds: e.target.value})}
                  className="w-full px-4 py-2.5 border border-[#e4e6eb] rounded-xl focus:outline-none focus:border-[#1877F2]"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#65676b] uppercase tracking-wider mb-2">Baths</label>
                <input
                  type="number"
                  value={property.baths}
                  onChange={(e) => setProperty({...property, baths: e.target.value})}
                  className="w-full px-4 py-2.5 border border-[#e4e6eb] rounded-xl focus:outline-none focus:border-[#1877F2]"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#65676b] uppercase tracking-wider mb-2">Year Built</label>
                <input
                  type="number"
                  value={property.year}
                  onChange={(e) => setProperty({...property, year: e.target.value})}
                  className="w-full px-4 py-2.5 border border-[#e4e6eb] rounded-xl focus:outline-none focus:border-[#1877F2]"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#65676b] uppercase tracking-wider mb-2">Property Type</label>
                <select
                  value={property.type}
                  onChange={(e) => setProperty({...property, type: e.target.value})}
                  className="w-full px-4 py-2.5 border border-[#e4e6eb] rounded-xl focus:outline-none focus:border-[#1877F2]"
                >
                  <option>Single Family</option>
                  <option>Condo</option>
                  <option>Townhome</option>
                  <option>Multi-unit</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-[#65676b] uppercase tracking-wider mb-2">Condition</label>
                <select
                  value={property.condition}
                  onChange={(e) => setProperty({...property, condition: e.target.value})}
                  className="w-full px-4 py-2.5 border border-[#e4e6eb] rounded-xl focus:outline-none focus:border-[#1877F2]"
                >
                  <option>Poor</option>
                  <option>Below Average</option>
                  <option>Average</option>
                  <option>Good</option>
                  <option>Excellent</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: REMODEL OPTIONS */}
        {step === 'remodel-options' && (
          <div className="space-y-5">
            {/* Kitchen */}
            <div className="bg-white rounded-2xl border border-[#e4e6eb] p-6">
              <h3 className="font-bold text-[#1a1a2e] mb-4 flex items-center gap-2">🍳 Kitchen</h3>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { tier: 'a', label: 'Minimum', cost: 30000 },
                  { tier: 'b', label: 'Medium', cost: 45000 },
                  { tier: 'c', label: 'High-End', cost: 60000 }
                ].map(option => (
                  <button
                    key={option.tier}
                    onClick={() => updateRemodels('kitchen', option.tier)}
                    className={`p-4 rounded-xl border-2 text-center transition ${
                      remodels.kitchen === option.tier
                        ? 'bg-[#1877F2] border-[#1877F2] text-white'
                        : 'border-[#e4e6eb] hover:border-[#1877F2]'
                    }`}
                  >
                    <div className="font-bold">{option.label}</div>
                    <div className="text-sm mt-1">${option.cost.toLocaleString()}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Full Bathrooms */}
            <div className="bg-white rounded-2xl border border-[#e4e6eb] p-6">
              <h3 className="font-bold text-[#1a1a2e] mb-4 flex items-center gap-2">🚿 Full Bathrooms</h3>
              <div className="mb-4">
                <label className="text-sm font-semibold text-[#65676b] mb-2 block">How many full baths to upgrade?</label>
                <input
                  type="number"
                  min="0"
                  value={remodels.fullBaths.count}
                  onChange={(e) => updateRemodels('fullBaths', {...remodels.fullBaths, count: parseInt(e.target.value) || 0})}
                  className="w-full px-4 py-2 border border-[#e4e6eb] rounded-xl focus:outline-none focus:border-[#1877F2]"
                />
              </div>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { tier: 'a', label: 'Minimum', cost: 13000 },
                  { tier: 'b', label: 'Medium', cost: 20000 },
                  { tier: 'c', label: 'High-End', cost: 30000 }
                ].map(option => (
                  <button
                    key={option.tier}
                    onClick={() => updateRemodels('fullBaths', {...remodels.fullBaths, tier: option.tier})}
                    className={`p-4 rounded-xl border-2 text-center transition ${
                      remodels.fullBaths.tier === option.tier
                        ? 'bg-[#1877F2] border-[#1877F2] text-white'
                        : 'border-[#e4e6eb] hover:border-[#1877F2]'
                    }`}
                  >
                    <div className="font-bold">{option.label}</div>
                    <div className="text-sm mt-1">${option.cost.toLocaleString()}/bath</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Half Bathrooms */}
            <div className="bg-white rounded-2xl border border-[#e4e6eb] p-6">
              <h3 className="font-bold text-[#1a1a2e] mb-4">1/2 Bathrooms</h3>
              <div className="mb-4">
                <label className="text-sm font-semibold text-[#65676b] mb-2 block">How many half baths to upgrade?</label>
                <input
                  type="number"
                  min="0"
                  value={remodels.halfBaths.count}
                  onChange={(e) => updateRemodels('halfBaths', {...remodels.halfBaths, count: parseInt(e.target.value) || 0})}
                  className="w-full px-4 py-2 border border-[#e4e6eb] rounded-xl focus:outline-none focus:border-[#1877F2]"
                />
              </div>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { tier: 'a', label: 'Minimum', cost: 3000 },
                  { tier: 'b', label: 'Medium', cost: 5000 },
                  { tier: 'c', label: 'High-End', cost: 10000 }
                ].map(option => (
                  <button
                    key={option.tier}
                    onClick={() => updateRemodels('halfBaths', {...remodels.halfBaths, tier: option.tier})}
                    className={`p-4 rounded-xl border-2 text-center transition ${
                      remodels.halfBaths.tier === option.tier
                        ? 'bg-[#1877F2] border-[#1877F2] text-white'
                        : 'border-[#e4e6eb] hover:border-[#1877F2]'
                    }`}
                  >
                    <div className="font-bold">{option.label}</div>
                    <div className="text-sm mt-1">${option.cost.toLocaleString()}/bath</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Flooring */}
            <div className="bg-white rounded-2xl border border-[#e4e6eb] p-6">
              <h3 className="font-bold text-[#1a1a2e] mb-4">🏠 Flooring</h3>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { tier: 'a', label: 'Minimum', pricePerSqft: 10 },
                  { tier: 'b', label: 'Medium', pricePerSqft: 14 },
                  { tier: 'c', label: 'High-End', pricePerSqft: 20 }
                ].map(option => (
                  <button
                    key={option.tier}
                    onClick={() => updateRemodels('flooring', option.tier)}
                    className={`p-4 rounded-xl border-2 text-center transition ${
                      remodels.flooring === option.tier
                        ? 'bg-[#1877F2] border-[#1877F2] text-white'
                        : 'border-[#e4e6eb] hover:border-[#1877F2]'
                    }`}
                  >
                    <div className="font-bold">{option.label}</div>
                    <div className="text-sm mt-1">${getRemodelCost('flooring', option.tier).toLocaleString()}</div>
                    <div className="text-xs mt-1 opacity-70">(${option.pricePerSqft}/sqft)</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Backyard */}
            <div className="bg-white rounded-2xl border border-[#e4e6eb] p-6">
              <h3 className="font-bold text-[#1a1a2e] mb-4">🌳 Backyard</h3>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { tier: 'a', label: 'Minimum', pricePerSqft: 5 },
                  { tier: 'b', label: 'Medium', pricePerSqft: 10 },
                  { tier: 'c', label: 'High-End', pricePerSqft: 15 }
                ].map(option => (
                  <button
                    key={option.tier}
                    onClick={() => updateRemodels('backyard', option.tier)}
                    className={`p-4 rounded-xl border-2 text-center transition ${
                      remodels.backyard === option.tier
                        ? 'bg-[#1877F2] border-[#1877F2] text-white'
                        : 'border-[#e4e6eb] hover:border-[#1877F2]'
                    }`}
                  >
                    <div className="font-bold">{option.label}</div>
                    <div className="text-sm mt-1">${getRemodelCost('backyard', option.tier).toLocaleString()}</div>
                    <div className="text-xs mt-1 opacity-70">(${option.pricePerSqft}/sqft)</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Interior Paint */}
            <div className="bg-white rounded-2xl border border-[#e4e6eb] p-6">
              <h3 className="font-bold text-[#1a1a2e] mb-4">🎨 Paint Interior</h3>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { tier: 'a', label: 'Minimum', pricePerSqft: 4 },
                  { tier: 'b', label: 'Medium', pricePerSqft: 6 },
                  { tier: 'c', label: 'High-End', pricePerSqft: 8 }
                ].map(option => (
                  <button
                    key={option.tier}
                    onClick={() => updateRemodels('paintInterior', option.tier)}
                    className={`p-4 rounded-xl border-2 text-center transition ${
                      remodels.paintInterior === option.tier
                        ? 'bg-[#1877F2] border-[#1877F2] text-white'
                        : 'border-[#e4e6eb] hover:border-[#1877F2]'
                    }`}
                  >
                    <div className="font-bold">{option.label}</div>
                    <div className="text-sm mt-1">${getRemodelCost('paintInterior', option.tier).toLocaleString()}</div>
                    <div className="text-xs mt-1 opacity-70">(${option.pricePerSqft}/sqft)</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Exterior Paint */}
            <div className="bg-white rounded-2xl border border-[#e4e6eb] p-6">
              <h3 className="font-bold text-[#1a1a2e] mb-4">🏘️ Paint Exterior</h3>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { tier: 'a', label: 'Minimum', pricePerSqft: 4 },
                  { tier: 'b', label: 'Medium', pricePerSqft: 6 },
                  { tier: 'c', label: 'High-End', pricePerSqft: 8 }
                ].map(option => (
                  <button
                    key={option.tier}
                    onClick={() => updateRemodels('paintExterior', option.tier)}
                    className={`p-4 rounded-xl border-2 text-center transition ${
                      remodels.paintExterior === option.tier
                        ? 'bg-[#1877F2] border-[#1877F2] text-white'
                        : 'border-[#e4e6eb] hover:border-[#1877F2]'
                    }`}
                  >
                    <div className="font-bold">{option.label}</div>
                    <div className="text-sm mt-1">${getRemodelCost('paintExterior', option.tier).toLocaleString()}</div>
                    <div className="text-xs mt-1 opacity-70">(${option.pricePerSqft}/sqft)</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* STEP 4: SUMMARY */}
        {step === 'summary' && (
          <div className="bg-white rounded-2xl border border-[#e4e6eb] p-6 shadow-sm space-y-5">
            <div className="border-b pb-4">
              <h3 className="font-bold text-[#1a1a2e] mb-3">Property Summary</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><span className="text-[#65676b]">Address:</span> <span className="font-semibold">{property.address}</span></div>
                <div><span className="text-[#65676b]">Type:</span> <span className="font-semibold">{property.type}</span></div>
                <div><span className="text-[#65676b]">Sq Ft:</span> <span className="font-semibold">{property.sqft?.toLocaleString()}</span></div>
                <div><span className="text-[#65676b]">Lot Size:</span> <span className="font-semibold">{property.lotSize?.toLocaleString()}</span></div>
                <div><span className="text-[#65676b]">Beds/Baths:</span> <span className="font-semibold">{property.beds}/{property.baths}</span></div>
                <div><span className="text-[#65676b]">Year Built:</span> <span className="font-semibold">{property.year}</span></div>
              </div>
            </div>

            {saleType === 'remodel' && (
              <div className="border-b pb-4">
                <h3 className="font-bold text-[#1a1a2e] mb-3">Remodeling Costs</h3>
                <div className="space-y-2 text-sm">
                  {remodels.kitchen && <div className="flex justify-between"><span>Kitchen Upgrade</span> <span className="font-semibold">${getRemodelCost('kitchen', remodels.kitchen).toLocaleString()}</span></div>}
                  {remodels.fullBaths.tier && remodels.fullBaths.count > 0 && <div className="flex justify-between"><span>{remodels.fullBaths.count} Full Bath(s)</span> <span className="font-semibold">${(getRemodelCost('fullBaths', remodels.fullBaths.tier) * remodels.fullBaths.count).toLocaleString()}</span></div>}
                  {remodels.halfBaths.tier && remodels.halfBaths.count > 0 && <div className="flex justify-between"><span>{remodels.halfBaths.count} Half Bath(s)</span> <span className="font-semibold">${(getRemodelCost('halfBaths', remodels.halfBaths.tier) * remodels.halfBaths.count).toLocaleString()}</span></div>}
                  {remodels.flooring && <div className="flex justify-between"><span>Flooring</span> <span className="font-semibold">${getRemodelCost('flooring', remodels.flooring).toLocaleString()}</span></div>}
                  {remodels.backyard && <div className="flex justify-between"><span>Backyard</span> <span className="font-semibold">${getRemodelCost('backyard', remodels.backyard).toLocaleString()}</span></div>}
                  {remodels.paintInterior && <div className="flex justify-between"><span>Interior Paint</span> <span className="font-semibold">${getRemodelCost('paintInterior', remodels.paintInterior).toLocaleString()}</span></div>}
                  {remodels.paintExterior && <div className="flex justify-between"><span>Exterior Paint</span> <span className="font-semibold">${getRemodelCost('paintExterior', remodels.paintExterior).toLocaleString()}</span></div>}
                  <div className="border-t pt-2 mt-2 flex justify-between font-bold text-[#1877F2]">
                    <span>Total Remodeling Investment</span>
                    <span>${getTotalRemodelCost().toLocaleString()}</span>
                  </div>
                </div>
              </div>
            )}

            <div className="bg-[#f0f7ff] border border-[#bae6fd] rounded-xl p-4">
              <p className="text-sm text-[#1877F2] font-semibold mb-2">Next Steps</p>
              <p className="text-sm text-[#333]">
                {saleType === 'standard' && 'Let\'s schedule a time to discuss your listing strategy and pricing in detail.'}
                {saleType === 'remodel' && `With $${getTotalRemodelCost().toLocaleString()} in upgrades, we can position your home to command a premium in the market.`}
                {saleType === 'cash' && 'We have qualified cash buyers ready to make offers on properties in your area.'}
              </p>
            </div>

            <button
              onClick={() => {
                alert(`${saleType.toUpperCase()} option selected. Connecting to Sez Sezer...`)
              }}
              className="w-full bg-[#1877F2] hover:bg-[#165ac6] text-white font-bold py-3 rounded-xl transition"
            >
              Contact Sez Sezer to Get Started
            </button>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3 mt-8 justify-between">
          {step !== 'option-select' && (
            <button
              onClick={handleBack}
              className="px-6 py-2.5 border border-[#e4e6eb] rounded-xl text-[#1a1a2e] font-semibold hover:bg-[#f8f9fa] transition"
            >
              Back
            </button>
          )}
          <div className="flex-1" />
          {step !== 'summary' && (
            <button
              onClick={handleNext}
              disabled={
                (step === 'option-select' && !saleType) ||
                (step === 'confirm-property' && (!property.address || !property.sqft || !property.lotSize))
              }
              className="px-6 py-2.5 bg-[#1877F2] hover:bg-[#165ac6] disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-semibold transition flex items-center gap-2"
            >
              Next <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
