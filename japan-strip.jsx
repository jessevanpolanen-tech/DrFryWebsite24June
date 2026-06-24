// JapanStrip — two marquee rows of operator tiles (Umbrel-app-store style),
// sliding in opposite directions, sitting above CTAs. Real entries first;
// the rest are clearly-marked placeholders to swap as logos arrive.
// Exposes window.JapanStrip.
(function () {
  // Real, verified entries.
  const REAL = [
    { name: 'Seven-Eleven Japan', sub: 'Conbini · nationwide', img: 'assets/seven-eleven.png' },
    { name: 'Musashino Corp.', sub: 'Production facility', mono: 'M', tint: 'linear-gradient(135deg,#F2A23A,#B45309)' },
  ];

  // Placeholder tiles — swap name/logo as real customers are confirmed.
  const TINTS = [
    'linear-gradient(135deg,#2A6FDB,#0B1F3B)',
    'linear-gradient(135deg,#C0392B,#7A1F16)',
    'linear-gradient(135deg,#1BAA8F,#0E5C4D)',
    'linear-gradient(135deg,#7C5CFF,#3A2B8C)',
    'linear-gradient(135deg,#F2A23A,#B45309)',
    'linear-gradient(135deg,#3A3E44,#16181b)',
  ];
  const PLACE = Array.from({ length: 10 }).map((_, i) => ({
    name: 'Brand name', sub: 'Placeholder',
    mono: String.fromCharCode(65 + i),
    tint: TINTS[i % TINTS.length],
    placeholder: true,
  }));

  // Build two rows; interleave the real ones so they're visible in both.
  const pool = [...REAL, ...PLACE];
  const rowA = [REAL[0], ...PLACE.slice(0, 6)];
  const rowB = [REAL[1], ...PLACE.slice(6), ...PLACE.slice(0, 2)];

  function Tile({ d, dark }) {
    const cardBg = dark ? '#181a1d' : 'var(--porcelain-2)';
    const cardBorder = dark ? '#2a2d31' : 'var(--warm-200)';
    const nameColor = d.placeholder ? 'var(--warm-500)' : (dark ? 'var(--porcelain)' : 'var(--graphite)');
    return (
      <div className="jp-tile" style={{
        display: 'flex', alignItems: 'center', gap: 13, flexShrink: 0,
        background: cardBg, border: `1px solid ${cardBorder}`,
        borderRadius: 16, padding: '10px 22px 10px 10px',
      }}>
        <div style={{
          width: 44, height: 44, borderRadius: 11, flexShrink: 0,
          background: d.img ? '#ffffff' : (d.tint || 'var(--graphite)'),
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          overflow: 'hidden', padding: d.img ? 7 : 0,
          opacity: d.placeholder ? 0.55 : 1,
        }}>
          {d.img
            ? <img src={d.img} alt={d.name} style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }} />
            : <span className="serif" style={{ fontSize: 22, color: '#fff', lineHeight: 1 }}>{d.mono}</span>}
        </div>
        <div style={{ textAlign: 'left', whiteSpace: 'nowrap' }}>
          <div style={{ fontSize: 14.5, fontWeight: 600, color: nameColor, lineHeight: 1.15 }}>{d.name}</div>
          {d.sub && <div className="mono" style={{ fontSize: 9.5, letterSpacing: '0.1em', color: 'var(--warm-500)', marginTop: 3 }}>{d.sub.toUpperCase()}</div>}
        </div>
      </div>
    );
  }

  function Row({ items, dark, dir }) {
    // Duplicate the set so the -50% translate loops seamlessly.
    const doubled = [...items, ...items];
    return (
      <div className="jp-marquee-mask" style={{ overflow: 'hidden', width: '100%' }}>
        <div className={`jp-track jp-${dir}`} style={{ display: 'flex', gap: 16, width: 'max-content' }}>
          {doubled.map((d, i) => <Tile key={i} d={d} dark={dark} />)}
        </div>
      </div>
    );
  }

  function JapanStrip({ dark = true }) {
    return (
      <div style={{ width: '100%', marginBottom: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginBottom: 22 }}>
          <span style={{ width: 28, height: 1, background: dark ? '#2a2d31' : 'var(--warm-200)' }} />
          <span className="mono" style={{ fontSize: 11, letterSpacing: '0.18em', color: 'var(--warm-500)' }}>ALREADY FRYING WITH DR. FRY IN JAPAN</span>
          <span className="mono" style={{
            fontSize: 9, letterSpacing: '0.1em', color: dark ? 'var(--graphite)' : 'var(--porcelain)',
            background: 'var(--amber)', padding: '2px 6px', borderRadius: 4,
          }}>JP</span>
          <span style={{ width: 28, height: 1, background: dark ? '#2a2d31' : 'var(--warm-200)' }} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Row items={rowA} dark={dark} dir="left" />
          <Row items={rowB} dark={dark} dir="right" />
        </div>
      </div>
    );
  }

  if (!document.getElementById('jp-strip-style')) {
    const s = document.createElement('style');
    s.id = 'jp-strip-style';
    s.textContent = `
      @keyframes jp-scroll-left  { from { transform: translateX(0); }      to { transform: translateX(-50%); } }
      @keyframes jp-scroll-right { from { transform: translateX(-50%); }   to { transform: translateX(0); } }
      .jp-track.jp-left  { animation: jp-scroll-left  48s linear infinite; }
      .jp-track.jp-right { animation: jp-scroll-right 60s linear infinite; }
      .jp-marquee-mask {
        -webkit-mask-image: linear-gradient(90deg, transparent, #000 9%, #000 91%, transparent);
                mask-image: linear-gradient(90deg, transparent, #000 9%, #000 91%, transparent);
      }
      .jp-marquee-mask:hover .jp-track { animation-play-state: paused; }
      .jp-tile { transition: transform .18s ease, border-color .2s ease; }
      .jp-tile:hover { transform: translateY(-2px); border-color: var(--amber) !important; }
      @media (prefers-reduced-motion: reduce) {
        .jp-track { animation: none !important; }
        .jp-marquee-mask { overflow-x: auto; }
      }
    `;
    document.head.appendChild(s);
  }

  window.JapanStrip = JapanStrip;
})();
