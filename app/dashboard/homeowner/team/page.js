import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { User, Building2, Phone, Mail, UserPlus } from 'lucide-react'

export default async function TeamPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: relationships } = await supabase
    .from('relationships')
    .select('*, professional:professional_id(full_name, role, email, phone, company, created_at)')
    .eq('homeowner_id', user.id)

  const agent  = relationships?.find(r => r.professional_role === 'agent')?.professional
  const lender = relationships?.find(r => r.professional_role === 'lender')?.professional

  const Card = ({ data, label, color, borderColor }) => (
    <div className={`bg-[#1a2332] border rounded-2xl p-8 flex flex-col items-center text-center ${data ? `border-${borderColor}/20` : 'border-[#344a57]/30'}`}>
      <div className={`w-20 h-20 rounded-full flex items-center justify-center text-white text-3xl font-bold mb-4 ${data ? 'bg-[#344a57]' : 'bg-[#0f1623] border-2 border-dashed border-[#344a57]/40'}`}>
        {data ? data.full_name?.charAt(0) : <UserPlus className="w-8 h-8 text-[#344a57]" />}
      </div>
      <div className={`text-xs font-semibold uppercase tracking-widest mb-2 ${color}`}>{label}</div>
      {data ? (
        <>
          <h3 className="text-white text-xl font-bold">{data.full_name}</h3>
          {data.company && <p className="text-[#8fa1ad] text-sm mt-1">{data.company}</p>}
          <div className="mt-6 space-y-3 w-full">
            {data.email && (
              <a href={`mailto:${data.email}`}
                className="flex items-center gap-3 w-full px-4 py-3 bg-[#0f1623] rounded-xl hover:bg-[#344a57]/20 transition-colors group">
                <Mail className="w-4 h-4 text-[#8fa1ad] group-hover:text-white" />
                <span className="text-[#8fa1ad] group-hover:text-white text-sm transition-colors truncate">{data.email}</span>
              </a>
            )}
            {data.phone && (
              <a href={`tel:${data.phone}`}
                className="flex items-center gap-3 w-full px-4 py-3 bg-[#0f1623] rounded-xl hover:bg-[#344a57]/20 transition-colors group">
                <Phone className="w-4 h-4 text-[#8fa1ad] group-hover:text-white" />
                <span className="text-[#8fa1ad] group-hover:text-white text-sm transition-colors">{data.phone}</span>
              </a>
            )}
          </div>
        </>
      ) : (
        <div className="mt-2">
          <p className="text-[#464d4f] text-sm">Not connected yet</p>
          <p className="text-[#344a57] text-xs mt-1">Your {label.toLowerCase()} will add you to their portal</p>
        </div>
      )}
    </div>
  )

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-white">My Team</h1>
        <p className="text-[#8fa1ad] text-sm mt-0.5">Your connected real estate professionals</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card data={agent}  label="Real Estate Agent" color="text-green-400" borderColor="green-500" />
        <Card data={lender} label="Lender"             color="text-blue-400"  borderColor="blue-500" />
      </div>

      <div className="bg-[#1a2332] border border-[#344a57]/30 rounded-2xl p-6">
        <h3 className="text-white font-semibold mb-1 text-sm">How connections work</h3>
        <p className="text-[#8fa1ad] text-sm">Your agent or lender will search for your email and connect with you through their portal. Once connected, they can send you property value updates, rate alerts, and direct messages right here.</p>
      </div>
    </div>
  )
}
