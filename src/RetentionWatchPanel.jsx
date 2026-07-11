/**
 * RetentionWatchPanel — reusable, presentational Mode B "Retention Watch" skip-level panel.
 * Graduated from Signal (rcdo-hierarchy-tool) as Shared Library component SC-037 (DD-021 / DD-022, OI-EXIT-6).
 *
 * BUILD ONCE: this component consumes the SP-005 snake_case wire `data` payload DIRECTLY
 * (the inner object of the `{ data, meta }` envelope produced by `toWireContract()` in
 * Signal's retentionWatchAssembler). Both Signal and Performance Management feed it the
 * SAME wire shape with ZERO field mapping. It renders Arc + Culture Fit & Engagement +
 * Coaching + manager-read-vs-signals + AI Retention Brief + Retention Plan.
 *
 * ZERO host coupling: no app-internal imports. Data arrives via the `data` prop (snapshot /
 * pre-fetched) or an injected `fetcher(userId)`; the Retention Plan save is injected via
 * `onSavePlan(plan)`. With no `onSavePlan`, the plan renders read-only (e.g. a PM snapshot).
 *
 * RETENTION-ONLY FRAMING (DD-021): no regrettable determination, no accountability verdict.
 * The only regrettable reference is the read-only forward "regrettable_if_lost" flag carried
 * from Signal's weekly assessment (DD-001). The AI synthesis is advisory-only (DD-007).
 *
 * Props:
 *   data       — the wire payload to render. Accepts either the inner wire `data` object OR
 *                the full `{ data, meta }` envelope (auto-unwrapped). If present, no fetch.
 *   userId     — subject id; only used to drive `fetcher` (self-fetch mode) and passed to
 *                `onSavePlan` context. Not required when `data` is supplied.
 *   fetcher    — optional async (userId) => wirePayload. Used only when `data` is absent.
 *   onSavePlan — optional async (plan) => void. `plan` = { priority, driver_category,
 *                driver_reason, plan_text, actions } (snake_case, matches the wire `plan`).
 *                When omitted, the Retention Plan is read-only.
 *   onClose    — called when the drill-down overlay is dismissed.
 *   embedded   — if true, render inline (no fixed overlay chrome).
 *   hideSubject — if true, drop the subject identity header (name/title/manager) but keep the
 *                risk pills. For hosts that already show the person's identity (e.g. PM's profile).
 *   hideHeader  — if true, drop the ENTIRE top header card (identity + risk pills). For hosts that
 *                render their own summary chrome (e.g. PM's accordion header carries the risk chips).
 */
import React, { useState, useEffect, useRef } from 'react';

const C = {
  ink: '#0b1220', ink2: '#334155', mut: '#6b7280', faint: '#9aa4b2', line: '#e6e8ec',
  hair: '#eef1f5', bg: '#f5f6f8', brand: '#4f46e5', green: '#15a34a', amber: '#d97706',
  red: '#dc2626', purple: '#7c3aed',
};
const SENT = { g: '#15a34a', lg: '#4ade80', y: '#eab308', lr: '#f87171', r: '#dc2626' };
const GRAY = '#cbd5e1', RFILL = 'rgba(220,38,38,0.12)';
const cRisk = v => v <= 25 ? C.green : v <= 50 ? C.amber : C.red;
const cImp = v => v <= 2 ? C.green : v < 3.5 ? C.amber : C.red;
const cPE = v => v >= 80 ? C.green : v >= 55 ? C.amber : C.red;
const cCoach = v => v >= 3.5 ? C.green : v >= 2.5 ? C.amber : C.red;

const PW = 680, H = 88, X0 = 12, X1 = 666;
const REASON_TAX = {
  'Hiring Mistake': ['Values', 'Performance', 'Assessments', 'Expectations'],
  'Employee Experience': ['Expectations', 'Compensation', 'Opportunity', 'Manager'],
  'Other': ['Personal', 'Other'],
};

// Accept either the SP-005 envelope { data, meta } or the inner wire `data` object.
function unwrap(p) {
  if (p && typeof p === 'object' && p.data && p.meta && !p.subject && !p.arc) return p.data;
  return p;
}

// ── SVG helpers (React elements) ───────────────────────────────────────────
function Chart({ series, multi, opt, weeks, markers, onHover }) {
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

function PhaseBar({ segments, weeks }) {
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

function RegBar({ reg, weeks }) {
  const N = weeks.length, h = 44, bh = 18, by = (h - bh) / 2;
  const X = i => X0 + i * ((X1 - X0) / Math.max(N - 1, 1));
  return (
    <svg viewBox={`0 0 ${PW} ${h}`} width="100%" height={h} style={{ display: 'block' }}>
      <rect x={X(0).toFixed(1)} y={by} width={(X(N - 1) - X(0)).toFixed(1)} height={bh} rx="7" fill="#eef1f5" />
      {(reg.segments || []).map((s, i) => (
        <rect key={i} x={X(s.from).toFixed(1)} y={by} width={Math.max(X(s.to) - X(s.from), 3).toFixed(1)} height={bh} rx="7" fill="#a5b4fc" />
      ))}
      {reg.flagged && <text x={(X(N - 1)).toFixed(1)} y={(h / 2 + 3.5).toFixed(1)} textAnchor="end" fontSize="9.5" fill="#3730a3" fontWeight="700" dx="-6">flagged — worth keeping</text>}
    </svg>
  );
}

function SlotRow({ arr }) {
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

function Band({ label, children }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '150px 1fr', borderBottom: `1px solid ${C.hair}`, alignItems: 'center' }}>
      <div style={{ fontSize: 12.5, fontWeight: 600, color: C.ink2, padding: '8px 14px', borderRight: `1px solid ${C.hair}`, height: '100%', display: 'flex', alignItems: 'center' }}>{label}</div>
      <div style={{ padding: '4px 14px' }}>{children}</div>
    </div>
  );
}
function Group({ title, color, children }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '96px 1fr', borderBottom: `3px solid ${C.hair}` }}>
      <div style={{ background: color, color: '#fff', fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: 8, lineHeight: 1.3 }}>{title}</div>
      <div>{children}</div>
    </div>
  );
}
const card = { background: '#fff', border: `1px solid ${C.line}`, borderRadius: 16, padding: '20px 22px', margin: '16px 0', boxShadow: '0 1px 2px rgba(16,24,40,.04),0 1px 3px rgba(16,24,40,.06)' };
const sechead = { display: 'flex', alignItems: 'center', gap: 11, marginBottom: 4, flexWrap: 'wrap' };
const h2s = { fontSize: 16, fontWeight: 700, letterSpacing: '-.02em', margin: 0 };
const tagS = (bg, fg) => ({ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em', padding: '3px 9px', borderRadius: 6, background: bg, color: fg });

export default function RetentionWatchPanel({ userId, data: dataProp, fetcher, onSavePlan, onClose, embedded, hideSubject, hideHeader }) {
  const [data, setData] = useState(unwrap(dataProp) || null);
  const [loading, setLoading] = useState(!dataProp);
  const [err, setErr] = useState(null);
  const [tip, setTip] = useState(null);
  const tipRef = useRef(null);

  useEffect(() => {
    if (dataProp) { setData(unwrap(dataProp)); setLoading(false); return; }
    if (typeof fetcher !== 'function' || !userId) { setLoading(false); return; }
    let alive = true;
    setLoading(true);
    Promise.resolve(fetcher(userId))
      .then(d => { if (alive) { setData(unwrap(d)); setLoading(false); } })
      .catch(e => { if (alive) { setErr(e.message || 'Failed to load'); setLoading(false); } });
    return () => { alive = false; };
  }, [userId, dataProp, fetcher]);

  const onHover = (e, name, week, val) => {
    if (!e) { setTip(null); return; }
    setTip({ x: e.clientX + 12, y: e.clientY + 12, name, week, val });
  };

  const shell = (inner) => embedded ? <div>{inner}</div> : (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(11,18,32,.5)', zIndex: 1000, overflowY: 'auto', backdropFilter: 'blur(2px)' }} onClick={e => { if (e.target === e.currentTarget && onClose) onClose(); }}>
      <div style={{ maxWidth: 1080, margin: '18px auto', background: C.bg, borderRadius: 18, padding: '18px 24px 60px', minHeight: 200 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <div style={{ color: C.faint, fontSize: 12 }}>People › Attrition Exposure › <b style={{ color: C.ink2 }}>{data?.subject?.name || '…'}</b> · Retention Watch</div>
          {onClose && <button onClick={onClose} style={{ border: `1px solid ${C.line}`, background: '#fff', borderRadius: 8, padding: '4px 12px', cursor: 'pointer', fontSize: 13 }}>Close ✕</button>}
        </div>
        {inner}
      </div>
    </div>
  );

  if (loading) return shell(<div style={{ padding: 40, textAlign: 'center', color: C.mut }}>Loading Retention Watch…</div>);
  if (err) return shell(<div style={{ padding: 40, textAlign: 'center', color: C.red }}>Error: {err}</div>);
  if (!data) return shell(<div style={{ padding: 40 }} />);

  const { subject = {}, status = {}, weeks = [], arc = {}, culture = {}, manager_read: managerRead, brief, plan } = data;
  const markers = (data.markers && data.markers.length) ? data.markers : (weeks.length ? [{ idx: weeks.length - 1, kind: 'today' }] : []);

  return shell(
    <div style={{ color: C.ink, fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif', fontSize: 14 }}>
      {tip && <div ref={tipRef} style={{ position: 'fixed', left: tip.x, top: tip.y, zIndex: 1100, background: C.ink, color: '#fff', fontSize: 11.5, padding: '8px 11px', borderRadius: 8, pointerEvents: 'none', boxShadow: '0 6px 20px rgba(0,0,0,.28)', maxWidth: 240 }}><b>{tip.name}</b> · {tip.week}<br />{tip.val}</div>}

      {!hideHeader && (<>
      {/* Header */}
      <div style={{ background: '#fff', border: `1px solid ${C.line}`, borderRadius: 16, padding: '18px 20px', boxShadow: card.boxShadow }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          {!hideSubject && (
            <div style={{ width: 56, height: 56, borderRadius: '50%', background: `linear-gradient(135deg,${C.brand},#8b5cf6)`, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 20 }}>{subject.avatar_initials || '?'}</div>
          )}
          <div style={{ flex: '1 1 auto' }}>
            {hideSubject ? (
              <div style={{ fontSize: 13, fontWeight: 700, color: C.ink2 }}>Retention signals</div>
            ) : (
              <>
                <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-.02em' }}>{subject.name || 'Unknown'}</div>
                <div style={{ color: C.ink2, fontWeight: 500, fontSize: 13 }}>{[subject.title, subject.dept, subject.manager_name && `reports to ${subject.manager_name}`].filter(Boolean).join(' · ')}</div>
              </>
            )}
          </div>
          <div style={{ display: 'flex', gap: 7, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
            <span style={{ fontSize: 9.5, textTransform: 'uppercase', letterSpacing: '.06em', color: C.faint, fontWeight: 700 }}>Risk now</span>
            {status.risk_label && <Pill bg="#fdecec" fg="#b91c1c" dot={C.red}>{`Flight risk ${status.risk_label}`}{status.risk_probability != null ? ` (${status.risk_probability}%)` : ''}</Pill>}
            {status.impact_label && <Pill bg="#fdf3e3" fg="#b45309" dot={C.amber}>{`Impact ${status.impact_label}`}</Pill>}
            {status.regrettable_if_lost === true && <Pill bg="#eef2ff" fg={C.brand} dot={C.brand}>Regrettable if lost</Pill>}
            <Pill bg="#e7f7ee" fg="#15803d" dot={C.green}>Currently employed</Pill>
          </div>
        </div>
      </div>
      </>)}

      {/* Manager's read vs signals */}
      {managerRead && (
        <div style={card}>
          <div style={sechead}><h2 style={h2s}>Manager's read vs. the signals</h2><span style={tagS('#e0f7fb', '#0e7490')}>Signal · weekly</span><span style={{ color: C.faint, fontSize: 12, marginLeft: 'auto' }}>does the manager see it coming — while there's still time?</span></div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', border: `1px solid ${C.line}`, borderRadius: 13, overflow: 'hidden', marginTop: 14 }}>
            <div style={{ padding: '14px 16px', borderRight: `1px solid ${C.hair}`, background: '#fbfbfd' }}>
              <h4 style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '.06em', color: C.faint, fontWeight: 700, marginBottom: 9 }}>Manager's weekly attrition read{managerRead.as_of ? ` · as of ${managerRead.as_of}` : ''}</h4>
              <MRow k="Flight risk" v={managerRead.flight_risk} />
              <MRow k="Business impact" v={managerRead.impact} />
              <MRow k="Regrettable if lost" v={managerRead.regrettable_if_lost} />
              {managerRead.note && <MRow k="Note" v={`"${managerRead.note}"`} />}
            </div>
            <div style={{ padding: '14px 16px' }}>
              <h4 style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '.06em', color: C.faint, fontWeight: 700, marginBottom: 9 }}>What the objective signals say</h4>
              <MRow k="Flight-risk trajectory" v={managerRead.signals?.flight_trajectory} tone="bd" />
              <MRow k="Coaching (1:1)" v={managerRead.signals?.coaching} tone="bd" />
              <MRow k="Development" v={managerRead.signals?.development} tone="wn" />
              <MRow k="Recognition" v={managerRead.signals?.recognition} tone="bd" />
            </div>
          </div>
          {managerRead.verdict && <div style={{ padding: '12px 16px', background: '#fdf3e3', borderTop: '1px solid #f5dca8', fontSize: 12.8, color: '#92400e', marginTop: -1, borderRadius: '0 0 13px 13px' }}>⚠️ <b style={{ color: '#7c2d12' }}>{managerRead.verdict}</b> The weekly call doesn't match the reddening signals — the gap to close now.</div>}
        </div>
      )}

      {/* The Arc */}
      <div style={card}>
        <div style={sechead}><h2 style={h2s}>The Arc</h2><span style={tagS('#e7f7ee', '#15803d')}>Signal · live</span><span style={{ color: C.faint, fontSize: 12, marginLeft: 'auto' }}>last {weeks.length} weeks → today · dot color = good→bad · red = danger zone</span></div>
        <div style={{ marginTop: 16, border: `1px solid ${C.line}`, borderRadius: 12, overflow: 'hidden' }}>
          <Group title={<span>Attrition<br />Assessment</span>} color="#e11d48">
            <Band label="Flight Risk"><Chart series={arc.flight_risk || []} opt={{ min: 0, max: 100, dc: cRisk, name: 'Flight Risk', unit: '%' }} weeks={weeks} markers={markers} onHover={onHover} /></Band>
            <Band label="Business Impact"><Chart series={arc.business_impact || []} opt={{ min: 1, max: 5, dc: cImp, name: 'Business Impact' }} weeks={weeks} markers={markers} onHover={onHover} /></Band>
            <Band label="Regrettable if lost"><RegBar reg={arc.regrettable_if_lost || { segments: [] }} weeks={weeks} /></Band>
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

      {/* Culture Fit & Engagement */}
      {culture.values && culture.values.length > 0 && (
        <div style={card}>
          <div style={sechead}><h2 style={h2s}>Culture Fit &amp; Engagement</h2><span style={tagS('#e0f7fb', '#0e7490')}>Signal · values</span><span style={{ color: C.faint, fontSize: 12, marginLeft: 'auto' }}>live signals over the last 90 days</span></div>
          <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0, marginTop: 12, fontSize: 13 }}>
            <thead><tr>
              <th style={{ textAlign: 'left', fontSize: 10, textTransform: 'uppercase', letterSpacing: '.06em', color: C.faint, fontWeight: 700, padding: '8px 10px', borderBottom: `2px solid ${C.line}`, width: '25%' }}>Value</th>
              <th style={{ textAlign: 'left', fontSize: 10, textTransform: 'uppercase', letterSpacing: '.06em', color: C.faint, fontWeight: 700, padding: '8px 10px', borderBottom: `2px solid ${C.line}` }}>Signals · last 90 days (top = evidence, bottom = recognition)</th>
            </tr></thead>
            <tbody>
              {culture.values.map((row, i) => (
                <tr key={i}>
                  <td style={{ padding: 10, borderBottom: `1px solid ${C.hair}`, fontWeight: 600, color: C.ink2 }}>{row.value}</td>
                  <td style={{ padding: 10, borderBottom: `1px solid ${C.hair}` }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 9, margin: '3px 0' }}><span style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', color: C.faint, width: 38 }}>Evid</span><SlotRow arr={row.ev} /></div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 9, margin: '3px 0' }}><span style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', color: C.faint, width: 38 }}>Recog</span><SlotRow arr={row.rec} /></div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap', fontSize: 10.5, color: C.faint, marginTop: 10 }}>Signal sentiment:
            <i style={{ width: 10, height: 10, borderRadius: '50%', background: SENT.r, display: 'inline-block' }} />low
            <i style={{ width: 10, height: 10, borderRadius: '50%', background: SENT.lr, display: 'inline-block' }} />
            <i style={{ width: 10, height: 10, borderRadius: '50%', background: SENT.y, display: 'inline-block' }} />
            <i style={{ width: 10, height: 10, borderRadius: '50%', background: SENT.lg, display: 'inline-block' }} />
            <i style={{ width: 10, height: 10, borderRadius: '50%', background: SENT.g, display: 'inline-block' }} />high · {(culture.values[0]?.ev?.length) || 13} weekly slots (oldest → newest) · empty = no signal that week</div>
        </div>
      )}

      {/* AI Retention Brief */}
      {brief && (
        <div style={{ border: '1px solid #e6d8fb', background: 'linear-gradient(180deg,#fbf7ff,#fff)', borderRadius: 16, padding: '22px 24px', margin: '16px 0', boxShadow: card.boxShadow }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 11, marginBottom: 12 }}>
            <div style={{ width: 32, height: 32, borderRadius: 9, background: `linear-gradient(135deg,${C.purple},#a855f7)`, color: '#fff', fontWeight: 700, fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>AI</div>
            <h2 style={{ ...h2s }}>AI Retention Brief</h2>
            <span style={{ marginLeft: 'auto', fontSize: 11, fontWeight: 700, color: C.purple, background: '#f3ecfe', padding: '5px 11px', borderRadius: 999 }}>Confidence: {brief.confidence}</span>
          </div>
          <div style={{ fontSize: 14.5, lineHeight: 1.7, borderLeft: '3px solid #a855f7', paddingLeft: 15, margin: '4px 0 15px' }}>{brief.verdict}</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div><h4 style={{ fontSize: 10.5, textTransform: 'uppercase', letterSpacing: '.06em', color: C.purple, marginBottom: 9 }}>Why now</h4><ul style={{ margin: 0, paddingLeft: 18 }}>{(brief.why_now || []).map((x, i) => <li key={i} style={{ marginBottom: 7, fontSize: 12.8, color: C.ink2 }}>{x}</li>)}</ul></div>
            <div><h4 style={{ fontSize: 10.5, textTransform: 'uppercase', letterSpacing: '.06em', color: C.purple, marginBottom: 9 }}>Recommended retention moves</h4><ul style={{ margin: 0, paddingLeft: 18 }}>{(brief.moves || []).map((x, i) => <li key={i} style={{ marginBottom: 7, fontSize: 12.8, color: C.ink }}>{x}</li>)}</ul></div>
          </div>
          <div style={{ marginTop: 15, fontSize: 11, color: C.faint, borderTop: `1px solid ${C.hair}`, paddingTop: 11 }}>AI-generated synthesis of the live Signal snapshot. Directional — advisory only. Does not set the retention decision or any personnel action; those are the skip-level's call below.</div>
        </div>
      )}

      {/* Retention Plan */}
      <RetentionPlan userId={userId} initial={plan} managerName={subject.manager_name} onSavePlan={onSavePlan} />

      <div style={{ color: C.faint, fontSize: 11.5, marginTop: 24, textAlign: 'center' }}>Retention Watch (Skip-Level) · prospective / prevention · Signal · DD-021 / DD-022{data.data_notes && data.data_notes.length ? ` · ${data.data_notes.length} partial-data note(s)` : ''}</div>
    </div>
  );
}

function Pill({ bg, fg, dot, children }) {
  return <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 600, padding: '4px 9px', borderRadius: 7, border: `1px solid ${C.line}`, background: bg, color: fg }}><span style={{ width: 7, height: 7, borderRadius: '50%', background: dot }} />{children}</span>;
}
function MRow({ k, v, tone }) {
  const col = tone === 'bd' ? C.red : tone === 'wn' ? C.amber : tone === 'gd' ? C.green : C.ink2;
  return <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, fontSize: 12.5, padding: '5px 0', borderBottom: `1px solid ${C.hair}` }}><span style={{ color: C.mut }}>{k}</span><span style={{ fontWeight: 600, color: col, textAlign: 'right' }}>{v || '—'}</span></div>;
}

function RetentionPlan({ userId, initial, managerName, onSavePlan }) {
  const readOnly = typeof onSavePlan !== 'function';
  const [priority, setPriority] = useState(initial?.priority || 'monitor');
  const [cat, setCat] = useState(initial?.driver_category || 'Employee Experience');
  const [reason, setReason] = useState(initial?.driver_reason || 'Manager');
  const [planText, setPlanText] = useState(initial?.plan_text || '');
  const ACTIONS = ['Skip-level 1:1', `Coaching intervention — ${managerName || 'manager'}`, 'Comp / retention review', 'Role / scope change', 'Reassign manager', 'Career-path plan'];
  const [actions, setActions] = useState(initial?.actions || []);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState(null);

  const toggleAction = a => setActions(prev => prev.includes(a) ? prev.filter(x => x !== a) : [...prev, a]);
  const save = async () => {
    if (readOnly) return;
    setSaving(true);
    try {
      // snake_case body — matches the wire `plan` shape (SP-005). The host maps it to its own
      // persistence endpoint via onSavePlan; the panel never talks to any app API directly.
      await onSavePlan({ priority, driver_category: cat, driver_reason: reason, plan_text: planText, actions });
      setSavedAt(Date.now());
    } catch (e) { /* surfaced via savedAt staying null */ }
    finally { setSaving(false); }
  };
  const chip = (active, onClick, extra = {}) => ({ border: `1px solid ${active ? C.brand : C.line}`, background: active ? C.brand : '#fff', color: active ? '#fff' : C.ink2, borderRadius: 999, padding: '8px 15px', fontSize: 12.5, cursor: 'pointer', userSelect: 'none', ...extra });
  const prioBtn = (v, label, onColor) => (
    <button onClick={() => setPriority(v)} style={{ border: 'none', padding: '9px 17px', fontSize: 12.5, cursor: 'pointer', fontWeight: 600, background: priority === v ? onColor : '#fff', color: priority === v ? '#fff' : C.mut }}>{label}</button>
  );

  return (
    <div style={card}>
      <div style={sechead}><h2 style={h2s}>Retention Plan</h2><span style={tagS('#eef2ff', C.brand)}>your call</span><span style={{ color: C.faint, fontSize: 12, marginLeft: 'auto' }}>everything above is assembled for you — this is the only new input</span></div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '18px 28px', marginTop: 10, ...(readOnly ? { pointerEvents: 'none', opacity: 0.92 } : null) }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: C.mut, marginBottom: 9, textTransform: 'uppercase', letterSpacing: '.05em' }}>What's driving the risk</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>{Object.keys(REASON_TAX).map(c => <span key={c} onClick={() => { setCat(c); setReason(REASON_TAX[c][0]); }} style={{ ...chip(c === cat), ...(c === cat ? { background: C.red, borderColor: C.red } : {}) }}>{c}</span>)}</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 9 }}>{(REASON_TAX[cat] || []).map(r => <span key={r} onClick={() => setReason(r)} style={chip(r === reason, null, { fontSize: 12, padding: '6px 13px' })}>{r}</span>)}</div>
          <div style={{ fontSize: 11, color: C.mut, marginTop: 9 }}>Same taxonomy as the exit-form reasons — a driver named here maps straight through if the person does leave.</div>
        </div>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: C.mut, marginBottom: 9, textTransform: 'uppercase', letterSpacing: '.05em' }}>Retention priority</div>
          <div style={{ display: 'inline-flex', border: `1px solid ${C.line}`, borderRadius: 10, overflow: 'hidden' }}>
            {prioBtn('keep', 'Fight to keep', C.green)}{prioBtn('monitor', 'Monitor', C.amber)}{prioBtn('ride', 'Let ride', C.mut)}
          </div>
          <div style={{ fontSize: 11.5, color: C.brand, marginTop: 9, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 7 }}><span style={{ width: 7, height: 7, borderRadius: '50%', background: C.brand }} />Regrettable if lost carried read-only from Signal's weekly assessment (DD-001) — not a verdict.</div>
        </div>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: C.mut, marginBottom: 9, textTransform: 'uppercase', letterSpacing: '.05em' }}>Your intervention plan</div>
          <textarea value={planText} onChange={e => setPlanText(e.target.value)} placeholder="Forward plan — what will you do, by when?" style={{ width: '100%', border: `1px solid ${C.line}`, borderRadius: 10, padding: '11px 13px', fontFamily: 'inherit', fontSize: 13, resize: 'vertical', minHeight: 96 }} />
        </div>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: C.mut, marginBottom: 9, textTransform: 'uppercase', letterSpacing: '.05em' }}>Actions</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>{ACTIONS.map(a => <span key={a} onClick={() => toggleAction(a)} style={{ ...chip(actions.includes(a)), ...(actions.includes(a) ? { background: '#0f766e', borderColor: '#0f766e' } : {}) }}>{a}</span>)}</div>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 18 }}>
        {readOnly
          ? <span style={{ color: C.faint, fontSize: 12 }}>Read-only view — pass <code>onSavePlan</code> to enable editing.</span>
          : <>
              <button onClick={save} disabled={saving} style={{ background: C.brand, color: '#fff', border: 'none', borderRadius: 8, padding: '9px 18px', fontSize: 13, fontWeight: 600, cursor: saving ? 'default' : 'pointer', opacity: saving ? .6 : 1 }}>{saving ? 'Saving…' : 'Save retention plan'}</button>
              {savedAt && <span style={{ color: C.green, fontSize: 12 }}>Saved ✓</span>}
            </>}
      </div>
    </div>
  );
}
