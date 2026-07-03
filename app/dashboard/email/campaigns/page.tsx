// app/dashboard/email/campaigns/page.tsx
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getEmailSupabase } from '@/lib/email/supabase-server';

export const dynamic = 'force-dynamic';

export default async function CampaignsPage() {
  const supabase = getEmailSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: campaigns } = await supabase
    .from('email_campaigns').select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  return (
    <div className="px-6 py-8 max-w-7xl mx-auto">
      <div className="flex items-end justify-between mb-6 flex-wrap gap-4">
        <div>
          <Link href="/dashboard/email" className="text-xs uppercase tracking-wider text-neutral-500 hover:text-[#344a57]">← Email</Link>
          <h1 className="font-serif text-3xl text-[#344a57] mt-1">Campaigns</h1>
        </div>
        <Link href="/dashboard/email/campaigns/new" className="px-4 py-2 bg-[#344a57] text-white text-sm rounded hover:bg-[#2a3c47]">+ New campaign</Link>
      </div>

      {(!campaigns || campaigns.length === 0) ? (
        <div className="border border-dashed border-neutral-300 rounded-lg p-8 text-center bg-white">
          <p className="text-neutral-700 font-serif text-lg">No campaigns yet.</p>
          <p className="text-sm text-neutral-500 mt-2">Create your first one to start sending.</p>
        </div>
      ) : (
        <div className="bg-white border border-neutral-200 rounded overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-neutral-50 border-b border-neutral-200">
              <tr>
                <th className="text-left p-3 font-medium text-neutral-700">Name</th>
                <th className="text-left p-3 font-medium text-neutral-700">Subject</th>
                <th className="text-left p-3 font-medium text-neutral-700">Status</th>
                <th className="text-left p-3 font-medium text-neutral-700">Sent</th>
                <th className="text-left p-3 font-medium text-neutral-700">Opens</th>
                <th className="text-left p-3 font-medium text-neutral-700">Created</th>
              </tr>
            </thead>
            <tbody>
              {campaigns.map(c => (
                <tr key={c.id} className="border-b border-neutral-100 hover:bg-neutral-50">
                  <td className="p-3"><Link href={`/dashboard/email/campaigns/${c.id}`} className="text-[#344a57] hover:underline">{c.name}</Link></td>
                  <td className="p-3 text-neutral-700 truncate max-w-xs">{c.subject}</td>
                  <td className="p-3"><span className="px-2 py-0.5 text-[10px] rounded bg-neutral-100">{c.status}</span></td>
                  <td className="p-3">{c.total_sent}/{c.total_recipients}</td>
                  <td className="p-3">{c.total_opens}</td>
                  <td className="p-3 text-xs text-neutral-500">{new Date(c.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
