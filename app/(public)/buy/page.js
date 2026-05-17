'use client'
import { useState } from 'react'
import Link from 'next/link'
import { Search, Home, Filter, MapPin, Bed, Bath, Square } from 'lucide-react'

const SAMPLE_LISTINGS = [
  { id:1, address:'4521 Ocean View Dr', city:'San Diego, CA 92130', price:1350000, beds:4, baths:3, sqft:2800, type:'Single Family', img:'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=600&q=80' },
  { id:2, address:'892 Carmel Valley Rd', city:'San Diego, CA 92130', price:875000, beds:3, baths:2, sqft:1950, type:'Condo', img:'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=600&q=80' },
  { id:3, address:'2201 Del Mar Heights', city:'Del Mar, CA 92014', price:2100000, beds:5, baths:4, sqft:4200, type:'Single Family', img:'https://images.unsplash.com/photo-1576941089067-2de3c901e126?w=600&q=80' },
  { id:4, address:'110 Pacific Coast Hwy', city:'Solana Beach, CA 92075', price:1650000, beds:4, baths:3.5, sqft:3100, type:'Townhome', img:'https://images.unsplash.com/photo-1599427303058-f04cbcf4756f?w=600&q=80' },
  { id:5, address:'7845 Rancho Santa Fe Rd', city:'Rancho Santa Fe, CA 92067', price:4200000, beds:6, baths:5, sqft:6500, type:'Single Family', img:'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=600&q=80' },
  { id:6, address:'3301 Torrey Pines Rd', city:'La Jolla, CA 92037', price:1890000, beds:4, baths:3, sqft:2950, type:'Single Family', img:'https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?w=600&q=80' },
]

export default function BuyPage() {
  const [search, setSearch] = useState('')
  return (
    <div>
      {/* Hero */}
      <div className="bg-[#1a1a2e] py-12 px-6">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-black text-white mb-6">Find Your Dream Home</h1>
          <div className="flex items-center gap-2 bg-white rounded-xl p-2">
            <div className="flex-1 flex items-center gap-3 px-3">
              <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <input value={search} onChange={e=>setSearch(e.target.value)}
                placeholder="City, Address, School, Agent, ZIP"
                className="flex-1 text-sm text-gray-800 placeholder-gray-400 outline-none py-2" />
            </div>
            <button className="px-6 py-3 bg-[#1877F2] text-white font-bold text-sm rounded-xl hover:bg-[#1665d8] transition-colors">Search</button>
          </div>
        </div>
      </div>

      {/* Listings */}
      <div className="max-w-7xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-[#1a1a2e]">{SAMPLE_LISTINGS.length} homes available <span className="text-gray-400 font-normal text-base">— San Diego Area</span></h2>
          <button className="flex items-center gap-2 border border-gray-200 px-4 py-2 rounded-xl text-sm font-semibold text-gray-600 hover:border-[#1877F2] hover:text-[#1877F2] transition-all">
            <Filter className="w-4 h-4" /> Filters
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {SAMPLE_LISTINGS.map(l => (
            <div key={l.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300 group cursor-pointer">
              <div className="relative h-52 overflow-hidden">
                <img src={l.img} alt={l.address} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                <div className="absolute top-3 left-3 bg-white text-[#1877F2] text-[10px] font-bold px-2.5 py-1 rounded-full">{l.type}</div>
              </div>
              <div className="p-4">
                <div className="text-2xl font-black text-[#1a1a2e] mb-1">${l.price.toLocaleString()}</div>
                <div className="text-sm font-semibold text-gray-700">{l.address}</div>
                <div className="text-xs text-gray-400 flex items-center gap-1 mt-0.5 mb-3"><MapPin className="w-3 h-3" />{l.city}</div>
                <div className="flex items-center gap-4 text-xs text-gray-500 border-t border-gray-50 pt-3">
                  <span className="flex items-center gap-1"><Bed className="w-3.5 h-3.5" />{l.beds} bd</span>
                  <span className="flex items-center gap-1"><Bath className="w-3.5 h-3.5" />{l.baths} ba</span>
                  <span className="flex items-center gap-1"><Square className="w-3.5 h-3.5" />{l.sqft.toLocaleString()} sqft</span>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-10 text-center">
          <p className="text-gray-500 text-sm mb-4">These are sample listings. Sign up to see live MLS data.</p>
          <Link href="/auth/signup" className="inline-flex items-center gap-2 bg-[#1877F2] text-white font-bold px-8 py-3 rounded-xl hover:bg-[#1665d8] transition-colors text-sm">
            Sign Up to See All Listings
          </Link>
        </div>
      </div>
    </div>
  )
}
