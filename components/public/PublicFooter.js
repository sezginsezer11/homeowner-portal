import Link from 'next/link'

export default function PublicFooter() {
  return (
    <footer className="bg-[#1a1a2e] text-white">
      {/* Main footer links */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
          {/* Logo + tagline */}
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-[#1877F2] rounded-lg flex items-center justify-center">
                <span className="text-white font-black text-sm">3</span>
              </div>
              <span className="font-black text-white text-lg">360<span className="text-[#1877F2]">Everywhere</span></span>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed">Your complete real estate platform for buying, selling, renting, and managing your home equity.</p>
          </div>

          {/* About */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-4">About Us</h3>
            <ul className="space-y-2.5">
              {[
                { label: 'Why 360Everywhere', href: '/why-360everywhere' },
                { label: 'Blog', href: '/blog' },
                { label: 'Real Estate News', href: '/real-estate-news' },
                { label: 'Placeholder', href: '/placeholder' },
              ].map(item => (
                <li key={item.href}><Link href={item.href} className="text-gray-300 hover:text-white text-sm transition-colors">{item.label}</Link></li>
              ))}
            </ul>
          </div>

          {/* Join us */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-4">Join Us</h3>
            <ul className="space-y-2.5">
              {[
                { label: 'Become an Agent', href: '/become-an-agent' },
                { label: 'Get Referrals', href: '/partners' },
                { label: 'Careers', href: '/careers' },
              ].map(item => (
                <li key={item.href}><Link href={item.href} className="text-gray-300 hover:text-white text-sm transition-colors">{item.label}</Link></li>
              ))}
            </ul>
          </div>

          {/* Tools */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-4">Tools</h3>
            <ul className="space-y-2.5">
              {[
                { label: 'Buy a Home', href: '/buy' },
                { label: 'Sell a Home', href: '/sell' },
                { label: 'Rent a Home', href: '/rent' },
                { label: 'Mortgage Calculator', href: '/mortgage' },
                { label: 'My Home Value', href: '/dashboard/homeowner' },
                { label: 'Download App', href: '/app' },
              ].map(item => (
                <li key={item.href}><Link href={item.href} className="text-gray-300 hover:text-white text-sm transition-colors">{item.label}</Link></li>
              ))}
            </ul>
          </div>
        </div>

        {/* Legal links */}
        <div className="border-t border-white/10 pt-8 space-y-4">
          <div className="flex flex-wrap gap-x-6 gap-y-2">
            {[
              { label: 'Terms of Use', href: '/terms-of-use' },
              { label: 'Privacy Policy', href: '/privacy-policy' },
              { label: 'Do Not Sell My Personal Information', href: '/about/privacy/cookie' },
              { label: 'Licensed in 50 States', href: '/legal/disclosures-licenses' },
            ].map(item => (
              <Link key={item.href} href={item.href} className="text-gray-400 hover:text-white text-xs transition-colors">{item.label}</Link>
            ))}
          </div>

          <div className="text-gray-500 text-xs space-y-2 leading-relaxed">
            <p>© 2026 360Everywhere.com. All rights reserved.</p>
            <p className="text-gray-600 italic">All of this section is a placeholder until the actual website is built. None of the information below is reliable.</p>
            <p>Updated September 2025: By searching, you agree to the <Link href="/terms-of-use" className="underline hover:text-gray-300">Terms of Use</Link>, and <Link href="/privacy-policy" className="underline hover:text-gray-300">Privacy Policy</Link>.</p>
            <p><Link href="/about/privacy/cookie" className="underline hover:text-gray-300">Do not sell or share my personal information.</Link></p>
            <p>360Everywhere.com and all 360Everywhere.com variants, WALK SCORE, and the R logos, are trademarks of 360Everywhere Corporation, registered or pending in the USPTO.</p>
            <p>California DRE #01988197</p>
            <p>360Everywhere.com is licensed to do business in New York as 360Everywhere.com Real Estate.</p>
            <p>TREC: Info About Brokerage Services, Consumer Protection Notice</p>
            <p>All mortgage lending products and information are provided by 360Everywhere.com Mortgage, LLC | NMLS #1234; www.NMLSConsumerAccess.org. Licensed in 50 states.</p>
            <p>360Everywhere.com is an affiliated business of 360 Everywhere Partnership. Each company, and their subsidiaries, are separate legal entities operated and managed through its own management and governance structures.</p>
            <p>If you are using a screen reader, or having trouble reading this website, please call 360Everywhere.com Customer Support for help at <strong>1-833-759-1234</strong>.</p>
          </div>

          {/* Fair Housing */}
          <div className="border-t border-white/10 pt-4 flex items-start gap-3">
            <div className="w-8 h-8 bg-[#1877F2] rounded flex items-center justify-center flex-shrink-0">
              <span className="text-white text-xs font-black">EHO</span>
            </div>
            <p className="text-gray-400 text-xs uppercase tracking-wide font-semibold">
              360 EVERYWHERE IS COMMITTED TO AND ABIDES BY THE FAIR HOUSING ACT AND EQUAL OPPORTUNITY ACT. READ 360Everywhere&apos;s FAIR HOUSING POLICY AND THE NEW YORK STATE FAIR HOUSING NOTICE.
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}
