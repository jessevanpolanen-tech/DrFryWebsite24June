// Testimonials — field voices from kitchens, care homes and family tables.
// Drawn from recorded customer interviews (timestamps reference source footage).
const { useState } = React;

// ─────────────────────────────────────────────────────────────────
// Nav (links resolve back to the main page)
// ─────────────────────────────────────────────────────────────────
function Nav() {
  return (
    <nav style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 60,
      padding: '18px 32px',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      background: 'rgba(250,250,250,0.7)',
      backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)',
      borderBottom: '1px solid var(--warm-200)', fontSize: 13,
    }}>
      <a href="index.html" style={{ display:'flex', alignItems:'center', gap: 10, textDecoration:'none', color:'var(--graphite)' }}>
        <svg width="22" height="22" viewBox="0 0 22 22">
          <circle cx="11" cy="11" r="2" fill="var(--amber)"/>
          <circle cx="11" cy="11" r="6" fill="none" stroke="var(--amber)" strokeWidth="0.8"/>
          <circle cx="11" cy="11" r="10" fill="none" stroke="var(--amber)" strokeWidth="0.6" opacity="0.5"/>
        </svg>
        <span className="serif" style={{ fontSize: 18, letterSpacing: '0.01em' }}>Dr. Fry</span>
        <span className="mono" style={{ fontSize: 10, color: 'var(--warm-500)', letterSpacing:'0.15em', marginLeft: 4 }}>ProWave™ EU</span>
      </a>
      <div className="ds-nav-links" style={{ display: 'flex', gap: 32, color: 'var(--slate-800)' }}>
        {[
          ['Technology', 'index.html#technology'],
          ['Evidence', 'index.html#evidence'],
          ['Savings', 'index.html#savings'],
          ['Testimonials', 'Testimonials.html'],
          ['Specifications', 'index.html#specifications'],
          ['Support', 'index.html#support'],
        ].map(([label, href]) => (
          <a key={label} className="ds-navlink" href={href} style={{
            color: label === 'Testimonials' ? 'var(--amber-deep)' : 'inherit',
            textDecoration: 'none', fontSize: 13,
            fontWeight: label === 'Testimonials' ? 600 : 500
          }}>{label}</a>
        ))}
      </div>
      <div style={{ display:'flex', gap: 12, alignItems:'center' }}>
        <span className="mono" style={{ fontSize: 10, color:'var(--warm-500)', letterSpacing:'0.15em' }}>EN · €</span>
        <a className="ds-btn" href="Request Assessment.html" style={{
          background: 'var(--graphite)', color: 'var(--porcelain)',
          padding: '10px 18px', textDecoration: 'none', fontSize: 12, fontWeight: 500,
          letterSpacing: '0.06em'
        }}>REQUEST ASSESSMENT →</a>
      </div>
    </nav>
  );
}

function Eyebrow({ num, children, light }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 14,
      fontFamily: "'IBM Plex Mono', monospace",
      fontSize: 11, letterSpacing: '0.18em', textTransform: 'uppercase',
      color: light ? 'var(--warm-500)' : 'var(--warm-500)', marginBottom: 28
    }}>
      <span style={{ color: 'var(--amber-deep)' }}>{num}</span>
      <span style={{ width: 28, height: 1, background: light ? '#2a2d31' : 'var(--warm-200)' }} />
      <span>{children}</span>
    </div>
  );
}

function Quote() {
  return (
    <svg width="34" height="26" viewBox="0 0 34 26" aria-hidden="true" style={{ display:'block' }}>
      <path d="M0 26V14C0 6 4 1 13 0l1 4C9 5 6 8 6 12h6v14H0zm20 0V14C20 6 24 1 33 0l1 4c-5 1-8 4-8 8h6v14H20z" fill="var(--amber)"/>
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────────
// Data — paraphrased from recorded customer interviews
// ─────────────────────────────────────────────────────────────────
const TS = [
  { tag:'DEMAND',     title:'Kids won’t eat homemade anymore',
    body:'Mothers tell us their children refuse home-cooked karaage — they’ll only eat the batch that comes out of our fryer.',
    who:'Shop owner', ts:'10:33' },
  { tag:'TEXTURE',    title:'Moist inside, never dry',
    body:'Side by side the difference is plain — juicy through the middle instead of the dry, crumbly texture we used to live with.',
    who:'Kitchen lead', ts:'03:53' },
  { tag:'SKILL',      title:'Professional results, no training',
    body:'One owner almost apologised: they’re turning out restaurant-quality food without a day of professional training.',
    who:'Shop owner', ts:'08:11' },
  { tag:'HEALTH',     title:'Eating meat daily again — at 85',
    body:'Hadn’t touched fried meat in ten years. Now eats it every single day; the lighter oil is what made it possible.',
    who:'Care-home diner, 85', ts:'1:20:42', feature:true },
  { tag:'TEXTURE',    title:'The juiciest eggplant they’d tasted',
    body:'A child said they’d never had eggplant so juicy.',
    who:'Family diner', ts:'1:36:00' },
  { tag:'OPERATIONS', title:'The glass barely needs cleaning',
    body:'One light wipe a day instead of constant scrubbing — the oil simply doesn’t cake on the way it used to.',
    who:'Kitchen staff', ts:'06:22' },
  { tag:'SPEED',      title:'Frying time cut in half',
    body:'Four minutes down to two. Same food on the plate, half the wait at the fryer.',
    who:'Line cook', ts:'06:49' },
  { tag:'BUSINESS',   title:'Donut sales jumped',
    body:'After the switch, donut sales climbed sharply — regulars noticed the difference and kept coming back.',
    who:'Bakery owner', ts:'01:50', feature:true },
  { tag:'SAFETY',     title:'No more burns',
    body:'We used to get burned at the fryer constantly. Since installing, not once.',
    who:'Line cook', ts:'04:27' },
  { tag:'QUALITY',    title:'Frying vegetables “shouldn’t” work',
    body:'Professional chefs insist you can’t deep-fry vegetables properly. Dr. Fry does exactly that.',
    who:'Professional chef', ts:'1:18:39' },
];

function TsChip({ children, dark }) {
  return (
    <span className="mono" style={{
      fontSize: 10, letterSpacing:'0.12em',
      color: dark ? 'var(--warm-500)' : 'var(--warm-500)',
      border: `1px solid ${dark ? '#2a2d31' : 'var(--warm-200)'}`,
      padding:'4px 8px', whiteSpace:'nowrap'
    }}>{children}</span>
  );
}

function FeatureCard({ d }) {
  return (
    <article style={{
      gridColumn: '1 / -1',
      background: 'var(--graphite)', color: 'var(--porcelain)',
      padding: '48px 48px 40px',
      display:'grid', gridTemplateColumns:'minmax(0,1fr) 280px', gap: 48, alignItems:'start'
    }} className="ds-feature">
      <div>
        <Quote />
        <p className="serif" style={{ fontSize: 'clamp(28px,3.4vw,44px)', lineHeight: 1.15, letterSpacing:'-0.01em', marginTop: 20 }}>
          {d.body}
        </p>
      </div>
      <div style={{ borderLeft:'1px solid #2a2d31', paddingLeft: 28, alignSelf:'stretch' }} className="ds-feature-meta">
        <div className="mono" style={{ fontSize: 10, letterSpacing:'0.18em', color:'var(--amber)' }}>{d.tag}</div>
        <div className="serif" style={{ fontSize: 22, marginTop: 16, lineHeight: 1.2 }}>{d.title}</div>
        <div className="mono" style={{ fontSize: 11, color:'var(--warm-500)', marginTop: 18, letterSpacing:'0.06em' }}>{d.who.toUpperCase()}</div>
        <div style={{ marginTop: 18 }}><TsChip dark>SOURCE · {d.ts}</TsChip></div>
      </div>
    </article>
  );
}

function Card({ d }) {
  return (
    <article style={{
      borderTop: '1px solid var(--graphite)', paddingTop: 22,
      display:'flex', flexDirection:'column', minHeight: 230
    }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom: 18 }}>
        <span className="mono" style={{ fontSize: 10, letterSpacing:'0.16em', color:'var(--amber-deep)' }}>{d.tag}</span>
        <TsChip>{d.ts}</TsChip>
      </div>
      <h3 className="serif" style={{ fontSize: 25, lineHeight: 1.15, letterSpacing:'-0.01em', marginBottom: 14 }}>{d.title}</h3>
      <p style={{ fontSize: 15, lineHeight: 1.55, color: 'var(--slate-800)', marginBottom: 22 }}>{d.body}</p>
      <div className="mono" style={{ fontSize: 11, color:'var(--warm-500)', letterSpacing:'0.06em', marginTop:'auto' }}>{d.who.toUpperCase()}</div>
    </article>
  );
}

function App() {
  const features = TS.filter(t => t.feature);
  const rest = TS.filter(t => !t.feature);

  return (
    <>
      <Nav />

      {/* Header */}
      <section style={{ padding: '150px 0 70px', background: 'var(--porcelain)' }}>
        <div style={{ maxWidth: 980, margin: '0 auto', padding: '0 40px' }}>
          <Eyebrow num="07 / VOICES">From the kitchens that fry every day</Eyebrow>
          <h1 className="serif" style={{ fontSize: 'clamp(40px,6vw,64px)', lineHeight: 1.04, letterSpacing:'-0.015em', maxWidth: 820, marginBottom: 26 }}>
            What changes when the oil stops working against you.
          </h1>
          <p style={{ fontSize: 19, lineHeight: 1.55, color: 'var(--slate-800)', maxWidth: 620 }}>
            Unscripted reactions from shop owners, line cooks, care-home cooks and the people they feed — recorded on site, in real kitchens.
          </p>

          {/* Hard-number strip */}
          <div className="ds-stat-strip" style={{
            display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap: 24,
            marginTop: 56, borderTop:'1px solid var(--warm-200)', paddingTop: 30
          }}>
            {[
              ['−50%', 'Frying time', '4 min → 2 min'],
              ['1×', 'Daily cleaning', 'one light wipe'],
              ['0', 'Fryer burns', 'reported since install'],
            ].map(([k,l,s]) => (
              <div key={l}>
                <div className="serif" style={{ fontSize: 48, lineHeight: 1, letterSpacing:'-0.02em' }}>{k}</div>
                <div style={{ fontSize: 14, fontWeight: 500, marginTop: 12 }}>{l}</div>
                <div className="mono" style={{ fontSize: 10, color:'var(--warm-500)', letterSpacing:'0.1em', marginTop: 6, textTransform:'uppercase' }}>{s}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Grid */}
      <section style={{ padding: '20px 0 120px', background: 'var(--porcelain)' }}>
        <div style={{ maxWidth: 980, margin: '0 auto', padding: '0 40px' }}>
          <div className="ds-ts-grid" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap: 40 }}>
            {features[0] && <FeatureCard d={features[0]} />}
            {rest.slice(0, 4).map((d,i) => <Card key={i} d={d} />)}
            {features[1] && <FeatureCard d={features[1]} />}
            {rest.slice(4).map((d,i) => <Card key={i} d={d} />)}
          </div>

          {/* Provenance note */}
          <p className="mono" style={{ fontSize: 11, color:'var(--warm-500)', lineHeight: 1.6, marginTop: 56, maxWidth: 720 }}>
            SOURCE · Paraphrased from recorded customer interviews and field footage. Timestamps reference the original recordings. Individual results vary by product, line and oil.
          </p>
        </div>
      </section>

      {/* CTA */}
      <section style={{ background: 'var(--graphite)', color:'var(--porcelain)', padding: '90px 0' }}>
        <div style={{ maxWidth: 980, margin:'0 auto', padding:'0 40px' }}>
          {window.JapanStrip && <window.JapanStrip dark={true} />}
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', gap: 40, flexWrap:'wrap' }}>
            <div>
              <div className="serif" style={{ fontSize: 'clamp(28px,3.4vw,38px)', lineHeight: 1.1 }}>Hear it in your own kitchen.</div>
              <div className="mono" style={{ fontSize: 11, color:'var(--warm-500)', letterSpacing:'0.1em', marginTop: 12 }}>
                28-DAY MEASURED TRIAL · NO CHARGE IF NO MEASURED RESULT
              </div>
            </div>
            <a className="ds-btn" href="Request Assessment.html" style={{
              background:'var(--amber)', color:'var(--graphite)', padding:'18px 28px',
              textDecoration:'none', fontSize: 13, fontWeight: 600, letterSpacing:'0.06em', whiteSpace:'nowrap'
            }}>REQUEST TRIAL →</a>
          </div>
        </div>
      </section>

      <footer style={{
        padding: '60px 40px 40px', background: 'var(--graphite)', color: 'var(--warm-500)',
        borderTop: '1px solid #23262a', fontSize: 12,
        display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap: 16
      }}>
        <div style={{ display:'flex', gap: 16, alignItems:'center' }}>
          <svg width="18" height="18" viewBox="0 0 22 22">
            <circle cx="11" cy="11" r="2" fill="var(--amber)"/>
            <circle cx="11" cy="11" r="6" fill="none" stroke="var(--amber)" strokeWidth="0.8"/>
          </svg>
          <span className="serif" style={{ color:'var(--porcelain)', fontSize: 16 }}>Dr. Fry</span>
          <span className="mono" style={{ fontSize: 10, letterSpacing:'0.15em' }}>PROWAVE™ EU · ROTTERDAM</span>
        </div>
        <div className="mono" style={{ fontSize: 10, letterSpacing:'0.15em' }}>
          © 2026 ENF CORP. JAPAN · UL · RCM/SAA · PSE · CE IN PROGRESS
        </div>
      </footer>
    </>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
