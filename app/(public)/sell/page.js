'use client'
import { useState } from 'react'
import Link from 'next/link'
import { Home, TrendingUp, DollarSign, CheckCircle, ArrowRight } from 'lucide-react'
import AddressAutocomplete from '@/components/AddressAutocomplete'

export default function SellPage() {
  const [address, setAddress] = useState({})
  return (
    <div>
      <div className="bg-[#1a1a2e] py-16 px-6">
        <div className="max-w-2xl mx-auto text-center">
          <h1 className="text-5xl font-black text-white mb-4">What&apos;s your home worth?</h1>
          <p className="text-gray-300 text-lg mb-8">Get a free, instant home valuation powered by real market data.</p>
          <div className="bg-white rounded-xl p-3 flex gap-2">
            <div className="flex-1">
              <AddressAutocomplete value={address.address||''} onChange={setAddress} placeholder="Enter your home address..." />
            </div>
            <Link href="/auth/signup" className="px-6 py-3 bg-[#1877F2] text-white font-bold text-sm rounded-xl hover:bg-[#1665d8] transition-colors whitespace-nowrap">Get Value</Link>
          </div>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          {[{icon:TrendingUp,title:'Live Market Data',desc:'Get valuations based on real-time Redfin data and recent comparable sales in your neighborhood.'},{icon:DollarSign,title:'Maximize Your Sale',desc:'Our agents use proven strategies to price your home right and attract qualified buyers quickly.'},{icon:Home,title:'Full-Service Support',desc:'From listing to closing, your dedicated 360Everywhere agent handles everything.'}].map(f=>(
            <div key={f.title} className="text-center p-6">
              <div className="w-14 h-14 bg-[#e7f0fd] rounded-2xl flex items-center justify-center mx-auto mb-4"><f.icon className="w-7 h-7 text-[#1877F2]"/></div>
              <h3 className="text-xl font-bold text-[#1a1a2e] mb-2">{f.title}</h3>
              <p className="text-gray-500">{f.desc}</p>
            </div>
          ))}
        </div>
        <div className="bg-[#f8f9fa] rounded-3xl p-10 text-center">
          <h2 className="text-3xl font-black text-[#1a1a2e] mb-4">Ready to sell?</h2>
          <p className="text-gray-500 mb-6">Create your free account to get a detailed home valuation report and connect with a local expert.</p>
          <Link href="/auth/signup" className="inline-flex items-center gap-2 bg-[#1877F2] text-white font-bold px-8 py-4 rounded-xl hover:bg-[#1665d8] transition-colors">Get Started Free <ArrowRight className="w-4 h-4"/></Link>
        </div>
      </div>
    </div>
  )
}
