'use client';

// ============================================================
// Road to 37 — Weekly Activity Tracker
// Drop this file at:  app/tracker/page.js
// Reads/writes the public.weekly_activity table you created.
// ============================================================

import { useState, useEffect, useMemo, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';

// ---- THE PLAN (locked numbers) -----------------------------
const GOAL_SOLD = 37;
const GOAL_VOLUME = 100_000_000;
const AVG_COMMISSION = 0.0225;
const KW_CAP = 33_000;
const OPERATING = 224_000;
const TAX_RATE = 0.38;
const NET_FLOOR = 1_000_000;

// weekly targets — the five non-negotiables + cascade
const WEEKLY_TARGETS = {
  contacts: 50,
  sphere_touches: 20,
  mailers: 500,
  open_houses: 1,
  follow_ups: 0, // "every seller convo" — no fixed number
  listing_appts: 1.3,
  listings_taken: 0.85,
  listings_sold: 0.71,
};

// ---- helpers -----------------------------------------------
function mondayOf(d) {
  const date = new Date(d);
  const day = date.getDay(); // 0 Sun .. 6 Sat
  const diff = (day === 0 ? -6 : 1) - day;
  date.setDate(date.getDate() + diff);
  date.setHours(0, 0, 0, 0);
  return date;
}
function isoDate(d) {
  return mondayOf(d).toISOString().slice(0, 10);
}
function fmtMoney(n) {
  return '$' + Math.round(n).toLocaleString('en-US');
}
function fmtWeekLabel(iso) {
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

const BLANK = {
  contacts: 0, sphere_touches: 0, mailers: 0, open_houses: 0, follow_ups: 0,
  listing_appts: 0, listings_taken: 0, listings_sold: 0,
  volume_closed: 0, commission_earned: 0, notes: '',
};

const INPUT_FIELDS = [
  { key: 'contacts', label: 'Contacts', hint: 'real conversations', target: 50 },
  { key: 'sphere_touches', label: 'Sphere touches', hint: 'past clients + partners', target: 20 },
  { key: 'mailers', label: 'Mailers', hint: 'anchored on comps', target: 500 },
  { key: 'open_houses', label: 'Open houses', hint: '$2–4M home', target: 1 },
  { key: 'follow_ups', label: 'Seller follow-ups', hint: 'every conversation', target: null },
];
const OUTCOME_FIELDS = [
  { key: 'listing_appts', label: 'Listing appointments', hint: '~6 / month' },
  { key: 'listings_taken', label: 'Listings taken', hint: '~4 / month' },
  { key: 'listings_sold', label: 'Listings sold', hint: '~3 / month' },
];
const MONEY_FIELDS = [
  { key: 'volume_closed', label: 'Volume closed ($)', hint: 'sale price this week' },
  { key: 'commission_earned', label: 'Commission earned ($)', hint: 'GCI this week' },
];

export default function TrackerPage() {
  const supabase = useMemo(() => createClient(), []);

  const [userId, setUserId] = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const [rows, setRows] = useState([]);
  const [week, setWeek] = useState(isoDate(new Date()));
  const [form, setForm] = useState({ ...BLANK });
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState('');

  // ---- auth ----
  useEffect(() => {
    let active = true;
    supabase.auth.getUser().then(({ data }) => {
      if (!active) return;
      setUserId(data?.user?.id ?? null);
      setAuthReady(true);
    });
    return () => { active = false; };
  }, [supabase]);

  // ---- load all rows for this user ----
  const loadRows = useCallback(async () => {
    if (!userId) return;
    const { data, error } = await supabase
      .from('weekly_activity')
      .select('*')
      .eq('user_id', userId)
      .order('week_start', { ascending: false });
    if (!error && data) setRows(data);
  }, [supabase, userId]);

  useEffect(() => { loadRows(); }, [loadRows]);

  // ---- when week changes, load that week into the form ----
  useEffect(() => {
    const existing = rows.find((r) => r.week_start === week);
    setForm(existing ? { ...BLANK, ...existing } : { ...BLANK });
  }, [week, rows]);

  // ---- YEAR-TO-DATE TOTALS + PROJECTION ----
  const totals = useMemo(() => {
    const t = rows.reduce((a, r) => {
      a.sold += Number(r.listings_sold) || 0;
      a.taken += Number(r.listings_taken) || 0;
      a.volume += Number(r.volume_closed) || 0;
      a.gci += Number(r.commission_earned) || 0;
      a.contacts += Number(r.contacts) || 0;
      a.appts += Number(r.listing_appts) || 0;
      return a;
    }, { sold: 0, taken: 0, volume: 0, gci: 0, contacts: 0, appts: 0 });

    // net after cap, costs, tax — on actual GCI so far
    const afterCap = Math.max(0, t.gci - KW_CAP);
    const preTax = afterCap - OPERATING;
    const net = preTax > 0 ? preTax * (1 - TAX_RATE) : preTax;

    // projected full-year net if the year finishes at goal volume
    const projGci = GOAL_VOLUME * AVG_COMMISSION;
    const projNet = (projGci - KW_CAP - OPERATING) * (1 - TAX_RATE);

    // real conversion rates (only if there's data)
    const apptRate = t.contacts > 0 ? t.appts / t.contacts : null;
    return { ...t, net, projNet, projGci, apptRate };
  }, [rows]);

  const pctToGoal = Math.min(100, (totals.sold / GOAL_SOLD) * 100);
  const volPct = Math.min(100, (totals.volume / GOAL_VOLUME) * 100);

  // ---- save (upsert on user_id + week_start) ----
  async function save() {
    if (!userId) { setStatus('Not signed in.'); return; }
    setSaving(true);
    setStatus('');
    const payload = {
      user_id: userId,
      week_start: week,
      contacts: +form.contacts || 0,
      sphere_touches: +form.sphere_touches || 0,
      mailers: +form.mailers || 0,
      open_houses: +form.open_houses || 0,
      follow_ups: +form.follow_ups || 0,
      listing_appts: +form.listing_appts || 0,
      listings_taken: +form.listings_taken || 0,
      listings_sold: +form.listings_sold || 0,
      volume_closed: +form.volume_closed || 0,
      commission_earned: +form.commission_earned || 0,
      notes: form.notes || null,
    };
    const { error } = await supabase
      .from('weekly_activity')
      .upsert(payload, { onConflict: 'user_id,week_start' });
    setSaving(false);
    if (error) { setStatus('Error: ' + error.message); return; }
    setStatus('Saved ✓');
    await loadRows();
    setTimeout(() => setStatus(''), 2500);
  }

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  // ============================================================
  if (!authReady) {
    return <div style={S.wrap}><p style={{ color: '#8ba0ab' }}>Loading…</p></div>;
  }
  if (!userId) {
    return (
      <div style={S.wrap}>
        <div style={S.card}>
          <h1 style={S.h1}>Road to 37</h1>
          <p style={{ color: '#8ba0ab' }}>Please sign in to your portal to use the tracker.</p>
        </div>
      </div>
    );
  }

  return (
    <div style={S.wrap}>
      <div style={S.inner}>

        {/* HEADER */}
        <header style={{ marginBottom: 28 }}>
          <p style={S.kicker}>RANCHO SANTA FE · DEL MAR · CARMEL VALLEY · ESTD 2015</p>
          <h1 style={S.h1}>The Road to 37</h1>
          <p style={S.sub}>$100M volume · $1M+ net · by July 2027</p>
        </header>

        {/* SCOREBOARD */}
        <section style={S.scoreGrid}>
          <ScoreCard label="Closed / 37" value={`${totals.sold}`} suffix={`/ ${GOAL_SOLD}`} accent />
          <ScoreCard label="Volume" value={fmtMoney(totals.volume)} sub={`${volPct.toFixed(1)}% of $100M`} />
          <ScoreCard label="GCI earned" value={fmtMoney(totals.gci)} />
          <ScoreCard label="Listings taken" value={`${totals.taken}`} sub="March gate: 37" />
        </section>

        {/* CLIMB BAR */}
        <section style={S.climb}>
          <div style={S.climbHead}>
            <span style={S.climbLabel}>The climb to 37</span>
            <span style={S.climbPct}>{pctToGoal.toFixed(0)}%</span>
          </div>
          <div style={S.track}>
            <div style={{ ...S.fill, width: `${pctToGoal}%` }} />
          </div>
        </section>

        {/* NET PROJECTION */}
        <section style={S.netRow}>
          <div style={S.netCard}>
            <p style={S.netLabel}>Net after tax — year to date</p>
            <p style={{ ...S.netValue, color: totals.net >= 0 ? '#c9a96e' : '#c76b6b' }}>
              {fmtMoney(totals.net)}
            </p>
            <p style={S.netHint}>after $33K cap · $224K costs · 38% tax</p>
          </div>
          <div style={S.netCard}>
            <p style={S.netLabel}>Projected at goal</p>
            <p style={{ ...S.netValue, color: '#fff' }}>{fmtMoney(totals.projNet)}</p>
            <p style={S.netHint}>floor to protect: {fmtMoney(NET_FLOOR)}</p>
          </div>
        </section>

        {/* WEEK PICKER */}
        <section style={S.weekBar}>
          <label style={S.weekLabel}>Week of</label>
          <input
            type="date"
            value={week}
            onChange={(e) => setWeek(isoDate(e.target.value))}
            style={S.dateInput}
          />
          <span style={S.weekResolved}>→ {fmtWeekLabel(week)}</span>
        </section>

        {/* INPUT FORM */}
        <section style={S.formCard}>
          <h2 style={S.h2}>The five non-negotiables</h2>
          <div style={S.fieldGrid}>
            {INPUT_FIELDS.map((f) => (
              <Field key={f.key} f={f} value={form[f.key]} onChange={(v) => set(f.key, v)} />
            ))}
          </div>

          <h2 style={{ ...S.h2, marginTop: 26 }}>The cascade</h2>
          <div style={S.fieldGrid}>
            {OUTCOME_FIELDS.map((f) => (
              <Field key={f.key} f={f} value={form[f.key]} onChange={(v) => set(f.key, v)} />
            ))}
          </div>

          <h2 style={{ ...S.h2, marginTop: 26 }}>When a deal closes</h2>
          <div style={S.fieldGrid}>
            {MONEY_FIELDS.map((f) => (
              <Field key={f.key} f={f} value={form[f.key]} onChange={(v) => set(f.key, v)} money />
            ))}
          </div>

          <div style={{ marginTop: 20 }}>
            <label style={S.fieldLabel}>Notes</label>
            <textarea
              value={form.notes || ''}
              onChange={(e) => set('notes', e.target.value)}
              rows={2}
              style={S.textarea}
              placeholder="Wins, blockers, what to fix next week…"
            />
          </div>

          <div style={S.saveRow}>
            <button onClick={save} disabled={saving} style={S.saveBtn}>
              {saving ? 'Saving…' : 'Save week'}
            </button>
            {status && <span style={S.status}>{status}</span>}
          </div>
        </section>

        {/* HISTORY */}
        {rows.length > 0 && (
          <section style={S.histCard}>
            <h2 style={S.h2}>Week history</h2>
            <div style={{ overflowX: 'auto' }}>
              <table style={S.table}>
                <thead>
                  <tr>
                    {['Week', 'Contacts', 'Sphere', 'Mailers', 'OH', 'Appts', 'Taken', 'Sold', 'Volume'].map((h) => (
                      <th key={h} style={S.th}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.id} style={{ cursor: 'pointer' }} onClick={() => setWeek(r.week_start)}>
                      <td style={S.tdWeek}>{fmtWeekLabel(r.week_start)}</td>
                      <td style={S.td}>{r.contacts}</td>
                      <td style={S.td}>{r.sphere_touches}</td>
                      <td style={S.td}>{r.mailers}</td>
                      <td style={S.td}>{r.open_houses}</td>
                      <td style={S.td}>{r.listing_appts}</td>
                      <td style={S.td}>{r.listings_taken}</td>
                      <td style={S.tdSold}>{r.listings_sold}</td>
                      <td style={S.td}>{r.volume_closed > 0 ? fmtMoney(r.volume_closed) : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

      </div>
    </div>
  );
}

// ---- small components --------------------------------------
function ScoreCard({ label, value, suffix, sub, accent }) {
  return (
    <div style={{ ...S.scoreCard, ...(accent ? S.scoreCardAccent : {}) }}>
      <p style={S.scoreLabel}>{label}</p>
      <p style={S.scoreValue}>
        {value}{suffix && <span style={S.scoreSuffix}> {suffix}</span>}
      </p>
      {sub && <p style={S.scoreSub}>{sub}</p>}
    </div>
  );
}

function Field({ f, value, onChange, money }) {
  return (
    <div>
      <label style={S.fieldLabel}>
        {f.label}
        {f.target != null && <span style={S.fieldTarget}> / {f.target}</span>}
      </label>
      <input
        type="number"
        min="0"
        step={money ? '1000' : '1'}
        value={value === 0 ? '' : value}
        placeholder="0"
        onChange={(e) => onChange(e.target.value)}
        style={S.numInput}
      />
      {f.hint && <span style={S.fieldHint}>{f.hint}</span>}
    </div>
  );
}

// ---- styles (brand: Lake #344a57, gold #c9a96e) ------------
const S = {
  wrap: { minHeight: '100vh', background: '#2a3b45', padding: '32px 16px', fontFamily: "'Jost', system-ui, sans-serif", color: '#fff' },
  inner: { maxWidth: 920, margin: '0 auto' },
  card: { background: '#344a57', borderRadius: 14, padding: 32 },
  kicker: { fontSize: 11, letterSpacing: '0.18em', color: '#c9a96e', margin: '0 0 8px', fontWeight: 500 },
  h1: { fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 46, fontWeight: 600, margin: 0, lineHeight: 1.05, color: '#fff' },
  sub: { fontSize: 15, color: '#a9bcc6', margin: '6px 0 0' },
  h2: { fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 24, fontWeight: 600, margin: '0 0 14px', color: '#fff' },

  scoreGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 12, marginBottom: 18 },
  scoreCard: { background: '#344a57', borderRadius: 12, padding: '18px 20px', border: '1px solid #3f5764' },
  scoreCardAccent: { border: '1px solid #c9a96e' },
  scoreLabel: { fontSize: 12, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#8ba0ab', margin: '0 0 6px' },
  scoreValue: { fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 34, fontWeight: 600, margin: 0, color: '#fff', lineHeight: 1 },
  scoreSuffix: { fontSize: 18, color: '#8ba0ab' },
  scoreSub: { fontSize: 12, color: '#8ba0ab', margin: '6px 0 0' },

  climb: { background: '#344a57', borderRadius: 12, padding: '18px 20px', marginBottom: 18, border: '1px solid #3f5764' },
  climbHead: { display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10 },
  climbLabel: { fontSize: 13, letterSpacing: '0.06em', color: '#a9bcc6' },
  climbPct: { fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 22, color: '#c9a96e', fontWeight: 600 },
  track: { height: 10, background: '#26363f', borderRadius: 6, overflow: 'hidden' },
  fill: { height: '100%', background: 'linear-gradient(90deg,#c9a96e,#e0c893)', borderRadius: 6, transition: 'width .5s ease' },

  netRow: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 22 },
  netCard: { background: '#344a57', borderRadius: 12, padding: '18px 20px', border: '1px solid #3f5764' },
  netLabel: { fontSize: 12, letterSpacing: '0.06em', color: '#8ba0ab', margin: '0 0 6px' },
  netValue: { fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 30, fontWeight: 600, margin: 0, lineHeight: 1 },
  netHint: { fontSize: 11, color: '#7d929d', margin: '6px 0 0' },

  weekBar: { display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14, flexWrap: 'wrap' },
  weekLabel: { fontSize: 13, letterSpacing: '0.06em', color: '#a9bcc6' },
  dateInput: { background: '#344a57', border: '1px solid #3f5764', borderRadius: 8, padding: '8px 12px', color: '#fff', fontSize: 14, fontFamily: 'inherit' },
  weekResolved: { fontSize: 13, color: '#c9a96e' },

  formCard: { background: '#344a57', borderRadius: 14, padding: 26, marginBottom: 22, border: '1px solid #3f5764' },
  fieldGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 16 },
  fieldLabel: { display: 'block', fontSize: 13, color: '#dce6eb', marginBottom: 6, fontWeight: 500 },
  fieldTarget: { color: '#8ba0ab', fontWeight: 400 },
  fieldHint: { display: 'block', fontSize: 11, color: '#7d929d', marginTop: 4 },
  numInput: { width: '100%', background: '#2a3b45', border: '1px solid #3f5764', borderRadius: 8, padding: '10px 12px', color: '#fff', fontSize: 16, fontFamily: 'inherit', boxSizing: 'border-box' },
  textarea: { width: '100%', background: '#2a3b45', border: '1px solid #3f5764', borderRadius: 8, padding: '10px 12px', color: '#fff', fontSize: 14, fontFamily: 'inherit', boxSizing: 'border-box', resize: 'vertical' },

  saveRow: { display: 'flex', alignItems: 'center', gap: 16, marginTop: 22 },
  saveBtn: { background: '#c9a96e', color: '#2a3b45', border: 'none', borderRadius: 8, padding: '12px 28px', fontSize: 15, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', letterSpacing: '0.03em' },
  status: { fontSize: 14, color: '#c9a96e' },

  histCard: { background: '#344a57', borderRadius: 14, padding: 26, border: '1px solid #3f5764' },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: 13 },
  th: { textAlign: 'left', padding: '8px 10px', color: '#8ba0ab', fontWeight: 500, borderBottom: '1px solid #3f5764', whiteSpace: 'nowrap', fontSize: 11, letterSpacing: '0.05em', textTransform: 'uppercase' },
  td: { padding: '10px', color: '#dce6eb', borderBottom: '1px solid #30444f' },
  tdWeek: { padding: '10px', color: '#fff', borderBottom: '1px solid #30444f', whiteSpace: 'nowrap', fontWeight: 500 },
  tdSold: { padding: '10px', color: '#c9a96e', borderBottom: '1px solid #30444f', fontWeight: 600 },
};
