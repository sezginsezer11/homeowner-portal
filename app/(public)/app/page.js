import Link from 'next/link'
import { Smartphone, Download, Star, CheckCircle } from 'lucide-react'

export default function AppPage() {
  return (
    <div className="max-w-5xl mx-auto px-6 py-16">
      <div className="text-center mb-12">
        <div className="w-20 h-20 bg-[#1877F2] rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg">
          <Smartphone className="w-10 h-10 text-white"/>
        </div>
        <h1 className="text-5xl font-black text-[#1a1a2e] mb-4">Get the 360Everywhere App</h1>
        <p className="text-gray-500 text-xl max-w-2xl mx-auto">Download our top-rated real estate app for iOS or Android to get alerts the moment your dream home hits the market.</p>
      </div>
      <div className="grid md:grid-cols-2 gap-8 items-center mb-16">
        <div>
          <div className="space-y-4 mb-8">
            {['Instant alerts for new listings','Track your home value in real-time','Mortgage calculator & rate alerts','Connect with agents & lenders','Portfolio equity dashboard'].map(f=>(
              <div key={f} className="flex items-center gap-3"><CheckCircle className="w-5 h-5 text-[#1877F2] flex-shrink-0"/><span className="text-gray-700">{f}</span></div>
            ))}
          </div>
          <div className="flex gap-3">
            <a href="#" className="flex items-center gap-3 bg-[#1a1a2e] text-white px-6 py-4 rounded-xl hover:bg-black transition-colors">
              <Smartphone className="w-6 h-6"/><div><div className="text-[10px] text-gray-400">Download on the</div><div className="font-bold">App Store</div></div>
            </a>
            <a href="#" className="flex items-center gap-3 bg-[#1a1a2e] text-white px-6 py-4 rounded-xl hover:bg-black transition-colors">
              <Download className="w-6 h-6"/><div><div className="text-[10px] text-gray-400">Get it on</div><div className="font-bold">Google Play</div></div>
            </a>
          </div>
        </div>
        <div className="bg-[#f8f9fa] rounded-3xl p-10 text-center border border-gray-100">
          <div className="w-40 h-40 bg-[#1a1a2e] rounded-2xl mx-auto mb-4 flex items-center justify-center">
            <div className="grid grid-cols-7 gap-0.5 p-2">
              {Array.from({length:49}).map((_,i)=><div key={i} className={`w-3.5 h-3.5 rounded-sm ${[0,1,2,4,5,6,7,14,21,28,35,42,43,44,46,47,48].includes(i)?'bg-white':'bg-[#1a1a2e]'}`}/>)}
            </div>
          </div>
          <p className="text-[#1a1a2e] font-bold text-lg">Scan to Download</p>
          <p className="text-gray-400 text-sm mt-1">Available on iOS & Android</p>
          <div className="flex justify-center gap-1 mt-3">
            {[1,2,3,4,5].map(i=><Star key={i} className="w-4 h-4 text-[#c9a84c] fill-[#c9a84c]"/>)}
          </div>
          <p className="text-gray-400 text-xs mt-1">4.9 · 10,000+ ratings</p>
        </div>
      </div>
    </div>
  )
}
