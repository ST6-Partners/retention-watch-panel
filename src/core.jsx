// SC-037 core — the shared correlated-signal engine (BUILD ONCE, DD-022).
// Extracted from RetentionWatchPanel v1.2.0. Consumed by BOTH RetentionWatchPanel (Mode B,
// prospective Retention Watch) and ExitAnalysisPanel (Mode A, post-exit Exit Analysis) so the
// Arc + Culture Fit & Engagement + Coaching engine exists in one place. Zero host coupling:
// pure presentational, data via the SP-005 snake_case wire shape. Primitives are verbatim from
// v1.2.0; ArcSection/CultureSection are the composed sections, parameterized by `mode` and by
// optional PM-owned review columns so the one place the two modes differ (the regrettable band
// label/colour, and the Mode-A review-score columns) is handled without forking the engine.
import React, { useState } from 'react';

export const C = {
  ink: '#0b1220', ink2: '#334155', mut: '#6b7280', faint: '#9aa4b2', line: '#e6e8ec',
  hair: '#eef1f5', bg: '#f5f6f8', brand: '#4f46e5', green: '#15a34a', amber: '#d97706',
  red: '#dc2626', purple: '#7c3aed',
};
export const SENT = { g: '#15a34a', lg: '#4ade80', y: '#eab308', lr: '#f87171', r: '#dc2626' };
export const GRAY = '#cbd5e1', RFILL = 'rgba(220,38,38,0.12)';
export const cRisk = v => v <= 25 ? C.green : v <= 50 ? C.amber : C.red;
export const cImp = v => v <= 2 ? C.green : v < 3.5 ? C.amber : C.red;
export const cPE = v => v >= 80 ? C.green : v >= 55 ? C.amber : C.red;
export const cCoach = v => v >= 3.5 ? C.green : v >= 2.5 ? C.amber : C.red;
export const PW = 680, H = 88, X0 = 12, X1 = 666;
export const REASON_TAX = {
  'Hiring Mistake': ['Values', 'Performance', 'Assessments', 'Expectations'],
  'Employee Experience': ['Expectations', 'Compensation', 'Opportunity', 'Manager'],
  'Other': ['Personal', 'Other'],
};

// Accept either the SP-005 envelope { data, meta } or the inner wire `data` object.
export function unwrap(p) {
  if (p && typeof p === 'object' && p.data && p.meta && !p.subject && !p.arc) return p.data;
  return p;
}

export const card = { background: '#fff', border: `1px solid ${C.line}`, borderRadius: 16, padding: '20px 22px', margin: '16px 0', boxShadow: '0 1px 2px rgba(16,24,40,.04),0 1px 3px rgba(16,24,40,.06)' };
export const sechead = { display: 'flex', alignItems: 'center', gap: 11, marginBottom: 4, flexWrap: 'wrap' };
export const h2s = { fontSize: 16, fontWeight: 700, letterSpacing: '-.02em', margin: 0 };
export const tagS = (bg, fg) => ({ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em', padding: '3px 9px', borderRadius: 6, background: bg, color: fg });
export const spill = (v) => {
  const bg = v >= 4 ? C.green + '18' : v >= 3.3 ? C.amber + '20' : C.red + '18';
  const fg = v >= 4 ? C.green : v >= 3.3 ? C.amber : C.red;
  return { display: 'inline-block', minWidth: 36, textAlign: 'center', padding: '3px 7px', borderRadius: 7, fontSize: 12, fontWeight: 700, background: bg, color: fg };
};

// ── SVG primitives (React elements) — verbatim from SC-037 v1.2.0 ───────────
export function Chart({ series, multi, opt, weeks, markers, onHover }) {
  const N = weeks.length;
  const X = i => X0 + i * ((X1 - X0) / Math.max(N - 1, 1));
  const top = 12, bot = H - 14;
  const Y = v => bot - ((v - opt.min) / (opt.max - opt.min)) * (bot - top);
  const mk = (markers || []).map((m, k) => (
    <line key={'mk' + k} x1={X(m.idx).toFixed(1)} y1={3} x2={X(m.idx).toFixed(1)} y2={H - 3}
      stroke={m.kind === 'today' ? C.brand : m.kind === 'amber' ? C.amber : C.red}
      strokeWidth="1.3" strokeDasharray="3 3" />
  ));
  const lines = multi || [{ data: series, color: GRAY, dc: opt.dc, name: opt.name, unit: opt.unit, bad: opt.bad }];
  const fills = [], polys = [], dots = [];
  lines.forEach((ln, li) => {
    const badFn = ln.bad || (ln.dc ? (v => ln.dc(v) === C.red) : null);
    if (badFn) {
      for (let i = 0; i < ln.data.length - 1; i++) {
        const a = ln.data[i], b = ln.data[i + 1];
        if (a == null || b == null) continue;
        if (badFn(a) || badFn(b)) fills.push(
          <path key={`f${li}-${i}`} d={`M${X(i).toFixed(1)},${Y(a).toFixed(1)} L${X(i + 1).toFixed(1)},${Y(b).toFixed(1)} L${X(i + 1).toFixed(1)},${bot} L${X(i).toFixed(1)},${bot} Z`} fill={RFILL} />);
      }
    }
    const pts = ln.data.map((v, i) => v == null ? null : `${X(i).toFixed(1)},${Y(v).toFixed(1)}`).filter(Boolean).join(' ');
    if (pts) polys.push(<polyline key={`p${li}`} points={pts} fill="none" stroke={ln.color || GRAY} strokeWidth="2" />);
    ln.data.forEach((v, i) => {
      if (v == null) return;
      const col = ln.dc ? ln.dc(v) : ln.color;
      dots.push(<circle key={`d${li}-${i}`} cx={X(i).toFixed(1)} cy={Y(v).toFixed(1)} r="4" fill={col}
        style={{ cursor: 'pointer' }}
        onMouseEnter={e => onHover(e, `${ln.name || opt.name}`, weeks[i], `${v}${ln.unit || opt.unit || ''}`)}
        onMouseMove={e => onHover(e, `${ln.name || opt.name}`, weeks[i], `${v}${ln.unit || opt.unit || ''}`)}
        onMouseLeave={() => onHover(null)} />);
    });
  });
  const hasData = lines.some(l => l.data.some(v => v != null));
  return (
    <svg viewBox={`0 0 ${PW} ${H}`} width="100%" height={H} style={{ display: 'block' }}>
      {mk}{fills}{polys}{dots}
      {!hasData && <text x={PW / 2} y={H / 2} textAnchor="middle" fontSize="11" fill={C.faint}>no data in window</text>}
    </svg>
  );
}

export function PhaseBar({ segments, weeks }) {
  const N = weeks.length, h = 22;
  const X = i => X0 + i * ((X1 - X0) / Math.max(N - 1, 1));
  return (
    <svg viewBox={`0 0 ${PW} ${h}`} width="100%" height={h} style={{ display: 'block' }}>
      {(segments || []).map((s, i) => {
        const x = X(s.from_idx), w = X(s.to_idx) - X(s.from_idx), cx = x + w / 2;
        return (<g key={i}>
          <rect x={x.toFixed(1)} y="1" width={Math.max(w, 1).toFixed(1)} height={h - 2} rx="4" fill={s.color} />
          {w > 40 && <text x={cx.toFixed(1)} y={(h / 2 + 3.5).toFixed(1)} textAnchor="middle" fontSize="10" fill="#fff" fontWeight="600">{s.label}</text>}
        </g>);
      })}
      {(!segments || !segments.length) && <text x={PW / 2} y={h / 2 + 3} textAnchor="middle" fontSize="10" fill={C.faint}>no phase history</text>}
    </svg>
  );
}

// RegBar — parameterized: `color` of the flagged segment(s) and an optional trailing `note`.
// Mode B (retention): indigo + "flagged — worth keeping". Mode A (exit): red, no note (DD-020).
export function RegBar({ reg, weeks, color = '#a5b4fc', note = 'flagged — worth keeping' }) {
  const N = weeks.length, h = 44, bh = 18, by = (h - bh) / 2;
  const X = i => X0 + i * ((X1 - X0) / Math.max(N - 1, 1));
  return (
    <svg viewBox={`0 0 ${PW} ${h}`} width="100%" height={h} style={{ display: 'block' }}>
      <rect x={X(0).toFixed(1)} y={by} width={(X(N - 1) - X(0)).toFixed(1)} height={bh} rx="7" fill="#eef1f5" />
      {(reg.segments || []).map((s, i) => (
        <rect key={i} x={X(s.from).toFixed(1)} y={by} width={Math.max(X(s.to) - X(s.from), 3).toFixed(1)} height={bh} rx="7" fill={color} />
      ))}
      {reg.flagged && note && <text x={(X(N - 1)).toFixed(1)} y={(h / 2 + 3.5).toFixed(1)} textAnchor="end" fontSize="9.5" fill="#3730a3" fontWeight="700" dx="-6">{note}</text>}
    </svg>
  );
}

export function SlotRow({ arr }) {
  const n = arr.length, gap = 17, ox = 9, cy = 8, w = ox + (n - 1) * gap + 9;
  return (
    <svg width={w} height="16" viewBox={`0 0 ${w} 16`}>
      {arr.map((code, i) => {
        const x = ox + i * gap;
        return code ? <circle key={i} cx={x} cy={cy} r="5" fill={SENT[code]} />
          : <circle key={i} cx={x} cy={cy} r="4.5" fill="#fff" stroke="#dfe3e8" strokeWidth="1.4" />;
      })}
    </svg>
  );
}

export function Band({ label, children }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '150px 1fr', borderBottom: `1px solid ${C.hair}`, alignItems: 'center' }}>
      <div style={{ fontSize: 12.5, fontWeight: 600, color: C.ink2, padding: '8px 14px', borderRight: `1px solid ${C.hair}`, height: '100%', display: 'flex', alignItems: 'center' }}>{label}</div>
      <div style={{ padding: '4px 14px' }}>{children}</div>
    </div>
  );
}
export function Group({ title, color, children }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '96px 1fr', borderBottom: `3px solid ${C.hair}` }}>
      <div style={{ background: color, color: '#fff', fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: 8, lineHeight: 1.3 }}>{title}</div>
      <div>{children}</div>
    </div>
  );
}
export function Pill({ bg, fg, dot, children }) {
  return <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 600, padding: '4px 9px', borderRadius: 7, border: `1px solid ${C.line}`, background: bg, color: fg }}><span style={{ width: 7, height: 7, borderRadius: '50%', background: dot }} />{children}</span>;
}
export function MRow({ k, v, tone }) {
  const col = tone === 'bd' ? C.red : tone === 'wn' ? C.amber : tone === 'gd' ? C.green : C.ink2;
  return <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, fontSize: 12.5, padding: '5px 0', borderBottom: `1px solid ${C.hair}` }}><span style={{ color: C.mut }}>{k}</span><span style={{ fontWeight: 600, color: col, textAlign: 'right' }}>{v || '—'}</span></div>;
}

function useTip() {
  const [tip, setTip] = useState(null);
  const onHover = (e, name, week, val) => { if (!e) { setTip(null); return; } setTip({ x: e.clientX + 12, y: e.clientY + 12, name, week, val }); };
  const el = tip && <div style={{ position: 'fixed', left: tip.x, top: tip.y, zIndex: 1100, background: C.ink, color: '#fff', fontSize: 11.5, padding: '8px 11px', borderRadius: 8, pointerEvents: 'none', boxShadow: '0 6px 20px rgba(0,0,0,.28)', maxWidth: 240 }}><b>{tip.name}</b> · {tip.week}<br />{tip.val}</div>;
  return { onHover, el };
}

// ── ArcSection — the correlated-signal chart engine (shared core). ──────────
// `mode`: 'retention' (Mode B) or 'exit' (Mode A) — controls only the regrettable band's
// label/colour and the section tag/sdesc. Everything else is identical across modes.
export function ArcSection({ data, mode = 'retention' }) {
  const d = unwrap(data) || {};
  const { subject = {}, weeks = [], arc = {} } = d;
  const markers = (d.markers && d.markers.length) ? d.markers : (weeks.length ? [{ idx: weeks.length - 1, kind: 'today' }] : []);
  const { onHover, el } = useTip();
  const isExit = mode === 'exit';
  const tag = isExit ? tagS('#e0f7fb', '#0e7490') : tagS('#e7f7ee', '#15803d');
  const tagText = isExit ? 'Signal · snapshot' : 'Signal · live';
  const sdesc = isExit
    ? 'frozen at exit · dot color = good→bad · red = danger zone'
    : `last ${weeks.length} weeks → today · dot color = good→bad · red = danger zone`;
  const regLabel = isExit ? 'Regrettable?' : 'Regrettable if lost';
  const regColor = isExit ? '#f87171' : '#a5b4fc';
  const regNote = isExit ? null : 'flagged — worth keeping';
  return (
    <div style={card}>
      {el}
      <div style={sechead}><h2 style={h2s}>The Arc</h2><span style={tag}>{tagText}</span><span style={{ color: C.faint, fontSize: 12, marginLeft: 'auto' }}>{sdesc}</span></div>
      <div style={{ marginTop: 16, border: `1px solid ${C.line}`, borderRadius: 12, overflow: 'hidden' }}>
        <Group title={<span>Attrition<br />Assessment</span>} color="#e11d48">
          <Band label="Flight Risk"><Chart series={arc.flight_risk || []} opt={{ min: 0, max: 100, dc: cRisk, name: 'Flight Risk', unit: '%' }} weeks={weeks} markers={markers} onHover={onHover} /></Band>
          <Band label="Business Impact"><Chart series={arc.business_impact || []} opt={{ min: 1, max: 5, dc: cImp, name: 'Business Impact' }} weeks={weeks} markers={markers} onHover={onHover} /></Band>
          <Band label={regLabel}><RegBar reg={arc.regrettable_if_lost || { segments: [] }} weeks={weeks} color={regColor} note={regNote} /></Band>
        </Group>
        <Group title={<span>Training &amp;<br />Performance</span>} color="#0d9488">
          <Band label="Plan / Execution"><Chart series={arc.plan_exec || []} opt={{ min: 0, max: 100, dc: cPE, name: 'Plan / Execution' }} weeks={weeks} markers={markers} onHover={onHover} /></Band>
          <Band label="Development"><Chart multi={(arc.development?.lines || []).map(l => ({ ...l, unit: ' / 5' }))} opt={{ min: 1, max: 5, name: 'Development' }} weeks={weeks} markers={markers} onHover={onHover} /></Band>
          <Band label="Coaching Phase"><PhaseBar segments={arc.coaching_phase || []} weeks={weeks} /></Band>
        </Group>
        <Group title="Coaching" color="#7c3aed">
          <Band label={subject.name ? subject.name.split(/\s+/)[0] : 'Person'}><Chart series={arc.coaching_person || []} opt={{ min: 1, max: 5, dc: cCoach, name: subject.name || 'Coaching', unit: ' / 5' }} weeks={weeks} markers={markers} onHover={onHover} /></Band>
          <Band label="Team avg"><Chart series={arc.team_avg || []} opt={{ min: 1, max: 5, dc: cCoach, name: 'Team avg', unit: ' / 5' }} weeks={weeks} markers={markers} onHover={onHover} /></Band>
        </Group>
        <div style={{ display: 'grid', gridTemplateColumns: '96px 150px 1fr' }}>
          <div style={{ borderRight: `1px solid ${C.hair}` }} /><div style={{ borderRight: `1px solid ${C.hair}` }} />
          <div style={{ padding: '0 14px' }}>
            <svg viewBox={`0 0 ${PW} 18`} width="100%" height="18">
              {weeks.map((w, i) => (i % 2 === 0) && <text key={i} x={(X0 + i * ((X1 - X0) / Math.max(weeks.length - 1, 1))).toFixed(1)} y="12" fontSize="9.5" fill={C.faint} textAnchor="middle">{w}</text>)}
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── CultureSection — values × signals (shared core). ────────────────────────
// `reviewPeriods` (optional, Mode A): column headers for per-value review scores read from
// each row's `rev` array; when present, renders the score columns + a period-average row
// (DD-011/DD-015/DD-019). Omit for Mode B (value + signals only). `onRecognitionClick(row)`
// makes a recognition row clickable (the structured-recognition modal, DD-011).
export function CultureSection({ data, reviewPeriods = null, onRecognitionClick = null }) {
  const d = unwrap(data) || {};
  const culture = d.culture || {};
  const values = culture.values || [];
  if (!values.length) return null;
  const hasRev = Array.isArray(reviewPeriods) && reviewPeriods.length > 0;
  const th = { fontSize: 10, textTransform: 'uppercase', letterSpacing: '.06em', color: C.faint, fontWeight: 700, padding: '8px 10px', borderBottom: `2px solid ${C.line}` };
  const avg = k => values.reduce((a, x) => a + (x.rev?.[k] ?? 0), 0) / values.length;
  return (
    <div style={card}>
      <div style={sechead}><h2 style={h2s}>Culture Fit &amp; Engagement</h2><span style={tagS('#e0f7fb', '#0e7490')}>Signal · values</span><span style={{ color: C.faint, fontSize: 12, marginLeft: 'auto' }}>{hasRev ? 'review scores over cycles · live signals over the last 90 days' : 'live signals over the last 90 days'}</span></div>
      <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0, marginTop: 12, fontSize: 13 }}>
        <thead><tr>
          <th style={{ ...th, textAlign: 'left', width: hasRev ? '21%' : '25%' }}>Value</th>
          {hasRev && reviewPeriods.map((p, i) => <th key={i} style={{ ...th, textAlign: 'center', width: '8%', paddingLeft: 4, paddingRight: 4 }}>{p}</th>)}
          <th style={{ ...th, textAlign: 'left' }}>Signals · last 90 days (top = evidence, bottom = recognition)</th>
        </tr></thead>
        <tbody>
          {values.map((row, i) => {
            const recHas = (row.rec || []).some(x => x);
            const recRow = <div style={{ display: 'flex', alignItems: 'center', gap: 9, margin: '3px 0' }}><span style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', color: C.faint, width: 38 }}>Recog</span><SlotRow arr={row.rec || []} /></div>;
            return (
              <tr key={i}>
                <td style={{ padding: 10, borderBottom: `1px solid ${C.hair}`, fontWeight: 600, color: C.ink2 }}>{row.value}</td>
                {hasRev && (row.rev || []).map((s, k) => <td key={k} style={{ padding: 10, borderBottom: `1px solid ${C.hair}`, textAlign: 'center', paddingLeft: 4, paddingRight: 4 }}><span style={spill(s)}>{s.toFixed(1)}</span></td>)}
                <td style={{ padding: 10, borderBottom: `1px solid ${C.hair}` }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 9, margin: '3px 0' }}><span style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', color: C.faint, width: 38 }}>Evid</span><SlotRow arr={row.ev || []} /></div>
                  {recHas && onRecognitionClick && row.detail
                    ? <span style={{ cursor: 'pointer', borderRadius: 6, display: 'inline-block' }} onClick={() => onRecognitionClick(row)}>{recRow}</span>
                    : recRow}
                </td>
              </tr>
            );
          })}
          {hasRev && (
            <tr>
              <td style={{ padding: 10, borderTop: `2px solid ${C.line}`, fontWeight: 700, color: C.mut, textTransform: 'uppercase', fontSize: 10.5, letterSpacing: '.05em', background: '#fbfcfd' }}>Period average</td>
              {reviewPeriods.map((p, k) => <td key={k} style={{ padding: 10, borderTop: `2px solid ${C.line}`, textAlign: 'center', fontWeight: 700, background: '#fbfcfd' }}><span style={spill(avg(k))}>{avg(k).toFixed(1)}</span></td>)}
              <td style={{ borderTop: `2px solid ${C.line}`, background: '#fbfcfd' }} />
            </tr>
          )}
        </tbody>
      </table>
      <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap', fontSize: 10.5, color: C.faint, marginTop: 10 }}>Signal sentiment:
        <i style={{ width: 10, height: 10, borderRadius: '50%', background: SENT.r, display: 'inline-block' }} />low
        <i style={{ width: 10, height: 10, borderRadius: '50%', background: SENT.lr, display: 'inline-block' }} />
        <i style={{ width: 10, height: 10, borderRadius: '50%', background: SENT.y, display: 'inline-block' }} />
        <i style={{ width: 10, height: 10, borderRadius: '50%', background: SENT.lg, display: 'inline-block' }} />
        <i style={{ width: 10, height: 10, borderRadius: '50%', background: SENT.g, display: 'inline-block' }} />high · {(values[0]?.ev?.length) || 13} weekly slots (oldest → newest) · empty = no signal that week{onRecognitionClick ? ' · click a recognition row for detail' : ''}</div>
    </div>
  );
}
