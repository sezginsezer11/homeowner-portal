// components/email/TagsManager.tsx
'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import type { EmailTag } from '@/lib/email/types';

const PRESET_COLORS = [
  '#344a57', // Lake (brand)
  '#c9a96e', // Gold (accent — non-clickable, but fine as a tag color)
  '#2d5f3f',
  '#7a3535',
  '#5d4a8a',
  '#b07a2d',
  '#3a6b8c',
  '#8b4a6b',
];

export default function TagsManager() {
  const [tags, setTags] = useState<EmailTag[]>([]);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState<EmailTag | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  const fetchTags = useCallback(async () => {
    setLoading(true);
    const res = await fetch('/api/email/tags');
    const j = await res.json();
    setTags(j.tags || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchTags(); }, [fetchTags]);

  const remove = async (tag: EmailTag) => {
    if (!confirm(`Delete tag "${tag.name}"? Contacts won't be deleted, only the tag association.`)) return;
    await fetch(`/api/email/tags/${tag.id}`, { method: 'DELETE' });
    fetchTags();
  };

  return (
    <div className="px-6 py-8 max-w-5xl mx-auto">
      <div className="flex items-end justify-between mb-6 flex-wrap gap-4">
        <div>
          <Link href="/dashboard/email" className="text-xs uppercase tracking-wider text-neutral-500 hover:text-[#344a57]">
            ← Email
          </Link>
          <h1 className="font-serif text-3xl text-[#344a57] mt-1">Tags</h1>
          <p className="text-sm text-neutral-600 mt-1">
            Organize contacts by category — buyer, seller, neighborhood, lead temperature, anything.
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="px-4 py-2 bg-[#344a57] text-white text-sm rounded hover:bg-[#2a3c47]"
        >+ New tag</button>
      </div>

      {loading && <p className="text-neutral-500">Loading…</p>}
      {!loading && tags.length === 0 && (
        <div className="border border-dashed border-neutral-300 rounded-lg p-8 text-center">
          <p className="text-neutral-600 mb-3">No tags yet.</p>
          <p className="text-sm text-neutral-500 max-w-md mx-auto">
            Try starting with: <em>Buyer</em>, <em>Seller</em>, <em>Past client</em>, <em>Newsletter</em>, <em>Carmel Valley</em>, <em>Hot lead</em>.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {tags.map(t => (
          <div key={t.id} className="bg-white border border-neutral-200 rounded p-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: t.color }} />
                <span className="font-medium text-[#344a57]">{t.name}</span>
              </div>
              <span className="text-xs text-neutral-500">{t.contact_count ?? 0}</span>
            </div>
            {t.description && <p className="text-xs text-neutral-600 mt-2">{t.description}</p>}
            <div className="flex gap-3 mt-3">
              <button onClick={() => setEditing(t)} className="text-xs text-[#344a57] hover:underline">Edit</button>
              <button onClick={() => remove(t)} className="text-xs text-red-600 hover:underline">Delete</button>
            </div>
          </div>
        ))}
      </div>

      {showCreate && <TagForm onClose={() => setShowCreate(false)} onSaved={() => { setShowCreate(false); fetchTags(); }} />}
      {editing && <TagForm tag={editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); fetchTags(); }} />}
    </div>
  );
}

function TagForm({ tag, onClose, onSaved }: { tag?: EmailTag; onClose: () => void; onSaved: () => void }) {
  const [name, setName] = useState(tag?.name || '');
  const [color, setColor] = useState(tag?.color || PRESET_COLORS[0]);
  const [description, setDescription] = useState(tag?.description || '');
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const save = async () => {
    setSaving(true); setErr(null);
    const url = tag ? `/api/email/tags/${tag.id}` : '/api/email/tags';
    const method = tag ? 'PATCH' : 'POST';
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, color, description }),
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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-lg p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
        <h2 className="font-serif text-2xl text-[#344a57] mb-4">{tag ? 'Edit tag' : 'New tag'}</h2>
        <div className="space-y-3">
          <label className="block">
            <span className="text-xs uppercase tracking-wider text-neutral-600">Name *</span>
            <input value={name} onChange={e => setName(e.target.value)}
              className="w-full mt-1 px-3 py-2 border border-neutral-300 rounded text-sm" />
          </label>
          <label className="block">
            <span className="text-xs uppercase tracking-wider text-neutral-600">Color</span>
            <div className="flex gap-2 mt-2">
              {PRESET_COLORS.map(c => (
                <button key={c} type="button" onClick={() => setColor(c)}
                  className={`w-7 h-7 rounded-full border-2 ${color === c ? 'border-neutral-900' : 'border-transparent'}`}
                  style={{ backgroundColor: c }} />
              ))}
              <input type="color" value={color} onChange={e => setColor(e.target.value)}
                className="w-7 h-7 rounded-full border" />
            </div>
          </label>
          <label className="block">
            <span className="text-xs uppercase tracking-wider text-neutral-600">Description</span>
            <input value={description} onChange={e => setDescription(e.target.value)}
              className="w-full mt-1 px-3 py-2 border border-neutral-300 rounded text-sm" />
          </label>
          {err && <p className="text-red-600 text-sm">{err}</p>}
        </div>
        <div className="flex justify-end gap-2 mt-6">
          <button onClick={onClose} className="px-4 py-2 text-sm text-neutral-600">Cancel</button>
          <button onClick={save} disabled={saving || !name.trim()}
            className="px-4 py-2 bg-[#344a57] text-white text-sm rounded disabled:opacity-50">
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}
