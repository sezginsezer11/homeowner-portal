'use client'
import { useState } from 'react'
import Link from 'next/link'
import { Search, Home, TrendingUp, DollarSign, Key, Star, ArrowRight, Download, Smartphone, CheckCircle, MapPin, Phone, Mail, ChevronRight } from 'lucide-react'

const TABS = [
  { id: 'buy',        label: 'Buy',           href: '/buy',        placeholder: 'City, Address, School, Agent, ZIP' },
  { id: 'mortgage',   label: 'Mortgage',      href: '/mortgage',   placeholder: 'Enter home price or address' },
  { id: 'sell',       label: 'Sell',          href: '/sell',       placeholder: 'Enter your home address' },
  { id: 'rent',       label: 'Rent',          href: '/rent',       placeholder: 'City, Neighborhood, ZIP' },
  { id: 'homevalue',  label: 'My Home Value', href: '/dashboard/homeowner', placeholder: 'Enter your home address' },
]

const STATS = [
  { value: '50+',   label: 'States Licensed' },
  { value: '2M+',   label: 'Homes Listed' },
  { value: '98%',   label: 'Client Satisfaction' },
  { value: '$4.2B', label: 'Homes Sold' },
]

const FEATURES = [
  { icon: Home,       title: 'Buy Your Dream Home',   desc: 'Search millions of listings with powerful filters. Get alerts the moment your perfect home hits the market.', href: '/buy',      cta: 'Search Homes' },
  { icon: TrendingUp, title: 'Sell for Top Dollar',   desc: 'Get a free home valuation, connect with top agents, and sell faster with our proven marketing strategies.', href: '/sell',     cta: 'Get My Value' },
  { icon: DollarSign, title: 'Smart Mortgage Tools',  desc: 'Compare rates from top lenders, calculate payments, and get pre-approved in minutes.', href: '/mortgage', cta: 'Compare Rates' },
  { icon: Key,        title: 'Find Your Perfect Rental', desc: 'Browse thousands of rentals. Virtual tours, instant applications, and renter protection guaranteed.', href: '/rent',     cta: 'Browse Rentals' },
]

const TESTIMONIALS = [
  { name: 'Sarah M.',    location: 'San Diego, CA', text: 'Found our dream home in 3 weeks. The home value tracker is incredible — we knew exactly when to make our move.', rating: 5 },
  { name: 'James T.',    location: 'Austin, TX',    text: 'Saved $23,000 by using the mortgage comparison tool. Connected with an amazing local agent who really knew the market.', rating: 5 },
  { name: 'Maria L.',    location: 'Miami, FL',     text: 'Sold my condo for $40K over asking. The equity dashboard helped me time the market perfectly.', rating: 5 },
]

export default function HomePageContent() {
  const [activeTab, setActiveTab] = useState('buy')
  const [search, setSearch] = useState('')
  const [agentForm, setAgentForm] = useState({ location:'', email:'', phone:'', help:'', financing: false })
  const [submitted, setSubmitted] = useState(false)

  const currentTab = TABS.find(t => t.id === activeTab)

  return (
    <div>
      {/* HERO */}
      <section className="relative min-h-[600px] flex items-center overflow-hidden">
        {/* Background image */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-black/30 z-10" />
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=1600&q=80')] bg-cover bg-center" />

        <div className="relative z-20 max-w-4xl mx-auto px-6 py-20 w-full">
          <h1 className="text-5xl md:text-6xl font-black text-white leading-tight mb-8">
            Your dream home search<br />has just begun.
          </h1>

          {/* Search tabs */}
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl overflow-hidden shadow-2xl max-w-2xl">
            {/* Tab buttons */}
            <div className="flex overflow-x-auto">
              {TABS.map(tab => (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                  className={`flex-shrink-0 px-5 py-3.5 text-sm font-bold transition-all border-b-2 ${
                    activeTab === tab.id
                      ? 'border-[#1877F2] text-[#1877F2] bg-white'
                      : 'border-transparent text-gray-500 hover:text-gray-800 bg-gray-50/50'
                  }`}>
                  {tab.label}
                </button>
              ))}
            </div>
            {/* Search input */}
            <div className="flex items-center p-3 gap-2">
              <div className="flex-1 flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3">
                <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder={currentTab?.placeholder}
                  className="flex-1 bg-transparent text-gray-800 placeholder-gray-400 text-sm outline-none"
                />
              </div>
              <Link href={`${currentTab?.href}${search ? `?q=${encodeURIComponent(search)}` : ''}`}
                className="w-12 h-12 bg-[#1877F2] hover:bg-[#1665d8] rounded-xl flex items-center justify-center transition-colors flex-shrink-0">
                <Search className="w-5 h-5 text-white" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* STATS */}
      <section className="bg-[#1877F2] py-10">
        <div className="max-w-5xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {STATS.map(s => (
              <div key={s.label}>
                <div className="text-3xl font-black text-white">{s.value}</div>
                <div className="text-blue-200 text-sm mt-1 font-medium">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-black text-[#1a1a2e] mb-4">Everything you need in one place</h2>
            <p className="text-gray-500 text-lg max-w-2xl mx-auto">From finding your first home to managing your investment portfolio — 360Everywhere has you covered.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {FEATURES.map(f => {
              const Icon = f.icon
              return (
                <div key={f.title} className="group bg-white border border-gray-100 rounded-2xl p-6 hover:shadow-xl hover:border-[#1877F2]/20 transition-all duration-300">
                  <div className="w-12 h-12 bg-[#e7f0fd] rounded-xl flex items-center justify-center mb-4 group-hover:bg-[#1877F2] transition-colors">
                    <Icon className="w-6 h-6 text-[#1877F2] group-hover:text-white transition-colors" />
                  </div>
                  <h3 className="text-lg font-bold text-[#1a1a2e] mb-2">{f.title}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed mb-4">{f.desc}</p>
                  <Link href={f.href} className="flex items-center gap-1 text-[#1877F2] text-sm font-bold hover:gap-2 transition-all">
                    {f.cta} <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* HOMEOWNER PORTAL PROMO */}
      <section className="py-20 bg-[#f8f9fa]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="bg-gradient-to-br from-[#1a1a2e] to-[#344a57] rounded-3xl overflow-hidden">
            <div className="grid md:grid-cols-2 gap-0">
              <div className="p-10 md:p-14 flex flex-col justify-center">
                <div className="inline-flex items-center gap-2 bg-[#1877F2]/20 text-[#60a5fa] text-xs font-bold px-3 py-1.5 rounded-full mb-6 w-fit">
                  ✨ FREE FOR HOMEOWNERS
                </div>
                <h2 className="text-4xl font-black text-white leading-tight mb-4">
                  Track your home&apos;s value in real time
                </h2>
                <p className="text-gray-300 text-lg leading-relaxed mb-8">
                  Get live Redfin estimates, track your equity growth, monitor mortgage rates, and connect with your agent — all in one dashboard.
                </p>
                <div className="space-y-3 mb-8">
                  {['Live home valuation from Redfin','Equity tracker & mortgage calculator','Connect with agents & lenders','Rate alerts & refi recommendations'].map(f => (
                    <div key={f} className="flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 text-[#1877F2] flex-shrink-0" />
                      <span className="text-gray-200 text-sm">{f}</span>
                    </div>
                  ))}
                </div>
                <Link href="/auth/signup"
                  className="inline-flex items-center gap-2 bg-[#1877F2] hover:bg-[#1665d8] text-white font-bold px-8 py-4 rounded-xl transition-colors w-fit text-sm">
                  Get Your Free Dashboard <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
              <div className="hidden md:flex items-center justify-center p-10 bg-white/5">
                <div className="bg-white rounded-2xl p-6 shadow-2xl w-full max-w-sm">
                  <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Est. Home Value</div>
                  <div className="text-3xl font-black text-[#1a1a2e] mb-1">$1,248,500</div>
                  <div className="text-green-600 text-sm font-semibold mb-4">↑ $48,500 since purchase</div>
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    {[{l:'Home Equity',v:'$498,500',c:'text-green-600'},{l:'Loan Balance',v:'$750,000',c:'text-gray-800'},{l:'Your Rate',v:'3.25%',c:'text-gray-800'},{l:'Nat\'l Avg',v:'6.87%',c:'text-red-500'}].map(item=>(
                      <div key={item.l} className="bg-gray-50 rounded-xl p-3">
                        <div className="text-[9px] text-gray-400 uppercase tracking-wider">{item.l}</div>
                        <div className={`font-bold text-sm mt-0.5 ${item.c}`}>{item.v}</div>
                      </div>
                    ))}
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-[#1877F2] rounded-full" style={{width:'40%'}} />
                  </div>
                  <div className="text-[10px] text-gray-400 mt-1.5">40% equity ratio</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-4xl font-black text-[#1a1a2e] text-center mb-12">What our clients say</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {TESTIMONIALS.map(t => (
              <div key={t.name} className="bg-[#f8f9fa] rounded-2xl p-6 border border-gray-100">
                <div className="flex gap-1 mb-4">
                  {Array.from({length: t.rating}).map((_, i) => (
                    <Star key={i} className="w-4 h-4 text-[#c9a84c] fill-[#c9a84c]" />
                  ))}
                </div>
                <p className="text-gray-600 text-sm leading-relaxed mb-5 italic">&ldquo;{t.text}&rdquo;</p>
                <div>
                  <div className="font-bold text-[#1a1a2e] text-sm">{t.name}</div>
                  <div className="text-gray-400 text-xs flex items-center gap-1 mt-0.5"><MapPin className="w-3 h-3" />{t.location}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* APP DOWNLOAD */}
      <section className="py-20 bg-[#1a1a2e]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl font-black text-white mb-4">Get the 360Everywhere app</h2>
              <p className="text-gray-300 text-lg mb-6">Download our top-rated real estate app for iOS or Android to get alerts the moment your dream home hits the market.</p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Link href="/app"
                  className="flex items-center gap-3 bg-white text-[#1a1a2e] px-5 py-3 rounded-xl font-bold text-sm hover:bg-gray-100 transition-colors">
                  <Smartphone className="w-5 h-5 text-[#1877F2]" />
                  <div><div className="text-[10px] text-gray-400">Download on the</div><div>App Store</div></div>
                </Link>
                <Link href="/app"
                  className="flex items-center gap-3 bg-white text-[#1a1a2e] px-5 py-3 rounded-xl font-bold text-sm hover:bg-gray-100 transition-colors">
                  <Download className="w-5 h-5 text-[#1877F2]" />
                  <div><div className="text-[10px] text-gray-400">Get it on</div><div>Google Play</div></div>
                </Link>
              </div>
            </div>
            {/* QR Code placeholder */}
            <div className="flex items-center justify-center">
              <div className="bg-white rounded-2xl p-8 text-center">
                <div className="w-32 h-32 bg-[#1a1a2e] rounded-xl mx-auto mb-4 flex items-center justify-center">
                  <div className="grid grid-cols-5 gap-1">
                    {Array.from({length:25}).map((_,i)=>(
                      <div key={i} className={`w-4 h-4 rounded-sm ${Math.random()>0.4?'bg-white':'bg-[#1a1a2e]'}`} />
                    ))}
                  </div>
                </div>
                <p className="text-[#1a1a2e] font-bold text-sm">Scan to download</p>
                <p className="text-gray-400 text-xs mt-1">iOS & Android</p>
              </div>
            </div>
          </div>
        </div>
      </section>


      {/* GET AN OFFER */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="bg-gradient-to-br from-[#1a1a2e] via-[#243b55] to-[#344a57] rounded-3xl overflow-hidden">
            <div className="grid md:grid-cols-2 gap-0 items-center">
              <div className="p-10 md:p-14">
                <div className="inline-flex items-center gap-2 bg-[#1877F2]/20 text-[#60a5fa] text-xs font-bold px-3 py-1.5 rounded-full mb-6 w-fit">
                  ⚡ NEW FEATURE
                </div>
                <h2 className="text-4xl font-black text-white leading-tight mb-4">
                  Get an offer on your home today
                </h2>
                <p className="text-gray-300 text-lg leading-relaxed mb-6">
                  Connect with qualified buyers and cash investors on the 360Everywhere platform. No open houses, no hassle — get real offers in 24 hours.
                </p>
                <div className="space-y-3 mb-8">
                  {[
                    'Cash buyers close in as little as 7 days',
                    'No obligation — compare multiple offers',
                    'You control the timeline and terms',
                    'Connect with investors & traditional buyers',
                  ].map(f => (
                    <div key={f} className="flex items-center gap-3">
                      <div className="w-5 h-5 rounded-full bg-[#1877F2] flex items-center justify-center flex-shrink-0">
                        <span className="text-white text-xs font-black">✓</span>
                      </div>
                      <span className="text-gray-200 text-sm">{f}</span>
                    </div>
                  ))}
                </div>
                <Link href="/auth/signup?intent=offer"
                  className="inline-flex items-center gap-2 bg-[#1877F2] hover:bg-[#1665d8] text-white font-bold px-8 py-4 rounded-xl transition-colors text-sm shadow-lg">
                  ⚡ Get My Offers Now
                </Link>
                <p className="text-gray-400 text-xs mt-3">Free · No obligation · Takes 2 minutes</p>
              </div>
              <div className="hidden md:block p-10">
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 space-y-4">
                  <div className="text-white/60 text-xs uppercase tracking-wider font-bold">Sample Offers Received</div>
                  {[
                    { buyer:'Cash Buyer', amount:'$1,180,000', type:'All Cash', days:'7 day close', color:'text-green-400' },
                    { buyer:'Traditional Buyer', amount:'$1,225,000', type:'Pre-Approved', days:'30 day close', color:'text-[#60a5fa]' },
                    { buyer:'Investor Group', amount:'$1,150,000', type:'All Cash', days:'14 day close', color:'text-yellow-400' },
                  ].map(offer => (
                    <div key={offer.buyer} className="bg-white/10 rounded-xl p-4 flex items-center justify-between">
                      <div>
                        <div className="text-white font-bold text-sm">{offer.buyer}</div>
                        <div className="text-white/50 text-xs">{offer.type} · {offer.days}</div>
                      </div>
                      <div className={`font-black text-lg ${offer.color}`}>{offer.amount}</div>
                    </div>
                  ))}
                  <p className="text-white/30 text-[10px] text-center italic">Sample data — not real offers</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* AGENT CONNECT FORM */}
      <section className="py-20 bg-white" id="agent">
        <div className="max-w-3xl mx-auto px-6">
          <div className="text-center mb-10">
            <h2 className="text-4xl font-black text-[#1a1a2e] mb-3">Talk to a 360Everywhere agent</h2>
            <p className="text-gray-500 text-lg">You&apos;ll be connected with an expert local agent — there&apos;s no pressure or obligation.</p>
          </div>

          {submitted ? (
            <div className="bg-green-50 border border-green-200 rounded-2xl p-10 text-center">
              <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-[#1a1a2e] mb-2">We&apos;ll be in touch soon!</h3>
              <p className="text-gray-500">A local 360Everywhere agent will contact you within 24 hours.</p>
            </div>
          ) : (
            <div className="bg-[#f8f9fa] rounded-2xl border border-gray-200 p-8">
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Where are you searching for homes?</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input value={agentForm.location} onChange={e=>setAgentForm(p=>({...p,location:e.target.value}))}
                      placeholder="City, ZIP, or Neighborhood"
                      className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[#1877F2] text-sm" />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Email</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input type="email" value={agentForm.email} onChange={e=>setAgentForm(p=>({...p,email:e.target.value}))}
                        placeholder="your@email.com"
                        className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[#1877F2] text-sm" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Phone</label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input type="tel" value={agentForm.phone} onChange={e=>setAgentForm(p=>({...p,phone:e.target.value}))}
                        placeholder="(858) 555-0123"
                        className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[#1877F2] text-sm" />
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">What can we help you with?</label>
                  <select value={agentForm.help} onChange={e=>setAgentForm(p=>({...p,help:e.target.value}))}
                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-800 focus:outline-none focus:border-[#1877F2] text-sm appearance-none">
                    <option value="">Select an option...</option>
                    <option value="buy">I want to buy a home</option>
                    <option value="sell">I want to sell my home</option>
                    <option value="rent">I want to rent</option>
                    <option value="value">I want to know my home value</option>
                    <option value="both">I want to buy and sell</option>
                  </select>
                </div>
                <label className="flex items-start gap-3 cursor-pointer">
                  <input type="checkbox" checked={agentForm.financing} onChange={e=>setAgentForm(p=>({...p,financing:e.target.checked}))}
                    className="mt-0.5 w-4 h-4 accent-[#1877F2] flex-shrink-0" />
                  <span className="text-sm text-gray-600">I want financing information</span>
                </label>

                <button onClick={() => {
                  if(agentForm.location && agentForm.email && agentForm.phone && agentForm.help) setSubmitted(true)
                }}
                  className="w-full py-4 bg-[#1877F2] hover:bg-[#1665d8] text-white font-bold rounded-xl transition-colors text-sm">
                  Connect with an Agent
                </button>

                <p className="text-[10px] text-gray-400 leading-relaxed">
                  By submitting this form, I agree to receive calls and SMS messages from 360Everywhere for the purpose of updates and promotions. Messages may be sent on a recurring basis and frequency will vary. Message and data rates may apply. Consent to receive SMS messages is not required as a condition for purchasing any goods or services. To unsubscribe from SMS messages, reply &quot;STOP&quot; at any time. For assistance, reply &quot;HELP&quot;. By proceeding, you confirm that you are creating a 360Everywhere account and have read and agree to our{' '}
                  <a href="/privacy-policy" className="underline">Privacy Policy</a> and{' '}
                  <a href="/terms-of-use" className="underline">Terms of Use</a>.
                </p>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
