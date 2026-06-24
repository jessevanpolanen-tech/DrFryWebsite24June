// @ds-adherence-ignore -- omelette starter scaffold (raw elements/hex/px by design)
;(function(){

/* BEGIN USAGE */
// animations.jsx
// Reusable animation starter: Stage, Timeline, Sprite, easing helpers.
// Exports (to window): Stage, Sprite, PlaybackBar, TextSprite, ImageSprite, RectSprite,
//   useTime, useTimeline, useSprite, Easing, interpolate, animate, clamp.
//
// Usage (in an HTML file that loads React + Babel):
//
//   <Stage width={1280} height={720} duration={10} background="#f6f4ef">
//     <MyScene />
//   </Stage>
//
// <Stage> auto-scales to the viewport and provides the scrubber, play/pause,
// ←/→ seek, space, and 0-to-reset controls, and persists the playhead.
// Inside <Stage>, any child can call useTime() to read the current
// playhead (seconds). Or wrap content in <Sprite start={1} end={4}>...</Sprite>
// to only render during that window -- children receive a `localTime` and
// `progress` via the useSprite() hook. Use Easing + interpolate()/animate()
// for tweens; TextSprite / ImageSprite / RectSprite have built-in entry/exit.
// Build YOUR scenes by composing Sprites inside a Stage.
/* END USAGE */
// ─────────────────────────────────────────────────────────────────────────────

// ── Easing functions (hand-rolled, Popmotion-style) ─────────────────────────
// All easings take t ∈ [0,1] and return eased t ∈ [0,1] (may overshoot for back/elastic).
const Easing = {
  linear: (t) => t,

  // Quad
  easeInQuad:    (t) => t * t,
  easeOutQuad:   (t) => t * (2 - t),
  easeInOutQuad: (t) => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t),

  // Cubic
  easeInCubic:    (t) => t * t * t,
  easeOutCubic:   (t) => (--t) * t * t + 1,
  easeInOutCubic: (t) => (t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1),

  // Quart
  easeInQuart:    (t) => t * t * t * t,
  easeOutQuart:   (t) => 1 - (--t) * t * t * t,
  easeInOutQuart: (t) => (t < 0.5 ? 8 * t * t * t * t : 1 - 8 * (--t) * t * t * t),

  // Expo
  easeInExpo:  (t) => (t === 0 ? 0 : Math.pow(2, 10 * (t - 1))),
  easeOutExpo: (t) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t)),
  easeInOutExpo: (t) => {
    if (t === 0) return 0;
    if (t === 1) return 1;
    if (t < 0.5) return 0.5 * Math.pow(2, 20 * t - 10);
    return 1 - 0.5 * Math.pow(2, -20 * t + 10);
  },

  // Sine
  easeInSine:    (t) => 1 - Math.cos((t * Math.PI) / 2),
  easeOutSine:   (t) => Math.sin((t * Math.PI) / 2),
  easeInOutSine: (t) => -(Math.cos(Math.PI * t) - 1) / 2,

  // Back (overshoot)
  easeOutBack: (t) => {
    const c1 = 1.70158, c3 = c1 + 1;
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
  },
  easeInBack: (t) => {
    const c1 = 1.70158, c3 = c1 + 1;
    return c3 * t * t * t - c1 * t * t;
  },
  easeInOutBack: (t) => {
    const c1 = 1.70158, c2 = c1 * 1.525;
    return t < 0.5
      ? (Math.pow(2 * t, 2) * ((c2 + 1) * 2 * t - c2)) / 2
      : (Math.pow(2 * t - 2, 2) * ((c2 + 1) * (t * 2 - 2) + c2) + 2) / 2;
  },

  // Elastic
  easeOutElastic: (t) => {
    const c4 = (2 * Math.PI) / 3;
    if (t === 0) return 0;
    if (t === 1) return 1;
    return Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
  },
};

// ── Core interpolation helpers ──────────────────────────────────────────────

// Clamp a value to [min, max]
const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

// interpolate([0, 0.5, 1], [0, 100, 50], ease?) -> fn(t)
// Popmotion-style: linearly maps t across input keyframes to output values,
// with optional easing per segment (single fn or array of fns).
function interpolate(input, output, ease = Easing.linear) {
  return (t) => {
    if (t <= input[0]) return output[0];
    if (t >= input[input.length - 1]) return output[output.length - 1];
    for (let i = 0; i < input.length - 1; i++) {
      if (t >= input[i] && t <= input[i + 1]) {
        const span = input[i + 1] - input[i];
        const local = span === 0 ? 0 : (t - input[i]) / span;
        const easeFn = Array.isArray(ease) ? (ease[i] || Easing.linear) : ease;
        const eased = easeFn(local);
        return output[i] + (output[i + 1] - output[i]) * eased;
      }
    }
    return output[output.length - 1];
  };
}

// animate({from, to, start, end, ease})(t) — simpler single-segment tween.
// Returns `from` before `start`, `to` after `end`.
function animate({ from = 0, to = 1, start = 0, end = 1, ease = Easing.easeInOutCubic }) {
  return (t) => {
    if (t <= start) return from;
    if (t >= end) return to;
    const local = (t - start) / (end - start);
    return from + (to - from) * ease(local);
  };
}

// ── Timeline context ────────────────────────────────────────────────────────

const TimelineContext = React.createContext({ time: 0, duration: 10, playing: false });

const useTime = () => React.useContext(TimelineContext).time;
const useTimeline = () => React.useContext(TimelineContext);

// ── Sprite ──────────────────────────────────────────────────────────────────
// Renders children only when the playhead is inside [start, end]. Provides
// a sub-context with `localTime` (seconds since start) and `progress` (0..1).
//
//   <Sprite start={2} end={5}>
//     {({ localTime, progress }) => <Thing x={progress * 100} />}
//   </Sprite>
//
// Or as a plain wrapper — children can call useSprite() themselves.

const SpriteContext = React.createContext({ localTime: 0, progress: 0, duration: 0 });
const useSprite = () => React.useContext(SpriteContext);

function Sprite({ start = 0, end = Infinity, children, keepMounted = false }) {
  const { time } = useTimeline();
  const visible = time >= start && time <= end;
  if (!visible && !keepMounted) return null;

  const duration = end - start;
  const localTime = Math.max(0, time - start);
  const progress = duration > 0 && isFinite(duration)
    ? clamp(localTime / duration, 0, 1)
    : 0;

  const value = { localTime, progress, duration, visible };

  return (
    <SpriteContext.Provider value={value}>
      {typeof children === 'function' ? children(value) : children}
    </SpriteContext.Provider>
  );
}

// ── Sample sprite components ────────────────────────────────────────────────

// TextSprite: fades/slides text in on entry, holds, then fades out on exit.
// Props: text, x, y, size, color, font, entryDur, exitDur, align
function TextSprite({
  text,
  x = 0, y = 0,
  size = 48,
  color = '#111',
  font = 'Inter, system-ui, sans-serif',
  weight = 600,
  entryDur = 0.45,
  exitDur = 0.35,
  entryEase = Easing.easeOutBack,
  exitEase = Easing.easeInCubic,
  align = 'left',
  letterSpacing = '-0.01em',
}) {
  const { localTime, duration } = useSprite();
  const exitStart = Math.max(0, duration - exitDur);

  let opacity = 1;
  let ty = 0;

  if (localTime < entryDur) {
    const t = entryEase(clamp(localTime / entryDur, 0, 1));
    opacity = t;
    ty = (1 - t) * 16;
  } else if (localTime > exitStart) {
    const t = exitEase(clamp((localTime - exitStart) / exitDur, 0, 1));
    opacity = 1 - t;
    ty = -t * 8;
  }

  const translateX = align === 'center' ? '-50%' : align === 'right' ? '-100%' : '0';

  return (
    <div style={{
      position: 'absolute',
      left: x, top: y,
      transform: `translate(${translateX}, ${ty}px)`,
      opacity,
      fontFamily: font,
      fontSize: size,
      fontWeight: weight,
      color,
      letterSpacing,
      whiteSpace: 'pre',
      lineHeight: 1.1,
      willChange: 'transform, opacity',
    }}>
      {text}
    </div>
  );
}

// ImageSprite: scales + fades in; optional Ken Burns drift during hold.
function ImageSprite({
  src,
  x = 0, y = 0,
  width = 400, height = 300,
  entryDur = 0.6,
  exitDur = 0.4,
  kenBurns = false,
  kenBurnsScale = 1.08,
  radius = 12,
  fit = 'cover',
  placeholder = null, // {label: string} for striped placeholder
}) {
  const { localTime, duration } = useSprite();
  const exitStart = Math.max(0, duration - exitDur);

  let opacity = 1;
  let scale = 1;

  if (localTime < entryDur) {
    const t = Easing.easeOutCubic(clamp(localTime / entryDur, 0, 1));
    opacity = t;
    scale = 0.96 + 0.04 * t;
  } else if (localTime > exitStart) {
    const t = Easing.easeInCubic(clamp((localTime - exitStart) / exitDur, 0, 1));
    opacity = 1 - t;
    scale = (kenBurns ? kenBurnsScale : 1) + 0.02 * t;
  } else if (kenBurns) {
    const holdSpan = exitStart - entryDur;
    const holdT = holdSpan > 0 ? (localTime - entryDur) / holdSpan : 0;
    scale = 1 + (kenBurnsScale - 1) * holdT;
  }

  const content = placeholder ? (
    <div style={{
      width: '100%', height: '100%',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'repeating-linear-gradient(135deg, #e9e6df 0 10px, #dcd8cf 10px 20px)',
      color: '#6b6458',
      fontFamily: 'JetBrains Mono, ui-monospace, monospace',
      fontSize: 13,
      letterSpacing: '0.04em',
      textTransform: 'uppercase',
    }}>
      {placeholder.label || 'image'}
    </div>
  ) : (
    <img src={src} alt="" style={{ width: '100%', height: '100%', objectFit: fit, display: 'block' }} />
  );

  return (
    <div style={{
      position: 'absolute',
      left: x, top: y,
      width, height,
      opacity,
      transform: `scale(${scale})`,
      transformOrigin: 'center',
      borderRadius: radius,
      overflow: 'hidden',
      willChange: 'transform, opacity',
    }}>
      {content}
    </div>
  );
}

// RectSprite: simple rectangle that animates position/size/color via props.
// Useful demo primitive — takes a `render` fn for per-frame customization.
function RectSprite({
  x = 0, y = 0,
  width = 100, height = 100,
  color = '#111',
  radius = 8,
  entryDur = 0.4,
  exitDur = 0.3,
  render, // optional: (ctx) => style overrides
}) {
  const spriteCtx = useSprite();
  const { localTime, duration } = spriteCtx;
  const exitStart = Math.max(0, duration - exitDur);

  let opacity = 1;
  let scale = 1;

  if (localTime < entryDur) {
    const t = Easing.easeOutBack(clamp(localTime / entryDur, 0, 1));
    opacity = clamp(localTime / entryDur, 0, 1);
    scale = 0.4 + 0.6 * t;
  } else if (localTime > exitStart) {
    const t = Easing.easeInQuad(clamp((localTime - exitStart) / exitDur, 0, 1));
    opacity = 1 - t;
    scale = 1 - 0.15 * t;
  }

  const overrides = render ? render(spriteCtx) : {};

  return (
    <div style={{
      position: 'absolute',
      left: x, top: y,
      width, height,
      background: color,
      borderRadius: radius,
      opacity,
      transform: `scale(${scale})`,
      transformOrigin: 'center',
      willChange: 'transform, opacity',
      ...overrides,
    }} />
  );
}


function Stage({
  width = 1280,
  height = 720,
  duration = 10,
  background = '#f6f4ef',
  fps = 60,
  loop = true,
  autoplay = true,
  persistKey = 'animstage',
  controls = true,
  frameColor = '#0a0a0a',
  children,
}) {
  const [time, setTime] = React.useState(() => {
    try {
      const v = parseFloat(localStorage.getItem(persistKey + ':t') || '0');
      return isFinite(v) ? clamp(v, 0, duration) : 0;
    } catch { return 0; }
  });
  const [playing, setPlaying] = React.useState(autoplay);
  const [hoverTime, setHoverTime] = React.useState(null);
  const [scale, setScale] = React.useState(1);

  const stageRef = React.useRef(null);
  const canvasRef = React.useRef(null);
  const rafRef = React.useRef(null);
  const lastTsRef = React.useRef(null);

  // Persist playhead
  React.useEffect(() => {
    try { localStorage.setItem(persistKey + ':t', String(time)); } catch {}
  }, [time, persistKey]);

  // Auto-scale to fit viewport
  React.useEffect(() => {
    if (!stageRef.current) return;
    const el = stageRef.current;
    const measure = () => {
      const barH = controls ? 44 : 0; // playback bar height
      const s = Math.min(
        el.clientWidth / width,
        (el.clientHeight - barH) / height
      );
      setScale(Math.max(0.05, s));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    window.addEventListener('resize', measure);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, [width, height]);

  // Animation loop
  React.useEffect(() => {
    if (!playing) {
      lastTsRef.current = null;
      return;
    }
    const step = (ts) => {
      if (lastTsRef.current == null) lastTsRef.current = ts;
      const dt = (ts - lastTsRef.current) / 1000;
      lastTsRef.current = ts;
      setTime((t) => {
        let next = t + dt;
        if (next >= duration) {
          if (loop) next = next % duration;
          else { next = duration; setPlaying(false); }
        }
        return next;
      });
      rafRef.current = requestAnimationFrame(step);
    };
    rafRef.current = requestAnimationFrame(step);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      lastTsRef.current = null;
    };
  }, [playing, duration, loop]);

  // Keyboard: space = play/pause, ← → = seek
  React.useEffect(() => {
    if (!controls) return;
    const onKey = (e) => {
      if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) return;
      if (e.code === 'Space') {
        e.preventDefault();
        setPlaying(p => !p);
      } else if (e.code === 'ArrowLeft') {
        setTime(t => clamp(t - (e.shiftKey ? 1 : 0.1), 0, duration));
      } else if (e.code === 'ArrowRight') {
        setTime(t => clamp(t + (e.shiftKey ? 1 : 0.1), 0, duration));
      } else if (e.key === '0' || e.code === 'Home') {
        setTime(0);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [duration, controls]);

  const displayTime = hoverTime != null ? hoverTime : time;

  const ctxValue = React.useMemo(
    () => ({ time: displayTime, duration, playing, setTime, setPlaying }),
    [displayTime, duration, playing]
  );

  return (
    <div
      ref={stageRef}
      style={{
        position: 'absolute', inset: 0,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center',
        background: frameColor,
        fontFamily: 'Inter, system-ui, sans-serif',
      }}
    >
      {/* Canvas area — vertically centered in remaining space */}
      <div style={{
        flex: 1,
        width: '100%',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        overflow: 'hidden',
        minHeight: 0,
      }}>
        <div
          ref={canvasRef}
          style={{
            width, height,
            background,
            position: 'relative',
            transform: `scale(${scale})`,
            transformOrigin: 'center',
            flexShrink: 0,
            boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
            overflow: 'hidden',
          }}
        >
          <TimelineContext.Provider value={ctxValue}>
            {children}
          </TimelineContext.Provider>
        </div>
      </div>

      {/* Playback bar — stacked below canvas, never overlapping */}
      {controls && (
      <PlaybackBar
        time={displayTime}
        actualTime={time}
        duration={duration}
        playing={playing}
        onPlayPause={() => setPlaying(p => !p)}
        onReset={() => { setTime(0); }}
        onSeek={(t) => setTime(t)}
        onHover={(t) => setHoverTime(t)}
      />
      )}
    </div>
  );
}

// ── Playback bar ────────────────────────────────────────────────────────────
// Play/pause, return-to-begin, scrub track, time display.
// Uses fixed-width time fields so layout doesn't thrash.

function PlaybackBar({ time, duration, playing, onPlayPause, onReset, onSeek, onHover }) {
  const trackRef = React.useRef(null);
  const [dragging, setDragging] = React.useState(false);

  const timeFromEvent = React.useCallback((e) => {
    const rect = trackRef.current.getBoundingClientRect();
    const x = clamp((e.clientX - rect.left) / rect.width, 0, 1);
    return x * duration;
  }, [duration]);

  const onTrackMove = (e) => {
    if (!trackRef.current) return;
    const t = timeFromEvent(e);
    if (dragging) {
      onSeek(t);
    } else {
      onHover(t);
    }
  };

  const onTrackLeave = () => {
    if (!dragging) onHover(null);
  };

  const onTrackDown = (e) => {
    setDragging(true);
    const t = timeFromEvent(e);
    onSeek(t);
    onHover(null);
  };

  React.useEffect(() => {
    if (!dragging) return;
    const onUp = () => setDragging(false);
    const onMove = (e) => {
      if (!trackRef.current) return;
      const t = timeFromEvent(e);
      onSeek(t);
    };
    window.addEventListener('mouseup', onUp);
    window.addEventListener('mousemove', onMove);
    return () => {
      window.removeEventListener('mouseup', onUp);
      window.removeEventListener('mousemove', onMove);
    };
  }, [dragging, timeFromEvent, onSeek]);

  const pct = duration > 0 ? (time / duration) * 100 : 0;
  const fmt = (t) => {
    const total = Math.max(0, t);
    const m = Math.floor(total / 60);
    const s = Math.floor(total % 60);
    const cs = Math.floor((total * 100) % 100);
    return `${String(m).padStart(1, '0')}:${String(s).padStart(2, '0')}.${String(cs).padStart(2, '0')}`;
  };

  const mono = 'JetBrains Mono, ui-monospace, SFMono-Regular, monospace';

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12,
      padding: '8px 16px',
      background: 'rgba(20,20,20,0.92)',
      borderTop: '1px solid rgba(255,255,255,0.08)',
      width: '100%',
      maxWidth: 680,
      alignSelf: 'center',

      borderRadius: 8,
      color: '#f6f4ef',
      fontFamily: 'Inter, system-ui, sans-serif',
      userSelect: 'none',
      flexShrink: 0,
    }}>
      <IconButton onClick={onReset} title="Return to start (0)">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M3 2v10M12 2L5 7l7 5V2z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round"/>
        </svg>
      </IconButton>
      <IconButton onClick={onPlayPause} title="Play/pause (space)">
        {playing ? (
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <rect x="3" y="2" width="3" height="10" fill="currentColor"/>
            <rect x="8" y="2" width="3" height="10" fill="currentColor"/>
          </svg>
        ) : (
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M3 2l9 5-9 5V2z" fill="currentColor"/>
          </svg>
        )}
      </IconButton>

      {/* Current time: fixed width so it doesn't thrash */}
      <div style={{
        fontFamily: mono,
        fontSize: 12,
        fontVariantNumeric: 'tabular-nums',
        width: 64, textAlign: 'right',
        color: '#f6f4ef',
      }}>
        {fmt(time)}
      </div>

      {/* Scrub track */}
      <div
        ref={trackRef}
        onMouseMove={onTrackMove}
        onMouseLeave={onTrackLeave}
        onMouseDown={onTrackDown}
        style={{
          flex: 1,
          height: 22,
          position: 'relative',
          cursor: 'pointer',
          display: 'flex', alignItems: 'center',
        }}
      >
        <div style={{
          position: 'absolute',
          left: 0, right: 0, height: 4,
          background: 'rgba(255,255,255,0.12)',
          borderRadius: 2,
        }}/>
        <div style={{
          position: 'absolute',
          left: 0, width: `${pct}%`, height: 4,
          background: 'oklch(72% 0.12 250)',
          borderRadius: 2,
        }}/>
        <div style={{
          position: 'absolute',
          left: `${pct}%`, top: '50%',
          width: 12, height: 12,
          marginLeft: -6, marginTop: -6,
          background: '#fff',
          borderRadius: 6,
          boxShadow: '0 2px 4px rgba(0,0,0,0.4)',
        }}/>
      </div>

      {/* Duration: fixed width */}
      <div style={{
        fontFamily: mono,
        fontSize: 12,
        fontVariantNumeric: 'tabular-nums',
        width: 64, textAlign: 'left',
        color: 'rgba(246,244,239,0.55)',
      }}>
        {fmt(duration)}
      </div>
    </div>
  );
}

function IconButton({ children, onClick, title }) {
  const [hover, setHover] = React.useState(false);
  return (
    <button
      onClick={onClick}
      title={title}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        width: 28, height: 28,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: hover ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: 6,
        color: '#f6f4ef',
        cursor: 'pointer',
        padding: 0,
        transition: 'background 120ms',
      }}
    >
      {children}
    </button>
  );
}


Object.assign(window, {
  Easing, interpolate, animate, clamp,
  TimelineContext, useTime, useTimeline,
  Sprite, SpriteContext, useSprite,
  TextSprite, ImageSprite, RectSprite,
  Stage, PlaybackBar,
});

/* ════════════════════════════════════════════════════════════════════
   DrFry — Hero launch animation
   Story: product reveal → dive to molecular level → 50kHz restructures
   water into a bead-string chain → oil repelled from the food surface →
   brand end card.
   ════════════════════════════════════════════════════════════════════ */

const C = {
  bg:     '#081726',
  panel:  '#0f2740',
  cyan:   '#F2A23A',   // ProWave Amber — signature, highest hierarchy
  cyanHi: '#FFD18A',
  cyanDim:'#8a5a20',
  gold:   '#E08A22',   // fried-oil warmth
  goldHi: '#F6B45A',
  goldDp: '#B45309',   // warning copper
  ink:    '#F7F5F0',   // porcelain on dark
  sub:    '#A9B6C6',
  red:    '#C0392B',   // Evertron precision red — sparing, below amber
  line:   'rgba(150,172,205,0.13)',
};
const DISP = "'DM Serif Display', Georgia, serif";
const MONO = "'IBM Plex Mono', ui-monospace, monospace";

const lerp   = (a, b, t) => a + (b - a) * t;
const smooth = (e0, e1, x) => { const t = clamp((x - e0) / (e1 - e0), 0, 1); return t * t * (3 - 2 * t); };

function mulberry32(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
function mixHex(a, b, t){
  const pa=[parseInt(a.slice(1,3),16),parseInt(a.slice(3,5),16),parseInt(a.slice(5,7),16)];
  const pb=[parseInt(b.slice(1,3),16),parseInt(b.slice(3,5),16),parseInt(b.slice(5,7),16)];
  const c=pa.map((v,i)=>Math.round(lerp(v,pb[i],clamp(t,0,1))));
  return `rgb(${c[0]},${c[1]},${c[2]})`;
}

// localTime-window fade helper (relative to enclosing Sprite)
function useFade(inT, holdEnd, inDur = 0.45, outDur = 0.4){
  const { localTime } = useSprite();
  const a = smooth(inT, inT + inDur, localTime);
  const b = 1 - smooth(holdEnd, holdEnd + outDur, localTime);
  return Math.min(a, b);
}

// SVG self-drawing line (normalized via pathLength=1 so it scrubs cleanly)
function DrawnLine({ d, t0 = 0, t1 = 1, stroke = C.cyan, w = 2, opacity = 1, glow = 0, ease = Easing.easeInOutCubic, cap = 'round' }){
  const { localTime } = useSprite();
  const p = ease(smooth(t0, t1, localTime));
  if (p <= 0) return null;
  return (
    <path d={d} pathLength="1" fill="none" stroke={stroke} strokeWidth={w}
      strokeDasharray="1 1" strokeDashoffset={1 - p} strokeLinecap={cap} strokeLinejoin="round"
      opacity={opacity} style={glow ? { filter:`drop-shadow(0 0 ${glow}px ${stroke})` } : undefined}/>
  );
}
const fade = (t0, t1, lt) => smooth(t0, t1, lt);

// ── Persistent backdrop: deep field + drifting tech grid + dust ──────────────
const DUST = Array.from({ length: 46 }, () => {
  const r = mulberry32(Math.floor(Math.random()*1e9));
  return r;
});
const DUST_PTS = (() => { const r = mulberry32(91); return Array.from({length:48},()=>({x:r()*1920,y:r()*1080,s:0.6+r()*2.2,sp:0.15+r()*0.5,ph:r()*Math.PI*2})); })();

function Backdrop(){
  const t = useTime();
  const gx = (t * 14) % 64, gy = (t * 9) % 64;
  return (
    <div style={{ position:'absolute', inset:0, overflow:'hidden',
      background:`radial-gradient(120% 90% at 50% 38%, ${C.panel} 0%, ${C.bg} 62%, #02030a 100%)` }}>
      <div style={{ position:'absolute', inset:-64,
        backgroundImage:`linear-gradient(${C.line} 1px, transparent 1px), linear-gradient(90deg, ${C.line} 1px, transparent 1px)`,
        backgroundSize:'64px 64px', backgroundPosition:`${gx}px ${gy}px`,
        maskImage:'radial-gradient(85% 70% at 50% 45%, #000 35%, transparent 85%)',
        WebkitMaskImage:'radial-gradient(85% 70% at 50% 45%, #000 35%, transparent 85%)', opacity:0.5 }}/>
      <svg width="1920" height="1080" style={{ position:'absolute', inset:0 }}>
        {DUST_PTS.map((p,i)=>{ const yy=(p.y - t*p.sp*40)%1080; const y=(yy+1080)%1080;
          const a=0.12+0.18*(0.5+0.5*Math.sin(t*1.3+p.ph));
          return <circle key={i} cx={p.x} cy={y} r={p.s} fill={C.cyan} opacity={a}/>; })}
      </svg>
    </div>
  );
}

function Vignette(){
  return <div style={{ position:'absolute', inset:0, pointerEvents:'none',
    boxShadow:'inset 0 0 240px 60px rgba(2,4,12,0.9)',
    background:'radial-gradient(140% 100% at 50% 50%, transparent 55%, rgba(2,3,10,0.55) 100%)' }}/>;
}

// HUD label chip
function Chip({ children, x, y, color = C.cyan, opacity = 1, align='left' }){
  return (
    <div style={{ position:'absolute', left:x, top:y, opacity,
      transform: align==='right'?'translateX(-100%)':'none',
      fontFamily:MONO, fontSize:18, letterSpacing:'0.22em', color,
      textTransform:'uppercase', display:'flex', alignItems:'center', gap:10, whiteSpace:'nowrap' }}>
      <span style={{ width:7, height:7, background:color, borderRadius:1, boxShadow:`0 0 10px ${color}` }}/>
      {children}
    </div>
  );
}

/* ─── Scene 1 · Animated schematic (replaces the photo) ──────────────────── */
function SchematicReveal(){
  const { localTime } = useSprite();
  const t = useTime();

  const inOp = smooth(0, 0.3, localTime);
  const out  = smooth(6.5, 7.2, localTime);
  const scale = lerp(1, 1.55, Easing.easeInCubic(out));
  const op = inOp * (1 - out);

  const field   = smooth(2.6, 3.6, localTime);          // 50kHz field energy
  const oilTop  = lerp(866, 650, smooth(2.0, 2.8, localTime));
  const pulse   = 0.5 + 0.5 * Math.sin(t * 5);
  const plateGlow = lerp(0, 16, field) * (0.6 + 0.4 * Math.abs(Math.sin(t * 6)));
  const RED = C.red;

  // basket mesh
  const vlines = []; for (let x = 700; x <= 1220; x += 52) vlines.push(x);
  const hlines = []; for (let y = 694; y <= 846; y += 38) hlines.push(y);

  // 50 kHz waveform across the field zone
  let wd = '';
  for (let x = 815; x <= 1105; x += 6){
    const yy = 702 + Math.sin(x * 0.06 + t * 34) * 16 * field;
    wd += (x === 815 ? 'M' : 'L') + x.toFixed(0) + ' ' + yy.toFixed(1) + ' ';
  }

  const plateEls = [-15, -3, 9, 21];

  return (
    <div style={{ position:'absolute', inset:0, opacity:op, transform:`scale(${scale})`, transformOrigin:'50% 46%' }}>
      <svg width="1920" height="1080" viewBox="0 0 1920 1080" style={{ position:'absolute', inset:0 }}>
        {/* drawing frame + corner ticks */}
        <DrawnLine d="M70 70 L1850 70 L1850 1010 L70 1010 Z" t0={0} t1={0.5} stroke={C.cyanDim} w={1.5} />
        {[[70,70,1,1],[1850,70,-1,1],[70,1010,1,-1],[1850,1010,-1,-1]].map(([x,y,sx,sy],i)=>(
          <DrawnLine key={'t'+i} d={`M${x} ${y+sy*26} L${x} ${y} L${x+sx*26} ${y}`} t0={0.1} t1={0.5} stroke={C.cyan} w={2}/>
        ))}

        {/* tank */}
        <DrawnLine d="M660 600 L660 882 L1260 882 L1260 600" t0={0.4} t1={1.1} w={2.4}/>
        <DrawnLine d="M678 600 L678 866 L1242 866 L1242 600" t0={0.5} t1={1.2} stroke={C.cyanDim} w={1.5}/>
        <DrawnLine d="M632 600 L690 600" t0={0.4} t1={0.8} w={2.4}/>
        <DrawnLine d="M1230 600 L1288 600" t0={0.4} t1={0.8} w={2.4}/>

        {/* oil fill + surface */}
        <rect x={680} y={oilTop} width={560} height={Math.max(0, 866 - oilTop)} fill={C.gold} opacity={0.14}/>
        <rect x={680} y={oilTop} width={560} height={Math.max(0, 866 - oilTop)} fill="url(#og)" opacity={0.5}/>
        <defs>
          <linearGradient id="og" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={C.gold} stopOpacity="0.32"/>
            <stop offset="1" stopColor={C.goldDp} stopOpacity="0.05"/>
          </linearGradient>
        </defs>
        {oilTop < 860 && (
          <path d={`M680 ${oilTop} q140 ${6*Math.sin(t*3)} 280 0 q140 ${-6*Math.sin(t*3)} 280 0`} fill="none"
            stroke={C.goldHi} strokeWidth={2} opacity={0.6}/>
        )}

        {/* basket mesh */}
        <g opacity={0.9}>
          <DrawnLine d="M700 694 L1220 694 L1220 846 L700 846 Z" t0={1.0} t1={1.7} stroke={C.cyan} w={1.6}/>
          {vlines.map((x,i)=>(<DrawnLine key={'v'+i} d={`M${x} 694 L${x} 846`} t0={1.2} t1={1.9} stroke={C.cyanDim} w={1}/>))}
          {hlines.map((y,i)=>(<DrawnLine key={'h'+i} d={`M700 ${y} L1220 ${y}`} t0={1.3} t1={2.0} stroke={C.cyanDim} w={1}/>))}
        </g>

        {/* field zone — energized */}
        {field > 0.01 && (
          <g>
            {[668, 702, 736].map((yy,i)=>(
              <line key={'f'+i} x1={815} y1={yy} x2={1105} y2={yy} stroke={C.cyan} strokeWidth={2}
                strokeDasharray="2 12" strokeDashoffset={-(t*60)%14}
                opacity={field*(0.35+0.3*Math.sin(t*6+i))} style={{ filter:`drop-shadow(0 0 5px ${C.cyan})` }}/>
            ))}
            <path d={wd} fill="none" stroke={C.cyanHi} strokeWidth={2} opacity={field*0.7}
              style={{ filter:`drop-shadow(0 0 6px ${C.cyan})` }}/>
          </g>
        )}

        {/* mast */}
        <DrawnLine d="M960 600 L960 432" t0={0.9} t1={1.3} w={2}/>

        {/* control unit */}
        <DrawnLine d="M905 322 L1015 322 L1015 432 L905 432 Z" t0={1.1} t1={1.7} w={2.2}/>
        <DrawnLine d="M917 336 L1003 336 L1003 376 L917 376 Z" t0={1.4} t1={1.8} stroke={C.cyanDim} w={1.4}/>
        <circle cx={960} cy={404} r={12} fill="none" stroke={C.cyan} strokeWidth={2}
          opacity={smooth(1.6,1.9,localTime)} style={field>0.1?{filter:`drop-shadow(0 0 8px ${C.cyan})`}:undefined}/>
        <DrawnLine d="M960 398 L960 410" t0={1.7} t1={1.9} w={2}/>
        {/* digital readout dashes (blink when active) */}
        {field>0.1 && [0,1,2,3].map(i=>(
          <rect key={'d'+i} x={924+i*20} y={350} width={13} height={12} fill={C.cyan}
            opacity={0.25+0.6*Math.abs(Math.sin(t*8+i))}/>
        ))}

        {/* electrode plates */}
        {[[770,-20],[1150,20]].map(([px,rot],pi)=>(
          <g key={'p'+pi} transform={`translate(${px} 432) rotate(${rot})`}
            style={plateGlow?{filter:`drop-shadow(0 0 ${plateGlow}px ${C.cyan})`}:undefined}>
            <DrawnLine d="M-78 -30 L78 -30 L78 30 L-78 30 Z" t0={1.3} t1={2.0} w={2.2}/>
            {plateEls.map((y,i)=>(
              <line key={i} x1={-58} y1={y} x2={58} y2={y} stroke={mixHex(C.cyanDim, C.cyanHi, field)}
                strokeWidth={2} opacity={smooth(1.6,2.1,localTime)*(0.5+0.5*field)}/>
            ))}
          </g>
        ))}
        {/* arms control→plates */}
        <DrawnLine d="M922 372 Q860 392 806 410" t0={1.6} t1={2.1} stroke={C.cyanDim} w={1.6}/>
        <DrawnLine d="M998 372 Q1060 392 1114 410" t0={1.6} t1={2.1} stroke={C.cyanDim} w={1.6}/>

        {/* action arrows (field driven into oil) */}
        {[806, 1114].map((x,i)=>(
          <g key={'a'+i} opacity={smooth(1.9,2.4,localTime)} style={field>0.1?{filter:`drop-shadow(0 0 ${6*pulse}px ${RED})`}:undefined}>
            <DrawnLine d={`M${x} 470 L${x} 632`} t0={1.9} t1={2.3} stroke={RED} w={4}/>
            <DrawnLine d={`M${x-13} 612 L${x} 636 L${x+13} 612`} t0={2.2} t1={2.4} stroke={RED} w={4} cap="round"/>
            {field>0.1 && (
              <circle cx={x} cy={lerp(478,628,(t*0.8+i*0.5)%1)} r={5} fill={RED} opacity={0.9*field}/>
            )}
          </g>
        ))}

        {/* leader lines for labels */}
        <DrawnLine d="M960 292 L960 320" t0={1.5} t1={1.9} stroke={C.sub} w={1.2}/>
        <DrawnLine d="M560 408 L694 418" t0={1.7} t1={2.1} stroke={C.sub} w={1.2}/>
        <DrawnLine d="M1360 408 L1226 418" t0={1.7} t1={2.1} stroke={C.sub} w={1.2}/>
        <DrawnLine d="M1360 700 L1244 700" t0={2.0} t1={2.4} stroke={C.sub} w={1.2}/>
        <DrawnLine d="M560 806 L700 818" t0={2.0} t1={2.4} stroke={C.sub} w={1.2}/>

        {/* title block */}
        <DrawnLine d="M1466 916 L1850 916 L1850 1010 L1466 1010" t0={0.6} t1={1.2} stroke={C.cyanDim} w={1.4}/>
        <DrawnLine d="M1466 950 L1850 950" t0={1.0} t1={1.4} stroke={C.cyanDim} w={1}/>
        <DrawnLine d="M1640 950 L1640 1010" t0={1.1} t1={1.4} stroke={C.cyanDim} w={1}/>
      </svg>

      {/* ── HTML text labels overlay ── */}
      {(() => {
        const L = (x, y, t0, align, color, size) => ({
          position:'absolute', left:x, top:y, opacity:fade(t0, t0+0.5, localTime),
          transform:`translate(${align==='right'?'-100%':align==='center'?'-50%':'0'}, ${(1-fade(t0,t0+0.5,localTime))*5}px)`,
          fontFamily:MONO, fontSize:size||18, letterSpacing:'0.16em', color:color||C.ink,
          textTransform:'uppercase', whiteSpace:'nowrap', lineHeight:1.5,
        });
        return (
          <React.Fragment>
            <div style={{ ...L(960,256,1.5,'center',C.cyan,20) }}>50 kHz Generator · Control Unit</div>
            <div style={{ ...L(545,388,1.7,'right',C.ink,19) }}>Electrode Panel <span style={{color:C.cyan}}>(−)</span></div>
            <div style={{ ...L(1375,388,1.7,'left',C.ink,19) }}>Electrode Panel <span style={{color:C.cyan}}>(+)</span></div>
            <div style={{ ...L(1375,680,2.0,'left',C.ink,19) }}>Oil Bath<div style={{ fontSize:14, color:C.sub, letterSpacing:'0.12em', marginTop:4 }}>H₂O Field Zone</div></div>
            <div style={{ ...L(545,786,2.0,'right',C.ink,19) }}>Frying Basket</div>
            {/* title block text */}
            <div style={{ ...L(1486,924,0.9,'left',C.ink,22), letterSpacing:'-0.01em', fontFamily:DISP, fontWeight:700, textTransform:'none' }}>
              Dr<span style={{color:C.cyan}}>Fry</span>
            </div>
            <div style={{ ...L(1660,926,1.1,'left',C.sub,15) }}>Fig. 1</div>
            <div style={{ ...L(1660,952,1.2,'left',C.sub,15) }}>Scale 1:1</div>
            <div style={{ ...L(1486,962,1.1,'left',C.sub,14) }}>Electrode Oil<br/>Optimization System</div>
            {/* live readout bottom-left */}
            <div style={{ position:'absolute', left:90, top:946, opacity:field, fontFamily:MONO, fontSize:17,
              letterSpacing:'0.14em', color:C.cyan, textShadow:`0 0 12px ${C.cyan}` }}>
              ▸ FIELD ACTIVE&nbsp;&nbsp;f = 50.0 kHz&nbsp;&nbsp;H₂O Δ −34%
            </div>
          </React.Fragment>
        );
      })()}
    </div>
  );
}

/* ─── Scene 1b · Product reveal (unused, kept for reference) ──────────────── */
function ProductReveal(){
  const { localTime } = useSprite();
  const t = useTime();
  const appear = Easing.easeOutCubic(smooth(0, 0.7, localTime));
  // dive-out: scale up & fade near the end
  const out = smooth(2.7, 3.4, localTime);
  const cardScale = lerp(0.92, 1, appear) * lerp(1, 1.9, Easing.easeInCubic(out));
  const cardOpacity = appear * (1 - out);
  const scanY = lerp(-10, 520, ((t*0.55) % 1));
  const brackets = smooth(0.4, 1.0, localTime);
  const pulse = 0.55 + 0.45*Math.sin(t*5);

  const CARD_W = 820, CARD_H = 548;
  const cx = 960, cy = 512;

  return (
    <div style={{ position:'absolute', inset:0, opacity:cardOpacity,
      transform:`scale(${cardScale})`, transformOrigin:'50% 47%' }}>
      {/* glow halo */}
      <div style={{ position:'absolute', left:cx, top:cy, width:CARD_W+220, height:CARD_H+140,
        transform:'translate(-50%,-50%)', borderRadius:40,
        background:`radial-gradient(closest-side, rgba(63,232,255,0.22), transparent 75%)`, filter:'blur(8px)' }}/>
      {/* product card */}
      <div style={{ position:'absolute', left:cx, top:cy, width:CARD_W, height:CARD_H,
        transform:'translate(-50%,-50%)', borderRadius:22, overflow:'hidden',
        background:'#f4f6f8', border:`1.5px solid rgba(63,232,255,0.4)`,
        boxShadow:`0 30px 90px rgba(0,0,0,0.6), 0 0 0 1px rgba(63,232,255,0.15), inset 0 0 0 1px rgba(255,255,255,0.5)` }}>
        <img src="product.jpg" alt="DrFry unit" style={{ width:'100%', height:'100%', objectFit:'cover', display:'block' }}/>
        {/* scan line */}
        <div style={{ position:'absolute', left:0, right:0, top:scanY, height:3,
          background:`linear-gradient(90deg, transparent, ${C.cyan}, transparent)`, opacity:0.85,
          boxShadow:`0 0 18px ${C.cyan}` }}/>
        {/* cyan duotone wash to fuse the white photo into the dark world */}
        <div style={{ position:'absolute', inset:0, mixBlendMode:'multiply',
          background:'linear-gradient(180deg, rgba(207,228,242,0.25), rgba(150,196,230,0.4))' }}/>
        <div style={{ position:'absolute', inset:0, mixBlendMode:'screen',
          background:'radial-gradient(70% 60% at 50% 40%, rgba(63,232,255,0.18), transparent 70%)' }}/>
      </div>
      {/* corner brackets */}
      {[[ -1,-1],[1,-1],[-1,1],[1,1]].map(([sx,sy],i)=>(
        <div key={i} style={{ position:'absolute',
          left: cx + sx*(CARD_W/2+26) - (sx<0?0:34), top: cy + sy*(CARD_H/2+26) - (sy<0?0:34),
          width:34, height:34, opacity:brackets,
          borderTop: sy<0?`2px solid ${C.cyan}`:'none', borderBottom: sy>0?`2px solid ${C.cyan}`:'none',
          borderLeft: sx<0?`2px solid ${C.cyan}`:'none', borderRight: sx>0?`2px solid ${C.cyan}`:'none' }}/>
      ))}
      {/* HUD labels */}
      <Chip x={cx-CARD_W/2-8} y={cy-CARD_H/2-56} opacity={brackets}>DrFry · Oil Optimization System</Chip>
      <div style={{ position:'absolute', left:cx+CARD_W/2-12, top:cy-CARD_H/2-58, transform:'translateX(-100%)',
        opacity:pulse*brackets, fontFamily:MONO, fontSize:20, letterSpacing:'0.14em', color:C.cyan,
        textShadow:`0 0 14px ${C.cyan}` }}>◉ 50 kHz</div>
      {/* leader labels to electrodes */}
      <div style={{ position:'absolute', left:cx-CARD_W/2-180, top:cy-70, width:180, opacity:brackets,
        fontFamily:MONO, fontSize:15, letterSpacing:'0.16em', color:C.sub, textAlign:'right', textTransform:'uppercase' }}>
        Electrode<br/>Panel
        <div style={{ position:'absolute', right:-26, top:9, width:26, height:1, background:C.cyanDim }}/>
      </div>
      <div style={{ position:'absolute', left:cx+CARD_W/2+26, top:cy-70, width:180, opacity:brackets,
        fontFamily:MONO, fontSize:15, letterSpacing:'0.16em', color:C.sub, textTransform:'uppercase' }}>
        Electrode<br/>Panel
        <div style={{ position:'absolute', left:-26, top:9, width:26, height:1, background:C.cyanDim }}/>
      </div>
    </div>
  );
}

/* ─── Scene 2 · Molecular chamber: chaos → bead-string ───────────────────── */
const N_MOL = 13;
const MOLS = (() => {
  const r = mulberry32(23);
  return Array.from({ length:N_MOL }, (_,i)=>({
    sx: 470 + r()*980, sy: 320 + r()*440,
    phase: r()*Math.PI*2, wob: 16+r()*24, spin:(r()-0.5),
    tx: 470 + i*(980/(N_MOL-1)), ty: 560,
  }));
})();

function WaterMolecule({ x, y, scale, rot, col, glow }){
  // O + 2H, drawn in local units ~ 26px O radius
  return (
    <g transform={`translate(${x} ${y}) scale(${scale}) rotate(${rot})`} style={{ filter:`drop-shadow(0 0 ${glow}px ${col})` }}>
      <circle cx={-18} cy={-13} r={11} fill={col} opacity={0.92}/>
      <circle cx={18} cy={-13} r={11} fill={col} opacity={0.92}/>
      <circle cx={0} cy={6} r={22} fill={col}/>
      <circle cx={-7} cy={-2} r={7} fill="#ffffff" opacity={0.35}/>
    </g>
  );
}

function MolecularChamber(){
  const { localTime } = useSprite();
  const t = useTime();
  const inOp = smooth(0, 0.5, localTime) * (1 - smooth(7.5, 8.0, localTime));
  // restructuring progress
  const p = smooth(1.3, 4.0, localTime);
  const ep = Easing.easeInOutCubic(p);
  const field = smooth(0.7, 1.6, localTime);          // field/waveform energy ramp
  const plateGlow = 0.5 + 0.5*Math.abs(Math.sin(t*6));

  // molecules
  const mols = MOLS.map((m,i)=>{
    const chaos = 1 - p;
    let x = lerp(m.sx, m.tx, ep) + Math.sin(t*2.0 + m.phase)*m.wob*chaos;
    let y = lerp(m.sy, m.ty, ep) + Math.cos(t*1.6 + m.phase)*m.wob*chaos;
    const scale = lerp(1.0, 0.5, p);
    const rot = (m.spin*26*Math.sin(t*0.9+m.phase))*chaos;
    const col = mixHex('#9aa7b6', C.cyan, p);
    const glow = lerp(4, 11, p);
    return { x, y, scale, rot, col, glow, key:i };
  });
  const bonds = smooth(0.55, 0.95, p);

  // waveform path along the chain baseline (50kHz buzz)
  const amp = lerp(0, 54, field) * (1 - 0.55*p);
  let d = '';
  for (let x=470; x<=1450; x+=10){
    const yy = 560 + Math.sin(x*0.045 + t*34)*amp*(0.5+0.5*Math.sin(x*0.004));
    d += (x===470?'M':'L') + x.toFixed(0) + ' ' + yy.toFixed(1) + ' ';
  }

  const capA = useFade(2.2, 7.2, 0.5, 0.5);

  const Plate = ({ side }) => {
    const px = side<0 ? 150 : 1690;
    return (
      <div style={{ position:'absolute', left:px, top:300, width:80, height:480, transform:'translateX(-50%)',
        borderRadius:10, background:`linear-gradient(180deg, #14304a, #0a1a2c)`,
        border:`1.5px solid ${mixHex('#1c4a60', C.cyan, field)}`,
        boxShadow:`0 0 ${lerp(8,40,field)*plateGlow}px ${C.cyan}, inset 0 0 30px rgba(63,232,255,${0.15+0.4*field})` }}>
        {Array.from({length:7}).map((_,i)=>(
          <div key={i} style={{ position:'absolute', left:14, right:14, top:24+i*62, height:3, borderRadius:2,
            background:C.cyan, opacity:0.25+0.6*field*(0.5+0.5*Math.sin(t*7+i)) , boxShadow:`0 0 8px ${C.cyan}` }}/>
        ))}
      </div>
    );
  };

  return (
    <div style={{ position:'absolute', inset:0, opacity:inOp }}>
      <Plate side={-1}/>
      <Plate side={1}/>
      <Chip x={150} y={236} opacity={field}>Electrode −</Chip>
      <Chip x={1690} y={236} opacity={field} align='right'>Electrode +</Chip>

      <svg width="1920" height="1080" style={{ position:'absolute', inset:0 }}>
        {/* 50kHz waveform */}
        <path d={d} fill="none" stroke={C.cyan} strokeWidth={2} opacity={0.35*field*(1-0.6*p)}/>
        {/* bonds (bead-string chain) */}
        {mols.slice(0,-1).map((m,i)=>(
          <line key={'b'+i} x1={m.x} y1={m.y} x2={mols[i+1].x} y2={mols[i+1].y}
            stroke={C.cyan} strokeWidth={lerp(2,5,p)} opacity={bonds*0.85} strokeLinecap="round"
            style={{ filter:`drop-shadow(0 0 6px ${C.cyan})` }}/>
        ))}
        {mols.map(m=>(
          <WaterMolecule key={m.key} x={m.x} y={m.y} scale={m.scale} rot={m.rot} col={m.col} glow={m.glow}/>
        ))}
      </svg>

      {/* readouts */}
      <div style={{ position:'absolute', left:960, top:150, transform:'translateX(-50%)', textAlign:'center', opacity:field }}>
        <div style={{ fontFamily:MONO, fontSize:22, letterSpacing:'0.3em', color:C.cyan, textShadow:`0 0 16px ${C.cyan}` }}>
          50 kHz · MOLECULAR FIELD ACTIVE
        </div>
      </div>

      {/* caption */}
      <div style={{ position:'absolute', left:960, top:712, transform:'translateX(-50%)', textAlign:'center',
        opacity:capA, width:1200 }}>
        <div style={{ fontFamily:DISP, fontWeight:600, fontSize:62, color:C.ink, letterSpacing:'-0.02em' }}>
          Water, <span style={{ color:C.cyan }}>restructured.</span>
        </div>
        <div style={{ fontFamily:MONO, fontSize:22, color:C.sub, letterSpacing:'0.04em', marginTop:14 }}>
          Molecules shrink and align into stable bead-string chains.
        </div>
      </div>
    </div>
  );
}

/* ─── Scene 3 · Oil repelled from the food ───────────────────────────────── */
const DROPS = (() => { const r = mulberry32(57); return Array.from({length:7},(_,i)=>({
  x: 720 + i*78 + r()*22, delay: r()*1.6, dur: 1.4+r()*0.6, side:(r()>0.5?1:-1), r:14+r()*10 })); })();

function OilRepel(){
  const { localTime } = useSprite();
  const t = useTime();
  const inOp = smooth(0, 0.45, localTime) * (1 - smooth(4.0, 4.4, localTime));
  const shield = smooth(0.5, 1.4, localTime);
  const capA = useFade(0.7, 3.8, 0.5, 0.4);
  const surfaceY = 660;

  // food: a stack of golden fries
  const fries = [[-150,-2],[ -50,3],[50,-3],[150,2]];

  return (
    <div style={{ position:'absolute', inset:0, opacity:inOp }}>
      {/* warm oil floor */}
      <div style={{ position:'absolute', left:0, right:0, top:surfaceY, bottom:0,
        background:`linear-gradient(180deg, rgba(201,120,26,0.42), rgba(120,66,12,0.16))` }}/>
      <div style={{ position:'absolute', left:0, right:0, top:surfaceY-1, height:2,
        background:`linear-gradient(90deg, transparent, ${C.gold}, transparent)`, opacity:0.7 }}/>

      {/* the food (cross-section), with cyan restructured barrier */}
      <div style={{ position:'absolute', left:960, top:surfaceY+6, transform:'translateX(-50%)',
        display:'flex', gap:18, alignItems:'flex-start' }}>
        {fries.map(([dx,tilt],i)=>(
          <div key={i} style={{ width:62, height:230, borderRadius:'9px 9px 4px 4px',
            transform:`rotate(${tilt}deg)`,
            background:`linear-gradient(180deg, ${C.goldHi}, ${C.gold} 42%, ${C.goldDp})`,
            boxShadow:`inset 0 3px 8px rgba(255,255,255,0.5), inset 0 -10px 20px rgba(120,60,8,0.5)`,
            border:`1px solid rgba(120,60,8,0.3)`, position:'relative' }}>
            {/* restructured shimmer skin */}
            <div style={{ position:'absolute', inset:0, borderRadius:'9px 9px 4px 4px',
              boxShadow:`inset 0 0 0 2px rgba(63,232,255,${0.25+0.5*shield})`,
              background:`linear-gradient(180deg, rgba(63,232,255,${0.12*shield}), transparent 30%)` }}/>
          </div>
        ))}
      </div>

      {/* repel shield arc */}
      <svg width="1920" height="1080" style={{ position:'absolute', inset:0 }}>
        <defs>
          <linearGradient id="dropg" x1="0" y1="-1" x2="0" y2="1">
            <stop offset="0" stopColor={C.goldHi}/>
            <stop offset="0.55" stopColor={C.gold}/>
            <stop offset="1" stopColor={C.goldDp}/>
          </linearGradient>
        </defs>
        <defs>
          <linearGradient id="dropg" x1="0" y1="-1" x2="0" y2="1">
            <stop offset="0" stopColor={C.goldHi}/>
            <stop offset="0.55" stopColor={C.gold}/>
            <stop offset="1" stopColor={C.goldDp}/>
          </linearGradient>
        </defs>
        <path d={`M 700 ${surfaceY-4} Q 960 ${surfaceY-150} 1220 ${surfaceY-4}`} fill="none"
          stroke={C.cyan} strokeWidth={3} opacity={0.4*shield} strokeDasharray="4 10"
          style={{ filter:`drop-shadow(0 0 8px ${C.cyan})` }}/>
        {/* oil droplets bouncing off */}
        {DROPS.map((dp,i)=>{
          const lt = ((t*0.9 + dp.delay) % (dp.dur+0.6)) / dp.dur;
          const fall = clamp(lt, 0, 1);
          const bounce = lt > 1 ? (lt-1)/(0.6/dp.dur) : 0;
          const apex = surfaceY - 150;
          let y, x = dp.x, vUp = false;
          if (lt <= 1){ y = lerp(120, apex, Easing.easeInQuad(fall)); }
          else { const b = clamp(bounce,0,1); y = lerp(apex, 180, Easing.easeOutQuad(b)); x = dp.x + dp.side*120*b; vUp = true; }
          const op = (lt<=1?1:1-clamp(bounce,0,1))*shield;
          const r = dp.r;
          // teardrop: round bottom, tapered tail trailing the motion
          const d = `M0 ${(-1.85*r).toFixed(1)} C ${(0.42*r).toFixed(1)} ${(-0.72*r).toFixed(1)} ${r.toFixed(1)} ${(-0.5*r).toFixed(1)} ${r.toFixed(1)} 0 A ${r.toFixed(1)} ${r.toFixed(1)} 0 1 1 ${(-r).toFixed(1)} 0 C ${(-r).toFixed(1)} ${(-0.5*r).toFixed(1)} ${(-0.42*r).toFixed(1)} ${(-0.72*r).toFixed(1)} 0 ${(-1.85*r).toFixed(1)} Z`;
          // wobble + flip so the tail trails the direction of travel
          const wob = Math.sin(t*9 + i)*4;
          const rot = (vUp ? 180 : 0) + wob;
          return (
            <g key={i} transform={`translate(${x} ${y}) rotate(${rot})`} opacity={op*0.95}
              style={{ filter:`drop-shadow(0 1px 5px ${C.goldDp})` }}>
              <path d={d} fill="url(#dropg)"/>
              <path d={d} fill="none" stroke={C.goldDp} strokeWidth={1} opacity={0.5}/>
              <ellipse cx={-r*0.32} cy={r*0.12} rx={r*0.26} ry={r*0.4} fill={C.goldHi} opacity={0.75}
                transform={`rotate(-22 ${(-r*0.32).toFixed(1)} ${(r*0.12).toFixed(1)})`}/>
            </g>
          );
        })}
      </svg>

      <div style={{ position:'absolute', left:960, top:120, transform:'translateX(-50%)', textAlign:'center',
        opacity:capA, width:1300 }}>
        <div style={{ fontFamily:DISP, fontWeight:600, fontSize:64, color:C.ink, letterSpacing:'-0.02em' }}>
          So oil can&rsquo;t get <span style={{ color:C.gold }}>in.</span>
        </div>
        <div style={{ fontFamily:MONO, fontSize:22, color:C.sub, letterSpacing:'0.04em', marginTop:14 }}>
          Absorption blocked at the molecular level — from the very first second.
        </div>
      </div>
    </div>
  );
}

/* ─── Scene 4 · Brand end card ───────────────────────────────────────────── */
function EndCard(){
  const { localTime } = useSprite();
  const t = useTime();
  const a = Easing.easeOutCubic(smooth(0, 0.7, localTime));
  const barW = smooth(0.5, 1.3, localTime);
  const tagA = smooth(0.8, 1.4, localTime);
  const pulse = 0.6 + 0.4*Math.sin(t*4);
  return (
    <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column',
      alignItems:'center', justifyContent:'center', opacity:a }}>
      <div style={{ fontFamily:MONO, fontSize:20, letterSpacing:'0.34em', color:C.cyan, opacity:pulse,
        textShadow:`0 0 14px ${C.cyan}`, marginBottom:26,
        transform:`translateY(${lerp(14,0,a)}px)` }}>50 kHz · ELECTRODE OIL OPTIMIZATION</div>
      <div style={{ fontFamily:DISP, fontWeight:700, fontSize:170, lineHeight:1, letterSpacing:'-0.04em',
        color:C.ink, transform:`translateY(${lerp(22,0,a)}px)` }}>
        Dr<span style={{ color:C.cyan, textShadow:`0 0 40px rgba(63,232,255,0.6)` }}>Fry</span>
      </div>
      <div style={{ width:lerp(0,560,barW), height:3, marginTop:8,
        background:`linear-gradient(90deg, transparent, ${C.cyan}, transparent)`, boxShadow:`0 0 16px ${C.cyan}` }}/>
      <div style={{ fontFamily:DISP, fontWeight:500, fontSize:36, color:C.sub, marginTop:30,
        opacity:tagA, letterSpacing:'-0.01em' }}>
        Less oil. Engineered into every molecule.
      </div>
    </div>
  );
}

/* ─── Root ───────────────────────────────────────────────────────────────── */
function DrFryHero({ controls = true }){
  return (
    <Stage width={1920} height={1080} duration={24.0} background={C.bg} frameColor={C.bg} controls={controls} persistKey="drfry">
      <Backdrop/>
      <Sprite start={0}    end={7.2}><SchematicReveal/></Sprite>
      <Sprite start={6.8}  end={15.3}><MolecularChamber/></Sprite>
      <Sprite start={15.1} end={19.5}><OilRepel/></Sprite>
      <Sprite start={19.3} end={24.0}><EndCard/></Sprite>
      <Vignette/>
    </Stage>
  );
}
window.DrFryHero = DrFryHero;
})();

