// @ds-adherence-ignore -- omelette starter scaffold (raw elements/hex/px by design)

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
  font = 'IBM Plex Sans, IBM Plex Sans Arabic, sans-serif',
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

  // Let a host page drive playback. The homepage embeds this in an iframe with
  // autoplay off and sends 'fariiq-play' the moment the whole frame is on
  // screen, so the animation never runs half out of view.
  React.useEffect(() => {
    const onMsg = (e) => {
      if (!e.data) return;
      if (e.data.type === 'fariiq-play') setPlaying(true);
      else if (e.data.type === 'fariiq-pause') setPlaying(false);
    };
    window.addEventListener('message', onMsg);
    // Announce only once the listener is attached, so a host that replies
    // immediately cannot have its first message land before we are listening.
    if (window.parent !== window) {
      window.parent.postMessage({ type: 'fariiq-ready' }, '*');
    }
    return () => window.removeEventListener('message', onMsg);
  }, []);

  // Auto-scale to fit viewport
  React.useEffect(() => {
    if (!stageRef.current) return;
    const el = stageRef.current;
    const measure = () => {
      const barH = 44; // playback bar height
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
  }, [duration]);

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
        background: '#0a0a0a',
        fontFamily: 'IBM Plex Sans, IBM Plex Sans Arabic, sans-serif',
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
          data-fq-canvas="1"
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
      fontFamily: 'IBM Plex Sans, IBM Plex Sans Arabic, sans-serif',
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
        width: 64, textAlign: 'end',
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
        width: 64, textAlign: 'start',
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



/* ============================================================
   Fariiq — product demo video scenes  (v2: tighter pacing + Couriers & Equipment)
   Engine (defined above in merged file): Stage, Sprite, useTime, useTimeline,
   useSprite, Easing, interpolate, animate, clamp
   ------------------------------------------------------------
   TIMELINE (seconds):
     Hook        0  – 9
     Couriers    9  – 23
     Upload      23 – 37
     Reconcile   37 – 52
     Payouts     52 – 64
     Equipment   64 – 78
     P&L         78 – 91
     Close       91 – 104
   ============================================================ */

const FONT  = "'Noto Sans', system-ui, sans-serif";
const MONO  = "'Noto Sans Mono', 'JetBrains Mono', ui-monospace, monospace";

const C = {
  gold:'#B8996F', goldDeep:'#9C7E52', goldSoft:'#E7D9C2',
  sand:'#FDF8F0', sand2:'#F6EEE0', surface:'#FFFFFF',
  slate:'#5F6B7C', slateDeep:'#2E3445', text:'#2E3445', muted:'#938B7C',
  border:'#ECE3D5', borderIn:'#F1EADC',
  green:'#3E9B6C', greenBg:'#E8F2EA',
  red:'#C25A4C', redBg:'#F8EBE7',
  amber:'#C2933C', amberBg:'#F6EEDB',
  track:'#F2ECE0',
};

// ── helpers ──────────────────────────────────────────────────
function fade(t, start, end, f = 0.45) {
  if (t < start || t > end) return 0;
  const inA = clamp((t - start) / f, 0, 1);
  const outA = clamp((end - t) / f, 0, 1);
  return Math.min(Easing.easeOutCubic(inA), Easing.easeInOutQuad(outA));
}
const money = (n, cur = 'AED') => cur + ' ' + Math.round(n).toLocaleString('en-US');
const num   = (n) => Math.round(n).toLocaleString('en-US');
const ramp  = (p, from, to, ease = Easing.easeOutCubic) => from + (to - from) * ease(clamp(p, 0, 1));
const eOut  = Easing.easeOutCubic;

// ── Cursor ───────────────────────────────────────────────────
function Cursor({ x, y, down = false }) {
  return (
    <div style={{ position: 'absolute', left: x, top: y, zIndex: 50, transform: `scale(${down ? 0.86 : 1})`, transformOrigin: 'top left', filter: 'drop-shadow(0 3px 5px rgba(0,0,0,0.25))' }}>
      <svg width="30" height="30" viewBox="0 0 24 24" fill="none">
        <path d="M5 3l14 8-6.2 1.4L9.5 19 5 3z" fill="#fff" stroke="#2E3445" strokeWidth="1.4" strokeLinejoin="round"/>
      </svg>
    </div>
  );
}

// ── Logo ─────────────────────────────────────────────────────
function Mark({ size = 34 }) { return <img src="assets/fariiq_mark.svg" alt="" style={{ height: size, width: size, display: 'block' }} />; }
function BrandLockup({ markSize = 104, textSize = 92 }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: markSize * 0.3 }}>
      <Mark size={markSize} />
      <span style={{ fontFamily: FONT, fontWeight: 800, fontSize: textSize, color: C.text, letterSpacing: '-0.03em' }}>Fariiq</span>
    </div>
  );
}

/* ============================================================
   SCENE 1 — Hook  (0 – 9s)
   ============================================================ */
function SceneHook() {
  const t = useTime();
  if (t > 9.4) return null;
  const problemO = fade(t, 0.3, 4.2, 0.45);
  const logoO    = fade(t, 4.6, 9.4, 0.5);
  const chips = ['Talabat', 'Deliveroo', 'HungerStation', 'Careem', 'Keeta', 'Mrsool'];
  const lp = clamp((t - 4.6) / 0.85, 0, 1);
  const markScale = ramp(lp, 0.6, 1, Easing.easeOutBack);
  const ruleW = ramp(clamp((t - 5.1) / 0.9, 0, 1), 0, 380);
  const breathe = 1 + 0.012 * Math.sin((t - 4.6) * 0.9);

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
      <div style={{ position: 'absolute', width: 760, height: 760, borderRadius: '50%', background: C.sand2, top: -240, insetInlineStart: -200, opacity: 0.7 }} />
      <div style={{ position: 'absolute', width: 560, height: 560, borderRadius: '50%', background: '#EFEAE0', bottom: -220, insetInlineEnd: -160, opacity: 0.7 }} />

      <div style={{ position: 'absolute', inset: 0, opacity: problemO }}>
        {chips.map((c, i) => {
          const ci = fade(t, 0.4 + i * 0.1, 4.2, 0.4);
          const cols = [[360, 250], [1300, 210], [250, 760], [1430, 700], [720, 180], [1120, 820]];
          const drift = Math.sin((t + i) * 0.6) * 7;
          return (
            <div key={c} style={{
              position: 'absolute', left: cols[i][0], top: cols[i][1] + drift, opacity: ci * 0.9,
              fontFamily: MONO, fontSize: 19, color: C.slate, background: C.surface,
              border: `1px solid ${C.border}`, borderRadius: 10, padding: '11px 18px',
              boxShadow: '0 8px 22px rgba(120,100,70,0.08)', transform: `rotate(${(i % 2 ? 1 : -1) * 3}deg)`, whiteSpace: 'nowrap',
            }}>{c}<span style={{ color: C.muted }}>  ·  rider_export.csv</span></div>
          );
        })}
        <div style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%,-50%)', textAlign: 'center', width: 1180 }}>
          <div style={{ fontFamily: MONO, fontSize: 17, letterSpacing: '0.28em', color: C.gold, marginBottom: 26, opacity: fade(t, 0.6, 4.2, 0.4) }}>EVERY PLATFORM. EVERY PAY MODEL. EVERY WEEK.</div>
          <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: 76, lineHeight: 1.08, color: C.text, letterSpacing: '-0.02em', textWrap: 'balance' }}>
            Running a delivery fleet<br />is a thousand moving parts.
          </div>
        </div>
      </div>

      <div style={{ position: 'absolute', inset: 0, opacity: logoO, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ transform: `scale(${markScale * breathe})`, transformOrigin: 'center' }}><BrandLockup markSize={132} textSize={116} /></div>
        <div style={{ width: ruleW, height: 3, background: C.gold, borderRadius: 2, marginTop: 38, marginBottom: 26 }} />
        <div style={{ fontFamily: FONT, fontWeight: 500, fontSize: 32, color: C.slate, opacity: fade(t, 5.4, 9.4, 0.5) }}>One platform, from recruitment to reconciliation.</div>
      </div>
    </div>
  );
}

/* ============================================================
   Shared product-window chrome  (Scenes 2–7)
   ============================================================ */
const WIN = { x: 150, y: 64, w: 1620, h: 838 };
const SIDE_W = 244;

function Sidebar({ active }) {
  const items = [
    ['Dashboard', 'M3 13h8V3H3v10zm10 8h8V3h-8v18zM3 21h8v-6H3v6z'],
    ['Couriers',  'M16 11a4 4 0 1 0-8 0 4 4 0 0 0 8 0zM4 21a8 8 0 0 1 16 0'],
    ['Upload',    'M12 16V4m0 0L7 9m5-5l5 5M5 20h14'],
    ['Reconciliation', 'M9 7h11M9 12h11M9 17h11M4 7l1 1 2-2M4 12l1 1 2-2M4 17l1 1 2-2'],
    ['Payouts',   'M3 7h18v12H3zM3 11h18M7 15h4'],
    ['Equipment', 'M3 7l9-4 9 4v10l-9 4-9-4V7zM3 7l9 4 9-4M12 11v10'],
    ['P&L',       'M4 19V5m0 14h16M8 15l3-4 3 2 4-6'],
  ];
  return (
    <div style={{ width: SIDE_W, height: '100%', background: '#FBF6EE', borderRight: `1px solid ${C.border}`, padding: '22px 16px', flexShrink: 0, boxSizing: 'border-box' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '4px 8px 20px' }}>
        <Mark size={30} />
        <span style={{ fontFamily: FONT, fontWeight: 800, fontSize: 22, color: C.text, letterSpacing: '-0.01em' }}>Fariiq</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        {items.map(([label, d]) => {
          const on = label === active;
          return (
            <div key={label} style={{
              display: 'flex', alignItems: 'center', gap: 13, padding: '10px 13px', borderRadius: 10,
              background: on ? C.surface : 'transparent', color: on ? C.text : C.slate,
              fontFamily: FONT, fontWeight: on ? 700 : 500, fontSize: 16,
              boxShadow: on ? '0 2px 10px rgba(120,100,70,0.08)' : 'none',
              border: on ? `1px solid ${C.border}` : '1px solid transparent',
            }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={on ? C.gold : C.muted} strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d={d} /></svg>
              {label}
              {on && <div style={{ marginInlineStart: 'auto', width: 6, height: 6, borderRadius: 3, background: C.gold }} />}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function TopBar({ title, sub }) {
  return (
    <div style={{ height: 76, borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', padding: '0 34px', flexShrink: 0, background: C.surface }}>
      <div>
        <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: 25, color: C.text, letterSpacing: '-0.01em' }}>{title}</div>
        <div style={{ fontFamily: FONT, fontSize: 14.5, color: C.muted, marginTop: 2 }}>{sub}</div>
      </div>
      <div style={{ marginInlineStart: 'auto', display: 'flex', alignItems: 'center', gap: 14 }}>
        <div style={{ fontFamily: MONO, fontSize: 13, color: C.slate, background: C.sand, border: `1px solid ${C.border}`, borderRadius: 8, padding: '7px 13px' }}>AED · UAE</div>
        <div style={{ width: 38, height: 38, borderRadius: '50%', background: C.goldSoft, border: `1px solid ${C.gold}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: FONT, fontWeight: 700, color: C.goldDeep, fontSize: 15 }}>FA</div>
      </div>
    </div>
  );
}

function ProductWindow({ children }) {
  const t = useTime();
  const o = fade(t, 8.5, 91.6, 0.55);
  if (o <= 0) return null;
  const rise = ramp(clamp((t - 8.5) / 0.6, 0, 1), 26, 0, eOut);
  return (
    <div style={{ position: 'absolute', left: WIN.x, top: WIN.y, width: WIN.w, height: WIN.h, opacity: o, transform: `translateY(${rise}px)` }}>
      <div style={{ width: '100%', height: '100%', background: C.surface, borderRadius: 16, overflow: 'hidden', boxShadow: '0 40px 90px rgba(80,66,40,0.18), 0 8px 24px rgba(80,66,40,0.10)', border: `1px solid ${C.border}`, display: 'flex', flexDirection: 'column' }}>
        <div style={{ height: 46, background: '#FBF6EE', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', padding: '0 18px', flexShrink: 0 }}>
          <div style={{ display: 'flex', gap: 8 }}>
            {['#E5A89B', '#E8CE92', '#A9C9A6'].map((c, i) => <div key={i} style={{ width: 12, height: 12, borderRadius: '50%', background: c }} />)}
          </div>
          <div style={{ margin: '0 auto', display: 'flex', alignItems: 'center', gap: 9, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, padding: '5px 16px', fontFamily: MONO, fontSize: 13, color: C.slate }}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={C.green} strokeWidth="2.4"><path d="M6 11V8a6 6 0 0 1 12 0v3" /><rect x="4.5" y="11" width="15" height="9" rx="2" fill={C.green} stroke="none"/></svg>
            app.fariiq.com
          </div>
        </div>
        <div style={{ flex: 1, position: 'relative', minHeight: 0 }}>{children}</div>
      </div>
    </div>
  );
}

function RouteContent({ start, end, children }) {
  const t = useTime();
  const o = fade(t, start, end, 0.4);
  if (o <= 0) return null;
  const p = clamp((t - start) / (end - start), 0, 1);
  const scale = ramp(p, 1.0, 1.03, Easing.linear);
  return (
    <div style={{ position: 'absolute', inset: 0, opacity: o }}>
      <div style={{ width: '100%', height: '100%', transformOrigin: '50% 42%', transform: `scale(${scale})` }}>{children}</div>
    </div>
  );
}

// shared small bits
function Badge({ tone }) {
  const d = tone === 'red' ? 'M12 8v5M12 16v.5' : 'M5 12l4 4 10-10';
  return (
    <span style={{ width: 22, height: 22, borderRadius: '50%', background: tone === 'red' ? C.red : C.green, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d={d} /></svg>
    </span>
  );
}
function StatusPill({ label, tone }) {
  const map = { green: [C.greenBg, C.green, '#CDE5D5'], gold: [C.sand2, C.goldDeep, C.goldSoft], slate: ['#EEF1F4', C.slate, '#DCE2E8'], muted: ['#F0EDE6', C.muted, '#E2DCCF'], amber: [C.amberBg, C.amber, '#EAD9AE'] };
  const [bg, fg, bd] = map[tone];
  return <span style={{ fontFamily: FONT, fontSize: 13.5, fontWeight: 700, color: fg, background: bg, border: `1px solid ${bd}`, borderRadius: 999, padding: '5px 13px', whiteSpace: 'nowrap' }}>{label}</span>;
}
function StatChip({ label, value, tone = 'neutral', pulse = false }) {
  const map = { neutral: [C.surface, C.text, C.border], green: [C.greenBg, C.green, '#CDE5D5'], red: [C.redBg, C.red, '#EDCBC4'] };
  const [bg, fg, bd] = map[tone];
  const t = useTime();
  const ps = pulse ? 1 + 0.04 * Math.max(0, Math.sin(t * 4)) : 1;
  return (
    <div style={{ background: bg, border: `1px solid ${bd}`, borderRadius: 12, padding: '13px 22px', minWidth: 170, transform: `scale(${ps})` }}>
      <div style={{ fontFamily: FONT, fontSize: 13, color: C.muted, fontWeight: 600 }}>{label}</div>
      <div style={{ fontFamily: FONT, fontSize: 28, fontWeight: 800, color: fg, marginTop: 4, letterSpacing: '-0.01em' }}>{value}</div>
    </div>
  );
}

/* ============================================================
   ROUTE: Couriers — lifecycle  (9 – 23)
   ============================================================ */
function RouteCouriers({ start }) {
  const t = useTime();
  const lt = t - start;
  const stages = [
    ['Recruited', 'Home country'],
    ['Visa & docs', 'Processing'],
    ['Onboarded', 'In-country'],
    ['Active', 'Deployed'],
    ['Offboarded', 'Exit & clearance'],
  ];
  const reach = ramp(clamp((lt - 0.6) / 2.6, 0, 1), 0, 3, Easing.easeInOutCubic); // fills to "Active"
  const fillPct = (clamp(reach, 0, 4) / 4) * 100;

  const list = [
    { name: 'Bishnu Rai',  loc: 'Kathmandu, Nepal',  stage: 'Recruiting',     tone: 'slate' },
    { name: 'Arman Hossain', loc: 'Dhaka → Dubai',    stage: 'Onboarding',     tone: 'gold' },
    { name: 'Ahmed Khan',  loc: 'Dubai, UAE',         stage: 'Active',         tone: 'green' },
    { name: 'Sunil Thapa', loc: 'Cleared · departed', stage: 'Offboarded',     tone: 'muted' },
  ];

  return (
    <div style={{ display: 'flex', width: '100%', height: '100%' }}>
      <Sidebar active="Couriers" />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <TopBar title="Courier profile" sub="One master record per courier — from recruitment to final exit" />
        <div style={{ flex: 1, padding: '26px 40px' }}>
          {/* profile + lifecycle card */}
          <div style={{ opacity: fade(t, start + 0.3, 23, 0.4), background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, padding: '24px 28px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 18, marginBottom: 26 }}>
              <div style={{ width: 58, height: 58, borderRadius: '50%', background: C.goldSoft, border: `1px solid ${C.gold}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: FONT, fontWeight: 800, color: C.goldDeep, fontSize: 21 }}>AK</div>
              <div>
                <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: 24, color: C.text }}>Ahmed Khan</div>
                <div style={{ fontFamily: FONT, fontSize: 15, color: C.muted, marginTop: 3 }}>Gov ID 784-1990-xxxxxx · Motorbike · Recruited from <b style={{ color: C.slate }}>Lahore, Pakistan</b></div>
              </div>
              <div style={{ marginInlineStart: 'auto', display: 'flex', gap: 9 }}>
                <span style={{ fontFamily: MONO, fontSize: 13, color: C.slate, background: C.sand, border: `1px solid ${C.border}`, borderRadius: 8, padding: '7px 12px' }}>Talabat #2449595</span>
                <span style={{ fontFamily: MONO, fontSize: 13, color: C.slate, background: C.sand, border: `1px solid ${C.border}`, borderRadius: 8, padding: '7px 12px' }}>Deliveroo #DR-8842</span>
              </div>
            </div>
            {/* lifecycle stepper */}
            <div style={{ position: 'relative', padding: '0 6px' }}>
              <div style={{ position: 'absolute', insetInlineStart: '10%', insetInlineEnd: '10%', top: 15, height: 3, background: C.track, borderRadius: 2 }} />
              <div style={{ position: 'absolute', insetInlineStart: '10%', top: 15, height: 3, width: `calc(${fillPct}% * 0.8)`, background: C.gold, borderRadius: 2 }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', position: 'relative' }}>
                {stages.map(([s, sub], i) => {
                  const done = reach >= i - 0.05;
                  const current = i === 3 && reach >= 2.95;
                  const future = i === 4;
                  const col = future ? C.muted : done ? (current ? C.green : C.gold) : C.track;
                  return (
                    <div key={s} style={{ width: 130, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                      <div style={{ width: current ? 34 : 30, height: current ? 34 : 30, borderRadius: '50%', background: done ? col : C.surface, border: `2.5px solid ${done ? col : C.borderIn}`, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: current ? `0 0 0 6px ${C.greenBg}` : 'none', transition: 'none' }}>
                        {done && !future && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12l4 4 10-10" /></svg>}
                      </div>
                      <div style={{ fontFamily: FONT, fontWeight: 700, fontSize: 15.5, color: future ? C.muted : C.text, marginTop: 12 }}>{s}</div>
                      <div style={{ fontFamily: FONT, fontSize: 12.5, color: C.muted, marginTop: 2 }}>{sub}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
          {/* fleet list across the lifecycle */}
          <div style={{ marginTop: 20, border: `1px solid ${C.border}`, borderRadius: 13, overflow: 'hidden' }}>
            {list.map((r, i) => {
              const ro = fade(t, start + 1.0 + i * 0.2, 23, 0.35);
              return (
                <div key={r.name} style={{ opacity: ro, display: 'flex', alignItems: 'center', gap: 15, padding: '15px 24px', borderTop: i ? `1px solid ${C.borderIn}` : 'none', fontFamily: FONT, fontSize: 16.5, color: C.text }}>
                  <div style={{ width: 34, height: 34, borderRadius: '50%', background: C.sand2, fontSize: 12.5, fontWeight: 700, color: C.slate, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{r.name.split(' ').map(s => s[0]).join('')}</div>
                  <div style={{ fontWeight: 600, minWidth: 210 }}>{r.name}</div>
                  <div style={{ color: C.slate, fontSize: 15, minWidth: 220 }}>{r.loc}</div>
                  <div style={{ marginInlineStart: 'auto' }}><StatusPill label={r.stage} tone={r.tone} /></div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   ROUTE: Upload  (23 – 37)
   ============================================================ */
function RouteUpload({ start }) {
  const t = useTime();
  const lt = t - start;
  const dragP = clamp((lt - 0.8) / 1.3, 0, 1);
  const cx = ramp(dragP, 1190, 610, Easing.easeInOutCubic);
  const cy = ramp(dragP, 540, 300, Easing.easeInOutCubic);
  const dropped = lt > 2.3;
  const dzActive = lt > 0.7 && lt < 2.5;
  const files = [
    { name: 'Talabat_UAE_Jan1-15.csv', rows: 1284, plat: 'Talabat',       appear: 2.3 },
    { name: 'Deliveroo_W2.csv',        rows: 962,  plat: 'Deliveroo',     appear: 2.7 },
    { name: 'HungerStation_Jan.csv',   rows: 734,  plat: 'HungerStation', appear: 3.1 },
  ];
  return (
    <div style={{ display: 'flex', width: '100%', height: '100%' }}>
      <Sidebar active="Upload" />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <TopBar title="Upload timesheets" sub="Import raw rider exports — we map the columns for you" />
        <div style={{ flex: 1, padding: '30px 40px', position: 'relative' }}>
          <div style={{ height: 232, borderRadius: 16, border: `2px dashed ${dzActive ? C.gold : C.borderIn}`, background: dzActive ? '#FBF4E8' : C.sand, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
            <svg width="46" height="46" viewBox="0 0 24 24" fill="none" stroke={C.gold} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M12 16V4m0 0L7 9m5-5l5 5M5 20h14" /></svg>
            <div style={{ fontFamily: FONT, fontWeight: 700, fontSize: 21, color: C.text }}>Drop platform CSVs to import</div>
            <div style={{ fontFamily: FONT, fontSize: 15.5, color: C.muted }}>Talabat · Deliveroo · HungerStation · Careem · Keeta — pickup-dropoff, flat &amp; hourly</div>
          </div>
          <div style={{ marginTop: 26, display: 'flex', flexDirection: 'column', gap: 12 }}>
            {files.map((f) => {
              const fo = fade(t, start + f.appear, 37, 0.35);
              if (fo <= 0) return null;
              const pp = clamp((lt - f.appear) / 1.2, 0, 1);
              const done = pp >= 1;
              const shownRows = Math.round(f.rows * eOut(pp));
              return (
                <div key={f.name} style={{ opacity: fo, display: 'flex', alignItems: 'center', gap: 16, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: '15px 20px' }}>
                  <div style={{ width: 42, height: 42, borderRadius: 9, background: C.sand2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={C.slate} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" /><path d="M14 3v5h5" /></svg>
                  </div>
                  <div style={{ minWidth: 280 }}>
                    <div style={{ fontFamily: MONO, fontSize: 15.5, color: C.text, fontWeight: 500 }}>{f.name}</div>
                    <div style={{ fontFamily: FONT, fontSize: 13.5, color: C.muted, marginTop: 2 }}>{f.plat}</div>
                  </div>
                  <div style={{ flex: 1, height: 8, background: C.track, borderRadius: 5, overflow: 'hidden', maxWidth: 360 }}>
                    <div style={{ width: `${pp * 100}%`, height: '100%', background: done ? C.green : C.gold, borderRadius: 5 }} />
                  </div>
                  <div style={{ width: 150, textAlign: 'end', fontFamily: MONO, fontSize: 15, color: done ? C.green : C.slate, fontWeight: 600 }}>{done ? `${num(f.rows)} rows ✓` : `${num(shownRows)} rows`}</div>
                </div>
              );
            })}
          </div>
          {lt > 0.6 && lt < 2.45 && (
            <div style={{ position: 'absolute', left: cx, top: cy, transform: `rotate(-4deg) scale(${dropped ? 0.6 : 1})`, opacity: dropped ? 0 : 1, display: 'flex', alignItems: 'center', gap: 11, background: C.surface, border: `1px solid ${C.gold}`, borderRadius: 11, padding: '12px 16px', boxShadow: '0 16px 34px rgba(120,100,70,0.22)', zIndex: 40 }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={C.gold} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" /><path d="M14 3v5h5" /></svg>
              <span style={{ fontFamily: MONO, fontSize: 14, color: C.text }}>Talabat_UAE_Jan1-15.csv</span>
            </div>
          )}
          {lt > 0.6 && lt < 2.4 && <Cursor x={cx - 12} y={cy + 6} down={dragP > 0.02 && dragP < 0.98} />}
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   ROUTE: Reconciliation  (37 – 52)
   ============================================================ */
function RouteReconcile({ start }) {
  const t = useTime();
  const lt = t - start;
  const rows = [
    { name: 'Ahmed Khan',   plat: 'Talabat',       orders: 312, paid: 4680, calc: 4680 },
    { name: 'Rahul Sharma', plat: 'Deliveroo',     orders: 268, paid: 4020, calc: 4020 },
    { name: 'Mohammed Ali', plat: 'Talabat',       orders: 341, paid: 5115, calc: 5115 },
    { name: 'Priya Nair',   plat: 'HungerStation', orders: 198, paid: 2970, calc: 3090 },
    { name: 'Omar Farouk',  plat: 'Deliveroo',     orders: 224, paid: 3360, calc: 3360 },
    { name: 'Jay Patel',    plat: 'Talabat',       orders: 290, paid: 4350, calc: 4350 },
  ];
  const checkedCount = rows.filter((_, i) => lt > 0.8 + i * 0.4 + 0.35).length;
  const discShown = rows.filter((r, i) => r.paid !== r.calc && lt > 0.8 + i * 0.4 + 0.35).length;
  return (
    <div style={{ display: 'flex', width: '100%', height: '100%' }}>
      <Sidebar active="Reconciliation" />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <TopBar title="Reconciliation" sub="Platform payments vs. your configured rate cards" />
        <div style={{ flex: 1, padding: '24px 40px' }}>
          <div style={{ display: 'flex', gap: 14, marginBottom: 20 }}>
            <StatChip label="Couriers checked" value={`${checkedCount} / ${rows.length}`} tone="neutral" />
            <StatChip label="Matched" value={num(checkedCount - discShown)} tone="green" />
            <StatChip label="Discrepancies caught" value={num(discShown)} tone={discShown ? 'red' : 'neutral'} pulse={discShown > 0} />
          </div>
          <div style={{ border: `1px solid ${C.border}`, borderRadius: 13, overflow: 'hidden' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1.2fr 0.8fr 1.1fr 1.1fr 1.3fr', background: '#FBF6EE', padding: '13px 22px', fontFamily: FONT, fontSize: 13.5, fontWeight: 700, color: C.muted, letterSpacing: '0.03em', textTransform: 'uppercase' }}>
              <div>Courier</div><div>Platform</div><div>Orders</div><div>Platform paid</div><div>System rate</div><div style={{ textAlign: 'end' }}>Status</div>
            </div>
            {rows.map((r, i) => {
              const appearAt = 0.4 + i * 0.4;
              const ro = clamp((lt - appearAt) / 0.35, 0, 1);
              const resolved = lt > appearAt + 0.35;
              const isDisc = r.paid !== r.calc;
              const diff = r.calc - r.paid;
              return (
                <div key={r.name} style={{ display: 'grid', gridTemplateColumns: '1.6fr 1.2fr 0.8fr 1.1fr 1.1fr 1.3fr', alignItems: 'center', padding: '16px 22px', borderTop: `1px solid ${C.borderIn}`, background: resolved && isDisc ? C.redBg : C.surface, opacity: ro, transform: `translateY(${ramp(ro, 8, 0)}px)`, fontFamily: FONT, fontSize: 16.5, color: C.text }}>
                  <div style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 11 }}>
                    <div style={{ width: 30, height: 30, borderRadius: '50%', background: C.sand2, fontSize: 12.5, fontFamily: FONT, fontWeight: 700, color: C.slate, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{r.name.split(' ').map(s => s[0]).join('')}</div>
                    {r.name}
                  </div>
                  <div style={{ color: C.slate }}>{r.plat}</div>
                  <div style={{ fontFamily: MONO }}>{r.orders}</div>
                  <div style={{ fontFamily: MONO }}>{money(r.paid)}</div>
                  <div style={{ fontFamily: MONO }}>{money(r.calc)}</div>
                  <div style={{ textAlign: 'end' }}>
                    {!resolved
                      ? <span style={{ display: 'inline-block', width: 18, height: 18, border: `2.5px solid ${C.borderIn}`, borderTopColor: C.gold, borderRadius: '50%', transform: `rotate(${lt * 520}deg)` }} />
                      : isDisc
                        ? <span style={{ fontFamily: FONT, fontWeight: 700, color: C.red, fontSize: 15.5, display: 'inline-flex', alignItems: 'center', gap: 7 }}><Badge tone="red" />Short {money(diff)}</span>
                        : <span style={{ fontFamily: FONT, fontWeight: 700, color: C.green, fontSize: 15.5, display: 'inline-flex', alignItems: 'center', gap: 7 }}><Badge tone="green" />Matched</span>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   ROUTE: Payouts  (52 – 64)
   ============================================================ */
function RoutePayouts({ start }) {
  const t = useTime();
  const lt = t - start;
  const total = ramp(clamp(lt / 1.8, 0, 1), 0, 1284500, eOut);
  const riders = ramp(clamp(lt / 1.6, 0, 1), 0, 1420, eOut);
  const clickP = clamp((lt - 2.4) / 1.1, 0, 1);
  const curX = ramp(clickP, 760, 1250, Easing.easeInOutCubic);
  const curY = ramp(clickP, 540, 276, Easing.easeInOutCubic);
  const clicked = lt > 3.6;
  const cards = [
    { name: 'Ahmed Khan',   plat: 'Talabat · Deliveroo', net: 4680 },
    { name: 'Mohammed Ali', plat: 'Talabat',             net: 5115 },
    { name: 'Omar Farouk',  plat: 'Deliveroo',           net: 3360 },
    { name: 'Jay Patel',    plat: 'Talabat · Keeta',     net: 4350 },
  ];
  return (
    <div style={{ display: 'flex', width: '100%', height: '100%' }}>
      <Sidebar active="Payouts" />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <TopBar title="Payouts" sub="Cycle: 1–15 Jan 2026 · bi-weekly" />
        <div style={{ flex: 1, padding: '28px 40px', position: 'relative' }}>
          <div style={{ display: 'flex', gap: 22 }}>
            <div style={{ flex: 1, background: 'linear-gradient(135deg,#FBF4E8,#F6EEE0)', border: `1px solid ${C.goldSoft}`, borderRadius: 16, padding: '26px 30px' }}>
              <div style={{ fontFamily: FONT, fontSize: 15, color: C.goldDeep, fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase' }}>Total payout this cycle</div>
              <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: 58, color: C.text, letterSpacing: '-0.02em', marginTop: 8, fontVariantNumeric: 'tabular-nums' }}>{money(total)}</div>
              <div style={{ fontFamily: FONT, fontSize: 17, color: C.slate, marginTop: 6 }}>across <b style={{ color: C.text, fontVariantNumeric: 'tabular-nums' }}>{num(riders)}</b> couriers · 6 platforms</div>
            </div>
            <div style={{ width: 360, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, padding: '26px 28px', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 16 }}>
              <div style={{ fontFamily: FONT, fontSize: 16.5, color: C.slate }}>Approved &amp; ready for the bank file.</div>
              <div style={{ alignSelf: 'flex-start', display: 'inline-flex', alignItems: 'center', gap: 10, padding: '15px 26px', borderRadius: 12, background: clicked ? C.green : C.gold, color: '#fff', fontFamily: FONT, fontWeight: 700, fontSize: 17.5, boxShadow: clicked ? 'none' : '0 10px 24px rgba(184,153,111,0.4)', transform: `scale(${lt > 3.3 && lt < 3.6 ? 0.96 : 1})` }}>
                {clicked
                  ? <><svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12l4 4 10-10" /></svg>Payout file exported</>
                  : <><svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round"><path d="M12 16V4m0 12l-4-4m4 4l4-4M5 20h14" /></svg>Generate payout file</>}
              </div>
            </div>
          </div>
          <div style={{ marginTop: 24, border: `1px solid ${C.border}`, borderRadius: 13, overflow: 'hidden' }}>
            {cards.map((c, i) => {
              const ro = fade(t, start + 0.5 + i * 0.18, 64, 0.35);
              return (
                <div key={c.name} style={{ opacity: ro, display: 'flex', alignItems: 'center', gap: 15, padding: '17px 24px', borderTop: i ? `1px solid ${C.borderIn}` : 'none', fontFamily: FONT, fontSize: 17, color: C.text }}>
                  <div style={{ width: 34, height: 34, borderRadius: '50%', background: C.sand2, fontSize: 13, fontWeight: 700, color: C.slate, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{c.name.split(' ').map(s => s[0]).join('')}</div>
                  <div style={{ fontWeight: 600, minWidth: 220 }}>{c.name}</div>
                  <div style={{ color: C.slate, fontSize: 15 }}>{c.plat}</div>
                  <div style={{ marginInlineStart: 'auto', fontFamily: MONO, fontWeight: 600 }}>{money(c.net)}</div>
                  <div style={{ width: 92, textAlign: 'end', fontFamily: FONT, fontSize: 14, fontWeight: 700, color: C.green }}>Approved</div>
                </div>
              );
            })}
          </div>
          {lt > 2.1 && lt < 4.8 && <Cursor x={curX} y={curY} down={lt > 3.35 && lt < 3.6} />}
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   ROUTE: Equipment  (64 – 78)
   ============================================================ */
function EquipKpi({ label, target, color, lt, delay }) {
  const v = ramp(clamp((lt - delay) / 1.4, 0, 1), 0, target, eOut);
  return (
    <div style={{ flex: 1, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 13, padding: '16px 20px' }}>
      <div style={{ fontFamily: FONT, fontSize: 13, color: C.muted, fontWeight: 600 }}>{label}</div>
      <div style={{ fontFamily: FONT, fontSize: 32, fontWeight: 800, color, marginTop: 4, fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.01em' }}>{num(v)}</div>
    </div>
  );
}
function RouteEquipment({ start }) {
  const t = useTime();
  const lt = t - start;
  const items = [
    { id: 'Motorbike · DXB J-1234', type: 'Vehicle',     who: 'Ahmed Khan',  dep: 1500, status: 'Assigned',    tone: 'green' },
    { id: 'Delivery phone · #PH-0421', type: 'Device',   who: 'Mohammed Ali', dep: 800, status: 'Assigned',    tone: 'green' },
    { id: 'Thermal bag · #BG-2290',  type: 'Gear',        who: 'Rahul Sharma', dep: 150, status: 'Assigned',    tone: 'green' },
    { id: 'E-scooter · DXB K-9921',  type: 'Vehicle',     who: '—',            dep: 1200, status: 'In maintenance', tone: 'amber' },
    { id: 'Motorbike · DXB L-4407',  type: 'Vehicle',     who: '—',            dep: 0,    status: 'Available',   tone: 'slate' },
  ];
  return (
    <div style={{ display: 'flex', width: '100%', height: '100%' }}>
      <Sidebar active="Equipment" />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <TopBar title="Equipment" sub="Vehicles, devices &amp; gear — assignments, deposits &amp; insurance" />
        <div style={{ flex: 1, padding: '26px 40px' }}>
          <div style={{ display: 'flex', gap: 14, marginBottom: 22 }}>
            <EquipKpi label="Total assets" target={1860} color={C.text} lt={lt} delay={0.3} />
            <EquipKpi label="Assigned" target={1612} color={C.green} lt={lt} delay={0.5} />
            <EquipKpi label="Available" target={188} color={C.slate} lt={lt} delay={0.7} />
            <EquipKpi label="In maintenance" target={60} color={C.amber} lt={lt} delay={0.9} />
          </div>
          <div style={{ border: `1px solid ${C.border}`, borderRadius: 13, overflow: 'hidden' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1.4fr 1fr 1.1fr', background: '#FBF6EE', padding: '13px 24px', fontFamily: FONT, fontSize: 13.5, fontWeight: 700, color: C.muted, letterSpacing: '0.03em', textTransform: 'uppercase' }}>
              <div>Asset</div><div>Type</div><div>Assigned to</div><div>Deposit</div><div style={{ textAlign: 'end' }}>Status</div>
            </div>
            {items.map((it, i) => {
              const ro = clamp((lt - (0.6 + i * 0.3)) / 0.4, 0, 1);
              return (
                <div key={it.id} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1.4fr 1fr 1.1fr', alignItems: 'center', padding: '16px 24px', borderTop: `1px solid ${C.borderIn}`, opacity: ro, transform: `translateY(${ramp(ro, 8, 0)}px)`, fontFamily: FONT, fontSize: 16.5, color: C.text }}>
                  <div style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: C.sand2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke={C.slate} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 7l9-4 9 4v10l-9 4-9-4V7zM3 7l9 4 9-4M12 11v10" /></svg>
                    </div>
                    {it.id}
                  </div>
                  <div style={{ color: C.slate }}>{it.type}</div>
                  <div style={{ color: it.who === '—' ? C.muted : C.text }}>{it.who}</div>
                  <div style={{ fontFamily: MONO, color: it.dep ? C.text : C.muted }}>{it.dep ? money(it.dep) : '—'}</div>
                  <div style={{ textAlign: 'end' }}><StatusPill label={it.status} tone={it.tone} /></div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   ROUTE: P&L  (78 – 91)
   ============================================================ */
function BarRow({ label, w, value, color, dark }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
      <div style={{ width: 120, fontFamily: FONT, fontSize: 15, color: C.muted, fontWeight: 600 }}>{label}</div>
      <div style={{ flex: 1, height: 26, background: C.track, borderRadius: 7, overflow: 'hidden' }}>
        <div style={{ width: `${w}%`, height: '100%', background: dark ? '#D8CBB4' : color, borderRadius: 7 }} />
      </div>
      <div style={{ width: 180, textAlign: 'end', fontFamily: MONO, fontSize: 16, fontWeight: 600, color: C.text }}>{value}</div>
    </div>
  );
}
function Tot({ label, v }) {
  return (
    <div>
      <div style={{ fontFamily: FONT, fontSize: 14, color: C.muted, fontWeight: 600 }}>{label}</div>
      <div style={{ fontFamily: FONT, fontWeight: 700, fontSize: 26, color: C.text, marginTop: 3, fontVariantNumeric: 'tabular-nums' }}>{v}</div>
    </div>
  );
}
function RoutePnl({ start }) {
  const t = useTime();
  const lt = t - start;
  const plats = [
    { name: 'Talabat',       rev: 842000, cost: 631000, color: C.gold },
    { name: 'Deliveroo',     rev: 564000, cost: 438000, color: C.slate },
    { name: 'HungerStation', rev: 391000, cost: 312000, color: C.goldDeep },
  ];
  const maxRev = 842000;
  const totRev = plats.reduce((s, p) => s + p.rev, 0);
  const totCost = plats.reduce((s, p) => s + p.cost, 0);
  const totMarginP = ((totRev - totCost) / totRev) * 100;
  const gp = clamp((lt - 1.8) / 1.4, 0, 1);
  return (
    <div style={{ display: 'flex', width: '100%', height: '100%' }}>
      <Sidebar active="P&L" />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <TopBar title="Platform P&L" sub="Revenue, cost &amp; margin per platform · this cycle" />
        <div style={{ flex: 1, padding: '26px 40px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            {plats.map((p, i) => {
              const pp = clamp((lt - (0.4 + i * 0.35)) / 1.3, 0, 1);
              const marginP = ((p.rev - p.cost) / p.rev) * 100;
              const revW = (p.rev / maxRev) * 100 * eOut(pp);
              const costW = (p.cost / maxRev) * 100 * eOut(pp);
              return (
                <div key={p.name} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, padding: '20px 26px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16 }}>
                    <div style={{ width: 11, height: 11, borderRadius: 3, background: p.color, marginInlineEnd: 11 }} />
                    <div style={{ fontFamily: FONT, fontWeight: 700, fontSize: 20, color: C.text }}>{p.name}</div>
                    <div style={{ marginInlineStart: 'auto', display: 'flex', alignItems: 'baseline', gap: 8 }}>
                      <span style={{ fontFamily: FONT, fontSize: 14, color: C.muted, fontWeight: 600 }}>MARGIN</span>
                      <span style={{ fontFamily: FONT, fontWeight: 800, fontSize: 30, color: C.green, fontVariantNumeric: 'tabular-nums' }}>{(marginP * eOut(pp)).toFixed(1)}%</span>
                    </div>
                  </div>
                  <BarRow label="Revenue" w={revW} value={money(p.rev * eOut(pp))} color={p.color} />
                  <div style={{ height: 10 }} />
                  <BarRow label="Courier cost" w={costW} value={money(p.cost * eOut(pp))} color={C.borderIn} dark />
                </div>
              );
            })}
          </div>
          <div style={{ marginTop: 18, opacity: fade(t, start + 1.8, 91, 0.35), display: 'flex', alignItems: 'center', background: 'linear-gradient(135deg,#FBF4E8,#F6EEE0)', border: `1px solid ${C.goldSoft}`, borderRadius: 14, padding: '20px 28px', gap: 40 }}>
            <Tot label="Total revenue" v={money(totRev * gp)} />
            <Tot label="Total cost" v={money(totCost * gp)} />
            <div style={{ marginInlineStart: 'auto', textAlign: 'end' }}>
              <div style={{ fontFamily: FONT, fontSize: 14, color: C.goldDeep, fontWeight: 700, letterSpacing: '0.03em', textTransform: 'uppercase' }}>Blended margin</div>
              <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: 44, color: C.green, fontVariantNumeric: 'tabular-nums' }}>{(totMarginP * gp).toFixed(1)}%</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   Captions  (lower band, routes 9–91)
   ============================================================ */
function Captions() {
  const t = useTime();
  const caps = [
    { s: 9.5,  e: 22.6, step: 'STEP 01 · COURIERS',      line: 'Track every courier from recruitment in their home country to final exit.' },
    { s: 23.4, e: 36.6, step: 'STEP 02 · UPLOAD',        line: 'Drop in raw exports from any delivery platform.' },
    { s: 37.4, e: 51.6, step: 'STEP 03 · RECONCILE',     line: 'Every payment checked against your rate cards — automatically.' },
    { s: 52.4, e: 63.6, step: 'STEP 04 · PAYOUTS',       line: 'Accurate courier payouts, ready in one click.' },
    { s: 64.4, e: 77.6, step: 'STEP 05 · EQUIPMENT',     line: 'Assign and track every vehicle, device and bag — deposits and insurance included.' },
    { s: 78.4, e: 90.6, step: 'STEP 06 · PROFITABILITY', line: 'See your true margin on every platform.' },
  ];
  const c = caps.find(x => t >= x.s - 0.5 && t <= x.e + 0.5);
  if (!c) return null;
  const o = fade(t, c.s - 0.4, c.e + 0.4, 0.4);
  return (
    <div style={{ position: 'absolute', left: 0, right: 0, bottom: 54, display: 'flex', flexDirection: 'column', alignItems: 'center', opacity: o }}>
      <div style={{ fontFamily: MONO, fontSize: 15, letterSpacing: '0.22em', color: C.gold, marginBottom: 12, whiteSpace: 'nowrap' }}>{c.step}</div>
      <div style={{ fontFamily: FONT, fontWeight: 700, fontSize: 33, color: C.text, letterSpacing: '-0.01em', textAlign: 'center', textWrap: 'balance', maxWidth: 1160 }}>{c.line}</div>
    </div>
  );
}

/* ============================================================
   SCENE — Close  (91 – 104s)
   ============================================================ */
function SceneClose() {
  const t = useTime();
  if (t < 90.8) return null;
  const curr = ['AED', 'SAR', 'BHD', 'KWD', 'QAR', 'OMR'];
  const logoP = clamp((t - 96.4) / 0.85, 0, 1);
  const markScale = ramp(logoP, 0.7, 1, Easing.easeOutBack);
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ position: 'absolute', width: 720, height: 720, borderRadius: '50%', background: C.sand2, top: -260, insetInlineEnd: -200, opacity: 0.7 }} />
      <div style={{ position: 'absolute', width: 540, height: 540, borderRadius: '50%', background: '#EFEAE0', bottom: -200, insetInlineStart: -160, opacity: 0.7 }} />

      <div style={{ opacity: fade(t, 91.3, 96.2, 0.45), position: 'absolute', textAlign: 'center', width: 1300, top: '50%', transform: 'translateY(-50%)' }}>
        <div style={{ fontFamily: FONT, fontSize: 30, color: C.slate, fontWeight: 500, marginBottom: 22 }}>Recruitment, reconciliation &amp; payroll that used to take</div>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 34, fontFamily: FONT, fontWeight: 800, letterSpacing: '-0.02em' }}>
          <span style={{ fontSize: 92, color: C.muted, textDecoration: 'line-through', textDecorationThickness: 5 }}>days</span>
          <svg className="fq-dir-arrow" width="80" height="44" viewBox="0 0 80 44" fill="none" stroke={C.gold} strokeWidth="5" strokeLinecap="round" strokeLinejoin="round"><path d="M6 22h60m0 0l-16-15m16 15l-16 15" /></svg>
          <span style={{ fontSize: 110, color: C.text }}>minutes</span>
        </div>
      </div>

      <div style={{ opacity: fade(t, 96.4, 104, 0.5), position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%,-50%)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div style={{ transform: `scale(${markScale})`, transformOrigin: 'center' }}><BrandLockup markSize={120} textSize={106} /></div>
        <div style={{ marginTop: 34, display: 'flex', alignItems: 'center', gap: 13, opacity: fade(t, 97.4, 104, 0.5) }}>
          <span style={{ fontFamily: FONT, fontSize: 27, color: C.slate, fontWeight: 500 }}>Book a demo at</span>
          <span style={{ fontFamily: FONT, fontSize: 27, color: C.goldDeep, fontWeight: 800 }}>fariiq.com</span>
        </div>
        <div style={{ display: 'flex', gap: 11, marginTop: 44 }}>
          {curr.map((cu, i) => (
            <div key={cu} style={{ fontFamily: MONO, fontSize: 16, color: C.slate, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 9, padding: '9px 15px', opacity: fade(t, 98.2 + i * 0.08, 104, 0.4) }}>{cu}</div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* seek bridge for verification — exposes window.__seek(t)/__pause() */
function SeekBridge() {
  const tl = useTimeline();
  React.useEffect(() => {
    window.__seek = (x) => { tl.setPlaying(false); tl.setTime(x); };
    window.__pause = () => tl.setPlaying(false);
    window.__play = () => tl.setPlaying(true);
  }, [tl]);
  return null;
}

/* ============================================================
   Root
   ============================================================ */
function FariiqVideo() {
  // The homepage embeds this page and holds playback until the whole frame is
  // on screen, so it asks for autoplay off and sends a play message itself.
  const autoplay = (() => {
    try { return new URLSearchParams(location.search).get('autoplay') !== '0'; }
    catch { return true; }
  })();
  return (
    <Stage width={1920} height={1080} duration={104} background={C.sand} persistKey="fariiq-demo" autoplay={autoplay}>
      <SeekBridge />
      <SceneHook />
      <ProductWindow>
        <RouteContent start={9}  end={23}><RouteCouriers start={9} /></RouteContent>
        <RouteContent start={23} end={37}><RouteUpload start={23} /></RouteContent>
        <RouteContent start={37} end={52}><RouteReconcile start={37} /></RouteContent>
        <RouteContent start={52} end={64}><RoutePayouts start={52} /></RouteContent>
        <RouteContent start={64} end={78}><RouteEquipment start={64} /></RouteContent>
        <RouteContent start={78} end={91}><RoutePnl start={78} /></RouteContent>
      </ProductWindow>
      <Captions />
      <SceneClose />
    </Stage>
  );
}

module.exports = { FariiqVideo };
