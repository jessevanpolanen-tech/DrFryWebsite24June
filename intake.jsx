// ══════════════════════════════════════════════════════════════════
// Demo INTAKE module — operators fill in a completed-demo form; records
// persist to localStorage and roll up into an overview table + auto
// range/median statement + JSON / readable export.
// Namespaced (IC / *I / intake*) to avoid colliding with dashboard.jsx
// and demos.jsx. Exports <DemoIntake/> to window at the end.
// ══════════════════════════════════════════════════════════════════
const { useState: useStateI, useMemo: useMemoI, useEffect: useEffectI } = React;

// ── Brand tokens ──
const IC = {
  porcelain: "#FAFAFA", graphite: "#111315", red: "#C0392B", amber: "#F2A23A",
  line: "#E4E4E4", mute: "#6B6F73", panel: "#FFFFFF", ok: "#2E7D52",
};
const iSerif = "'DM Serif Display', Georgia, serif";
const iSans = "'Inter', -apple-system, system-ui, sans-serif";
const iMono = "'IBM Plex Mono', 'SF Mono', Menlo, monospace";

const round1I = (n) => Math.round(n * 10) / 10;

/* ════════════════════════════════════════════════════════════════
   DATA LAYER — swap for a backend when ready. Keep the shape:
   loadIntake() -> array, saveIntake(arr) -> void.
   ════════════════════════════════════════════════════════════════ */
const INTAKE_STORE_KEY = "drfry_demo_submissions_v1";
function loadIntake() {
  try { const raw = window.localStorage.getItem(INTAKE_STORE_KEY); return raw ? JSON.parse(raw) : []; }
  catch { return []; }
}
function saveIntake(arr) {
  try { window.localStorage.setItem(INTAKE_STORE_KEY, JSON.stringify(arr)); } catch {}
  try { window.dispatchEvent(new CustomEvent("drfry-intake-changed")); } catch {}
}
/* ════════════════════════════════════════════════════════════════ */

// Field schema — single source of truth for the form, the table, and the JSON.
const INTAKE_SECTIONS = [
  {
    id: "01", title: "Test overview",
    fields: [
      { k: "restaurant", label: "Restaurant name", type: "text" },
      { k: "city", label: "City", type: "select", options: ["Amsterdam", "London", "Paris", "Düsseldorf", "Other"] },
      { k: "fryerType", label: "Fryer type & capacity (L)", type: "text" },
      { k: "foodSku", label: "Fixed food SKU (test control)", type: "text" },
      { k: "testStart", label: "Test start date", type: "date" },
      { k: "testEnd", label: "Test end date", type: "date" },
      { k: "detectorReading", label: "Detector reading at install (200+ = OK)", type: "number" },
    ],
  },
  {
    id: "02", title: "Oxidation & TPM",
    fields: [
      { k: "avBaseline", label: "Baseline AV (Phase 0)", type: "number" },
      { k: "avDay3", label: "Day-3 AV with Dr. Fry", type: "number" },
      { k: "tpmBeforeDuring", label: "TPM % — before vs. during (power OFF to read)", type: "text" },
    ],
  },
  {
    id: "03", title: "Oil use (kg-based benchmark)",
    fields: [
      { k: "kgBefore", label: "Oil per kg fried — BEFORE (kg)", type: "number" },
      { k: "kgAfter", label: "Oil per kg fried — WITH Dr. Fry (kg)", type: "number" },
      { k: "replacementFreq", label: "Replacement frequency — before vs. during", type: "text" },
      { k: "oilSavingsPct", label: "Oil savings %", type: "number", hint: "the one clean number — feeds the range+median line" },
    ],
  },
  {
    id: "04", title: "Absorption, taste & operations",
    fields: [
      { k: "oilAbsorption", label: "Oil absorption diff (weighed, target 25–40% less)", type: "text" },
      { k: "tastePanel", label: "Blind taste / appearance result", type: "text" },
      { k: "installDisruptive", label: "Install/removal disruptive?", type: "select", options: ["No", "Yes"] },
      { k: "fryingTimeChange", label: "Frying time change", type: "select", options: ["Same", "Faster", "Slower"] },
      { k: "burnsCleaning", label: "Change in burns/injuries or cleaning?", type: "text" },
      { k: "staffFeedback", label: "Staff feedback", type: "text", wide: true },
    ],
  },
  {
    id: "05", title: "CEO read-out & decision",
    fields: [
      { k: "litresSavedMonth", label: "Litres saved / month (e.g. 140→35)", type: "text" },
      { k: "paybackMonths", label: "Est. payback (months)", type: "number" },
      { k: "fpLikelihood", label: "Founding Partner likelihood (1–5)", type: "number", hint: "5 = very likely" },
      { k: "yesTodayConditions", label: "What would make it a yes today?", type: "text", wide: true },
      { k: "concerns", label: "Concerns (price/install/support/cert/other)", type: "text", wide: true },
      { k: "referral", label: "Referral — another operator (optional)", type: "text", wide: true },
    ],
  },
];

const INTAKE_FIELDS = INTAKE_SECTIONS.flatMap((s) => s.fields);
const emptyIntake = () => Object.fromEntries(INTAKE_FIELDS.map((f) => [f.k, ""]));

function IMetric({ k, v, accent, note }) {
  return (
    <div style={{ flex: "1 1 0", minWidth: 130, padding: "14px 16px", background: IC.panel, border: `1px solid ${IC.line}` }}>
      <div style={{ fontFamily: iMono, fontSize: 10.5, letterSpacing: 0.6, textTransform: "uppercase", color: IC.mute, marginBottom: 8 }}>{k}</div>
      <div style={{ fontFamily: iSerif, fontSize: 30, lineHeight: 1, color: accent || IC.graphite }}>{v}</div>
      {note && <div style={{ fontFamily: iMono, fontSize: 10, color: IC.mute, marginTop: 8 }}>{note}</div>}
    </div>
  );
}

function ISectionLabel({ children }) {
  return (
    <div style={{ fontFamily: iMono, fontSize: 10.5, letterSpacing: 1, textTransform: "uppercase", color: IC.amber, margin: "22px 0 14px", borderBottom: `1px solid ${IC.line}`, paddingBottom: 8 }}>
      {children}
    </div>
  );
}

function IField({ f, value, onChange }) {
  const base = { width: "100%", boxSizing: "border-box", fontFamily: iMono, fontSize: 12, color: IC.graphite, border: `1px solid ${IC.line}`, padding: "7px 8px", background: IC.porcelain };
  return (
    <div style={{ marginBottom: 12, flex: f.wide ? "1 1 100%" : "1 1 220px", minWidth: 200 }}>
      <label style={{ display: "block", fontFamily: iSans, fontSize: 11.5, fontWeight: 600, color: IC.graphite, marginBottom: 4 }}>{f.label}</label>
      {f.type === "select" ? (
        <select value={value} onChange={(e) => onChange(f.k, e.target.value)} style={base}>
          <option value=""></option>
          {f.options.map((o) => <option key={o} value={o}>{o}</option>)}
        </select>
      ) : (
        <input type={f.type === "number" ? "number" : f.type === "date" ? "date" : "text"}
          value={value} onChange={(e) => onChange(f.k, e.target.value)} style={base} />
      )}
      {f.hint && <div style={{ fontFamily: iMono, fontSize: 9.5, color: IC.mute, marginTop: 3 }}>{f.hint}</div>}
    </div>
  );
}

const ith = { padding: "8px 10px", fontWeight: 600 };
const itd = { padding: "8px 10px", color: IC.mute };
function iTabBtn(active) {
  return { fontFamily: iMono, fontSize: 11.5, fontWeight: 700, padding: "8px 14px", cursor: "pointer", border: `1px solid ${active ? IC.red : IC.line}`, background: active ? IC.red : "#fff", color: active ? "#fff" : IC.graphite };
}
function iActionBtn(bg) {
  return { fontFamily: iMono, fontSize: 11.5, fontWeight: 700, padding: "9px 14px", cursor: "pointer", border: "none", background: bg, color: "#fff", width: "100%" };
}

function DemoIntake() {
  const [subs, setSubs] = useStateI([]);
  const [form, setForm] = useStateI(emptyIntake());
  const [view, setView] = useStateI("overview"); // overview | intake
  const [expanded, setExpanded] = useStateI(null);

  useEffectI(() => { setSubs(loadIntake()); }, []);

  const persist = (next) => { setSubs(next); saveIntake(next); };
  const setField = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const submit = () => {
    if (!form.restaurant && !form.city) return;
    const record = {
      id: (window.crypto?.randomUUID?.() || String(Date.now())),
      submittedAt: new Date().toISOString(),
      ...form,
    };
    persist([record, ...subs]);
    setForm(emptyIntake());
    setView("overview");
  };

  const removeSub = (id) => persist(subs.filter((s) => s.id !== id));

  const agg = useMemoI(() => {
    const nums = (key) => subs.map((s) => parseFloat(s[key])).filter((n) => !isNaN(n));
    const savings = nums("oilSavingsPct").sort((a, b) => a - b);
    let median = 0, min = 0, max = 0;
    if (savings.length) {
      min = savings[0]; max = savings[savings.length - 1];
      const mid = Math.floor(savings.length / 2);
      median = savings.length % 2 === 0 ? (savings[mid - 1] + savings[mid]) / 2 : savings[mid];
    }
    const fp = nums("fpLikelihood");
    const avgFp = fp.length ? round1I(fp.reduce((a, b) => a + b, 0) / fp.length) : 0;
    const hot = subs.filter((s) => parseFloat(s.fpLikelihood) >= 4).length;
    const byCity = {};
    subs.forEach((s) => { const c = s.city || "—"; byCity[c] = (byCity[c] || 0) + 1; });
    return { n: subs.length, savingsN: savings.length, min, max, median: round1I(median), avgFp, hot, byCity };
  }, [subs]);

  const exportJson = () => {
    const blob = new Blob([JSON.stringify(subs, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "drfry_demo_submissions.json"; a.click();
    URL.revokeObjectURL(url);
  };

  const copyForLLM = () => {
    const text = subs.map((s, i) =>
      `#${i + 1} ${s.restaurant || "—"} (${s.city || "—"}) · ${(s.submittedAt || "").slice(0, 10)}\n` +
      INTAKE_FIELDS.filter((f) => s[f.k] !== "" && s[f.k] != null)
        .map((f) => `  ${f.label}: ${s[f.k]}`).join("\n")
    ).join("\n\n");
    navigator.clipboard?.writeText(text);
  };

  return (
    <div style={{ maxWidth: 1080 }}>
      {/* Header */}
      <div style={{ marginBottom: 20, display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 12 }}>
        <div>
          <div style={{ fontFamily: iMono, fontSize: 10.5, letterSpacing: 2, textTransform: "uppercase", color: IC.red, marginBottom: 6 }}>
            Dr. Fry ProWave™ · drfry.nl · Internal CRM
          </div>
          <h1 style={{ fontFamily: iSerif, fontSize: 34, color: IC.graphite, margin: 0 }}>
            Demo Results — All In One Place
          </h1>
          <p style={{ fontFamily: iSans, fontSize: 13, color: IC.mute, maxWidth: 680, marginTop: 8 }}>
            Every completed demo becomes a structured record. One overview across all sites, an auto range+median
            statement, and a clean JSON export to hand an LLM. Wire the data layer to a database when you're ready.
          </p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => setView("overview")} style={iTabBtn(view === "overview")}>Overview</button>
          <button onClick={() => setView("intake")} style={iTabBtn(view === "intake")}>+ New demo</button>
        </div>
      </div>

      {view === "overview" && (
        <React.Fragment>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 16 }}>
            <IMetric k="Demos logged" v={agg.n} accent={IC.red} />
            <IMetric k="Hot leads (FP ≥ 4)" v={agg.hot} accent={IC.ok} note={`Avg likelihood ${agg.avgFp || "–"}/5`} />
            <IMetric k="Median oil savings" v={agg.savingsN ? agg.median + "%" : "–"} accent={IC.amber} note={agg.savingsN ? `across ${agg.savingsN} sites` : "add oil savings %"} />
            <IMetric k="Range" v={agg.savingsN ? `${agg.min}–${agg.max}%` : "–"} note="min – max" />
          </div>

          {/* Auto EU result statement */}
          <div style={{ background: IC.graphite, padding: "16px 18px", borderLeft: `3px solid ${IC.amber}`, marginBottom: 16 }}>
            <div style={{ fontFamily: iMono, fontSize: 9, letterSpacing: 1.5, textTransform: "uppercase", color: IC.amber, marginBottom: 8 }}>
              Credible result statement (auto)
            </div>
            <p style={{ fontFamily: iSans, fontSize: 13.5, color: "#E8E9EA", lineHeight: 1.6, margin: 0 }}>
              {agg.savingsN >= 1
                ? `Across ${agg.savingsN} pilot kitchen${agg.savingsN > 1 ? "s" : ""}, oil savings ranged from ${agg.min}% to ${agg.max}%, with a median reduction of ${agg.median}%.`
                : "Log at least one demo with an oil savings % to generate the range + median statement."}
            </p>
          </div>

          {/* City spread + exports */}
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 16, alignItems: "stretch" }}>
            <div style={{ flex: "1 1 300px", background: IC.panel, border: `1px solid ${IC.line}`, padding: "14px 16px" }}>
              <div style={{ fontFamily: iMono, fontSize: 10.5, letterSpacing: 0.6, textTransform: "uppercase", color: IC.mute, marginBottom: 10 }}>By city</div>
              {Object.keys(agg.byCity).length === 0
                ? <div style={{ fontFamily: iMono, fontSize: 11, color: IC.mute }}>No demos yet.</div>
                : Object.entries(agg.byCity).map(([c, n]) => (
                  <div key={c} style={{ display: "flex", justifyContent: "space-between", fontFamily: iMono, fontSize: 12, color: IC.graphite, padding: "3px 0" }}>
                    <span>{c}</span><span style={{ color: IC.red, fontWeight: 700 }}>{n}</span>
                  </div>
                ))}
            </div>
            <div style={{ flex: "1 1 300px", background: IC.panel, border: `1px solid ${IC.line}`, padding: "14px 16px", display: "flex", flexDirection: "column", gap: 8, justifyContent: "center" }}>
              <div style={{ fontFamily: iMono, fontSize: 10.5, letterSpacing: 0.6, textTransform: "uppercase", color: IC.mute, marginBottom: 2 }}>Hand off to an LLM</div>
              <button onClick={exportJson} style={iActionBtn(IC.red)}>⬇ Export all as JSON</button>
              <button onClick={copyForLLM} style={iActionBtn(IC.graphite)}>⧉ Copy readable summary</button>
            </div>
          </div>

          {/* Records table */}
          <ISectionLabel>All demos ({agg.n})</ISectionLabel>
          <div style={{ background: IC.panel, border: `1px solid ${IC.line}`, overflowX: "auto" }}>
            {subs.length === 0 ? (
              <div style={{ padding: 24, fontFamily: iMono, fontSize: 12, color: IC.mute, textAlign: "center" }}>
                No demos logged yet. Hit “+ New demo” after each site wraps its 24-day protocol.
              </div>
            ) : (
              <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: iMono, fontSize: 11.5 }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${IC.line}`, textAlign: "left", color: IC.mute }}>
                    <th style={ith}>Date</th><th style={ith}>Restaurant</th><th style={ith}>City</th>
                    <th style={ith}>Oil sav.</th><th style={ith}>FP</th><th style={ith}></th>
                  </tr>
                </thead>
                <tbody>
                  {subs.map((s) => (
                    <React.Fragment key={s.id}>
                      <tr style={{ borderBottom: `1px solid ${IC.line}`, cursor: "pointer" }} onClick={() => setExpanded(expanded === s.id ? null : s.id)}>
                        <td style={itd}>{(s.submittedAt || "").slice(0, 10)}</td>
                        <td style={{ ...itd, color: IC.graphite, fontWeight: 600 }}>{s.restaurant || "—"}</td>
                        <td style={itd}>{s.city || "—"}</td>
                        <td style={{ ...itd, color: IC.amber, fontWeight: 700 }}>{s.oilSavingsPct ? s.oilSavingsPct + "%" : "—"}</td>
                        <td style={{ ...itd, color: parseFloat(s.fpLikelihood) >= 4 ? IC.ok : IC.graphite, fontWeight: 700 }}>{s.fpLikelihood || "—"}</td>
                        <td style={{ ...itd, color: IC.mute }}>{expanded === s.id ? "▲" : "▼"}</td>
                      </tr>
                      {expanded === s.id && (
                        <tr style={{ borderBottom: `1px solid ${IC.line}`, background: IC.porcelain }}>
                          <td colSpan={6} style={{ padding: "12px 14px" }}>
                            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px 24px" }}>
                              {INTAKE_FIELDS.filter((f) => s[f.k] !== "" && s[f.k] != null).map((f) => (
                                <div key={f.k} style={{ fontFamily: iMono, fontSize: 11, color: IC.graphite, flex: "0 1 auto" }}>
                                  <span style={{ color: IC.mute }}>{f.label}:</span> {String(s[f.k])}
                                </div>
                              ))}
                            </div>
                            <button onClick={(e) => { e.stopPropagation(); removeSub(s.id); }} style={{ ...iActionBtn(IC.red), marginTop: 12, width: "auto", padding: "5px 12px", fontSize: 10.5 }}>Delete record</button>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </React.Fragment>
      )}

      {view === "intake" && (
        <div style={{ background: IC.panel, border: `1px solid ${IC.line}`, padding: "10px 22px 22px" }}>
          {INTAKE_SECTIONS.map((sec) => (
            <div key={sec.id}>
              <ISectionLabel>{sec.id} · {sec.title}</ISectionLabel>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0 16px" }}>
                {sec.fields.map((f) => (
                  <IField key={f.k} f={f} value={form[f.k]} onChange={setField} />
                ))}
              </div>
            </div>
          ))}
          <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
            <button onClick={submit} style={iActionBtn(IC.red)}>Save demo record</button>
            <button onClick={() => { setForm(emptyIntake()); setView("overview"); }} style={iActionBtn(IC.mute)}>Cancel</button>
          </div>
        </div>
      )}

      <div style={{ fontFamily: iMono, fontSize: 10, color: IC.mute, textAlign: "center", marginTop: 24 }}>
        Dr. Fry ProWave™ · drfry.nl — internal · records persist in this browser until you wire the data layer to a database.
      </div>
    </div>
  );
}

// Map an intake record onto the site shape used by Demo results / portfolio,
// so a logged demo shows up in those views. Missing kg figures are synthesised
// from the oil-savings % so the charts still read correctly.
function intakeToSite(r) {
  const num = (v, d = 0) => { const n = parseFloat(v); return isNaN(n) ? d : n; };
  const pct = num(r.oilSavingsPct);
  let kgB = num(r.kgBefore), kgA = num(r.kgAfter);
  if ((!kgB || !kgA) && pct > 0) { kgB = 100; kgA = round1I(100 * (1 - pct / 100)); }
  return {
    id: r.id, restaurant: r.restaurant || "Untitled site", city: r.city || "\u2014", contact: "\u2014",
    sku: r.foodSku || "\u2014", fryerType: r.fryerType || "\u2014",
    kgBeforeMo: kgB, kgAfterMo: kgA, pricePerKg: 3.8,
    replBefore: r.replacementFreq || "\u2014", replDuring: "",
    avBaseline: num(r.avBaseline), avDay3: num(r.avDay3), oilSavingsPct: pct,
    absorption: r.oilAbsorption || "", taste: r.tastePanel || "", fryingTime: r.fryingTimeChange || "Same",
    burnsCleaning: r.burnsCleaning || "", fpLikelihood: num(r.fpLikelihood),
    concerns: r.concerns || "", referral: r.referral || "",
    drfryEndDay: Math.max(4, Math.min(12, Math.round(pct / 4) || 6)),
    tpmLog: [], submittedAt: (r.submittedAt || "").slice(0, 10), source: "live",
  };
}
window.loadIntakeAsSites = () => loadIntake().map(intakeToSite);

Object.assign(window, { DemoIntake });
