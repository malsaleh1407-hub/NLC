import React from 'react';
import {
  AbsoluteFill,
  Audio,
  Easing,
  Img,
  OffthreadVideo,
  Sequence,
  interpolate,
  staticFile,
  useCurrentFrame,
} from 'remotion';
import {FONT, NAVY_DEEP, ORANGE, ORANGE_GLOW, SITE, WHITE} from '../brand';
import {loadBrandFonts} from '../fonts';
import {CinematicOverlay} from '../components/Atmosphere';
import {ParticleField} from '../components/ParticleField';
import {HARMONY, HARMONY_MEDIA} from '../data/harmony';

// NLC HARMONY — 62 s product commercial (1920x1080, 30 fps).
// Same structure as the MINI and CENTURY spots: hook -> name -> optics ->
// output -> photometry -> colour -> durability -> install -> applications ->
// warranty -> end card. Product imagery is the real studio photo and the
// datasheet views; every number comes from src/data/harmony.ts.

loadBrandFonts();

const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const smooth = Easing.bezier(0.22, 1, 0.36, 1);
const inOut = Easing.inOut(Easing.cubic);

const ramp = (f: number, a: number, b: number, easing = smooth) =>
  interpolate(f, [a, b], [0, 1], {...clamp, easing});

// ─── Timeline — scene lengths in frames; neighbours overlap for crossfades ────
const APP_START = 16; // applications: frames before the first word lands
const APP_WORD = 22; // applications: frames per word, product-only version
const APP_CLIP = 48; // applications: frames per word when lifestyle clips are supplied
const hasClips = HARMONY_MEDIA.lifestyle.length > 0;
const DUR = {
  hook: 150,
  title: 165,
  optics: 270,
  output: 210,
  photometry: 185,
  cct: 165,
  durability: 190,
  install: 165,
  applications: hasClips ? APP_START + HARMONY.applications.length * APP_CLIP + 12 : 165,
  warranty: 105,
  endcard: 135,
};
const OVERLAP = 10;
type SceneName = keyof typeof DUR | 'outro';
const T = {} as Record<SceneName, [number, number]>;
{
  let at = 0;
  for (const [name, d] of Object.entries(DUR) as Array<[keyof typeof DUR, number]>) {
    T[name] = [at, d];
    at += d - OVERLAP;
  }
  // The outro's light bloom starts inside the end card, from the product's glow.
  T.outro = [T.endcard[0] + 112, 78];
}
export const HARMONY_DURATION = T.outro[0] + T.outro[1];

// ─── Colour temperature ─────────────────────────────────────────────────────
// Blackbody colour relative to a 4500 K white point, so warm reads amber and
// cool reads blue the way a camera sees them.
const blackbody = (k: number): [number, number, number] => {
  const t = k / 100;
  const r = t <= 66 ? 255 : 329.698727446 * Math.pow(t - 60, -0.1332047592);
  const g = t <= 66 ? 99.4708025861 * Math.log(t) - 161.1195681661 : 288.1221695283 * Math.pow(t - 60, -0.0755148492);
  const b = t >= 66 ? 255 : t <= 19 ? 0 : 138.5177312231 * Math.log(t - 10) - 305.0447927307;
  return [r, g, b].map((v) => Math.min(255, Math.max(0, v))) as [number, number, number];
};
const WHITE_POINT = blackbody(4500);
export const cctRgb = (k: number): [number, number, number] => {
  const rel = blackbody(k).map((v, i) => v / WHITE_POINT[i]);
  const max = Math.max(...rel);
  return rel.map((v) => Math.round((v / max) * 255)) as [number, number, number];
};
const rgba = ([r, g, b]: [number, number, number], a: number) => `rgba(${r},${g},${b},${a})`;

// ─── Scene wrapper: crossfade in/out ─────────────────────────────────────────
const Scene: React.FC<{dur: number; fade?: number; children: React.ReactNode}> = ({dur, fade = 12, children}) => {
  const f = useCurrentFrame();
  const o = interpolate(f, [0, fade, dur - fade, dur], [0, 1, 1, 0], clamp);
  return <AbsoluteFill style={{opacity: o}}>{children}</AbsoluteFill>;
};

const Shot: React.FC<{name: SceneName; children: React.ReactNode}> = ({name, children}) => (
  <Sequence from={T[name][0]} durationInFrames={T[name][1]} name={name}>
    <Scene dur={T[name][1]}>{children}</Scene>
  </Sequence>
);

// ─── Product: the real studio photo, switched on ────────────────────────────
const HERO_W = 2200;
const HERO_H = 1020;
// Diffuser ellipse inside hero-prismatic.png, as fractions of the image box.
const DIFF = {cx: 0.504, cy: 0.63, rx: 0.472, ry: 0.33};

const LitHarmony: React.FC<{width: number; on: number; kelvin?: number; dark?: number}> = ({
  width,
  on,
  kelvin = 3000,
  dark = 0.1,
}) => {
  const h = (width * HERO_H) / HERO_W;
  const c = cctRgb(kelvin);
  const body = interpolate(on, [0, 1], [dark, 1], clamp);
  const ex = width * DIFF.cx;
  const ey = h * DIFF.cy;
  const erx = width * DIFF.rx;
  const ery = h * DIFF.ry;
  return (
    <div style={{position: 'relative', width, height: h}}>
      {/* Light spill onto the air around the fitting */}
      <div
        style={{
          position: 'absolute',
          left: ex - erx * 1.7,
          top: ey - ery * 2.6,
          width: erx * 3.4,
          height: ery * 5.2,
          borderRadius: '50%',
          background: `radial-gradient(ellipse at center, ${rgba(c, 0.5 * on)} 0%, ${rgba(c, 0.16 * on)} 40%, transparent 70%)`,
          filter: 'blur(40px)',
        }}
      />
      <Img
        src={staticFile('harmony/hero-prismatic.png')}
        style={{position: 'absolute', inset: 0, width, height: h, filter: `brightness(${body})`}}
      />
      {/* Emitting diffuser */}
      <div
        style={{
          position: 'absolute',
          left: ex - erx,
          top: ey - ery,
          width: erx * 2,
          height: ery * 2,
          borderRadius: '50%',
          opacity: on,
          background: `radial-gradient(ellipse at 50% 42%, rgba(255,255,255,0.96) 0%, ${rgba(
            c.map((v) => Math.round(v * 0.35 + 255 * 0.65)) as [number, number, number],
            0.93,
          )} 45%, ${rgba(c, 0.9)} 100%)`,
          boxShadow: `0 0 ${erx * 0.12}px ${erx * 0.03}px ${rgba(c, 0.55)}`,
          filter: 'blur(1.5px)',
        }}
      />
    </div>
  );
};

// ─── Shared typography ───────────────────────────────────────────────────────
const Rise: React.FC<{at: number; children: React.ReactNode; y?: number; style?: React.CSSProperties}> = ({
  at,
  children,
  y = 26,
  style,
}) => {
  const f = useCurrentFrame();
  const p = ramp(f, at, at + 20);
  return <div style={{opacity: p, transform: `translateY(${(1 - p) * y}px)`, ...style}}>{children}</div>;
};

const Headline: React.FC<{children: React.ReactNode; size?: number; style?: React.CSSProperties}> = ({
  children,
  size = 76,
  style,
}) => (
  <div style={{fontFamily: FONT, fontWeight: 300, fontSize: size, color: WHITE, letterSpacing: '0.01em', lineHeight: 1.08, ...style}}>
    {children}
  </div>
);

const Eyebrow: React.FC<{children: React.ReactNode}> = ({children}) => (
  <div style={{fontFamily: FONT, fontWeight: 600, fontSize: 22, letterSpacing: '0.32em', color: ORANGE}}>{children}</div>
);

const Chip: React.FC<{children: React.ReactNode; accent?: boolean}> = ({children, accent}) => (
  <div
    style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 14,
      padding: '14px 26px',
      borderRadius: 999,
      border: `1.5px solid ${accent ? 'rgba(246,133,31,0.7)' : 'rgba(255,255,255,0.2)'}`,
      background: 'rgba(255,255,255,0.045)',
      fontFamily: FONT,
      fontWeight: 500,
      fontSize: 28,
      color: WHITE,
      whiteSpace: 'nowrap',
    }}
  >
    <span style={{width: 9, height: 9, borderRadius: 9, background: ORANGE, boxShadow: `0 0 12px ${ORANGE}`}} />
    {children}
  </div>
);

const Rule: React.FC<{at: number; width?: number}> = ({at, width = 120}) => {
  const f = useCurrentFrame();
  return <div style={{height: 3, width: width * ramp(f, at, at + 24), background: ORANGE, borderRadius: 2}} />;
};

const fmt = (n: number) => Math.round(n).toLocaleString('en-US');

// ─── Backdrop shared by every scene ─────────────────────────────────────────
const Backdrop: React.FC = () => (
  <AbsoluteFill
    style={{background: `radial-gradient(ellipse 90% 80% at 50% 38%, #1B2052 0%, ${NAVY_DEEP} 55%, #080A22 100%)`}}
  />
);

// ════════════════════════════════════════════════════════════════════════════
// 1 · HOOK — the fitting switches on out of darkness (no flicker, one smooth rise)
const Hook: React.FC = () => {
  const f = useCurrentFrame();
  const on = ramp(f, 22, 84, inOut);
  const push = interpolate(f, [0, 150], [1.0, 1.07], clamp);
  return (
    <AbsoluteFill>
      <ParticleField count={26} opacity={0.35 * on} seed="hook" />
      <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center', top: 120}}>
        <div style={{transform: `scale(${push})`}}>
          <LitHarmony width={1250} on={on} dark={0.07} />
        </div>
      </AbsoluteFill>
      <AbsoluteFill style={{alignItems: 'center', top: 120}}>
        <Rise at={30}>
          <Headline size={70}>Some spaces just need light.</Headline>
        </Rise>
        <Rise at={78} style={{marginTop: 14}}>
          <Headline size={70} style={{color: ORANGE_GLOW, fontWeight: 400}}>
            Done right.
          </Headline>
        </Rise>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// 2 · TITLE — name, tagline, headline figure
const Title: React.FC = () => {
  const f = useCurrentFrame();
  const drift = interpolate(f, [0, 165], [30, -20], clamp);
  const letters = HARMONY.name.split('');
  return (
    <AbsoluteFill>
      <ParticleField count={18} opacity={0.25} seed="title" />
      <div style={{position: 'absolute', left: 990 + drift, top: 330}}>
        <LitHarmony width={1060} on={1} />
      </div>
      <div style={{position: 'absolute', left: 140, top: 285}}>
        <Rise at={6}>
          <Eyebrow>NLC · SURFACE / PENDANT</Eyebrow>
        </Rise>
        <div style={{display: 'flex', marginTop: 20}}>
          {letters.map((ch, i) => {
            const p = ramp(f, 10 + i * 3, 34 + i * 3);
            return (
              <span
                key={i}
                style={{
                  fontFamily: FONT,
                  fontWeight: 300,
                  fontSize: 134,
                  letterSpacing: '0.1em',
                  color: WHITE,
                  opacity: p,
                  transform: `translateY(${(1 - p) * 30}px)`,
                  display: 'inline-block',
                  textShadow: `0 0 ${40 * p}px rgba(255,210,150,0.25)`,
                }}
              >
                {ch}
              </span>
            );
          })}
        </div>
        <div style={{marginTop: 26}}>
          <Rule at={40} width={140} />
        </div>
        <Rise at={48} style={{marginTop: 30}}>
          <Headline size={46}>
            {HARMONY.tagline[0]}
            <br />
            {HARMONY.tagline[1]}
          </Headline>
        </Rise>
        <Rise at={74} style={{marginTop: 44}}>
          <Chip accent>Up to {HARMONY.efficacy} lm/W</Chip>
        </Rise>
      </div>
    </AbsoluteFill>
  );
};

// 3 · OPTICS — opal vs microprismatic, plus a macro of the real prism surface
const DiscGlow: React.FC<{src: string; size: number; on: number; soft: boolean}> = ({src, size, on, soft}) => {
  const c = cctRgb(3000);
  return (
    <div style={{position: 'relative', width: size, height: size}}>
      <div
        style={{
          position: 'absolute',
          inset: -size * (soft ? 0.42 : 0.26),
          borderRadius: '50%',
          background: `radial-gradient(circle, ${rgba(c, (soft ? 0.5 : 0.38) * on)} 0%, ${rgba(c, 0.12 * on)} 45%, transparent 70%)`,
          filter: 'blur(26px)',
        }}
      />
      <Img src={staticFile(src)} style={{position: 'absolute', inset: 0, width: size, height: size, filter: `brightness(${0.3 + 0.7 * on})`}} />
      <div
        style={{
          position: 'absolute',
          inset: size * (soft ? 0.01 : 0.035),
          borderRadius: '50%',
          opacity: on * (soft ? 0.72 : 0.5),
          background: `radial-gradient(circle at 50% 46%, rgba(255,255,255,1) 0%, ${rgba(c, soft ? 0.85 : 0.6)} ${soft ? 78 : 62}%, ${rgba(c, soft ? 0.7 : 0.25)} 100%)`,
        }}
      />
    </div>
  );
};

const Optics: React.FC = () => {
  const f = useCurrentFrame();
  const size = 440;
  const [opal, prism] = HARMONY.optics;
  const loupe = ramp(f, 132, 162);
  const pan = interpolate(f, [132, 270], [0, -90], clamp);
  const prismX = 1330;
  const discY = 300;
  const LX = 1718;
  const LY = 240;
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{alignItems: 'center', top: 96}}>
        <Rise at={4}>
          <Headline size={72}>
            Two optics. <span style={{color: ORANGE_GLOW, fontWeight: 400}}>One design.</span>
          </Headline>
        </Rise>
      </AbsoluteFill>

      {[
        {o: opal, x: 590, at: 20, soft: true, src: 'harmony/front-opal.png'},
        {o: prism, x: prismX, at: 58, soft: false, src: 'harmony/front-prismatic.png'},
      ].map(({o, x, at, soft, src}) => {
        const p = ramp(f, at, at + 26);
        const on = ramp(f, at + 18, at + 56, inOut);
        return (
          <div key={o.key} style={{position: 'absolute', left: x - size / 2, top: discY, width: size, opacity: p}}>
            <div style={{transform: `translateY(${(1 - p) * 40}px)`}}>
              <DiscGlow src={src} size={size} on={on} soft={soft} />
            </div>
            <div style={{textAlign: 'center', marginTop: 46, fontFamily: FONT, color: WHITE}}>
              <div style={{fontWeight: 600, fontSize: 38, letterSpacing: '0.2em'}}>{o.label}</div>
              <div style={{fontWeight: 300, fontSize: 30, marginTop: 10, opacity: 0.9}}>{o.line}</div>
              <div style={{fontWeight: 500, fontSize: 20, marginTop: 14, letterSpacing: '0.3em', color: ORANGE}}>{o.model}</div>
            </div>
          </div>
        );
      })}

      {/* Loupe: macro of the actual microprismatic diffuser surface */}
      {loupe > 0 ? (
        <>
          <svg width={1920} height={1080} style={{position: 'absolute', inset: 0}}>
            <line
              x1={prismX + 70}
              y1={discY + size / 2 - 70}
              x2={prismX + 70 + (LX - prismX - 70) * loupe}
              y2={discY + size / 2 - 70 + (LY - discY - size / 2 + 70) * loupe}
              stroke={ORANGE_GLOW}
              strokeWidth={2}
              strokeOpacity={0.8}
            />
            <circle cx={prismX + 70} cy={discY + size / 2 - 70} r={10 * loupe} fill="none" stroke={ORANGE_GLOW} strokeWidth={2} />
          </svg>
          <div
            style={{
              position: 'absolute',
              left: LX - 150,
              top: LY - 150,
              width: 300,
              height: 300,
              borderRadius: '50%',
              overflow: 'hidden',
              border: `3px solid ${ORANGE_GLOW}`,
              boxShadow: `0 0 50px rgba(246,133,31,0.35)`,
              transform: `scale(${loupe})`,
            }}
          >
            <Img
              src={staticFile('harmony/prismatic-macro.jpg')}
              style={{position: 'absolute', width: 520, height: 520, left: -110 + pan, top: -110 + pan * 0.4}}
            />
          </div>
          <div
            style={{
              position: 'absolute',
              left: LX - 150,
              top: LY + 168,
              width: 300,
              textAlign: 'center',
              fontFamily: FONT,
              fontSize: 20,
              fontWeight: 500,
              letterSpacing: '0.24em',
              color: ORANGE_GLOW,
              opacity: loupe,
            }}
          >
            MICROPRISM · MACRO
          </div>
        </>
      ) : null}
    </AbsoluteFill>
  );
};

// 4 · OUTPUT — efficacy counter and the two sizes, drawn to true relative scale
const Output: React.FC = () => {
  const f = useCurrentFrame();
  const eff = interpolate(f, [10, 70], [0, HARMONY.efficacy], {...clamp, easing: Easing.out(Easing.cubic)});
  const scale = 1.2; // px per mm
  const baseY = 800;
  const centres = [1060, 1550];
  return (
    <AbsoluteFill>
      <div style={{position: 'absolute', left: 140, top: 250}}>
        <Rise at={0}>
          <Eyebrow>EFFICACY</Eyebrow>
        </Rise>
        <Rise at={6} style={{marginTop: 16}}>
          <div style={{fontFamily: FONT, color: WHITE, display: 'flex', alignItems: 'baseline', gap: 18}}>
            <span style={{fontSize: 64, fontWeight: 300}}>up to</span>
          </div>
          <div style={{fontFamily: FONT, color: WHITE, display: 'flex', alignItems: 'baseline', gap: 18, marginTop: -10}}>
            <span style={{fontSize: 230, fontWeight: 600, letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums'}}>
              {Math.round(eff)}
            </span>
            <span style={{fontSize: 60, fontWeight: 400, color: ORANGE_GLOW}}>lm/W</span>
          </div>
        </Rise>
        <Rise at={40} style={{marginTop: 24}}>
          <Headline size={38} style={{opacity: 0.85}}>
            Two sizes. Two outputs.
          </Headline>
        </Rise>
      </div>

      {HARMONY.models.map((m, i) => {
        const d = m.diameter * scale;
        const at = 30 + i * 26;
        const draw = ramp(f, at, at + 40, inOut);
        const lum = interpolate(f, [at + 14, at + 70], [0, m.lumen], {...clamp, easing: Easing.out(Easing.cubic)});
        const cx = centres[i];
        const cy = baseY - d / 2;
        const glow = ramp(f, at + 20, at + 60);
        return (
          <React.Fragment key={m.power}>
            <div
              style={{
                position: 'absolute',
                left: cx - d / 2,
                top: cy - d / 2,
                width: d,
                height: d,
                borderRadius: '50%',
                background: `radial-gradient(circle, rgba(255,214,160,${0.16 * glow}) 0%, rgba(255,190,120,${0.06 * glow}) 60%, transparent 72%)`,
              }}
            />
            <svg width={1920} height={1080} style={{position: 'absolute', inset: 0}}>
              <circle
                cx={cx}
                cy={cy}
                r={d / 2}
                fill="none"
                stroke={ORANGE_GLOW}
                strokeWidth={3}
                pathLength={1000}
                strokeDasharray={1000}
                strokeDashoffset={1000 * (1 - draw)}
                transform={`rotate(-90 ${cx} ${cy})`}
                style={{filter: 'drop-shadow(0 0 8px rgba(246,133,31,0.8))'}}
              />
              {/* diameter dimension line */}
              <line x1={cx - d / 2} y1={baseY + 40} x2={cx - d / 2 + d * draw} y2={baseY + 40} stroke={WHITE} strokeOpacity={0.45} strokeWidth={1.5} />
              <line x1={cx - d / 2} y1={baseY + 30} x2={cx - d / 2} y2={baseY + 50} stroke={WHITE} strokeOpacity={0.45 * draw} strokeWidth={1.5} />
              <line x1={cx + d / 2} y1={baseY + 30} x2={cx + d / 2} y2={baseY + 50} stroke={WHITE} strokeOpacity={0.45 * draw} strokeWidth={1.5} />
            </svg>
            <div
              style={{
                position: 'absolute',
                left: cx - 200,
                top: cy - 70,
                width: 400,
                textAlign: 'center',
                fontFamily: FONT,
                color: WHITE,
                opacity: glow,
              }}
            >
              <div style={{fontSize: 70, fontWeight: 600, lineHeight: 1}}>{m.power} W</div>
              <div style={{fontSize: 38, fontWeight: 300, marginTop: 12, fontVariantNumeric: 'tabular-nums'}}>
                {fmt(lum)} lm
              </div>
            </div>
            <div
              style={{
                position: 'absolute',
                left: cx - 150,
                top: baseY + 62,
                width: 300,
                textAlign: 'center',
                fontFamily: FONT,
                fontSize: 26,
                fontWeight: 500,
                letterSpacing: '0.12em',
                color: WHITE,
                opacity: 0.75 * draw,
              }}
            >
              Ø{m.diameter} mm
            </div>
          </React.Fragment>
        );
      })}
    </AbsoluteFill>
  );
};

// 5 · PHOTOMETRY — 110° distribution, drawn from the datasheet beam angle
const beamExponent = Math.log(0.5) / Math.log(Math.cos(((HARMONY.beamAngle / 2) * Math.PI) / 180));
const intensity = (t: number) => (Math.abs(t) > Math.PI / 2 ? 0 : Math.pow(Math.cos(t), beamExponent));

const Polar: React.FC<{size: number}> = ({size}) => {
  const f = useCurrentFrame();
  const VB = 200;
  const VH = 140;
  const cx = VB / 2;
  const cy = 22;
  const R = 90;
  const P = (r: number, t: number) => ({x: cx + r * Math.sin(t), y: cy + r * Math.cos(t)});
  const pts: string[] = [];
  for (let d = -90; d <= 90; d += 1.5) {
    const t = (d * Math.PI) / 180;
    const p = P(R * intensity(t), t);
    pts.push(`${p.x.toFixed(2)} ${p.y.toFixed(2)}`);
  }
  const curve = `M ${pts.join(' L ')}`;
  const grid = ramp(f, 0, 16);
  const draw = ramp(f, 10, 64, inOut);
  const fill = ramp(f, 54, 80);
  const arc = ramp(f, 74, 104, inOut);
  const half = ((HARMONY.beamAngle / 2) * Math.PI) / 180;
  const rArc = R * 0.5;
  const a0 = P(rArc, -half * arc);
  const a1 = P(rArc, half * arc);
  const edgeL = P(R * 1.02, -half);
  const edgeR = P(R * 1.02, half);
  return (
    <svg viewBox={`0 0 ${VB} ${VH}`} width={size} height={(size * VH) / VB} style={{overflow: 'visible'}}>
      <defs>
        <radialGradient id="hmFill" cx="50%" cy="16%" r="75%">
          <stop offset="0%" stopColor="#FFE3BD" stopOpacity={0.6} />
          <stop offset="100%" stopColor={ORANGE} stopOpacity={0.06} />
        </radialGradient>
      </defs>
      {[0.25, 0.5, 0.75, 1].map((k) => (
        <path
          key={k}
          d={`M ${P(R * k, -Math.PI / 2).x} ${P(R * k, -Math.PI / 2).y} A ${R * k} ${R * k} 0 0 0 ${P(R * k, Math.PI / 2).x} ${P(R * k, Math.PI / 2).y}`}
          fill="none"
          stroke={WHITE}
          strokeOpacity={0.14 * grid}
          strokeWidth={0.5}
          strokeDasharray={k === 1 ? undefined : '2 2'}
        />
      ))}
      {[-90, -60, -30, 0, 30, 60, 90].map((d) => {
        const t = (d * Math.PI) / 180;
        const e = P(R, t);
        const l = P(R + 9, t);
        return (
          <g key={d}>
            <line x1={cx} y1={cy} x2={e.x} y2={e.y} stroke={WHITE} strokeOpacity={0.1 * grid} strokeWidth={0.5} />
            <text x={l.x} y={l.y} fill={WHITE} fillOpacity={0.45 * grid} fontSize={5.5} fontFamily={FONT} fontWeight={600} textAnchor="middle" dominantBaseline="middle">
              {Math.abs(d)}°
            </text>
          </g>
        );
      })}
      <line x1={0} y1={cy} x2={VB} y2={cy} stroke={WHITE} strokeOpacity={0.25 * grid} strokeWidth={0.8} />
      <path d={`${curve} Z`} fill="url(#hmFill)" opacity={fill} />
      <path
        d={curve}
        fill="none"
        stroke={ORANGE_GLOW}
        strokeWidth={2}
        strokeLinecap="round"
        pathLength={1000}
        strokeDasharray={1000}
        strokeDashoffset={1000 * (1 - draw)}
        style={{filter: 'drop-shadow(0 0 3px rgba(246,133,31,0.9))'}}
      />
      {/* beam-angle markers at the half-intensity points */}
      <g opacity={arc}>
        <line x1={cx} y1={cy} x2={edgeL.x} y2={edgeL.y} stroke={WHITE} strokeOpacity={0.55} strokeWidth={0.7} strokeDasharray="3 2" />
        <line x1={cx} y1={cy} x2={edgeR.x} y2={edgeR.y} stroke={WHITE} strokeOpacity={0.55} strokeWidth={0.7} strokeDasharray="3 2" />
      </g>
      <path d={`M ${a0.x} ${a0.y} A ${rArc} ${rArc} 0 0 0 ${a1.x} ${a1.y}`} fill="none" stroke={WHITE} strokeWidth={1.2} strokeOpacity={0.9} />
      <text x={cx} y={cy + rArc + 12} fill={WHITE} fontSize={13} fontFamily={FONT} fontWeight={600} textAnchor="middle" opacity={arc}>
        {HARMONY.beamAngle}°
      </text>
      <circle cx={cx} cy={cy} r={2.6} fill={WHITE} opacity={grid} style={{filter: 'drop-shadow(0 0 5px #F6851F)'}} />
    </svg>
  );
};

const Photometry: React.FC = () => (
  <AbsoluteFill>
    <div style={{position: 'absolute', left: 110, top: 250}}>
      <Polar size={860} />
    </div>
    <div style={{position: 'absolute', left: 1040, top: 250, width: 760}}>
      <Rise at={4}>
        <Eyebrow>PHOTOMETRY</Eyebrow>
      </Rise>
      <Rise at={10} style={{marginTop: 18}}>
        <Headline size={74}>
          A {HARMONY.beamAngle}° beam.
          <br />
          <span style={{color: ORANGE_GLOW, fontWeight: 400}}>True colour.</span>
        </Headline>
      </Rise>
      <div style={{display: 'flex', flexDirection: 'column', gap: 20, marginTop: 50, alignItems: 'flex-start'}}>
        <Rise at={44}>
          <Chip>{HARMONY.led} LEDs</Chip>
        </Rise>
        <Rise at={56}>
          <Chip accent>
            CRI &gt; {HARMONY.cri.standard} · &gt; {HARMONY.cri.optional} optional
          </Chip>
        </Rise>
        <Rise at={68}>
          <Chip>SDCM &lt; {HARMONY.sdcm}</Chip>
        </Rise>
      </div>
    </div>
  </AbsoluteFill>
);

// 6 · COLOUR TEMPERATURE — the same fitting, swept warm to cool, flicker-free
const Cct: React.FC = () => {
  const f = useCurrentFrame();
  const stops = HARMONY.cct;
  // step through each CCT with a short glide between them
  const seg = 20;
  const start = 22;
  const idx = interpolate(f, stops.map((_, i) => start + i * seg), stops.map((_, i) => i), {
    ...clamp,
    easing: Easing.inOut(Easing.sin),
  });
  const lo = Math.floor(idx);
  const hi = Math.min(stops.length - 1, lo + 1);
  const kelvin = stops[lo] + (stops[hi] - stops[lo]) * (idx - lo);
  const barW = 1200;
  const barX = (1920 - barW) / 2;
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{alignItems: 'center', top: 88}}>
        <Rise at={2}>
          <Headline size={72}>
            Flicker-free. <span style={{color: ORANGE_GLOW, fontWeight: 400}}>Warm to cool.</span>
          </Headline>
        </Rise>
      </AbsoluteFill>
      <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center', top: -10}}>
        <LitHarmony width={1000} on={1} kelvin={kelvin} />
      </AbsoluteFill>
      <div style={{position: 'absolute', left: barX, top: 850, width: barW}}>
        <div
          style={{
            height: 10,
            borderRadius: 10,
            background: `linear-gradient(90deg, ${stops.map((k, i) => `${rgba(cctRgb(k), 1)} ${(i / (stops.length - 1)) * 100}%`).join(', ')})`,
          }}
        />
        <div
          style={{
            position: 'absolute',
            left: (idx / (stops.length - 1)) * barW - 14,
            top: -9,
            width: 28,
            height: 28,
            borderRadius: 28,
            background: rgba(cctRgb(kelvin), 1),
            border: `3px solid ${WHITE}`,
            boxShadow: `0 0 22px ${rgba(cctRgb(kelvin), 0.9)}`,
          }}
        />
        <div style={{display: 'flex', justifyContent: 'space-between', marginTop: 26}}>
          {stops.map((k, i) => (
            <div
              key={k}
              style={{
                fontFamily: FONT,
                fontSize: 26,
                fontWeight: Math.round(idx) === i ? 600 : 300,
                color: WHITE,
                opacity: Math.round(idx) === i ? 1 : 0.55,
                width: 110,
                textAlign: 'center',
                marginLeft: i === 0 ? -55 : 0,
                marginRight: i === stops.length - 1 ? -55 : 0,
              }}
            >
              {k} K
            </div>
          ))}
        </div>
      </div>
    </AbsoluteFill>
  );
};

// 7 · DURABILITY — six datasheet ratings
const Durability: React.FC = () => {
  const f = useCurrentFrame();
  const tiles: Array<[string, string]> = [
    [HARMONY.ip, 'Ingress protection'],
    [HARMONY.electricalClass, 'Electrical class'],
    [HARMONY.surge, 'Surge protection · L-N / L/N-PE'],
    [`> ${HARMONY.lifetime}`, `Lifetime · ${HARMONY.lifetimeRating}`],
    [`> ${HARMONY.switching}`, 'Switching cycles'],
    [HARMONY.workingTemp, 'Working temperature (ta)'],
  ];
  const W = 500;
  const H = 210;
  const gap = 30;
  const x0 = (1920 - (W * 3 + gap * 2)) / 2;
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{alignItems: 'center', top: 170}}>
        <Rise at={2}>
          <Headline size={72}>
            Built to <span style={{color: ORANGE_GLOW, fontWeight: 400}}>last.</span>
          </Headline>
        </Rise>
      </AbsoluteFill>
      {tiles.map(([v, l], i) => {
        const at = 16 + i * 9;
        const p = ramp(f, at, at + 22);
        const col = i % 3;
        const row = Math.floor(i / 3);
        return (
          <div
            key={l}
            style={{
              position: 'absolute',
              left: x0 + col * (W + gap),
              top: 370 + row * (H + gap),
              width: W,
              height: H,
              borderRadius: 22,
              border: '1.5px solid rgba(255,255,255,0.14)',
              background: 'linear-gradient(160deg, rgba(255,255,255,0.075), rgba(255,255,255,0.02))',
              padding: '38px 40px',
              boxSizing: 'border-box',
              opacity: p,
              transform: `translateY(${(1 - p) * 34}px)`,
              fontFamily: FONT,
              color: WHITE,
            }}
          >
            <div style={{width: 42, height: 3, background: ORANGE, borderRadius: 2}} />
            <div style={{fontSize: 58, fontWeight: 600, marginTop: 22, lineHeight: 1}}>{v}</div>
            <div style={{fontSize: 25, fontWeight: 300, marginTop: 18, opacity: 0.8}}>{l}</div>
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

// 8 · INSTALL — surface or suspended, two finishes, optional extras
const MountDiagram: React.FC<{suspended: boolean; at: number}> = ({suspended, at}) => {
  const f = useCurrentFrame();
  const draw = ramp(f, at, at + 34, inOut);
  const glow = ramp(f, at + 26, at + 50);
  const c = cctRgb(3000);
  const w = 420;
  const drop = suspended ? 150 : 0;
  const bodyY = 60 + drop;
  const dash = (len: number) => ({strokeDasharray: len, strokeDashoffset: len * (1 - draw)});
  return (
    <svg width={w} height={360} viewBox={`0 0 ${w} 360`} style={{overflow: 'visible'}}>
      <defs>
        <radialGradient id={`beam-${suspended}`} cx="50%" cy="0%" r="100%">
          <stop offset="0%" stopColor={rgba(c, 0.55)} />
          <stop offset="100%" stopColor={rgba(c, 0)} />
        </radialGradient>
      </defs>
      {/* ceiling */}
      <line x1={10} y1={40} x2={w - 10} y2={40} stroke={WHITE} strokeOpacity={0.55} strokeWidth={3} style={dash(w)} />
      {Array.from({length: 14}).map((_, i) => (
        <line key={i} x1={20 + i * 28} y1={40} x2={8 + i * 28} y2={24} stroke={WHITE} strokeOpacity={0.22 * draw} strokeWidth={1.5} />
      ))}
      {suspended ? (
        <>
          <line x1={w / 2 - 90} y1={40} x2={w / 2 - 90} y2={bodyY} stroke={WHITE} strokeOpacity={0.7} strokeWidth={1.5} style={dash(drop)} />
          <line x1={w / 2 + 90} y1={40} x2={w / 2 + 90} y2={bodyY} stroke={WHITE} strokeOpacity={0.7} strokeWidth={1.5} style={dash(drop)} />
        </>
      ) : null}
      {/* light below */}
      <path d={`M ${w / 2 - 150} ${bodyY + 26} L ${w / 2 - 205} ${bodyY + 150} L ${w / 2 + 205} ${bodyY + 150} L ${w / 2 + 150} ${bodyY + 26} Z`} fill={`url(#beam-${suspended})`} opacity={glow} />
      {/* luminaire profile: stepped base + diffuser plate (datasheet side view) */}
      <rect x={w / 2 - 130} y={bodyY} width={260} height={14} rx={2} fill="none" stroke={WHITE} strokeWidth={2.5} style={dash(560)} />
      <rect x={w / 2 - 150} y={bodyY + 14} width={300} height={12} rx={2} fill={WHITE} fillOpacity={0.15 + 0.75 * glow} stroke={WHITE} strokeWidth={2.5} style={dash(640)} />
    </svg>
  );
};

const Install: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{alignItems: 'center', top: 100}}>
        <Rise at={2}>
          <Headline size={72}>
            Mounted <span style={{color: ORANGE_GLOW, fontWeight: 400}}>your way.</span>
          </Headline>
        </Rise>
      </AbsoluteFill>
      {HARMONY.mounting.map((m, i) => (
        <div key={m} style={{position: 'absolute', left: 180 + i * 520, top: 270}}>
          <MountDiagram suspended={i === 1} at={12 + i * 14} />
          <Rise at={30 + i * 14} style={{textAlign: 'center', marginTop: 6}}>
            <div style={{fontFamily: FONT, fontSize: 32, fontWeight: 500, color: WHITE, letterSpacing: '0.04em'}}>{m}</div>
          </Rise>
        </div>
      ))}
      <div style={{position: 'absolute', left: 1300, top: 300}}>
        <Rise at={40}>
          <Eyebrow>FINISH</Eyebrow>
        </Rise>
        <div style={{display: 'flex', gap: 40, marginTop: 26}}>
          {HARMONY.colours.map((c, i) => {
            const p = ramp(f, 46 + i * 8, 66 + i * 8);
            return (
              <div key={c.label} style={{textAlign: 'center', opacity: p, transform: `scale(${0.8 + 0.2 * p})`}}>
                <div
                  style={{
                    width: 120,
                    height: 120,
                    borderRadius: 120,
                    background: `radial-gradient(circle at 35% 30%, ${c.hex === '#1C1C1F' ? '#3a3a40' : '#ffffff'} 0%, ${c.hex} 60%)`,
                    border: '2px solid rgba(255,255,255,0.35)',
                  }}
                />
                <div style={{fontFamily: FONT, fontSize: 26, fontWeight: 400, color: WHITE, marginTop: 16}}>{c.label}</div>
              </div>
            );
          })}
        </div>
        <Rise at={70} style={{marginTop: 60}}>
          <Eyebrow>ON REQUEST</Eyebrow>
        </Rise>
        <div style={{display: 'flex', flexDirection: 'column', gap: 16, marginTop: 22, alignItems: 'flex-start'}}>
          {HARMONY.optional.map((o, i) => (
            <Rise key={o} at={76 + i * 8}>
              <Chip>{o}</Chip>
            </Rise>
          ))}
        </div>
      </div>
    </AbsoluteFill>
  );
};

// 9 · APPLICATIONS — word cycle; lifestyle clips replace the backdrop when supplied
const Applications: React.FC = () => {
  const f = useCurrentFrame();
  const apps = HARMONY.applications;
  const clips = HARMONY_MEDIA.lifestyle;
  const per = hasClips ? APP_CLIP : APP_WORD;
  const start = APP_START;
  const active = Math.min(apps.length - 1, Math.max(0, Math.floor((f - start) / per)));
  const local = f - start - active * per;
  const wordIn = ramp(local, 0, 10);
  return (
    <AbsoluteFill>
      {hasClips ? (
        // Clip i plays under word i (clips are listed in application order).
        clips.map((src, i) => {
          const from = i === 0 ? 0 : start + i * per;
          const to = i === clips.length - 1 ? T.applications[1] : start + (i + 1) * per;
          return (
            <Sequence key={src} from={from} durationInFrames={to - from}>
              <AbsoluteFill>
                {/* skip the first second, where Kling clips are still nearly static */}
                <OffthreadVideo src={staticFile(src)} startFrom={30} muted style={{width: '100%', height: '100%', objectFit: 'cover'}} />
                <AbsoluteFill style={{background: 'linear-gradient(90deg, rgba(15,18,53,0.85) 0%, rgba(15,18,53,0.35) 55%, rgba(15,18,53,0.1) 100%)'}} />
              </AbsoluteFill>
            </Sequence>
          );
        })
      ) : (
        <div style={{position: 'absolute', left: 1090, top: 340, opacity: 0.9}}>
          <LitHarmony width={1000} on={1} />
        </div>
      )}
      <div style={{position: 'absolute', left: 140, top: 330}}>
        <Rise at={2}>
          <Headline size={60} style={{opacity: 0.85}}>
            Made for
          </Headline>
        </Rise>
        <div
          style={{
            fontFamily: FONT,
            fontSize: 150,
            fontWeight: 600,
            color: WHITE,
            marginTop: 6,
            opacity: f < start ? 0 : wordIn,
            transform: `translateY(${(1 - wordIn) * 24}px)`,
            textShadow: '0 0 40px rgba(255,200,140,0.25)',
          }}
        >
          {apps[active]}
        </div>
        <div style={{display: 'flex', gap: 20, marginTop: 40}}>
          {apps.map((a, i) => (
            <div
              key={a}
              style={{
                fontFamily: FONT,
                fontSize: 22,
                fontWeight: 500,
                letterSpacing: '0.12em',
                color: i === active && f >= start ? ORANGE_GLOW : WHITE,
                opacity: f >= start + i * per ? 0.95 : 0.3,
              }}
            >
              {a.toUpperCase()}
            </div>
          ))}
        </div>
      </div>
    </AbsoluteFill>
  );
};

// 10 · WARRANTY + certifications
const Warranty: React.FC = () => {
  const f = useCurrentFrame();
  const draw = ramp(f, 4, 40, inOut);
  return (
    <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center'}}>
      <svg width={220} height={250} viewBox="0 0 100 114" style={{overflow: 'visible'}}>
        <path
          d="M50 4 L92 18 V54 C92 80 74 98 50 110 C26 98 8 80 8 54 V18 Z"
          fill={`rgba(246,133,31,${0.1 * draw})`}
          stroke={ORANGE_GLOW}
          strokeWidth={3}
          pathLength={1000}
          strokeDasharray={1000}
          strokeDashoffset={1000 * (1 - draw)}
          style={{filter: 'drop-shadow(0 0 6px rgba(246,133,31,0.7))'}}
        />
        <text x={50} y={66} textAnchor="middle" fontFamily={FONT} fontWeight={600} fontSize={34} fill={WHITE} opacity={ramp(f, 24, 40)}>
          {HARMONY.warrantyYears}Y
        </text>
      </svg>
      <Rise at={22} style={{marginTop: 30}}>
        <Headline size={70}>
          {HARMONY.warrantyYears}-year <span style={{color: ORANGE_GLOW, fontWeight: 400}}>warranty.</span>
        </Headline>
      </Rise>
      <Rise at={40} style={{marginTop: 44}}>
        <div style={{display: 'flex', gap: 44, fontFamily: FONT, fontSize: 30, fontWeight: 600, letterSpacing: '0.16em', color: WHITE, opacity: 0.72}}>
          {HARMONY.certificates.map((c) => (
            <span key={c}>{c}</span>
          ))}
        </div>
      </Rise>
    </AbsoluteFill>
  );
};

// 11 · END CARD — product, name, tagline, master logo
const EndCard: React.FC = () => {
  const f = useCurrentFrame();
  const on = ramp(f, 0, 30);
  return (
    <AbsoluteFill>
      <ParticleField count={20} opacity={0.3} seed="end" />
      <div style={{position: 'absolute', left: 90, top: 330, transform: `scale(${interpolate(f, [0, 140], [1, 1.04], clamp)})`}}>
        <LitHarmony width={1000} on={on} />
      </div>
      <div style={{position: 'absolute', left: 1180, top: 300, width: 640}}>
        <Rise at={8}>
          <div style={{fontFamily: FONT, fontWeight: 300, fontSize: 104, letterSpacing: '0.1em', color: WHITE, lineHeight: 1}}>
            {HARMONY.name}
          </div>
        </Rise>
        <div style={{marginTop: 26}}>
          <Rule at={18} width={120} />
        </div>
        <Rise at={24} style={{marginTop: 26}}>
          <Headline size={46}>Light that Lasts.</Headline>
        </Rise>
        <Rise at={40} style={{marginTop: 40}}>
          <div style={{display: 'flex', gap: 14}}>
            <Chip>Opal</Chip>
            <Chip>Microprismatic</Chip>
          </div>
        </Rise>
      </div>
    </AbsoluteFill>
  );
};

// 12 · OUTRO — the light blooms to white; the primary logo (datasheet artwork,
// used as supplied) is revealed by a clip wipe, never faded or recoloured.
const Outro: React.FC = () => {
  const f = useCurrentFrame();
  const bloom = ramp(f, 0, 20, Easing.in(Easing.quad));
  const wipe = ramp(f, 22, 46, inOut);
  const logoW = 470;
  return (
    <AbsoluteFill>
      <div
        style={{
          position: 'absolute',
          left: 590 - 2400 * bloom,
          top: 640 - 2400 * bloom,
          width: 4800 * bloom,
          height: 4800 * bloom,
          borderRadius: '50%',
          background: '#FFF8EF',
          boxShadow: `0 0 ${200 * bloom}px ${120 * bloom}px #FFF8EF`,
        }}
      />
      <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center'}}>
        <div style={{clipPath: `inset(-10px ${100 - wipe * 100}% -10px -10px)`}}>
          <Img src={staticFile('harmony/nlc-logo-primary.png')} style={{width: logoW, height: (logoW * 138) / 430, display: 'block'}} />
        </div>
        <div style={{marginTop: 44, clipPath: `inset(-10px ${100 - ramp(f, 36, 58, inOut) * 100}% -10px -10px)`}}>
          <div style={{fontFamily: FONT, fontSize: 30, fontWeight: 500, letterSpacing: '0.2em', color: '#24285E'}}>{SITE}</div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ════════════════════════════════════════════════════════════════════════════
export const HarmonyCommercial: React.FC = () => (
  <AbsoluteFill style={{backgroundColor: NAVY_DEEP}}>
    <Backdrop />
    <Shot name="hook">
      <Hook />
    </Shot>
    <Shot name="title">
      <Title />
    </Shot>
    <Shot name="optics">
      <Optics />
    </Shot>
    <Shot name="output">
      <Output />
    </Shot>
    <Shot name="photometry">
      <Photometry />
    </Shot>
    <Shot name="cct">
      <Cct />
    </Shot>
    <Shot name="durability">
      <Durability />
    </Shot>
    <Shot name="install">
      <Install />
    </Shot>
    <Shot name="applications">
      <Applications />
    </Shot>
    <Shot name="warranty">
      <Warranty />
    </Shot>
    <Shot name="endcard">
      <EndCard />
    </Shot>
    <CinematicOverlay vignette={0.5} />
    <Sequence from={T.outro[0]} durationInFrames={T.outro[1]} name="outro">
      <Outro />
    </Sequence>
    {HARMONY_MEDIA.voiceover ? <Audio src={staticFile(HARMONY_MEDIA.voiceover)} /> : null}
    {HARMONY_MEDIA.music ? <Audio src={staticFile(HARMONY_MEDIA.music)} volume={HARMONY_MEDIA.voiceover ? 0.22 : 0.6} /> : null}
  </AbsoluteFill>
);
