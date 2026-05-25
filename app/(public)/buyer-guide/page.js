import PublicNav from '@/components/public/PublicNav'
import PublicFooter from '@/components/public/PublicFooter'
import { Home, ChevronRight, FileText, Download } from 'lucide-react'
import Link from 'next/link'

export const metadata = {
  title: 'Home Buyer Guide | 360Everywhere',
  description: 'Your complete interactive guide to buying a home in San Diego — timelines, checklists, escrow fees, and more by Sez Sezer, Keller Williams Realty.',
}

export default function BuyerGuidePage() {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <PublicNav />
      <main className="flex-1">
        {/* Header */}
        <div className="bg-[#1a1a2e] py-8 px-6">
          <div className="max-w-5xl mx-auto">
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-xs text-gray-400 mb-4">
              <Link href="/" className="hover:text-white transition-colors">Home</Link>
              <ChevronRight className="w-3 h-3"/>
              <Link href="/resources" className="hover:text-white transition-colors">Resources</Link>
              <ChevronRight className="w-3 h-3"/>
              <span className="text-gray-300">Home Buyer Guide</span>
            </div>
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <FileText className="w-5 h-5 text-[#c9a84c]"/>
                  <span className="text-[#c9a84c] text-xs font-bold uppercase tracking-widest">Interactive Guide</span>
                </div>
                <h1 className="text-3xl font-black text-white mb-2">Home Buyer Guide</h1>
                <p className="text-gray-400 text-sm max-w-xl">
                  Your complete guide to buying a home — timelines, checklists, escrow fees, and mortgage calculators. By Sez Sezer, Keller Williams Realty.
                </p>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <a href="/buyer-guide.html" download="HomeBuyerGuide-SezSezer.html"
                  className="flex items-center gap-2 px-4 py-2 bg-[#c9a84c] hover:bg-[#b8973b] text-[#1a1a2e] font-bold text-sm rounded-xl transition-colors">
                  <Download className="w-4 h-4"/> Download
                </a>
                <a href="/buyer-guide.html" target="_blank"
                  className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white font-bold text-sm rounded-xl transition-colors">
                  Open Full Screen
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Iframe */}
        <div className="w-full" style={{height: 'calc(100vh - 200px)', minHeight: '700px'}}>
          <iframe
            src="/buyer-guide.html"
            className="w-full h-full border-0"
            title="Home Buyer Guide"
          />
        </div>
      </main>
      <PublicFooter />
    </div>
  )
}
