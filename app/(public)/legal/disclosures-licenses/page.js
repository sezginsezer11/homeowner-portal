import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
export default function Page() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-16">
      <Link href="/" className="flex items-center gap-2 text-[#1877F2] text-sm font-semibold hover:underline mb-8"><ArrowLeft className="w-4 h-4"/>Back to Home</Link>
      <h1 className="text-4xl font-black text-[#1a1a2e] mb-6">Disclosures & Licenses</h1>
      <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-6 mb-8"><p className="text-yellow-800 font-semibold text-sm">🚧 This page is a placeholder. Content coming soon.</p></div>
      <div className="space-y-4 text-gray-600">
        <p><strong>California DRE #01988197</strong></p>
        <p>360Everywhere.com is licensed to do business in New York as 360Everywhere.com Real Estate.</p>
        <p>Licensed in 50 states.</p>
        <p>All mortgage lending products and information are provided by 360Everywhere.com Mortgage, LLC | NMLS #1234</p>
      </div>
    </div>
  )
}
