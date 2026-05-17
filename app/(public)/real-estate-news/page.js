import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default function Page() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-16">
      <Link href="/" className="flex items-center gap-2 text-[#1877F2] text-sm font-semibold hover:underline mb-8">
        <ArrowLeft className="w-4 h-4" /> Back to Home
      </Link>
      <h1 className="text-4xl font-black text-[#1a1a2e] mb-6">Real Estate News</h1>
      <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-6 mb-8">
        <p className="text-yellow-800 font-semibold text-sm">🚧 This page is a placeholder. Content coming soon.</p>
      </div>
      <div className="prose max-w-none text-gray-600">
        <p className="text-lg leading-relaxed">This section is being developed. Please check back soon for the full content of this page.</p>
        <p className="mt-4">For questions or more information, please contact us at <a href="mailto:info@360everywhere.com" className="text-[#1877F2] underline">info@360everywhere.com</a> or call <strong>1-833-759-1234</strong>.</p>
      </div>
      <div className="mt-10 flex gap-3">
        <Link href="/" className="px-6 py-3 bg-[#1877F2] text-white font-bold rounded-xl hover:bg-[#1665d8] transition-colors text-sm">Go Home</Link>
        <Link href="/auth/signup" className="px-6 py-3 border border-[#1877F2] text-[#1877F2] font-bold rounded-xl hover:bg-[#e7f0fd] transition-colors text-sm">Sign Up Free</Link>
      </div>
    </div>
  )
}
