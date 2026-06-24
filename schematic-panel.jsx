// Schematic SVG of an electrode panel — clean technical line drawing.
// Drawn pointing right; mirror via CSS transform for the left side so they're identical.
// viewBox is 320x420 — taller proportions so it reads as a vertical fryer-mounted panel.

function SchematicPanel({ side = 'right', height = 360, accent = '#F2A23A' }) {
  // Side dictates whether to mirror via scaleX(-1) so the brass post sits
  // toward the inner side (between the panels) on both halves.
  const mirror = side === 'left';

  // Perforation grid coordinates (in viewBox units) — centered on body (cx=160, cy=220)
  const perfCols = 8;
  const perfRows = 10;
  const perfStepX = 22;
  const perfStepY = 22;
  const perfR = 6;
  const perfX0 = 160 - (perfCols - 1) * perfStepX / 2; // 83 → grid centered on x=160
  const perfY0 = 220 - (perfRows - 1) * perfStepY / 2; // 121 → grid centered on y=220

  return (
    <svg
      viewBox="0 0 320 420"
      style={{
        height,
        width: 'auto',
        display: 'block',
        transform: mirror ? 'scaleX(-1)' : 'none',
        overflow: 'visible',
      }}
    >
      {/* Faint amber halo behind panel */}
      <defs>
        <radialGradient id={`halo-${side}`} cx="50%" cy="55%" r="60%">
          <stop offset="0%" stopColor={accent} stopOpacity="0.18"/>
          <stop offset="100%" stopColor={accent} stopOpacity="0"/>
        </radialGradient>
        <pattern id={`hatch-${side}`} width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <line x1="0" y1="0" x2="0" y2="6" stroke="#111315" strokeWidth="0.5" opacity="0.25"/>
        </pattern>
      </defs>

      <ellipse cx="160" cy="240" rx="170" ry="160" fill={`url(#halo-${side})`} />

      {/* ─── Top mounting bracket + brass post ─── */}
      {/* Bracket plate */}
      <rect x="48" y="20" width="74" height="40" fill="none" stroke="#111315" strokeWidth="1.4"/>
      <rect x="48" y="20" width="74" height="40" fill={`url(#hatch-${side})`}/>
      {/* Bolts */}
      <circle cx="60" cy="32" r="2.5" fill="none" stroke="#111315" strokeWidth="1"/>
      <circle cx="60" cy="48" r="2.5" fill="none" stroke="#111315" strokeWidth="1"/>
      <circle cx="110" cy="32" r="2.5" fill="none" stroke="#111315" strokeWidth="1"/>
      <circle cx="110" cy="48" r="2.5" fill="none" stroke="#111315" strokeWidth="1"/>
      {/* Brass post rising from bracket */}
      <rect x="78" y="0" width="14" height="22" fill="none" stroke="#111315" strokeWidth="1.4"/>
      <line x1="78" y1="6" x2="92" y2="6" stroke="#111315" strokeWidth="0.8"/>
      <line x1="78" y1="12" x2="92" y2="12" stroke="#111315" strokeWidth="0.8"/>
      {/* Connection lead going up */}
      <line x1="85" y1="0" x2="85" y2="-30" stroke={accent} strokeWidth="1.2" strokeDasharray="3 3"/>
      {/* Mounting legs connecting bracket to body */}
      <line x1="60" y1="60" x2="60" y2="80" stroke="#111315" strokeWidth="1.2"/>
      <line x1="110" y1="60" x2="110" y2="80" stroke="#111315" strokeWidth="1.2"/>

      {/* ─── Main panel body (rounded-rect outline) ─── */}
      <rect x="34" y="80" width="252" height="280" rx="8" fill="none" stroke="#111315" strokeWidth="1.6"/>
      {/* Inner offset stroke for material thickness */}
      <rect x="40" y="86" width="240" height="268" rx="6" fill="none" stroke="#111315" strokeWidth="0.5" opacity="0.4"/>

      {/* Top cutout / handle slot — centered on body (x=160) */}
      <rect x="110" y="92" width="100" height="14" rx="7" fill="none" stroke="#111315" strokeWidth="1.2"/>

      {/* ─── Perforation grid ─── */}
      {Array.from({ length: perfRows }).map((_, r) =>
        Array.from({ length: perfCols }).map((_, c) => {
          const cx = perfX0 + c * perfStepX;
          const cy = perfY0 + r * perfStepY;
          return (
            <circle key={`${r}-${c}`} cx={cx} cy={cy} r={perfR}
              fill="none" stroke="#111315" strokeWidth="0.9" />
          );
        })
      )}

      {/* ─── Side cap pads (white tabs in original photo) — symmetric about cy=220 ─── */}
      <rect x="22" y="146" width="22" height="48" rx="3" fill="#FAFAFA" stroke="#111315" strokeWidth="1.2"/>
      <rect x="22" y="246" width="22" height="48" rx="3" fill="#FAFAFA" stroke="#111315" strokeWidth="1.2"/>
      {/* Pad inner detail */}
      <line x1="28" y1="162" x2="38" y2="162" stroke="#111315" strokeWidth="0.5" opacity="0.5"/>
      <line x1="28" y1="178" x2="38" y2="178" stroke="#111315" strokeWidth="0.5" opacity="0.5"/>
      <line x1="28" y1="262" x2="38" y2="262" stroke="#111315" strokeWidth="0.5" opacity="0.5"/>
      <line x1="28" y1="278" x2="38" y2="278" stroke="#111315" strokeWidth="0.5" opacity="0.5"/>

      {/* ─── Bottom feet ─── */}
      <rect x="50" y="360" width="40" height="14" fill="#FAFAFA" stroke="#111315" strokeWidth="1.2"/>
      <rect x="230" y="360" width="40" height="14" fill="#FAFAFA" stroke="#111315" strokeWidth="1.2"/>

      {/* ─── Dimension tick (no text labels) ─── */}
      <g stroke="#6B7280">
        <line x1="290" y1="80" x2="306" y2="80" strokeWidth="0.6"/>
        <line x1="306" y1="80" x2="306" y2="360" strokeWidth="0.6"/>
        <line x1="290" y1="360" x2="306" y2="360" strokeWidth="0.6"/>
      </g>
    </svg>
  );
}

window.SchematicPanel = SchematicPanel;
