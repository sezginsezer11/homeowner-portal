import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Handshake, Phone, Mail, Globe, Award, MessageSquare, UserPlus, Percent } from 'lucide-react'

export default async function MyLenderPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: rel } = await supabase
    .from('relationships')
    .select('*, professional:professional_id(id, full_name, email, phone, company, avatar_url, license_number, website, bio)')
    .eq('homeowner_id', user.id)
    .eq('professional_role', 'lender')
    .eq('status', 'accepted')
    .single()

  const lender = rel?.professional

  return (
    <div className="max-w-2xl mx-auto space-y-5 pb-20">
      <div>
        <h1 className="text-2xl font-bold text-[#1a1a2e] flex items-center gap-2"><Handshake className="w-6 h-6 text-[#1877F2]"/>My Lender</h1>
        <p className="text-[#65676b] text-sm mt-0.5">Your dedicated mortgage lender</p>
      </div>

      {lender ? (
        <div className="bg-white rounded-2xl border border-[#e4e6eb] shadow-card p-6">
          <div className="flex items-start gap-4 mb-5">
            <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 font-bold text-2xl flex-shrink-0 overflow-hidden border-2 border-blue-200">
              {lender.avatar_url ? <img src={lender.avatar_url} alt="" className="w-full h-full object-cover"/> : lender.full_name?.charAt(0)}
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold text-[#1a1a2e]">{lender.full_name}</h2>
              {lender.company && <p className="text-[#65676b] text-sm">{lender.company}</p>}
              {lender.license_number && <p className="text-[#9ca3af] text-xs mt-0.5">NMLS# {lender.license_number}</p>}
              <span className="inline-block mt-2 bg-blue-50 text-blue-600 text-xs font-bold px-2.5 py-1 rounded-full border border-blue-200">✓ Connected Lender</span>
            </div>
          </div>
          {lender.bio && <p className="text-[#65676b] text-sm leading-relaxed mb-5 bg-[#f8f9fa] rounded-xl p-4">{lender.bio}</p>}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {lender.phone && <a href={`tel:${lender.phone}`} className="flex items-center gap-3 p-3 bg-[#f8f9fa] rounded-xl hover:bg-blue-50 transition-colors"><Phone className="w-4 h-4 text-blue-600"/><div><div className="text-[10px] text-[#9ca3af] uppercase">Phone</div><div className="text-sm font-semibold text-[#1a1a2e]">{lender.phone}</div></div></a>}
            {lender.email && <a href={`mailto:${lender.email}`} className="flex items-center gap-3 p-3 bg-[#f8f9fa] rounded-xl hover:bg-blue-50 transition-colors"><Mail className="w-4 h-4 text-blue-600"/><div><div className="text-[10px] text-[#9ca3af] uppercase">Email</div><div className="text-sm font-semibold text-[#1a1a2e] truncate">{lender.email}</div></div></a>}
            {lender.website && <a href={lender.website.startsWith('http')?lender.website:`https://${lender.website}`} target="_blank" className="flex items-center gap-3 p-3 bg-[#f8f9fa] rounded-xl hover:bg-blue-50 transition-colors"><Globe className="w-4 h-4 text-blue-600"/><div><div className="text-[10px] text-[#9ca3af] uppercase">Website</div><div className="text-sm font-semibold text-[#1a1a2e]">Visit Website</div></div></a>}
          </div>
          <div className="grid grid-cols-2 gap-3 mt-3">
            <Link href="/dashboard/homeowner/messages" className="flex items-center justify-center gap-2 py-3 bg-[#1877F2] hover:bg-[#1665d8] text-white rounded-xl font-bold text-sm transition-colors">
              <MessageSquare className="w-4 h-4"/> Message
            </Link>
            <Link href="/dashboard/homeowner/rates" className="flex items-center justify-center gap-2 py-3 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-xl font-bold text-sm transition-colors border border-blue-200">
              <Percent className="w-4 h-4"/> Shop Rates
            </Link>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border-2 border-dashed border-[#e4e6eb] p-12 text-center">
          <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-4"><Handshake className="w-7 h-7 text-blue-600"/></div>
          <h3 className="text-[#1a1a2e] font-bold text-lg mb-1">No lender connected yet</h3>
          <p className="text-[#65676b] text-sm mb-5">Connect with a licensed mortgage lender for rates and pre-approval.</p>
          <Link href="/dashboard/homeowner/connections" className="inline-flex items-center gap-2 px-6 py-3 bg-[#1877F2] text-white rounded-xl font-bold text-sm hover:bg-[#1665d8] transition-colors">
            <UserPlus className="w-4 h-4"/> Find a Lender
          </Link>
        </div>
      )}
    </div>
  )
}
