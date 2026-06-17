'use client'
import Link from 'next/link'
import { TrendingUp, Pencil, Home, DollarSign } from 'lucide-react'

export default function HomeownerPropertyCard({ property = null }) {
  // Sample property if none provided
  const prop = property || {
    address: '4503 Sun Valley Road',
    city: 'Del Mar, CA 92014',
    estValue: 4966379,
    equity: 2822379,
    loanBalance: 2144000,
    totalGain: 2286379,
    ownedSince: 'Apr 2016',
    yearsOwned: 10.2,
    appreciation: 6.3,
    equityGrowth: 17.8
  }

  const setSellAddress = () => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('sell_home_address', prop.address + ', ' + prop.city)
    }
  }

  return (
    <div className="bg-gradient-to-br from-[#1877F2] to-[#0a66c2] rounded-3xl border border-blue-300 p-6 shadow-lg text-white">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Home className="w-5 h-5" />
            <h2 className="text-xl font-black">{prop.address}</h2>
          </div>
          <p className="text-blue-100 text-sm">{prop.city}</p>
        </div>
        <button className="p-2 hover:bg-white/10 rounded-full transition">
          <Pencil className="w-5 h-5" />
        </button>
      </div>

      {/* Main Stats */}
      <div className="bg-white rounded-2xl p-5 mb-4 text-[#1a1a2e]">
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <div className="text-xs font-bold text-[#65676b] uppercase tracking-wider mb-1">Est. Value</div>
            <div className="text-2xl font-black text-[#1a1a2e]">${(prop.estValue / 1000000).toFixed(2)}M</div>
            <div className="text-sm text-green-600 font-semibold mt-1">↑ {prop.appreciation}%/yr avg</div>
          </div>
          <div>
            <div className="text-xs font-bold text-[#65676b] uppercase tracking-wider mb-1">Equity</div>
            <div className="text-2xl font-black text-green-700">${(prop.equity / 1000000).toFixed(2)}M</div>
            <div className="text-sm text-green-600 font-semibold mt-1">↑ {prop.equityGrowth}%/yr equity</div>
          </div>
        </div>

        {/* Secondary Stats */}
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="flex justify-between py-2 border-b border-[#e4e6eb]">
            <span className="text-[#65676b]">Loan Balance</span>
            <span className="font-bold">${(prop.loanBalance / 1000).toFixed(0)}K</span>
          </div>
          <div className="flex justify-between py-2 border-b border-[#e4e6eb]">
            <span className="text-[#65676b]">Total Gain</span>
            <span className="font-bold text-green-700">${(prop.totalGain / 1000000).toFixed(2)}M (+{((prop.totalGain / (prop.estValue - prop.totalGain)) * 100).toFixed(1)}%)</span>
          </div>
        </div>

        <div className="text-xs text-[#65676b] mt-3 flex items-center justify-between">
          <span>📅 Owned Since {prop.ownedSince} · {prop.yearsOwned} years</span>
          <span className="bg-blue-100 text-[#1877F2] px-2 py-1 rounded-full font-semibold text-xs">CACHED</span>
        </div>
      </div>

      {/* CTA Buttons */}
      <div className="grid grid-cols-2 gap-3">
        <Link
          href="/dashboard/homeowner/sell-home"
          onClick={setSellAddress}
          className="flex items-center justify-center gap-2 py-3 bg-white/15 hover:bg-white/25 rounded-xl transition font-bold text-sm"
        >
          <DollarSign className="w-4 h-4" />
          Sell Home
        </Link>
        <button className="flex items-center justify-center gap-2 py-3 bg-white text-[#1877F2] hover:bg-blue-50 rounded-xl transition font-bold text-sm">
          <TrendingUp className="w-4 h-4" />
          Invest More
        </button>
      </div>
    </div>
  )
}
