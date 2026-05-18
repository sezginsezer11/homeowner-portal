'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Home, Bed, Bath, Square, Calendar, MapPin, TrendingUp, DollarSign, Volume2, Car, ChevronRight, RefreshCw, Clock, Droplets, Bike, Train, Phone, Building2, TrendingDown, Flame } from 'lucide-react'

function fmt(n) { return n ? '$' + Math.round(n).toLocaleString('en-US') : '—' }
function fmtNum(n) { return n ? Number(n).toLocaleString('en-US') : '—' }

const STATUS_STYLES = {
  active:     'bg-green-50 text-green-700 border-green-200',
  pending:    'bg-yellow-50 text-yellow-700 border-yellow-200',
  sold:       'bg-red-50 text-red-700 border-red-200',
  off_market: 'bg-gray-50 text-gray-600 border-gray-200',
  unknown:    'bg-gray-50 text-gray-500 border-gray-200',
}

function ScoreBar({ label, score, icon: Icon, color }) {
  if (!score) return null
  return (
    <div className="flex items-center justify-between py-1.5">
      <span className="text-xs text-[#65676b] flex items-center gap-1.5">
        <Icon className="w-3.5 h-3.5" />{label}
      </span>
      <div className="flex items-center gap-2">
        <div className="h-1.5 w-24 bg-[#f0f2f5] rounded-full overflow-hidden">
          <div className={`h-full rounded-full ${color}`} style={{width:`${score}%`}}/>
        </div>
        <span className="text-xs font-bold text-[#1a1a2e] w-6 text-right">{score}</span>
      </div>
    </div>
  )
}

export default function PropertyPageClient({ profile: initialProfile, slug, parsed, state, city, addressZip }) {
  const [profile, setProfile] = useState(initialProfile)
  const [loading, setLoading]  = useState(!initialProfile)
  const [activePhoto, setActivePhoto] = useState(0)

  useEffect(() => {
    if (!initialProfile) {
      fetch(`/api/property-profile?address=${encodeURIComponent(parsed.address)}&city=${encodeURIComponent(parsed.city)}&state=${state}&zip=${parsed.zip}`)
        .then(r => r.json())
        .then(data => { setProfile(data); setLoading(false) })
        .catch(() => setLoading(false))
    }
  }, [])

  const refreshData = () => {
    setLoading(true)
    fetch(`/api/property-profile?address=${encodeURIComponent(parsed.address)}&city=${encodeURIComponent(parsed.city)}&state=${state}&zip=${parsed.zip}&force=true`)
      .then(r => r.json())
      .then(data => { setProfile(data); setLoading(false) })
      .catch(() => setLoading(false))
  }

  const photos = profile?.photos || []
  const status = profile?.listing_status || 'unknown'
  const statusLabel = { active:'For Sale', pending:'Pending', sold:'Sold', off_market:'Off Market', unknown:'Unknown' }[status] || 'Unknown'

  if (loading) return (
    <div className="max-w-6xl mx-auto px-6 py-20 text-center">
      <div className="w-10 h-10 border-2 border-[#1877F2] border-t-transparent rounded-full animate-spin mx-auto mb-4"/>
      <p className="text-[#65676b]">Loading property data...</p>
    </div>
  )

  if (!profile) return (
    <div className="max-w-6xl mx-auto px-6 py-20 text-center">
      <Home className="w-12 h-12 text-[#e4e6eb] mx-auto mb-4"/>
      <h2 className="text-xl font-bold text-[#1a1a2e] mb-2">Property not found</h2>
      <p className="text-[#65676b] text-sm mb-5">We couldn't find data for this address.</p>
      <Link href="/buy" className="px-6 py-3 bg-[#1877F2] text-white rounded-xl font-bold text-sm hover:bg-[#1665d8] transition-colors">
        Browse Listings
      </Link>
    </div>
  )

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 pb-20">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-xs text-[#65676b] mb-4 flex-wrap">
        <Link href="/" className="hover:text-[#1877F2]">Home</Link>
        <ChevronRight className="w-3 h-3"/>
        <Link href="/buy" className="hover:text-[#1877F2]">Buy</Link>
        <ChevronRight className="w-3 h-3"/>
        <span>{state}</span>
        <ChevronRight className="w-3 h-3"/>
        <span>{parsed.city}</span>
        <ChevronRight className="w-3 h-3"/>
        <span className="text-[#1a1a2e] font-medium">{parsed.address}</span>
      </div>

      {/* Photos */}
      {photos.length > 0 ? (
        <div className="grid grid-cols-4 gap-2 h-64 sm:h-[380px] mb-6 rounded-2xl overflow-hidden">
          <div className="col-span-2 row-span-2 cursor-pointer">
            <img src={photos[activePhoto]} alt="Property" className="w-full h-full object-cover hover:opacity-95 transition-opacity"/>
          </div>
          {photos.slice(1, 5).map((photo, i) => (
            <div key={i} className="cursor-pointer overflow-hidden" onClick={() => setActivePhoto(i + 1)}>
              <img src={photo} alt={`View ${i+2}`} className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"/>
            </div>
          ))}
        </div>
      ) : (
        <div className="h-48 bg-[#f0f2f5] rounded-2xl flex items-center justify-center mb-6 border border-[#e4e6eb]">
          <Home className="w-12 h-12 text-[#9ca3af]"/>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Main */}
        <div className="lg:col-span-2 space-y-4">
          {/* Header */}
          <div className="bg-white rounded-2xl border border-[#e4e6eb] shadow-card p-5">
            <div className="flex items-start justify-between gap-3 flex-wrap mb-3">
              <div>
                {profile.list_price && <div className="text-3xl font-black text-[#1a1a2e]">{fmt(profile.list_price)}</div>}
                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${STATUS_STYLES[status]}`}>{statusLabel}</span>
                  {profile.days_on_market && <span className="text-xs text-[#65676b] flex items-center gap-1"><Clock className="w-3 h-3"/>{profile.days_on_market} days on market</span>}
                  {profile.price_reduced && <span className="text-xs text-red-600 font-semibold flex items-center gap-1"><TrendingDown className="w-3 h-3"/>Price Reduced</span>}
                  {profile.hot_market_info && <span className="text-xs text-orange-600 font-semibold flex items-center gap-1"><Flame className="w-3 h-3"/>Hot Market</span>}
                </div>
              </div>
              <button onClick={refreshData} disabled={loading}
                className="flex items-center gap-1.5 text-xs text-[#65676b] hover:text-[#1877F2] px-3 py-1.5 border border-[#e4e6eb] rounded-lg hover:border-[#1877F2] transition-all">
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`}/> Refresh
              </button>
            </div>
            <div className="flex items-center gap-2 text-[#65676b]">
              <MapPin className="w-4 h-4 text-[#1877F2] flex-shrink-0"/>
              <h1 className="text-base font-bold text-[#1a1a2e]">
                {parsed.address}, {parsed.city}, {state} {parsed.zip}
                {parsed.unit && <span className="text-[#65676b] font-normal"> Unit {parsed.unit}</span>}
              </h1>
            </div>
          </div>

          {/* Property details */}
          <div className="bg-white rounded-2xl border border-[#e4e6eb] shadow-card p-5">
            <h2 className="font-bold text-[#1a1a2e] mb-4">Property Details</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
              {[
                { icon:Bed,     label:'Bedrooms',  value: profile.beds || '—' },
                { icon:Bath,    label:'Bathrooms', value: profile.baths || '—' },
                { icon:Square,  label:'Sq Ft',     value: profile.sqft ? fmtNum(profile.sqft) : '—' },
                { icon:Calendar,label:'Year Built', value: profile.year_built || '—' },
              ].map(({icon:Icon, label, value}) => (
                <div key={label} className="bg-[#f8f9fa] rounded-xl p-3 text-center border border-[#e4e6eb]">
                  <Icon className="w-4 h-4 text-[#1877F2] mx-auto mb-1"/>
                  <div className="text-[10px] text-[#65676b] uppercase tracking-wider">{label}</div>
                  <div className="font-bold text-[#1a1a2e] text-sm mt-0.5">{value}</div>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-x-4 text-sm border-t border-[#f0f2f5] pt-3">
              {[
                ['Property Type', profile.property_type],
                ['Lot Size',      profile.lot_size ? `${fmtNum(profile.lot_size)} sqft` : null],
                ['Stories',       profile.stories],
                ['Parking',       profile.parking],
                ['HOA Fee',       profile.hoa_fee ? `${fmt(profile.hoa_fee)}/mo` : null],
                ['Heating',       profile.heating],
                ['Cooling',       profile.cooling],
                ['Flood Zone',    profile.flood_zone],
                ['MLS ID',        profile.mls_id],
              ].filter(([,v]) => v).map(([k,v]) => (
                <div key={k} className="flex justify-between py-1.5 border-b border-[#f0f2f5]">
                  <span className="text-[#65676b] text-xs">{k}</span>
                  <span className="text-[#1a1a2e] text-xs font-semibold">{v}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Sale history */}
          {profile.sold_history?.length > 0 && (
            <div className="bg-white rounded-2xl border border-[#e4e6eb] shadow-card p-5">
              <h2 className="font-bold text-[#1a1a2e] mb-3">Sale History</h2>
              <div className="space-y-2">
                {profile.sold_history.slice(0,5).map((sale, i) => (
                  <div key={i} className="flex items-center justify-between py-2 border-b border-[#f0f2f5] last:border-0">
                    <span className="text-[#65676b] text-xs">{sale.type || 'Sale'}</span>
                    <div className="text-right">
                      <div className="text-xs font-bold text-[#1a1a2e]">{sale.price ? fmt(sale.price) : '—'}</div>
                      <div className="text-[10px] text-[#9ca3af]">{sale.date || ''}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tax history */}
          {profile.tax_history?.length > 0 && (
            <div className="bg-white rounded-2xl border border-[#e4e6eb] shadow-card p-5">
              <h2 className="font-bold text-[#1a1a2e] mb-3">Tax History</h2>
              <div className="space-y-2">
                {profile.tax_history.slice(0,5).map((tax, i) => (
                  <div key={i} className="flex items-center justify-between py-2 border-b border-[#f0f2f5] last:border-0">
                    <span className="text-[#65676b] text-xs">{tax.year || tax.taxYear || '—'}</span>
                    <span className="text-xs font-bold text-[#1a1a2e]">{tax.amount ? fmt(tax.amount) : tax.taxAmount ? fmt(tax.taxAmount) : '—'}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Listing agent */}
          {profile.listing_agent && (
            <div className="bg-white rounded-2xl border border-[#e4e6eb] shadow-card p-5">
              <h2 className="font-bold text-[#1a1a2e] mb-3">Listed By</h2>
              <div className="flex items-center gap-3">
                {profile.listing_agent.photo ? (
                  <img src={profile.listing_agent.photo} alt="" className="w-12 h-12 rounded-full object-cover border border-[#e4e6eb]"/>
                ) : (
                  <div className="w-12 h-12 rounded-full bg-[#e7f0fd] flex items-center justify-center text-[#1877F2] font-bold text-lg flex-shrink-0">
                    {(profile.listing_agent.name || 'A').charAt(0)}
                  </div>
                )}
                <div>
                  <div className="font-bold text-[#1a1a2e]">{profile.listing_agent.name}</div>
                  {profile.listing_agent.company && <div className="text-[#65676b] text-xs flex items-center gap-1"><Building2 className="w-3 h-3"/>{profile.listing_agent.company}</div>}
                  {profile.listing_agent.phone && <div className="text-[#1877F2] text-xs flex items-center gap-1 mt-0.5"><Phone className="w-3 h-3"/>{profile.listing_agent.phone}</div>}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* AVM */}
          {profile.estimated_value && (
            <div className="bg-white rounded-2xl border border-[#e4e6eb] shadow-card p-5">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4 text-[#1877F2]"/>
                <h3 className="font-bold text-[#1a1a2e] text-sm">Estimated Value</h3>
              </div>
              <div className="text-2xl font-black text-[#1877F2]">{fmt(profile.estimated_value)}</div>
              {(profile.avm_low || profile.avm_high) && (
                <div className="text-xs text-[#65676b] mt-0.5">{fmt(profile.avm_low)} – {fmt(profile.avm_high)}</div>
              )}
              <Link href="/auth/signup"
                className="mt-3 flex items-center justify-center gap-2 w-full py-2.5 bg-[#1877F2] hover:bg-[#1665d8] text-white rounded-xl text-xs font-bold transition-colors">
                Track This Home Free
              </Link>
            </div>
          )}

          {/* Scores */}
          {(profile.walk_score || profile.transit_score || profile.bike_score || profile.noise_score) && (
            <div className="bg-white rounded-2xl border border-[#e4e6eb] shadow-card p-5">
              <h3 className="font-bold text-[#1a1a2e] text-sm mb-3">Neighborhood Scores</h3>
              <ScoreBar label="Walk Score" score={profile.walk_score} icon={Home} color="bg-green-500"/>
              <ScoreBar label="Transit Score" score={profile.transit_score} icon={Train} color="bg-blue-500"/>
              <ScoreBar label="Bike Score" score={profile.bike_score} icon={Bike} color="bg-purple-500"/>
              {profile.noise_score && (
                <div className="flex items-center justify-between py-1.5">
                  <span className="text-xs text-[#65676b] flex items-center gap-1.5"><Volume2 className="w-3.5 h-3.5"/>Noise</span>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${profile.noise_score < 4 ? 'bg-green-50 text-green-700' : profile.noise_score < 7 ? 'bg-yellow-50 text-yellow-700' : 'bg-red-50 text-red-700'}`}>
                    {profile.noise_score < 4 ? 'Quiet' : profile.noise_score < 7 ? 'Moderate' : 'Loud'}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Flood risk */}
          {profile.flood_zone && (
            <div className="bg-white rounded-2xl border border-[#e4e6eb] shadow-card p-5">
              <h3 className="font-bold text-[#1a1a2e] text-sm mb-2 flex items-center gap-2"><Droplets className="w-4 h-4 text-blue-500"/>Flood Risk</h3>
              <div className="text-sm font-semibold text-[#1a1a2e]">{profile.flood_zone}</div>
              {profile.flood_risk && <div className="text-xs text-[#65676b] mt-0.5">{profile.flood_risk}</div>}
            </div>
          )}

          {/* Get Offer CTA */}
          <div className="bg-gradient-to-br from-[#1a1a2e] to-[#344a57] rounded-2xl p-5 text-white">
            <div className="text-sm font-bold mb-1">Own this home?</div>
            <p className="text-gray-300 text-xs mb-4">Get cash offers from qualified buyers on 360Everywhere.</p>
            <Link href="/auth/signup?intent=offer"
              className="block text-center py-2.5 bg-[#1877F2] hover:bg-[#1665d8] text-white text-xs font-bold rounded-xl transition-colors">
              ⚡ Get an Offer
            </Link>
          </div>

          {/* Data freshness */}
          <div className="bg-[#f8f9fa] rounded-xl p-3 border border-[#e4e6eb]">
            <div className="text-[10px] text-[#9ca3af] space-y-1">
              {profile.listing_status_updated_at && (
                <div>Listing status: {new Date(profile.listing_status_updated_at).toLocaleDateString('en-US', {month:'short', day:'numeric', hour:'2-digit', minute:'2-digit'})}</div>
              )}
              {profile.building_data_fetched_at && (
                <div>Property data: {new Date(profile.building_data_fetched_at).toLocaleDateString('en-US', {month:'short', day:'numeric', year:'numeric'})}</div>
              )}
              {profile.cached && <div className="text-[#1877F2] font-semibold">Served from cache</div>}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
