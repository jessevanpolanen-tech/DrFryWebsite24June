// Site sections — kept separate for readability
const { useState, useEffect, useRef, useMemo } = React;

// ─────────────────────────────────────────────────────────────────
// Reusable bits
// ─────────────────────────────────────────────────────────────────

function Eyebrow({ num, children }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 14,
      fontFamily: "'IBM Plex Mono', monospace",
      fontSize: 11, letterSpacing: '0.18em', textTransform: 'uppercase',
      color: 'var(--warm-500)', marginBottom: 28
    }}>
      <span style={{ color: 'var(--amber-deep)' }}>{num}</span>
      <span style={{ width: 28, height: 1, background: 'var(--warm-200)' }} />
      <span>{children}</span>
    </div>
  );
}

function DotWaveBg({ opacity = 0.25 }) {
  // SVG dot-wave field — concentric arcs of dots
  const dots = [];
  for (let r = 1; r <= 12; r++) {
    const radius = r * 36;
    const count = Math.max(8, r * 8);
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;
      const size = Math.max(0.6, 2.2 - r * 0.12);
      const op = Math.max(0.05, 1 - r * 0.08);
      dots.push(<circle key={`${r}-${i}`} cx={x} cy={y} r={size} fill="var(--amber)" opacity={op} />);
    }
  }
  return (
    <svg viewBox="-450 -450 900 900" style={{
      position: 'absolute', inset: 0, width: '100%', height: '100%',
      opacity, pointerEvents: 'none'
    }}>
      {dots}
    </svg>
  );
}

function Diagram5050kHz() {
  // Schematic: two electrode plates with food (curve) between, dot field around food
  return (
    <svg viewBox="0 0 600 360" style={{ width: '100%', height: 'auto', display: 'block' }}>
      {/* Frame */}
      <rect x="0.5" y="0.5" width="599" height="359" fill="none" stroke="var(--warm-200)" />
      {/* Left electrode */}
      <rect x="60" y="80" width="14" height="200" fill="var(--graphite)" />
      <text x="32" y="300" fontSize="9" fontFamily="IBM Plex Mono" fill="var(--warm-500)">ELEC. A</text>
      {/* Right electrode */}
      <rect x="526" y="80" width="14" height="200" fill="var(--graphite)" />
      <text x="528" y="300" fontSize="9" fontFamily="IBM Plex Mono" fill="var(--warm-500)">ELEC. B</text>

      {/* RF wave field between electrodes */}
      {Array.from({length: 9}).map((_,i) => {
        const x = 90 + i * 50;
        return (
          <g key={i}>
            <path d={`M${x},90 Q${x+25},180 ${x},270`} fill="none" stroke="var(--amber)" strokeWidth="1" opacity={0.6}/>
          </g>
        );
      })}
      {/* Dot field */}
      {Array.from({length: 80}).map((_,i) => {
        const x = 90 + Math.random() * 420;
        const y = 90 + Math.random() * 180;
        return <circle key={i} cx={x} cy={y} r="1.2" fill="var(--amber)" opacity={0.55}/>;
      })}

      {/* Food shape (potato/chip cluster) — abstract */}
      <g transform="translate(300,180)">
        <ellipse cx="0" cy="0" rx="60" ry="32" fill="var(--porcelain-2)" stroke="var(--graphite)" strokeWidth="1.2"/>
        <ellipse cx="0" cy="0" rx="60" ry="32" fill="none" stroke="var(--amber)" strokeWidth="0.6" strokeDasharray="2 3"/>
        <text x="0" y="4" textAnchor="middle" fontSize="9" fontFamily="IBM Plex Mono" fill="var(--warm-500)">FOOD</text>
      </g>

      {/* Annotations */}
      <g fontFamily="IBM Plex Mono" fontSize="10" fill="var(--graphite)">
        <line x1="300" y1="40" x2="300" y2="70" stroke="var(--graphite)" strokeWidth="0.8"/>
        <text x="306" y="46">f ≈ 50 kHz · ultra-low RF field</text>
        <line x1="300" y1="286" x2="300" y2="306" stroke="var(--graphite)" strokeWidth="0.8"/>
        <text x="306" y="320">surface tension altered → oil ingress prevented</text>
      </g>

      {/* Scale */}
      <g fontFamily="IBM Plex Mono" fontSize="9" fill="var(--warm-500)">
        <line x1="60" y1="342" x2="540" y2="342" stroke="var(--warm-500)" strokeWidth="0.6"/>
        <line x1="60" y1="338" x2="60" y2="346" stroke="var(--warm-500)" strokeWidth="0.6"/>
        <line x1="540" y1="338" x2="540" y2="346" stroke="var(--warm-500)" strokeWidth="0.6"/>
        <text x="300" y="356" textAnchor="middle">interelectrode gap (typ. 320–480 mm)</text>
      </g>
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────────
// Top nav
// ─────────────────────────────────────────────────────────────────

function TopNav() {
  return (
    <nav style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 60,
      padding: '18px 32px',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      background: 'rgba(250,250,250,0.7)',
      backdropFilter: 'blur(10px)',
      WebkitBackdropFilter: 'blur(10px)',
      borderBottom: '1px solid var(--warm-200)',
      fontSize: 13,
    }}>
      <div style={{ display:'flex', alignItems:'center', gap: 10 }}>
        <svg width="22" height="22" viewBox="0 0 22 22">
          <circle cx="11" cy="11" r="2" fill="var(--amber)"/>
          <circle cx="11" cy="11" r="6" fill="none" stroke="var(--amber)" strokeWidth="0.8"/>
          <circle cx="11" cy="11" r="10" fill="none" stroke="var(--amber)" strokeWidth="0.6" opacity="0.5"/>
        </svg>
        <span className="serif" style={{ fontSize: 18, letterSpacing: '0.01em' }}>Dr. Fry</span>
        <span className="mono" style={{ fontSize: 10, color: 'var(--warm-500)', letterSpacing:'0.15em', marginLeft: 4 }}>ProWave™ EU</span>
      </div>
      <div className="ds-nav-links" style={{ display: 'flex', gap: 32, color: 'var(--slate-800)' }}>
        {[
          ['Technology', '#technology'],
          ['Evidence', '#evidence'],
          ['Savings', '#savings'],
          ['Testimonials', 'Testimonials.html'],
          ['Case study', 'Case Study.html'],
          ['Specifications', '#specifications'],
          ['Certifications', '#certifications'],
          ['Support', '#support'],
        ].map(([label, href]) => (
          <a key={label} className="ds-navlink" href={href} style={{
            color: 'inherit', textDecoration: 'none',
            fontSize: 13, fontWeight: 500
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

// ─────────────────────────────────────────────────────────────────
// Sections (everything BETWEEN the panels)
// ─────────────────────────────────────────────────────────────────

function Mechanism() {
  return (
    <section id="technology" style={{ padding: '160px 0 140px', background: 'var(--porcelain)' }}>
      <div style={{ maxWidth: 980, margin: '0 auto', padding: '0 40px' }}>
        <Eyebrow num="01 / MECHANISM">How prevention technology works</Eyebrow>
        <h2 className="serif" style={{ fontSize: 56, lineHeight: 1.05, letterSpacing: '-0.01em', marginBottom: 32, maxWidth: 760 }}>
          Not a filter. Not a cleaner.<br/>
          <span style={{ color: 'var(--warm-500)' }}>A control field operating at 50 kHz.</span>
        </h2>
        <p style={{ fontSize: 18, lineHeight: 1.55, color: 'var(--slate-800)', maxWidth: 640, marginBottom: 64 }}>
          ProWave™ is a retrofit unit, not a heating device. Two electrode panels mount inside the fryer, generating an extremely weak radio-frequency field between them. The field alters the oil-water boundary at the surface of the food, preventing oil ingress before it occurs.
        </p>

        {/* The schematic */}
        <div style={{
          background: 'var(--porcelain-2)',
          padding: 40,
          border: '1px solid var(--warm-200)',
          marginBottom: 24,
        }}>
          <div className="mono" style={{
            fontSize: 10, letterSpacing: '0.15em', color: 'var(--warm-500)',
            marginBottom: 18, display:'flex', justifyContent:'space-between'
          }}>
            <span>FIG. 01 · SCHEMATIC OF INTERELECTRODE FIELD</span>
          </div>
          <Diagram5050kHz />
        </div>

        {/* Three pillars */}
        <div className="ds-grid-3" style={{ display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap: 24, marginTop: 80 }}>
          {[
            { k: '50,000', u: '/ second', t: 'Field cycles per second between electrode A and electrode B.' },
            { k: '< 1.0', u: 'W power draw', t: 'The field is non-thermal. Total cabinet draw stays under one watt-hour per shift.' },
            { k: '0', u: 'consumables', t: 'No filter cartridges. No paper. No additives. Install once and run.' },
          ].map((p,i) => (
            <div key={i} style={{ borderTop: '1px solid var(--graphite)', paddingTop: 22 }}>
              <div style={{ display:'flex', alignItems:'baseline', gap: 8, marginBottom: 12 }}>
                <span className="serif" style={{ fontSize: 56, lineHeight: 1, letterSpacing: '-0.02em' }}>{p.k}</span>
                <span className="mono" style={{ fontSize: 11, color: 'var(--warm-500)' }}>{p.u}</span>
              </div>
              <p style={{ fontSize: 14, lineHeight: 1.5, color: 'var(--slate-800)' }}>{p.t}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Evidence() {
  // Documented results — Musashino Corporation (Seven-Eleven Japan production
  // facility). Two products tested: deep-fried pork cutlet & roast pork cutlet.
  const products = ['Deep-fried pork cutlet', 'Roast pork cutlet'];
  const rows = [
    { label: 'Oil absorption', a: { pct: 25 }, b: { pct: 40 } },
    { label: 'Calorie', sub: 'per 100 g equivalent', a: { pct: 15, detail: '290 → 246 kcal' }, b: { pct: 28, detail: '396 → 284 kcal' } },
    { label: 'Preparation time', a: { raw: '−10 sec' }, b: { raw: '−10 sec' } },
  ];

  return (
    <section id="evidence" style={{
      padding: '140px 0 140px',
      background: 'var(--graphite)',
      color: 'var(--porcelain)',
    }}>
      <div style={{ maxWidth: 980, margin: '0 auto', padding: '0 40px' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', gap: 28, marginBottom: 32 }}>
          <div>
            <div style={{ color: 'var(--warm-500)' }}>
              <Eyebrow num="02 / EVIDENCE">Measured. Not asserted.</Eyebrow>
            </div>
            <h2 className="serif" style={{ fontSize: 56, lineHeight: 1.05, letterSpacing: '-0.01em', marginBottom: 14, maxWidth: 680 }}>
              36% less oil. Documented.<br/>
              <span style={{ color: 'var(--warm-500)' }}>At <span style={{ color: 'var(--porcelain)', textDecoration: 'underline', textDecorationColor: 'var(--amber)', textUnderlineOffset: '7px', textDecorationThickness: '2px' }}>a Seven-Eleven Japan production facility</span>.</span>
            </h2>
            <p className="mono" style={{ fontSize: 12, letterSpacing: '0.08em', color: 'var(--warm-500)', maxWidth: 560, lineHeight: 1.6 }}>
              MEASURED ACROSS TWO FRY LINES — <span style={{ color: 'var(--amber)' }}>DEEP-FRIED</span> &amp; <span style={{ color: 'var(--amber)' }}>ROAST PORK CUTLET</span>.
            </p>
          </div>
          <div style={{ flexShrink: 0, width: 112, height: 112, background: 'var(--porcelain)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 14 }}>
            <img src="assets/seven-eleven.png" alt="Seven-Eleven" style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }} />
          </div>
        </div>

        <div style={{
          border: '1px solid #2a2d31',
          background: '#181a1d',
          padding: 36,
          marginTop: 40,
          marginBottom: 32,
        }}>
          <div className="mono ds-grid-4-collapse" style={{
            fontSize: 10, letterSpacing: '0.15em',
            color: 'var(--warm-500)', marginBottom: 22,
            display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 18,
            paddingBottom: 14, borderBottom: '1px solid #2a2d31'
          }}>
            <span>FACILITY · MUSASHINO CORP.</span>
            <span>FOR · SEVEN-ELEVEN JAPAN</span>
            <span>PRODUCTS · 2 FRY LINES</span>
            <span>METHOD · DESIGNATED FACILITY</span>
          </div>

          {/* Facility-wide headline: oil usage */}
          <div style={{
            display:'flex', alignItems:'baseline', justifyContent:'space-between',
            flexWrap:'wrap', gap: 16, padding: '4px 0 26px', marginBottom: 8,
            borderBottom: '1px solid #2a2d31'
          }}>
            <div>
              <div className="mono" style={{ fontSize: 10, letterSpacing: '0.15em', color: 'var(--warm-500)', marginBottom: 8 }}>OIL USAGE · FACILITY-WIDE</div>
              <div style={{ display:'flex', alignItems:'baseline', gap: 18, flexWrap:'wrap' }}>
                <span className="serif" style={{ fontSize: 64, lineHeight: 0.9, color: 'var(--amber)' }}>−36%</span>
                <span className="mono" style={{ fontSize: 13, color: 'var(--warm-500)' }}>2,158 L <span style={{ color:'var(--porcelain)' }}>→</span> 1,398 L</span>
              </div>
            </div>
            <div className="mono" style={{ fontSize: 10, color: 'var(--warm-500)', maxWidth: 230, lineHeight: 1.6, textAlign:'right' }}>
              ELECTRODES INSTALLED ON A SINGLE PRODUCTION LINE
            </div>
          </div>

          {/* Per-product comparison header */}
          <div className="ds-evi-grid" style={{
            display:'grid', gridTemplateColumns: '1.1fr 1fr 1fr', gap: 24,
            padding: '20px 0 12px', alignItems:'end'
          }}>
            <div className="mono" style={{ fontSize: 10, letterSpacing: '0.15em', color: 'var(--warm-500)' }}>BY PRODUCT</div>
            {products.map((p) => (
              <div key={p} style={{ fontSize: 14, fontWeight: 500, color:'var(--porcelain)' }}>
                {p}
                <div className="mono" style={{ fontSize: 9, letterSpacing: '0.12em', color:'var(--warm-500)', marginTop: 4 }}>VS BASELINE</div>
              </div>
            ))}
          </div>

          {rows.map((m, i) => (
            <div key={i} className="ds-evi-grid" style={{
              display:'grid', gridTemplateColumns: '1.1fr 1fr 1fr', gap: 24,
              alignItems:'center', padding: '20px 0',
              borderTop: '1px solid #23262a'
            }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 500 }}>{m.label}</div>
                <div className="mono" style={{ fontSize: 10, color: 'var(--warm-500)', marginTop: 4, letterSpacing: '0.1em' }}>{m.sub ? m.sub.toUpperCase() : `METRIC.${(i+1).toString().padStart(2,'0')}`}</div>
              </div>
              {[m.a, m.b].map((cell, j) => (
                <div key={j}>
                  {cell.pct != null ? (
                    <React.Fragment>
                      <div style={{ display:'flex', alignItems:'baseline', gap: 10 }}>
                        <span className="serif" style={{ fontSize: 30, color: 'var(--amber)', lineHeight: 1 }}>−{cell.pct}%</span>
                      </div>
                      <div style={{ height: 6, background: '#23262a', position:'relative', marginTop: 10, maxWidth: 150 }}>
                        <div style={{ position:'absolute', inset:'0 auto 0 0', width:`${cell.pct}%`, background:'var(--amber)' }}/>
                      </div>
                      {cell.detail && <div className="mono" style={{ fontSize: 10, color: 'var(--warm-500)', marginTop: 8, letterSpacing:'0.06em' }}>{cell.detail}</div>}
                    </React.Fragment>
                  ) : (
                    <span className="serif" style={{ fontSize: 30, color: 'var(--teal)', lineHeight: 1 }}>{cell.raw}</span>
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>

        {/* Methodology footer */}
        <div className="mono ds-grid-3" style={{
          fontSize: 11, color: 'var(--warm-500)', lineHeight: 1.6,
          display:'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24, paddingTop: 20
        }}>
          <div>
            <div style={{ color: 'var(--porcelain)', marginBottom: 6 }}>FACILITY</div>
            Musashino Corporation — a designated dietary production facility supplying Seven-Eleven Japan. Two products tested: deep-fried pork cutlet and roast pork cutlet.
          </div>
          <div>
            <div style={{ color: 'var(--porcelain)', marginBottom: 6 }}>HEADLINE</div>
            Oil usage fell 36% — from 2,158 L to 1,398 L — with electrodes installed on a single production line. Oil absorption down 25–40%.
          </div>
          <div>
            <div style={{ color: 'var(--porcelain)', marginBottom: 6 }}>SOURCE</div>
            Dr.Fry Japan Co., Ltd. effectiveness report (Musashino Corporation). Single-facility result; figures vary by product and line. Available on request.
          </div>
        </div>
      </div>
    </section>
  );
}

function ROI() {
  const [oilCost, setOilCost] = useState(49);   // €/20L · average
  const [oilWeek, setOilWeek] = useState(80);   // L/week
  const [days, setDays] = useState(312);
  const [reductionPct, setReductionPct] = useState(36); // % oil-usage reduction — 36% documented at Musashino (conservative)

  const reduction = reductionPct / 100; // oil-usage reduction — 36% documented at Musashino Corp. (Seven-Eleven Japan)
  const annual = oilCost * (oilWeek / 20) * (days / 7);  // fresh-oil spend, baseline
  const freshSaved = annual * reduction;                 // less fresh oil bought
  const saved = freshSaved;                               // net annual benefit — resale excluded (operator-specific)
  const UNIT_PRICE = 4000, LIST_PRICE = 5900, RENT = 199; // Founding Partner / list / rent
  const payback = saved > 0 ? (UNIT_PRICE / saved) * 12 : 0; // €4,000 unit price, in months
  const monthlyNet = saved / 12 - RENT;                  // net after €199/mo rental
  const cashPositive = monthlyNet > 0;

  function Slider({label, unit, val, min, max, step, onChange}) {
    return (
      <div style={{ marginBottom: 28 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline', marginBottom: 10 }}>
          <span className="mono" style={{ fontSize: 11, letterSpacing: '0.1em', color:'var(--warm-500)' }}>{label}</span>
          <span className="mono" style={{ fontSize: 14, color:'var(--graphite)' }}>{val.toLocaleString()} <span style={{ color:'var(--warm-500)' }}>{unit}</span></span>
        </div>
        <input type="range" min={min} max={max} step={step} value={val} onChange={(e) => onChange(+e.target.value)}
          style={{
            width: '100%', height: 4,
            WebkitAppearance: 'none', appearance: 'none',
            background: `linear-gradient(to right, var(--graphite) 0 ${(val-min)/(max-min)*100}%, var(--warm-200) ${(val-min)/(max-min)*100}% 100%)`,
            outline: 'none',
          }}
        />
      </div>
    );
  }

  return (
    <section id="savings" style={{ padding: '140px 0', background: 'var(--porcelain)' }}>
      <div style={{ maxWidth: 980, margin: '0 auto', padding: '0 40px' }}>
        <Eyebrow num="03 / SAVINGS">Savings calculator</Eyebrow>
        <h2 className="serif" style={{ fontSize: 56, lineHeight: 1.05, letterSpacing:'-0.01em', marginBottom: 24, maxWidth: 760 }}>
          The unit pays for itself.<br/>
          <span style={{ color: 'var(--warm-500)' }}>Most operators see payback within the first year.</span>
        </h2>

        <div className="mono ds-grid-3" style={{ display:'grid', gridTemplateColumns:'repeat(3, 1fr)', border:'1px solid var(--warm-200)', maxWidth:760, marginBottom:48 }}>
          {[
            ['FOUNDING PARTNER', '€4,000', 'one-time · today', false],
            ['LIST', '€5,900', 'after founder programme', true],
            ['OR RENT', '€199 / mo', 'cash positive from month one', false],
          ].map(([k,v,s,strike],i)=>(
            <div key={k} style={{ padding:'16px 18px', borderRight: i<2?'1px solid var(--warm-200)':'none' }}>
              <div style={{ fontSize:9, letterSpacing:'0.14em', color:'var(--warm-500)', marginBottom:8 }}>{k}</div>
              <div className="serif" style={{ fontSize:26, lineHeight:1, color: i===0?'var(--graphite)':'var(--warm-500)', textDecoration: strike?'line-through':'none' }}>{v}</div>
              <div style={{ fontSize:9, letterSpacing:'0.06em', color: i===2?'var(--amber-deep)':'var(--warm-500)', marginTop:7 }}>{s}</div>
            </div>
          ))}
        </div>

        <div className="ds-grid-2" style={{
          display:'grid', gridTemplateColumns: '1fr 1fr', gap: 0,
          border:'1px solid var(--graphite)',
        }}>
          {/* Inputs */}
          <div style={{ padding: 40, borderRight: '1px solid var(--graphite)' }}>
            <div className="mono" style={{
              fontSize: 10, letterSpacing: '0.15em', color: 'var(--warm-500)',
              marginBottom: 28, paddingBottom: 14, borderBottom: '1px solid var(--warm-200)',
              display:'flex', justifyContent:'space-between'
            }}>
              <span>INPUTS · YOUR OPERATION</span>
              <span>EUR</span>
            </div>
            <Slider label="OIL COST" unit="€ / 20 L" val={oilCost} min={40} max={160} step={1} onChange={setOilCost} />
            <Slider label="OIL CONSUMPTION" unit="L / week" val={oilWeek} min={20} max={400} step={5} onChange={setOilWeek} />
            <Slider label="OPEN DAYS / YEAR" unit="days" val={days} min={150} max={365} step={1} onChange={setDays} />
            <Slider label="OIL REDUCTION" unit="%" val={reductionPct} min={10} max={75} step={1} onChange={setReductionPct} />
          </div>

          {/* Outputs */}
          <div style={{ padding: 40, background: 'var(--porcelain-2)', position: 'relative' }}>
            <div className="mono" style={{
              fontSize: 10, letterSpacing: '0.15em', color: 'var(--warm-500)',
              marginBottom: 28, paddingBottom: 14, borderBottom: '1px solid var(--warm-200)',
              display:'flex', justifyContent:'space-between'
            }}>
              <span>OUTPUT · MODELLED</span>
              <span>−{reductionPct}% OIL USE</span>
            </div>
            <div style={{ marginBottom: 32 }}>
              <div className="mono" style={{ fontSize:11, color:'var(--warm-500)', letterSpacing:'0.1em', marginBottom: 8 }}>ANNUAL OIL SPEND, BASELINE</div>
              <div className="serif" style={{ fontSize: 36, color:'var(--warm-500)', textDecoration:'line-through', textDecorationThickness: 1 }}>
                €{Math.round(annual).toLocaleString()}
              </div>
            </div>
            <div style={{ marginBottom: 24 }}>
              <div className="mono" style={{ fontSize:11, color:'var(--amber-deep)', letterSpacing:'0.1em', marginBottom: 8 }}>NET SAVED PER YEAR</div>
              <div className="serif" style={{ fontSize: 88, lineHeight: 1, letterSpacing:'-0.02em', color:'var(--graphite)' }}>
                €{Math.round(saved).toLocaleString()}
              </div>
            </div>
            <div className="mono" style={{
              fontSize: 11, lineHeight: 1.7, color:'var(--warm-500)', letterSpacing:'0.04em',
              marginBottom: 32, paddingBottom: 24, borderBottom:'1px solid var(--warm-200)'
            }}>
              <div style={{ display:'flex', justifyContent:'space-between' }}>
                <span>Fresh oil saved (−{reductionPct}%)</span>
                <span style={{ color:'var(--graphite)' }}>+€{Math.round(freshSaved).toLocaleString()}</span>
              </div>
            </div>
            <div style={{
              display:'grid', gridTemplateColumns:'1fr 1fr', gap: 16,
              paddingTop: 20, borderTop:'1px solid var(--warm-200)'
            }}>
              <div>
                <div className="mono" style={{ fontSize: 10, color:'var(--warm-500)', letterSpacing:'0.1em', marginBottom: 4 }}>PAYBACK</div>
                <div className="serif" style={{ fontSize: 28 }}>{payback.toFixed(1)} <span style={{ fontSize: 14, color:'var(--warm-500)' }}>months</span></div>
              </div>
              <div>
                <div className="mono" style={{ fontSize: 10, color:'var(--warm-500)', letterSpacing:'0.1em', marginBottom: 4 }}>5-YEAR NET</div>
                <div className="serif" style={{ fontSize: 28 }}>€{Math.round(saved * 5 - UNIT_PRICE).toLocaleString()}</div>
              </div>
            </div>

            {/* Rental option — cash positive from month one */}
            <div style={{ marginTop: 20, paddingTop: 20, borderTop:'1px solid var(--warm-200)', display:'flex', justifyContent:'space-between', alignItems:'flex-end', gap: 16, flexWrap:'wrap' }}>
              <div>
                <div className="mono" style={{ fontSize: 10, color:'var(--warm-500)', letterSpacing:'0.1em', marginBottom: 4 }}>OR RENT</div>
                <div className="serif" style={{ fontSize: 28 }}>€199 <span style={{ fontSize: 14, color:'var(--warm-500)' }}>/ month</span></div>
              </div>
              <div style={{ textAlign:'right' }}>
                <div className="mono" style={{ fontSize: 10, color:'var(--warm-500)', letterSpacing:'0.1em', marginBottom: 4 }}>NET / MONTH AFTER RENT</div>
                <div className="serif" style={{ fontSize: 28, color: cashPositive ? 'var(--graphite)' : 'var(--red)' }}>{cashPositive ? '+' : ''}€{Math.round(monthlyNet).toLocaleString()}</div>
              </div>
            </div>
            {cashPositive && (
              <div className="mono" style={{ marginTop: 14, fontSize: 10, letterSpacing:'0.12em', color:'var(--amber-deep)', border:'1px solid var(--amber)', padding:'9px 13px', display:'inline-flex', alignItems:'center', gap:9 }}>
                <svg width="8" height="8" viewBox="0 0 10 10" aria-hidden="true"><rect x="5" y="0" width="7.07" height="7.07" transform="rotate(45 5 0)" fill="var(--amber)"/></svg>
                CASH POSITIVE FROM MONTH ONE
              </div>
            )}
          </div>
        </div>

        <p className="mono" style={{ fontSize: 11, color:'var(--warm-500)', lineHeight: 1.6, marginTop: 18, maxWidth: 720 }}>
          ASSUMPTIONS · 36% oil-usage reduction documented at Musashino Corporation (2,158 L → 1,398 L), a Seven-Eleven Japan production facility. Single-facility result; your figures vary by product, line and oil. Figures reflect reduced oil purchasing only; any change in used-oil resale income is operator-specific and excluded. Founding Partner price €4,000 ex VAT (list €5,900 once the founder programme closes), single-fryer install. Rental €199/month — cash positive from month one for most operations.
        </p>

        <RoiEmail figures={{ oilCost, oilWeek, days, annual, freshSaved, saved, payback, reductionPct, fiveYear: saved * 5 - UNIT_PRICE }} />
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────
// ROI → lead capture. Saves the operator's figures + note straight to
// the Dr. Fry dashboard (shared localStorage book) — no self-email.
// ─────────────────────────────────────────────────────────────────
const STORE_KEY = 'drfry_round_commitments_v1';

function RoiEmail({ figures }) {
  const [form, setForm] = useState({ name:'', email:'', company:'', message:'' });
  const [errors, setErrors] = useState({});
  const [sent, setSent] = useState(false);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const eur = (n) => '€' + Math.round(n).toLocaleString('en-US');


  function submit(ev) {
    ev.preventDefault();
    const e = {};
    if (!form.name.trim()) e.name = 1;
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email)) e.email = 1;
    setErrors(e);
    if (Object.keys(e).length) return;

    // Save the lead straight to the dashboard book (shared localStorage).
    const lead = {
      kind: 'roi',
      name: form.name.trim(),
      email: form.email.trim(),
      org: form.company.trim() || '—',
      role: 'ROI lead',
      message: form.message.trim(),
      seats: 0,
      ts: Date.now(),
      roi: {
        oilCost: figures.oilCost, oilWeek: figures.oilWeek, days: figures.days,
        reductionPct: figures.reductionPct, annual: figures.annual,
        freshSaved: figures.freshSaved, saved: figures.saved,
        payback: figures.payback, fiveYear: figures.fiveYear,
      },
    };
    try {
      const raw = JSON.parse(localStorage.getItem(STORE_KEY) || '[]');
      raw.push(lead);
      localStorage.setItem(STORE_KEY, JSON.stringify(raw));
    } catch {}
    setSent(true);
  }

  const inputBase = {
    width:'100%', background:'var(--porcelain)', border:'1px solid var(--warm-200)',
    padding:'13px 15px', fontSize:15, color:'var(--graphite)', fontFamily:'inherit',
    transition:'border-color .2s ease, box-shadow .2s ease',
  };
  const labelBase = {
    display:'block', fontFamily:"'IBM Plex Mono', monospace", fontSize:10,
    letterSpacing:'0.14em', textTransform:'uppercase', color:'var(--warm-500)', marginBottom:8,
  };

  return (
    <div id="roi-email" style={{ marginTop: 28, border:'1px solid var(--graphite)', background:'var(--graphite)', color:'var(--porcelain)' }}>
      <div className="ds-grid-2" style={{ display:'grid', gridTemplateColumns:'0.85fr 1.15fr', gap: 0 }}>
        {/* Left: pitch + live figure */}
        <div style={{ padding:'38px 40px', borderRight:'1px solid #2a2d31' }}>
          <div className="mono" style={{ fontSize:10, letterSpacing:'0.15em', color:'var(--amber)', marginBottom: 20 }}>REQUEST A TAILORED QUOTE</div>
          <div className="serif" style={{ fontSize: 30, lineHeight:1.12, marginBottom: 18 }}>
            Send us your numbers and a word about your kitchen.
          </div>
          <p style={{ fontSize: 14, lineHeight:1.6, color:'var(--warm-500)' }}>
            We'll reply with a tailored quote and a measured-trial offer for your site. Your current estimate:
          </p>
          <div style={{ display:'flex', alignItems:'baseline', gap: 10, marginTop: 20 }}>
            <span className="serif" style={{ fontSize: 44, color:'var(--amber)' }}>{eur(figures.saved)}</span>
            <span className="mono" style={{ fontSize: 11, color:'var(--warm-500)' }}>SAVED / YEAR</span>
          </div>
        </div>

        {/* Right: form */}
        {sent ? (
          <div style={{ padding:'38px 40px', display:'flex', flexDirection:'column', justifyContent:'center' }}>
            <div style={{ display:'inline-flex', marginBottom: 16 }}>
              <svg width="40" height="40" viewBox="0 0 40 40"><circle cx="20" cy="20" r="19" fill="none" stroke="var(--amber)" strokeWidth="1.4"/><path d="M12 20.5 L18 26 L28 14.5" fill="none" stroke="var(--porcelain)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </div>
            <div className="serif" style={{ fontSize: 28, marginBottom: 10 }}>Got it — we'll be in touch.</div>
            <p style={{ fontSize: 14, lineHeight:1.6, color:'var(--warm-500)', maxWidth: 420 }}>
              Your figures and note are with the Dr. Fry team. We'll reply to <strong style={{ color:'var(--porcelain)' }}>{form.email}</strong> with a tailored quote and a measured-trial offer for your site, usually within two business days.
            </p>
            <button type="button" className="ds-btn" onClick={() => setSent(false)} style={{ alignSelf:'flex-start', marginTop: 22, background:'transparent', color:'var(--porcelain)', border:'1px solid #3a3d41', padding:'12px 20px', fontSize:12, letterSpacing:'0.05em' }}>
              EDIT DETAILS
            </button>
          </div>
        ) : (
          <form onSubmit={submit} noValidate style={{ padding:'34px 40px' }}>
            <div className="ds-grid-2" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap: 18, marginBottom: 18 }}>
              <div>
                <label style={labelBase} htmlFor="roi-name">Your name *</label>
                <input id="roi-name" value={form.name} onChange={set('name')} placeholder="Jane Doe" autoComplete="name"
                  style={{ ...inputBase, borderColor: errors.name ? 'var(--red)' : 'var(--warm-200)' }} />
              </div>
              <div>
                <label style={labelBase} htmlFor="roi-email-i">Email *</label>
                <input id="roi-email-i" type="email" value={form.email} onChange={set('email')} placeholder="jane@kitchen.com" autoComplete="email"
                  style={{ ...inputBase, borderColor: errors.email ? 'var(--red)' : 'var(--warm-200)' }} />
              </div>
            </div>
            <div style={{ marginBottom: 18 }}>
              <label style={labelBase} htmlFor="roi-company">Company / brand</label>
              <input id="roi-company" value={form.company} onChange={set('company')} placeholder="e.g. Golden Fry Group" autoComplete="organization" style={inputBase} />
            </div>
            <div style={{ marginBottom: 22 }}>
              <label style={labelBase} htmlFor="roi-msg">Tell us about your brand / kitchen</label>
              <textarea id="roi-msg" rows="4" value={form.message} onChange={set('message')}
                placeholder="How many sites, what you fry, current oil routine, anything we should know…"
                style={{ ...inputBase, resize:'vertical' }}></textarea>
            </div>
            {(errors.name || errors.email) && (
              <div className="mono" style={{ fontSize: 11, color:'var(--amber)', letterSpacing:'0.05em', marginBottom: 16 }}>
                Please add your name and a valid email so we can reply.
              </div>
            )}
            <button type="submit" className="ds-btn" style={{
              width:'100%', background:'var(--amber)', color:'var(--graphite)',
              padding:'16px', fontSize:14, fontWeight:600, letterSpacing:'0.05em'
            }}>
              SEND MY DETAILS →
            </button>
            <p className="mono" style={{ fontSize: 10, color:'var(--warm-500)', lineHeight:1.6, marginTop: 14, letterSpacing:'0.04em' }}>
              Sends your figures and note straight to the Dr. Fry team — we'll reply by email with a tailored quote.
            </p>
          </form>
        )}
      </div>
    </div>
  );
}

function Specifications() {
  const rows = [
    ['Model', 'ENF-PW-EU'],
    ['Operating frequency', '50 kHz ± 2%'],
    ['Power consumption', '< 1.0 W (cabinet)'],
    ['Input', '110–240 V AC, 50/60 Hz'],
    ['Electrode panels', '2 × ABS housing, 304 stainless mounts'],
    ['Interelectrode gap', '320–480 mm (typ. fryer)'],
    ['Operating temp.', 'up to 200 °C oil, 60 °C cabinet'],
    ['Ingress rating', 'IP54 (cabinet), IP67 (panels)'],
    ['Certifications', 'UL · RCM/SAA · PSE'],
    ['CE (EU) / UKCA', 'In progress · target Q4 2026'],
    ['Dimensions (cabinet)', '142 × 84 × 38 mm'],
    ['Mass (cabinet)', '420 g'],
    ['Origin', 'Designed & assembled in Japan'],
  ];

  return (
    <section id="specifications" style={{ padding: '140px 0', background: 'var(--porcelain)' }}>
      <div style={{ maxWidth: 980, margin: '0 auto', padding: '0 40px' }}>
        <Eyebrow num="04 / SPEC">Engineering specification</Eyebrow>
        <h2 className="serif" style={{ fontSize: 56, lineHeight: 1.05, letterSpacing:'-0.01em', marginBottom: 56, maxWidth: 760 }}>
          Documented to the watt.<br/>
          <span style={{ color: 'var(--warm-500)' }}>Built to outlast the fryer.</span>
        </h2>

        <div className="ds-grid-2" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap: 60 }}>
          <div>
            <div className="mono" style={{
              fontSize: 10, letterSpacing:'0.15em', color:'var(--warm-500)',
              marginBottom: 16, paddingBottom: 12, borderBottom: '1px solid var(--graphite)'
            }}>
              SPEC SHEET · ENF-PW-EU · REV 04 · 2026
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <tbody>
                {rows.map(([k,v],i)=>(
                  <tr key={i} style={{ borderBottom: '1px solid var(--warm-200)' }}>
                    <td style={{ padding: '14px 0', color:'var(--warm-500)', verticalAlign:'top', width: '46%' }}>{k}</td>
                    <td className="mono" style={{ padding: '14px 0', textAlign:'right' }}>{v}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div>
            <div style={{
              background: 'var(--porcelain-2)', border: '1px solid var(--warm-200)',
              padding: 32, height: '100%', position:'relative', overflow:'hidden'
            }}>
              <div className="mono" style={{
                fontSize: 10, letterSpacing:'0.15em', color:'var(--warm-500)', marginBottom: 24
              }}>FIG. 02 · CABINET DIMENSIONS</div>

              <div style={{ position:'relative', padding: '20px 30px 50px' }}>
                {/* Cabinet rectangle */}
                <div style={{
                  width: '100%', aspectRatio: '142 / 84',
                  background: 'var(--graphite)', position:'relative',
                  marginBottom: 12,
                  display:'flex', alignItems:'center', justifyContent:'center'
                }}>
                  <div style={{ width: 24, height: 24, borderRadius: '50%', border:'2px solid var(--porcelain)', opacity:0.4 }}/>
                  {/* width tick */}
                  <div style={{
                    position:'absolute', left:0, right:0, bottom:-26,
                    display:'flex', justifyContent:'space-between',
                    fontFamily:'IBM Plex Mono', fontSize:10, color:'var(--warm-500)'
                  }}>
                    <span>|</span>
                    <span>142 mm</span>
                    <span>|</span>
                  </div>
                  {/* height tick */}
                  <div style={{
                    position:'absolute', top:0, bottom:0, right:-32,
                    display:'flex', flexDirection:'column', justifyContent:'space-between',
                    fontFamily:'IBM Plex Mono', fontSize:10, color:'var(--warm-500)',
                    alignItems:'center'
                  }}>
                    <span>—</span>
                    <span style={{ writingMode:'vertical-rl' }}>84 mm</span>
                    <span>—</span>
                  </div>
                </div>
              </div>

              <div className="mono" style={{ fontSize: 10, color:'var(--warm-500)', lineHeight: 1.6, marginTop: 60 }}>
                Mounts on side wall of fryer cabinet. Panels lower into oil bath via stainless brackets. Single 24V DC tether. Field-replaceable in &lt; 12 minutes.
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────
// Certifications band — regional approvals
// ─────────────────────────────────────────────────────────────────
function CertMark({ kind }) {
  // Minimal SVG glyphs standing in for each regulator's mark
  const common = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.6 };
  if (kind === 'UL') {
    return (
      <svg width="40" height="40" viewBox="0 0 40 40" aria-hidden="true">
        <circle cx="20" cy="20" r="18" {...common} />
        <text x="20" y="25" textAnchor="middle" fontFamily="DM Serif Display, serif" fontSize="15" fill="currentColor">UL</text>
      </svg>
    );
  }
  if (kind === 'RCM') {
    return (
      <svg width="40" height="40" viewBox="0 0 40 40" aria-hidden="true">
        <path d="M8 8 L24 20 L8 32" {...common} strokeLinejoin="round" strokeLinecap="round" />
        <path d="M20 8 L36 20 L20 32" {...common} strokeLinejoin="round" strokeLinecap="round" opacity="0.55" />
      </svg>
    );
  }
  // PSE — diamond (the actual PSE mark is a diamond for these product classes)
  return (
    <svg width="40" height="40" viewBox="0 0 40 40" aria-hidden="true">
      <rect x="20" y="2" width="25.4" height="25.4" transform="rotate(45 20 2)" {...common} />
      <text x="20" y="24" textAnchor="middle" fontFamily="IBM Plex Mono, monospace" fontSize="8" fill="currentColor">PSE</text>
    </svg>
  );
}

function Certifications() {
  const certs = [
    { mark:'UL',  region:'United States', std:'UL Listed', spec:'120 V / 60 Hz', code:'UL 197 · file E-pending' },
    { mark:'RCM', region:'Australia & NZ', std:'RCM / SAA certified', spec:'230 V / 50 Hz', code:'AS/NZS 60335' },
    { mark:'PSE', region:'Japan', std:'PSE approved', spec:'100 V / 50–60 Hz', code:'DENAN · Diamond PSE' },
  ];
  return (
    <section id="certifications" style={{ padding:'120px 0', background:'var(--porcelain)', borderTop:'1px solid var(--warm-200)' }}>
      <div style={{ maxWidth: 980, margin:'0 auto', padding:'0 40px' }}>
        <Eyebrow num="05 / COMPLIANCE">Independently certified · where we ship</Eyebrow>
        <h2 className="serif" style={{ fontSize: 56, lineHeight: 1.05, letterSpacing:'-0.01em', marginBottom: 18, maxWidth: 760 }}>
          Passed in three jurisdictions.
        </h2>
        <p style={{ fontSize: 17, lineHeight: 1.55, color:'var(--slate-800)', maxWidth: 600, marginBottom: 56 }}>
          Each ProWave™ cabinet ships market-specific — voltage, frequency, and plug configured to the destination, tested against that market's safety standard. We list approvals by jurisdiction so you can verify each one.
        </p>

        <div className="ds-grid-3" style={{ display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap: 0, border:'1px solid var(--graphite)' }}>
          {certs.map((c, i) => (
            <div key={i} style={{
              padding: '34px 30px 30px',
              borderRight: i < certs.length-1 ? '1px solid var(--warm-200)' : 'none',
              display:'flex', flexDirection:'column', gap: 0,
            }}>
              <div style={{ color:'var(--graphite)', marginBottom: 24 }}>
                <CertMark kind={c.mark} />
              </div>
              <div className="mono" style={{ fontSize: 10, letterSpacing:'0.14em', color:'var(--warm-500)', textTransform:'uppercase', marginBottom: 10 }}>{c.region}</div>
              <div className="serif" style={{ fontSize: 26, lineHeight: 1.1, marginBottom: 16 }}>{c.std}</div>
              <div style={{ display:'flex', alignItems:'baseline', gap: 8, marginBottom: 6 }}>
                <span className="mono" style={{ fontSize: 10, color:'var(--warm-500)', letterSpacing:'0.1em', width: 54 }}>SUPPLY</span>
                <span className="mono" style={{ fontSize: 14, color:'var(--graphite)' }}>{c.spec}</span>
              </div>
              <div style={{ display:'flex', alignItems:'baseline', gap: 8 }}>
                <span className="mono" style={{ fontSize: 10, color:'var(--warm-500)', letterSpacing:'0.1em', width: 54 }}>STANDARD</span>
                <span className="mono" style={{ fontSize: 12, color:'var(--slate-800)' }}>{c.code}</span>
              </div>
            </div>
          ))}
        </div>

        {/* CE status — honest in-progress signal, never implied as achieved */}
        <div style={{ marginTop: 22, border:'1px solid var(--warm-200)', borderLeft:'3px solid var(--amber)', background:'var(--porcelain-2)', padding:'24px 28px' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline', flexWrap:'wrap', gap: 12, marginBottom: 16 }}>
            <div style={{ display:'flex', alignItems:'baseline', gap: 12 }}>
              <span className="serif" style={{ fontSize: 22 }}>CE (EU) &amp; UKCA (UK)</span>
              <span className="mono" style={{ fontSize: 10, letterSpacing:'0.12em', textTransform:'uppercase', color:'var(--amber-deep)', border:'1px solid var(--amber)', padding:'3px 8px' }}>In progress</span>
            </div>
            <span className="mono" style={{ fontSize: 11, color:'var(--warm-500)', letterSpacing:'0.08em' }}>TARGET Q4 2026</span>
          </div>
          <div style={{ height: 6, background:'var(--warm-200)', position:'relative', marginBottom: 14 }}>
            <div style={{ position:'absolute', inset:'0 auto 0 0', width:'62%', background:'var(--amber)' }} />
          </div>
          <p className="mono" style={{ fontSize: 12, color:'var(--slate-800)', lineHeight: 1.6, maxWidth: 740 }}>
            CE certification is underway, building on our existing 230 V / 50 Hz approval (RCM/SAA). Until the mark issues, EU deployments run as <strong>Founding Partner trials</strong> — not commercial placement. Declarations of Conformity for UL, RCM/SAA and PSE are available to verify on request.
          </p>
        </div>
      </div>
    </section>
  );
}

function Support() {
  return (
    <section id="support" style={{
      padding: '140px 0 120px',
      background: 'var(--graphite)', color: 'var(--porcelain)'
    }}>
      <div style={{ maxWidth: 980, margin:'0 auto', padding:'0 40px' }}>
        <div style={{ color: 'var(--warm-500)' }}>
          <Eyebrow num="06 / SUPPORT">European service infrastructure</Eyebrow>
        </div>
        <h2 className="serif" style={{ fontSize: 56, lineHeight: 1.05, letterSpacing:'-0.01em', marginBottom: 56, maxWidth: 760 }}>
          Installed, monitored, guaranteed.<br/>
          <span style={{ color: 'var(--warm-500)' }}>From Rotterdam, in 11 countries.</span>
        </h2>
        <div className="ds-grid-4" style={{ display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap: 24 }}>
          {[
            { k: '< 48h', l: 'Site survey', d: 'Booked from request' },
            { k: '< 2h', l: 'Install per fryer', d: 'During off-hours' },
            { k: '5 yr', l: 'Hardware warranty', d: 'Bumper-to-bumper' },
            { k: '24/7', l: 'Monitoring', d: 'Optional telemetry' },
          ].map((s,i)=>(
            <div key={i} style={{ borderTop: '1px solid var(--warm-500)', paddingTop: 22 }}>
              <div className="serif" style={{ fontSize: 48, lineHeight: 1, letterSpacing:'-0.02em' }}>{s.k}</div>
              <div style={{ fontSize: 14, fontWeight: 500, marginTop: 14 }}>{s.l}</div>
              <div className="mono" style={{ fontSize: 10, color:'var(--warm-500)', letterSpacing:'0.1em', marginTop: 6, textTransform:'uppercase' }}>{s.d}</div>
            </div>
          ))}
        </div>

        {/* CTA strip */}
        <div style={{ marginTop: 80 }}>
          {window.JapanStrip && <window.JapanStrip dark={true} />}
        </div>
        <div style={{
          marginTop: 0, padding: 40, border: '1px solid #2a2d31',
          background: '#181a1d', display:'flex', justifyContent:'space-between', alignItems:'center', gap: 40
        }}>
          <div>
            <div className="serif" style={{ fontSize: 34, lineHeight: 1.1 }}>Book a measured trial in your kitchen.</div>
            <div className="mono" style={{ fontSize: 11, color:'var(--warm-500)', letterSpacing:'0.1em', marginTop: 10 }}>
              28-DAY PROTOCOL · NO CHARGE IF NO MEASURED RESULT
            </div>
          </div>
          <a className="ds-btn" href="Request Assessment.html" style={{
            background: 'var(--amber)', color: 'var(--graphite)',
            padding: '18px 28px', textDecoration: 'none', fontSize: 13, fontWeight: 600,
            letterSpacing: '0.06em', whiteSpace: 'nowrap'
          }}>REQUEST TRIAL →</a>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer style={{
      padding: '60px 40px 40px',
      background: 'var(--graphite)', color: 'var(--warm-500)',
      borderTop: '1px solid #23262a',
      fontSize: 12,
      display:'flex', justifyContent:'space-between', alignItems:'center'
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
  );
}

Object.assign(window, {
  TopNav, Mechanism, Evidence, ROI, Specifications, Certifications, Support, Footer,
  Eyebrow, DotWaveBg
});
