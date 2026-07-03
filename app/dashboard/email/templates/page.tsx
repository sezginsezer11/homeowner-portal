// app/dashboard/email/templates/page.tsx
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getEmailSupabase } from '@/lib/email/supabase-server';

export const dynamic = 'force-dynamic';

export default async function TemplatesPage() {
  const supabase = await getEmailSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: templates } = await supabase
    .from('email_templates')
    .select('id, name, subject, updated_at')
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false });

  return (
    <div className="px-6 py-8 max-w-7xl mx-auto">
      <div className="flex items-end justify-between mb-6 flex-wrap gap-4">
        <div>
          <Link href="/dashboard/email" className="text-xs uppercase tracking-wider text-neutral-500 hover:text-[#344a57]">← Email</Link>
          <h1 className="font-serif text-3xl text-[#344a57] mt-1">Templates</h1>
          <p className="text-sm text-neutral-600 mt-1">Design reusable email templates with the block editor.</p>
        </div>
        <Link href="/dashboard/email/templates/new" className="px-4 py-2 bg-[#344a57] text-white text-sm rounded hover:bg-[#2a3c47]">+ New template</Link>
      </div>

      {(!templates || templates.length === 0) ? (
        <div className="border border-dashed border-neutral-300 rounded-lg p-8 text-center bg-white">
          <p className="text-neutral-700 font-serif text-lg">No templates yet.</p>
          <p className="text-sm text-neutral-500 mt-2">Create your first one — it'll be reusable across all your campaigns.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map(t => (
            <Link key={t.id} href={`/dashboard/email/templates/${t.id}`} className="block bg-white border border-neutral-200 rounded-lg p-5 hover:shadow-md transition-shadow">
              <h3 className="font-serif text-lg text-[#344a57]">{t.name}</h3>
              {t.subject && <p className="text-sm text-neutral-600 mt-1 truncate">{t.subject}</p>}
              <p className="text-xs text-neutral-500 mt-2">Updated {new Date(t.updated_at).toLocaleDateString()}</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
