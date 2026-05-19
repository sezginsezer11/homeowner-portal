'use client'
import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { Search, MapPin, Bed, Bath, Square, Clock, TrendingDown, Home, Zap, Video, Box, SlidersHorizontal, Sparkles, X, ChevronDown, Filter } from 'lucide-react'

function fmt(n) { return n ? '$' + Math.round(n).toLocaleString('en-US') : '—' }
function fmtNum(n) { return n ? Number(n).toLocaleString('en-US') : null }

const STATUS_MAP = {
  'Active':  { label: 'For Sale', cls: 'bg-green-50 text-green-700 border-green-200' },
  'Pending': { label: 'Pending',  cls: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
  'Sold':    { label: 'Sold',     cls: 'bg-red-50 text-red-600 border-red-200' },
}

const AI_EXAMPLES = [
  'Carmel Valley 3 bed under $2M with a view',
  'New construction condo in downtown San Diego',
  'La Jolla single family with pool and ocean view',
  'Under $700k 2 bed 2 bath near good schools',
]

// Safely convert any value to string
function safeStr(v) {
  if (v == null) return ''
  if (typeof v === 'string') return v
  if (typeof v === 'object') {
    if ('value' in v) return v.value || ''
    if (v.streetNumber) return [v.streetNumber, v.streetName, v.streetType, v.unitValue].filter(Boolean).join(' ')
    return ''
  }
  return String(v)
}

function ListingCard({ l }) {
  const address = safeStr(l.address)
  const city    = safeStr(l.city)
  const state   = safeStr(l.state)
  const zip     = safeStr(l.zip)
  const statusInfo = STATUS_MAP[l.status] || STATUS_MAP['Active']
  const propLink = l.url ? `/homes${l.url}` : '#'

  return (
    <Link href={propLink}
      className="bg-white rounded-2xl border border-[#e4e6eb] overflow-hidden hover:shadow-xl transition-all duration-300 group block">
      <div className="relative h-52 overflow-hidden bg-[#f0f2f5]">
        {l.photo ? (
          <img src={l.photo} alt={address} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"/>
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
        <div className="text-sm font-semibold text-[#444] truncate">{address}</div>
        <div className="text-xs text-[#9ca3af] flex items-center gap-1 mt-0.5 mb-3">
          <MapPin className="w-3 h-3"/>{city}, {state} {zip}
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
}

export default function BuyPage() {
  const [mode, setMode]           = useState('traditional') // 'traditional' | 'ai'
  const [search, setSearch]       = useState('San Diego, CA')
  const [aiQuery, setAiQuery]     = useState('')
  const [listings, setListings]   = useState([])
  const [loading, setLoading]     = useState(true)
  const [aiLoading, setAiLoading] = useState(false)
  const [aiFilters, setAiFilters] = useState(null)
  const [showFilters, setShowFilters] = useState(false)
  const [region, setRegion]       = useState('')
  const [filters, setFilters] = useState({
    minBeds: '', minBaths: '', minPrice: '', maxPrice: '', propType: '', sort: 'relevant'
  })

  const fetchListings = async (query = 'San Diego, CA') => {
    setLoading(true)
    try {
      const res = await fetch(`/api/listings/search?query=${encodeURIComponent(query)}&limit=12`)
      const data = await res.json()
      setListings(data.listings || [])
      setRegion(data.region || query)
    } catch { setListings([]) }
    finally { setLoading(false) }
  }

  const handleAISearch = async () => {
    if (!aiQuery.trim()) return
    setAiLoading(true)
    setListings([])
    try {
      const res = await fetch('/api/search/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: aiQuery })
      })
      const data = await res.json()
      setListings(data.listings || [])
      setAiFilters(data.filters)
      setRegion(data.region || '')
    } catch { setListings([]) }
    finally { setAiLoading(false) }
  }

  useEffect(() => { fetchListings() }, [])

  const filtered = mode === 'ai' ? listings : listings.filter(l => {
    if (filters.minBeds  && (l.beds  || 0) < parseInt(filters.minBeds))    return false
    if (filters.minBaths && (l.baths || 0) < parseFloat(filters.minBaths)) return false
    if (filters.minPrice && (l.price || 0) < parseInt(filters.minPrice))   return false
    if (filters.maxPrice && (l.price || 0) > parseInt(filters.maxPrice))   return false
    if (filters.propType && l.property_type !== filters.propType)          return false
    return true
  })

  return (
    <div>
      {/* Hero */}
      <div className="bg-[#1a1a2e] py-10 px-6">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-3xl font-black text-white mb-5">Find Your Dream Home</h1>

          {/* Mode toggle */}
          <div className="flex gap-1 bg-white/10 rounded-xl p-1 w-fit mb-4">
            <button onClick={() => setMode('traditional')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${mode==='traditional' ? 'bg-white text-[#1a1a2e]' : 'text-white/70 hover:text-white'}`}>
              <SlidersHorizontal className="w-4 h-4"/> Traditional Search
            </button>
            <button onClick={() => setMode('ai')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${mode==='ai' ? 'bg-[#1877F2] text-white' : 'text-white/70 hover:text-white'}`}>
              <Sparkles className="w-4 h-4"/> AI Search
            </button>
          </div>

          {/* Traditional Search */}
          {mode === 'traditional' && (
            <div className="space-y-3">
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
                <button onClick={() => setShowFilters(!showFilters)}
                  className={`px-4 py-3.5 rounded-xl font-bold text-sm transition-colors flex items-center gap-2 ${showFilters ? 'bg-[#1877F2] text-white' : 'bg-white/10 text-white hover:bg-white/20'}`}>
                  <Filter className="w-4 h-4"/> Filters
                </button>
              </div>

              {/* Filter panel */}
              {showFilters && (
                <div className="bg-white rounded-2xl p-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                  {[
                    { label:'Min Beds', field:'minBeds', type:'select', options:['','1','2','3','4','5+'] },
                    { label:'Min Baths', field:'minBaths', type:'select', options:['','1','1.5','2','3','4+'] },
                    { label:'Min Price', field:'minPrice', type:'select', options:['','$200k','$400k','$600k','$800k','$1M'], values:['','200000','400000','600000','800000','1000000'] },
                    { label:'Max Price', field:'maxPrice', type:'select', options:['','$500k','$750k','$1M','$1.5M','$2M','$3M+'], values:['','500000','750000','1000000','1500000','2000000','3000000'] },
                    { label:'Type', field:'propType', type:'select', options:['','Single Family','Condo/Townhome','Townhome','Multi-Family'] },
                  ].map(f => (
                    <div key={f.field}>
                      <label className="block text-[10px] font-bold text-[#65676b] uppercase tracking-wider mb-1">{f.label}</label>
                      <select value={filters[f.field]}
                        onChange={e => setFilters(p => ({...p, [f.field]: e.target.value}))}
                        className="w-full text-xs border border-[#e4e6eb] rounded-lg px-2 py-2 text-[#1a1a2e] outline-none focus:border-[#1877F2]">
                        {f.options.map((opt, i) => (
                          <option key={opt} value={f.values ? f.values[i] : opt}>{opt || 'Any'}</option>
                        ))}
                      </select>
                    </div>
                  ))}
                  <div className="flex items-end">
                    <button onClick={() => setFilters({ minBeds:'', minBaths:'', minPrice:'', maxPrice:'', propType:'', sort:'relevant' })}
                      className="w-full py-2 text-xs text-red-500 hover:text-red-700 font-semibold border border-red-200 rounded-lg hover:bg-red-50 transition-colors">
                      Clear All
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* AI Search */}
          {mode === 'ai' && (
            <div className="space-y-3">
              <div className="bg-gradient-to-r from-[#1877F2]/20 to-purple-600/20 rounded-2xl p-0.5">
                <div className="bg-[#1a1a2e] rounded-[14px] flex items-center gap-3 px-4">
                  <Sparkles className="w-5 h-5 text-[#1877F2] flex-shrink-0"/>
                  <input value={aiQuery} onChange={e => setAiQuery(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleAISearch()}
                    placeholder="Describe your dream home in plain English..."
                    className="flex-1 py-4 text-sm text-white placeholder-white/40 outline-none bg-transparent"/>
                  {aiQuery && (
                    <button onClick={() => setAiQuery('')} className="text-white/40 hover:text-white/70 transition-colors">
                      <X className="w-4 h-4"/>
                    </button>
                  )}
                  <button onClick={handleAISearch} disabled={!aiQuery.trim() || aiLoading}
                    className="px-5 py-2.5 bg-[#1877F2] hover:bg-[#1665d8] text-white font-bold text-sm rounded-xl transition-colors disabled:opacity-40 flex items-center gap-2">
                    {aiLoading ? <><div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"/>Searching...</> : <><Sparkles className="w-3.5 h-3.5"/>Search</>}
                  </button>
                </div>
              </div>

              {/* Example queries */}
              <div className="flex flex-wrap gap-2">
                <span className="text-white/40 text-xs font-medium flex items-center">Try:</span>
                {AI_EXAMPLES.map(ex => (
                  <button key={ex} onClick={() => { setAiQuery(ex); }}
                    className="text-xs text-white/60 hover:text-white bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-full transition-all">
                    {ex}
                  </button>
                ))}
              </div>

              {/* AI extracted filters */}
              {aiFilters && (
                <div className="flex flex-wrap gap-2">
                  <span className="text-white/40 text-xs">AI found:</span>
                  {aiFilters.location && <span className="text-xs bg-[#1877F2]/30 text-[#60a5fa] px-2 py-1 rounded-full"><MapPin className="w-3 h-3 inline mr-1"/>{aiFilters.location}</span>}
                  {aiFilters.minBeds && <span className="text-xs bg-[#1877F2]/30 text-[#60a5fa] px-2 py-1 rounded-full">{aiFilters.minBeds}+ beds</span>}
                  {aiFilters.maxPrice && <span className="text-xs bg-[#1877F2]/30 text-[#60a5fa] px-2 py-1 rounded-full">Under {fmt(aiFilters.maxPrice)}</span>}
                  {aiFilters.propType && <span className="text-xs bg-[#1877F2]/30 text-[#60a5fa] px-2 py-1 rounded-full">{aiFilters.propType}</span>}
                  {aiFilters.keywords?.map(k => <span key={k} className="text-xs bg-purple-500/30 text-purple-300 px-2 py-1 rounded-full">{k}</span>)}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Results */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-[#1a1a2e] font-bold">
            {(loading || aiLoading) ? 'Searching...' : `${filtered.length} homes`}
            {region && <span className="text-[#65676b] font-normal text-sm ml-2">in {region}</span>}
          </h2>
          <span className="text-xs text-[#9ca3af] flex items-center gap-1.5">
            <Clock className="w-3 h-3"/> Live from Redfin
          </span>
        </div>

        {(loading || aiLoading) ? (
          <div className="space-y-4">
            {aiLoading && (
              <div className="flex items-center gap-3 bg-[#e7f0fd] border border-[#1877F2]/20 rounded-xl p-4">
                <div className="w-5 h-5 border-2 border-[#1877F2] border-t-transparent rounded-full animate-spin flex-shrink-0"/>
                <div>
                  <div className="text-[#1877F2] font-bold text-sm">AI is analyzing your search...</div>
                  <div className="text-[#65676b] text-xs">Understanding your requirements and finding matching homes</div>
                </div>
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {Array.from({length:6}).map((_,i) => (
                <div key={i} className="bg-[#f8f9fa] rounded-2xl h-80 animate-pulse border border-[#e4e6eb]"/>
              ))}
            </div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <Home className="w-10 h-10 text-[#e4e6eb] mx-auto mb-3"/>
            <p className="text-[#1a1a2e] font-bold mb-1">No homes found</p>
            <p className="text-[#65676b] text-sm">
              {mode === 'ai' ? 'Try rephrasing your search or being less specific' : 'Try adjusting your filters or searching a different area'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map((l, i) => <ListingCard key={i} l={l} />)}
          </div>
        )}

        {!loading && !aiLoading && listings.length > 0 && (
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
