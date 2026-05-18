'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Home, Bed, Bath, Square, Calendar, MapPin, TrendingUp, DollarSign, School, Volume2, Car, ChevronRight, RefreshCw, ExternalLink, ArrowLeft, CheckCircle, Clock } from 'lucide-react'

function fmt(n) { return n ? '$' + Math.round(n).toLocaleString('en-US') : '—' }
function fmtNum(n) { return n ? Number(n).toLocaleString('en-US') : '—' }

const STATUS_STYLES = {
  active:     'bg-green-50 text-green-700 border-green-200',
  pending:    'bg-yellow-50 text-yellow-700 border-yellow-200',
  sold:       'bg-red-50 text-red-700 border-red-200',
  off_market: 'bg-gray-50 text-gray-600 border-gray-200',
  unknown:    'bg-gray-50 text-gray-500 border-gray-200',
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

  const photos = profile?.photos || []
  const status = profile?.listing_status || 'unknown'
  const statusLabel = { active:'For Sale', pending:'Pending', sold:'Sold', off_market:'Off Market', unknown:'Unknown' }[status] || 'Unknown'

  if (loading) return (
    <div className="max-w-6xl mx-auto px-6 py-20 text-center">
      <div className="w-10 h-10 border-2 border-[#1877F2] border-t-transparent rounded-full animate-spin mx-auto mb-4"/>
      <p className="text-[#65676b]">Loading property data...</p>
    </div>
  )

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 pb-20">

      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-[#65676b] mb-4 flex-wrap">
        <Link href="/" className="hover:text-[#1877F2] transition-colors">Home</Link>
        <ChevronRight className="w-3 h-3"/>
        <Link href={`/buy`} className="hover:text-[#1877F2] transition-colors">Buy</Link>
        <ChevronRight className="w-3 h-3"/>
        <span>{state}</span>
        <ChevronRight className="w-3 h-3"/>
        <span>{parsed.city}</span>
        <ChevronRight className="w-3 h-3"/>
        <span className="text-[#1a1a2e] font-medium">{parsed.address}</span>
      </div>

      {/* Photos */}
      {photos.length > 0 ? (
        <div className="grid grid-cols-4 gap-2 h-72 sm:h-96 mb-6 rounded-2xl overflow-hidden">
          <div className="col-span-2 row-span-2">
            <img src={photos[activePhoto]} alt="Property" className="w-full h-full object-cover"/>
          </div>
          {photos.slice(1,5).map((photo, i) => (
            <div key={i} className="cursor-pointer hover:opacity-90 transition-opacity" onClick={() => setActivePhoto(i+1)}>
              <img src={photo} alt={`View ${i+2}`} className="w-full h-full object-cover"/>
            </div>
          ))}
        </div>
      ) : (
        <div className="h-48 bg-[#f0f2f5] rounded-2xl flex items-center justify-center mb-6 border border-[#e4e6eb]">
          <Home className="w-12 h-12 text-[#9ca3af]"/>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Main info */}
        <div className="lg:col-span-2 space-y-5">

          {/* Header */}
          <div>
            <div className="flex items-start justify-between gap-3 flex-wrap mb-2">
              <div>
                {profile?.list_price && (
                  <div className="text-3xl font-black text-[#1a1a2e]">{fmt(profile.list_price)}</div>
                )}
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${STATUS_STYLES[status]}`}>{statusLabel}</span>
                  {profile?.days_on_market && <span className="text-xs text-[#65676b] flex items-center gap-1"><Clock className="w-3 h-3"/>{profile.days_on_market} days on market</span>}
                  {profile?.price_reduced && <span className="text-xs text-red-600 font-semibold">Price Reduced</span>}
                </div>
              </div>
              <button onClick={() => {
                fetch(`/api/property-profile?address=${encodeURIComponent(parsed.address)}&city=${encodeURIComponent(parsed.city)}&state=${state}&zip=${parsed.zip}&force=true`)
                  .then(r => r.json()).then(setProfile)
              }} className="flex items-center gap-1.5 text-xs text-[#65676b] hover:text-[#1877F2] px-3 py-1.5 border border-[#e4e6eb] rounded-lg hover:border-[#1877F2] transition-all">
                <RefreshCw className="w-3.5 h-3.5"/> Refresh
              </button>
            </div>
            <div className="flex items-center gap-2 text-[#65676b]">
              <MapPin className="w-4 h-4 text-[#1877F2] flex-shrink-0"/>
              <h1 className="text-lg font-bold text-[#1a1a2e]">
                {parsed.address}, {parsed.city}, {state} {parsed.zip}
                {parsed.unit && <span className="text-[#65676b] font-normal"> Unit {parsed.unit}</span>}
              </h1>
            </div>
          </div>

          {/* Property details */}
          <div className="bg-white rounded-2xl border border-[#e4e6eb] shadow-card p-5">
            <h2 className="font-bold text-[#1a1a2e] mb-4">Property Details</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
              {[
                { icon:Bed,    label:'Bedrooms',   value: profile?.beds || '—' },
                { icon:Bath,   label:'Bathrooms',  value: profile?.baths || '—' },
                { icon:Square, label:'Sq Ft',      value: profile?.sqft ? fmtNum(profile.sqft) : '—' },
                { icon:Calendar,label:'Year Built', value: profile?.year_built || '—' },
              ].map(({icon:Icon, label, value}) => (
                <div key={label} className="bg-[#f8f9fa] rounded-xl p-3 text-center border border-[#e4e6eb]">
                  <Icon className="w-5 h-5 text-[#1877F2] mx-auto mb-1"/>
                  <div className="text-xs text-[#65676b]">{label}</div>
                  <div className="font-bold text-[#1a1a2e] text-sm">{value}</div>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              {[
                ['Property Type', profile?.property_type],
                ['Lot Size',      profile?.lot_size ? `${fmtNum(profile.lot_size)} sqft` : null],
                ['Parking',       profile?.parking],
                ['HOA Fee',       profile?.hoa_fee ? `${fmt(profile.hoa_fee)}/mo` : null],
                ['Heating',       profile?.heating],
                ['Cooling',       profile?.cooling],
                ['MLS ID',        profile?.mls_id],
              ].filter(([,v]) => v).map(([k,v]) => (
                <div key={k} className="flex justify-between py-1.5 border-b border-[#f0f2f5]">
                  <span className="text-[#65676b] text-xs">{k}</span>
                  <span className="text-[#1a1a2e] text-xs font-semibold">{v}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Description */}
          {profile?.description && (
            <div className="bg-white rounded-2xl border border-[#e4e6eb] shadow-card p-5">
              <h2 className="font-bold text-[#1a1a2e] mb-3">About This Home</h2>
              <p className="text-[#65676b] text-sm leading-relaxed">{profile.description}</p>
            </div>
          )}

          {/* Schools */}
          {profile?.nearby_schools?.length > 0 && (
            <div className="bg-white rounded-2xl border border-[#e4e6eb] shadow-card p-5">
              <h2 className="font-bold text-[#1a1a2e] mb-4 flex items-center gap-2"><School className="w-4 h-4 text-[#1877F2]"/>Nearby Schools</h2>
              <div className="space-y-3">
                {profile.nearby_schools.slice(0,4).map((school, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-[#f8f9fa] rounded-xl border border-[#e4e6eb]">
                    <div>
                      <div className="font-semibold text-[#1a1a2e] text-sm">{school?.name || school}</div>
                      <div className="text-xs text-[#65676b]">{school?.education_levels?.[0] || school?.type}</div>
                    </div>
                    {school?.ratings?.great_schools_rating && (
                      <div className="w-9 h-9 rounded-full bg-[#1877F2] flex items-center justify-center text-white font-bold text-sm">
                        {school.ratings.great_schools_rating}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Similar homes */}
          {profile?.similar_homes?.length > 0 && (
            <div className="bg-white rounded-2xl border border-[#e4e6eb] shadow-card p-5">
              <h2 className="font-bold text-[#1a1a2e] mb-4">Similar Homes Nearby</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {profile.similar_homes.slice(0,6).map((h, i) => (
                  <div key={i} className="border border-[#e4e6eb] rounded-xl overflow-hidden hover:shadow-md transition-all">
                    {h.photo && <img src={h.photo} alt={h.address} className="w-full h-32 object-cover"/>}
                    <div className="p-3">
                      <div className="font-bold text-[#1a1a2e] text-sm">{fmt(h.price)}</div>
                      <div className="text-[#65676b] text-xs truncate mt-0.5">{h.address}</div>
                      <div className="text-[#9ca3af] text-[10px] mt-1 flex gap-2">
                        {h.beds && <span>{h.beds} bd</span>}
                        {h.baths && <span>{h.baths} ba</span>}
                        {h.sqft && <span>{fmtNum(h.sqft)} sqft</span>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">

          {/* AVM / Value */}
          {profile?.estimated_value && (
            <div className="bg-white rounded-2xl border border-[#e4e6eb] shadow-card p-5">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="w-4 h-4 text-[#1877F2]"/>
                <h3 className="font-bold text-[#1a1a2e] text-sm">Estimated Value</h3>
              </div>
              <div className="text-2xl font-black text-[#1877F2]">{fmt(profile.estimated_value)}</div>
              {(profile.avm_low || profile.avm_high) && (
                <div className="text-xs text-[#65676b] mt-1">{fmt(profile.avm_low)} – {fmt(profile.avm_high)}</div>
              )}
              <Link href="/auth/signup" className="mt-3 flex items-center justify-center gap-2 w-full py-2.5 bg-[#1877F2] hover:bg-[#1665d8] text-white rounded-xl text-xs font-bold transition-colors">
                Track This Home Free
              </Link>
            </div>
          )}

          {/* Walk/Noise scores */}
          {(profile?.walk_score || profile?.noise_score) && (
            <div className="bg-white rounded-2xl border border-[#e4e6eb] shadow-card p-5">
              <h3 className="font-bold text-[#1a1a2e] text-sm mb-3">Neighborhood</h3>
              <div className="space-y-2">
                {profile.walk_score && (
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-[#65676b]">Walk Score</span>
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-20 bg-[#f0f2f5] rounded-full overflow-hidden">
                        <div className="h-full bg-green-500 rounded-full" style={{width:`${profile.walk_score}%`}}/>
                      </div>
                      <span className="text-xs font-bold text-[#1a1a2e]">{profile.walk_score}</span>
                    </div>
                  </div>
                )}
                {profile.noise_score && (
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-[#65676b]">Noise Score</span>
                    <div className="flex items-center gap-2">
                      <Volume2 className="w-3.5 h-3.5 text-[#9ca3af]"/>
                      <span className="text-xs font-bold text-[#1a1a2e]">{profile.noise_score}/10</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Listing agent */}
          {profile?.listing_agent && (
            <div className="bg-white rounded-2xl border border-[#e4e6eb] shadow-card p-5">
              <h3 className="font-bold text-[#1a1a2e] text-sm mb-3">Listed By</h3>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#e7f0fd] flex items-center justify-center text-[#1877F2] font-bold flex-shrink-0">
                  {(profile.listing_agent?.name || 'A').charAt(0)}
                </div>
                <div className="min-w-0">
                  <div className="font-semibold text-[#1a1a2e] text-sm truncate">{profile.listing_agent?.name}</div>
                  <div className="text-[#65676b] text-xs">{profile.listing_agent?.office_name}</div>
                </div>
              </div>
            </div>
          )}

          {/* Get Offer CTA */}
          <div className="bg-gradient-to-br from-[#1a1a2e] to-[#344a57] rounded-2xl p-5 text-white">
            <div className="text-sm font-bold mb-1">Own this home?</div>
            <p className="text-gray-300 text-xs mb-4">Get cash offers from qualified buyers on 360Everywhere.</p>
            <Link href="/auth/signup?intent=offer" className="block text-center py-2.5 bg-[#1877F2] hover:bg-[#1665d8] text-white text-xs font-bold rounded-xl transition-colors">
              ⚡ Get an Offer
            </Link>
          </div>

          {/* Data freshness */}
          {profile?.listing_status_updated_at && (
            <div className="text-[10px] text-[#9ca3af] text-center">
              Listing status updated {new Date(profile.listing_status_updated_at).toLocaleDateString('en-US', {month:'short', day:'numeric', hour:'2-digit', minute:'2-digit'})}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
