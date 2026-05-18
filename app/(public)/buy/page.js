'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Search, MapPin, Bed, Bath, Square, Clock, TrendingDown, Home, Zap, Video, Box } from 'lucide-react'

function fmt(n) { return n ? '$' + Math.round(n).toLocaleString('en-US') : '—' }
function fmtNum(n) { return n ? Number(n).toLocaleString('en-US') : null }

const STATUS_MAP = {
  'Active': { label: 'For Sale', cls: 'bg-green-50 text-green-700 border-green-200' },
  'Pending': { label: 'Pending', cls: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
  'Sold': { label: 'Sold', cls: 'bg-red-50 text-red-600 border-red-200' },
}

export default function BuyPage() {
  const [search, setSearch]     = useState('San Diego, CA')
  const [listings, setListings] = useState([])
  const [loading, setLoading]   = useState(true)
  const [filters, setFilters]   = useState({ minBeds:'', maxPrice:'' })

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

  const filtered = listings.filter(l => {
    if (filters.minBeds && (l.beds || 0) < parseInt(filters.minBeds)) return false
    if (filters.maxPrice && (l.price || 0) > parseInt(filters.maxPrice)) return false
    return true
  })

  return (
    <div>
      <div className="bg-[#1a1a2e] py-10 px-6">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-black text-white mb-5">Find Your Dream Home</h1>
          <div className="flex gap-2">
            <div className="flex-1 flex items-center gap-3 bg-white rounded-xl px-4">
              <Search className="w-4 h-4 text-[#9ca3af] flex-shrink-0"/>
              <input value={search} onChange={e => setSearch(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && fetchListings(search)}
                placeholder="City, ZIP, Neighborhood..."
                className="flex-1 py-3.5 text-sm text-[#1a1a2e] placeholder-[#9ca3af] outline-none bg-transparent"/>
            </div>
            <button onClick={() => fetchListings(search)}
              className="px-6 py-3.5 bg-[#1877F2] hover:bg-[#1665d8] text-white font-bold text-sm rounded-xl transition-colors">
              Search
            </button>
          </div>
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

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-[#1a1a2e] font-bold">
            {loading ? 'Loading...' : `${filtered.length} homes`}
            <span className="text-[#65676b] font-normal text-sm ml-2">in {search}</span>
          </h2>
          <span className="text-xs text-[#9ca3af] flex items-center gap-1"><Clock className="w-3 h-3"/> Live from Redfin</span>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array.from({length:6}).map((_,i) => (
              <div key={i} className="bg-[#f8f9fa] rounded-2xl h-80 animate-pulse border border-[#e4e6eb]"/>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <Home className="w-10 h-10 text-[#e4e6eb] mx-auto mb-3"/>
            <p className="text-[#65676b]">No listings found. Try a different search.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map((l, i) => {
              const statusInfo = STATUS_MAP[l.status] || STATUS_MAP['Active']
              // Use Redfin's native URL directly
              const propLink = l.url ? `/homes${l.url}` : '#'
              return (
                <Link key={i} href={propLink}
                  className="bg-white rounded-2xl border border-[#e4e6eb] overflow-hidden hover:shadow-xl transition-all duration-300 group block">
                  <div className="relative h-52 overflow-hidden bg-[#f0f2f5]">
                    {l.photo ? (
                      <img src={l.photo} alt={l.address} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"/>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center"><Home className="w-10 h-10 text-[#c4c9d0]"/></div>
                    )}
                    <div className="absolute top-3 left-3 flex gap-1.5 flex-wrap">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${statusInfo.cls}`}>{statusInfo.label}</span>
                      {l.is_new_construction && <span className="text-[10px] bg-blue-600 text-white px-2 py-0.5 rounded-full font-bold">New</span>}
                      {l.open_house && <span className="text-[10px] bg-green-600 text-white px-2 py-0.5 rounded-full font-bold">Open House</span>}
                    </div>
                    <div className="absolute top-3 right-3 flex gap-1.5">
                      {l.has_3d_tour && <span className="bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded font-bold flex items-center gap-0.5"><Box className="w-2.5 h-2.5"/>3D</span>}
                      {l.has_virtual_tour && <span className="bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded font-bold flex items-center gap-0.5"><Video className="w-2.5 h-2.5"/>Tour</span>}
                      {l.price_reduced && <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold flex items-center gap-0.5"><TrendingDown className="w-2.5 h-2.5"/>Reduced</span>}
                    </div>
                    {l.days_on_market != null && (
                      <div className="absolute bottom-3 left-3 bg-black/50 text-white text-[10px] px-2 py-0.5 rounded-full">{l.days_on_market}d on market</div>
                    )}
                  </div>
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <div className="text-xl font-black text-[#1a1a2e]">{fmt(l.price)}</div>
                      {l.price_per_sqft && <div className="text-[10px] text-[#9ca3af] mt-1">{fmt(l.price_per_sqft)}/sqft</div>}
                    </div>
                    <div className="text-sm font-semibold text-[#444] truncate">{l.address}</div>
                    <div className="text-xs text-[#9ca3af] flex items-center gap-1 mt-0.5 mb-3">
                      <MapPin className="w-3 h-3"/>{l.city}, {l.state} {l.zip}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-[#65676b] border-t border-[#f0f2f5] pt-3">
                      {l.beds   && <span className="flex items-center gap-1"><Bed className="w-3.5 h-3.5"/>{l.beds} bd</span>}
                      {l.baths  && <span className="flex items-center gap-1"><Bath className="w-3.5 h-3.5"/>{l.baths} ba</span>}
                      {l.sqft   && <span className="flex items-center gap-1"><Square className="w-3.5 h-3.5"/>{fmtNum(l.sqft)} sqft</span>}
                    </div>
                    {l.open_house && (
                      <div className="mt-2 text-[10px] text-green-700 bg-green-50 rounded-lg px-2 py-1 border border-green-200 font-semibold">
                        Open: {l.open_house}
                      </div>
                    )}
                  </div>
                </Link>
              )
            })}
          </div>
        )}

        {!loading && listings.length > 0 && (
          <div className="mt-8 text-center">
            <p className="text-xs text-[#9ca3af] mb-4">Live listings from Redfin · Sign up to save searches and get instant alerts</p>
            <Link href="/auth/signup" className="inline-flex items-center gap-2 px-6 py-3 bg-[#1877F2] text-white font-bold rounded-xl text-sm hover:bg-[#1665d8] transition-colors">
              <Zap className="w-4 h-4"/> Get Instant Alerts
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
