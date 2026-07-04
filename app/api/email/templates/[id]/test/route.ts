// app/api/email/templates/[id]/test/route.ts
// POST { to: "your@email.com" } — sends the template's current html_body as a one-off test.
import { NextResponse } from 'next/server';
import { getEmailSupabase } from '@/lib/email/supabase-server';
import { sesSendEmail } from '@/lib/email/ses-client';
import { pickDomain } from '@/lib/email/domain-router';
import { renderTemplate, renderSubject } from '@/lib/email/template-render';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await getEmailSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { to } = await req.json();
  if (!to || !/^.+@.+\..+/.test(String(to))) {
    return NextResponse.json({ error: 'valid "to" address required' }, { status: 400 });
  }

  const { data: template, error } = await supabase
    .from('email_templates').select('*')
    .eq('user_id', user.id).eq('id', id).single();
  if (error) return NextResponse.json({ error: error.message }, { status: 404 });

  const picked = await pickDomain({ userId: user.id, strategy: 'random', recipientEmail: to });
  if (!picked) return NextResponse.json({ error: 'no verified sending domain available' }, { status: 400 });

  const fakeContact: any = {
    id: 'test', user_id: user.id, email: to,
    first_name: 'Test', last_name: 'User', status: 'subscribed',
    created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
  };

  const html = '<!-- TEST EMAIL -->\n' + renderTemplate(template.html_body || '', {
    contact: fakeContact, fallbacks: { first_name: 'there' },
  });
  const subject = '[TEST] ' + renderSubject(template.subject || template.name, { contact: fakeContact });

  try {
    const messageId = await sesSendEmail({
      region: picked.domain.region,
      fromAddress: picked.fromAddress,
      to,
      replyTo: picked.domain.default_reply_to || undefined,
      subject, html,
      configurationSetName: process.env.AWS_SES_CONFIGURATION_SET,
    });
    return NextResponse.json({ ok: true, message_id: messageId, sent_via: picked.domain.domain });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'send failed' }, { status: 500 });
  }
}
