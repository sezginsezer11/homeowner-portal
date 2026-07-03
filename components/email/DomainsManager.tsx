// components/email/DomainsManager.tsx
'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';

type Domain = {
  id: string;
  domain: string;
  region: string;
  status: string;
  spf_ok: boolean; dkim_ok: boolean; dmarc_ok: boolean;
  daily_quota: number; daily_sent_today: number;
  warmup_stage: number; weight: number;
  is_active: boolean;
  pool_tags: string[];
  default_from_name: string | null;
  default_from_local: string;
  default_reply_to: string | null;
};

type DnsRec = { host: string; type: string; value: string };
type Dns = { domain: string; dkim: DnsRec[]; spf: DnsRec; dmarc: DnsRec; mxNote: string };

export default function DomainsManager() {
  const [domains, setDomains] = useState<Domain[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [dnsFor, setDnsFor] = useState<{ domain: Domain; dns: Dns } | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    const r = await fetch('/api/email/domains');
    const j = await r.json();
    setDomains(j.domains || []);
    setLoading(false);
  }, []);
  useEffect(() => { refresh(); }, [refresh]);

  const verify = async (d: Domain) => {
    const r = await fetch(`/api/email/domains/${d.id}/verify`, { method: 'POST' });
    if (!r.ok) { alert('Verification check failed'); return; }
    refresh();
  };
  const togglePause = async (d: Domain) => {
    await fetch(`/api/email/domains/${d.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: !d.is_active }),
    });
    refresh();
  };
  const remove = async (d: Domain) => {
    if (!confirm(`Remove ${d.domain}? This deletes the identity from SES too.`)) return;
    await fetch(`/api/email/domains/${d.id}`, { method: 'DELETE' });
    refresh();
  };
  const showDns = async (d: Domain) => {
    const r = await fetch(`/api/email/domains/${d.id}`);
    const j = await r.json();
    setDnsFor({ domain: j.domain, dns: j.dns });
  };

  return (
    <div className="px-6 py-8 max-w-7xl mx-auto">
      <div className="flex items-end justify-between mb-6 flex-wrap gap-4">
        <div>
          <Link href="/dashboard/email" className="text-xs uppercase tracking-wider text-neutral-500 hover:text-[#344a57]">← Email</Link>
          <h1 className="font-serif text-3xl text-[#344a57] mt-1">Sending domains</h1>
          <p className="text-sm text-neutral-600 mt-1">Verify a domain in SES, paste its DNS records, and start sending. Add as many as you want; rotate across them per campaign.</p>
        </div>
        <button onClick={() => setShowAdd(true)} className="px-4 py-2 bg-[#344a57] text-white text-sm rounded hover:bg-[#2a3c47]">+ Add domain</button>
      </div>

      {loading && <p className="text-neutral-500">Loading…</p>}
      {!loading && domains.length === 0 && (
        <div className="border border-dashed border-neutral-300 rounded-lg p-8 text-center bg-white">
          <p className="text-neutral-700 mb-3 font-serif text-lg">No sending domains yet.</p>
          <p className="text-sm text-neutral-500 max-w-md mx-auto">Add your first sending domain to start. We'll register it in SES and give you the DNS records to paste at your registrar.</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {domains.map(d => (
          <div key={d.id} className="bg-white border border-neutral-200 rounded-lg p-5">
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[#344a57]">{d.domain}</span>
                  <StatusPill status={d.status} active={d.is_active} />
                </div>
                <p className="text-xs text-neutral-500 mt-1">{d.region}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-neutral-500">Today</p>
                <p className="font-mono text-sm">{d.daily_sent_today} / {Math.floor(d.daily_quota * Math.max(0.05, d.warmup_stage/10))}</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 mt-4 text-xs">
              <Check label="SPF"   ok={d.spf_ok} />
              <Check label="DKIM"  ok={d.dkim_ok} />
              <Check label="DMARC" ok={d.dmarc_ok} />
            </div>

            {d.pool_tags.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1">
                {d.pool_tags.map(t => (
                  <span key={t} className="px-2 py-0.5 text-[10px] rounded-full bg-neutral-100 text-neutral-700">{t}</span>
                ))}
              </div>
            )}

            <div className="flex gap-3 mt-4 pt-3 border-t border-neutral-100 text-xs">
              <button onClick={() => showDns(d)} className="text-[#344a57] hover:underline">DNS records</button>
              <button onClick={() => verify(d)} className="text-[#344a57] hover:underline">Re-check</button>
              <button onClick={() => togglePause(d)} className="text-[#344a57] hover:underline">{d.is_active ? 'Pause' : 'Resume'}</button>
              <button onClick={() => remove(d)} className="text-red-600 hover:underline ml-auto">Remove</button>
            </div>
          </div>
        ))}
      </div>

      {showAdd && <AddDomainDialog onClose={() => setShowAdd(false)} onCreated={(d, dns) => { setShowAdd(false); refresh(); setDnsFor({ domain: d, dns }); }} />}
      {dnsFor && <DnsDialog data={dnsFor} onClose={() => setDnsFor(null)} />}
    </div>
  );
}

function StatusPill({ status, active }: { status: string; active: boolean }) {
  if (!active) return <span className="px-2 py-0.5 text-[10px] rounded bg-neutral-200 text-neutral-700">paused</span>;
  const map: Record<string, string> = {
    verified: 'bg-green-100 text-green-800',
    verifying: 'bg-blue-100 text-blue-800',
    pending: 'bg-blue-100 text-blue-800',
    failed: 'bg-red-100 text-red-800',
    blacklisted: 'bg-red-100 text-red-800',
  };
  return <span className={`px-2 py-0.5 text-[10px] rounded ${map[status] || 'bg-neutral-100 text-neutral-700'}`}>{status}</span>;
}

function Check({ label, ok }: { label: string; ok: boolean }) {
  return (
    <div className={`flex items-center gap-1 px-2 py-1 rounded ${ok ? 'bg-green-50 text-green-800' : 'bg-neutral-50 text-neutral-500'}`}>
      <span>{ok ? '✓' : '○'}</span>
      <span>{label}</span>
    </div>
  );
}

function AddDomainDialog({ onClose, onCreated }: { onClose: () => void; onCreated: (d: Domain, dns: Dns) => void }) {
  const [domain, setDomain] = useState('');
  const [region, setRegion] = useState('us-east-1');
  const [fromName, setFromName] = useState('');
  const [fromLocal, setFromLocal] = useState('hello');
  const [poolTagsRaw, setPoolTagsRaw] = useState('');
  const [dailyQuota, setDailyQuota] = useState(50);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const save = async () => {
    setSaving(true); setErr(null);
    const r = await fetch('/api/email/domains', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        domain, region,
        default_from_name: fromName || null,
        default_from_local: fromLocal,
        pool_tags: poolTagsRaw.split(',').map(s => s.trim()).filter(Boolean),
        daily_quota: dailyQuota,
      }),
    });
    const j = await r.json();
    if (!r.ok) { setErr(j.error || 'failed'); setSaving(false); return; }
    onCreated(j.domain, j.dns);
  };

  return (
    <Modal onClose={onClose} title="Add sending domain">
      <div className="space-y-3">
        <Field label="Domain *">
          <input className="inp" placeholder="mail-a.yourdomain.com" value={domain} onChange={e => setDomain(e.target.value)} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="AWS region">
            <select className="inp" value={region} onChange={e => setRegion(e.target.value)}>
              <option value="us-east-1">us-east-1 (N. Virginia)</option>
              <option value="us-west-2">us-west-2 (Oregon)</option>
              <option value="eu-west-1">eu-west-1 (Ireland)</option>
              <option value="ap-southeast-1">ap-southeast-1 (Singapore)</option>
            </select>
          </Field>
          <Field label="Daily quota (warmup ramps this)">
            <input className="inp" type="number" min={1} value={dailyQuota} onChange={e => setDailyQuota(parseInt(e.target.value) || 50)} />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label='Default "from" name'>
            <input className="inp" placeholder="Sez Sezer" value={fromName} onChange={e => setFromName(e.target.value)} />
          </Field>
          <Field label='"from" local part'>
            <input className="inp" placeholder="hello" value={fromLocal} onChange={e => setFromLocal(e.target.value)} />
          </Field>
        </div>
        <Field label="Pool tags (comma separated — e.g. newsletter, prospecting)">
          <input className="inp" value={poolTagsRaw} onChange={e => setPoolTagsRaw(e.target.value)} placeholder="newsletter" />
        </Field>
        {err && <p className="text-red-600 text-sm">{err}</p>}
      </div>
      <div className="flex justify-end gap-2 mt-6">
        <button onClick={onClose} className="px-4 py-2 text-sm text-neutral-600">Cancel</button>
        <button onClick={save} disabled={saving || !domain} className="px-4 py-2 bg-[#344a57] text-white text-sm rounded disabled:opacity-50">
          {saving ? 'Creating…' : 'Create + show DNS'}
        </button>
      </div>
      <style jsx>{`
        :global(.inp){display:block;width:100%;padding:.5rem .75rem;margin-top:.25rem;border:1px solid #d4d4d4;border-radius:4px;font-size:.875rem}
        :global(.inp:focus){outline:none;border-color:#344a57}
      `}</style>
    </Modal>
  );
}

function DnsDialog({ data, onClose }: { data: { domain: Domain; dns: Dns }; onClose: () => void }) {
  const { domain, dns } = data;
  const rows: { label: string; host: string; type: string; value: string }[] = [];
  dns.dkim.forEach((r, i) => rows.push({ label: `DKIM #${i + 1}`, host: r.host, type: r.type, value: r.value }));
  rows.push({ label: 'SPF',   host: dns.spf.host,   type: dns.spf.type,   value: dns.spf.value });
  rows.push({ label: 'DMARC', host: dns.dmarc.host, type: dns.dmarc.type, value: dns.dmarc.value });

  return (
    <Modal onClose={onClose} title={`DNS records for ${domain.domain}`} wide>
      <p className="text-sm text-neutral-600 mb-4">
        Paste these records at your domain registrar (Cloudflare, Namecheap, Google Domains, etc.).
        DKIM verification usually completes within a few minutes; sometimes up to 72 hours.
      </p>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead className="bg-neutral-50 border-b border-neutral-200">
            <tr>
              <th className="text-left p-2">Record</th>
              <th className="text-left p-2">Type</th>
              <th className="text-left p-2">Host / Name</th>
              <th className="text-left p-2">Value</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} className="border-b border-neutral-100">
                <td className="p-2 font-medium text-[#344a57]">{r.label}</td>
                <td className="p-2 font-mono">{r.type}</td>
                <td className="p-2 font-mono">{r.host}</td>
                <td className="p-2 font-mono break-all">{r.value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-neutral-500 mt-4">{dns.mxNote}</p>
      <div className="flex justify-end mt-4">
        <button onClick={onClose} className="px-4 py-2 bg-[#344a57] text-white text-sm rounded">Done — I'll add these now</button>
      </div>
    </Modal>
  );
}

function Modal({ children, onClose, title, wide }: { children: React.ReactNode; onClose: () => void; title: string; wide?: boolean }) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className={`bg-white rounded-lg p-6 w-full ${wide ? 'max-w-4xl' : 'max-w-lg'} max-h-[90vh] overflow-y-auto`} onClick={e => e.stopPropagation()}>
        <h2 className="font-serif text-2xl text-[#344a57] mb-4">{title}</h2>
        {children}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs uppercase tracking-wider text-neutral-600">{label}</span>
      {children}
    </label>
  );
}
