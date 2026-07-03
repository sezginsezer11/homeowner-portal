import { buildDnsInstructions } from '@/lib/email/dns';
// app/api/email/domains/route.ts
import { NextResponse } from 'next/server';
import { getEmailSupabase } from '@/lib/email/supabase-server';
import { sesCreateDomainIdentity } from '@/lib/email/ses-client';

export async function GET() {
  const supabase = await getEmailSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { data, error } = await supabase
    .from('email_sending_domains')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ domains: data || [] });
}

export async function POST(req: Request) {
  const supabase = await getEmailSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const body = await req.json();
  const domain: string = String(body.domain || '').toLowerCase().trim();
  const region: string = body.region || process.env.AWS_SES_DEFAULT_REGION || 'us-east-1';
  const defaultFromName: string | null = body.default_from_name || null;
  const defaultFromLocal: string = body.default_from_local || 'hello';
  const poolTags: string[] = Array.isArray(body.pool_tags) ? body.pool_tags : [];
  const dailyQuota: number = Math.max(1, parseInt(body.daily_quota) || 50);

  if (!domain || !/^[a-z0-9.-]+\.[a-z]{2,}$/.test(domain)) {
    return NextResponse.json({ error: 'invalid domain' }, { status: 400 });
  }

  // 1) Create the identity in SES
  let dkimTokens: string[] = [];
  try {
    const res = await sesCreateDomainIdentity(domain, region);
    dkimTokens = res.dkimTokens;
  } catch (err: any) {
    // If already exists in SES, fetch the tokens instead
    if (err?.name !== 'AlreadyExistsException') {
      return NextResponse.json({ error: `SES error: ${err?.message || err}` }, { status: 500 });
    }
  }

  // 2) Store in Supabase
  const { data, error } = await supabase
    .from('email_sending_domains')
    .insert({
      user_id: user.id,
      domain,
      region,
      status: 'verifying',
      dkim_tokens: dkimTokens,
      default_from_name: defaultFromName,
      default_from_local: defaultFromLocal,
      pool_tags: poolTags,
      daily_quota: dailyQuota,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  // 3) Return DNS instructions for the user to paste at their registrar
  const dns = buildDnsInstructions(domain, dkimTokens);
  return NextResponse.json({ domain: data, dns });
}

