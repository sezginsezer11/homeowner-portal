'use client'
import { useState } from 'react'
import Link from 'next/link'
import { Search, MapPin, Bed, Bath, DollarSign } from 'lucide-react'

const RENTALS = [
  { id:1, address:'1234 Pacific Beach Dr #4B', city:'San Diego, CA 92109', rent:3200, beds:2, baths:2, sqft:1100, img:'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=600&q=80', available:'Available Now' },
  { id:2, address:'5678 Mission Valley Rd', city:'San Diego, CA 92108', rent:2800, beds:2, baths:1, sqft:950, img:'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=600&q=80', available:'Available Jun 1' },
  { id:3, address:'9012 La Jolla Shores Dr', city:'La Jolla, CA 92037', rent:5500, beds:3, baths:2, sqft:1800, img:'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=600&q=80', available:'Available Now' },
  { id:4, address:'3456 Hillcrest Ave #2A', city:'San Diego, CA 92103', rent:2400, beds:1, baths:1, sqft:750, img:'https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=600&q=80', available:'Available Jul 1' },
]

export default function RentPage() {
  return (
    <div>
      <div className="bg-[#1a1a2e] py-12 px-6">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-black text-white mb-6">Find Your Perfect Rental</h1>
          <div className="flex gap-2 bg-white rounded-xl p-2">
            <div className="flex-1 flex items-center gap-3 px-3"><Search className="w-4 h-4 text-gray-400"/><input placeholder="City, Neighborhood, ZIP" className="flex-1 text-sm outline-none py-2 text-gray-800 placeholder-gray-400"/></div>
            <button className="px-6 py-3 bg-[#1877F2] text-white font-bold text-sm rounded-xl hover:bg-[#1665d8] transition-colors">Search</button>
          </div>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-6 py-10">
        <h2 className="text-xl font-bold text-[#1a1a2e] mb-6">{RENTALS.length} rentals available</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {RENTALS.map(r=>(
            <div key={r.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300 group">
              <div className="relative h-44 overflow-hidden">
                <img src={r.img} alt={r.address} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"/>
                <div className="absolute top-3 left-3 bg-green-500 text-white text-[10px] font-bold px-2.5 py-1 rounded-full">{r.available}</div>
              </div>
              <div className="p-4">
                <div className="text-xl font-black text-[#1a1a2e]">${r.rent.toLocaleString()}<span className="text-sm font-normal text-gray-400">/mo</span></div>
                <div className="text-sm font-semibold text-gray-700 mt-1">{r.address}</div>
                <div className="text-xs text-gray-400 flex items-center gap-1 mt-0.5 mb-3"><MapPin className="w-3 h-3"/>{r.city}</div>
                <div className="flex gap-3 text-xs text-gray-500 border-t border-gray-50 pt-3">
                  <span>{r.beds} bd</span><span>{r.baths} ba</span><span>{r.sqft} sqft</span>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-10 text-center">
          <p className="text-gray-500 text-sm mb-4">Sample listings — sign up to see live rental data and apply instantly.</p>
          <Link href="/auth/signup" className="inline-flex items-center gap-2 bg-[#1877F2] text-white font-bold px-8 py-3 rounded-xl hover:bg-[#1665d8] transition-colors text-sm">Sign Up to Apply</Link>
        </div>
      </div>
    </div>
  )
}
