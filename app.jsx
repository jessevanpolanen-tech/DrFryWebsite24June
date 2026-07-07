// Main app: hero scroll choreography + assembled sections
const { useState, useEffect, useRef, useLayoutEffect } = React;

// ─────────────────────────────────────────────────────────────────
// Tweakable defaults
// ─────────────────────────────────────────────────────────────────
const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "scrollSpeed": 1.0,
  "panelEdgeOffset": 40,
  "panelRestScale": 1.4,
  "fieldIntensity": 0.55,
  "headlineVariant": "Prevention, measured.",
  "subVariant": "A 50 kHz field that stops oil before it enters food.",
  "panelMinScale": 0.55,
  "showFieldDots": true
}/*EDITMODE-END*/;

// ─────────────────────────────────────────────────────────────────
// Hero stage: parks the panels & control unit, drives them with scroll.
// We use one "drive" value 0..1: 0 = parked at center (photo composition),
// 1 = panels stuck to viewport edges, control unit shrunk/parked top.
// ─────────────────────────────────────────────────────────────────

function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}
function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
function lerp(a, b, t) { return a + (b - a) * t; }

function FieldDots({ intensity, drive }) {
  // Animated field of amber dots between the panels - intensifies as drive increases
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    let raf;
    const start = performance.now();
    const tick = () => {
      const t = (performance.now() - start) / 1000;
      el.style.setProperty('--phase', t.toString());
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  const cols = 14, rows = 7;
  const dots = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x = (c + 0.5) / cols * 100;
      const y = (r + 0.5) / rows * 100;
      const phase = (c * 0.15 + r * 0.22);
      dots.push(
        <div key={`${r}-${c}`} style={{
          position: 'absolute',
          left: `${x}%`, top: `${y}%`,
          width: 4, height: 4, borderRadius: '50%',
          background: 'var(--amber)',
          transform: 'translate(-50%, -50%)',
          opacity: 0,
          animation: `fieldPulse 2.4s ease-in-out infinite`,
          animationDelay: `${phase}s`,
        }}/>
      );
    }
  }
  return (
    <div ref={ref} style={{
      position: 'absolute', inset: 0,
      opacity: intensity * (0.3 + drive * 0.7),
      pointerEvents: 'none',
      transition: 'opacity 0.3s'
    }}>
      {dots}
    </div>
  );
}

function HeroStage({ tweaks }) {
  const stageRef = useRef(null);
  const [drive, setDrive] = useState(0); // 0..1 progression of opening
  const [vw, setVw] = useState(typeof window !== 'undefined' ? window.innerWidth : 1280);
  const [vh, setVh] = useState(typeof window !== 'undefined' ? window.innerHeight : 800);

  useEffect(() => {
    const onResize = () => { setVw(window.innerWidth); setVh(window.innerHeight); };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // Scroll drive: hero is sticky; we use a tall scroll spacer to translate scroll into drive
  useEffect(() => {
    const onScroll = () => {
      const stage = stageRef.current; if (!stage) return;
      const rect = stage.getBoundingClientRect();
      // stage is sticky inside a tall section; section's top relative to viewport
      const section = stage.parentElement;
      if (!section) return;
      const secRect = section.getBoundingClientRect();
      const secTop = -secRect.top;
      const total = section.offsetHeight - vh;
      const raw = clamp(secTop / total, 0, 1);
      const eased = easeInOutCubic(clamp(raw * tweaks.scrollSpeed, 0, 1));
      setDrive(eased);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [tweaks.scrollSpeed, vh]);

  // Geometry
  const panelH_rest = vh * 0.58;
  const panelH_final = vh * 0.42;  // smaller at edges so content has room
  const panelHeight = lerp(panelH_rest, panelH_final, drive);
  const panelAspect = 320 / 420;
  const panelW_rest = panelH_rest * panelAspect;
  const panelW_final = panelH_final * panelAspect;
  const panelWidth = lerp(panelW_rest, panelW_final, drive);

  // Rest: small positive gap so the two panels read as a pair, not overlapping
  const restGap = panelW_rest * 0.06;
  // Final: panels flush against viewport edges, content corridor in between
  const targetEdge = tweaks.panelEdgeOffset;
  const finalGap = vw - 2 * targetEdge - 2 * panelW_final;
  const gap = lerp(restGap, finalGap, drive);

  const leftPanelX  = (vw / 2) - (gap / 2) - panelWidth;
  const rightPanelX = (vw / 2) + (gap / 2);

  // Vertical: centered in the viewport
  const panelY = (vh - panelHeight) / 2;

  // Control unit: shrinks & moves up to top-center as drive increases
  const cuRestScale = 1.0;
  const cuMinScale = 0.0;   // fades out
  const cuScale = lerp(cuRestScale, cuMinScale, drive);
  const cuOpacity = 1 - drive;
  const cuRestY = vh * 0.04;
  const cuFinalY = -180;
  const cuY = lerp(cuRestY, cuFinalY, drive);

  // Hero copy reveal as drive increases
  const copyOpacity = clamp((drive - 0.25) / 0.45, 0, 1);
  const copyTranslate = lerp(40, 0, copyOpacity);

  return (
    <div ref={stageRef} style={{
      position: 'sticky', top: 0,
      width: '100%', height: '100vh',
      overflow: 'hidden',
      background: 'var(--porcelain)',
      perspective: '1600px',
      perspectiveOrigin: '50% 45%',
    }}>
      {/* Faint amber field gradient that intensifies between panels */}
      <div style={{
        position:'absolute', inset: 0,
        background: `radial-gradient(ellipse 60% 50% at 50% 55%, rgba(242,162,58,${0.10 * drive}) 0%, transparent 70%)`,
        transition: 'opacity 0.2s',
        pointerEvents: 'none'
      }}/>

      {/* Field dots */}
      {tweaks.showFieldDots && (
        <div style={{
          position:'absolute',
          left: leftPanelX + panelWidth, right: vw - rightPanelX,
          top: panelY, height: panelHeight,
          pointerEvents: 'none'
        }}>
          <FieldDots intensity={tweaks.fieldIntensity} drive={drive} />
        </div>
      )}

      {/* Wave arcs between panels */}
      <svg style={{
        position:'absolute',
        left: leftPanelX + panelWidth, top: panelY,
        width: rightPanelX - (leftPanelX + panelWidth),
        height: panelHeight,
        pointerEvents:'none',
        opacity: 0.4 + drive * 0.4,
      }} viewBox="0 0 100 100" preserveAspectRatio="none">
        {[20, 35, 50, 65, 80].map((cx, i) => (
          <path key={i}
            d={`M ${cx},5 Q ${cx + 6},50 ${cx},95`}
            fill="none" stroke="var(--amber)" strokeWidth="0.3"
            style={{
              ['--arc-op']: 0.5 - i * 0.05,
              animation: `arcPulse 2.6s ${i * 0.22}s ease-in-out infinite`,
            }}
          />
        ))}
      </svg>

      {/* Control unit image removed */}

      {/* Left panel — schematic SVG, rotated 45° around its own Y-axis (back-left) */}
      <div style={{
        position: 'absolute',
        left: leftPanelX, top: panelY,
        height: panelHeight,
        pointerEvents: 'none',
        willChange: 'left, top, height, transform',
        zIndex: 5,
        transformStyle: 'preserve-3d',
        transform: 'perspective(1400px) rotateY(67.5deg)',
        transformOrigin: 'center center',
        filter: 'drop-shadow(0 28px 36px rgba(17,19,21,0.18))',
      }}>
        <SchematicPanel side="left" height={panelHeight} />
      </div>

      {/* Right panel — schematic SVG, rotated -45° around its own Y-axis (mirrored) */}
      <div style={{
        position: 'absolute',
        left: rightPanelX, top: panelY,
        height: panelHeight,
        pointerEvents: 'none',
        willChange: 'left, top, height, transform',
        zIndex: 5,
        transformStyle: 'preserve-3d',
        transform: 'perspective(1400px) rotateY(-67.5deg)',
        transformOrigin: 'center center',
        filter: 'drop-shadow(0 28px 36px rgba(17,19,21,0.18))',
      }}>
        <SchematicPanel side="right" height={panelHeight} />
      </div>

      {/* Hero copy — fades in as panels open */}
      <div style={{
        position:'absolute',
        left: '50%', top: '14%',
        transform: `translate(-50%, ${copyTranslate}px)`,
        opacity: copyOpacity,
        textAlign:'center',
        pointerEvents: copyOpacity > 0.5 ? 'auto' : 'none',
        maxWidth: 760, width: '78%',
      }}>
        <div className="mono" style={{
          fontSize: 11, letterSpacing: '0.22em', color:'var(--amber-deep)',
          marginBottom: 24, textTransform:'uppercase',
          display: 'inline-flex', alignItems: 'center', gap: 10
        }}>
          <svg width="9" height="9" viewBox="0 0 10 10" aria-hidden="true" style={{ flexShrink: 0 }}>
            <rect x="5" y="0" width="7.07" height="7.07" transform="rotate(45 5 0)" fill="var(--amber)"/>
          </svg>
          Engineered in Japan · Calibrated in Europe
        </div>
        <h1 className="serif" style={{
          fontSize: 'clamp(48px, 7vw, 88px)', lineHeight: 1.0,
          letterSpacing: '-0.02em', marginBottom: 24,
        }}>
          {tweaks.headlineVariant}
        </h1>
        <p style={{
          fontSize: 18, lineHeight: 1.55, color: 'var(--slate-800)',
          maxWidth: 540, margin: '0 auto'
        }}>
          {tweaks.subVariant}
        </p>
      </div>

      {/* Initial rest-state caption (when drive ≈ 0) */}
      <div style={{
        position:'absolute',
        left:'50%', bottom: 60,
        transform:'translateX(-50%)',
        textAlign:'center',
        opacity: 1 - drive * 2,
        transition: 'opacity 0.3s',
        pointerEvents: 'none'
      }}>
        <div className="mono" style={{
          fontSize: 11, letterSpacing:'0.22em', color:'var(--warm-500)', marginBottom: 18
        }}>SCROLL TO ACTIVATE</div>
        <div style={{ display:'flex', flexDirection:'column', gap: 4, alignItems:'center' }}>
          {[1,2,3].map(i=>(
            <div key={i} style={{
              width: 18, height: 1, background:'var(--graphite)',
              opacity: 0.7 - i*0.2,
              animation: `scrollHint 1.6s ${i*0.15}s ease-in-out infinite`
            }}/>
          ))}
        </div>
      </div>

      {/* Drive readout — tiny technical badge */}
      <div className="mono" style={{
        position:'absolute', top: 90, right: 28,
        fontSize: 10, color:'var(--warm-500)', letterSpacing: '0.12em',
      }}>
        FIELD ACTIVATION · {Math.round(drive * 100).toString().padStart(3,'0')}%
      </div>

      <style>{`
        @keyframes fieldPulse {
          0%, 100% { opacity: 0; transform: translate(-50%, -50%) scale(0.4); }
          50% { opacity: 0.8; transform: translate(-50%, -50%) scale(1); }
        }
        @keyframes scrollHint {
          0%, 100% { opacity: 0.2; transform: translateY(0); }
          50% { opacity: 0.9; transform: translateY(2px); }
        }
        @keyframes arcPulse {
          0%, 100% { opacity: calc(var(--arc-op) * 0.45); }
          50% { opacity: var(--arc-op); }
        }
      `}</style>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// Persistent edge panels — once the hero stage scrolls past, the
// panels stick to the viewport edges for the rest of the journey.
// ─────────────────────────────────────────────────────────────────

function EdgePanels({ tweaks }) {
  const leftRef = useRef(null);
  const rightRef = useRef(null);

  useEffect(() => {
    const apply = () => {
      const left = leftRef.current, right = rightRef.current;
      if (!left || !right) return;
      const vh = window.innerHeight;
      const ramp = Math.max(0, Math.min(1, (window.scrollY - vh * 1.6) / (vh * 0.4)));
      const op = (0.9 * ramp).toFixed(3);
      const lTr = `perspective(1400px) translateX(${(-160 * (1 - ramp)).toFixed(1)}px) rotateY(67.5deg)`;
      const rTr = `perspective(1400px) translateX(${(160 * (1 - ramp)).toFixed(1)}px) rotateY(-67.5deg)`;
      left.style.opacity = op;
      left.style.transform = lTr;
      right.style.opacity = op;
      right.style.transform = rTr;
    };
    apply();
    const onScroll = () => apply();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    const t1 = setTimeout(apply, 200);
    const t2 = setTimeout(apply, 800);
    return () => {
      clearTimeout(t1); clearTimeout(t2);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, []);

  const panelHeight = 280;

  return (
    <>
      <div ref={leftRef} style={{
        position: 'fixed',
        left: tweaks.panelEdgeOffset,
        top: '50%',
        marginTop: -panelHeight / 2,
        height: panelHeight,
        opacity: 0,
        transform: 'perspective(1400px) translateX(-160px) rotateY(67.5deg)',
        transformOrigin: 'center center',
        filter: 'drop-shadow(0 18px 24px rgba(17,19,21,0.12))',
        pointerEvents: 'none',
        zIndex: 50,
        willChange: 'transform, opacity',
      }}>
        <SchematicPanel side="left" height={panelHeight} />
      </div>
      <div ref={rightRef} style={{
        position: 'fixed',
        right: tweaks.panelEdgeOffset,
        top: '50%',
        marginTop: -panelHeight / 2,
        height: panelHeight,
        opacity: 0,
        transform: 'perspective(1400px) translateX(160px) rotateY(-67.5deg)',
        transformOrigin: 'center center',
        filter: 'drop-shadow(0 18px 24px rgba(17,19,21,0.12))',
        pointerEvents: 'none',
        zIndex: 50,
        willChange: 'transform, opacity',
      }}>
        <SchematicPanel side="right" height={panelHeight} />
      </div>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────
// Launch film — full-bleed cinematic "see it work" band.
// Mounts the DrFryHero Stage animation (autoplay + loop, no chrome).
// ─────────────────────────────────────────────────────────────────

function LaunchFilm() {
  return (
    <section id="see-it-work" style={{ position: 'relative', background: '#081726' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '110px 24px 48px', textAlign: 'center' }}>
        <div className="mono" style={{
          fontSize: 11, letterSpacing: '0.22em', color: 'var(--amber)',
          marginBottom: 22, textTransform: 'uppercase',
          display: 'inline-flex', alignItems: 'center', gap: 10
        }}>
          <svg width="9" height="9" viewBox="0 0 10 10" aria-hidden="true" style={{ flexShrink: 0 }}>
            <rect x="5" y="0" width="7.07" height="7.07" transform="rotate(45 5 0)" fill="var(--amber)"/>
          </svg>
          See it work
        </div>
        <h2 className="serif" style={{
          fontSize: 'clamp(40px, 5.5vw, 72px)', lineHeight: 1.02,
          letterSpacing: '-0.02em', color: 'var(--porcelain)', marginBottom: 20
        }}>
          Inside the 50&nbsp;kHz field
        </h2>
        <p style={{
          fontSize: 18, lineHeight: 1.55, color: '#A9B6C6',
          maxWidth: 580, margin: '0 auto'
        }}>
          From schematic to molecule to the moment oil is turned away — the ProWave™ field, in motion.
        </p>
      </div>
      <div style={{ position: 'relative', width: '100%', height: 'min(88vh, 60vw)', minHeight: 420 }}>
        <DrFryHero controls={false} />
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────
// Mobile detection + a clean, static mobile hero (the desktop hero's
// scroll-driven edge-panel choreography collapses on narrow screens).
// ─────────────────────────────────────────────────────────────────

function useIsMobile(bp = 760) {
  const [m, setM] = useState(typeof window !== 'undefined' ? window.innerWidth <= bp : false);
  useEffect(() => {
    const f = () => setM(window.innerWidth <= bp);
    window.addEventListener('resize', f);
    return () => window.removeEventListener('resize', f);
  }, [bp]);
  return m;
}

function HeroMobile({ tweaks }) {
  return (
    <section id="hero-section" style={{
      position: 'relative', minHeight: '100vh',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      overflow: 'hidden', background: 'var(--porcelain)',
      padding: '124px 22px 92px',
    }}>
      {/* amber field glow */}
      <div style={{ position:'absolute', inset:0, pointerEvents:'none',
        background:'radial-gradient(ellipse 92% 46% at 50% 42%, rgba(242,162,58,0.12) 0%, transparent 70%)' }}/>

      {/* faint flanking schematic panels — ambient technical frame */}
      <div style={{ position:'absolute', left:-108, top:'50%', marginTop:-150, opacity:0.13, pointerEvents:'none',
        transform:'perspective(1200px) rotateY(58deg)', transformOrigin:'center', filter:'drop-shadow(0 18px 24px rgba(17,19,21,0.10))' }}>
        <SchematicPanel side="left" height={300} />
      </div>
      <div style={{ position:'absolute', right:-108, top:'50%', marginTop:-150, opacity:0.13, pointerEvents:'none',
        transform:'perspective(1200px) rotateY(-58deg)', transformOrigin:'center', filter:'drop-shadow(0 18px 24px rgba(17,19,21,0.10))' }}>
        <SchematicPanel side="right" height={300} />
      </div>

      {/* field dots */}
      {tweaks.showFieldDots && (
        <div style={{ position:'absolute', left:0, right:0, top:'24%', height:'42%', opacity:0.45, pointerEvents:'none' }}>
          <FieldDots intensity={tweaks.fieldIntensity} drive={1} />
        </div>
      )}

      {/* copy */}
      <div style={{ position:'relative', textAlign:'center', maxWidth:520, width:'100%' }}>
        <div className="mono" style={{ fontSize:10.5, letterSpacing:'0.2em', color:'var(--amber-deep)',
          marginBottom:20, textTransform:'uppercase', display:'inline-flex', alignItems:'center', gap:9,
          flexWrap:'wrap', justifyContent:'center' }}>
          <svg width="9" height="9" viewBox="0 0 10 10" aria-hidden="true" style={{ flexShrink:0 }}>
            <rect x="5" y="0" width="7.07" height="7.07" transform="rotate(45 5 0)" fill="var(--amber)"/>
          </svg>
          Engineered in Japan · Calibrated in Europe
        </div>
        <h1 className="serif" style={{ fontSize:'clamp(40px, 13vw, 60px)', lineHeight:1.02, letterSpacing:'-0.02em', marginBottom:20 }}>
          {tweaks.headlineVariant}
        </h1>
        <p style={{ fontSize:16.5, lineHeight:1.55, color:'var(--slate-800)', maxWidth:420, margin:'0 auto 32px' }}>
          {tweaks.subVariant}
        </p>
        <img src="assets/photo-counter.jpg" alt="Dr. Fry control unit and four electrode panels on a stainless counter"
          style={{ width:'100%', maxWidth:460, height:'auto', display:'block', margin:'0 auto 34px', border:'1px solid var(--warm-200)' }} />
        <div style={{ display:'flex', flexDirection:'column', gap:6, alignItems:'center' }}>
          <a href="#technology" className="mono" style={{ fontSize:10.5, letterSpacing:'0.2em', color:'var(--warm-500)', textDecoration:'none' }}>SCROLL TO EXPLORE</a>
          {[1,2,3].map(i => (
            <div key={i} style={{ width:16, height:1, background:'var(--graphite)', opacity:0.6 - i*0.16,
              animation:`scrollHint 1.6s ${i*0.15}s ease-in-out infinite` }}/>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes fieldPulse { 0%,100%{opacity:0;transform:translate(-50%,-50%) scale(0.4);} 50%{opacity:0.8;transform:translate(-50%,-50%) scale(1);} }
        @keyframes scrollHint { 0%,100%{opacity:0.2;transform:translateY(0);} 50%{opacity:0.9;transform:translateY(2px);} }
      `}</style>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────
// App
// ─────────────────────────────────────────────────────────────────

function App() {
  const [tweaks, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const isMobile = useIsMobile(760);

  return (
    <>
      <TopNav />

      {/* Hero: desktop = tall sticky scroll choreography; mobile = static */}
      {isMobile ? (
        <HeroMobile tweaks={tweaks} />
      ) : (
        <section id="hero-section" style={{ height: '260vh', position: 'relative' }}>
          <HeroStage tweaks={tweaks} />
        </section>
      )}

      <LaunchFilm />
      <Mechanism />
      <Evidence />
      <ROI />
      <Specifications />
      <Certifications />
      <Support />
      <Footer />

      <TweaksPanel title="Tweaks">
        <TweakSection title="Hero choreography">
          <TweakSlider label="Scroll speed" value={tweaks.scrollSpeed} min={0.4} max={2.0} step={0.1}
            onChange={v => setTweak('scrollSpeed', v)} />
          <TweakSlider label="Panel rest scale" value={tweaks.panelRestScale} min={0.9} max={1.8} step={0.05}
            onChange={v => setTweak('panelRestScale', v)} />
          <TweakSlider label="Panel edge scale" value={tweaks.panelMinScale} min={0.35} max={0.8} step={0.05}
            onChange={v => setTweak('panelMinScale', v)} />
          <TweakSlider label="Edge offset (px)" value={tweaks.panelEdgeOffset} min={0} max={120} step={4}
            onChange={v => setTweak('panelEdgeOffset', v)} />
        </TweakSection>
        <TweakSection title="Field visualization">
          <TweakSlider label="Dot intensity" value={tweaks.fieldIntensity} min={0} max={1} step={0.05}
            onChange={v => setTweak('fieldIntensity', v)} />
          <TweakToggle label="Show field dots" value={tweaks.showFieldDots}
            onChange={v => setTweak('showFieldDots', v)} />
        </TweakSection>
        <TweakSection title="Hero copy">
          <TweakRadio label="Headline" value={tweaks.headlineVariant}
            options={[
              "Prevention, measured.",
              "Stop the oil. Save the year.",
              "50,000 cycles per second."
            ]}
            onChange={v => setTweak('headlineVariant', v)} />
          <TweakText label="Subhead" value={tweaks.subVariant}
            onChange={v => setTweak('subVariant', v)} />
        </TweakSection>
      </TweaksPanel>
    </>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
