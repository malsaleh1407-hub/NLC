import React from 'react';
import {Easing, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {BRAND_EASE, NAVY, NAVY_DARK, NAVY_DEEP, NIGHT, ORANGE_GLOW, WHITE} from '../brand';

const ease = Easing.bezier(...BRAND_EASE);
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

// Warm white of a lit aperture (~3000K on screen), used only for emitters.
const EMITTER = '#FFF3E2';

// ————————————————————————————————————————————————————————————————
// DownlightIcon — flat line-art in the family of LuminaireIcons.
// It stands in for the product ONLY when no product photo was supplied, and
// is deliberately iconographic (white strokes, no shading) so it can never be
// mistaken for a render of the real fixture (guidelines §07: no "renders that
// look like renders", nothing "that pretends to be NLC but isn't").
// ————————————————————————————————————————————————————————————————
export const DownlightIcon: React.FC<{size: number; lit: number}> = ({size, lit}) => (
  <svg viewBox="0 0 200 200" width={size} height={size} style={{overflow: 'visible'}}>
    <defs>
      <linearGradient id="dlCone" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor={ORANGE_GLOW} stopOpacity={0.55 * lit} />
        <stop offset="100%" stopColor={ORANGE_GLOW} stopOpacity={0} />
      </linearGradient>
      <radialGradient id="dlPool">
        <stop offset="0%" stopColor={ORANGE_GLOW} stopOpacity={0.45 * lit} />
        <stop offset="100%" stopColor={ORANGE_GLOW} stopOpacity={0} />
      </radialGradient>
    </defs>
    {/* Ceiling plane */}
    <line x1={8} y1={46} x2={192} y2={46} stroke={WHITE} strokeOpacity={0.28} strokeWidth={2} />
    {/* Beam + pool */}
    {lit > 0.01 ? (
      <>
        <path d="M 74 54 L 126 54 L 176 186 L 24 186 Z" fill="url(#dlCone)" />
        <ellipse cx={100} cy={186} rx={84} ry={11} fill="url(#dlPool)" />
      </>
    ) : null}
    {/* Trim ring, reflector, emitter — seen from slightly below */}
    <ellipse cx={100} cy={50} rx={44} ry={12} fill={NAVY} stroke={WHITE} strokeWidth={4} />
    <ellipse cx={100} cy={51} rx={30} ry={7.5} fill={NAVY_DEEP} stroke={WHITE} strokeOpacity={0.55} strokeWidth={2} />
    <ellipse
      cx={100}
      cy={52}
      rx={15}
      ry={3.6}
      fill={lit > 0.01 ? EMITTER : NAVY_DARK}
      opacity={0.35 + 0.65 * lit}
      style={lit > 0.01 ? {filter: `drop-shadow(0 0 ${6 * lit}px ${ORANGE_GLOW})`} : undefined}
    />
  </svg>
);

// ————————————————————————————————————————————————————————————————
// WallWash — an architectural elevation: a row of downlights near a wall
// switches on in a wave, each drawing the scallop a downlight throws on a
// wall (a bright arched cut-off that fades toward the floor) and a pool on
// the floor. It is the pattern a specifier recognises instantly, drawn in a
// box so the copy can sit beside it rather than on top of the light.
// ————————————————————————————————————————————————————————————————
export const WallWash: React.FC<{
  width: number;
  height: number;
  count?: number;
  startAt?: number;
  stagger?: number;
  rtl?: boolean;
}> = ({width: W, height: H, count = 4, startAt = 0, stagger = 6, rtl = false}) => {
  const frame = useCurrentFrame();

  const ceilY = H * 0.1;
  const floorY = H * 0.8;
  const pitch = W / count;

  const litOf = (i: number) => {
    const k = rtl ? count - 1 - i : i; // the wave follows reading direction
    return interpolate(frame, [startAt + k * stagger, startAt + k * stagger + 14], [0, 1], {...clamp, easing: ease});
  };
  const total = Array.from({length: count}).reduce<number>((s, _, i) => s + litOf(i), 0) / count;
  const roomIn = interpolate(frame, [0, 16], [0, 1], {...clamp, easing: ease});

  // Soft edges so the elevation floats on the navy backdrop.
  const mask =
    'linear-gradient(90deg, transparent 0%, #000 9%, #000 91%, transparent 100%), linear-gradient(180deg, #000 0%, #000 84%, transparent 100%)';

  return (
    <div
      style={{
        width: W,
        height: H,
        opacity: roomIn,
        WebkitMaskImage: mask,
        WebkitMaskComposite: 'source-in',
        maskImage: mask,
        maskComposite: 'intersect',
      }}
    >
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
        <defs>
          <linearGradient id="wwScallop" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={ORANGE_GLOW} stopOpacity={0.75} />
            <stop offset="22%" stopColor={ORANGE_GLOW} stopOpacity={0.42} />
            <stop offset="100%" stopColor={ORANGE_GLOW} stopOpacity={0.04} />
          </linearGradient>
          <radialGradient id="wwPool">
            <stop offset="0%" stopColor={ORANGE_GLOW} stopOpacity={0.5} />
            <stop offset="60%" stopColor={ORANGE_GLOW} stopOpacity={0.12} />
            <stop offset="100%" stopColor={ORANGE_GLOW} stopOpacity={0} />
          </radialGradient>
          <filter id="wwSoft" x="-30%" y="-10%" width="160%" height="130%">
            <feGaussianBlur stdDeviation={Math.max(4, pitch * 0.025)} />
          </filter>
          <filter id="wwGlow" x="-100%" y="-300%" width="300%" height="700%">
            <feGaussianBlur stdDeviation={10} />
          </filter>
        </defs>

        {/* Ceiling, wall, floor */}
        <rect x={0} y={0} width={W} height={ceilY} fill={NIGHT} />
        <rect x={0} y={ceilY} width={W} height={floorY - ceilY} fill={NAVY_DARK} />
        <rect x={0} y={ceilY} width={W} height={floorY - ceilY} fill={NAVY} opacity={0.35 * total} />
        <rect x={0} y={floorY} width={W} height={H - floorY} fill={NAVY_DEEP} />
        <line x1={0} y1={ceilY} x2={W} y2={ceilY} stroke={WHITE} strokeOpacity={0.12} strokeWidth={2} />
        <line x1={0} y1={floorY} x2={W} y2={floorY} stroke={WHITE} strokeOpacity={0.1} strokeWidth={2} />

        {Array.from({length: count}).map((_, i) => {
          const lit = litOf(i);
          const x = pitch * (i + 0.5);
          const apex = ceilY + (floorY - ceilY) * 0.09;
          const shoulder = ceilY + (floorY - ceilY) * 0.2;
          const wTop = pitch * 0.17;
          const wBot = pitch * 0.47;
          const ar = Math.min(40, pitch * 0.13);
          return (
            <g key={i}>
              {lit > 0.01 ? (
                <g style={{mixBlendMode: 'screen'}} opacity={lit}>
                  {/* Scallop on the wall */}
                  <path
                    d={`M ${x - wBot} ${floorY} L ${x - wTop} ${shoulder} Q ${x} ${apex - (shoulder - apex)} ${x + wTop} ${shoulder} L ${x + wBot} ${floorY} Z`}
                    fill="url(#wwScallop)"
                    filter="url(#wwSoft)"
                  />
                  {/* Hot spot just under the cut-off */}
                  <ellipse cx={x} cy={shoulder} rx={wTop * 0.9} ry={(shoulder - apex) * 0.9} fill={ORANGE_GLOW} opacity={0.35} filter="url(#wwGlow)" />
                  {/* Pool on the floor */}
                  <ellipse cx={x} cy={floorY + (H - floorY) * 0.4} rx={pitch * 0.5} ry={(H - floorY) * 0.34} fill="url(#wwPool)" />
                  {/* Glow at the aperture */}
                  <ellipse cx={x} cy={ceilY + 2} rx={ar * 1.8} ry={ar * 0.5} fill={ORANGE_GLOW} opacity={0.6} filter="url(#wwGlow)" />
                </g>
              ) : null}
              <ellipse cx={x} cy={ceilY + 2} rx={ar} ry={ar * 0.26} fill={NAVY_DARK} stroke={WHITE} strokeOpacity={0.35} strokeWidth={1.5} />
              <ellipse cx={x} cy={ceilY + 2} rx={ar * 0.7} ry={ar * 0.18} fill={EMITTER} opacity={lit} />
            </g>
          );
        })}
      </svg>
    </div>
  );
};

// ————————————————————————————————————————————————————————————————
// SingleBeam — the hook: one aperture in a dark ceiling switches on and its
// cone reaches the floor. `x` is the aperture position as a fraction of width.
// ————————————————————————————————————————————————————————————————
export const SingleBeam: React.FC<{x: number; igniteAt: number}> = ({x, igniteAt}) => {
  const frame = useCurrentFrame();
  const {width: W, height: H} = useVideoConfig();
  const portrait = H > W;

  const ceilY = H * (portrait ? 0.11 : 0.13);
  const floorY = H * (portrait ? 0.93 : 0.92);
  const cx = W * x;
  const ar = portrait ? 70 : 64;
  const pr = portrait ? 430 : 420;

  const line = interpolate(frame, [0, 22], [0, 1], {...clamp, easing: ease});
  const on = interpolate(frame, [igniteAt, igniteAt + 10], [0, 1], {...clamp, easing: ease});
  // The beam travels down, then the pool blooms where it lands.
  const reach = interpolate(frame, [igniteAt + 4, igniteAt + 22], [0, 1], {...clamp, easing: ease});
  const pool = interpolate(frame, [igniteAt + 16, igniteAt + 34], [0, 1], {...clamp, easing: ease});
  const beamY = ceilY + (floorY - ceilY) * reach;
  const beamR = ar * 0.8 + (pr - ar * 0.8) * reach;

  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{position: 'absolute', inset: 0}}>
      <defs>
        <linearGradient id="sbCone" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={ORANGE_GLOW} stopOpacity={0.42} />
          <stop offset="100%" stopColor={ORANGE_GLOW} stopOpacity={0.03} />
        </linearGradient>
        <radialGradient id="sbPool">
          <stop offset="0%" stopColor={ORANGE_GLOW} stopOpacity={0.55} />
          <stop offset="55%" stopColor={ORANGE_GLOW} stopOpacity={0.16} />
          <stop offset="100%" stopColor={ORANGE_GLOW} stopOpacity={0} />
        </radialGradient>
        <filter id="sbGlow" x="-100%" y="-300%" width="300%" height="700%">
          <feGaussianBlur stdDeviation={12} />
        </filter>
      </defs>

      {/* Ceiling plane edge */}
      <line
        x1={W / 2 - (W / 2) * line}
        y1={ceilY}
        x2={W / 2 + (W / 2) * line}
        y2={ceilY}
        stroke={WHITE}
        strokeOpacity={0.14}
        strokeWidth={2}
      />
      <rect x={0} y={0} width={W} height={ceilY} fill={NIGHT} opacity={0.6 * line} />

      {on > 0.01 ? (
        <g style={{mixBlendMode: 'screen'}}>
          <polygon
            points={`${cx - ar * 0.8},${ceilY} ${cx + ar * 0.8},${ceilY} ${cx + beamR},${beamY} ${cx - beamR},${beamY}`}
            fill="url(#sbCone)"
            opacity={on}
          />
          <ellipse cx={cx} cy={floorY} rx={pr * 1.2} ry={pr * 0.16} fill="url(#sbPool)" opacity={pool} />
          <ellipse cx={cx} cy={ceilY + 4} rx={ar * 1.9} ry={ar * 0.5} fill={ORANGE_GLOW} opacity={0.6 * on} filter="url(#sbGlow)" />
        </g>
      ) : null}

      {/* Aperture */}
      <ellipse
        cx={cx}
        cy={ceilY + 3}
        rx={ar}
        ry={ar * 0.24}
        fill={NAVY_DARK}
        stroke={WHITE}
        strokeOpacity={0.35 * line}
        strokeWidth={2}
      />
      <ellipse cx={cx} cy={ceilY + 3} rx={ar * 0.7} ry={ar * 0.16} fill={EMITTER} opacity={on} />
    </svg>
  );
};
