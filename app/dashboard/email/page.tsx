// app/dashboard/email/page.tsx
import Link from 'next/link';
import { getEmailSupabase } from '@/lib/email/supabase-server';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

async function getCounts(userId: string) {
  const supabase = await getEmailSupabase();
  const [contacts, tags, templates, domains, campaigns] = await Promise.all([
    supabase.from('email_contacts').select('*', { count: 'exact', head: true }).eq('user_id', userId),
    supabase.from('email_tags').select('*', { count: 'exact', head: true }).eq('user_id', userId),
    supabase.from('email_templates').select('*', { count: 'exact', head: true }).eq('user_id', userId),
    supabase.from('email_sending_domains').select('*', { count: 'exact', head: true }).eq('user_id', userId).eq('status', 'verified').eq('is_active', true),
    supabase.from('email_campaigns').select('*', { count: 'exact', head: true }).eq('user_id', userId),
  ]);
  return {
    contacts:  contacts.count  ?? 0,
    tags:      tags.count      ?? 0,
    templates: templates.count ?? 0,
    domains:   domains.count   ?? 0,
    campaigns: campaigns.count ?? 0,
  };
}

export default async function EmailHubPage() {
  const supabase = await getEmailSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  const counts = await getCounts(user.id);

  const tiles = [
    { href: '/dashboard/email/contacts',  label: 'Contacts',        desc: 'Your contact database with tags & segmentation',     stat: counts.contacts,  cta: 'Manage contacts' },
    { href: '/dashboard/email/tags',      label: 'Tags',            desc: 'Organize contacts by category, source, lead stage',  stat: counts.tags,      cta: 'Manage tags' },
    { href: '/dashboard/email/templates', label: 'Templates',       desc: 'Design reusable emails with the visual block editor', stat: counts.templates, cta: 'Design templates' },
    { href: '/dashboard/email/domains',   label: 'Sending domains', desc: 'Verify in SES, paste DNS, rotate as you grow',       stat: counts.domains,   cta: 'Manage domains' },
    { href: '/dashboard/email/campaigns', label: 'Campaigns',       desc: 'Compose, segment by tags, send via your domains',    stat: counts.campaigns, cta: 'Manage campaigns' },
    { href: '/dashboard/email/analytics', label: 'Analytics',       desc: 'Opens, clicks, engagement scoring (Phase 4)',        stat: '—',              cta: 'Coming soon', disabled: true },
  ];

  return (
    <div className="px-6 py-10 max-w-7xl mx-auto">
      <header className="mb-10">
        <p className="uppercase tracking-[0.25em] text-xs text-[#c9a96e] mb-3">360everywhere · Email Platform</p>
        <h1 className="font-serif text-4xl md:text-5xl text-[#344a57]">Your private email marketing engine.</h1>
        <p className="mt-3 text-neutral-600 max-w-2xl">
          Build contact databases, design beautiful templates, send through your own verified domains via Amazon SES.
          Rotate domains per campaign, segment by tags, and track every event — all on your stack.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {tiles.map(t => (
          <div key={t.href} className="border border-neutral-200 rounded-lg p-6 bg-white hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <h2 className="font-serif text-xl text-[#344a57]">{t.label}</h2>
              <span className="text-2xl font-light text-[#344a57]">{t.stat}</span>
            </div>
            <p className="text-sm text-neutral-600 mt-2 min-h-[3rem]">{t.desc}</p>
            {t.disabled
              ? <span className="inline-block mt-4 text-xs uppercase tracking-wider text-neutral-400">{t.cta}</span>
              : <Link href={t.href} className="inline-block mt-4 px-4 py-2 bg-[#344a57] text-white text-sm rounded hover:bg-[#2a3c47] transition-colors">{t.cta} →</Link>}
          </div>
        ))}
      </div>
    </div>
  );
}
