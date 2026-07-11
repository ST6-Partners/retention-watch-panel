// ExitAnalysisPanel — Mode A (post-exit Exit Analysis), skip-level. DD-002/005/006/016–020.
// Built to v10 (exit-analysis-skiplevel-mockup-v10.html). Reuses the SC-037 shared core
// (ArcSection + CultureSection + primitives) so the correlated-signal engine is BUILD ONCE
// (DD-022). PM-owned Mode-A sections live here: exit header, The Two Stories, AI Observations
// & Conclusions, and the Skip-Level Judgment.
//
// ZERO host coupling (SC-037 discipline, so component-promote is a lift-and-shift, no retrofit):
//   data       — frozen retention-watch snapshot wire { data, meta } (Arc + Culture). Read-only.
//   exit        — PM-owned payload: { subject, status, employment, review, stories, ai, culture,
//                 judgment }. See shape notes inline.
//   onSaveJudgment — async (judgment) => void. judgment = { root_category, root_reason,
//                 regrettable, read_text, actions }. Omit for a read-only view.
//   embedded    — inline (no fixed overlay). hideHeader — drop the exit header card.
import React, { useState } from 'react';
import {
  C, REASON_TAX, card, sechead, h2s, tagS, unwrap, ArcSection, CultureSection,
} from './core.jsx';

const lab = { fontSize: 10, textTransform: 'uppercase', letterSpacing: '.06em', color: C.faint, fontWeight: 700 };

function AIRead({ lead, children }) {
  return (
    <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', background: '#faf8ff', border: '1px solid #ece7fd', borderLeft: `3px solid ${C.purple}`, borderRadius: 11, padding: '12px 15px', margin: '-4px 0 16px' }}>
      <div style={{ width: 24, height: 24, borderRadius: 7, background: 'linear-gradient(135deg,#7c3aed,#a855f7)', color: '#fff', fontWeight: 700, fontSize: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flex: '0 0 auto', marginTop: 1 }}>AI</div>
      <div style={{ fontSize: 12.8, color: C.ink2, lineHeight: 1.55 }}>{lead && <span style={{ color: C.purple, fontWeight: 700 }}>{lead} </span>}{children}</div>
    </div>
  );
}

// ── Exit header: identity + status pills + employment strip + review strip + accordion ──
function ExitHeader({ subject = {}, status = {}, employment = {}, review = {} }) {
  const [open, setOpen] = useState(false);
  const sp = (bg, bd, fg, dot, text) => (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 600, padding: '4px 9px', borderRadius: 7, border: `1px solid ${bd || C.line}`, background: bg, color: fg, whiteSpace: 'nowrap' }}>{dot && <span style={{ width: 7, height: 7, borderRadius: '50%', background: dot }} />}{text}</span>
  );
  const cell = (label, value, extra) => (
    <div style={{ flex: 1, padding: '10px 16px', borderRight: `1px solid ${C.hair}` }}><div style={lab}>{label}</div><div style={{ fontSize: 14, fontWeight: 600, marginTop: 3 }}>{value}{extra}</div></div>
  );
  const stripWrap = { display: 'flex', border: `1px solid ${C.line}`, borderRadius: 12, overflow: 'hidden', marginTop: 14, background: '#fff' };
  const revCell = (label, value, extra) => (
    <div style={{ flex: 1, padding: '10px 16px', borderRight: `1px solid ${C.hair}` }}><div style={lab}>{label}</div><div style={{ fontSize: 14, fontWeight: 600, marginTop: 3, color: C.brand }}>{value}{extra}</div></div>
  );
  const rpTitle = { fontSize: 10, textTransform: 'uppercase', letterSpacing: '.06em', color: C.brand, fontWeight: 700, margin: '2px 0 8px' };
  const rtb = { width: '100%', borderCollapse: 'collapse', fontSize: 12 };
  const rth = { fontSize: 9.5, textTransform: 'uppercase', letterSpacing: '.05em', color: C.faint, textAlign: 'right', padding: '5px 8px', fontWeight: 700 };
  const rtd = { padding: '6px 8px', textAlign: 'right', borderTop: `1px solid ${C.hair}` };
  const rtd0 = { ...rtd, textAlign: 'left', color: C.ink2, fontWeight: 600 };
  return (
    <div style={{ background: '#fff', border: `1px solid ${C.line}`, borderRadius: 16, boxShadow: card.boxShadow, padding: '18px 20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <div style={{ width: 56, height: 56, borderRadius: '50%', background: `linear-gradient(135deg,${C.brand},#8b5cf6)`, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 20, flex: '0 0 auto' }}>{subject.avatar_initials || '?'}</div>
        <div style={{ flex: '1 1 auto' }}>
          <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-.02em' }}>{subject.name || 'Unknown'}</div>
          <div style={{ color: C.ink2, fontWeight: 500, fontSize: 13 }}>{[subject.title, subject.dept].filter(Boolean).join(' · ')}</div>
        </div>
        <div style={{ display: 'flex', gap: 7, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          <span style={{ ...lab, fontSize: 9.5, marginRight: 2 }}>Exit</span>
          {status.regrettable === true && sp('#fdecec', '#f6caca', '#b91c1c', C.red, 'Regrettable')}
          {status.regrettable === false && sp('#e7f7ee', '#bfe6cf', '#15803d', C.green, 'Non-regrettable')}
          {status.voluntary != null && sp('#fff', C.line, C.ink2, C.brand, status.voluntary ? 'Voluntary' : 'Involuntary')}
          {status.good_leaver === true && sp('#fff', C.line, C.ink2, C.green, 'Good leaver')}
          {status.exit_date && sp('#f1f3f6', '#f1f3f6', C.mut, null, status.exit_date)}
        </div>
      </div>
      <div style={stripWrap}>
        {cell('Hire date', employment.hire_date || '—')}
        {cell('In role since', employment.in_role_since || '—')}
        {cell('Tenure', employment.tenure || '—')}
        <div style={{ flex: 1, padding: '10px 16px' }}><div style={lab}>Legacy company</div><div style={{ fontSize: 14, fontWeight: 600, marginTop: 3 }}>{employment.legacy_company || 'NA'}{employment.legacy_note && <span style={{ color: C.mut, fontWeight: 400 }}> {employment.legacy_note}</span>}</div></div>
      </div>
      <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '.06em', color: C.faint, fontWeight: 700, margin: '16px 0 -2px 2px', display: 'flex', alignItems: 'center', gap: 10 }}>
        Last review · {review.period || '—'}
        {review.history && <button onClick={() => setOpen(o => !o)} style={{ border: `1px solid ${C.line}`, background: '#fff', color: C.brand, fontSize: 10.5, fontWeight: 700, padding: '3px 9px', borderRadius: 7, cursor: 'pointer', letterSpacing: '.02em' }}>{open ? 'Hide history ▴' : 'View history ▾'}</button>}
      </div>
      <div style={{ ...stripWrap, background: '#fbfbff', borderColor: '#e5e6f5' }}>
        {revCell('Rank', review.rank || '—')}
        {revCell('Tier', review.tier || '—')}
        {revCell('Promoted', review.promoted || '—', review.promoted_to && <span style={{ color: C.faint, fontWeight: 500, fontSize: 9.5 }}> → {review.promoted_to}</span>)}
        {revCell('Score', review.score != null ? review.score : '—', review.score_breakdown && <span style={{ color: C.faint, fontWeight: 500, fontSize: 9.5 }}> = {review.score_breakdown}</span>)}
        {revCell('Values', review.values != null ? review.values : '—')}
        {revCell('Performance', review.performance != null ? review.performance : '—')}
        <div style={{ flex: 1, padding: '10px 16px' }}><div style={lab}>Comp · total</div><div style={{ fontSize: 14, fontWeight: 600, marginTop: 3, color: C.brand }}>{review.comp_total || '—'} {review.comp_change && <span style={{ color: C.green, fontWeight: 600 }}>{review.comp_change}</span>}</div></div>
      </div>
      {open && review.history && (
        <div style={{ border: '1px solid #e5e6f5', borderRadius: 12, marginTop: 10, padding: '14px 16px', background: '#fbfbff' }}>
          <div style={rpTitle}>Review history</div>
          <table style={rtb}>
            <thead><tr>{['Period', 'Rank', 'Tier', 'Score', 'Values', 'Perf', 'Promoted'].map((h, i) => <th key={i} style={i === 0 ? { ...rth, textAlign: 'left' } : rth}>{h}</th>)}</tr></thead>
            <tbody>
              {review.history.map((r, i) => (
                <tr key={i} style={i === 0 ? { background: '#eef2ff', fontWeight: 700 } : null}>
                  <td style={rtd0}>{r.period}</td><td style={rtd}>{r.rank}</td><td style={rtd}>{r.tier}</td><td style={rtd}>{r.score}</td><td style={rtd}>{r.values}</td><td style={rtd}>{r.perf}</td>
                  <td style={{ ...rtd, color: r.promoted && r.promoted !== 'No' ? C.purple : C.ink2, fontWeight: r.promoted && r.promoted !== 'No' ? 700 : 400 }}>{r.promoted}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {review.comp_walk && (<>
            <div style={{ ...rpTitle, marginTop: 16 }}>Compensation walk</div>
            <table style={rtb}>
              <thead><tr>{['When · event', 'Base', 'Variable', 'Change', 'Total'].map((h, i) => <th key={i} style={i === 0 ? { ...rth, textAlign: 'left' } : rth}>{h}</th>)}</tr></thead>
              <tbody>
                {review.comp_walk.map((r, i) => (
                  <tr key={i} style={i === 0 ? { background: '#eef2ff', fontWeight: 700 } : null}>
                    <td style={{ ...rtd0, color: i === 0 ? C.ink2 : C.mut, fontWeight: i === 0 ? 700 : 500 }}>{r.when}</td>
                    <td style={rtd}>{r.base}</td><td style={rtd}>{r.variable}</td>
                    <td style={{ ...rtd, color: r.change && r.change.includes('promo') ? C.purple : C.green, fontWeight: 600 }}>{r.change}</td>
                    <td style={rtd}>{r.total}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>)}
        </div>
      )}
    </div>
  );
}

// ── The Two Stories — 4-col manager-vs-employee exit-survey compare (DD-005/016) ──
function TwoStories({ stories = {} }) {
  const verdictPill = v => {
    const map = { Aligned: [C.green + '18', C.green], Divergent: [C.red + '18', C.red], 'One-sided': ['#f1f3f6', C.mut] };
    const [bg, fg] = map[v] || map['One-sided'];
    return <span style={{ fontSize: 9.5, fontWeight: 700, padding: '3px 9px', borderRadius: 6, textTransform: 'uppercase', letterSpacing: '.04em', background: bg, color: fg }}>{v}</span>;
  };
  const rkb = n => <span style={{ display: 'inline-flex', width: 19, height: 19, borderRadius: '50%', background: C.brand, color: '#fff', fontSize: 10.5, fontWeight: 700, alignItems: 'center', justifyContent: 'center', marginRight: 9, flex: '0 0 auto' }}>{n}</span>;
  const side = s => s == null ? <span style={{ color: C.faint, fontStyle: 'italic' }}>— not cited</span>
    : <span>{s.rank != null && rkb(s.rank)}{s.text}{s.sub && <span style={{ fontSize: 11, color: C.mut }}> {s.sub}</span>}</span>;
  const th = { padding: '13px 16px', borderBottom: `1px solid ${C.hair}`, fontSize: 10, textTransform: 'uppercase', letterSpacing: '.06em', color: C.faint, fontWeight: 700, textAlign: 'left', background: '#f8f9fb' };
  const td = { padding: '13px 16px', borderBottom: `1px solid ${C.hair}`, fontSize: 13, verticalAlign: 'middle' };
  const rows = stories.rows || [];
  return (
    <div style={card}>
      <div style={sechead}><h2 style={h2s}>The Two Stories</h2><span style={tagS('#eef2ff', C.brand)}>PM exit forms</span><span style={{ color: C.faint, fontSize: 12, marginLeft: 'auto' }}>dimensions from the exit-form reason taxonomy · verdict at right</span></div>
      <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0, border: `1px solid ${C.line}`, borderRadius: 13, overflow: 'hidden', marginTop: 14 }}>
        <thead><tr>
          <th style={{ ...th, width: 172 }}>Dimension</th>
          <th style={th}>Manager{stories.manager_name ? ` — ${stories.manager_name}` : ''}</th>
          <th style={th}>Employee{stories.employee_name ? ` — ${stories.employee_name}` : ''}</th>
          <th style={{ ...th, textAlign: 'right', width: 132 }}>Verdict</th>
        </tr></thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} style={r.verdict === 'Divergent' ? { background: C.red + '10' } : null}>
              <td style={{ ...td, width: 172 }}><span style={{ fontWeight: 700, color: C.ink }}>{r.dimension}</span></td>
              <td style={{ ...td, color: C.ink2 }}>{side(r.manager)}</td>
              <td style={{ ...td, color: C.ink2 }}>{side(r.employee)}</td>
              <td style={{ ...td, textAlign: 'right', width: 132 }}>{verdictPill(r.verdict)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {stories.caption && <div style={{ fontSize: 11.5, color: C.mut, marginTop: 10 }}>{stories.caption}</div>}
    </div>
  );
}

// ── AI Observations & Conclusions — advisory synthesis (DD-007). ──
function AISynthesis({ ai = {} }) {
  if (!ai.verdict) return null;
  return (
    <div style={{ border: '1px solid #e6d8fb', background: 'linear-gradient(180deg,#fbf7ff,#fff)', borderRadius: 16, padding: '22px 24px', margin: '16px 0', boxShadow: card.boxShadow }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 11, marginBottom: 12 }}>
        <div style={{ width: 32, height: 32, borderRadius: 9, background: `linear-gradient(135deg,${C.purple},#a855f7)`, color: '#fff', fontWeight: 700, fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>AI</div>
        <h2 style={h2s}>AI Observations &amp; Conclusions</h2>
        {ai.confidence && <span style={{ marginLeft: 'auto', fontSize: 11, fontWeight: 700, color: C.purple, background: '#f3ecfe', padding: '5px 11px', borderRadius: 999 }}>Confidence: {ai.confidence}</span>}
      </div>
      <div style={{ fontSize: 14.5, lineHeight: 1.7, borderLeft: '3px solid #a855f7', paddingLeft: 15, margin: '4px 0 15px' }} dangerouslySetInnerHTML={{ __html: ai.verdict }} />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <div><h4 style={{ fontSize: 10.5, textTransform: 'uppercase', letterSpacing: '.06em', color: C.purple, marginBottom: 9 }}>Key facts</h4><ul style={{ margin: 0, paddingLeft: 18 }}>{(ai.key_facts || []).map((x, i) => <li key={i} style={{ marginBottom: 7, fontSize: 12.8, color: C.ink2 }} dangerouslySetInnerHTML={{ __html: x }} />)}</ul></div>
        <div><h4 style={{ fontSize: 10.5, textTransform: 'uppercase', letterSpacing: '.06em', color: C.purple, marginBottom: 9 }}>Recommended actions</h4><ul style={{ margin: 0, paddingLeft: 18 }}>{(ai.actions || []).map((x, i) => <li key={i} style={{ marginBottom: 7, fontSize: 12.8, color: C.ink }} dangerouslySetInnerHTML={{ __html: x }} />)}</ul></div>
      </div>
      <div style={{ marginTop: 15, fontSize: 11, color: C.faint, borderTop: `1px solid ${C.hair}`, paddingTop: 11 }}>{ai.caveat || 'AI-generated synthesis of the exit record, Signal snapshot, and both exit forms. Directional — review the facts before acting. Does not set the regrettable determination or any personnel decision; those are the skip-level’s call below.'}</div>
    </div>
  );
}

// ── Skip-Level Judgment — the only new input (DD-007/018). ──
function Judgment({ judgment = {}, aiSuggest, pattern, readOnly, onSave }) {
  const [cat, setCat] = useState(judgment.root_category || 'Employee Experience');
  const [reason, setReason] = useState(judgment.root_reason || 'Manager');
  const [reg, setReg] = useState(judgment.regrettable !== false);
  const [readText, setReadText] = useState(judgment.read_text || '');
  const ALL_ACTIONS = judgment.action_options || ['Coaching intervention — manager', 'Team-health review', 'Comp calibration', 'Backfill req', 'Alumni re-hire watch'];
  const [actions, setActions] = useState(judgment.actions || []);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState(null);
  const chip = (active, activeBg) => ({ border: `1px solid ${active ? (activeBg || C.brand) : C.line}`, background: active ? (activeBg || C.brand) : '#fff', color: active ? '#fff' : C.ink2, borderRadius: 999, padding: '8px 15px', fontSize: 12.5, cursor: readOnly ? 'default' : 'pointer', userSelect: 'none' });
  const jl = { fontSize: 11, fontWeight: 700, color: C.mut, marginBottom: 9, textTransform: 'uppercase', letterSpacing: '.05em', display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 6 };
  const toggleAction = a => { if (readOnly) return; setActions(p => p.includes(a) ? p.filter(x => x !== a) : [...p, a]); };
  const save = async () => { if (readOnly || !onSave) return; setSaving(true); try { await onSave({ root_category: cat, root_reason: reason, regrettable: reg, read_text: readText, actions }); setSavedAt(Date.now()); } catch (e) { /* savedAt stays null */ } finally { setSaving(false); } };
  return (
    <div style={card}>
      <div style={sechead}><h2 style={h2s}>Skip-Level Judgment</h2><span style={tagS('#eef2ff', C.brand)}>your call</span><span style={{ color: C.faint, fontSize: 12, marginLeft: 'auto' }}>everything above is assembled for you — this is the only new input</span></div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '18px 28px', marginTop: 10, ...(readOnly ? { opacity: 0.95 } : null) }}>
        <div>
          <div style={jl}>Primary root cause {aiSuggest && <span style={{ fontSize: 10, fontWeight: 700, color: C.purple, background: '#f3ecfe', padding: '2px 8px', borderRadius: 6, textTransform: 'none', letterSpacing: 0 }}>AI suggests: {aiSuggest}</span>}</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>{Object.keys(REASON_TAX).map(c => <span key={c} onClick={() => { if (readOnly) return; setCat(c); setReason(REASON_TAX[c][0]); }} style={{ ...chip(c === cat, C.red) }}>{c}</span>)}</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 9 }}>{(REASON_TAX[cat] || []).map(r => <span key={r} onClick={() => { if (readOnly) return; setReason(r); }} style={chip(r === reason)}>{r}</span>)}</div>
          <div style={{ fontSize: 11, color: C.mut, marginTop: 9 }}>Same taxonomy as the manager's exit survey — so your verdict sits next to what the manager and employee each cited.</div>
        </div>
        <div>
          <div style={jl}>Confirm / override "regrettable"</div>
          <div style={{ display: 'inline-flex', border: `1px solid ${C.line}`, borderRadius: 10, overflow: 'hidden' }}>
            <button onClick={() => !readOnly && setReg(true)} style={{ border: 'none', padding: '9px 17px', fontSize: 12.5, cursor: readOnly ? 'default' : 'pointer', fontWeight: 600, background: reg ? C.red : '#fff', color: reg ? '#fff' : C.mut }}>Regrettable</button>
            <button onClick={() => !readOnly && setReg(false)} style={{ border: 'none', padding: '9px 17px', fontSize: 12.5, cursor: readOnly ? 'default' : 'pointer', fontWeight: 600, background: !reg ? C.green : '#fff', color: !reg ? '#fff' : C.mut }}>Non-regrettable</button>
          </div>
          {judgment.ai_verdict && <div style={{ fontSize: 11, color: C.purple, marginTop: 9, fontWeight: 600 }}>AI verdict: {judgment.ai_verdict}</div>}
        </div>
        <div>
          <div style={jl}>Your read on the manager</div>
          <textarea value={readText} onChange={e => setReadText(e.target.value)} readOnly={readOnly} style={{ width: '100%', border: `1px solid ${C.line}`, borderRadius: 10, padding: '11px 13px', fontFamily: 'inherit', fontSize: 13, resize: 'vertical', minHeight: 96 }} />
        </div>
        <div>
          <div style={jl}>Actions</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>{ALL_ACTIONS.map(a => <span key={a} onClick={() => toggleAction(a)} style={chip(actions.includes(a), '#0f766e')}>{a}</span>)}</div>
        </div>
        <div style={{ gridColumn: '1 / -1' }}>
          {pattern && <div style={{ padding: '13px 15px', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 11, fontSize: 12.5, color: '#92400e', display: 'flex', gap: 10, alignItems: 'flex-start' }}>⚠️ <div dangerouslySetInnerHTML={{ __html: pattern }} /></div>}
        </div>
      </div>
      {!readOnly && onSave && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 18 }}>
          <button onClick={save} disabled={saving} style={{ background: C.brand, color: '#fff', border: 'none', borderRadius: 8, padding: '9px 18px', fontSize: 13, fontWeight: 600, cursor: saving ? 'default' : 'pointer', opacity: saving ? .6 : 1 }}>{saving ? 'Saving…' : 'Save skip-level judgment'}</button>
          {savedAt && <span style={{ color: C.green, fontSize: 12 }}>Saved ✓</span>}
        </div>
      )}
    </div>
  );
}

// Merge PM-owned review scores/detail into the frozen snapshot culture values (by value name),
// so CultureSection renders v10's review-score columns alongside the Signal signal slots.
function mergeCulture(data, exitCulture) {
  const d = unwrap(data) || {};
  if (!exitCulture || !d.culture?.values) return d;
  const scores = exitCulture.scores || {};
  const detail = exitCulture.detail || {};
  return {
    ...d,
    culture: {
      ...d.culture,
      values: d.culture.values.map(v => ({ ...v, rev: scores[v.value] || v.rev, detail: detail[v.value] || v.detail })),
    },
  };
}

function RecognitionModal({ row, onClose }) {
  if (!row || !row.detail) return null;
  const det = row.detail;
  const chipv = tone => ({ borderRadius: 999, padding: '5px 11px', fontSize: 11.5, fontWeight: 500, border: `1px solid ${tone === 'h' ? '#f6caca' : tone === 'm' ? '#f5dca8' : C.line}`, background: tone === 'h' ? '#fdecec' : tone === 'm' ? '#fdf3e3' : '#fff', color: tone === 'h' ? '#b91c1c' : tone === 'm' ? '#b45309' : C.ink2 });
  const taxrow = { display: 'flex', gap: 8, alignItems: 'center', marginTop: 11, flexWrap: 'wrap', fontSize: 12 };
  const lvl = { fontSize: 9.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.05em', color: C.faint, width: 74 };
  return (
    <div onClick={e => { if (e.target === e.currentTarget) onClose(); }} style={{ position: 'fixed', inset: 0, background: 'rgba(11,18,32,.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1200, backdropFilter: 'blur(2px)' }}>
      <div style={{ background: '#fff', borderRadius: 16, maxWidth: 480, width: '90%', padding: '22px 24px', boxShadow: '0 24px 60px rgba(0,0,0,.32)' }}>
        <button onClick={onClose} style={{ float: 'right', cursor: 'pointer', color: C.mut, fontSize: 22, lineHeight: 1, border: 'none', background: 'none' }}>×</button>
        <h3 style={{ fontSize: 14.5, marginBottom: 3 }}><span style={{ display: 'inline-block', background: '#ece7fd', color: '#6d28d9', borderRadius: 7, padding: '3px 9px', fontSize: 11, fontWeight: 700, marginRight: 7 }}>{row.value}</span>{det.comp}</h3>
        <div style={{ fontSize: 12, color: C.mut }}>{det.by}</div>
        <div style={taxrow}><span style={lvl}>Situational</span>{(det.sit || []).map((c, i) => <span key={i} style={chipv(c[1])}>{c[0]}</span>)}</div>
        <div style={taxrow}><span style={lvl}>Behavioral</span>{(det.beh || []).map((c, i) => <span key={i} style={chipv(c[1])}>{c[0]}</span>)}</div>
      </div>
    </div>
  );
}

export default function ExitAnalysisPanel({ data, exit = {}, onSaveJudgment, embedded, hideHeader, onClose }) {
  const [recRow, setRecRow] = useState(null);
  const readOnly = typeof onSaveJudgment !== 'function';
  const mergedCulture = mergeCulture(data, exit.culture);
  const reviewPeriods = exit.culture?.periods || null;

  const inner = (
    <div style={{ color: C.ink, fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif', fontSize: 14 }}>
      {!hideHeader && <ExitHeader subject={exit.subject} status={exit.status} employment={exit.employment} review={exit.review} />}
      <ArcSection data={data} mode="exit" />
      {exit.ai?.reads?.arc && <AIRead lead={exit.ai.reads.arc.lead}>{exit.ai.reads.arc.text}</AIRead>}
      <TwoStories stories={exit.stories} />
      {exit.ai?.reads?.stories && <AIRead lead={exit.ai.reads.stories.lead}>{exit.ai.reads.stories.text}</AIRead>}
      <CultureSection data={mergedCulture} reviewPeriods={reviewPeriods} onRecognitionClick={setRecRow} />
      {exit.ai?.reads?.culture && <AIRead lead={exit.ai.reads.culture.lead}>{exit.ai.reads.culture.text}</AIRead>}
      <AISynthesis ai={exit.ai} />
      <Judgment judgment={exit.judgment} aiSuggest={exit.judgment?.ai_suggest} pattern={exit.judgment?.pattern} readOnly={readOnly} onSave={onSaveJudgment} />
      <div style={{ color: C.faint, fontSize: 11.5, marginTop: 24, textAlign: 'center' }}>Exit Analysis (Skip-Level) · post-exit · PM + Signal · DD-002 / DD-022</div>
      <RecognitionModal row={recRow} onClose={() => setRecRow(null)} />
    </div>
  );

  if (embedded) return inner;
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(11,18,32,.5)', zIndex: 1000, overflowY: 'auto', backdropFilter: 'blur(2px)' }} onClick={e => { if (e.target === e.currentTarget && onClose) onClose(); }}>
      <div style={{ maxWidth: 1080, margin: '18px auto', background: C.bg, borderRadius: 18, padding: '18px 24px 60px', minHeight: 200 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <div style={{ color: C.faint, fontSize: 12 }}>People › Exits › <b style={{ color: C.ink2 }}>{exit.subject?.name || '…'}</b> · Exit Analysis</div>
          {onClose && <button onClick={onClose} style={{ border: `1px solid ${C.line}`, background: '#fff', borderRadius: 8, padding: '4px 12px', cursor: 'pointer', fontSize: 13 }}>Close ✕</button>}
        </div>
        {inner}
      </div>
    </div>
  );
}
