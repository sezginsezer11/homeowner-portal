// components/email/ContactsManager.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import type { EmailContact, EmailTag, ContactStatus } from '@/lib/email/types';

export default function ContactsManager() {
  const [contacts, setContacts] = useState<EmailContact[]>([]);
  const [tags, setTags] = useState<EmailTag[]>([]);
  const [search, setSearch] = useState('');
  const [tagFilter, setTagFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<ContactStatus | ''>('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [editing, setEditing] = useState<EmailContact | null>(null);
  const [total, setTotal] = useState(0);

  const fetchContacts = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (tagFilter) params.set('tag', tagFilter);
    if (statusFilter) params.set('status', statusFilter);
    params.set('page_size', '100');
    const res = await fetch('/api/email/contacts?' + params.toString());
    const j = await res.json();
    setContacts(j.contacts || []);
    setTotal(j.total || 0);
    setLoading(false);
  }, [search, tagFilter, statusFilter]);

  const fetchTags = useCallback(async () => {
    const res = await fetch('/api/email/tags');
    const j = await res.json();
    setTags(j.tags || []);
  }, []);

  useEffect(() => { fetchTags(); }, [fetchTags]);
  useEffect(() => {
    const id = setTimeout(fetchContacts, 250);
    return () => clearTimeout(id);
  }, [fetchContacts]);

  const toggleAll = () => {
    if (selected.size === contacts.length) setSelected(new Set());
    else setSelected(new Set(contacts.map(c => c.id)));
  };

  const toggleOne = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id); else next.add(id);
    setSelected(next);
  };

  const bulkDelete = async () => {
    if (selected.size === 0) return;
    if (!confirm(`Delete ${selected.size} contact${selected.size > 1 ? 's' : ''}? This cannot be undone.`)) return;
    await fetch('/api/email/contacts', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids: Array.from(selected) }),
    });
    setSelected(new Set());
    fetchContacts();
  };

  return (
    <div className="px-6 py-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-end justify-between mb-6 flex-wrap gap-4">
        <div>
          <Link href="/dashboard/email" className="text-xs uppercase tracking-wider text-neutral-500 hover:text-[#344a57]">
            ← Email
          </Link>
          <h1 className="font-serif text-3xl text-[#344a57] mt-1">Contacts</h1>
          <p className="text-sm text-neutral-600 mt-1">{total.toLocaleString()} total</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowImport(true)}
            className="px-4 py-2 border border-[#344a57] text-[#344a57] text-sm rounded hover:bg-[#344a57] hover:text-white transition-colors"
          >Import CSV</button>
          <button
            onClick={() => setShowAdd(true)}
            className="px-4 py-2 bg-[#344a57] text-white text-sm rounded hover:bg-[#2a3c47] transition-colors"
          >+ Add contact</button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-4 flex-wrap items-center bg-white border border-neutral-200 rounded p-3">
        <input
          type="text"
          placeholder="Search email, name, company…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="px-3 py-2 border border-neutral-300 rounded text-sm flex-1 min-w-[200px]"
        />
        <select
          value={tagFilter}
          onChange={e => setTagFilter(e.target.value)}
          className="px-3 py-2 border border-neutral-300 rounded text-sm"
        >
          <option value="">All tags</option>
          {tags.map(t => (
            <option key={t.id} value={t.id}>{t.name}{t.contact_count ? ` (${t.contact_count})` : ''}</option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value as ContactStatus | '')}
          className="px-3 py-2 border border-neutral-300 rounded text-sm"
        >
          <option value="">Any status</option>
          <option value="subscribed">Subscribed</option>
          <option value="unsubscribed">Unsubscribed</option>
          <option value="bounced">Bounced</option>
          <option value="complained">Complained</option>
          <option value="pending">Pending</option>
        </select>
        {selected.size > 0 && (
          <button
            onClick={bulkDelete}
            className="px-3 py-2 bg-red-600 text-white text-sm rounded hover:bg-red-700"
          >Delete {selected.size}</button>
        )}
      </div>

      {/* Table */}
      <div className="bg-white border border-neutral-200 rounded overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-neutral-50 border-b border-neutral-200">
            <tr>
              <th className="p-3 w-10">
                <input type="checkbox"
                  checked={contacts.length > 0 && selected.size === contacts.length}
                  onChange={toggleAll} />
              </th>
              <th className="text-left p-3 font-medium text-neutral-700">Email</th>
              <th className="text-left p-3 font-medium text-neutral-700">Name</th>
              <th className="text-left p-3 font-medium text-neutral-700">Tags</th>
              <th className="text-left p-3 font-medium text-neutral-700">Status</th>
              <th className="text-left p-3 font-medium text-neutral-700">Added</th>
              <th className="w-10"></th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan={7} className="p-8 text-center text-neutral-500">Loading…</td></tr>
            )}
            {!loading && contacts.length === 0 && (
              <tr><td colSpan={7} className="p-8 text-center text-neutral-500">
                No contacts yet. Add one manually or import a CSV.
              </td></tr>
            )}
            {contacts.map(c => (
              <tr key={c.id} className="border-b border-neutral-100 hover:bg-neutral-50">
                <td className="p-3">
                  <input type="checkbox" checked={selected.has(c.id)} onChange={() => toggleOne(c.id)} />
                </td>
                <td className="p-3 font-mono text-xs">{c.email}</td>
                <td className="p-3">{[c.first_name, c.last_name].filter(Boolean).join(' ') || <span className="text-neutral-400">—</span>}</td>
                <td className="p-3">
                  <div className="flex flex-wrap gap-1">
                    {(c.tags || []).map(t => (
                      <span key={t.id}
                        className="px-2 py-0.5 text-[10px] rounded-full text-white"
                        style={{ backgroundColor: t.color }}>{t.name}</span>
                    ))}
                  </div>
                </td>
                <td className="p-3">
                  <StatusBadge status={c.status} />
                </td>
                <td className="p-3 text-xs text-neutral-500">{new Date(c.created_at).toLocaleDateString()}</td>
                <td className="p-3 text-right">
                  <button onClick={() => setEditing(c)} className="text-[#344a57] text-xs hover:underline">Edit</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showAdd && <ContactForm tags={tags} onClose={() => setShowAdd(false)} onSaved={() => { setShowAdd(false); fetchContacts(); fetchTags(); }} />}
      {editing && <ContactForm contact={editing} tags={tags} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); fetchContacts(); fetchTags(); }} />}
      {showImport && <ImportDialog tags={tags} onClose={() => setShowImport(false)} onDone={() => { setShowImport(false); fetchContacts(); fetchTags(); }} />}
    </div>
  );
}

function StatusBadge({ status }: { status: ContactStatus }) {
  const map: Record<ContactStatus, string> = {
    subscribed: 'bg-green-100 text-green-800',
    unsubscribed: 'bg-neutral-200 text-neutral-700',
    bounced: 'bg-red-100 text-red-800',
    complained: 'bg-amber-100 text-amber-800',
    pending: 'bg-blue-100 text-blue-800',
  };
  return <span className={`px-2 py-0.5 text-[10px] rounded ${map[status]}`}>{status}</span>;
}

// ---------- Add / Edit dialog ----------
function ContactForm({ contact, tags, onClose, onSaved }: { contact?: EmailContact; tags: EmailTag[]; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({
    email: contact?.email || '',
    first_name: contact?.first_name || '',
    last_name: contact?.last_name || '',
    phone: contact?.phone || '',
    company: contact?.company || '',
    notes: contact?.notes || '',
    status: contact?.status || 'subscribed' as ContactStatus,
  });
  const [tagIds, setTagIds] = useState<Set<string>>(new Set((contact?.tags || []).map(t => t.id)));
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const save = async () => {
    setSaving(true); setErr(null);
    const url = contact ? `/api/email/contacts/${contact.id}` : '/api/email/contacts';
    const method = contact ? 'PATCH' : 'POST';
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, tag_ids: Array.from(tagIds) }),
    });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setErr(j.error || 'Save failed');
      setSaving(false);
      return;
    }
    onSaved();
  };

  return (
    <Modal onClose={onClose} title={contact ? 'Edit contact' : 'Add contact'}>
      <div className="space-y-3">
        <Field label="Email *">
          <input className="input" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="First name"><input className="input" value={form.first_name} onChange={e => setForm({ ...form, first_name: e.target.value })} /></Field>
          <Field label="Last name"><input className="input" value={form.last_name} onChange={e => setForm({ ...form, last_name: e.target.value })} /></Field>
        </div>
        <Field label="Phone"><input className="input" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} /></Field>
        <Field label="Company"><input className="input" value={form.company} onChange={e => setForm({ ...form, company: e.target.value })} /></Field>
        <Field label="Notes"><textarea className="input min-h-[80px]" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} /></Field>
        <Field label="Status">
          <select className="input" value={form.status} onChange={e => setForm({ ...form, status: e.target.value as ContactStatus })}>
            <option value="subscribed">Subscribed</option>
            <option value="unsubscribed">Unsubscribed</option>
            <option value="bounced">Bounced</option>
            <option value="complained">Complained</option>
            <option value="pending">Pending</option>
          </select>
        </Field>
        <Field label="Tags">
          <div className="flex flex-wrap gap-2 mt-1">
            {tags.length === 0 && <span className="text-xs text-neutral-500">No tags yet — create some on the Tags page.</span>}
            {tags.map(t => {
              const on = tagIds.has(t.id);
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => {
                    const n = new Set(tagIds);
                    if (n.has(t.id)) n.delete(t.id); else n.add(t.id);
                    setTagIds(n);
                  }}
                  className={`px-3 py-1 text-xs rounded-full border transition-colors ${on ? 'text-white' : 'text-neutral-700 bg-white'}`}
                  style={{ backgroundColor: on ? t.color : 'transparent', borderColor: t.color }}
                >{t.name}</button>
              );
            })}
          </div>
        </Field>
        {err && <p className="text-red-600 text-sm">{err}</p>}
      </div>
      <div className="flex justify-end gap-2 mt-6">
        <button onClick={onClose} className="px-4 py-2 text-sm text-neutral-600 hover:text-neutral-900">Cancel</button>
        <button onClick={save} disabled={saving} className="px-4 py-2 bg-[#344a57] text-white text-sm rounded hover:bg-[#2a3c47] disabled:opacity-50">
          {saving ? 'Saving…' : 'Save'}
        </button>
      </div>
    </Modal>
  );
}

// ---------- CSV import ----------
function ImportDialog({ tags, onClose, onDone }: { tags: EmailTag[]; onClose: () => void; onDone: () => void }) {
  const [csv, setCsv] = useState('');
  const [defaultTags, setDefaultTags] = useState<Set<string>>(new Set());
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<{ inserted: number; skipped: number; errors: { row: number; error: string }[] } | null>(null);

  const run = async () => {
    setRunning(true);
    const lines = csv.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    if (lines.length < 1) { setRunning(false); return; }
    const header = lines[0].split(',').map(s => s.trim().toLowerCase().replace(/^"|"$/g, ''));
    const rows = lines.slice(1).map(line => {
      const cells = parseCsvLine(line);
      const obj: Record<string, string> = {};
      header.forEach((h, i) => { obj[h] = (cells[i] || '').trim(); });
      return obj;
    });
    const res = await fetch('/api/email/contacts/import', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rows, default_tag_ids: Array.from(defaultTags) }),
    });
    const j = await res.json();
    setResult(j);
    setRunning(false);
  };

  return (
    <Modal onClose={onClose} title="Import contacts from CSV" wide>
      {!result && (
        <>
          <p className="text-sm text-neutral-600 mb-3">
            Paste your CSV below. First row must be headers. Recognized columns:{' '}
            <code className="text-xs">email, first_name, last_name, phone, company, notes</code>. Other columns become custom fields.
          </p>
          <textarea
            value={csv}
            onChange={e => setCsv(e.target.value)}
            placeholder={`email,first_name,last_name,phone\njane@example.com,Jane,Doe,8585551234\njohn@example.com,John,Smith,8585551235`}
            className="w-full min-h-[260px] border border-neutral-300 rounded p-3 font-mono text-xs"
          />
          {tags.length > 0 && (
            <div className="mt-3">
              <p className="text-sm text-neutral-700 mb-2">Apply tags to all imported contacts (optional):</p>
              <div className="flex flex-wrap gap-2">
                {tags.map(t => {
                  const on = defaultTags.has(t.id);
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => {
                        const n = new Set(defaultTags);
                        if (n.has(t.id)) n.delete(t.id); else n.add(t.id);
                        setDefaultTags(n);
                      }}
                      className="px-3 py-1 text-xs rounded-full border"
                      style={{ backgroundColor: on ? t.color : 'transparent', color: on ? '#fff' : '#374151', borderColor: t.color }}
                    >{t.name}</button>
                  );
                })}
              </div>
            </div>
          )}
          <div className="flex justify-end gap-2 mt-4">
            <button onClick={onClose} className="px-4 py-2 text-sm text-neutral-600">Cancel</button>
            <button onClick={run} disabled={running || !csv.trim()} className="px-4 py-2 bg-[#344a57] text-white text-sm rounded disabled:opacity-50">
              {running ? 'Importing…' : 'Import'}
            </button>
          </div>
        </>
      )}
      {result && (
        <div>
          <p className="font-serif text-xl text-[#344a57]">Import complete</p>
          <ul className="mt-3 text-sm text-neutral-700 space-y-1">
            <li>Inserted/updated: <strong>{result.inserted}</strong></li>
            <li>Skipped (bad/missing email): <strong>{result.skipped}</strong></li>
            <li>Errors: <strong>{result.errors.length}</strong></li>
          </ul>
          {result.errors.length > 0 && (
            <details className="mt-3 text-xs">
              <summary className="cursor-pointer text-neutral-600">Show errors</summary>
              <pre className="bg-neutral-50 p-2 mt-2 rounded max-h-40 overflow-auto">{result.errors.map(e => `Row ${e.row}: ${e.error}`).join('\n')}</pre>
            </details>
          )}
          <div className="flex justify-end mt-4">
            <button onClick={onDone} className="px-4 py-2 bg-[#344a57] text-white text-sm rounded">Done</button>
          </div>
        </div>
      )}
    </Modal>
  );
}

function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let cur = '', inQ = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"' && line[i+1] === '"') { cur += '"'; i++; }
    else if (ch === '"') inQ = !inQ;
    else if (ch === ',' && !inQ) { result.push(cur); cur = ''; }
    else cur += ch;
  }
  result.push(cur);
  return result;
}

// ---------- Generic modal + field ----------
function Modal({ children, onClose, title, wide }: { children: React.ReactNode; onClose: () => void; title: string; wide?: boolean }) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className={`bg-white rounded-lg p-6 w-full ${wide ? 'max-w-3xl' : 'max-w-lg'} max-h-[90vh] overflow-y-auto`} onClick={e => e.stopPropagation()}>
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
      <style jsx>{`
        :global(.input) {
          display: block;
          width: 100%;
          padding: 0.5rem 0.75rem;
          margin-top: 0.25rem;
          border: 1px solid #d4d4d4;
          border-radius: 4px;
          font-size: 0.875rem;
        }
        :global(.input:focus) { outline: none; border-color: #344a57; }
      `}</style>
    </label>
  );
}
