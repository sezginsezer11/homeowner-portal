// components/email/CampaignBuilder.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

type Tag = { id: string; name: string; color: string; contact_count?: number };
type Domain = { id: string; domain: string; pool_tags: string[]; status: string; is_active: boolean };
type Template = { id: string; name: string; subject: string; preheader: string; html_body: string };
type Campaign = any;

export default function CampaignBuilder({ campaignId }: { campaignId?: string }) {
  const router = useRouter();
  const [tags, setTags] = useState<Tag[]>([]);
  const [domains, setDomains] = useState<Domain[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [pools, setPools] = useState<string[]>([]);
  const [bodyMode, setBodyMode] = useState<'template' | 'html'>('html');
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [c, setC] = useState<Campaign>({
    name: '', subject: '', preheader: '', from_name: '', from_email: '', reply_to: '',
    html_body: defaultHtml(),
    template_id: null,
    segment: { include_tags: [], exclude_tags: [], match_all_tags: false, statuses: ['subscribed'] },
    domain_pool_tag: '', domain_ids: [], rotation_strategy: 'round_robin', status: 'draft',
  });
  const [preview, setPreview] = useState<{ deliverable: number; total_in_segment: number; suppressed_count: number; sample: any[] } | null>(null);
  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState(false);
  const [testTo, setTestTo] = useState('');
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  // Load supporting data
  useEffect(() => {
    fetch('/api/email/tags').then(r => r.json()).then(j => setTags(j.tags || []));
    fetch('/api/email/templates').then(r => r.json()).then(j => setTemplates(j.templates || []));
    fetch('/api/email/domains').then(r => r.json()).then(j => {
      const ds: Domain[] = j.domains || [];
      setDomains(ds);
      const poolSet = new Set<string>();
      ds.forEach(d => d.pool_tags.forEach(t => poolSet.add(t)));
      setPools(Array.from(poolSet));
    });
  }, []);

  // Load existing campaign
  useEffect(() => {
    if (!campaignId) return;
    fetch(`/api/email/campaigns/${campaignId}`).then(r => r.json()).then(j => {
      if (j.campaign) {
        setC({ ...j.campaign, segment: j.campaign.segment || { include_tags: [], exclude_tags: [], match_all_tags: false, statuses: ['subscribed'] } });
        if (j.campaign.template_id) {
          setSelectedTemplateId(j.campaign.template_id);
          setBodyMode('template');
        }
      }
    });
  }, [campaignId]);

  // When user picks a template, fetch its HTML + auto-fill subject/preheader if empty
  const applyTemplate = async (id: string) => {
    setSelectedTemplateId(id);
    if (!id) return;
    const r = await fetch(`/api/email/templates/${id}`);
    const j = await r.json();
    if (j.template) {
      setC((prev: any) => ({
        ...prev,
        template_id: id,
        html_body: j.template.html_body || '',
        subject: prev.subject || j.template.subject || '',
        preheader: prev.preheader || j.template.preheader || '',
      }));
    }
  };

  // Live segment preview
  const refreshPreview = useCallback(async () => {
    const r = await fetch('/api/email/segment-preview', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ segment: c.segment }),
    });
    setPreview(await r.json());
  }, [c.segment]);
  useEffect(() => { const id = setTimeout(refreshPreview, 300); return () => clearTimeout(id); }, [refreshPreview]);

  const save = async (): Promise<string | null> => {
    setSaving(true); setErr(null); setMsg(null);
    const url = campaignId ? `/api/email/campaigns/${campaignId}` : '/api/email/campaigns';
    const method = campaignId ? 'PATCH' : 'POST';
    const r = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(c) });
    const j = await r.json();
    setSaving(false);
    if (!r.ok) { setErr(j.error || 'save failed'); return null; }
    if (!campaignId && j.campaign?.id) router.replace(`/dashboard/email/campaigns/${j.campaign.id}`);
    setMsg('Saved');
    return j.campaign?.id || campaignId || null;
  };

  const sendTest = async () => {
    setErr(null); setMsg(null);
    if (!testTo) { setErr('enter a test address'); return; }
    const id = await save(); if (!id) return;
    const r = await fetch(`/api/email/campaigns/${id}/test`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ to: testTo }),
    });
    const j = await r.json();
    if (!r.ok) setErr(j.error || 'test failed');
    else setMsg(`Test sent via ${j.sent_via}`);
  };

  const sendCampaign = async () => {
    if (!confirm(`Send to ${preview?.deliverable || 0} recipients?`)) return;
    setSending(true); setErr(null); setMsg(null);
    const id = await save(); if (!id) { setSending(false); return; }
    const r = await fetch(`/api/email/campaigns/${id}/send`, { method: 'POST' });
    const j = await r.json();
    setSending(false);
    if (!r.ok) { setErr(j.error || 'send failed'); return; }
    setMsg(`Dispatched ${j.sent} in this batch. ${j.remaining_queued > 0 ? `${j.remaining_queued} remaining — click send again to continue.` : 'Complete.'}`);
    refreshPreview();
  };

  return (
    <div className="px-6 py-8 max-w-7xl mx-auto">
      <Link href="/dashboard/email/campaigns" className="text-xs uppercase tracking-wider text-neutral-500 hover:text-[#344a57]">← Campaigns</Link>
      <h1 className="font-serif text-3xl text-[#344a57] mt-1 mb-6">{campaignId ? c.name || 'Campaign' : 'New campaign'}</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Compose */}
        <div className="lg:col-span-2 space-y-4">
          <Card title="Basics">
            <Row>
              <Field label="Campaign name (internal)"><input className="inp" value={c.name} onChange={e => setC({ ...c, name: e.target.value })} /></Field>
            </Row>
            <Row>
              <Field label="Subject *"><input className="inp" value={c.subject} onChange={e => setC({ ...c, subject: e.target.value })} placeholder="Use {{first_name}} for personalization" /></Field>
            </Row>
            <Row>
              <Field label="Preheader (preview text)"><input className="inp" value={c.preheader || ''} onChange={e => setC({ ...c, preheader: e.target.value })} /></Field>
            </Row>
          </Card>

          <Card title="Sending domain pool">
            <p className="text-sm text-neutral-600 mb-3">Pick a pool tag (e.g. "newsletter" or "prospecting") OR specific domains. Empty = use any verified domain.</p>
            <Row>
              <Field label="Pool tag">
                <select className="inp" value={c.domain_pool_tag || ''} onChange={e => setC({ ...c, domain_pool_tag: e.target.value || null, domain_ids: [] })}>
                  <option value="">(any verified domain)</option>
                  {pools.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </Field>
              <Field label="Rotation strategy">
                <select className="inp" value={c.rotation_strategy} onChange={e => setC({ ...c, rotation_strategy: e.target.value })}>
                  <option value="round_robin">Round-robin</option>
                  <option value="weighted">Weighted</option>
                  <option value="random">Random</option>
                  <option value="sticky_recipient">Sticky (same recipient → same domain)</option>
                </select>
              </Field>
            </Row>
            {!c.domain_pool_tag && (
              <div className="mt-3">
                <span className="text-xs uppercase tracking-wider text-neutral-600">Or pick specific domains:</span>
                <div className="flex flex-wrap gap-2 mt-2">
                  {domains.filter(d => d.is_active && d.status === 'verified').map(d => {
                    const on = (c.domain_ids || []).includes(d.id);
                    return (
                      <button key={d.id} type="button"
                        onClick={() => setC({ ...c, domain_ids: on ? c.domain_ids.filter((x: string) => x !== d.id) : [...(c.domain_ids || []), d.id] })}
                        className={`px-3 py-1 text-xs rounded-full border ${on ? 'bg-[#344a57] text-white border-[#344a57]' : 'border-neutral-300 text-neutral-700'}`}>
                        {d.domain}
                      </button>
                    );
                  })}
                  {domains.filter(d => d.is_active && d.status === 'verified').length === 0 && (
                    <p className="text-xs text-amber-700">No verified active domains yet. <Link href="/dashboard/email/domains" className="underline">Add one</Link>.</p>
                  )}
                </div>
              </div>
            )}
          </Card>

          <Card title="Audience">
            <p className="text-sm text-neutral-600 mb-3">
              Include contacts with <strong>any</strong> of these tags{c.segment.match_all_tags ? ' (all required)' : ''}:
            </p>
            <TagPicker tags={tags} selected={c.segment.include_tags || []} onChange={ids => setC({ ...c, segment: { ...c.segment, include_tags: ids } })} />
            <label className="text-xs mt-2 inline-flex items-center gap-2">
              <input type="checkbox" checked={!!c.segment.match_all_tags} onChange={e => setC({ ...c, segment: { ...c.segment, match_all_tags: e.target.checked } })} />
              Require ALL selected tags (instead of any)
            </label>
            <p className="text-sm text-neutral-600 mt-4 mb-2">Exclude contacts with any of these tags:</p>
            <TagPicker tags={tags} selected={c.segment.exclude_tags || []} onChange={ids => setC({ ...c, segment: { ...c.segment, exclude_tags: ids } })} />
          </Card>

          <Card title="Email body">
            <div className="flex gap-2 mb-3 border-b border-neutral-200">
              <button onClick={() => setBodyMode('template')} className={`px-3 py-1.5 text-sm border-b-2 ${bodyMode === 'template' ? 'border-[#344a57] text-[#344a57]' : 'border-transparent text-neutral-600'}`}>
                Use a template
              </button>
              <button onClick={() => setBodyMode('html')} className={`px-3 py-1.5 text-sm border-b-2 ${bodyMode === 'html' ? 'border-[#344a57] text-[#344a57]' : 'border-transparent text-neutral-600'}`}>
                Raw HTML
              </button>
              <button onClick={() => setShowPreview(true)} disabled={!c.html_body} className="ml-auto px-3 py-1.5 text-sm border border-neutral-300 rounded hover:bg-neutral-50 disabled:opacity-50">Preview</button>
            </div>

            {bodyMode === 'template' ? (
              <div>
                {templates.length === 0 ? (
                  <p className="text-sm text-neutral-600">
                    No templates yet. <Link href="/dashboard/email/templates/new" className="underline text-[#344a57]">Design one in the editor</Link>, then come back.
                  </p>
                ) : (
                  <>
                    <Field label="Pick a template">
                      <select className="inp" value={selectedTemplateId} onChange={e => applyTemplate(e.target.value)}>
                        <option value="">— Choose —</option>
                        {templates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                      </select>
                    </Field>
                    {selectedTemplateId && (
                      <p className="text-xs text-neutral-500 mt-2">
                        Template HTML is loaded. Variables like <code>{'{{first_name}}'}</code> are filled in at send time.
                        Edits to the template later won't change campaigns already saved.
                      </p>
                    )}
                  </>
                )}
              </div>
            ) : (
              <>
                <textarea className="inp font-mono text-xs min-h-[280px]" value={c.html_body || ''} onChange={e => setC({ ...c, html_body: e.target.value, template_id: null })} />
                <p className="text-xs text-neutral-500 mt-2">
                  Variables: <code>{'{{first_name}}'}</code>, <code>{'{{last_name}}'}</code>, <code>{'{{full_name}}'}</code>, <code>{'{{email}}'}</code>, <code>{'{{company}}'}</code>, <code>{'{{unsubscribe_url}}'}</code>, <code>{'{{tracking_pixel}}'}</code>.
                </p>
              </>
            )}
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <Card title="Recipients preview">
            {preview ? (
              <>
                <p className="text-4xl font-serif text-[#344a57]">{preview.deliverable.toLocaleString()}</p>
                <p className="text-sm text-neutral-600">deliverable recipients</p>
                <p className="text-xs text-neutral-500 mt-2">
                  {preview.total_in_segment.toLocaleString()} in segment, {preview.suppressed_count} suppressed.
                </p>
                {preview.sample.length > 0 && (
                  <details className="mt-3 text-xs">
                    <summary className="cursor-pointer text-neutral-600">Sample (first 10)</summary>
                    <ul className="mt-2 space-y-1 text-neutral-700">
                      {preview.sample.map((s, i) => <li key={i} className="font-mono">{s.email}</li>)}
                    </ul>
                  </details>
                )}
              </>
            ) : <p className="text-neutral-500 text-sm">Calculating…</p>}
          </Card>

          <Card title="Send test">
            <input className="inp" type="email" placeholder="you@example.com" value={testTo} onChange={e => setTestTo(e.target.value)} />
            <button onClick={sendTest} className="mt-2 w-full px-3 py-2 border border-[#344a57] text-[#344a57] text-sm rounded hover:bg-[#344a57] hover:text-white">Send test</button>
          </Card>

          <Card title="Save & send">
            <button onClick={save} disabled={saving} className="w-full px-3 py-2 border border-neutral-300 text-sm rounded hover:bg-neutral-50 disabled:opacity-50">{saving ? 'Saving…' : 'Save draft'}</button>
            <button onClick={sendCampaign} disabled={sending || !preview?.deliverable} className="w-full mt-2 px-3 py-2 bg-[#344a57] text-white text-sm rounded hover:bg-[#2a3c47] disabled:opacity-50">
              {sending ? 'Dispatching…' : `Send to ${preview?.deliverable || 0}`}
            </button>
            {msg && <p className="text-green-700 text-xs mt-2">{msg}</p>}
            {err && <p className="text-red-600 text-xs mt-2">{err}</p>}
          </Card>
        </div>
      </div>

      {showPreview && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={() => setShowPreview(false)}>
          <div className="bg-white rounded-lg w-full max-w-3xl h-[85vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="px-4 py-3 border-b border-neutral-200 flex items-center justify-between">
              <h2 className="font-serif text-xl text-[#344a57]">Email preview</h2>
              <button onClick={() => setShowPreview(false)} className="text-neutral-500 hover:text-neutral-900">×</button>
            </div>
            <iframe srcDoc={c.html_body} className="flex-1 w-full" sandbox="" />
          </div>
        </div>
      )}

      <style jsx>{`
        :global(.inp){display:block;width:100%;padding:.5rem .75rem;margin-top:.25rem;border:1px solid #d4d4d4;border-radius:4px;font-size:.875rem}
        :global(.inp:focus){outline:none;border-color:#344a57}
      `}</style>
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white border border-neutral-200 rounded p-4">
      <h3 className="font-serif text-lg text-[#344a57] mb-3">{title}</h3>
      {children}
    </div>
  );
}
function Row({ children }: { children: React.ReactNode }) { return <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-2">{children}</div>; }
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block"><span className="text-xs uppercase tracking-wider text-neutral-600">{label}</span>{children}</label>;
}

function TagPicker({ tags, selected, onChange }: { tags: Tag[]; selected: string[]; onChange: (ids: string[]) => void }) {
  if (tags.length === 0) return <p className="text-xs text-neutral-500">No tags yet. <Link href="/dashboard/email/tags" className="underline">Create some</Link>.</p>;
  return (
    <div className="flex flex-wrap gap-2">
      {tags.map(t => {
        const on = selected.includes(t.id);
        return (
          <button key={t.id} type="button"
            onClick={() => onChange(on ? selected.filter(x => x !== t.id) : [...selected, t.id])}
            className="px-3 py-1 text-xs rounded-full border"
            style={{ backgroundColor: on ? t.color : 'transparent', color: on ? '#fff' : '#374151', borderColor: t.color }}>
            {t.name}{t.contact_count != null ? ` (${t.contact_count})` : ''}
          </button>
        );
      })}
    </div>
  );
}

function defaultHtml(): string {
  return `<!doctype html>
<html><body style="margin:0;padding:0;font-family:Georgia,serif;color:#344a57;background:#fafafa">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#fafafa;padding:40px 0">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;max-width:600px">
        <tr><td style="padding:40px 40px 20px">
          <h1 style="margin:0 0 16px;font-size:28px;color:#344a57">Hello {{first_name}},</h1>
          <p style="font-size:16px;line-height:1.6;color:#555">Your message here.</p>
        </td></tr>
        <tr><td style="padding:20px 40px 40px;border-top:1px solid #eee;font-size:12px;color:#999">
          <p style="margin:0">You're receiving this because you subscribed. <a href="{{unsubscribe_url}}" style="color:#999">Unsubscribe</a></p>
        </td></tr>
      </table>
    </td></tr>
  </table>
  {{tracking_pixel}}
</body></html>`;
}
