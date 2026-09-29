import React from 'react';
import {Easing, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {NAVY, NAVY_DEEP, NIGHT, ORANGE, ORANGE_GLOW} from '../brand';

// A one-point-perspective corridor with two continuous runs of linear
// luminaires along the ceiling. Segment by segment the runs ignite, nearest
// first, drawing two lines of light into the distance while the camera
// dollies slowly forward. Each lit segment washes the floor beneath it.
//
// The luminaires are drawn as lines of light, not as a specific housing, so the
// shot shows what a linear luminaire does without inventing a product design.

const SEGMENTS = 12;
const SEG_LEN = 1.9; // metres of luminaire per segment
const GAP = 0.35; // metres between segments
const NEAR = 0.6; // anything closer than this has passed the camera

export const Corridor: React.FC<{
  igniteAt?: number;
  igniteStagger?: number;
  dolly?: number; // metres travelled across the shot
  durationInFrames: number;
}> = ({igniteAt = 6, igniteStagger = 5, dolly = 2.6, durationInFrames}) => {
  const frame = useCurrentFrame();
  const {width: W, height: H} = useVideoConfig();

  const vpX = W / 2;
  const vpY = H * 0.47;
  const focal = Math.min(W, H) * 0.95;
  const ceil = 1.05; // ceiling above eye line (m)
  const floor = 1.55; // floor below eye line (m)
  const halfW = 1.6; // half corridor width (m)
  const rows = [-0.62, 0.62]; // two runs, x offset (m)
  const rowHalf = 0.045; // half width of the emitting face (m)

  const travel = interpolate(frame, [0, durationInFrames], [0, dolly], {
    easing: Easing.inOut(Easing.sin),
  });

  const P = (x: number, y: number, z: number) => {
    const zz = Math.max(z, 0.05);
    return `${(vpX + (x * focal) / zz).toFixed(1)},${(vpY - (y * focal) / zz).toFixed(1)}`;
  };

  const zFar = 30;
  const far = {
    l: vpX - (halfW * focal) / zFar,
    r: vpX + (halfW * focal) / zFar,
    t: vpY - (ceil * focal) / zFar,
    b: vpY + (floor * focal) / zFar,
  };

  const segs = Array.from({length: SEGMENTS}, (_, i) => {
    const z0 = 1.2 + i * (SEG_LEN + GAP) - travel;
    const z1 = z0 + SEG_LEN;
    const t0 = igniteAt + i * igniteStagger;
    const lit = interpolate(frame, [t0, t0 + 8], [0, 1], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
      easing: Easing.out(Easing.quad),
    });
    const haze = interpolate(z0, [12, 26], [1, 0.3], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
    return {i, z0: Math.max(z0, NEAR), z1, lit: lit * haze};
  })
    .filter((s) => s.z1 > NEAR)
    .sort((a, b) => b.z0 - a.z0);

  const runUp = interpolate(frame, [igniteAt, igniteAt + SEGMENTS * igniteStagger + 8], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const bloom = Math.min(W, H) * 0.014;

  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{position: 'absolute', inset: 0}}>
      <defs>
        <linearGradient id="cdCeil" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={NIGHT} />
          <stop offset="100%" stopColor={NAVY_DEEP} />
        </linearGradient>
        <linearGradient id="cdCeilLit" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#3b3560" />
          <stop offset="100%" stopColor={NAVY} />
        </linearGradient>
        <linearGradient id="cdFloor" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0%" stopColor={NIGHT} />
          <stop offset="100%" stopColor={NAVY_DEEP} />
        </linearGradient>
        <linearGradient id="cdWallL" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor={NIGHT} />
          <stop offset="100%" stopColor={NAVY} />
        </linearGradient>
        <linearGradient id="cdWallR" x1="1" y1="0" x2="0" y2="0">
          <stop offset="0%" stopColor={NIGHT} />
          <stop offset="100%" stopColor={NAVY} />
        </linearGradient>
        <radialGradient id="cdEnd">
          <stop offset="0%" stopColor={ORANGE_GLOW} stopOpacity={0.5} />
          <stop offset="100%" stopColor={NAVY} stopOpacity={0} />
        </radialGradient>
        {/* userSpaceOnUse: object-bbox filters collapse on thin shapes */}
        <filter id="cdBloom" filterUnits="userSpaceOnUse" x={0} y={0} width={W} height={H}>
          <feGaussianBlur stdDeviation={bloom} />
        </filter>
        <filter id="cdPoolBlur" filterUnits="userSpaceOnUse" x={0} y={0} width={W} height={H}>
          <feGaussianBlur stdDeviation={bloom * 2.6} />
        </filter>
      </defs>

      {/* Shell */}
      <polygon points={`0,0 ${W},0 ${far.r},${far.t} ${far.l},${far.t}`} fill="url(#cdCeil)" />
      <polygon points={`0,0 ${W},0 ${far.r},${far.t} ${far.l},${far.t}`} fill="url(#cdCeilLit)" opacity={0.55 * runUp} />
      <polygon points={`0,${H} ${W},${H} ${far.r},${far.b} ${far.l},${far.b}`} fill="url(#cdFloor)" />
      <polygon points={`0,0 ${far.l},${far.t} ${far.l},${far.b} 0,${H}`} fill="url(#cdWallL)" />
      <polygon points={`${W},0 ${far.r},${far.t} ${far.r},${far.b} ${W},${H}`} fill="url(#cdWallR)" />
      <rect x={far.l} y={far.t} width={far.r - far.l} height={far.b - far.t} fill={NAVY_DEEP} />
      <ellipse
        cx={vpX}
        cy={(far.t + far.b) / 2}
        rx={(far.r - far.l) * 2.4}
        ry={(far.b - far.t) * 1.8}
        fill="url(#cdEnd)"
        opacity={runUp}
      />

      {/* Floor washes, blurred as one layer */}
      <g filter="url(#cdPoolBlur)">
        {segs.map(({i, z0, z1, lit}) =>
          rows.map((x) => (
            <polygon
              key={`p${i}${x}`}
              points={`${P(x - 0.55, -floor, z0 + 0.2)} ${P(x + 0.55, -floor, z0 + 0.2)} ${P(x + 0.55, -floor, z1 + 0.2)} ${P(x - 0.55, -floor, z1 + 0.2)}`}
              fill={ORANGE}
              opacity={0.34 * lit}
            />
          )),
        )}
      </g>

      {/* Luminaire runs */}
      {segs.map(({i, z0, z1, lit}) =>
        rows.map((x) => {
          const face = `${P(x - rowHalf, ceil, z0)} ${P(x + rowHalf, ceil, z0)} ${P(x + rowHalf, ceil, z1)} ${P(x - rowHalf, ceil, z1)}`;
          const halo = `${P(x - rowHalf * 3, ceil, z0)} ${P(x + rowHalf * 3, ceil, z0)} ${P(x + rowHalf * 3, ceil, z1)} ${P(x - rowHalf * 3, ceil, z1)}`;
          return (
            <g key={`s${i}${x}`}>
              <polygon points={face} fill="#2c3163" />
              <polygon points={halo} fill={ORANGE_GLOW} opacity={0.45 * lit} filter="url(#cdBloom)" />
              <polygon points={face} fill="#FFF1DC" opacity={lit} />
            </g>
          );
        }),
      )}
    </svg>
  );
};
