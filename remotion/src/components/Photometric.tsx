import React from 'react';
import {Easing, interpolate, useCurrentFrame} from 'remotion';
import {FONT, ORANGE, ORANGE_GLOW, WHITE} from '../brand';

// An animated photometric polar distribution diagram — the chart every lighting
// engineer reads first. Intensity is plotted against angle from nadir (straight
// down), the curve draws itself, then a scan ray sweeps it.
//
// NOTE: these are *category-typical* distribution shapes for illustration.
// Wire real IES/LDT photometric data in via the `profile` prop when available.

export type Profile = 'narrow' | 'medium' | 'wide' | 'batwing' | 'asymmetric' | 'updown';

// Relative luminous intensity at angle t (radians) from nadir.
export const intensityAt = (profile: Profile, t: number): number => {
  const a = Math.abs(t);
  switch (profile) {
    case 'narrow': // high bay, projector, spike — tight downward lobe
      return a > Math.PI / 2 ? 0 : Math.pow(Math.cos(t), 7);
    case 'medium': // downlight, flood, track
      return a > Math.PI / 2 ? 0 : Math.pow(Math.cos(t), 2.4);
    case 'wide': // canopy, wall pack — broad throw
      return a > Math.PI / 2 ? 0 : Math.pow(Math.cos(t), 0.7);
    case 'batwing': // linear, panel, strip — twin lobes, soft centre
      return a > Math.PI / 2 ? 0 : 0.42 + 0.58 * Math.exp(-Math.pow((a - 0.62) / 0.34, 2));
    case 'asymmetric': // street light — forward-thrown road-side lobe
      if (a > Math.PI / 2) return 0;
      return t < 0
        ? 0.55 * Math.pow(Math.cos(t), 3)
        : 0.35 + 0.65 * Math.exp(-Math.pow((t - 0.85) / 0.42, 2));
    case 'updown': // wall light, bollard — lobes above and below
      return Math.pow(Math.abs(Math.cos(t)), 3.2);
  }
};

// Full-width-half-maximum beam angle in degrees, computed from the curve itself.
export const beamAngle = (profile: Profile): number => {
  let peak = 0;
  for (let d = -90; d <= 90; d += 0.5) peak = Math.max(peak, intensityAt(profile, (d * Math.PI) / 180));
  const half = peak / 2;
  let lo = 0;
  let hi = 0;
  for (let d = -90; d <= 90; d += 0.5) {
    if (intensityAt(profile, (d * Math.PI) / 180) >= half) {
      lo = Math.min(lo, d);
      hi = Math.max(hi, d);
    }
  }
  return Math.round(hi - lo);
};

const polar = (cx: number, cy: number, r: number, t: number) => ({
  // 0 rad = straight down (nadir); positive angles swing to the right
  x: cx + r * Math.sin(t),
  y: cy + r * Math.cos(t),
});

export const Photometric: React.FC<{
  profile: Profile;
  size: number;
  startAt?: number;
  drawFrames?: number;
  showScan?: boolean;
}> = ({profile, size, startAt = 0, drawFrames = 55, showScan = true}) => {
  const frame = useCurrentFrame();
  const f = Math.max(0, frame - startAt);

  const VB = 200;
  const cx = VB / 2;
  const cy = VB * 0.42;
  const R = VB * 0.42;

  const full = profile === 'updown';
  const from = full ? -180 : -90;
  const to = full ? 180 : 90;

  const pts: string[] = [];
  for (let d = from; d <= to; d += 2) {
    const t = (d * Math.PI) / 180;
    const r = R * intensityAt(profile, t);
    const p = polar(cx, cy, r, t);
    pts.push(`${p.x.toFixed(2)} ${p.y.toFixed(2)}`);
  }
  const curve = `M ${pts.join(' L ')}`;

  const gridIn = interpolate(f, [0, 14], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const draw = interpolate(f, [8, 8 + drawFrames], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.inOut(Easing.cubic),
  });
  const fillIn = interpolate(f, [8 + drawFrames - 10, 8 + drawFrames + 14], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Scan ray sweeps the distribution after it is drawn
  const scanStart = 8 + drawFrames + 6;
  const scanT = interpolate(f, [scanStart, scanStart + 70], [from, to], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.inOut(Easing.quad),
  });
  const scanRad = (scanT * Math.PI) / 180;
  const scanVal = intensityAt(profile, scanRad);
  const scanTip = polar(cx, cy, R * scanVal, scanRad);
  const scanEdge = polar(cx, cy, R, scanRad);
  const scanOn = showScan && f > scanStart;

  return (
    <svg viewBox={`0 0 ${VB} ${VB}`} width={size} height={size} style={{overflow: 'visible'}}>
      <defs>
        <radialGradient id="phFill" cx="50%" cy={`${(cy / VB) * 100}%`}>
          <stop offset="0%" stopColor={ORANGE_GLOW} stopOpacity={0.55} />
          <stop offset="100%" stopColor={ORANGE} stopOpacity={0.06} />
        </radialGradient>
      </defs>

      {/* Concentric intensity rings */}
      {[0.25, 0.5, 0.75, 1].map((k) => (
        <circle
          key={k}
          cx={cx}
          cy={cy}
          r={R * k}
          fill="none"
          stroke={WHITE}
          strokeOpacity={0.13 * gridIn}
          strokeWidth={0.5}
          strokeDasharray={k === 1 ? undefined : '2 2'}
        />
      ))}

      {/* Angle spokes + labels */}
      {[-90, -60, -30, 0, 30, 60, 90].map((d) => {
        const t = (d * Math.PI) / 180;
        const e = polar(cx, cy, R, t);
        const l = polar(cx, cy, R + 10, t);
        return (
          <g key={d}>
            <line
              x1={cx}
              y1={cy}
              x2={e.x}
              y2={e.y}
              stroke={WHITE}
              strokeOpacity={0.1 * gridIn}
              strokeWidth={0.5}
            />
            <text
              x={l.x}
              y={l.y}
              fill={WHITE}
              fillOpacity={0.42 * gridIn}
              fontSize={6}
              fontFamily={FONT}
              fontWeight={600}
              textAnchor="middle"
              dominantBaseline="middle"
            >
              {Math.abs(d)}°
            </text>
          </g>
        );
      })}

      {/* Filled distribution body */}
      <path d={`${curve} Z`} fill="url(#phFill)" opacity={fillIn} />

      {/* The curve, drawing itself */}
      <path
        d={curve}
        fill="none"
        stroke={ORANGE_GLOW}
        strokeWidth={2.2}
        strokeLinecap="round"
        strokeLinejoin="round"
        pathLength={1000}
        strokeDasharray={1000}
        strokeDashoffset={1000 * (1 - draw)}
        style={{filter: 'drop-shadow(0 0 3px rgba(246,133,31,0.9))'}}
      />

      {/* Scan ray + live readout */}
      {scanOn ? (
        <g>
          <line
            x1={cx}
            y1={cy}
            x2={scanEdge.x}
            y2={scanEdge.y}
            stroke={WHITE}
            strokeOpacity={0.28}
            strokeWidth={0.6}
          />
          <circle cx={scanTip.x} cy={scanTip.y} r={2.4} fill={WHITE} style={{filter: 'drop-shadow(0 0 4px #fff)'}} />
          {/* Readout parked in the empty top-left corner, clear of the curve */}
          <text
            x={2}
            y={9}
            fill={WHITE}
            fontSize={7}
            fontFamily={FONT}
            fontWeight={700}
            textAnchor="start"
            opacity={0.85}
          >
            {Math.round(scanVal * 100)}% @ {Math.round(Math.abs(scanT))}°
          </text>
        </g>
      ) : null}

      {/* Emission point */}
      <circle cx={cx} cy={cy} r={2.6} fill={WHITE} opacity={gridIn} style={{filter: 'drop-shadow(0 0 5px #F6851F)'}} />
    </svg>
  );
};
