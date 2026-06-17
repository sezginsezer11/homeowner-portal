'use client'
import { useState } from 'react'
import { ChevronRight, Home } from 'lucide-react'

export default function SellPropertyStartPage() {
  const [useExisting, setUseExisting] = useState(null)
  const [newAddress, setNewAddress] = useState('')

  const handleStart = () => {
    let address = ''
    if (useExisting === 'existing') {
      address = '4503 Sun Valley Road, Del Mar, CA 92014'
    } else if (useExisting === 'new' && newAddress) {
      address = newAddress
    }
    
    if (address && typeof window !== 'undefined') {
      sessionStorage.setItem('sell_home_address', address)
      window.location.href = '/dashboard/homeowner/sell-home'
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f8f9fa] to-[#f0f2f5] py-12 px-6">
      <div className="max-w-2xl mx-auto">
        <div className="mb-12">
          <h1 className="text-4xl font-black text-[#1a1a2e] mb-3">Ready to Sell?</h1>
          <p className="text-lg text-[#65676b]">Get a personalized strategy to maximize your home's value.</p>
        </div>

        <div className="mb-8">
          <button
            onClick={() => setUseExisting('existing')}
            className={`w-full p-6 rounded-2xl border-2 text-left transition-all ${
              useExisting === 'existing'
                ? 'bg-[#1877F2] border-[#1877F2] text-white'
                : 'bg-white border-[#e4e6eb] hover:border-[#1877F2]'
            }`}
          >
            <div className="flex items-start gap-4">
              <Home className={`w-6 h-6 mt-1 ${useExisting === 'existing' ? 'text-white' : 'text-[#1877F2]'}`} />
              <div>
                <h2 className="font-bold text-lg">Use My Current Property</h2>
                <p className={`text-sm mt-1 ${useExisting === 'existing' ? 'text-white/80' : 'text-[#65676b]'}`}>
                  4503 Sun Valley Road, Del Mar, CA 92014
                </p>
              </div>
            </div>
          </button>
        </div>

        <div className="mb-10">
          <button
            onClick={() => setUseExisting('new')}
            className={`w-full p-6 rounded-2xl border-2 text-left transition-all ${
              useExisting === 'new'
                ? 'bg-[#1877F2] border-[#1877F2] text-white'
                : 'bg-white border-[#e4e6eb] hover:border-[#1877F2]'
            }`}
          >
            <div className="flex items-start gap-4">
              <div className={`w-6 h-6 mt-1 flex items-center justify-center rounded-full ${useExisting === 'new' ? 'bg-white text-[#1877F2]' : 'bg-[#e4e6eb] text-[#1877F2]'}`}>
                +
              </div>
              <div>
                <h2 className="font-bold text-lg">Use a Different Property</h2>
                <p className={`text-sm mt-1 ${useExisting === 'new' ? 'text-white/80' : 'text-[#65676b]'}`}>
                  Enter an address to evaluate
                </p>
              </div>
            </div>
          </button>

          {useExisting === 'new' && (
            <div className="mt-4">
              <input
                type="text"
                value={newAddress}
                onChange={(e) => setNewAddress(e.target.value)}
                placeholder="e.g., 123 Ocean View Dr, San Diego, CA 92130"
                className="w-full px-5 py-3 border-2 border-[#1877F2] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1877F2]"
              />
            </div>
          )}
        </div>

        <button
          onClick={handleStart}
          disabled={!useExisting || (useExisting === 'new' && !newAddress)}
          className="w-full py-4 bg-[#1877F2] hover:bg-[#165ac6] disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl transition flex items-center justify-center gap-2 text-lg"
        >
          Continue
          <ChevronRight className="w-5 h-5" />
        </button>

        <p className="text-sm text-[#65676b] text-center mt-8">
          We'll help you choose the best selling strategy for your situation.
        </p>
      </div>
    </div>
  )
}
