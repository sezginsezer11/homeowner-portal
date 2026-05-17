import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
export default function Page() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-16">
      <Link href="/" className="flex items-center gap-2 text-[#1877F2] text-sm font-semibold hover:underline mb-8"><ArrowLeft className="w-4 h-4"/>Back to Home</Link>
      <h1 className="text-4xl font-black text-[#1a1a2e] mb-6">Do Not Sell or Share My Personal Information</h1>
      <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-6 mb-8"><p className="text-yellow-800 font-semibold text-sm">🚧 This page is a placeholder. Content coming soon.</p></div>
      <p className="text-gray-600 text-lg">This page will contain options for California residents and others to opt out of the sale or sharing of their personal information as required by applicable privacy laws including CCPA/CPRA.</p>
    </div>
  )
}
