'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Search, MapPin, Bed, Bath, Square, Filter, Clock, TrendingDown, ChevronRight } from 'lucide-react'
import { generatePropertySlug } from '@/lib/propertySlug'

const STATUS_STYLES = {
  active:  'bg-green-50 text-green-700 border-green-200',
  pending: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  sold:    'bg-red-50 text-red-600 border-red-200',
}

function fmt(n) { return n ? '$' + Math.round(n).toLocaleString('en-US') : '—' }

export default function BuyPage() {
  const [search, setSearch]     = useState('San Diego, CA')
  const [listings, setListings] = useState([])
  const [loading, setLoading]   = useState(true)
  const [filters, setFilters]   = useState({ minBeds:'', minBaths:'', minPrice:'', maxPrice:'', type:'' })

  const fetchListings = async (query = 'San Diego, CA') => {
    setLoading(true)
    try {
      const res = await fetch(`/api/listings/search?query=${encodeURIComponent(query)}&limit=12`)
      const data = await res.json()
      setListings(data.listings || [])
    } catch { setListings([]) }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchListings() }, [])

  const getPropertyLink = (listing) => {
    const state   = listing.state || 'CA'
    const city    = listing.city || 'San-Diego'
    const address = listing.address || ''
    const zip     = listing.zip || ''
    return generatePropertySlug(address, city, state, zip, null)
  }

  const filtered = listings.filter(l => {
    if (filters.minBeds && l.beds < parseInt(filters.minBeds)) return false
    if (filters.minBaths && l.baths < parseFloat(filters.minBaths)) return false
    if (filters.minPrice && l.price < parseInt(filters.minPrice)) return false
    if (filters.maxPrice && l.price > parseInt(filters.maxPrice)) return false
    return true
  })

  return (
    <div>
      {/* Hero search */}
      <div className="bg-[#1a1a2e] py-10 px-6">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-black text-white mb-5">Find Your Dream Home</h1>
          <div className="flex gap-2">
            <div className="flex-1 flex items-center gap-3 bg-white rounded-xl px-4">
              <Search className="w-4 h-4 text-[#9ca3af] flex-shrink-0"/>
              <input value={search} onChange={e => setSearch(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && fetchListings(search)}
                placeholder="City, ZIP, Address, or Neighborhood"
                className="flex-1 py-3.5 text-sm text-[#1a1a2e] placeholder-[#9ca3af] outline-none bg-transparent"/>
            </div>
            <button onClick={() => fetchListings(search)}
              className="px-6 py-3.5 bg-[#1877F2] hover:bg-[#1665d8] text-white font-bold text-sm rounded-xl transition-colors">
              Search
            </button>
          </div>

          {/* Quick filters */}
          <div className="flex gap-2 mt-3 flex-wrap">
            {[
              { label:'2+ Beds', field:'minBeds', value:'2' },
              { label:'3+ Beds', field:'minBeds', value:'3' },
              { label:'Under $1M', field:'maxPrice', value:'1000000' },
              { label:'Under $2M', field:'maxPrice', value:'2000000' },
            ].map(f => (
              <button key={f.label} onClick={() => setFilters(p => ({...p, [f.field]: p[f.field]===f.value ? '' : f.value}))}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                  filters[f.field]===f.value ? 'bg-[#1877F2] text-white border-[#1877F2]' : 'bg-white/10 text-white border-white/20 hover:bg-white/20'
                }`}>
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Listings grid */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-[#1a1a2e] font-bold">
            {loading ? 'Loading...' : `${filtered.length} homes`}
            <span className="text-[#65676b] font-normal text-sm ml-2">in {search}</span>
          </h2>
          <div className="text-xs text-[#9ca3af] flex items-center gap-1">
            <Clock className="w-3 h-3"/> Updated daily
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array.from({length:6}).map((_,i) => (
              <div key={i} className="bg-[#f8f9fa] rounded-2xl h-72 animate-pulse border border-[#e4e6eb]"/>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <Search className="w-10 h-10 text-[#e4e6eb] mx-auto mb-3"/>
            <p className="text-[#65676b]">No listings found. Try a different search.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map((listing, i) => {
              const propLink = getPropertyLink(listing)
              const statusKey = listing.status || 'active'
              return (
                <Link key={i} href={propLink}
                  className="bg-white rounded-2xl border border-[#e4e6eb] overflow-hidden hover:shadow-xl transition-all duration-300 group block">
                  <div className="relative h-52 overflow-hidden bg-[#f0f2f5]">
                    {listing.photo ? (
                      <img src={listing.photo} alt={listing.address} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"/>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-[#f0f2f5]">
                        <Search className="w-10 h-10 text-[#c4c9d0]"/>
                      </div>
                    )}
                    <div className="absolute top-3 left-3 flex gap-1.5">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${STATUS_STYLES[statusKey] || STATUS_STYLES.active}`}>
                        {statusKey === 'active' ? 'For Sale' : statusKey.charAt(0).toUpperCase() + statusKey.slice(1)}
                      </span>
                      {listing.days_on_market && <span className="text-[10px] bg-black/50 text-white px-2 py-0.5 rounded-full">{listing.days_on_market}d</span>}
                    </div>
                    {listing.price_reduced && (
                      <div className="absolute top-3 right-3 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                        <TrendingDown className="w-2.5 h-2.5"/> Reduced
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <div className="text-xl font-black text-[#1a1a2e] mb-1">{fmt(listing.price)}</div>
                    <div className="text-sm font-semibold text-[#444] truncate">{listing.address}</div>
                    <div className="text-xs text-[#9ca3af] flex items-center gap-1 mt-0.5 mb-3">
                      <MapPin className="w-3 h-3"/>{listing.city}, {listing.state} {listing.zip}
                    </div>
                    <div className="flex items-center gap-4 text-xs text-[#65676b] border-t border-[#f0f2f5] pt-3">
                      {listing.beds   && <span className="flex items-center gap-1"><Bed className="w-3.5 h-3.5"/>{listing.beds} bd</span>}
                      {listing.baths  && <span className="flex items-center gap-1"><Bath className="w-3.5 h-3.5"/>{listing.baths} ba</span>}
                      {listing.sqft   && <span className="flex items-center gap-1"><Square className="w-3.5 h-3.5"/>{Number(listing.sqft).toLocaleString()} sqft</span>}
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}

        {!loading && listings.length > 0 && (
          <p className="text-center text-xs text-[#9ca3af] mt-8">
            Live listings from Realtor.com · Updated daily · Sign up to save searches and get alerts
          </p>
        )}
      </div>
    </div>
  )
}
