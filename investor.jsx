const { useState, useEffect, useMemo, useRef } = React;

// ─────────────────────────────────────────────────────────────────
// Round economics — single source of truth (edit here)
// ─────────────────────────────────────────────────────────────────
const ROUND = {
  totalSeats: 30,          // fryers in this founding batch (1 seat = 1 fryer)
  ticket: 4500,            // € per fryer — full preorder, paid in full upfront
  maxSeatsPerInvestor: 4,
  batchUnits: 30,          // 1 fryer per seat — one batch from Japan
  exWorksPerUnit: 1167,    // € factory cost per unit
  deployedValuePerUnit: 4200,
  listPrice: 5900,         // € list price per unit, after the founder programme
  founderPrice: 4500,      // € Founding Partner price per unit
  rentMonthly: 199,        // € / month rental — cash positive from month one
  closeDate: '31 AUG 2026',
};
const POOL_TOTAL = ROUND.totalSeats * ROUND.ticket; // €120,000
const eur = (n) => '€' + Math.round(n).toLocaleString('en-US');

// ─────────────────────────────────────────────────────────────────
// Shared bits
// ─────────────────────────────────────────────────────────────────
function Diamond({ size = 9, color = 'var(--amber)' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 10 10" aria-hidden="true" style={{ flexShrink: 0 }}>
      <rect x="5" y="0" width="7.07" height="7.07" transform="rotate(45 5 0)" fill={color} />
    </svg>
  );
}

function Eyebrow({ children, light }) {
  return (
    <div className="mono" style={{
      display: 'inline-flex', alignItems: 'center', gap: 10,
      fontSize: 11, letterSpacing: '0.2em', textTransform: 'uppercase',
      color: light ? 'var(--amber)' : 'var(--amber-deep)', marginBottom: 24,
    }}>
      <Diamond />
      {children}
    </div>
  );
}

function Logo({ light }) {
  return (
    <a href="index.html" style={{ display:'flex', alignItems:'center', gap: 10, textDecoration:'none', color: light ? 'var(--porcelain)' : 'var(--graphite)' }}>
      <svg width="22" height="22" viewBox="0 0 22 22">
        <circle cx="11" cy="11" r="2" fill="var(--amber)"/>
        <circle cx="11" cy="11" r="6" fill="none" stroke="var(--amber)" strokeWidth="0.8"/>
        <circle cx="11" cy="11" r="10" fill="none" stroke="var(--amber)" strokeWidth="0.6" opacity="0.5"/>
      </svg>
      <span className="serif" style={{ fontSize: 18 }}>Dr. Fry</span>
      <span className="mono" style={{ fontSize: 10, color:'var(--warm-500)', letterSpacing:'0.15em', marginLeft: 2 }}>FOUNDING BATCH</span>
    </a>
  );
}

// ─────────────────────────────────────────────────────────────────
// Nav
// ─────────────────────────────────────────────────────────────────
function Nav() {
  return (
    <nav style={{
      position:'fixed', top:0, left:0, right:0, zIndex: 60,
      padding:'18px 32px', display:'flex', alignItems:'center', justifyContent:'space-between',
      background:'rgba(250,250,250,0.78)', backdropFilter:'blur(10px)', WebkitBackdropFilter:'blur(10px)',
      borderBottom:'1px solid var(--warm-200)',
    }}>
      <Logo />
      <div className="nav-links" style={{ display:'flex', gap: 30, alignItems:'center', fontSize: 13 }}>
        <a href="#how" style={{ color:'var(--slate-800)', textDecoration:'none', fontWeight:500 }}>How it works</a>
        <a href="#allocation" style={{ color:'var(--slate-800)', textDecoration:'none', fontWeight:500 }}>The batch</a>
        <a href="Dashboard.html" style={{ color:'var(--slate-800)', textDecoration:'none', fontWeight:500 }}>Dashboard</a>
        <a href="index.html" style={{ color:'var(--warm-500)', textDecoration:'none', fontWeight:500 }}>← The product</a>
      </div>
      <a href="#commit" className="ds-btn" style={{
        background:'var(--graphite)', color:'var(--porcelain)', padding:'10px 18px',
        textDecoration:'none', fontSize:12, fontWeight:500, letterSpacing:'0.06em'
      }} className="preorder-glow">PREORDER A FRYER →</a>
    </nav>
  );
}

// ─────────────────────────────────────────────────────────────────
// Hero
// ─────────────────────────────────────────────────────────────────
function Hero({ committedSeats }) {
  const remaining = ROUND.totalSeats - committedSeats;
  return (
    <header style={{ padding:'180px 0 90px', position:'relative', overflow:'hidden' }}>
      {/* faint dot field */}
      <svg style={{ position:'absolute', top:-120, right:-120, width:520, height:520, opacity:0.5, pointerEvents:'none' }} viewBox="-260 -260 520 520">
        {Array.from({length: 9}).map((_, r) => {
          const radius = (r+1) * 26; const count = Math.max(8, (r+1)*7);
          return Array.from({length: count}).map((_, i) => {
            const a = (i/count)*Math.PI*2;
            return <circle key={`${r}-${i}`} cx={Math.cos(a)*radius} cy={Math.sin(a)*radius} r={Math.max(0.6, 2-r*0.15)} fill="var(--amber)" opacity={Math.max(0.05, 0.9 - r*0.1)} />;
          });
        })}
      </svg>

      <div className="wrap" style={{ maxWidth: 1080, margin:'0 auto', padding:'0 40px', position:'relative' }}>
        <Eyebrow>Founding batch · One order · {ROUND.totalSeats} fryers</Eyebrow>
        <h1 className="serif hero-h" style={{ fontSize: 'clamp(46px, 7.2vw, 86px)', lineHeight: 1.0, letterSpacing:'-0.02em', maxWidth: 880, marginBottom: 30 }}>
          Thirty founding kitchens.<br/>
          <span style={{ color:'var(--warm-500)' }}>One batch from Japan.</span>
        </h1>
        <p style={{ fontSize: 19, lineHeight: 1.55, color:'var(--slate-800)', maxWidth: 600, marginBottom: 44 }}>
          We are opening a single founding batch of <strong>{ROUND.totalSeats} fryers</strong> at <strong>{eur(ROUND.ticket)}</strong> each —
          a one-time preorder, <strong>paid in full upfront</strong>.
          When the batch fills, the pooled preorders secure one production run of <strong>{ROUND.batchUnits} ProWave™ units</strong> with the manufacturer in Japan,
          built and installed into your kitchen. Founding customers benefit from reduced oil costs, with savings proportional to their oil usage.
        </p>
        <div style={{ display:'flex', gap: 16, flexWrap:'wrap', alignItems:'center' }}>
          <a href="#commit" className="ds-btn preorder-glow" style={{
            background:'var(--amber)', color:'var(--graphite)', padding:'17px 30px',
            textDecoration:'none', fontSize:14, fontWeight:600, letterSpacing:'0.05em'
          }}>PREORDER A FRYER →</a>
          <a href="#how" className="ds-btn" style={{
            background:'transparent', color:'var(--graphite)', padding:'17px 24px',
            textDecoration:'none', fontSize:14, fontWeight:500, border:'1px solid var(--graphite)'
          }}>How it works</a>
          <span className="mono" style={{ fontSize: 12, color: remaining <= 12 ? 'var(--amber-deep)' : 'var(--warm-500)', letterSpacing:'0.08em', marginLeft: 4 }}>
            {remaining} OF {ROUND.totalSeats} FRYERS REMAINING
          </span>
        </div>
      </div>
    </header>
  );
}

// ─────────────────────────────────────────────────────────────────
// Seats progress bar
// ─────────────────────────────────────────────────────────────────
function SeatsBar({ committedSeats }) {
  const pct = Math.min(100, (committedSeats / ROUND.totalSeats) * 100);
  const remaining = ROUND.totalSeats - committedSeats;
  return (
    <section style={{ background:'var(--graphite)', color:'var(--porcelain)', padding:'56px 0' }}>
      <div className="wrap" style={{ maxWidth: 1080, margin:'0 auto', padding:'0 40px' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-end', marginBottom: 18, flexWrap:'wrap', gap: 16 }}>
          <div>
            <div className="mono" style={{ fontSize: 10, letterSpacing:'0.18em', color:'var(--warm-500)', marginBottom: 10 }}>BATCH PREORDERS · LIVE</div>
            <div style={{ display:'flex', alignItems:'baseline', gap: 14 }}>
              <span className="serif" style={{ fontSize: 64, lineHeight: 1 }}>{committedSeats}</span>
              <span className="mono" style={{ fontSize: 14, color:'var(--warm-500)' }}>/ {ROUND.totalSeats} fryers preordered</span>
            </div>
          </div>
          <div style={{ textAlign:'right' }}>
            <div className="mono" style={{ fontSize: 10, letterSpacing:'0.18em', color:'var(--warm-500)', marginBottom: 10 }}>OF {eur(POOL_TOTAL)} TARGET</div>
            <span className="serif" style={{ fontSize: 40, color:'var(--amber)' }}>{eur(committedSeats * ROUND.ticket)}</span>
          </div>
        </div>
        <div style={{ height: 14, background:'#23262a', position:'relative', overflow:'hidden' }}>
          <div style={{ position:'absolute', inset:'0 auto 0 0', width: `${pct}%`, background:'var(--amber)', transition:'width .6s cubic-bezier(.2,.7,.2,1)' }}/>
          {/* tick marks every 10% */}
          {Array.from({length: 9}).map((_, i) => (
            <div key={i} style={{ position:'absolute', top:0, bottom:0, left:`${(i+1)*10}%`, width:1, background:'rgba(250,250,250,0.12)' }}/>
          ))}
        </div>
        <div className="mono" style={{ display:'flex', justifyContent:'space-between', marginTop: 12, fontSize: 11, color:'var(--warm-500)', letterSpacing:'0.08em' }}>
          <span>{remaining} FRYERS REMAINING</span>
          <span>BATCH CLOSES {ROUND.closeDate} · OR WHEN FULL</span>
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────
// How the pool works — 4 steps
// ─────────────────────────────────────────────────────────────────
function HowItWorks() {
  const steps = [
    { n:'01', t:'Preorder your fryer', d:`Preorder 1–${ROUND.maxSeatsPerInvestor} fryers at ${eur(ROUND.ticket)} each, paid in full upfront to secure your place in the batch.` },
    { n:'02', t:`The batch closes at ${ROUND.totalSeats}`, d:`Once all ${ROUND.totalSeats} fryers are spoken for (or on ${ROUND.closeDate}), the batch locks and the production run is scheduled with the manufacturer.` },
    { n:'03', t:'One batch, built in Japan', d:`The pooled preorders secure a single production run of ${ROUND.batchUnits} ProWave™ units with the manufacturer in Japan.` },
    { n:'04', t:'Built, shipped & installed', d:`Each fryer is built, shipped from Japan, and installed in your kitchen — and the oil it saves covers its cost from month one.` },
  ];
  return (
    <section id="how" style={{ padding:'120px 0' }}>
      <div className="wrap" style={{ maxWidth: 1080, margin:'0 auto', padding:'0 40px' }}>
        <Eyebrow>How the batch works</Eyebrow>
        <h2 className="serif" style={{ fontSize: 'clamp(36px, 5vw, 56px)', lineHeight: 1.05, letterSpacing:'-0.01em', marginBottom: 14, maxWidth: 720 }}>
          A preorder, a batch, a fryer.
        </h2>
        <p style={{ fontSize: 17, lineHeight: 1.55, color:'var(--slate-800)', maxWidth: 560, marginBottom: 64 }}>
          The structure is deliberately simple. No subscriptions, no hidden fees — {eur(ROUND.ticket)} per fryer, paid in full when you preorder.
        </p>
        <div className="ds-grid-4" style={{ display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap: 0, borderTop:'1px solid var(--graphite)' }}>
          {steps.map((s, i) => (
            <div key={i} className="step-card" style={{
              padding:'28px 24px 36px', borderRight: i < steps.length-1 ? '1px solid var(--warm-200)' : 'none',
            }}>
              <div className="mono" style={{ fontSize: 12, color:'var(--amber-deep)', letterSpacing:'0.1em', marginBottom: 22 }}>{s.n}</div>
              <div className="serif" style={{ fontSize: 23, lineHeight: 1.15, marginBottom: 14 }}>{s.t}</div>
              <p style={{ fontSize: 14, lineHeight: 1.55, color:'var(--slate-800)' }}>{s.d}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────
// Allocation economics
// ─────────────────────────────────────────────────────────────────
function Allocation() {
  const allocation = [
    { label:`Batch — ${ROUND.batchUnits} units ex-works (Japan)`, value: ROUND.batchUnits * ROUND.exWorksPerUnit, accent:true },
    { label:'Freight, duties & EU certification', value: 18000 },
    { label:'Installation & field deployment', value: 27000 },
    { label:'Working capital & reserve', value: POOL_TOTAL - (ROUND.batchUnits * ROUND.exWorksPerUnit) - 18000 - 27000 },
  ];
  return (
    <section id="allocation" style={{ padding:'120px 0', background:'var(--porcelain-2)' }}>
      <div className="wrap" style={{ maxWidth: 1080, margin:'0 auto', padding:'0 40px' }}>
        <Eyebrow>Where preorders go</Eyebrow>
        <h2 className="serif" style={{ fontSize:'clamp(36px, 5vw, 56px)', lineHeight:1.05, letterSpacing:'-0.01em', marginBottom: 56, maxWidth: 760 }}>
          Where the {eur(POOL_TOTAL)} goes.
        </h2>

        <div className="ds-grid-2" style={{ display:'grid', gridTemplateColumns:'1.15fr 0.85fr', gap: 0, border:'1px solid var(--graphite)' }}>
          {/* allocation table */}
          <div className="split-pad" style={{ padding: 40, borderRight:'1px solid var(--graphite)', background:'var(--porcelain)' }}>
            <div className="mono" style={{ fontSize:10, letterSpacing:'0.15em', color:'var(--warm-500)', marginBottom: 24, paddingBottom: 14, borderBottom:'1px solid var(--warm-200)', display:'flex', justifyContent:'space-between' }}>
              <span>ALLOCATION</span><span>EUR</span>
            </div>
            {allocation.map((a, i) => {
              const pct = (a.value / POOL_TOTAL) * 100;
              return (
                <div key={i} style={{ marginBottom: 22 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline', marginBottom: 8 }}>
                    <span style={{ fontSize: 14, fontWeight: a.accent ? 600 : 400, color: a.accent ? 'var(--graphite)' : 'var(--slate-800)' }}>{a.label}</span>
                    <span className="mono" style={{ fontSize: 13 }}>{eur(a.value)}</span>
                  </div>
                  <div style={{ height: 6, background:'var(--warm-200)', position:'relative' }}>
                    <div style={{ position:'absolute', inset:'0 auto 0 0', width:`${pct}%`, background: a.accent ? 'var(--amber)' : 'var(--graphite)' }}/>
                  </div>
                </div>
              );
            })}
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline', paddingTop: 16, borderTop:'1px solid var(--graphite)', marginTop: 8 }}>
              <span className="mono" style={{ fontSize: 11, letterSpacing:'0.1em', color:'var(--warm-500)' }}>TOTAL POOL</span>
              <span className="serif" style={{ fontSize: 28 }}>{eur(POOL_TOTAL)}</span>
            </div>
          </div>

          {/* key figures */}
          <div className="split-pad" style={{ padding: 40, background:'var(--graphite)', color:'var(--porcelain)' }}>
            <div className="mono" style={{ fontSize:10, letterSpacing:'0.15em', color:'var(--warm-500)', marginBottom: 30 }}>PER FOUNDER · PER FRYER</div>
            {[
              { k: eur(ROUND.ticket), l: 'Price per fryer' },
              { k: 'In full', l: 'Paid upfront on preorder' },
              { k: eur(ROUND.listPrice), l: 'List price after programme' },
              { k: '1 / ' + ROUND.totalSeats, l: 'Share of the founding batch' },
            ].map((f, i) => (
              <div key={i} style={{ paddingBottom: 22, marginBottom: 22, borderBottom: i < 3 ? '1px solid #2a2d31' : 'none' }}>
                <div className="serif" style={{ fontSize: 40, lineHeight: 1, color: i===0 ? 'var(--amber)' : 'var(--porcelain)' }}>{f.k}</div>
                <div className="mono" style={{ fontSize: 10, letterSpacing:'0.1em', color:'var(--warm-500)', marginTop: 8, textTransform:'uppercase' }}>{f.l}</div>
              </div>
            ))}
          </div>
        </div>
        <p className="mono" style={{ fontSize: 11, color:'var(--warm-500)', lineHeight: 1.6, marginTop: 18, maxWidth: 740 }}>
          INDICATIVE · Figures illustrate the founding-batch structure and pricing. Final pricing is confirmed on your order form.
        </p>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────
// Commitment + contact form
// ─────────────────────────────────────────────────────────────────
const STORE_KEY = 'drfry_round_commitments_v1';

function readCommittedSeats() {
  try {
    const raw = JSON.parse(localStorage.getItem(STORE_KEY) || '[]');
    return raw.reduce((sum, c) => sum + (c.seats || 0), 0);
  } catch { return 0; }
}

function CommitForm({ onCommit, committedSeats }) {
  const [seats, setSeats] = useState(1);
  const [form, setForm] = useState({ name:'', email:'', org:'', role:'Angel / private', phone:'', message:'' });
  const [errors, setErrors] = useState({});
  const [done, setDone] = useState(false);
  const remaining = ROUND.totalSeats - committedSeats;

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  function validate() {
    const e = {};
    if (!form.name.trim()) e.name = 1;
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email)) e.email = 1;
    if (seats < 1 || seats > ROUND.maxSeatsPerInvestor) e.seats = 1;
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function submit(ev) {
    ev.preventDefault();
    if (!validate()) return;
    const commitment = { ...form, seats, ticket: ROUND.ticket, amount: seats*ROUND.ticket, ts: Date.now() };
    try {
      const raw = JSON.parse(localStorage.getItem(STORE_KEY) || '[]');
      raw.push(commitment);
      localStorage.setItem(STORE_KEY, JSON.stringify(raw));
    } catch {}
    onCommit();
    setDone(true);
  }

  if (done) {
    return (
      <div style={{ background:'var(--porcelain)', border:'1px solid var(--graphite)', padding:'56px 48px', textAlign:'center' }}>
        <div style={{ display:'inline-flex', marginBottom: 22 }}>
          <svg width="48" height="48" viewBox="0 0 48 48">
            <circle cx="24" cy="24" r="23" fill="none" stroke="var(--amber)" strokeWidth="1.5"/>
            <path d="M15 24.5 L21 30.5 L33 17.5" fill="none" stroke="var(--graphite)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <h3 className="serif" style={{ fontSize: 34, lineHeight: 1.1, marginBottom: 14 }}>Fryer preordered.</h3>
        <p style={{ fontSize: 16, lineHeight:1.55, color:'var(--slate-800)', maxWidth: 460, margin:'0 auto 8px' }}>
          We've recorded your preorder for <strong>{seats} fryer{seats>1?'s':''}</strong> ({eur(seats*ROUND.ticket)} total).
          Our team will email <strong>{form.email}</strong> with your order confirmation and payment details within two business days.
        </p>
        <p className="mono" style={{ fontSize: 11, color:'var(--warm-500)', letterSpacing:'0.1em', marginTop: 18 }}>
          {eur(ROUND.ticket)} PER FRYER · PAID IN FULL ON PREORDER
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} noValidate style={{ background:'var(--porcelain)', border:'1px solid var(--graphite)' }}>
      <div className="split-pad" style={{ padding:'36px 40px', borderBottom:'1px solid var(--warm-200)' }}>
        <label className="field-label">Fryers — {eur(ROUND.ticket)} each · max {ROUND.maxSeatsPerInvestor}</label>
        <div style={{ display:'flex', gap: 8, marginBottom: 10 }}>
          {Array.from({length: ROUND.maxSeatsPerInvestor}).map((_, i) => {
            const n = i+1;
            return (
              <button type="button" key={n} className={`seat-toggle ${seats===n?'active':''}`} onClick={() => setSeats(n)} aria-pressed={seats===n}>
                {n}
              </button>
            );
          })}
        </div>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline' }}>
          <span className="mono" style={{ fontSize: 11, color:'var(--warm-500)', letterSpacing:'0.08em' }}>{remaining} fryers remaining</span>
          <div style={{ display:'flex', gap: 24, textAlign:'right' }}>
            <span>
              <span className="mono" style={{ display:'block', fontSize: 10, color:'var(--warm-500)', letterSpacing:'0.08em', marginBottom: 2 }}>DUE NOW · IN FULL</span>
              <span className="serif" style={{ fontSize: 30 }}>{eur(seats*ROUND.ticket)}</span>
            </span>
          </div>
        </div>
      </div>

      <div className="split-pad" style={{ padding:'32px 40px' }}>
        <div className="ds-grid-2" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap: 20, marginBottom: 20 }}>
          <div>
            <label className="field-label" htmlFor="f-name">Full name *</label>
            <input id="f-name" className={`field ${errors.name?'invalid':''}`} value={form.name} onChange={set('name')} placeholder="Jane Doe" autoComplete="name" />
          </div>
          <div>
            <label className="field-label" htmlFor="f-email">Email *</label>
            <input id="f-email" type="email" className={`field ${errors.email?'invalid':''}`} value={form.email} onChange={set('email')} placeholder="jane@fund.com" autoComplete="email" />
          </div>
          <div>
            <label className="field-label" htmlFor="f-org">Organisation</label>
            <input id="f-org" className="field" value={form.org} onChange={set('org')} placeholder="Fund / company (optional)" autoComplete="organization" />
          </div>
          <div>
            <label className="field-label" htmlFor="f-role">Customer type</label>
            <select id="f-role" className="field" value={form.role} onChange={set('role')}>
              <option>Restaurant / QSR</option>
              <option>Hotel / catering</option>
              <option>Cloud kitchen</option>
              <option>Operator group</option>
              <option>Other</option>
            </select>
          </div>
        </div>
        <div style={{ marginBottom: 24 }}>
          <label className="field-label" htmlFor="f-msg">Message (optional)</label>
          <textarea id="f-msg" className="field" rows="3" value={form.message} onChange={set('message')} placeholder="Anything you'd like us to know before we send terms." style={{ resize:'vertical' }}></textarea>
        </div>
        {(errors.name || errors.email) && (
          <div className="mono" style={{ fontSize: 11, color:'var(--red)', letterSpacing:'0.06em', marginBottom: 18 }}>
            ◆ PLEASE ENTER A VALID NAME AND EMAIL TO PREORDER YOUR FRYER.
          </div>
        )}
        <button type="submit" className="ds-btn" style={{
          width:'100%', background:'var(--amber)', color:'var(--graphite)',
          padding:'18px', fontSize: 14, fontWeight: 600, letterSpacing:'0.06em'
        }}>
          PREORDER {seats} FRYER{seats>1?'S':''} · {eur(seats*ROUND.ticket)} DUE NOW →
        </button>
        <p className="mono" style={{ fontSize: 10, color:'var(--warm-500)', lineHeight: 1.6, marginTop: 16, letterSpacing:'0.04em' }}>
          Preordering secures your fryer in the batch. {eur(ROUND.ticket)} per fryer is paid in full upfront to confirm your place.
        </p>
      </div>
    </form>
  );
}

function SeatMap({ committedSeats }) {
  const total = ROUND.totalSeats;
  const open = total - committedSeats;
  const cells = Array.from({ length: total });
  return (
    <div style={{ marginBottom: 34 }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline', marginBottom: 14 }}>
        <span className="mono" style={{ fontSize: 10, letterSpacing:'0.14em', color:'var(--warm-500)', textTransform:'uppercase' }}>Batch map · {total} fryers</span>
        <span className="mono" style={{ fontSize: 11, letterSpacing:'0.06em' }}>
          <span style={{ color:'var(--amber-deep)' }}>{committedSeats}</span>
          <span style={{ color:'var(--warm-500)' }}> preordered · {open} open</span>
        </span>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(20, 1fr)', gap: 4 }}>
        {cells.map((_, i) => {
          const taken = i < committedSeats;
          return (
            <div key={i} title={taken ? `Seat ${i+1} · preordered` : `Seat ${i+1} · open`} style={{
              aspectRatio:'1 / 1', borderRadius: 2,
              background: taken ? 'var(--amber)' : 'var(--porcelain-2)',
              border: taken ? '1px solid var(--amber)' : '1px solid var(--warm-200)',
            }} />
          );
        })}
      </div>
      <div style={{ display:'flex', gap: 20, marginTop: 14 }}>
        <span style={{ display:'flex', alignItems:'center', gap: 7 }}>
          <span style={{ width: 11, height: 11, borderRadius: 2, background:'var(--amber)', display:'inline-block' }} />
          <span className="mono" style={{ fontSize: 10, color:'var(--warm-500)', letterSpacing:'0.08em' }}>PREORDERED</span>
        </span>
        <span style={{ display:'flex', alignItems:'center', gap: 7 }}>
          <span style={{ width: 11, height: 11, borderRadius: 2, background:'var(--porcelain-2)', border:'1px solid var(--warm-200)', display:'inline-block' }} />
          <span className="mono" style={{ fontSize: 10, color:'var(--warm-500)', letterSpacing:'0.08em' }}>OPEN</span>
        </span>
      </div>
    </div>
  );
}

function CommitSection({ committedSeats, onCommit }) {
  return (
    <section id="commit" style={{ padding:'120px 0 80px' }}>
      <div className="wrap" style={{ maxWidth: 1080, margin:'0 auto', padding:'0 40px' }}>
        {window.JapanStrip && <window.JapanStrip dark={false} />}
        <div className="ds-grid-2" style={{ display:'grid', gridTemplateColumns:'0.8fr 1.2fr', gap: 60, alignItems:'start' }}>
          <div>
            <Eyebrow>Preorder & contact</Eyebrow>
            <h2 className="serif" style={{ fontSize:'clamp(34px, 4.6vw, 52px)', lineHeight:1.05, letterSpacing:'-0.01em', marginBottom: 22 }}>
              Take one of the {ROUND.totalSeats} seats.
            </h2>
            <p style={{ fontSize: 16, lineHeight: 1.6, color:'var(--slate-800)', marginBottom: 32 }}>
              Preorder below and we'll send your order confirmation and payment details. Prefer to talk first? Reach the founding team directly.
            </p>
            <SeatMap committedSeats={committedSeats} />
            <div style={{ display:'flex', flexDirection:'column', gap: 18 }}>
              {[
                { l:'Email', v:'jesse@drfry.nl', href:'mailto:jesse@drfry.nl' },
                { l:'Direct', v:'+31 6 17020696', href:'tel:+31617020696' },
                { l:'Office', v:'Monster, Netherlands', href:null },
              ].map((c, i) => (
                <div key={i} style={{ borderTop:'1px solid var(--warm-200)', paddingTop: 14 }}>
                  <div className="mono" style={{ fontSize: 10, letterSpacing:'0.14em', color:'var(--warm-500)', textTransform:'uppercase', marginBottom: 6 }}>{c.l}</div>
                  {c.href
                    ? <a href={c.href} style={{ fontSize: 16, color:'var(--graphite)', textDecoration:'none', fontWeight: 500 }}>{c.v}</a>
                    : <span style={{ fontSize: 16, color:'var(--graphite)', fontWeight: 500 }}>{c.v}</span>}
                </div>
              ))}
            </div>
          </div>
          <CommitForm committedSeats={committedSeats} onCommit={onCommit} />
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────
// Certifications strip — regional approvals, under the contact form
// ─────────────────────────────────────────────────────────────────
function CertMark({ kind }) {
  const common = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.6 };
  if (kind === 'UL') {
    return (
      <svg width="38" height="38" viewBox="0 0 40 40" aria-hidden="true">
        <circle cx="20" cy="20" r="18" {...common} />
        <text x="20" y="25" textAnchor="middle" fontFamily="DM Serif Display, serif" fontSize="15" fill="currentColor">UL</text>
      </svg>
    );
  }
  if (kind === 'RCM') {
    return (
      <svg width="38" height="38" viewBox="0 0 40 40" aria-hidden="true">
        <path d="M8 8 L24 20 L8 32" {...common} strokeLinejoin="round" strokeLinecap="round" />
        <path d="M20 8 L36 20 L20 32" {...common} strokeLinejoin="round" strokeLinecap="round" opacity="0.55" />
      </svg>
    );
  }
  return (
    <svg width="38" height="38" viewBox="0 0 40 40" aria-hidden="true">
      <rect x="20" y="2" width="25.4" height="25.4" transform="rotate(45 20 2)" {...common} />
      <text x="20" y="24" textAnchor="middle" fontFamily="IBM Plex Mono, monospace" fontSize="8" fill="currentColor">PSE</text>
    </svg>
  );
}

function CertStrip() {
  const certs = [
    { mark:'UL',  region:'United States', std:'UL Listed', spec:'120 V / 60 Hz' },
    { mark:'RCM', region:'Australia & NZ', std:'RCM / SAA certified', spec:'230 V / 50 Hz' },
    { mark:'PSE', region:'Japan', std:'PSE approved', spec:'100 V / 50–60 Hz' },
  ];
  return (
    <section id="certifications" style={{ padding:'0 0 90px' }}>
      <div className="wrap" style={{ maxWidth: 1080, margin:'0 auto', padding:'0 40px' }}>
        <div style={{ display:'flex', alignItems:'center', gap: 14, marginBottom: 22 }}>
          <span className="mono" style={{ fontSize: 10, letterSpacing:'0.16em', textTransform:'uppercase', color:'var(--warm-500)' }}>Certified hardware</span>
          <span style={{ flex:1, height:1, background:'var(--warm-200)' }} />
        </div>
        <div className="ds-grid-3" style={{ display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap: 0, border:'1px solid var(--warm-200)' }}>
          {certs.map((c, i) => (
            <div key={i} style={{
              padding:'26px 28px', display:'flex', alignItems:'center', gap: 18,
              borderRight: i < certs.length-1 ? '1px solid var(--warm-200)' : 'none',
            }}>
              <div style={{ color:'var(--graphite)', flexShrink:0 }}><CertMark kind={c.mark} /></div>
              <div>
                <div className="mono" style={{ fontSize: 9, letterSpacing:'0.14em', color:'var(--warm-500)', textTransform:'uppercase', marginBottom: 5 }}>{c.region}</div>
                <div className="serif" style={{ fontSize: 19, lineHeight: 1.1, marginBottom: 4 }}>{c.std}</div>
                <div className="mono" style={{ fontSize: 11, color:'var(--slate-800)' }}>{c.spec}</div>
              </div>
            </div>
          ))}
        </div>
        <div className="mono" style={{ fontSize: 10, color:'var(--warm-500)', letterSpacing:'0.06em', marginTop: 14, lineHeight: 1.6, display:'flex', alignItems:'center', gap: 10 }}>
          <span className="mono" style={{ fontSize: 9, letterSpacing:'0.12em', textTransform:'uppercase', color:'var(--amber-deep)', border:'1px solid var(--amber)', padding:'2px 7px', whiteSpace:'nowrap' }}>CE in progress</span>
          <span>Building on existing 230 V / 50 Hz (RCM/SAA) approval · part of what this batch funds · EU pilots run as founding-customer trials until the mark issues</span>
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────
// Footer
// ─────────────────────────────────────────────────────────────────
function Footer() {
  return (
    <footer style={{ background:'var(--graphite)', color:'var(--warm-500)', padding:'56px 40px 40px' }}>
      <div className="wrap" style={{ maxWidth: 1080, margin:'0 auto', display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap: 20 }}>
        <Logo light />
        <div className="mono" style={{ fontSize: 10, letterSpacing:'0.14em', textAlign:'right' }}>
          © 2026 ENF CORP. JAPAN · FOUNDING BATCH<br/>
          <span style={{ color:'#4a4d51' }}>INDICATIVE PRICING · NOT A BINDING ORDER</span>
        </div>
      </div>
    </footer>
  );
}

// ─────────────────────────────────────────────────────────────────
// Pool Journey — scroll-driven, left→right cinematic explainer of the
// subscription counter and where the pooled money goes.
// ─────────────────────────────────────────────────────────────────
function smooth(t){ return t * t * (3 - 2 * t); }
// easeInOutCubic — steeper mid-slope than smoothstep, so the camera visibly
// ramps up in speed through the middle of each pan instead of gliding linearly.
function ramp(t){ return t < 0.5 ? 4*t*t*t : 1 - Math.pow(-2*t + 2, 3) / 2; }
function jclamp(v, a, b){ return Math.max(a, Math.min(b, v)); }
function jlerp(a, b, t){ return a + (b - a) * t; }

function PoolJourney({ committedSeats }) {
  const sectionRef = useRef(null);
  const trackRef = useRef(null);
  const sceneRefs = useRef([]);
  const railRef = useRef(null);
  const pctRef = useRef(null);
  const prevCamRef = useRef(0);
  const reduceRef = useRef(false);

  const committedCapital = committedSeats * ROUND.ticket;
  const seatPct = Math.min(100, (committedSeats / ROUND.totalSeats) * 100);

  const use = [
    { tag:'01', big: eur(ROUND.ticket), label:'Your preorder, held in full', place:'Secured against your fryer',
      body:`Your preorder reserves one of the ${ROUND.totalSeats} fryers in the founding batch — ${eur(ROUND.ticket)}, paid in full, holds your unit and your place in the run.` },
    { tag:'02', big: `${ROUND.totalSeats} / ${ROUND.totalSeats}`, label:'The batch closes', place:'Order locks',
      body:`Once all ${ROUND.totalSeats} fryers are spoken for — or on ${ROUND.closeDate} — the founding batch closes and the production order locks.` },
    { tag:'03', big: '1 batch', label:'Built in Japan', place:'Manufacturer · Japan',
      body:`A single production run of ${ROUND.batchUnits} ProWave™ units is placed with the manufacturer in Japan and built for the founding kitchens.` },
    { tag:'04', big: '< 2h', label:'Installed & running', place:'Your kitchen',
      body:'Each fryer is mounted inline on your oil feed, calibrated, and brought live — cash positive from the very first month.' },
  ];
  const scenes = [{ kind:'pool' }, { kind:'anchor' }, ...use.map(u => ({ kind:'use', ...u })), { kind:'return' }];
  const N = scenes.length;

  useEffect(() => {
    reduceRef.current = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    let raf = 0;
    let settle = 0;
    let forceCrisp = false;
    const update = () => {
      raf = 0;
      const sec = sectionRef.current; if (!sec) return;
      const rect = sec.getBoundingClientRect();
      const total = Math.max(1, sec.offsetHeight - window.innerHeight);
      const p = jclamp((-rect.top) / total, 0, 1);
      const camRaw = p * (N - 1);
      // Dwell mapping: hold each scene centered for the first ~22% of its
      // segment, then whip to the next with an accelerating (easeInOutCubic) pan.
      const idx = Math.min(N - 2, Math.floor(camRaw));
      const frac = jclamp(camRaw - idx, 0, 1);
      const move = frac < 0.22 ? 0 : ramp((frac - 0.22) / 0.78);
      const cam = (camRaw >= N - 1) ? (N - 1) : (idx + move);
      const w = window.innerWidth;

      // Camera velocity (scene-units / frame) drives a motion blur that peaks
      // during the fast part of each pan and resolves to crisp at every rest point.
      const vel = forceCrisp ? 0 : Math.abs(cam - prevCamRef.current);
      prevCamRef.current = cam;
      const blurPx = reduceRef.current ? 0 : Math.min(9, vel * 130);
      const stretch = reduceRef.current ? 0 : Math.min(0.05, vel * 0.9);

      if (trackRef.current) {
        trackRef.current.style.transform = `translate3d(${(-cam * w).toFixed(1)}px,0,0)`;
        trackRef.current.style.filter = blurPx > 0.2 ? `blur(${blurPx.toFixed(2)}px)` : 'none';
      }
      sceneRefs.current.forEach((el, i) => {
        if (!el) return;
        const f = smooth(jclamp(1 - Math.abs(cam - i), 0, 1));
        el.style.opacity = f.toFixed(3);
        const sc = jlerp(0.6, 1, f);
        // horizontal stretch during motion reinforces the sense of speed
        el.style.transform = `translateY(${jlerp(34, 0, f).toFixed(1)}px) scale(${(sc*(1+stretch)).toFixed(4)}, ${sc.toFixed(4)})`;
        el.style.pointerEvents = f > 0.6 ? 'auto' : 'none';
      });
      if (railRef.current) railRef.current.style.width = (p * 100).toFixed(2) + '%';
      if (pctRef.current) pctRef.current.textContent = String(Math.round(p * 100)).padStart(3, '0');
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
      // Once scrolling stops, re-render one crisp frame (vel forced to 0) so no
      // residual blur / stretch lingers at the rest point.
      clearTimeout(settle);
      settle = setTimeout(() => { forceCrisp = true; update(); forceCrisp = false; }, 90);
    };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    const t = setTimeout(update, 200);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      clearTimeout(t); clearTimeout(settle); if (raf) cancelAnimationFrame(raf);
    };
  }, [N]);

  const renderScene = (s) => {
    if (s.kind === 'pool') {
      return (
        <div>
          <Eyebrow light>Batch preorders · Live</Eyebrow>
          <div className="serif" style={{ fontSize:'clamp(64px,11vw,168px)', lineHeight:0.9, letterSpacing:'-0.02em' }}>{ROUND.totalSeats}<span style={{ fontSize:'0.28em', letterSpacing:'0.02em', color:'var(--warm-500)', marginLeft:14 }}>fryers</span></div>
          <p style={{ fontSize:'clamp(16px,1.7vw,21px)', color:'var(--warm-500)', marginTop:18, maxWidth:660, lineHeight:1.5 }}>
            One founding batch — <strong style={{ color:'var(--porcelain)' }}>{ROUND.totalSeats} fryers</strong> at <strong style={{ color:'var(--porcelain)' }}>{eur(ROUND.ticket)}</strong> each, paid in full on preorder. Reserve yours before the batch closes.
          </p>
          <div style={{ marginTop:38, maxWidth:680 }}>
            <div style={{ height:12, background:'#23262a', position:'relative', overflow:'hidden' }}>
              <div style={{ position:'absolute', inset:'0 auto 0 0', width:`${seatPct}%`, background:'var(--amber)', transition:'width .6s cubic-bezier(.2,.7,.2,1)' }} />
              {Array.from({ length:9 }).map((_, k) => (
                <div key={k} style={{ position:'absolute', top:0, bottom:0, left:`${(k+1)*10}%`, width:1, background:'rgba(250,250,250,0.12)' }} />
              ))}
            </div>
            <div className="mono" style={{ display:'flex', justifyContent:'space-between', marginTop:12, fontSize:12, color:'var(--warm-500)', letterSpacing:'0.06em' }}>
              <span><span style={{ color:'var(--amber)' }}>{committedSeats}</span> / {ROUND.totalSeats} FRYERS PREORDERED</span>
              <span>CLOSES {ROUND.closeDate}</span>
            </div>
          </div>
        </div>
      );
    }
    if (s.kind === 'anchor') {
      return (
        <div className="pj-cols">
          <div>
            <Eyebrow light>What the hardware is worth</Eyebrow>
            <div style={{ display:'flex', alignItems:'baseline', gap:16, color:'var(--warm-500)', flexWrap:'wrap' }}>
              <span className="serif" style={{ fontSize:'clamp(34px,5vw,64px)', lineHeight:0.95, textDecoration:'line-through', textDecorationColor:'rgba(107,114,128,0.5)' }}>{eur(ROUND.listPrice)}</span>
              <span className="mono" style={{ fontSize:11, letterSpacing:'0.14em' }}>LIST · AFTER FOUNDER PROGRAMME</span>
            </div>
            <div style={{ display:'flex', alignItems:'baseline', gap:16, marginTop:18, flexWrap:'wrap' }}>
              <span className="serif" style={{ fontSize:'clamp(52px,8.5vw,118px)', color:'var(--amber)', lineHeight:0.82 }}>{eur(ROUND.founderPrice)}</span>
              <span className="mono" style={{ fontSize:11, letterSpacing:'0.14em', color:'var(--warm-500)' }}>FOUNDING CUSTOMER / FRYER</span>
            </div>
          </div>
          <div>
            <p style={{ fontSize:'clamp(16px,1.7vw,21px)', lineHeight:1.6, color:'var(--porcelain)' }}>
              One seat is one fryer. Founding customers take it at <strong style={{ color:'var(--amber)' }}>{eur(ROUND.founderPrice)}</strong> — below the <strong>{eur(ROUND.listPrice)}</strong> list it returns to once the programme closes — paid in full at <strong>{eur(ROUND.ticket)}</strong> upfront.
            </p>
            <div className="mono" style={{ marginTop:24, fontSize:11, letterSpacing:'0.06em', color:'var(--warm-500)', lineHeight:1.7, borderLeft:'2px solid var(--amber)', paddingLeft:14 }}>
              ANCHOR · {eur(ROUND.listPrice)} is the published list price. The founding programme holds it at {eur(ROUND.founderPrice)} — and the oil saved covers it from the first month.
            </div>
          </div>
        </div>
      );
    }
    if (s.kind === 'use') {
      const stepPct = Math.round(Number(s.tag) / use.length * 100);
      return (
        <div className="pj-cols">
          <div>
            <div className="mono" style={{ fontSize:11, letterSpacing:'0.18em', color:'var(--amber)', marginBottom:18 }}>YOUR PREORDER · STEP {s.tag} OF {String(use.length).padStart(2,'0')}</div>
            <div className="serif" style={{ fontSize:'clamp(52px,8vw,110px)', lineHeight:0.85, letterSpacing:'-0.02em' }}>{s.big}</div>
            <div style={{ fontSize:'clamp(17px,1.9vw,24px)', marginTop:18, fontWeight:500 }}>{s.label}</div>
            <div className="mono" style={{ fontSize:11, letterSpacing:'0.1em', color:'var(--warm-500)', marginTop:8 }}>{s.place.toUpperCase()}</div>
          </div>
          <div>
            <p style={{ fontSize:'clamp(15px,1.6vw,19px)', lineHeight:1.65, color:'var(--porcelain)', marginBottom:30 }}>{s.body}</p>
            <div className="mono" style={{ display:'flex', justifyContent:'space-between', fontSize:10, letterSpacing:'0.12em', color:'var(--warm-500)', marginBottom:8 }}>
              <span>JOURNEY</span><span style={{ color:'var(--amber)' }}>STEP {s.tag} / {String(use.length).padStart(2,'0')}</span>
            </div>
            <div style={{ height:8, background:'#23262a', position:'relative' }}>
              <div style={{ position:'absolute', inset:'0 auto 0 0', width:`${stepPct}%`, background:'var(--amber)', transition:'width .5s ease' }} />
            </div>
          </div>
        </div>
      );
    }
    // return
    return (
      <div>
        <Eyebrow light>The economics on site</Eyebrow>
        <div className="pj-cols">
          <div>
            <div className="serif" style={{ fontSize:'clamp(56px,9vw,128px)', lineHeight:0.82, letterSpacing:'-0.02em', color:'var(--amber)' }}>Month 1</div>
            <div className="mono" style={{ fontSize:11, letterSpacing:'0.16em', color:'var(--warm-500)', marginTop:18 }}>CASH POSITIVE · EVERY SITE</div>
          </div>
          <div>
            <p style={{ fontSize:'clamp(16px,1.7vw,21px)', lineHeight:1.6, color:'var(--porcelain)' }}>
              A fryer costs a kitchen <strong>{eur(ROUND.founderPrice)}</strong> to own — paid in full upfront — and the oil it saves is worth more than that from the very first month. Every deployment runs <strong style={{ color:'var(--amber)' }}>cash positive from month one</strong>. Founding customers benefit from reduced oil costs, with savings proportional to their oil usage.
            </p>
            <div className="mono" style={{ marginTop:24, fontSize:11, letterSpacing:'0.06em', color:'var(--warm-500)', lineHeight:1.7, borderLeft:'2px solid var(--amber)', paddingLeft:14 }}>
              HOW · ProWave arrests oil oxidation at the source. Kitchens buy less oil and bin less waste — and that recurring saving is what keeps every site cash positive.
            </div>
            <a href="#commit" className="ds-btn" style={{ display:'inline-block', marginTop:30, background:'var(--amber)', color:'var(--graphite)', padding:'15px 26px', textDecoration:'none', fontSize:13, fontWeight:600, letterSpacing:'0.05em' }}>PREORDER A FRYER →</a>
          </div>
        </div>
        <div className="mono" style={{ marginTop:34, fontSize:10, color:'var(--warm-500)', lineHeight:1.6, maxWidth:760 }}>
          INDICATIVE · Figures illustrate the founding-batch structure and pricing. Final pricing is confirmed on your order form.
        </div>
      </div>
    );
  };

  return (
    <section id="allocation" ref={sectionRef} style={{ height:`${N * 80}vh`, position:'relative', background:'var(--graphite)', color:'var(--porcelain)' }}>
      <div style={{ position:'sticky', top:0, height:'100vh', overflow:'hidden' }}>
        {/* persistent header */}
        <div style={{ position:'absolute', top:0, left:0, right:0, padding:'94px 6vw 0', display:'flex', justifyContent:'space-between', zIndex:5, pointerEvents:'none' }}>
          <div className="mono" style={{ fontSize:10, letterSpacing:'0.22em', color:'var(--warm-500)' }}>THE FOUNDING BATCH</div>
          <div className="mono" style={{ fontSize:10, letterSpacing:'0.22em', color:'var(--warm-500)' }}>SCROLL · <span ref={pctRef}>000</span>%</div>
        </div>

        {/* horizontal track of scenes */}
        <div ref={trackRef} style={{ display:'flex', height:'100%', willChange:'transform' }}>
          {scenes.map((s, i) => (
            <div key={i} style={{ width:'100vw', height:'100%', flex:'0 0 100vw', display:'flex', alignItems:'center', justifyContent:'center', padding:'0 6vw' }}>
              <div ref={el => sceneRefs.current[i] = el} style={{ width:'100%', maxWidth:1040, willChange:'transform, opacity' }}>
                {renderScene(s)}
              </div>
            </div>
          ))}
        </div>

        {/* bottom progress rail */}
        <div style={{ position:'absolute', left:'6vw', right:'6vw', bottom:48, zIndex:5 }}>
          <div style={{ height:2, background:'#2a2d31', position:'relative' }}>
            <div ref={railRef} style={{ position:'absolute', left:0, top:0, bottom:0, width:'0%', background:'var(--amber)' }} />
            {scenes.map((_, i) => (
              <div key={i} style={{ position:'absolute', top:-3, left:`${i / (N - 1) * 100}%`, width:8, height:8, marginLeft:-4, background:'var(--graphite)', border:'1px solid var(--warm-500)', transform:'rotate(45deg)' }} />
            ))}
          </div>
        </div>
      </div>

      <style>{`
        .pj-cols { display:grid; grid-template-columns:0.95fr 1.05fr; gap:64px; align-items:center; }
        @media (max-width:820px){ .pj-cols { grid-template-columns:1fr; gap:28px; } }
      `}</style>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────
// App
// ─────────────────────────────────────────────────────────────────
function App() {
  const [userSeats, setUserSeats] = useState(() => readCommittedSeats());
  const committedSeats = Math.min(ROUND.totalSeats, userSeats);
  const refresh = () => setUserSeats(readCommittedSeats());

  return (
    <>
      <Nav />
      <Hero committedSeats={committedSeats} />
      <PoolJourney committedSeats={committedSeats} />
      <HowItWorks />
      <CommitSection committedSeats={committedSeats} onCommit={refresh} />
      <CertStrip />
      <Footer />
    </>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
