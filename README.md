# @st6-partners/retention-watch-panel

Reusable, **presentational** Mode B *Retention Watch* skip-level panel — graduated from Signal
(`rcdo-hierarchy-tool`) as Shared Library component **SC-037** (DD-021 / DD-022, OI-EXIT-6).

**Build once.** The panel consumes the **SP-005 snake_case wire `data` payload directly** — the
exact shape produced by Signal's `toWireContract()` and carried across apps by the Spine-Router
feed. Signal and Performance Management (PM) feed it the **same** payload with **zero field
mapping**. One component, one source of truth, identical render everywhere.

It renders: subject header · Manager's-read-vs-signals · The Arc (Attrition / Training &
Performance / Coaching) · Culture Fit & Engagement · AI Retention Brief (advisory) · Retention Plan.

---

## Install

```bash
# GitHub Packages (ST6-Partners org) — see ADOPTION for the finalize/publish step
npm install @st6-partners/retention-watch-panel
```

`react >= 17` is a peer dependency. The package **ships JSX source** (`src/*.jsx`); your app's
bundler (Vite / CRA / webpack+babel / Next) transpiles it. No build output is committed — an
optional compiled dual-format build (tsup/rollup) is a finalize step (see ADOPTION.md).

---

## Usage

### PM — read-only snapshot (the canonical cross-app path)

```jsx
import RetentionWatchPanel from '@st6-partners/retention-watch-panel';

// `snapshot` is the stored { data, meta } envelope PM pulled from the Spine-Router feed.
// The panel auto-unwraps the envelope; with no onSavePlan the Retention Plan is read-only.
<RetentionWatchPanel data={snapshot} embedded />
```

### Signal — live, editable

```jsx
import RetentionWatchPanel from '@st6-partners/retention-watch-panel';
import { apiFetch } from '../hooks/useApi';

<RetentionWatchPanel
  userId={userId}
  // fetcher MUST return the WIRE (snake_case) shape — see "Feeding the wire shape" below.
  fetcher={(id) => apiFetch(`/api/retention-watch/${id}`)}
  onSavePlan={(plan) => apiFetch(`/api/retention-watch/${userId}/plan`, {
    method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(plan),
  })}
  onClose={handleClose}
/>
```

You can also skip `fetcher` and pass a pre-fetched `data` object directly (same as PM). If neither
`data` nor a usable `fetcher`+`userId` is supplied, the panel renders an empty shell.

---

## Props

| Prop | Type | Required | Notes |
|---|---|---|---|
| `data` | wire payload | one of `data`/`fetcher` | The inner wire `data` object **or** the full `{ data, meta }` envelope (auto-unwrapped). If present, no fetch. |
| `userId` | string | for `fetcher` mode | Subject id; passed to `fetcher`. Not needed when `data` is supplied. |
| `fetcher` | `(userId) => Promise<payload>` | no | Used only when `data` is absent. Must resolve to the **wire** shape (or the envelope). |
| `onSavePlan` | `(plan) => Promise<void>` | no | Called on "Save retention plan". `plan` = `{ priority, driver_category, driver_reason, plan_text, actions }` (snake_case). **Omit to render the plan read-only.** |
| `onClose` | `() => void` | no | Dismiss handler for the overlay chrome. |
| `embedded` | boolean | no | `true` renders inline (no fixed overlay). |

The panel has **no app-internal imports** — data in via `data`/`fetcher`, plan out via `onSavePlan`.

---

## Data contract — the SP-005 wire `data` payload

Source of truth: `toWireContract()` in Signal's `retentionWatchAssembler.js` (shipped for
provenance under `../src/reference/`). The panel reads the **inner `data` object**; the outer
envelope also carries `meta { signal_person_id, router_employee_id, window_weeks, generated_at }`.

```jsonc
{
  "signal_person_id": "u-1",
  "router_employee_id": "r-9",            // string | null
  "subject": {                             // object | null
    "name": "Daniel Okafor",
    "title": "Sr SWE",
    "dept": "Business Systems",
    "manager_id": "m-2",
    "manager_name": "Kevin Walsh",
    "avatar_initials": "DO"
  },
  "status": {
    "risk_label": "High",                  // string | null
    "risk_probability": 60,                // number 0..100 | null
    "impact_label": "Critical",            // string | null
    "impact_value": 4,                     // number 1..5 | null
    "regrettable_if_lost": true,           // bool | null  (read-only, from DD-001)
    "currently_employed": true
  },
  "weeks": ["Apr 20", "Apr 27"],           // x-axis labels (one per window week)
  "week_starts": ["2026-04-20", "..."],    // ISO Monday of each week

  "arc": {
    "flight_risk":     [10, 60],           // (number 0..100 | null)[]
    "business_impact": [3, 4],             // (number 1..5   | null)[]
    "regrettable_if_lost": { "segments": [{ "from": 1, "to": 1 }], "flagged": true },
    "plan_exec":       [92, 72],           // (number 0..100 | null)[]
    "development": { "lines": [
      { "name": "Detail-Oriented", "color": "#dc2626", "data": [3, 2.1], "bad": true }
    ]},
    "coaching_phase": [
      { "label": "Rehab (PIP)", "from_idx": 1, "to_idx": 1, "color": "#dc2626" }
    ],
    "coaching_person": [2.4, 1.9],         // (number 1..5 | null)[]
    "team_avg":        [2.2, 2.2]          // (number 1..5 | null)[]
  },

  "markers": [{ "idx": 1, "kind": "today" }],   // vertical guides; defaults to "today" at last week

  "culture": { "values": [
    { "value": "Grit", "reviews": null,
      "ev":  ["g", "y", ""],               // evidence sentiment codes per weekly slot
      "rec": ["", "g", ""] }               // recognition codes; '' = no signal that slot
  ]},                                        // sentiment codes: g | lg | y | lr | r

  "manager_read": {                          // object | null
    "as_of": "2026-07-06",
    "flight_risk": "Low (25%)",
    "impact": "Critical",
    "regrettable_if_lost": "Yes",
    "note": "no concerns",
    "signals": {
      "flight_trajectory": "Rising → High",
      "coaching": "Flat 2.0",
      "development": "Declining",
      "recognition": "Silent ~6 weeks"
    },
    "verdict": "The manager is under-reading the risk."   // string | null
  },

  "brief": {                                 // object | null (advisory AI synthesis)
    "confidence": "High",
    "verdict": "…",
    "why_now": ["…"],
    "moves":   ["…"]
  },

  "plan": {                                  // object | null
    "priority": "keep",                      // 'keep' | 'monitor' | 'ride'
    "driver_category": "Employee Experience",
    "driver_reason": "Manager",
    "plan_text": "…",
    "actions": ["Skip-level 1:1"]
  },

  "data_notes": []                           // string[]; partial-data degradations, surfaced in footer
}
```

Every section is independently optional: a missing/`null` section is skipped (Manager's-read,
Culture, Brief) or renders an empty-state ("no data in window"). This mirrors the assembler's
defensive per-section degradation, so a partial wire payload never throws.

---

## Save (write) contract

`onSavePlan(plan)` receives snake_case `{ priority, driver_category, driver_reason, plan_text,
actions }` — the same dialect as the wire `plan`. The **host** maps this to its own persistence
endpoint; the panel never calls an app API itself. Signal's existing PUT
`/api/retention-watch/:userId/plan` expects camelCase, so Signal's `onSavePlan` maps the five keys
(or the route is updated to accept snake_case) — see ADOPTION.md.

## Provenance

- Graduated from `ST6-Partners/rcdo-hierarchy-tool` (`main`): `client/src/components/RetentionWatch.jsx`
  (original preserved at `../src/reference/RetentionWatch.original.jsx`), contract from
  `server/services/retentionWatchAssembler.js` (`toWireContract`), wire test
  `tests/retention-watch-wire.test.js` — all under `../src/reference/`.
- This package is the **wire-native** adaptation: identical visuals, snake_case consumption, no
  host coupling, injectable fetch/save.
