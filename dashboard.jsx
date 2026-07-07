const { useState, useEffect, useMemo } = React;

// Mirror of the round economics from the investor page
const ROUND = {
  totalSeats: 200,
  ticket: 5000,
  maxSeatsPerInvestor: 4,
  batchUnits: 600,
  exWorksPerUnit: 1167,
  deployedValuePerUnit: 4200,
  baseCommittedSeats: 0,
  closeDate: '31 AUG 2026',
};
const POOL_TOTAL = ROUND.totalSeats * ROUND.ticket;
const STORE_KEY = 'drfry_round_commitments_v1';
const eur = (n) => '€' + Math.round(n).toLocaleString('en-US');
const eurShort = (n) => n >= 1000000 ? '€' + (n/1000000).toFixed(2) + 'M' : n >= 1000 ? '€' + Math.round(n/1000) + 'k' : '€' + n;

// Commitments come only from real reservations submitted on the public page (localStorage).
// No seeded / sample investors — the dashboard reflects the live book exactly.
const SEED = [];

// Cold outreach leads live in their own store — they never come through the public
// reservation form, so the operator adds them by hand. Shape mirrors a commitment
// but with zero seats and kind:'cold', so the seat / amount cells read '—'.
const COLD_KEY = 'drfry_cold_leads_v1';
function readColdLeads() {
  try { return JSON.parse(localStorage.getItem(COLD_KEY) || '[]'); } catch { return []; }
}
function addColdLead(lead) {
  const all = readColdLeads();
  all.push(lead);
  localStorage.setItem(COLD_KEY, JSON.stringify(all));
  window.dispatchEvent(new Event('drfry-leads-changed'));
}

// Sent-history store — records when you last emailed each investor, so "Resend" is meaningful.
const SENT_KEY = 'drfry_sent_v1';
const keyFor = (c) => `${c.email}|${c.ts}`;
function readSent() {
  try { return JSON.parse(localStorage.getItem(SENT_KEY) || '{}'); } catch { return {}; }
}
function recordSent(c, mail) {
  const all = readSent();
  const k = keyFor(c);
  const prev = all[k] || { count: 0, history: [] };
  const entry = {
    at: Date.now(),
    subject: (mail && mail.subject) || '',
    body: (mail && mail.body) || '',
    template: (mail && mail.template) || '',
  };
  all[k] = {
    at: entry.at,
    count: (prev.count || 0) + 1,
    history: [ ...(prev.history || []), entry ],
  };
  try { localStorage.setItem(SENT_KEY, JSON.stringify(all)); } catch {}
  return all;
}
const fmtWhen = (ts) => new Date(ts).toLocaleString('en-GB', { day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' });

// Log of every email actually sent to this contact — subject, body & template,
// kept in localStorage so the record survives reloads. Each row expands to the
// exact message that went out.
function SentLog({ history }) {
  const [open, setOpen] = useState(null);
  if (!history || !history.length) return null;
  return (
    <div style={{ marginBottom:20, paddingBottom:20, borderBottom:'1px solid var(--warm-200)' }}>
      <div className="mono" style={{ fontSize:9, letterSpacing:'0.14em', textTransform:'uppercase', color:'var(--warm-500)', marginBottom:10 }}>
        Sent history · {history.length} email{history.length>1?'s':''}
      </div>
      <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
        {history.map((_, i) => {
          const idx = history.length - 1 - i;
          const h = history[idx];
          const isOpen = open === idx;
          return (
            <div key={idx} style={{ border:'1px solid var(--warm-200)', background:'var(--porcelain)' }}>
              <button onClick={() => setOpen(isOpen ? null : idx)} style={{
                width:'100%', textAlign:'left', display:'flex', alignItems:'center', gap:10,
                padding:'10px 12px', background:'transparent', border:'none', cursor:'pointer',
              }}>
                <span style={{ width:6, height:6, borderRadius:'50%', background:'var(--teal)', flexShrink:0 }}/>
                <span style={{ fontSize:13, fontWeight:500, flex:1, minWidth:0, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{h.subject || '(no subject)'}</span>
                {h.template && <span className="pill pill-grey" style={{ flexShrink:0 }}>{h.template}</span>}
                <span className="mono" style={{ fontSize:11, color:'var(--warm-500)', flexShrink:0 }}>{fmtWhen(h.at)}</span>
                <span className="mono" style={{ fontSize:11, color:'var(--warm-500)', flexShrink:0, width:12, textAlign:'center' }}>{isOpen ? '▾' : '▸'}</span>
              </button>
              {isOpen && (
                <div style={{ padding:'2px 14px 14px 28px', borderTop:'1px solid var(--warm-200)' }}>
                  <div className="mono" style={{ fontSize:12, whiteSpace:'pre-wrap', lineHeight:1.6, color:'var(--slate-800)' }}>{h.body}</div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// Resend integration
// ─────────────────────────────────────────────────────────────────
// The browser can't safely hold a Resend API key (it's a secret) and
// Resend's send endpoint doesn't allow direct browser calls. So the
// recommended mode is "proxy": a tiny serverless function you host holds
// the key and forwards to Resend. "direct" mode is for quick prototype
// testing only. "mailto" is the original behaviour (opens your mail app).
const CFG_KEY = 'drfry_resend_cfg_v1';
const CFG_DEFAULTS = { mode: 'mailto', fromName: 'Dr. Fry', fromEmail: 'jesse@contact.drfry.nl', replyTo: 'jesse@drfry.nl', backendUrl: '', endpoint: '', apiKey: '' };
function readCfg() {
  try { return { ...CFG_DEFAULTS, ...JSON.parse(localStorage.getItem(CFG_KEY) || '{}') }; }
  catch { return { ...CFG_DEFAULTS }; }
}
const cfgSubs = new Set();
function writeCfg(patch) {
  const next = { ...readCfg(), ...patch };
  try { localStorage.setItem(CFG_KEY, JSON.stringify(next)); } catch {}
  cfgSubs.forEach((fn) => fn(next));
  return next;
}
function useCfg() {
  const [cfg, setCfg] = useState(readCfg);
  useEffect(() => { const fn = (c) => setCfg({ ...c }); cfgSubs.add(fn); return () => cfgSubs.delete(fn); }, []);
  return cfg;
}
const cfgConnected = (cfg) => (cfg.mode === 'proxy' && !!cfg.endpoint && !!cfg.fromEmail) || (cfg.mode === 'direct' && !!cfg.apiKey && !!cfg.fromEmail);

// Shared "open the settings modal" signal so any panel can launch it.
let _settingsOpen = false;
const settingsOpenSubs = new Set();
function setSettingsOpen(v) { _settingsOpen = v; settingsOpenSubs.forEach((fn) => fn(v)); }
function useSettingsOpen() {
  const [o, setO] = useState(_settingsOpen);
  useEffect(() => { settingsOpenSubs.add(setO); return () => settingsOpenSubs.delete(setO); }, []);
  return o;
}

function fromLine(cfg) {
  if (!cfg.fromEmail) return '';
  return cfg.fromName ? `${cfg.fromName} <${cfg.fromEmail}>` : cfg.fromEmail;
}

// Actually deliver the email. Returns the Resend response ({ id }) on success,
// throws with a readable message on failure. Never called for mailto mode.
async function sendEmail(cfg, { to, subject, text }) {
  const from = fromLine(cfg);
  const replyTo = cfg.replyTo || undefined;
  if (cfg.mode === 'proxy') {
    if (!cfg.endpoint) throw new Error('not-configured');
    const res = await fetch(cfg.endpoint, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ to, from, subject, text, replyTo }),
    });
    const txt = await res.text().catch(() => '');
    if (!res.ok) throw new Error(`Proxy responded ${res.status}${txt ? ' · ' + txt.slice(0, 200) : ''}`);
    try { return JSON.parse(txt); } catch { return {}; }
  }
  if (cfg.mode === 'direct') {
    if (!cfg.apiKey) throw new Error('not-configured');
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${cfg.apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from, to: [to], subject, text, reply_to: replyTo }),
    });
    const txt = await res.text().catch(() => '');
    if (!res.ok) throw new Error(`Resend responded ${res.status}${txt ? ' · ' + txt.slice(0, 200) : ''}`);
    try { return JSON.parse(txt); } catch { return {}; }
  }
  throw new Error('not-configured');
}

const PROXY_SNIPPET = `// Vercel / Netlify / Cloudflare edge function — POST { to, from, subject, text, replyTo }
export default async function handler(req) {
  const { to, from, subject, text, replyTo } = await req.json();
  const r = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: "Bearer " + process.env.RESEND_API_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from, to: [to], subject, text, reply_to: replyTo }),
  });
  return new Response(await r.text(), {
    status: r.status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*", // lock to your dashboard origin in prod
    },
  });
}`;

function SettingsModal() {
  const open = useSettingsOpen();
  const saved = useCfg();
  const [draft, setDraft] = useState(saved);
  const [showSnippet, setShowSnippet] = useState(false);
  useEffect(() => { if (open) setDraft(readCfg()); }, [open]);
  if (!open) return null;

  const set = (k) => (e) => setDraft((d) => ({ ...d, [k]: e.target.value }));
  const label = { display:'block', fontFamily:'IBM Plex Mono, monospace', fontSize:9, letterSpacing:'0.14em', textTransform:'uppercase', color:'var(--warm-500)', marginBottom:7 };
  const input = { width:'100%', background:'var(--porcelain)', border:'1px solid var(--warm-200)', padding:'11px 13px', fontSize:14, color:'var(--graphite)', fontFamily:'inherit' };
  const modes = [['mailto','Mail client'],['proxy','Resend · proxy'],['direct','Resend · direct key']];

  function save() { writeCfg(draft); setSettingsOpen(false); }

  return (
    <div onClick={() => setSettingsOpen(false)} style={{ position:'fixed', inset:0, zIndex:100, background:'rgba(17,19,21,0.45)', display:'flex', alignItems:'flex-start', justifyContent:'center', padding:'6vh 20px', overflowY:'auto' }}>
      <div onClick={(e) => e.stopPropagation()} className="card" style={{ width:'100%', maxWidth:600, padding:'30px 32px' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:8 }}>
          <div>
            <div className="mono" style={{ fontSize:10, letterSpacing:'0.14em', color:'var(--warm-500)', marginBottom:6 }}>EMAIL DELIVERY</div>
            <h2 className="serif" style={{ fontSize:26, lineHeight:1 }}>Connect Resend</h2>
          </div>
          <button onClick={() => setSettingsOpen(false)} className="mono" style={{ fontSize:13, color:'var(--warm-500)', background:'transparent', border:'none', padding:4 }}>Close ✕</button>
        </div>
        <p style={{ fontSize:13, lineHeight:1.6, color:'var(--slate-800)', marginBottom:22, maxWidth:520 }}>
          Send outbound mail straight from the dashboard. Because an API key can't live safely in the browser, the recommended mode routes through a small proxy you host that holds the key.
        </p>

        <label style={label}>Delivery mode</label>
        <div className="seg" style={{ marginBottom:22 }}>
          {modes.map(([id, lbl]) => (
            <button key={id} className={draft.mode === id ? 'active' : ''} onClick={() => setDraft((d) => ({ ...d, mode:id }))}>{lbl}</button>
          ))}
        </div>

        {draft.mode !== 'mailto' && (
          <div className="ds-grid-2" style={{ display:'grid', gridTemplateColumns:'1fr 1.2fr', gap:16, marginBottom:18 }}>
            <div>
              <label style={label}>From name</label>
              <input value={draft.fromName} onChange={set('fromName')} placeholder="Dr. Fry" style={input} />
            </div>
            <div>
              <label style={label}>From email · verified domain</label>
              <input value={draft.fromEmail} onChange={set('fromEmail')} placeholder="jesse@contact.drfry.nl" style={input} />
            </div>
          </div>
        )}

        <div style={{ marginBottom:18 }}>
          <label style={label}>Sequencing backend URL · optional</label>
          <input value={draft.backendUrl} onChange={set('backendUrl')} placeholder="https://your-app.vercel.app" style={input} />
          <div className="mono" style={{ fontSize:11, color:'var(--warm-500)', lineHeight:1.5, marginTop:9 }}>
            Deploy the <b style={{ color:'var(--slate-800)' }}>/backend</b> package, paste its URL here, and adding a cold lead auto-enrolls them in the sequence. Leave blank to keep leads local-only.
          </div>
        </div>

        {draft.mode !== 'mailto' && (
          <div style={{ marginBottom:18 }}>
            <label style={label}>Reply-To · your real inbox</label>
            <input value={draft.replyTo} onChange={set('replyTo')} placeholder="jesse@drfry.nl" style={input} />
            <div className="mono" style={{ fontSize:11, color:'var(--warm-500)', lineHeight:1.5, marginTop:9 }}>
              Send from <b style={{ color:'var(--slate-800)' }}>contact.drfry.nl</b> to protect your domain reputation; replies land in <b style={{ color:'var(--slate-800)' }}>{draft.replyTo || 'jesse@drfry.nl'}</b> (your Outlook). Leave blank to reply to the from-address.
            </div>
          </div>
        )}

        {draft.mode === 'proxy' && (
          <div style={{ marginBottom:18 }}>
            <label style={label}>Proxy endpoint URL</label>
            <input value={draft.endpoint} onChange={set('endpoint')} placeholder="https://your-app.vercel.app/api/send" style={input} />
            <button onClick={() => setShowSnippet((s) => !s)} className="mono" style={{ fontSize:11, color:'var(--amber-deep)', background:'transparent', border:'none', padding:'10px 0 0' }}>
              {showSnippet ? '▾ Hide' : '▸ Show'} example proxy function
            </button>
            {showSnippet && (
              <pre className="mono" style={{ fontSize:11, lineHeight:1.5, background:'var(--porcelain-2)', border:'1px solid var(--warm-200)', padding:14, marginTop:10, overflowX:'auto', whiteSpace:'pre' }}>{PROXY_SNIPPET}</pre>
            )}
          </div>
        )}

        {draft.mode === 'direct' && (
          <div style={{ marginBottom:18 }}>
            <label style={label}>Resend API key</label>
            <input value={draft.apiKey} onChange={set('apiKey')} type="password" placeholder="re_xxxxxxxx" autoComplete="off" style={input} />
            <div className="mono" style={{ fontSize:11, color:'var(--red)', lineHeight:1.5, marginTop:9, display:'flex', gap:8 }}>
              <span>⚠</span>
              <span>Prototype only. The key is stored in this browser and exposed to anyone with the dashboard open, and Resend may block the request via CORS. Use proxy mode for anything real.</span>
            </div>
          </div>
        )}

        {draft.mode === 'mailto' && (
          <p className="mono" style={{ fontSize:12, color:'var(--warm-500)', lineHeight:1.6, marginBottom:18 }}>
            Send opens your own email client pre-filled — nothing leaves the dashboard automatically. Switch to a Resend mode to send directly.
          </p>
        )}

        <div style={{ display:'flex', gap:12, alignItems:'center', marginTop:6 }}>
          <button className="ds-btn" onClick={save} style={{ background:'var(--amber)', color:'var(--graphite)', padding:'12px 22px', fontSize:13, fontWeight:600, letterSpacing:'0.04em' }}>SAVE</button>
          <span className="mono" style={{ fontSize:11, color: cfgConnected(draft) || draft.mode==='mailto' ? 'var(--teal)' : 'var(--warm-500)' }}>
            {draft.mode === 'mailto' ? 'Mail-client mode' : cfgConnected(draft) ? '✓ Ready to send via Resend' : 'Fill in the fields above to connect'}
          </span>
        </div>
      </div>
    </div>
  );
}

// ── Lead pipeline status ──────────────────────────────────────────
// Pipeline stages (ordered) + suppression flags (Bounced / Unsubscribed)
// layered on top of any stage. Tints = top of funnel, solids = active/terminal.
const STATUSES = [
  { id:'new',       label:'New',            dot:'#F2A23A', bg:'rgba(242,162,58,0.15)',  fg:'#B45309' },
  { id:'sequenced', label:'Sequenced',      dot:'#6B7280', bg:'rgba(107,114,128,0.16)', fg:'#4B5563' },
  { id:'engaged',   label:'Clicked',        dot:'#0B1F3B', bg:'rgba(11,31,59,0.10)',    fg:'#0B1F3B' },
  { id:'replied',   label:'Replied',        solid:'#0B1F3B', fg:'#fff' },
  { id:'demo',      label:'Demo Scheduled', solid:'#F2A23A', fg:'#111315' },
  { id:'offer',     label:'Offer Proposed', solid:'#0f7a65', fg:'#fff' },
  { id:'won',       label:'Won',            solid:'#1BAA8F', fg:'#fff' },
  { id:'lost',      label:'Lost',           solid:'#C0392B', fg:'#fff' },
];
const STATUS_BY_ID = Object.fromEntries(STATUSES.map((s) => [s.id, s]));

const STATUS_KEY = 'drfry_status_v1';
function readStatusMap() {
  try { return JSON.parse(localStorage.getItem(STATUS_KEY) || '{}'); } catch { return {}; }
}
const statusSubs = new Set();
function writeStatus(k, patch) {
  const all = readStatusMap();
  all[k] = { ...(all[k] || {}), ...patch };
  try { localStorage.setItem(STATUS_KEY, JSON.stringify(all)); } catch {}
  statusSubs.forEach((fn) => fn(all));
}
function useStatusMap() {
  const [map, setMap] = useState(readStatusMap);
  useEffect(() => {
    const fn = (m) => setMap({ ...m });
    statusSubs.add(fn);
    return () => statusSubs.delete(fn);
  }, []);
  return map;
}
const statusOf = (map, c) => (map[keyFor(c)] && map[keyFor(c)].status) || 'new';
const flagsOf  = (map, c) => (map[keyFor(c)] && map[keyFor(c)].flags) || {};

// Click-through is the qualification trigger — a real human action a scanner rarely fakes.
// Every outbound email carries a live reason to click; a click promotes the lead to Engaged.
const CLICK_ASSETS = [
  { id:'roi',        label:'ROI calculator',          url:'https://drfry.nl/roi-calculator' },
  { id:'familymart', label:'FamilyMart demo & testing (PDF)', url:'https://drfry.nl/familymart-demo-and-testing.pdf' },
  { id:'casestudy',  label:'Seven-Eleven case study',  url:'https://drfry.nl/case-study/seven-eleven' },
];
const CLICK_BY_ID = Object.fromEntries(CLICK_ASSETS.map((a) => [a.id, a]));
const STAGE_INDEX = Object.fromEntries(STATUSES.map((s, i) => [s.id, i]));
const clicksOf   = (map, c) => (map[keyFor(c)] && map[keyFor(c)].clicks) || {};
const clickCount = (map, c) => Object.values(clicksOf(map, c)).filter(Boolean).length;
function toggleClick(map, c, assetId) {
  const cur = clicksOf(map, c);
  const next = { ...cur, [assetId]: !cur[assetId] };
  const patch = { clicks: next };
  // A click is the warm signal — promote to Engaged, but never downgrade a further-along lead.
  if (Object.values(next).some(Boolean) && STAGE_INDEX[statusOf(map, c)] < STAGE_INDEX['engaged']) patch.status = 'engaged';
  writeStatus(keyFor(c), patch);
}

function readCommitments() {
  let stored = [];
  try { stored = JSON.parse(localStorage.getItem(STORE_KEY) || '[]'); } catch {}
  const cold = readColdLeads();
  // Combine seed + stored + cold, mark source
  const seed = SEED.map((s) => ({ ...s, source:'seed' }));
  const real = stored.map((s) => ({ ...s, source:'live' }));
  const coldLeads = cold.map((s) => ({ ...s, source:'cold', kind: s.kind || 'cold', seats: 0 }));
  return [...seed, ...real, ...coldLeads].sort((a,b) => b.ts - a.ts);
}

function timeAgo(ts) {
  const d = Math.floor((Date.now()-ts)/86400000);
  if (d <= 0) return 'today';
  if (d === 1) return '1 day ago';
  if (d < 30) return d + ' days ago';
  return Math.floor(d/30) + ' mo ago';
}

// ─────────────────────────────────────────────────────────────────
function Diamond({ size=9, color='var(--amber)' }) {
  return <svg width={size} height={size} viewBox="0 0 10 10" aria-hidden="true" style={{flexShrink:0}}><rect x="5" y="0" width="7.07" height="7.07" transform="rotate(45 5 0)" fill={color}/></svg>;
}

function Sidebar({ active, setActive }) {
  const items = [
    { id:'overview', label:'Overview' },
    { id:'investors', label:'Investors' },
    { id:'batch', label:'Batch order' },
    { id:'deployment', label:'Deployment' },
    { id:'democlient', label:'Demo results' },
    { id:'demoowner', label:'Demo portfolio' },
    { id:'demointake', label:'Log a demo' },
  ];
  return (
    <aside className="sidebar" style={{ width: 240, borderRight:'1px solid var(--warm-200)', background:'var(--porcelain)', display:'flex', flexDirection:'column', position:'sticky', top:0, height:'100vh' }}>
      <a href="index.html" style={{ display:'flex', alignItems:'center', gap:10, padding:'22px 24px', textDecoration:'none', color:'var(--graphite)', borderBottom:'1px solid var(--warm-200)' }}>
        <svg width="22" height="22" viewBox="0 0 22 22"><circle cx="11" cy="11" r="2" fill="var(--amber)"/><circle cx="11" cy="11" r="6" fill="none" stroke="var(--amber)" strokeWidth="0.8"/><circle cx="11" cy="11" r="10" fill="none" stroke="var(--amber)" strokeWidth="0.6" opacity="0.5"/></svg>
        <span className="serif" style={{ fontSize:18 }}>Dr. Fry</span>
      </a>
      <div className="mono" style={{ fontSize:9, letterSpacing:'0.16em', color:'var(--warm-500)', padding:'20px 24px 12px' }}>FOUNDING ROUND</div>
      <nav style={{ display:'flex', flexDirection:'column', padding:'0 12px', gap:2 }}>
        {items.map((it) => (
          <button key={it.id} onClick={() => setActive(it.id)} style={{
            textAlign:'left', padding:'12px 12px', background: active===it.id ? 'var(--graphite)' : 'transparent',
            color: active===it.id ? 'var(--porcelain)' : 'var(--slate-800)', fontSize:14, fontWeight:500,
            transition:'all .15s ease', display:'flex', alignItems:'center', gap:10,
          }}>
            {active===it.id && <Diamond size={7}/>}
            <span style={{ marginLeft: active===it.id ? 0 : 17 }}>{it.label}</span>
          </button>
        ))}
      </nav>
      <div style={{ marginTop:'auto', padding:24, borderTop:'1px solid var(--warm-200)' }}>
        <a href="Request Assessment.html" className="ds-btn" style={{ display:'block', textAlign:'center', background:'var(--amber)', color:'var(--graphite)', padding:'12px', fontSize:12, fontWeight:600, letterSpacing:'0.05em', textDecoration:'none' }}>VIEW PUBLIC PAGE →</a>
      </div>
    </aside>
  );
}

function StatCard({ label, value, sub, accent, bar }) {
  return (
    <div className="card stat-card" style={{ padding:'24px 26px', display:'flex', flexDirection:'column', gap: 4 }}>
      <div className="mono" style={{ fontSize:10, letterSpacing:'0.13em', color:'var(--warm-500)', textTransform:'uppercase', marginBottom: 10 }}>{label}</div>
      <div className="serif" style={{ fontSize: 44, lineHeight:1, color: accent || 'var(--graphite)' }}>{value}</div>
      {bar != null && (
        <div style={{ height:5, background:'var(--warm-200)', marginTop:14, position:'relative' }}>
          <div style={{ position:'absolute', inset:'0 auto 0 0', width:`${Math.min(100,bar)}%`, background: accent || 'var(--graphite)', transition:'width .6s cubic-bezier(.2,.7,.2,1)' }}/>
        </div>
      )}
      {sub && <div className="mono" style={{ fontSize:11, color:'var(--warm-500)', letterSpacing:'0.05em', marginTop: bar!=null ? 10 : 6 }}>{sub}</div>}
    </div>
  );
}

// ── Subscription timeline chart (cumulative seats over commitments) ──
function SubscriptionChart({ commitments }) {
  const sorted = [...commitments].sort((a,b)=>a.ts-b.ts);
  let cum = ROUND.baseCommittedSeats - sorted.reduce((s,c)=>s+c.seats,0);
  if (cum < 0) cum = 0;
  const pts = sorted.map((c) => { cum += c.seats; return { ts:c.ts, seats: cum }; });
  const W=720, H=200, pad=8;
  const maxY = ROUND.totalSeats;
  const minT = pts.length ? pts[0].ts : Date.now();
  const maxT = Date.now();
  const span = Math.max(1, maxT-minT);
  const x = (t)=> pad + ((t-minT)/span)*(W-2*pad);
  const y = (s)=> H-pad - (s/maxY)*(H-2*pad);
  const line = pts.map((p,i)=>`${i===0?'M':'L'}${x(p.ts).toFixed(1)},${y(p.seats).toFixed(1)}`).join(' ');
  const area = pts.length ? `${line} L${x(pts[pts.length-1].ts).toFixed(1)},${H-pad} L${x(pts[0].ts).toFixed(1)},${H-pad} Z` : '';
  return (
    <div className="card" style={{ padding:'26px 28px' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline', marginBottom: 22 }}>
        <div className="mono" style={{ fontSize:10, letterSpacing:'0.13em', color:'var(--warm-500)' }}>SUBSCRIPTION CURVE · CUMULATIVE SEATS</div>
        <div className="mono" style={{ fontSize:11, color:'var(--amber-deep)' }}>TARGET {ROUND.totalSeats}</div>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width:'100%', height:'auto', display:'block' }} preserveAspectRatio="none">
        {[0.25,0.5,0.75,1].map((g,i)=>(
          <g key={i}>
            <line x1={pad} y1={y(maxY*g)} x2={W-pad} y2={y(maxY*g)} stroke="var(--warm-200)" strokeWidth="1"/>
          </g>
        ))}
        <line x1={pad} y1={y(maxY)} x2={W-pad} y2={y(maxY)} stroke="var(--amber)" strokeWidth="1" strokeDasharray="4 4"/>
        {area && <path d={area} fill="rgba(242,162,58,0.10)"/>}
        {line && <path d={line} fill="none" stroke="var(--graphite)" strokeWidth="2" strokeLinejoin="round"/>}
        {pts.map((p,i)=>(<circle key={i} cx={x(p.ts)} cy={y(p.seats)} r="3" fill="var(--graphite)"/>))}
      </svg>
      <div className="mono" style={{ display:'flex', justifyContent:'space-between', marginTop: 12, fontSize:10, color:'var(--warm-500)' }}>
        <span>ROUND OPEN</span><span>TODAY · 14 JUN 2026</span>
      </div>
    </div>
  );
}

function Overview({ commitments, totals }) {
  const { seats, capital, investors, pct, remaining } = totals;
  const byType = useMemo(()=>{
    const m = {};
    commitments.forEach((c)=>{ m[c.role] = (m[c.role]||0) + c.seats; });
    return Object.entries(m).sort((a,b)=>b[1]-a[1]);
  }, [commitments]);

  return (
    <div style={{ display:'flex', flexDirection:'column', gap: 22 }}>
      <div className="ds-grid-4" style={{ display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap: 16 }}>
        <StatCard label="Seats committed" value={`${seats}/${ROUND.totalSeats}`} bar={pct} accent="var(--amber)" sub={`${remaining} remaining`} />
        <StatCard label="Capital raised" value={eurShort(capital)} bar={(capital/POOL_TOTAL)*100} sub={`of ${eurShort(POOL_TOTAL)} target`} />
        <StatCard label="Founders in" value={investors} sub={`avg ${(seats/Math.max(1,investors)).toFixed(1)} seats each`} />
        <StatCard label="Batch coverage" value={`${Math.min(100,Math.round(pct))}%`} bar={pct} accent="var(--teal)" sub={`funds ${Math.round(ROUND.batchUnits*pct/100)} of ${ROUND.batchUnits} units`} />
      </div>

      <div className="ds-grid-2-main" style={{ display:'grid', gridTemplateColumns:'1.5fr 1fr', gap: 16 }}>
        <SubscriptionChart commitments={commitments} />
        <div className="card" style={{ padding:'26px 28px' }}>
          <div className="mono" style={{ fontSize:10, letterSpacing:'0.13em', color:'var(--warm-500)', marginBottom: 22 }}>SEATS BY INVESTOR TYPE</div>
          <div style={{ display:'flex', flexDirection:'column', gap: 16 }}>
            {byType.map(([type, n], i)=>(
              <div key={i}>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom: 6, fontSize: 13 }}>
                  <span>{type}</span><span className="mono" style={{ color:'var(--warm-500)' }}>{n}</span>
                </div>
                <div style={{ height:6, background:'var(--warm-200)' }}>
                  <div style={{ height:'100%', width:`${(n/seats)*100}%`, background:'var(--graphite)' }}/>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <RecentTable commitments={commitments.slice(0,6)} title="Latest commitments" />
    </div>
  );
}

function RolePill({ role }) {
  return <span className="pill pill-grey">{role}</span>;
}

// ── Add cold outreach lead ────────────────────────────────────────
// Cold leads don't come through the public form, so the operator logs them here.
// Same shape as a reservation but seats:0 / kind:'cold' so they read '—' in the table.
function AddLeadModal({ open, onClose }) {
  const cfg = useCfg();
  const blank = { name:'', email:'', org:'', role:'Cold outreach', phone:'', message:'' };
  const [draft, setDraft] = useState(blank);
  const [err, setErr] = useState('');
  useEffect(() => { if (open) { setDraft(blank); setErr(''); } }, [open]);
  if (!open) return null;

  const set = (k) => (e) => setDraft((d) => ({ ...d, [k]: e.target.value }));
  const label = { display:'block', fontFamily:'IBM Plex Mono, monospace', fontSize:9, letterSpacing:'0.14em', textTransform:'uppercase', color:'var(--warm-500)', marginBottom:7 };
  const input = { width:'100%', background:'var(--porcelain)', border:'1px solid var(--warm-200)', padding:'11px 13px', fontSize:14, color:'var(--graphite)', fontFamily:'inherit' };
  const roles = ['Cold outreach', 'Inbound', 'Referral', 'Distributor', 'Operator / chain', 'Investor'];

  function save() {
    const name = draft.name.trim();
    const email = draft.email.trim();
    if (!name) { setErr('Name is required.'); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setErr('Enter a valid email.'); return; }
    const lead = {
      name, email,
      org: draft.org.trim(),
      role: draft.role || 'Cold outreach',
      phone: draft.phone.trim(),
      message: draft.message.trim(),
      seats: 0, kind: 'cold', ts: Date.now(),
    };
    addColdLead(lead);
    // If a sequencing backend is configured, also enroll the lead so the
    // automatic sequence starts. Fire-and-forget — local add already succeeded.
    if (cfg.backendUrl) {
      fetch(cfg.backendUrl.replace(/\/$/, '') + '/api/enroll', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name, org: lead.org, role: lead.role, phone: lead.phone, note: lead.message }),
      }).catch(() => {});
    }
    onClose();
  }

  return (
    <div onClick={onClose} style={{ position:'fixed', inset:0, zIndex:100, background:'rgba(17,19,21,0.45)', display:'flex', alignItems:'flex-start', justifyContent:'center', padding:'6vh 20px', overflowY:'auto' }}>
      <div onClick={(e) => e.stopPropagation()} className="card" style={{ width:'100%', maxWidth:560, padding:'30px 32px' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:8 }}>
          <div>
            <div className="mono" style={{ fontSize:10, letterSpacing:'0.14em', color:'var(--warm-500)', marginBottom:6 }}>PIPELINE</div>
            <h2 className="serif" style={{ fontSize:26, lineHeight:1 }}>Add cold outreach lead</h2>
          </div>
          <button onClick={onClose} className="mono" style={{ fontSize:13, color:'var(--warm-500)', background:'transparent', border:'none', padding:4 }}>Close ✕</button>
        </div>
        <p style={{ fontSize:13, lineHeight:1.6, color:'var(--slate-800)', marginBottom:22, maxWidth:460 }}>
          Log a prospect you're reaching out to directly. They'll enter the pipeline as <b>New</b> — open the row afterward to compose the first email.
          {cfg.backendUrl ? <span style={{ color:'var(--teal)' }}> Sequencing backend connected — they'll also be enrolled in the automatic sequence.</span> : null}
        </p>

        <div className="ds-grid-2" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:16 }}>
          <div>
            <label style={label}>Name *</label>
            <input value={draft.name} onChange={set('name')} placeholder="Jane Tanaka" style={input} />
          </div>
          <div>
            <label style={label}>Email *</label>
            <input value={draft.email} onChange={set('email')} type="email" placeholder="jane@kitchen.jp" autoComplete="off" style={input} />
          </div>
          <div>
            <label style={label}>Company</label>
            <input value={draft.org} onChange={set('org')} placeholder="FamilyMart" style={input} />
          </div>
          <div>
            <label style={label}>Type</label>
            <select value={draft.role} onChange={set('role')} style={{ ...input, cursor:'pointer' }}>
              {roles.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <div>
            <label style={label}>Phone</label>
            <input value={draft.phone} onChange={set('phone')} placeholder="+81 …" style={input} />
          </div>
        </div>
        <div style={{ marginBottom:18 }}>
          <label style={label}>Context / note</label>
          <textarea value={draft.message} onChange={set('message')} rows={3} placeholder="Where they came from, what to open with…" style={{ ...input, resize:'vertical' }} />
        </div>

        <div style={{ display:'flex', gap:12, alignItems:'center', marginTop:6 }}>
          <button className="ds-btn" onClick={save} style={{ background:'var(--amber)', color:'var(--graphite)', padding:'12px 22px', fontSize:13, fontWeight:600, letterSpacing:'0.04em' }}>ADD LEAD</button>
          {err && <span className="mono" style={{ fontSize:11, color:'var(--red)' }}>{err}</span>}
        </div>
      </div>
    </div>
  );
}

function StatusPill({ id }) {
  const s = STATUS_BY_ID[id] || STATUS_BY_ID.new;
  const style = s.solid ? { background:s.solid, color:s.fg } : { background:s.bg, color:s.fg };
  return (
    <span className="pill" style={style}>
      {!s.solid && <span style={{ width:6, height:6, borderRadius:'50%', background:s.dot, flexShrink:0 }}/>}
      {s.label}
    </span>
  );
}

function FlagPill({ kind }) {
  const m = { bounced:{ label:'Bounced', c:'var(--red)' }, unsub:{ label:'Unsubscribed', c:'var(--warm-500)' } };
  const f = m[kind];
  return <span className="pill" style={{ background:'transparent', color:f.c, border:`1px solid ${f.c}` }}>{f.label}</span>;
}

function StatusCell({ map, c }) {
  const f = flagsOf(map, c);
  const n = clickCount(map, c);
  return (
    <div style={{ display:'flex', alignItems:'center', gap:6, flexWrap:'wrap' }}>
      <StatusPill id={statusOf(map, c)} />
      {n > 0 && <span className="pill" style={{ background:'rgba(242,162,58,0.16)', color:'var(--amber-deep)' }}>↗ {n} click{n>1?'s':''}</span>}
      {f.bounced && <FlagPill kind="bounced" />}
      {f.unsub && <FlagPill kind="unsub" />}
    </div>
  );
}

// ── Compose & send panel (expands inside an investor row) ──
const TEMPLATES = [
  {
    id: 'welcome',
    label: 'Welcome & next steps',
    subject: (c) => `Welcome to the Dr. Fry founding round, ${c.name.split(' ')[0]}`,
    body: (c) =>
`Hi ${c.name.split(' ')[0]},

Thank you for reserving ${c.seats} seat${c.seats>1?'s':''} (${eur(c.seats*ROUND.ticket)}) in the Dr. Fry ProWave™ founding round. You're one of the ${ROUND.totalSeats} founders backing a single batch of ${ROUND.batchUnits} units from Japan.

Here's what happens next:
1. We hold your commitment in escrow — nothing is drawn until the pool reaches ${ROUND.totalSeats}.
2. Once full, we send the syndicate agreement to sign.
3. The pooled capital places the batch order ex-works in Japan.

${c.message ? `On what you shared:\n"${c.message}"\n\nI'd love to pick that up properly — ` : ''}A few things worth two minutes — each link is live:
• Run your own kitchen's numbers: ${CLICK_BY_ID.roi.url}
• FamilyMart demo & testing data (PDF): ${CLICK_BY_ID.familymart.url}
• How Seven-Eleven Japan got here: ${CLICK_BY_ID.casestudy.url}

If you have any questions before then, just reply to this email.

Warm regards,
The Dr. Fry founding team`
  },
  {
    id: 'agreement',
    label: 'Send syndicate agreement',
    subject: (c) => `Your syndicate agreement — Dr. Fry ProWave™`,
    body: (c) =>
`Hi ${c.name.split(' ')[0]},

Good news — the pool is nearly there, and it's time to formalise your ${c.seats}-seat commitment.

Attached is the syndicate agreement covering your ${eur(c.seats*ROUND.ticket)} stake. Once signed, your funds move from escrow into the batch order.

Let me know if you'd like to walk through any clause first.

Best,
The Dr. Fry founding team`
  },
  {
    id: 'followup',
    label: 'Gentle follow-up',
    subject: (c) => `Quick follow-up on your Dr. Fry seat`,
    body: (c) =>
`Hi ${c.name.split(' ')[0]},

Just circling back on your ${c.seats}-seat reservation. We're filling the round fast and closing on ${ROUND.closeDate}.

${c.message ? `You mentioned: "${c.message}" — happy to dig into that whenever suits.` : 'Happy to answer anything before we lock the round.'}

The two things founders find most convincing, if you've a minute:
• The FamilyMart demo & testing results (PDF): ${CLICK_BY_ID.familymart.url}
• Model your own saving: ${CLICK_BY_ID.roi.url}

Best,
The Dr. Fry founding team`
  },
];

// ROI leads are a different animal — a kitchen that ran its own numbers, not a
// seat reservation. Their templates speak to the saving they modelled.
const ROI_TEMPLATES = [
  {
    id: 'roi-quote',
    label: 'Tailored quote & trial',
    subject: (c) => `Your ProWave savings estimate — ${eur((c.roi&&c.roi.saved)||0)}/yr`,
    body: (c) =>
`Hi ${c.name.split(' ')[0]},

Thanks for running your numbers on the Dr. Fry site. Based on what you entered, ProWave is modelled to save ${c.org && c.org!=='—' ? c.org : 'your kitchen'} ${eur((c.roi&&c.roi.saved)||0)} a year — around ${(c.roi&&c.roi.reductionPct)||0}% less oil — paying back in roughly ${c.roi&&c.roi.payback?c.roi.payback.toFixed(1):'—'} months.

${c.message ? `On what you shared:\n"${c.message}"\n\n` : ''}I'd like to put a tailored quote in front of you, plus a measured-trial offer so you can verify the saving on your own line before committing.

A couple of things worth two minutes:
• The FamilyMart demo & testing data (PDF): ${CLICK_BY_ID.familymart.url}
• How Seven-Eleven Japan got here: ${CLICK_BY_ID.casestudy.url}

When's a good time for a short call?

Best,
The Dr. Fry team`
  },
  {
    id: 'roi-nudge',
    label: 'Gentle nudge',
    subject: (c) => `Still thinking it over? — your ${eur((c.roi&&c.roi.saved)||0)}/yr estimate`,
    body: (c) =>
`Hi ${c.name.split(' ')[0]},

Just circling back on the savings estimate you ran — ${eur((c.roi&&c.roi.saved)||0)} a year for ${c.org && c.org!=='—' ? c.org : 'your kitchen'}.

The quickest way to be sure of the number is a measured trial on one of your fryers. Happy to set that up whenever suits.

• Model it again any time: ${CLICK_BY_ID.roi.url}

Best,
The Dr. Fry team`
  },
];

// Case-study leads — downloaded the field study, a genuine engagement signal.
const CASE_TEMPLATES = [
  {
    id: 'case-followup',
    label: 'Case study follow-up',
    subject: (c) => `Your ProWave field study — and your kitchen's numbers`,
    body: (c) =>
`Hi ${c.name.split(' ')[0]},

Thanks for downloading the Musashino field study — the deployment where the same facility cut frying-oil use by 36% on matched products.

${c.org && c.org!=='—' ? `For an operation like ${c.org}, the ` : 'The '}quickest way to see what that looks like for your kitchen is a measured trial on one of your fryers, so you verify the saving on your own line before committing.

A couple of next steps:
• Model your own saving: ${CLICK_BY_ID.roi.url}
• The FamilyMart demo & testing data (PDF): ${CLICK_BY_ID.familymart.url}

Would a short call this week suit?

Best,
The Dr. Fry team`
  },
];

function ComposePanel({ c, sent, onSent }) {
  const templates = c.kind === 'roi' ? ROI_TEMPLATES : c.kind === 'casestudy' ? CASE_TEMPLATES : TEMPLATES;
  const [tplId, setTplId] = useState(templates[0].id);
  const tpl = templates.find((t) => t.id === tplId) || templates[0];
  const [subject, setSubject] = useState(() => tpl.subject(c));
  const [body, setBody] = useState(() => tpl.body(c));
  const [justSent, setJustSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [err, setErr] = useState('');
  const cfg = useCfg();
  const resendMode = cfg.mode === 'proxy' || cfg.mode === 'direct';

  // When the template changes, refill subject + body
  useEffect(() => {
    setSubject(tpl.subject(c));
    setBody(tpl.body(c));
  }, [tplId]);

  const sentInfo = sent[keyFor(c)];
  const map = useStatusMap();
  const st = statusOf(map, c);
  const flags = flagsOf(map, c);
  const clicks = clicksOf(map, c);
  const suppressed = !!(flags.bounced || flags.unsub);

  async function send() {
    setErr('');
    if (resendMode) {
      setSending(true);
      try {
        const r = await sendEmail(cfg, { to: c.email, subject, text: body });
        onSent(c, { subject, body, template: tpl.label, channel: 'resend', resendId: r && r.id });
        setJustSent(true);
        setTimeout(() => setJustSent(false), 2600);
      } catch (e) {
        const m = String((e && e.message) || e);
        setErr(m === 'not-configured'
          ? 'Add your From address and endpoint / key in Email settings first.'
          : m + (m.includes('Failed to fetch') ? ' — likely CORS. Use proxy mode.' : ''));
      } finally {
        setSending(false);
      }
      return;
    }
    // mailto fallback — opens the operator's mail client pre-filled
    const url = `mailto:${encodeURIComponent(c.email)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = url;
    onSent(c, { subject, body, template: tpl.label, channel: 'mailto' });
    setJustSent(true);
    setTimeout(() => setJustSent(false), 2600);
  }

  const labelStyle = { display:'block', fontFamily:'IBM Plex Mono, monospace', fontSize:9, letterSpacing:'0.14em', textTransform:'uppercase', color:'var(--warm-500)', marginBottom:7 };
  const inputStyle = { width:'100%', background:'var(--porcelain)', border:'1px solid var(--warm-200)', padding:'11px 13px', fontSize:14, color:'var(--graphite)', fontFamily:'inherit' };

  return (
    <div style={{ background:'var(--porcelain-2)', border:'1px solid var(--warm-200)', borderLeft:'3px solid var(--amber)', padding:'24px 26px' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline', flexWrap:'wrap', gap:10, marginBottom:20 }}>
        <div className="mono" style={{ fontSize:10, letterSpacing:'0.14em', color:'var(--warm-500)' }}>
          COMPOSE → {c.email}
        </div>
        {sentInfo
          ? <span className="pill pill-teal">Last sent {timeAgo(sentInfo.at)} · ×{sentInfo.count}</span>
          : <span className="pill pill-grey">Not contacted yet</span>}
      </div>

      {/* Record of every email actually sent to this contact */}
      <SentLog history={sentInfo && sentInfo.history} />

      {/* Lead stage + suppression */}
      <div style={{ display:'flex', gap:26, flexWrap:'wrap', alignItems:'flex-end', marginBottom:20, paddingBottom:20, borderBottom:'1px solid var(--warm-200)' }}>
        <div>
          <label style={labelStyle}>Stage</label>
          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
            <select value={st} onChange={(e) => writeStatus(keyFor(c), { status:e.target.value })}
              style={{ ...inputStyle, width:'auto', paddingRight:34, cursor:'pointer' }}>
              {STATUSES.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
            </select>
            <StatusPill id={st} />
          </div>
        </div>
        <div>
          <label style={labelStyle}>Suppression</label>
          <div style={{ display:'flex', gap:8 }}>
            {[['bounced','Bounced','var(--red)'],['unsub','Unsubscribed','var(--warm-500)']].map(([key,lbl,col]) => {
              const on = !!flags[key];
              return (
                <button key={key} onClick={() => writeStatus(keyFor(c), { flags:{ ...flags, [key]: !on } })} style={{
                  display:'inline-flex', alignItems:'center', gap:7, padding:'9px 13px', fontFamily:'IBM Plex Mono, monospace',
                  fontSize:11, letterSpacing:'0.04em', transition:'all .15s ease',
                  border:`1px solid ${on ? col : 'var(--warm-200)'}`,
                  background: on ? col : 'var(--porcelain)', color: on ? '#fff' : 'var(--slate-800)',
                }}>
                  <span style={{ width:7, height:7, borderRadius:'50%', background: on ? '#fff' : col }}/>
                  {lbl}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Engagement — click-through is the qualification trigger, not opens */}
      <div style={{ marginBottom:20, paddingBottom:20, borderBottom:'1px solid var(--warm-200)' }}>
        <label style={{ ...labelStyle, marginBottom:9 }}>
          Engagement · link clicks
          <span style={{ textTransform:'none', letterSpacing:0, color:'var(--warm-500)', marginLeft:8 }}>a click — not an open — marks a lead Clicked</span>
        </label>
        <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
          {CLICK_ASSETS.map((a) => {
            const on = !!clicks[a.id];
            return (
              <button key={a.id} disabled={!sentInfo} onClick={() => toggleClick(map, c, a.id)} style={{
                display:'inline-flex', alignItems:'center', gap:7, padding:'9px 13px', fontFamily:'IBM Plex Mono, monospace',
                fontSize:11, letterSpacing:'0.04em', transition:'all .15s ease',
                border:`1px solid ${on ? 'var(--amber)' : 'var(--warm-200)'}`,
                background: on ? 'rgba(242,162,58,0.16)' : 'var(--porcelain)', color: on ? 'var(--amber-deep)' : 'var(--slate-800)',
                cursor: sentInfo ? 'pointer' : 'not-allowed', opacity: sentInfo ? 1 : 0.5,
              }}>
                <span>↗</span>{a.label}{on && <span style={{ marginLeft:2 }}>✓</span>}
              </button>
            );
          })}
        </div>
        <div className="mono" style={{ fontSize:10, color:'var(--warm-500)', marginTop:9, lineHeight:1.5 }}>
          {sentInfo
            ? 'Prototype: tap to log a click. In production, Resend / link-tracking webhooks set these automatically and auto-promote the lead.'
            : 'No clicks yet — send an email first. Clicks are tracked from the links in mail you\u2019ve sent.'}
        </div>
      </div>

      {/* Their submitted story, quoted for reference */}
      {c.message && (
        <div style={{ borderLeft:'2px solid var(--warm-200)', paddingLeft:14, marginBottom:20 }}>
          <div className="mono" style={{ fontSize:9, letterSpacing:'0.12em', color:'var(--warm-500)', marginBottom:6 }}>THEIR NOTE</div>
          <div style={{ fontSize:13, fontStyle:'italic', color:'var(--slate-800)', lineHeight:1.5 }}>"{c.message}"</div>
        </div>
      )}

      {/* Template quick-starts */}
      <div style={{ marginBottom:18 }}>
        <label style={labelStyle}>Template</label>
        <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
          {templates.map((t) => (
            <button key={t.id} onClick={() => setTplId(t.id)} style={{
              padding:'8px 14px', fontSize:12, fontWeight:500,
              border:`1px solid ${tplId===t.id ? 'var(--graphite)' : 'var(--warm-200)'}`,
              background: tplId===t.id ? 'var(--graphite)' : 'var(--porcelain)',
              color: tplId===t.id ? 'var(--porcelain)' : 'var(--slate-800)',
              transition:'all .15s ease',
            }}>{t.label}</button>
          ))}
        </div>
      </div>

      <div style={{ marginBottom:16 }}>
        <label style={labelStyle}>Subject</label>
        <input value={subject} onChange={(e) => setSubject(e.target.value)} style={inputStyle} />
      </div>
      <div style={{ marginBottom:20 }}>
        <label style={labelStyle}>Message — personalize before sending</label>
        <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={12}
          style={{ ...inputStyle, resize:'vertical', lineHeight:1.55, fontFamily:'inherit' }} />
      </div>

      <div style={{ display:'flex', alignItems:'center', gap:14, flexWrap:'wrap' }}>
        <button className="ds-btn" onClick={send} disabled={sending || suppressed} style={{
          background: (suppressed || sending) ? 'var(--warm-200)' : 'var(--amber)', color: (suppressed || sending) ? 'var(--warm-500)' : 'var(--graphite)', padding:'13px 22px',
          fontSize:13, fontWeight:600, letterSpacing:'0.04em', border:'none',
        }}>
          {sending ? 'SENDING…' : (sentInfo ? 'RESEND →' : 'SEND →')}
        </button>
        {suppressed && <span className="mono" style={{ fontSize:12, color:'var(--red)' }}>⚠ {flags.unsub ? 'Unsubscribed' : 'Bounced'} — sending suppressed</span>}
        {err && <span className="mono" style={{ fontSize:12, color:'var(--red)', maxWidth:320, lineHeight:1.5 }}>⚠ {err} <button onClick={() => setSettingsOpen(true)} style={{ background:'transparent', border:'none', color:'var(--amber-deep)', textDecoration:'underline', padding:0, fontSize:12 }}>Settings</button></span>}
        {justSent && <span className="mono" style={{ fontSize:12, color:'var(--teal)' }}>✓ {resendMode ? 'Sent via Resend' : 'Opened in your mail client'}</span>}
        <span className="mono" style={{ fontSize:10, color:'var(--warm-500)', marginLeft:'auto', maxWidth:320, lineHeight:1.5, textAlign:'right' }}>
          {resendMode
            ? <>Sends directly via Resend ({cfg.mode === 'proxy' ? 'proxy' : 'direct key'}). <button onClick={() => setSettingsOpen(true)} style={{ background:'transparent', border:'none', color:'var(--amber-deep)', textDecoration:'underline', padding:0, fontSize:10 }}>Change</button></>
            : <>Prototype: opens your email app pre-filled. <button onClick={() => setSettingsOpen(true)} style={{ background:'transparent', border:'none', color:'var(--amber-deep)', textDecoration:'underline', padding:0, fontSize:10 }}>Connect Resend</button></>}
        </span>
      </div>
    </div>
  );
}

function RecentTable({ commitments, title, compose }) {
  const [openKey, setOpenKey] = useState(null);
  const [sent, setSent] = useState(() => readSent());
  const map = useStatusMap();
  const onSent = (c, mail) => setSent(recordSent(c, mail));
  const cols = compose ? 7 : 6;
  return (
    <div className="card table-scroll">
      <div style={{ padding:'20px 24px 4px' }}>
        <div className="mono" style={{ fontSize:10, letterSpacing:'0.13em', color:'var(--warm-500)' }}>{title.toUpperCase()}</div>
      </div>
      <table>
        <thead><tr><th>Investor</th><th>Type</th><th>Seats</th><th>Amount</th><th>When</th><th>Status</th>{compose && <th></th>}</tr></thead>
        <tbody>
          {commitments.length === 0 && (
            <tr>
              <td colSpan={cols} style={{ padding:'40px 24px', textAlign:'center' }}>
                <div className="mono" style={{ fontSize:12, color:'var(--warm-500)', letterSpacing:'0.06em', lineHeight:1.7 }}>
                  NO RESERVATIONS YET<br/>
                  <span style={{ color:'var(--warm-500)' }}>Commitments submitted on the public page appear here in real time.</span>
                </div>
              </td>
            </tr>
          )}
          {commitments.map((c,i)=>{
            const k = keyFor(c);
            const isOpen = openKey === k;
            const sentInfo = sent[k];
            return (
              <React.Fragment key={k+i}>
                <tr style={ compose ? { cursor:'pointer', background: isOpen ? 'var(--porcelain-2)' : 'transparent' } : undefined }
                    onClick={ compose ? () => setOpenKey(isOpen ? null : k) : undefined }>
                  <td>
                    <div style={{ fontWeight:500 }}>{c.name}</div>
                    <div className="mono" style={{ fontSize:11, color:'var(--warm-500)', marginTop:2 }}>{c.org && c.org!=='—' ? c.org : c.email}</div>
                  </td>
                  <td><RolePill role={c.role}/></td>
                  <td className="mono" style={{ fontSize:15 }}>{c.kind ? '—' : c.seats}</td>
                  <td className="mono" style={{ fontSize:14 }}>{c.kind==='roi' ? (eur((c.roi&&c.roi.saved)||0)+'/yr') : (c.kind ? '—' : eur(c.seats*ROUND.ticket))}</td>
                  <td className="mono" style={{ fontSize:12, color:'var(--warm-500)' }}>{timeAgo(c.ts)}</td>
                  <td><StatusCell map={map} c={c} /></td>
                  {compose && (
                    <td style={{ textAlign:'right', whiteSpace:'nowrap' }}>
                      <span className="mono" style={{ fontSize:13, fontWeight:600, color: isOpen ? 'var(--amber-deep)' : 'var(--graphite)', display:'inline-flex', alignItems:'center', gap:7 }}>
                        {sentInfo && !isOpen && <span style={{ width:6, height:6, borderRadius:'50%', background:'var(--teal)' }}/>}
                        {isOpen ? 'Close ✕' : (sentInfo ? 'Resend ✎' : 'Compose ✎')}
                      </span>
                    </td>
                  )}
                </tr>
                {compose && isOpen && (
                  <tr>
                    <td colSpan={cols} style={{ padding:0 }}>
                      <div style={{ padding:'4px 24px 22px' }}>
                        <ComposePanel c={c} sent={sent} onSent={onSent} />
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function Investors({ commitments, totals }) {
  const [filter, setFilter] = useState('all');
  const [q, setQ] = useState('');
  const [addOpen, setAddOpen] = useState(false);
  const map = useStatusMap();
  const counts = useMemo(() => {
    const c = { all: commitments.length, suppressed: 0 };
    STATUSES.forEach((s) => { c[s.id] = 0; });
    commitments.forEach((cm) => {
      c[statusOf(map, cm)] = (c[statusOf(map, cm)] || 0) + 1;
      const f = flagsOf(map, cm); if (f.bounced || f.unsub) c.suppressed++;
    });
    return c;
  }, [commitments, map]);
  const filtered = commitments.filter((c) => {
    if (q && !(`${c.name} ${c.org} ${c.email}`.toLowerCase().includes(q.toLowerCase()))) return false;
    if (filter === 'all') return true;
    if (filter === 'suppressed') { const f = flagsOf(map, c); return !!(f.bounced || f.unsub); }
    return statusOf(map, c) === filter;
  });
  const chips = [{ id:'all', label:'All' }, ...STATUSES, { id:'suppressed', label:'Suppressed' }];
  return (
    <div style={{ display:'flex', flexDirection:'column', gap: 16 }}>
      <div style={{ display:'flex', justifyContent:'space-between', gap: 16, flexWrap:'wrap', alignItems:'center' }}>
        <div style={{ display:'flex', gap:12, alignItems:'center', flexWrap:'wrap' }}>
          <input value={q} onChange={(e)=>setQ(e.target.value)} placeholder="Search name, fund, email…" style={{ background:'var(--porcelain)', border:'1px solid var(--warm-200)', padding:'10px 14px', fontSize:14, width: 280 }} />
          <button onClick={()=>setAddOpen(true)} className="ds-btn" style={{ display:'inline-flex', alignItems:'center', gap:8, background:'var(--graphite)', color:'var(--porcelain)', padding:'10px 16px', fontSize:13, fontWeight:600, letterSpacing:'0.03em', whiteSpace:'nowrap' }}>
            <span style={{ fontSize:16, lineHeight:0 }}>+</span> Add cold outreach lead
          </button>
        </div>
        <div className="mono" style={{ fontSize:12, color:'var(--warm-500)' }}>{filtered.length} OF {commitments.length} LEADS</div>
      </div>
      <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
        {chips.map((s) => {
          const active = filter === s.id;
          const dot = s.id === 'suppressed' ? 'var(--red)' : (STATUS_BY_ID[s.id] && (STATUS_BY_ID[s.id].solid || STATUS_BY_ID[s.id].dot));
          return (
            <button key={s.id} onClick={()=>setFilter(s.id)} style={{
              display:'inline-flex', alignItems:'center', gap:7, padding:'7px 12px', fontFamily:'IBM Plex Mono, monospace',
              fontSize:11, letterSpacing:'0.04em', transition:'all .15s ease',
              border:`1px solid ${active?'var(--graphite)':'var(--warm-200)'}`,
              background: active?'var(--graphite)':'var(--porcelain)', color: active?'var(--porcelain)':'var(--slate-800)',
            }}>
              {dot && <span style={{ width:7, height:7, borderRadius:'50%', background:dot, flexShrink:0 }}/>}
              {s.label}
              <b style={{ color: active?'var(--porcelain)':'var(--warm-500)', fontWeight:600 }}>{counts[s.id] || 0}</b>
            </button>
          );
        })}
      </div>
      <RecentTable commitments={filtered} title={`Investor register · ${totals.seats} seats · ${eur(totals.capital)}`} compose />
      <div className="mono" style={{ fontSize:11, color:'var(--warm-500)', letterSpacing:'0.04em', lineHeight:1.6 }}>
        Click any row to compose a personalized message. Templates pre-fill from the investor's name, seats and the note they left — edit freely before sending. Open a row to set its stage or flag a bounce / unsubscribe. A green dot marks founders you've already contacted.
      </div>
      <AddLeadModal open={addOpen} onClose={()=>setAddOpen(false)} />
    </div>
  );
}

// ── Batch order tracker ──
function BatchOrder({ totals }) {
  const funded = totals.pct >= 100;
  const stages = [
    { t:'Pool subscribed', d:`${ROUND.totalSeats} seats fully committed`, done: funded, active: !funded },
    { t:'Escrow released', d:`${eur(POOL_TOTAL)} drawn from escrow to syndicate`, done:false, active: funded },
    { t:'Purchase order — Japan', d:`Ex-works PO for ${ROUND.batchUnits} ProWave™ units placed with ENF Corp.`, done:false },
    { t:'Manufacturing', d:'Factory build & QA · ~8 week lead time', done:false },
    { t:'Freight & EU certification', d:'Sea freight to Rotterdam · CE/UKCA clearance', done:false },
    { t:'Batch received', d:`${ROUND.batchUnits} units in EU warehouse, ready to deploy`, done:false },
  ];
  return (
    <div style={{ display:'flex', flexDirection:'column', gap: 22 }}>
      <div className="ds-grid-4" style={{ display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap: 16 }}>
        <StatCard label="Batch size" value={ROUND.batchUnits} sub="units, single order" />
        <StatCard label="Ex-works cost" value={eurShort(ROUND.batchUnits*ROUND.exWorksPerUnit)} sub={`${eur(ROUND.exWorksPerUnit)} / unit`} />
        <StatCard label="Funded toward batch" value={`${Math.min(100,Math.round(totals.pct))}%`} bar={totals.pct} accent="var(--amber)" sub={`${eur(totals.capital)} of ${eur(POOL_TOTAL)}`} />
        <StatCard label="Est. order date" value={funded?'READY':'PENDING'} accent={funded?'var(--teal)':'var(--warm-500)'} sub={funded?'pool is full':`needs ${totals.remaining} more seats`} />
      </div>
      <div className="card" style={{ padding:'30px 34px' }}>
        <div className="mono" style={{ fontSize:10, letterSpacing:'0.13em', color:'var(--warm-500)', marginBottom: 30 }}>ORDER PIPELINE · ONE BATCH FROM JAPAN</div>
        <div style={{ position:'relative' }}>
          {stages.map((s,i)=>(
            <div key={i} style={{ display:'flex', gap: 20, paddingBottom: i<stages.length-1?34:0, position:'relative' }}>
              {i<stages.length-1 && <div style={{ position:'absolute', left:13, top:28, bottom:0, width:2, background: s.done?'var(--teal)':'var(--warm-200)' }}/>}
              <div style={{ width:28, height:28, borderRadius:'50%', flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center',
                background: s.done?'var(--teal)':s.active?'var(--amber)':'var(--porcelain)', border:`2px solid ${s.done?'var(--teal)':s.active?'var(--amber)':'var(--warm-200)'}`, zIndex:1 }}>
                {s.done
                  ? <svg width="14" height="14" viewBox="0 0 14 14"><path d="M3 7.5 L6 10.5 L11 4.5" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  : <span className="mono" style={{ fontSize:11, color: s.active?'var(--graphite)':'var(--warm-500)' }}>{i+1}</span>}
              </div>
              <div style={{ paddingTop: 3 }}>
                <div style={{ fontSize:16, fontWeight:600, display:'flex', alignItems:'center', gap:10 }}>
                  {s.t}
                  {s.active && <span className="pill pill-amber">In progress</span>}
                  {s.done && <span className="pill pill-teal">Done</span>}
                </div>
                <div style={{ fontSize:14, color:'var(--slate-800)', marginTop:4 }}>{s.d}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Deployment (post-batch, forward looking) ──
function Deployment({ totals }) {
  const funded = totals.pct >= 100;
  return (
    <div style={{ display:'flex', flexDirection:'column', gap: 22 }}>
      <div className="ds-grid-4" style={{ display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap: 16 }}>
        <StatCard label="Units deployed" value={funded?'0':'—'} sub={funded?`of ${ROUND.batchUnits} in batch`:'awaiting batch'} />
        <StatCard label="Kitchens live" value="0" sub="installations booked" />
        <StatCard label="Deployed value" value={eurShort(ROUND.batchUnits*ROUND.deployedValuePerUnit)} accent="var(--amber)" sub="batch at deployed value" />
        <StatCard label="Savings / customer" value="TBD" sub="by oil usage" />
      </div>
      <div className="card" style={{ padding:'48px 40px', textAlign:'center' }}>
        <div style={{ display:'inline-flex', marginBottom: 18 }}>
          <svg width="44" height="44" viewBox="0 0 44 44"><circle cx="22" cy="22" r="21" fill="none" stroke="var(--warm-200)" strokeWidth="1.5"/><circle cx="22" cy="22" r="3" fill="var(--amber)"/><circle cx="22" cy="22" r="9" fill="none" stroke="var(--amber)" strokeWidth="1" opacity="0.6"/><circle cx="22" cy="22" r="15" fill="none" stroke="var(--amber)" strokeWidth="1" opacity="0.3"/></svg>
        </div>
        <h3 className="serif" style={{ fontSize: 28, marginBottom: 12 }}>Deployment opens after the batch lands.</h3>
        <p style={{ fontSize:15, lineHeight:1.55, color:'var(--slate-800)', maxWidth: 520, margin:'0 auto' }}>
          Once the {ROUND.batchUnits}-unit batch clears EU certification, units are installed into commercial kitchens.
          This panel will track live installs, utilisation, and oil-cost savings for the founding {ROUND.totalSeats}.
        </p>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
function App() {
  const [active, setActive] = useState('overview');
  const [commitments, setCommitments] = useState(()=>readCommitments());
  const buildDemoSites = () => [ ...(typeof window.loadIntakeAsSites === 'function' ? window.loadIntakeAsSites() : []), ...DEMO_MOCK ];
  const [demoSites, setDemoSites] = useState(buildDemoSites);
  const cfg = useCfg();

  useEffect(()=>{
    const onFocus = ()=> setCommitments(readCommitments());
    window.addEventListener('focus', onFocus);
    window.addEventListener('storage', onFocus);
    window.addEventListener('drfry-leads-changed', onFocus);
    return ()=>{ window.removeEventListener('focus', onFocus); window.removeEventListener('storage', onFocus); window.removeEventListener('drfry-leads-changed', onFocus); };
  }, []);

  useEffect(()=>{
    const refresh = ()=> setDemoSites(buildDemoSites());
    window.addEventListener('drfry-intake-changed', refresh);
    window.addEventListener('storage', refresh);
    return ()=>{ window.removeEventListener('drfry-intake-changed', refresh); window.removeEventListener('storage', refresh); };
  }, []);

  const totals = useMemo(()=>{
    const seats = Math.min(ROUND.totalSeats, commitments.reduce((s,c)=>s+c.seats,0));
    return {
      seats,
      capital: seats*ROUND.ticket,
      investors: commitments.length,
      pct: (seats/ROUND.totalSeats)*100,
      remaining: Math.max(0, ROUND.totalSeats - seats),
    };
  }, [commitments]);

  const titles = { overview:'Overview', investors:'Investors', batch:'Batch order', deployment:'Deployment', democlient:'Demo results', demoowner:'Demo portfolio', demointake:'Log a demo' };

  return (
    <div style={{ display:'flex', minHeight:'100vh' }}>
      <Sidebar active={active} setActive={setActive} />
      <main style={{ flex:1, minWidth:0 }}>
        <header className="main-pad" style={{ padding:'24px 36px', borderBottom:'1px solid var(--warm-200)', background:'var(--porcelain)', display:'flex', justifyContent:'space-between', alignItems:'center', position:'sticky', top:0, zIndex:20 }}>
          <div>
            <div className="mono" style={{ fontSize:10, letterSpacing:'0.14em', color:'var(--warm-500)', marginBottom:6 }}>FOUNDING ROUND · DASHBOARD</div>
            <h1 className="serif" style={{ fontSize: 30, lineHeight:1 }}>{titles[active]}</h1>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap: 22 }}>
            <button onClick={() => setSettingsOpen(true)} className="mono" title="Email delivery settings" style={{
              display:'inline-flex', alignItems:'center', gap:8, padding:'8px 13px', fontSize:11, letterSpacing:'0.06em',
              border:'1px solid var(--warm-200)', background:'var(--porcelain)', color:'var(--slate-800)',
            }}>
              <span style={{ width:7, height:7, borderRadius:'50%', flexShrink:0, background: cfgConnected(cfg) ? 'var(--teal)' : 'var(--warm-500)' }}/>
              {cfgConnected(cfg) ? 'RESEND CONNECTED' : 'CONNECT EMAIL'}
            </button>
            <div style={{ width:1, height:34, background:'var(--warm-200)' }}/>
            <div style={{ textAlign:'right' }}>
              <div className="mono" style={{ fontSize:10, color:'var(--warm-500)', letterSpacing:'0.1em' }}>CLOSES {ROUND.closeDate}</div>
              <div className="mono" style={{ fontSize:13, color: totals.remaining<=80?'var(--amber-deep)':'var(--graphite)', marginTop:3 }}>{totals.remaining} SEATS LEFT</div>
            </div>
            <div style={{ width:1, height:34, background:'var(--warm-200)' }}/>
            <div style={{ textAlign:'right' }}>
              <div className="mono" style={{ fontSize:10, color:'var(--warm-500)', letterSpacing:'0.1em' }}>RAISED</div>
              <div className="serif" style={{ fontSize:22, color:'var(--amber-deep)' }}>{eurShort(totals.capital)}</div>
            </div>
          </div>
        </header>
        <div className="main-pad" style={{ padding:'28px 36px 60px' }}>
          {active==='overview' && <Overview commitments={commitments} totals={totals} />}
          {active==='investors' && <Investors commitments={commitments} totals={totals} />}
          {active==='batch' && <BatchOrder totals={totals} />}
          {active==='deployment' && <Deployment totals={totals} />}
          {active==='democlient' && <div style={{ maxWidth:1040 }}><DemoClientPage sites={demoSites} setSites={setDemoSites} /></div>}
          {active==='demoowner' && <div style={{ maxWidth:1040 }}><DemoOwnerPage sites={demoSites} /></div>}
          {active==='demointake' && <DemoIntake />}
        </div>
      </main>
      <SettingsModal />
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
