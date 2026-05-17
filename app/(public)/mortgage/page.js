import Link from 'next/link'
import { Calculator, TrendingDown, Percent, ArrowRight, CheckCircle } from 'lucide-react'

export default function MortgagePage() {
  return (
    <div>
      <div className="bg-[#1a1a2e] py-16 px-6 text-center">
        <h1 className="text-5xl font-black text-white mb-4">Mortgage Made Simple</h1>
        <p className="text-gray-300 text-lg mb-8 max-w-2xl mx-auto">Calculate payments, compare rates from top lenders, and get pre-approved — all in one place.</p>
        <Link href="/auth/signup" className="inline-flex items-center gap-2 bg-[#1877F2] text-white font-bold px-8 py-4 rounded-xl hover:bg-[#1665d8] transition-colors">
          Try Our Mortgage Calculator <ArrowRight className="w-4 h-4"/>
        </Link>
      </div>
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          {[
            {icon:Calculator,title:'Payment Calculator',desc:'Calculate monthly payments for 10 loan types including 30yr fixed, FHA, VA, Jumbo, ARM, and more.'},
            {icon:TrendingDown,title:'Refi Savings Calculator',desc:'See exactly how much you could save by refinancing. Break-even analysis, lifetime savings, and cash-out options.'},
            {icon:Percent,title:'Live Rates',desc:'Real-time mortgage rates from Freddie Mac updated weekly. Compare all loan programs side by side.'},
          ].map(f=>(
            <div key={f.title} className="bg-white border border-gray-100 rounded-2xl p-8 hover:shadow-xl transition-all">
              <div className="w-12 h-12 bg-[#e7f0fd] rounded-xl flex items-center justify-center mb-4"><f.icon className="w-6 h-6 text-[#1877F2]"/></div>
              <h3 className="text-xl font-bold text-[#1a1a2e] mb-2">{f.title}</h3>
              <p className="text-gray-500">{f.desc}</p>
            </div>
          ))}
        </div>
        <div className="bg-gradient-to-r from-[#1877F2] to-[#1665d8] rounded-3xl p-10 text-white text-center">
          <h2 className="text-3xl font-black mb-4">Current 30-Year Fixed Rate</h2>
          <div className="text-7xl font-black mb-2">6.87%</div>
          <p className="text-blue-200 mb-6">Freddie Mac National Average · Updated Weekly</p>
          <Link href="/auth/signup" className="inline-flex items-center gap-2 bg-white text-[#1877F2] font-bold px-8 py-4 rounded-xl hover:bg-gray-50 transition-colors">
            Compare All Loan Programs <ArrowRight className="w-4 h-4"/>
          </Link>
        </div>
      </div>
    </div>
  )
}
