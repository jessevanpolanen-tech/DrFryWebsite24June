// ══════════════════════════════════════════════════════════════════
// Demo-results module — operator (client) view + owner portfolio view.
// Loaded into Dashboard.html alongside dashboard.jsx. Uses Recharts (global).
// Everything here is namespaced (DC / demo* / eurD) to avoid colliding with
// dashboard.jsx globals, and exports <DemoPortfolio/> to window at the end.
// ══════════════════════════════════════════════════════════════════
const { useState: useStateD, useMemo: useMemoD } = React;

// ── Brand tokens ──
const DC = {
  porcelain: "#FAFAFA", graphite: "#111315", red: "#C0392B", amber: "#F2A23A",
  line: "#E4E4E4", mute: "#6B6F73", panel: "#FFFFFF", ok: "#2E7D52", teal: "#188F8F",
};
const dSerif = "'DM Serif Display', Georgia, serif";
const dSans = "'Inter', -apple-system, system-ui, sans-serif";
const dMono = "'IBM Plex Mono', 'SF Mono', Menlo, monospace";

const eurD = (n) => "€" + Math.round(n).toLocaleString("en-US");
const round1D = (n) => Math.round(n * 10) / 10;

// AV series generator: baseline replaces ~every 3 days at AV 2.5; Dr. Fry stretches to ~12.
const avCurveD = (drfryEndDay) => {
  const d = [];
  for (let day = 0; day <= 12; day++) {
    const baseCycle = day % 4;
    const baseline = round1D([0.3, 1.1, 1.9, 2.5][baseCycle] ?? 0.3);
    const drfry = round1D(0.3 + (2.2 * day) / drfryEndDay);
    d.push({ day, baseline, drfry: Math.min(drfry, 2.6) });
  }
  return d;
};

// ════════════════ MOCK DATA (realistic) ════════════════
const DEMO_MOCK = [
  { id: "s1", restaurant: "Yamato Izakaya", city: "Amsterdam", contact: "Kenji O.", sku: "Chicken karaage — 180g basket", fryerType: "Twin-tank gas, 2×18L",
    kgBeforeMo: 118, kgAfterMo: 74, pricePerKg: 3.6, replBefore: "every 3 days", replDuring: "every 8 days",
    avBaseline: 2.4, avDay3: 0.8, oilSavingsPct: 37, absorption: "−31% (weighed)", taste: "No detectable off-note day 6", fryingTime: "Same",
    burnsCleaning: "Less waste-oil handling, easier end-of-day clean", fpLikelihood: 5, concerns: "Wants CE confirmed before signing", referral: "Sakura (A'dam Zuid)",
    drfryEndDay: 9, tpmLog: [ {date:"2026-06-04", tpm:8.9, powerOff:true}, {date:"2026-06-11", tpm:12.1, powerOff:true} ], submittedAt: "2026-06-14" },
  { id: "s2", restaurant: "Tokyo Ramen Bar", city: "Amsterdam", contact: "Mika T.", sku: "Ebi tempura — 6pc", fryerType: "Single electric 15L",
    kgBeforeMo: 92, kgAfterMo: 71, pricePerKg: 3.6, replBefore: "every 3 days", replDuring: "every 6 days",
    avBaseline: 2.6, avDay3: 1.0, oilSavingsPct: 23, absorption: "−22%", taste: "Slightly lighter colour", fryingTime: "Same",
    burnsCleaning: "No change noted", fpLikelihood: 3, concerns: "Price vs. current oil deal", referral: "",
    drfryEndDay: 7, tpmLog: [ {date:"2026-06-06", tpm:9.4, powerOff:true} ], submittedAt: "2026-06-16" },
  { id: "s3", restaurant: "Koya Soho", city: "London", contact: "James W.", sku: "Katsu — 200g", fryerType: "Twin-tank gas, 2×20L",
    kgBeforeMo: 156, kgAfterMo: 95, pricePerKg: 4.1, replBefore: "every 2–3 days", replDuring: "every 9 days",
    avBaseline: 2.5, avDay3: 0.7, oilSavingsPct: 39, absorption: "−34%", taste: "Panel could not distinguish day-old from fresh", fryingTime: "Same",
    burnsCleaning: "Fewer top-ups, less splatter", fpLikelihood: 5, concerns: "", referral: "Shoryu (Regent St)",
    drfryEndDay: 10, tpmLog: [ {date:"2026-05-28", tpm:7.8, powerOff:true}, {date:"2026-06-04", tpm:10.9, powerOff:true}, {date:"2026-06-08", tpm:13.2, powerOff:true} ], submittedAt: "2026-06-10" },
  { id: "s4", restaurant: "Shoryu Ramen", city: "London", contact: "Aiko N.", sku: "Karaage — 180g", fryerType: "Single electric 18L",
    kgBeforeMo: 104, kgAfterMo: 88, pricePerKg: 4.1, replBefore: "every 3 days", replDuring: "every 5 days",
    avBaseline: 2.5, avDay3: 1.1, oilSavingsPct: 15, absorption: "−18%", taste: "Minor improvement", fryingTime: "Same",
    burnsCleaning: "", fpLikelihood: 4, concerns: "Install downtime during service", referral: "",
    drfryEndDay: 6, tpmLog: [ {date:"2026-06-02", tpm:10.2, powerOff:true} ], submittedAt: "2026-06-18" },
  { id: "s5", restaurant: "Kodawari Ramen", city: "Paris", contact: "Luc M.", sku: "Gyoza + tempura mix", fryerType: "Twin-tank gas, 2×16L",
    kgBeforeMo: 132, kgAfterMo: 79, pricePerKg: 3.9, replBefore: "every 3 days", replDuring: "every 9 days",
    avBaseline: 2.4, avDay3: 0.75, oilSavingsPct: 40, absorption: "−36%", taste: "No off-note at day 7", fryingTime: "Same",
    burnsCleaning: "Noticeably less cleaning", fpLikelihood: 5, concerns: "Wants French-language support docs", referral: "Sanukiya",
    drfryEndDay: 10, tpmLog: [ {date:"2026-05-30", tpm:8.1, powerOff:true}, {date:"2026-06-07", tpm:12.6, powerOff:true} ], submittedAt: "2026-06-12" },
  { id: "s6", restaurant: "Sanukiya", city: "Paris", contact: "Yuki H.", sku: "Tempura udon set", fryerType: "Single electric 15L",
    kgBeforeMo: 88, kgAfterMo: 80, pricePerKg: 3.9, replBefore: "every 3 days", replDuring: "every 4 days",
    avBaseline: 2.6, avDay3: 1.3, oilSavingsPct: 8, absorption: "−9%", taste: "No clear difference", fryingTime: "Same",
    burnsCleaning: "", fpLikelihood: 2, concerns: "Low fry volume — unsure ROI", referral: "",
    drfryEndDay: 5, tpmLog: [ {date:"2026-06-09", tpm:11.8, powerOff:true} ], submittedAt: "2026-06-20" },
  { id: "s7", restaurant: "Takumi", city: "Düsseldorf", contact: "Hans B.", sku: "Tonkatsu — 220g", fryerType: "Twin-tank gas, 2×20L",
    kgBeforeMo: 168, kgAfterMo: 101, pricePerKg: 3.7, replBefore: "every 2–3 days", replDuring: "every 9 days",
    avBaseline: 2.5, avDay3: 0.7, oilSavingsPct: 40, absorption: "−35%", taste: "Panel blind — no distinction", fryingTime: "Same",
    burnsCleaning: "Fewer burns reported by staff", fpLikelihood: 5, concerns: "", referral: "Naniwa, Kushi-Tei",
    drfryEndDay: 11, tpmLog: [ {date:"2026-05-26", tpm:7.5, powerOff:true}, {date:"2026-06-02", tpm:10.4, powerOff:true}, {date:"2026-06-06", tpm:12.9, powerOff:true} ], submittedAt: "2026-06-09" },
  { id: "s8", restaurant: "Naniwa", city: "Düsseldorf", contact: "Sofia K.", sku: "Karaage — 200g", fryerType: "Single electric 18L",
    kgBeforeMo: 112, kgAfterMo: 82, pricePerKg: 3.7, replBefore: "every 3 days", replDuring: "every 6 days",
    avBaseline: 2.5, avDay3: 1.0, oilSavingsPct: 27, absorption: "−26%", taste: "Cleaner appearance", fryingTime: "Same",
    burnsCleaning: "Easier cleaning", fpLikelihood: 4, concerns: "Timing — renovating in Q4", referral: "",
    drfryEndDay: 8, tpmLog: [ {date:"2026-06-05", tpm:9.7, powerOff:true} ], submittedAt: "2026-06-17" },
  { id: "s9", restaurant: "Ippudo Covent Garden", city: "London", contact: "Ren S.", sku: "Age-gyoza — 8pc", fryerType: "Twin-tank gas, 2×18L",
    kgBeforeMo: 144, kgAfterMo: 96, pricePerKg: 4.1, replBefore: "every 3 days", replDuring: "every 7 days",
    avBaseline: 2.4, avDay3: 0.9, oilSavingsPct: 33, absorption: "−29%", taste: "No off-note day 6", fryingTime: "Same",
    burnsCleaning: "Less top-up handling", fpLikelihood: 4, concerns: "Multi-site rollout terms?", referral: "Ippudo St Paul's",
    drfryEndDay: 9, tpmLog: [ {date:"2026-06-01", tpm:8.6, powerOff:true}, {date:"2026-06-08", tpm:12.0, powerOff:true} ], submittedAt: "2026-06-13" },
];

// ── derived per-site metrics ──
function demoSiteMetrics(s) {
  const kgSaved = Math.max(0, s.kgBeforeMo - s.kgAfterMo);
  const pct = s.kgBeforeMo > 0 ? round1D((kgSaved / s.kgBeforeMo) * 100) : 0;
  const eurMonth = kgSaved * s.pricePerKg;
  return { kgSaved, pct, eurMonth, eurYear: eurMonth * 12 };
}

function DemoMetric({ k, v, accent, note }) {
  return (
    <div style={{ flex: "1 1 0", minWidth: 130, padding: "14px 16px", background: DC.panel, border: `1px solid ${DC.line}` }}>
      <div style={{ fontFamily: dMono, fontSize: 10.5, letterSpacing: 0.6, textTransform: "uppercase", color: DC.mute, marginBottom: 8 }}>{k}</div>
      <div style={{ fontFamily: dSerif, fontSize: 30, lineHeight: 1, color: accent || DC.graphite }}>{v}</div>
      {note && <div style={{ fontFamily: dMono, fontSize: 10, color: DC.mute, marginTop: 8 }}>{note}</div>}
    </div>
  );
}
function DemoSectionLabel({ children }) {
  return (
    <div style={{ fontFamily: dMono, fontSize: 10.5, letterSpacing: 1, textTransform: "uppercase", color: DC.amber, margin: "22px 0 14px", borderBottom: `1px solid ${DC.line}`, paddingBottom: 8 }}>{children}</div>
  );
}
// Inline-SVG line chart: AV over 12 days, baseline (red) vs Dr. Fry (teal),
// replace-threshold reference at AV 2.5. Domain y 0..3, x 0..12.
function DegradationChart({ data }) {
  const W = 720, H = 240, padL = 34, padR = 16, padT = 14, padB = 26;
  const maxDay = 12, maxAV = 3;
  const x = (d) => padL + (d / maxDay) * (W - padL - padR);
  const y = (v) => padT + (1 - v / maxAV) * (H - padT - padB);
  const path = (key) => data.map((p, i) => `${i === 0 ? "M" : "L"}${x(p.day).toFixed(1)},${y(p[key]).toFixed(1)}`).join(" ");
  const yTicks = [0, 0.5, 1, 1.5, 2, 2.5, 3];
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "auto", display: "block" }}>
      {yTicks.map((v, i) => (
        <g key={i}>
          <line x1={padL} y1={y(v)} x2={W - padR} y2={y(v)} stroke={DC.line} strokeDasharray="3 3" />
          <text x={padL - 6} y={y(v) + 3} textAnchor="end" style={{ fontFamily: dMono, fontSize: 9.5, fill: DC.mute }}>{v}</text>
        </g>
      ))}
      {data.map((p, i) => (
        <text key={i} x={x(p.day)} y={H - 8} textAnchor="middle" style={{ fontFamily: dMono, fontSize: 9.5, fill: DC.mute }}>{p.day}</text>
      ))}
      <text x={4} y={12} style={{ fontFamily: dMono, fontSize: 9.5, fill: DC.mute }}>AV</text>
      <text x={W - padR} y={H - 8} textAnchor="end" style={{ fontFamily: dMono, fontSize: 9.5, fill: DC.mute }}>Day</text>
      {/* replace threshold */}
      <line x1={padL} y1={y(2.5)} x2={W - padR} y2={y(2.5)} stroke={DC.mute} strokeDasharray="4 4" />
      <text x={W - padR} y={y(2.5) - 5} textAnchor="end" style={{ fontFamily: dMono, fontSize: 9, fill: DC.mute }}>Replace threshold</text>
      <path d={path("baseline")} fill="none" stroke={DC.red} strokeWidth={2} strokeLinejoin="round" />
      <path d={path("drfry")} fill="none" stroke={DC.teal} strokeWidth={2} strokeLinejoin="round" />
      {data.map((p, i) => <circle key={"b" + i} cx={x(p.day)} cy={y(p.baseline)} r={2} fill={DC.red} />)}
      {data.map((p, i) => <circle key={"d" + i} cx={x(p.day)} cy={y(p.drfry)} r={2} fill={DC.teal} />)}
    </svg>
  );
}

// Inline-SVG bar chart: % oil saved per site, median reference line,
// hot leads (FP≥4) in teal, others muted.
function SavingsBarChart({ data, median }) {
  const W = 720, H = 240, padL = 34, padR = 16, padT = 14, padB = 30;
  const maxY = Math.max(50, Math.ceil(Math.max(...data.map((d) => d.pct)) / 10) * 10);
  const plotW = W - padL - padR;
  const y = (v) => padT + (1 - v / maxY) * (H - padT - padB);
  const band = plotW / data.length;
  const bw = Math.min(46, band * 0.6);
  const yTicks = [0, maxY / 4, maxY / 2, (maxY * 3) / 4, maxY];
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "auto", display: "block" }}>
      {yTicks.map((v, i) => (
        <g key={i}>
          <line x1={padL} y1={y(v)} x2={W - padR} y2={y(v)} stroke={DC.line} strokeDasharray="3 3" />
          <text x={padL - 6} y={y(v) + 3} textAnchor="end" style={{ fontFamily: dMono, fontSize: 9.5, fill: DC.mute }}>{Math.round(v)}</text>
        </g>
      ))}
      <text x={4} y={12} style={{ fontFamily: dMono, fontSize: 9.5, fill: DC.mute }}>% saved</text>
      {data.map((d, i) => {
        const cx = padL + band * i + band / 2;
        return (
          <g key={i}>
            <rect x={cx - bw / 2} y={y(d.pct)} width={bw} height={H - padB - y(d.pct)} fill={d.hot ? DC.teal : DC.mute} />
            <text x={cx} y={H - 10} textAnchor="middle" style={{ fontFamily: dMono, fontSize: 9, fill: DC.mute }}>{d.name}</text>
          </g>
        );
      })}
      <line x1={padL} y1={y(median)} x2={W - padR} y2={y(median)} stroke={DC.amber} strokeWidth={1.5} strokeDasharray="4 4" />
      <text x={W - padR} y={y(median) - 5} textAnchor="end" style={{ fontFamily: dMono, fontSize: 9, fill: DC.amber }}>median {median}%</text>
    </svg>
  );
}

/* ══════════════════ CLIENT PAGE (operator sees only their own site) ══════════════════ */
function DemoClientPage({ sites, setSites }) {
  const [activeId, setActiveId] = useStateD(sites[0].id);
  const site = sites.find((s) => s.id === activeId);
  const m = demoSiteMetrics(site);
  const curve = useMemoD(() => avCurveD(site.drfryEndDay), [site.drfryEndDay]);

  const edit = (key, val) => setSites(sites.map((s) => s.id === activeId ? { ...s, [key]: val } : s));
  const editNum = (key, val) => edit(key, val === "" ? 0 : parseFloat(val));

  const [tpmDate, setTpmDate] = useStateD(""); const [tpmVal, setTpmVal] = useStateD(""); const [tpmOff, setTpmOff] = useStateD(true);
  const addTpm = () => {
    if (!tpmDate || tpmVal === "") return;
    edit("tpmLog", [...site.tpmLog, { date: tpmDate, tpm: parseFloat(tpmVal), powerOff: tpmOff }]);
    setTpmDate(""); setTpmVal(""); setTpmOff(true);
  };
  const inp = { fontFamily: dMono, fontSize: 12.5, color: DC.graphite, border: `1px solid ${DC.line}`, padding: "8px 10px", background: DC.porcelain, width: 120 };

  return (
    <div>
      {/* Prototype-only site picker (stands in for the operator's own login) */}
      <div style={{ background: "#FFF8F0", border: `1px dashed ${DC.amber}`, padding: "8px 12px", marginBottom: 18, fontFamily: dMono, fontSize: 11, color: DC.mute, display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
        <span style={{ color: DC.amber, fontWeight: 700 }}>PROTOTYPE</span>
        <span>In production each operator logs into their own site only. Preview as:</span>
        <select value={activeId} onChange={(e) => setActiveId(e.target.value)} style={{ fontFamily: dMono, fontSize: 11, padding: "4px 6px", border: `1px solid ${DC.line}` }}>
          {sites.map((s) => <option key={s.id} value={s.id}>{s.restaurant} · {s.city}</option>)}
        </select>
      </div>

      <div style={{ marginBottom: 8 }}>
        <div style={{ fontFamily: dMono, fontSize: 10.5, letterSpacing: 2, textTransform: "uppercase", color: DC.red, marginBottom: 6 }}>Dr. Fry ProWave™ · Your demo results</div>
        <h1 style={{ fontFamily: dSerif, fontSize: 32, color: DC.graphite, margin: 0 }}>{site.restaurant}</h1>
        <div style={{ fontFamily: dSans, fontSize: 13, color: DC.mute, marginTop: 4 }}>{site.city} · {site.fryerType}</div>
      </div>

      {/* Fixed SKU banner */}
      <div style={{ background: DC.graphite, padding: "12px 16px", borderLeft: `3px solid ${DC.amber}`, margin: "14px 0 18px" }}>
        <div style={{ fontFamily: dMono, fontSize: 9, letterSpacing: 1.5, textTransform: "uppercase", color: DC.amber, marginBottom: 4 }}>Fixed test SKU — keep constant for the whole demo</div>
        <div style={{ fontFamily: dSans, fontSize: 14, color: "#E8E9EA" }}>{site.sku}</div>
      </div>

      <DemoSectionLabel>Your oil benchmark — measured in kg</DemoSectionLabel>
      <div style={{ background: DC.panel, border: `1px solid ${DC.line}`, padding: 20, marginBottom: 8 }}>
        <div style={{ display: "flex", gap: 24, flexWrap: "wrap", alignItems: "flex-end" }}>
          <div>
            <div style={{ fontFamily: dSans, fontSize: 11.5, fontWeight: 600, color: DC.graphite, marginBottom: 4 }}>Oil per month — BEFORE (kg)</div>
            <input type="number" value={site.kgBeforeMo} onChange={(e) => editNum("kgBeforeMo", e.target.value)} style={inp} />
          </div>
          <div>
            <div style={{ fontFamily: dSans, fontSize: 11.5, fontWeight: 600, color: DC.graphite, marginBottom: 4 }}>Oil per month — WITH Dr. Fry (kg)</div>
            <input type="number" value={site.kgAfterMo} onChange={(e) => editNum("kgAfterMo", e.target.value)} style={inp} />
          </div>
          <div>
            <div style={{ fontFamily: dSans, fontSize: 11.5, fontWeight: 600, color: DC.graphite, marginBottom: 4 }}>Your oil price (€/kg)</div>
            <input type="number" step="0.1" value={site.pricePerKg} onChange={(e) => editNum("pricePerKg", e.target.value)} style={inp} />
          </div>
        </div>
      </div>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 16 }}>
        <DemoMetric k="Oil saved / month" v={m.kgSaved + " kg"} accent={DC.teal} note={`${m.pct}% less oil`} />
        <DemoMetric k="Saved / month" v={eurD(m.eurMonth)} accent={DC.ok} />
        <DemoMetric k="Saved / year" v={eurD(m.eurYear)} accent={DC.red} note="On this one fryer" />
      </div>

      <DemoSectionLabel>Oil freshness over time (AV)</DemoSectionLabel>
      <div style={{ background: DC.panel, border: `1px solid ${DC.line}`, padding: 20, marginBottom: 8 }}>
        <DegradationChart data={curve} />
        <div style={{ display: "flex", gap: 18, fontFamily: dMono, fontSize: 10.5, color: DC.mute, marginTop: 6, flexWrap: "wrap" }}>
          <span><span style={{ color: DC.red, fontWeight: 700 }}>■</span> Without — hits replace threshold ~every 3 days</span>
          <span><span style={{ color: DC.teal, fontWeight: 700 }}>■</span> With Dr. Fry — reaches it ~day {site.drfryEndDay}</span>
        </div>
      </div>

      <DemoSectionLabel>TPM log</DemoSectionLabel>
      <div style={{ background: DC.panel, border: `1px solid ${DC.line}`, padding: 20 }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: dMono, fontSize: 11.5 }}>
          <thead><tr style={{ borderBottom: `1px solid ${DC.line}`, textAlign: "left", color: DC.mute }}>
            <th style={{ padding: "6px 8px" }}>Date</th><th style={{ padding: "6px 8px" }}>TPM %</th><th style={{ padding: "6px 8px" }}>Power off?</th></tr></thead>
          <tbody>
            {site.tpmLog.map((r, i) => (
              <tr key={i} style={{ borderBottom: `1px solid ${DC.line}` }}>
                <td style={{ padding: "6px 8px", color: DC.graphite }}>{r.date}</td>
                <td style={{ padding: "6px 8px", color: r.tpm >= 25 ? DC.red : DC.graphite }}>{r.tpm}%</td>
                <td style={{ padding: "6px 8px", color: r.powerOff ? DC.ok : DC.red }}>{r.powerOff ? "YES" : "NO — unreliable"}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 12, alignItems: "center" }}>
          <input type="date" value={tpmDate} onChange={(e) => setTpmDate(e.target.value)} style={{ ...inp, width: 150 }} />
          <input type="number" placeholder="TPM %" value={tpmVal} onChange={(e) => setTpmVal(e.target.value)} style={{ ...inp, width: 90 }} />
          <div onClick={() => setTpmOff(!tpmOff)} style={{ fontFamily: dMono, fontSize: 10.5, padding: "8px 10px", border: `1px solid ${DC.line}`, cursor: "pointer", color: tpmOff ? DC.ok : DC.red }}>Power off: {tpmOff ? "YES" : "NO"}</div>
          <button onClick={addTpm} style={{ fontFamily: dMono, fontSize: 11, fontWeight: 700, padding: "8px 14px", background: DC.red, color: "#fff", border: "none", cursor: "pointer" }}>+ Add</button>
        </div>
        <div style={{ fontFamily: dMono, fontSize: 10, color: DC.mute, marginTop: 10, fontStyle: "italic" }}>
          Switch the Dr. Fry unit OFF before taking a TPM reading — the 50 kHz field skews the meter.
        </div>
      </div>

      <div style={{ fontFamily: dMono, fontSize: 10, color: DC.mute, textAlign: "center", marginTop: 22 }}>
        Dr. Fry ProWave™ · drfry.nl — your results, this site only.
      </div>
    </div>
  );
}

/* ══════════════════ OWNER PAGE (all operators in one overview) ══════════════════ */
function DemoOwnerPage({ sites }) {
  const [expanded, setExpanded] = useStateD(null);
  const rows = sites.map((s) => ({ ...s, ...demoSiteMetrics(s) }));

  const agg = useMemoD(() => {
    const pcts = rows.map((r) => r.pct).filter((n) => !isNaN(n)).sort((a, b) => a - b);
    let min = 0, max = 0, median = 0;
    if (pcts.length) {
      min = pcts[0]; max = pcts[pcts.length - 1];
      const mid = Math.floor(pcts.length / 2);
      median = pcts.length % 2 === 0 ? (pcts[mid - 1] + pcts[mid]) / 2 : pcts[mid];
    }
    const hot = rows.filter((r) => r.fpLikelihood >= 4).length;
    const totalMonth = rows.reduce((a, r) => a + r.eurMonth, 0);
    const byCity = {}; rows.forEach((r) => { byCity[r.city] = (byCity[r.city] || 0) + 1; });
    return { n: rows.length, min, max, median: round1D(median), hot, totalMonth, byCity };
  }, [rows]);

  const chartData = rows.map((r) => ({ name: r.restaurant.split(" ")[0], pct: r.pct, hot: r.fpLikelihood >= 4 }));

  const exportJson = () => {
    const blob = new Blob([JSON.stringify(rows, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob); const a = document.createElement("a");
    a.href = url; a.download = "drfry_demo_portfolio.json"; a.click(); URL.revokeObjectURL(url);
  };

  const th = { padding: "8px 10px", fontWeight: 600 }; const td = { padding: "8px 10px", color: DC.mute };
  const ALL = [
    ["SKU (fixed)", "sku"], ["Fryer", "fryerType"], ["Oil before (kg/mo)", "kgBeforeMo"], ["Oil after (kg/mo)", "kgAfterMo"],
    ["€/kg", "pricePerKg"], ["Repl. before", "replBefore"], ["Repl. during", "replDuring"], ["Baseline AV", "avBaseline"],
    ["Day-3 AV", "avDay3"], ["Absorption", "absorption"], ["Taste panel", "taste"], ["Frying time", "fryingTime"],
    ["Burns/cleaning", "burnsCleaning"], ["Concerns", "concerns"], ["Referral", "referral"], ["Contact", "contact"], ["Submitted", "submittedAt"],
  ];

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontFamily: dMono, fontSize: 10.5, letterSpacing: 2, textTransform: "uppercase", color: DC.red, marginBottom: 6 }}>Dr. Fry ProWave™ · drfry.nl · Internal — Owner</div>
        <h1 style={{ fontFamily: dSerif, fontSize: 34, color: DC.graphite, margin: 0 }}>Demo Portfolio — All Sites</h1>
        <p style={{ fontFamily: dSans, fontSize: 13, color: DC.mute, maxWidth: 680, marginTop: 8 }}>
          Every operator's filled-in results in one place. Auto range + median for credible external use, hot-lead view, and a JSON export to hand an LLM.
        </p>
      </div>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 16 }}>
        <DemoMetric k="Pilot sites" v={agg.n} accent={DC.red} />
        <DemoMetric k="Median oil savings" v={agg.median + "%"} accent={DC.amber} note={`range ${agg.min}–${agg.max}%`} />
        <DemoMetric k="Hot leads (FP ≥ 4)" v={agg.hot} accent={DC.ok} note={`of ${agg.n} sites`} />
        <DemoMetric k="Fleet saving / month" v={eurD(agg.totalMonth)} accent={DC.teal} note="sum across sites" />
      </div>

      <div style={{ background: DC.graphite, padding: "16px 18px", borderLeft: `3px solid ${DC.amber}`, marginBottom: 16 }}>
        <div style={{ fontFamily: dMono, fontSize: 9, letterSpacing: 1.5, textTransform: "uppercase", color: DC.amber, marginBottom: 8 }}>Credible result statement (auto)</div>
        <p style={{ fontFamily: dSans, fontSize: 13.5, color: "#E8E9EA", lineHeight: 1.6, margin: 0 }}>
          Across {agg.n} pilot kitchens, oil savings ranged from {agg.min}% to {agg.max}%, with a median reduction of {agg.median}%.
        </p>
      </div>

      <DemoSectionLabel>Oil savings by site</DemoSectionLabel>
      <div style={{ background: DC.panel, border: `1px solid ${DC.line}`, padding: 20, marginBottom: 16 }}>
        <SavingsBarChart data={chartData} median={agg.median} />
        <div style={{ fontFamily: dMono, fontSize: 10, color: DC.mute, marginTop: 6 }}><span style={{ color: DC.teal, fontWeight: 700 }}>■</span> hot lead (FP ≥ 4) &nbsp; <span style={{ color: DC.mute, fontWeight: 700 }}>■</span> other</div>
      </div>

      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 16 }}>
        <div style={{ flex: "1 1 300px", background: DC.panel, border: `1px solid ${DC.line}`, padding: "14px 16px" }}>
          <div style={{ fontFamily: dMono, fontSize: 10.5, letterSpacing: 0.6, textTransform: "uppercase", color: DC.mute, marginBottom: 10 }}>By city</div>
          {Object.entries(agg.byCity).map(([c, n]) => (
            <div key={c} style={{ display: "flex", justifyContent: "space-between", fontFamily: dMono, fontSize: 12, color: DC.graphite, padding: "3px 0" }}><span>{c}</span><span style={{ color: DC.red, fontWeight: 700 }}>{n}</span></div>
          ))}
        </div>
        <div style={{ flex: "1 1 300px", background: DC.panel, border: `1px solid ${DC.line}`, padding: "14px 16px", display: "flex", flexDirection: "column", gap: 8, justifyContent: "center" }}>
          <div style={{ fontFamily: dMono, fontSize: 10.5, letterSpacing: 0.6, textTransform: "uppercase", color: DC.mute }}>Hand off to an LLM</div>
          <button onClick={exportJson} style={{ fontFamily: dMono, fontSize: 11.5, fontWeight: 700, padding: "9px 14px", background: DC.red, color: "#fff", border: "none", cursor: "pointer" }}>⬇ Export portfolio as JSON</button>
        </div>
      </div>

      <DemoSectionLabel>All sites ({agg.n})</DemoSectionLabel>
      <div style={{ background: DC.panel, border: `1px solid ${DC.line}`, overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: dMono, fontSize: 11.5 }}>
          <thead><tr style={{ borderBottom: `1px solid ${DC.line}`, textAlign: "left", color: DC.mute }}>
            <th style={th}>Restaurant</th><th style={th}>City</th><th style={th}>Oil saved</th><th style={th}>€/mo</th><th style={th}>FP</th><th style={th}></th></tr></thead>
          <tbody>
            {rows.map((r) => (
              <React.Fragment key={r.id}>
                <tr style={{ borderBottom: `1px solid ${DC.line}`, cursor: "pointer" }} onClick={() => setExpanded(expanded === r.id ? null : r.id)}>
                  <td style={{ ...td, color: DC.graphite, fontWeight: 600 }}>{r.restaurant}</td>
                  <td style={td}>{r.city}</td>
                  <td style={{ ...td, color: DC.amber, fontWeight: 700 }}>{r.pct}%</td>
                  <td style={{ ...td, color: DC.graphite }}>{eurD(r.eurMonth)}</td>
                  <td style={{ ...td, color: r.fpLikelihood >= 4 ? DC.ok : DC.graphite, fontWeight: 700 }}>{r.fpLikelihood}</td>
                  <td style={{ ...td, color: DC.mute }}>{expanded === r.id ? "▲" : "▼"}</td>
                </tr>
                {expanded === r.id && (
                  <tr style={{ borderBottom: `1px solid ${DC.line}`, background: DC.porcelain }}>
                    <td colSpan={6} style={{ padding: "12px 14px" }}>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "6px 24px" }}>
                        {ALL.map(([label, key]) => r[key] !== "" && r[key] != null && (
                          <div key={key} style={{ fontFamily: dMono, fontSize: 11, color: DC.graphite }}><span style={{ color: DC.mute }}>{label}:</span> {String(r[key])}</div>
                        ))}
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ fontFamily: dMono, fontSize: 10, color: DC.mute, textAlign: "center", marginTop: 22 }}>
        Dr. Fry ProWave™ · drfry.nl — internal owner view · prototype on mock data. Wire to your DB to persist and sync.
      </div>
    </div>
  );
}

function demoPageBtn(active) {
  return { fontFamily: dMono, fontSize: 12, fontWeight: 700, padding: "10px 16px", cursor: "pointer", border: `1px solid ${active ? DC.graphite : DC.line}`, background: active ? DC.graphite : "#fff", color: active ? "#fff" : DC.graphite, letterSpacing: 0.4 };
}

Object.assign(window, { DemoClientPage, DemoOwnerPage, DEMO_MOCK });
