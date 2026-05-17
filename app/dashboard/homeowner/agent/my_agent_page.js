import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { User, Phone, Mail, Globe, Award, MessageSquare, UserPlus } from 'lucide-react'

export default async function MyAgentPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: rel } = await supabase
    .from('relationships')
    .select('*, professional:professional_id(id, full_name, email, phone, company, avatar_url, license_number, website, bio)')
    .eq('homeowner_id', user.id)
    .eq('professional_role', 'agent')
    .eq('status', 'accepted')
    .single()

  const agent = rel?.professional

  return (
    <div className="max-w-2xl mx-auto space-y-5 pb-20">
      <div>
        <h1 className="text-2xl font-bold text-[#1a1a2e] flex items-center gap-2"><User className="w-6 h-6 text-[#1877F2]"/>My Agent</h1>
        <p className="text-[#65676b] text-sm mt-0.5">Your dedicated real estate agent</p>
      </div>

      {agent ? (
        <div className="bg-white rounded-2xl border border-[#e4e6eb] shadow-card p-6">
          <div className="flex items-start gap-4 mb-5">
            <div className="w-16 h-16 rounded-full bg-[#e7f0fd] flex items-center justify-center text-[#1877F2] font-bold text-2xl flex-shrink-0 overflow-hidden border-2 border-[#c7d9f8]">
              {agent.avatar_url ? <img src={agent.avatar_url} alt="" className="w-full h-full object-cover"/> : agent.full_name?.charAt(0)}
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold text-[#1a1a2e]">{agent.full_name}</h2>
              {agent.company && <p className="text-[#65676b] text-sm">{agent.company}</p>}
              {agent.license_number && <p className="text-[#9ca3af] text-xs mt-0.5">DRE# {agent.license_number}</p>}
              <span className="inline-block mt-2 bg-green-50 text-green-600 text-xs font-bold px-2.5 py-1 rounded-full border border-green-200">✓ Connected Agent</span>
            </div>
          </div>
          {agent.bio && <p className="text-[#65676b] text-sm leading-relaxed mb-5 bg-[#f8f9fa] rounded-xl p-4">{agent.bio}</p>}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {agent.phone && <a href={`tel:${agent.phone}`} className="flex items-center gap-3 p-3 bg-[#f8f9fa] rounded-xl hover:bg-[#e7f0fd] transition-colors"><Phone className="w-4 h-4 text-[#1877F2]"/><div><div className="text-[10px] text-[#9ca3af] uppercase">Phone</div><div className="text-sm font-semibold text-[#1a1a2e]">{agent.phone}</div></div></a>}
            {agent.email && <a href={`mailto:${agent.email}`} className="flex items-center gap-3 p-3 bg-[#f8f9fa] rounded-xl hover:bg-[#e7f0fd] transition-colors"><Mail className="w-4 h-4 text-[#1877F2]"/><div><div className="text-[10px] text-[#9ca3af] uppercase">Email</div><div className="text-sm font-semibold text-[#1a1a2e] truncate">{agent.email}</div></div></a>}
            {agent.website && <a href={agent.website.startsWith('http')?agent.website:`https://${agent.website}`} target="_blank" className="flex items-center gap-3 p-3 bg-[#f8f9fa] rounded-xl hover:bg-[#e7f0fd] transition-colors"><Globe className="w-4 h-4 text-[#1877F2]"/><div><div className="text-[10px] text-[#9ca3af] uppercase">Website</div><div className="text-sm font-semibold text-[#1a1a2e]">Visit Website</div></div></a>}
          </div>
          <Link href="/dashboard/homeowner/messages" className="mt-4 flex items-center justify-center gap-2 w-full py-3 bg-[#1877F2] hover:bg-[#1665d8] text-white rounded-xl font-bold text-sm transition-colors">
            <MessageSquare className="w-4 h-4"/> Send Message
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border-2 border-dashed border-[#e4e6eb] p-12 text-center">
          <div className="w-14 h-14 bg-[#e7f0fd] rounded-2xl flex items-center justify-center mx-auto mb-4"><User className="w-7 h-7 text-[#1877F2]"/></div>
          <h3 className="text-[#1a1a2e] font-bold text-lg mb-1">No agent connected yet</h3>
          <p className="text-[#65676b] text-sm mb-5">Connect with a local expert agent to help you buy or sell.</p>
          <Link href="/dashboard/homeowner/connections" className="inline-flex items-center gap-2 px-6 py-3 bg-[#1877F2] text-white rounded-xl font-bold text-sm hover:bg-[#1665d8] transition-colors">
            <UserPlus className="w-4 h-4"/> Find an Agent
          </Link>
        </div>
      )}
    </div>
  )
}
