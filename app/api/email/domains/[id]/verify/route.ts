// app/api/email/domains/[id]/verify/route.ts
// POST — re-check SES verification status and DKIM, update the row.
import { NextResponse } from 'next/server';
import { getEmailSupabase } from '@/lib/email/supabase-server';
import { sesGetIdentity } from '@/lib/email/ses-client';

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = getEmailSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { data: row } = await supabase
    .from('email_sending_domains')
    .select('*')
    .eq('user_id', user.id)
    .eq('id', id)
    .single();
  if (!row) return NextResponse.json({ error: 'not found' }, { status: 404 });

  const ses = await sesGetIdentity(row.domain, row.region);
  if (!ses) {
    await supabase.from('email_sending_domains').update({ status: 'failed' })
      .eq('id', id);
    return NextResponse.json({ error: 'identity not found in SES' }, { status: 404 });
  }

  // Also check SPF + DMARC at the DNS level (DKIM is reflected in SES status)
  const [spfOk, dmarcOk] = await Promise.all([
    checkSpf(row.domain),
    checkDmarc(row.domain),
  ]);

  const dkimOk = ses.dkimStatus === 'SUCCESS';
  const newStatus = ses.verified && dkimOk ? 'verified' : (ses.dkimStatus === 'FAILED' ? 'failed' : 'verifying');

  const { data: updated, error } = await supabase
    .from('email_sending_domains')
    .update({
      status: newStatus,
      dkim_ok: dkimOk,
      spf_ok: spfOk,
      dmarc_ok: dmarcOk,
      dkim_tokens: ses.dkimTokens.length ? ses.dkimTokens : row.dkim_tokens,
      last_checked_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ domain: updated, ses_status: ses });
}

// --- Lightweight DNS checks using Cloudflare DoH (no extra dependency) ---
async function dohTxt(name: string): Promise<string[]> {
  try {
    const r = await fetch(`https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(name)}&type=TXT`, {
      headers: { Accept: 'application/dns-json' },
    });
    const j: any = await r.json();
    return ((j.Answer || []) as any[])
      .filter(a => a.type === 16)
      .map(a => String(a.data).replace(/^"|"$/g, '').replace(/"\s+"/g, ''));
  } catch { return []; }
}

async function checkSpf(domain: string): Promise<boolean> {
  const txt = await dohTxt(domain);
  return txt.some(t => /v=spf1/i.test(t) && /amazonses\.com/i.test(t));
}

async function checkDmarc(domain: string): Promise<boolean> {
  const txt = await dohTxt(`_dmarc.${domain}`);
  return txt.some(t => /v=DMARC1/i.test(t));
}
