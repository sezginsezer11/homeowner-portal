// components/email/TemplateEditor.tsx
'use client';

import { useEffect, useMemo, useState } from 'react';
import * as React from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { DEFAULT_DESIGN, newBlock } from '@/lib/email/blocks';
import type { Block, Design, BlockAlign } from '@/lib/email/blocks';

const PALETTE: { type: Block['type']; label: string; icon: string }[] = [
  { type: 'heading',   label: 'Heading',   icon: 'H' },
  { type: 'paragraph', label: 'Paragraph', icon: '¶' },
  { type: 'image',     label: 'Image',     icon: '▣' },
  { type: 'button',    label: 'Button',    icon: '⬚' },
  { type: 'divider',   label: 'Divider',   icon: '—' },
  { type: 'spacer',    label: 'Spacer',    icon: '↕' },
  { type: 'columns',   label: '2 columns', icon: '▥' },
  { type: 'html',      label: 'HTML',      icon: '<>' },
];

export default function TemplateEditor({ templateId }: { templateId?: string }) {
  const router = useRouter();
  const [name, setName] = useState('Untitled template');
  const [subject, setSubject] = useState('');
  const [preheader, setPreheader] = useState('');
  const [design, setDesign] = useState<Design>(DEFAULT_DESIGN);
  const [selected, setSelected] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [previewHtml, setPreviewHtml] = useState<string>('');
  const [showPreview, setShowPreview] = useState(false);

  // Load existing template
  useEffect(() => {
    if (!templateId) return;
    fetch(`/api/email/templates/${templateId}`).then(r => r.json()).then(j => {
      if (j.template) {
        setName(j.template.name || 'Untitled');
        setSubject(j.template.subject || '');
        setPreheader(j.template.preheader || '');
        if (j.template.design_json) setDesign(j.template.design_json);
      }
    });
  }, [templateId]);

  // Refresh server-rendered preview when "Preview" opens
  const refreshPreview = async () => {
    const r = await fetch('/api/email/templates' + (templateId ? `/${templateId}` : ''), {
      method: templateId ? 'PATCH' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, subject, preheader, design }),
    });
    const j = await r.json();
    if (j.template) {
      setPreviewHtml(j.template.html_body || '');
      if (!templateId && j.template.id) router.replace(`/dashboard/email/templates/${j.template.id}`);
    }
  };

  const save = async () => {
    setSaving(true); setMsg(null);
    const url = templateId ? `/api/email/templates/${templateId}` : '/api/email/templates';
    const method = templateId ? 'PATCH' : 'POST';
    const r = await fetch(url, {
      method, headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, subject, preheader, design }),
    });
    const j = await r.json();
    setSaving(false);
    if (!r.ok) { setMsg(j.error || 'Save failed'); return; }
    setMsg('Saved');
    if (!templateId && j.template?.id) router.replace(`/dashboard/email/templates/${j.template.id}`);
  };

  const selectedBlock = useMemo<Block | null>(() => {
    if (!selected) return null;
    const find = (blocks: Block[]): Block | null => {
      for (const b of blocks) {
        if (b.id === selected) return b;
        if (b.type === 'columns') {
          const l = find(b.left); if (l) return l;
          const r = find(b.right); if (r) return r;
        }
      }
      return null;
    };
    return find(design.blocks);
  }, [selected, design]);

  const updateBlock = (id: string, patch: Partial<Block>) => {
    const walk = (blocks: Block[]): Block[] =>
      blocks.map(b => {
        if (b.id === id) return { ...b, ...patch } as Block;
        if (b.type === 'columns') return { ...b, left: walk(b.left), right: walk(b.right) };
        return b;
      });
    setDesign({ ...design, blocks: walk(design.blocks) });
  };

  const addBlock = (type: Block['type']) => {
    const b = newBlock(type);
    setDesign({ ...design, blocks: [...design.blocks, b] });
    setSelected(b.id);
  };

  const removeBlock = (id: string) => {
    const walk = (blocks: Block[]): Block[] =>
      blocks.filter(b => b.id !== id).map(b => {
        if (b.type === 'columns') return { ...b, left: walk(b.left), right: walk(b.right) };
        return b;
      });
    setDesign({ ...design, blocks: walk(design.blocks) });
    if (selected === id) setSelected(null);
  };

  const moveBlock = (id: string, dir: -1 | 1) => {
    const walk = (blocks: Block[]): Block[] => {
      const idx = blocks.findIndex(b => b.id === id);
      if (idx >= 0) {
        const next = [...blocks];
        const swap = idx + dir;
        if (swap < 0 || swap >= next.length) return next;
        [next[idx], next[swap]] = [next[swap], next[idx]];
        return next;
      }
      return blocks.map(b => b.type === 'columns' ? ({ ...b, left: walk(b.left), right: walk(b.right) }) : b);
    };
    setDesign({ ...design, blocks: walk(design.blocks) });
  };

  return (
    <div className="min-h-screen bg-neutral-100">
      {/* Top toolbar */}
      <div className="bg-white border-b border-neutral-200 px-6 py-3 flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/email/templates" className="text-xs uppercase tracking-wider text-neutral-500 hover:text-[#344a57]">← Templates</Link>
          <input value={name} onChange={e => setName(e.target.value)}
            className="px-2 py-1 border border-transparent hover:border-neutral-300 rounded font-serif text-lg text-[#344a57] focus:outline-none focus:border-[#344a57]" />
        </div>
        <div className="flex items-center gap-2">
          {msg && <span className="text-xs text-neutral-600">{msg}</span>}
          <button onClick={() => { refreshPreview(); setShowPreview(true); }}
            className="px-3 py-1.5 text-sm border border-neutral-300 rounded hover:bg-neutral-50">Preview</button>
          <button onClick={save} disabled={saving}
            className="px-4 py-1.5 text-sm bg-[#344a57] text-white rounded hover:bg-[#2a3c47] disabled:opacity-50">
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>

      {/* Subject / preheader bar */}
      <div className="bg-white border-b border-neutral-200 px-6 py-3 grid grid-cols-1 md:grid-cols-2 gap-3">
        <input value={subject} onChange={e => setSubject(e.target.value)} placeholder="Subject line (supports {{first_name}})"
          className="px-3 py-2 border border-neutral-300 rounded text-sm" />
        <input value={preheader} onChange={e => setPreheader(e.target.value)} placeholder="Preheader (preview text shown next to subject)"
          className="px-3 py-2 border border-neutral-300 rounded text-sm" />
      </div>

      {/* Main 3-column layout */}
      <div className="grid grid-cols-12 gap-4 p-4">
        {/* Block library */}
        <aside className="col-span-12 md:col-span-2">
          <div className="bg-white border border-neutral-200 rounded p-3 sticky top-4">
            <h3 className="text-xs uppercase tracking-wider text-neutral-500 mb-2">Add block</h3>
            <div className="space-y-1">
              {PALETTE.map(p => (
                <button key={p.type} onClick={() => addBlock(p.type)}
                  className="w-full text-left px-3 py-2 text-sm rounded hover:bg-neutral-50 flex items-center gap-2">
                  <span className="w-6 h-6 rounded bg-neutral-100 inline-flex items-center justify-center text-xs font-mono">{p.icon}</span>
                  {p.label}
                </button>
              ))}
            </div>
            <h3 className="text-xs uppercase tracking-wider text-neutral-500 mt-4 mb-2">Page style</h3>
            <GlobalStyleEditor design={design} onChange={setDesign} />
          </div>
        </aside>

        {/* Canvas */}
        <main className="col-span-12 md:col-span-7" onClick={() => setSelected(null)}>
          <div className="rounded shadow-sm overflow-hidden mx-auto" style={{ maxWidth: design.globalStyle.contentWidth + 80, backgroundColor: design.globalStyle.bgColor, padding: 40 }}>
            <div style={{ backgroundColor: design.globalStyle.contentBgColor, maxWidth: design.globalStyle.contentWidth, margin: '0 auto', padding: 40 }}>
              <BlockList blocks={design.blocks} selected={selected} onSelect={setSelected} onMove={moveBlock} onRemove={removeBlock} design={design} />
              {design.blocks.length === 0 && (
                <div className="text-center text-neutral-400 py-8 text-sm">Click any block in the left panel to add it.</div>
              )}
            </div>
          </div>
        </main>

        {/* Properties */}
        <aside className="col-span-12 md:col-span-3">
          <div className="bg-white border border-neutral-200 rounded p-3 sticky top-4">
            <h3 className="text-xs uppercase tracking-wider text-neutral-500 mb-2">
              {selectedBlock ? `${selectedBlock.type} properties` : 'Properties'}
            </h3>
            {selectedBlock
              ? <PropsPanel block={selectedBlock} onChange={patch => updateBlock(selectedBlock.id, patch)} />
              : <p className="text-xs text-neutral-500">Select a block to edit its properties.</p>}
          </div>
        </aside>
      </div>

      {showPreview && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={() => setShowPreview(false)}>
          <div className="bg-white rounded-lg w-full max-w-3xl h-[85vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="px-4 py-3 border-b border-neutral-200 flex items-center justify-between">
              <h2 className="font-serif text-xl text-[#344a57]">Email preview</h2>
              <button onClick={() => setShowPreview(false)} className="text-neutral-500 hover:text-neutral-900">×</button>
            </div>
            <iframe srcDoc={previewHtml} className="flex-1 w-full" sandbox="" />
          </div>
        </div>
      )}
    </div>
  );
}

// ===================== Block list (canvas) =====================
function BlockList({ blocks, selected, onSelect, onMove, onRemove, design }: {
  blocks: Block[]; selected: string | null;
  onSelect: (id: string) => void; onMove: (id: string, d: -1|1) => void; onRemove: (id: string) => void;
  design: Design;
}) {
  return (
    <>
      {blocks.map((b, i) => (
        <div key={b.id} onClick={e => { e.stopPropagation(); onSelect(b.id); }}
          className={`relative group my-1 ${selected === b.id ? 'outline outline-2 outline-[#344a57]' : 'outline outline-1 outline-transparent hover:outline-neutral-300'}`}>
          {selected === b.id && (
            <div className="absolute -top-7 right-0 flex gap-1 bg-[#344a57] text-white text-xs rounded px-1 py-0.5 z-10">
              <button title="Up" onClick={e => { e.stopPropagation(); onMove(b.id, -1); }} disabled={i === 0} className="px-1 disabled:opacity-30">↑</button>
              <button title="Down" onClick={e => { e.stopPropagation(); onMove(b.id, 1); }} disabled={i === blocks.length - 1} className="px-1 disabled:opacity-30">↓</button>
              <button title="Delete" onClick={e => { e.stopPropagation(); onRemove(b.id); }} className="px-1 text-red-200 hover:text-red-100">×</button>
            </div>
          )}
          <BlockPreview b={b} design={design} selected={selected} onSelect={onSelect} onMove={onMove} onRemove={onRemove} />
        </div>
      ))}
    </>
  );
}

function BlockPreview({ b, design, selected, onSelect, onMove, onRemove }: any) {
  switch (b.type) {
    case 'heading': {
      const Tag = (`h${b.level}`) as keyof React.JSX.IntrinsicElements;
      const size = b.level === 1 ? 28 : b.level === 2 ? 22 : 18;
      return <Tag style={{ textAlign: b.align, color: b.color, fontFamily: b.fontFamily === 'serif' ? 'Georgia, serif' : 'system-ui, sans-serif', fontSize: size, margin: '8px 0', fontWeight: 'bold' }}>{b.text}</Tag>;
    }
    case 'paragraph':
      return <p style={{ textAlign: b.align, color: b.color, fontFamily: b.fontFamily === 'serif' ? 'Georgia, serif' : 'system-ui', fontSize: b.fontSize, lineHeight: 1.6, margin: '6px 0', whiteSpace: 'pre-wrap' }}>{b.text}</p>;
    case 'image':
      return <div style={{ textAlign: b.align, padding: '6px 0' }}>
        <img src={b.src} alt={b.alt} style={{ display: 'inline-block', maxWidth: '100%', width: b.width, height: 'auto' }} />
      </div>;
    case 'button':
      return <div style={{ textAlign: b.align, padding: '8px 0' }}>
        <span style={{ display: 'inline-block', backgroundColor: b.bgColor, color: b.textColor, padding: `${b.paddingY}px ${b.paddingX}px`, borderRadius: b.borderRadius, fontWeight: 'bold', fontSize: 15 }}>{b.text}</span>
      </div>;
    case 'divider':
      return <hr style={{ border: 0, borderTop: `${b.thickness}px solid ${b.color}`, margin: '12px 0' }} />;
    case 'spacer':
      return <div style={{ height: b.height, fontSize: 1 }}>&nbsp;</div>;
    case 'columns':
      return (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: b.gap }} onClick={e => e.stopPropagation()}>
          {(['left', 'right'] as const).map(side => (
            <div key={side} className="min-h-[40px] border border-dashed border-neutral-300 p-2">
              {(b[side] as Block[]).length === 0 && <p className="text-xs text-neutral-400 text-center">{side} column</p>}
              <BlockList blocks={b[side]} selected={selected} onSelect={onSelect} onMove={onMove} onRemove={onRemove} design={design} />
            </div>
          ))}
        </div>
      );
    case 'html':
      return <div className="bg-neutral-50 border border-dashed border-neutral-300 p-2 text-xs font-mono text-neutral-600 max-h-32 overflow-auto">{b.code}</div>;
  }
}

// ===================== Properties panel =====================
function PropsPanel({ block, onChange }: { block: Block; onChange: (patch: Partial<Block>) => void }) {
  switch (block.type) {
    case 'heading':
      return (
        <div className="space-y-3 text-sm">
          <FieldText label="Text"  value={block.text} onChange={v => onChange({ text: v } as any)} multiline />
          <FieldSelect label="Level" value={String(block.level)} options={[['1','H1'],['2','H2'],['3','H3']]} onChange={v => onChange({ level: Number(v) as any } as any)} />
          <FieldAlign value={block.align} onChange={v => onChange({ align: v } as any)} />
          <FieldColor label="Color" value={block.color} onChange={v => onChange({ color: v } as any)} />
          <FieldSelect label="Font" value={block.fontFamily} options={[['serif','Serif'],['sans','Sans']]} onChange={v => onChange({ fontFamily: v as any } as any)} />
        </div>
      );
    case 'paragraph':
      return (
        <div className="space-y-3 text-sm">
          <FieldText label="Text" value={block.text} onChange={v => onChange({ text: v } as any)} multiline />
          <FieldAlign value={block.align} onChange={v => onChange({ align: v } as any)} />
          <FieldColor label="Color" value={block.color} onChange={v => onChange({ color: v } as any)} />
          <FieldNumber label="Font size" value={block.fontSize} onChange={v => onChange({ fontSize: v } as any)} />
          <FieldSelect label="Font" value={block.fontFamily} options={[['serif','Serif'],['sans','Sans']]} onChange={v => onChange({ fontFamily: v as any } as any)} />
        </div>
      );
    case 'image':
      return (
        <div className="space-y-3 text-sm">
          <FieldText label="Image URL"  value={block.src} onChange={v => onChange({ src: v } as any)} />
          <FieldText label="Alt text"   value={block.alt} onChange={v => onChange({ alt: v } as any)} />
          <FieldNumber label="Width (px)" value={block.width} onChange={v => onChange({ width: v } as any)} />
          <FieldAlign value={block.align} onChange={v => onChange({ align: v } as any)} />
          <FieldText label="Link (optional)" value={block.href || ''} onChange={v => onChange({ href: v } as any)} />
        </div>
      );
    case 'button':
      return (
        <div className="space-y-3 text-sm">
          <FieldText label="Text" value={block.text} onChange={v => onChange({ text: v } as any)} />
          <FieldText label="Link URL" value={block.href} onChange={v => onChange({ href: v } as any)} />
          <FieldColor label="Background" value={block.bgColor} onChange={v => onChange({ bgColor: v } as any)} />
          <FieldColor label="Text color" value={block.textColor} onChange={v => onChange({ textColor: v } as any)} />
          <FieldAlign value={block.align} onChange={v => onChange({ align: v } as any)} />
          <FieldNumber label="Border radius" value={block.borderRadius} onChange={v => onChange({ borderRadius: v } as any)} />
          <FieldNumber label="Padding X" value={block.paddingX} onChange={v => onChange({ paddingX: v } as any)} />
          <FieldNumber label="Padding Y" value={block.paddingY} onChange={v => onChange({ paddingY: v } as any)} />
        </div>
      );
    case 'divider':
      return (
        <div className="space-y-3 text-sm">
          <FieldColor label="Color" value={block.color} onChange={v => onChange({ color: v } as any)} />
          <FieldNumber label="Thickness (px)" value={block.thickness} onChange={v => onChange({ thickness: v } as any)} />
        </div>
      );
    case 'spacer':
      return <FieldNumber label="Height (px)" value={block.height} onChange={v => onChange({ height: v } as any)} />;
    case 'columns':
      return <FieldNumber label="Gap (px)" value={block.gap} onChange={v => onChange({ gap: v } as any)} />;
    case 'html':
      return <FieldText label="HTML" value={block.code} onChange={v => onChange({ code: v } as any)} multiline mono />;
  }
}

// ===================== Global style editor =====================
function GlobalStyleEditor({ design, onChange }: { design: Design; onChange: (d: Design) => void }) {
  const g = design.globalStyle;
  const set = (patch: Partial<Design['globalStyle']>) => onChange({ ...design, globalStyle: { ...g, ...patch } });
  return (
    <div className="space-y-2 text-sm">
      <FieldColor  label="Background"      value={g.bgColor}        onChange={v => set({ bgColor: v })} />
      <FieldColor  label="Content bg"      value={g.contentBgColor} onChange={v => set({ contentBgColor: v })} />
      <FieldColor  label="Accent / brand"  value={g.accentColor}    onChange={v => set({ accentColor: v })} />
      <FieldColor  label="Body text"       value={g.textColor}      onChange={v => set({ textColor: v })} />
      <FieldColor  label="Link color"      value={g.linkColor}      onChange={v => set({ linkColor: v })} />
      <FieldNumber label="Content width"   value={g.contentWidth}   onChange={v => set({ contentWidth: v })} />
      <FieldSelect label="Default font"    value={g.fontFamily}     options={[['serif','Serif'],['sans','Sans']]} onChange={v => set({ fontFamily: v as any })} />
    </div>
  );
}

// ===================== Field primitives =====================
function FieldText({ label, value, onChange, multiline, mono }: { label: string; value: string; onChange: (v: string) => void; multiline?: boolean; mono?: boolean }) {
  return (
    <label className="block">
      <span className="text-xs uppercase tracking-wider text-neutral-600">{label}</span>
      {multiline
        ? <textarea value={value} onChange={e => onChange(e.target.value)} className={`w-full mt-1 px-2 py-1 border border-neutral-300 rounded text-sm min-h-[80px] ${mono ? 'font-mono text-xs' : ''}`} />
        : <input value={value} onChange={e => onChange(e.target.value)} className="w-full mt-1 px-2 py-1 border border-neutral-300 rounded text-sm" />}
    </label>
  );
}
function FieldNumber({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <label className="block">
      <span className="text-xs uppercase tracking-wider text-neutral-600">{label}</span>
      <input type="number" value={value} onChange={e => onChange(parseInt(e.target.value) || 0)} className="w-full mt-1 px-2 py-1 border border-neutral-300 rounded text-sm" />
    </label>
  );
}
function FieldColor({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="block">
      <span className="text-xs uppercase tracking-wider text-neutral-600">{label}</span>
      <div className="flex items-center gap-2 mt-1">
        <input type="color" value={value} onChange={e => onChange(e.target.value)} className="w-8 h-8 rounded border border-neutral-300" />
        <input type="text" value={value} onChange={e => onChange(e.target.value)} className="flex-1 px-2 py-1 border border-neutral-300 rounded text-xs font-mono" />
      </div>
    </label>
  );
}
function FieldSelect({ label, value, options, onChange }: { label: string; value: string; options: [string, string][]; onChange: (v: string) => void }) {
  return (
    <label className="block">
      <span className="text-xs uppercase tracking-wider text-neutral-600">{label}</span>
      <select value={value} onChange={e => onChange(e.target.value)} className="w-full mt-1 px-2 py-1 border border-neutral-300 rounded text-sm">
        {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
      </select>
    </label>
  );
}
function FieldAlign({ value, onChange }: { value: BlockAlign; onChange: (v: BlockAlign) => void }) {
  return (
    <div>
      <span className="text-xs uppercase tracking-wider text-neutral-600">Align</span>
      <div className="flex gap-1 mt-1">
        {(['left','center','right'] as const).map(a => (
          <button key={a} onClick={() => onChange(a)}
            className={`flex-1 px-2 py-1 text-xs rounded border ${value === a ? 'bg-[#344a57] text-white border-[#344a57]' : 'border-neutral-300'}`}>
            {a}
          </button>
        ))}
      </div>
    </div>
  );
}
