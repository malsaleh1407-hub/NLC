import React from 'react';
import {interpolate, random, useCurrentFrame} from 'remotion';
import {NAVY, NAVY_DEEP, ORANGE, ORANGE_GLOW} from '../brand';

// A procedural Saudi-inspired skyline (incl. a Kingdom-Centre-style arch tower)
// whose windows and streetlights ignite in a wave from the center outwards.
// igniteAt: frame the wave starts. waveDuration: frames until fully lit.
export const Skyline: React.FC<{
  width: number;
  height: number;
  igniteAt?: number;
  waveDuration?: number;
  seed?: string;
}> = ({width, height, igniteAt = 0, waveDuration = 120, seed = 'city'}) => {
  const frame = useCurrentFrame();
  const groundY = height * 0.86;

  // Building spec: [xCenter%, width%, height%]
  const buildings: Array<[number, number, number]> = [
    [6, 8, 0.34], [15, 7, 0.48], [24, 9, 0.4], [33, 6, 0.62],
    [41, 8, 0.5], [58, 8, 0.55], [67, 6, 0.44], [75, 9, 0.6],
    [85, 7, 0.38], [93, 8, 0.5],
  ];

  const litProgress = interpolate(frame, [igniteAt, igniteAt + waveDuration], [0, 1.15], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const windowLit = (bx: number, key: string) => {
    // Wave spreads from the center (the arch tower) outward
    const dist = Math.abs(bx - 50) / 50;
    const jitter = random(`${seed}-${key}`) * 0.25;
    return litProgress > dist + jitter;
  };

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{display: 'block'}}>
      {/* Buildings */}
      {buildings.map(([cx, bw, bh], bi) => {
        const bx = (cx / 100) * width;
        const w = (bw / 100) * width;
        const h = bh * height;
        const x0 = bx - w / 2;
        const y0 = groundY - h;
        const cols = 3;
        const rows = Math.max(3, Math.floor(h / (height * 0.055)));
        return (
          <g key={bi}>
            <rect x={x0} y={y0} width={w} height={h} fill={NAVY_DEEP} stroke={NAVY} strokeWidth={1} />
            {Array.from({length: rows}).map((_, r) =>
              Array.from({length: cols}).map((__, c) => {
                const k = `w-${bi}-${r}-${c}`;
                if (random(`${seed}-skip-${k}`) < 0.25) return null;
                const lit = windowLit(cx, k);
                const ww = w / (cols * 2);
                const wx = x0 + w * 0.14 + c * (w * 0.72 / cols) + ww * 0.25;
                const wy = y0 + h * 0.06 + r * (h * 0.88 / rows);
                const flick = 0.75 + 0.25 * Math.abs(Math.sin((frame + r * 13 + c * 29 + bi * 7) / 16));
                return (
                  <rect
                    key={k}
                    x={wx}
                    y={wy}
                    width={ww}
                    height={height * 0.018}
                    fill={lit ? ORANGE_GLOW : 'rgba(255,255,255,0.05)'}
                    opacity={lit ? flick : 1}
                  />
                );
              }),
            )}
          </g>
        );
      })}

      {/* Center: Kingdom-Centre-style arch tower */}
      {(() => {
        const tw = width * 0.11;
        const th = height * 0.78;
        const tx = width * 0.5;
        const y0 = groundY - th;
        const lit = litProgress > 0.02;
        const glow = lit ? 0.5 + 0.5 * Math.min(1, (litProgress - 0.02) * 4) : 0;
        return (
          <g>
            <path
              d={`M ${tx - tw / 2} ${groundY}
                  L ${tx - tw / 2} ${y0 + th * 0.42}
                  Q ${tx - tw / 2} ${y0} ${tx} ${y0}
                  Q ${tx + tw / 2} ${y0} ${tx + tw / 2} ${y0 + th * 0.42}
                  L ${tx + tw / 2} ${groundY} Z`}
              fill={NAVY}
              stroke={ORANGE}
              strokeWidth={lit ? 2 : 1}
              style={lit ? {filter: `drop-shadow(0 0 6px rgba(246,133,31,${glow * 0.8}))`} : undefined}
            />
            {/* The signature arch opening */}
            <path
              d={`M ${tx - tw * 0.26} ${y0 + th * 0.3}
                  Q ${tx} ${y0 + th * 0.04} ${tx + tw * 0.26} ${y0 + th * 0.3}
                  L ${tx + tw * 0.26} ${y0 + th * 0.14}
                  Q ${tx} ${y0 - th * 0.06} ${tx - tw * 0.26} ${y0 + th * 0.14} Z`}
              fill={lit ? ORANGE_GLOW : NAVY_DEEP}
              opacity={lit ? 0.55 + glow * 0.45 : 1}
            />
            {/* Facade light strips */}
            {Array.from({length: 9}).map((_, r) => {
              const wy = y0 + th * 0.48 + r * th * 0.052;
              const wLit = litProgress > 0.03 + r * 0.015;
              return (
                <rect
                  key={r}
                  x={tx - tw * 0.32}
                  y={wy}
                  width={tw * 0.64}
                  height={height * 0.008}
                  fill={wLit ? ORANGE_GLOW : 'rgba(255,255,255,0.06)'}
                  opacity={wLit ? 0.9 : 1}
                />
              );
            })}
          </g>
        );
      })()}

      {/* Ground line */}
      <rect x={0} y={groundY} width={width} height={2} fill={NAVY} />

      {/* Streetlights popping on left-to-right */}
      {Array.from({length: 7}).map((_, i) => {
        const sx = width * (0.08 + i * 0.14);
        const poleH = height * 0.1;
        const lit = litProgress > 0.15 + i * 0.09;
        return (
          <g key={i}>
            <line x1={sx} y1={groundY} x2={sx} y2={groundY - poleH} stroke={NAVY} strokeWidth={3} />
            <line x1={sx} y1={groundY - poleH} x2={sx + width * 0.02} y2={groundY - poleH} stroke={NAVY} strokeWidth={3} />
            <circle
              cx={sx + width * 0.02}
              cy={groundY - poleH + 3}
              r={4}
              fill={lit ? ORANGE_GLOW : 'rgba(255,255,255,0.12)'}
              style={lit ? {filter: 'drop-shadow(0 0 8px rgba(246,133,31,0.9))'} : undefined}
            />
            {lit ? (
              <path
                d={`M ${sx + width * 0.02} ${groundY - poleH + 4}
                    L ${sx + width * 0.02 - poleH * 0.55} ${groundY}
                    L ${sx + width * 0.02 + poleH * 0.55} ${groundY} Z`}
                fill="url(#coneGrad)"
                opacity={0.8}
              />
            ) : null}
          </g>
        );
      })}
      <defs>
        <linearGradient id="coneGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={ORANGE_GLOW} stopOpacity={0.5} />
          <stop offset="100%" stopColor={ORANGE_GLOW} stopOpacity={0.02} />
        </linearGradient>
      </defs>
    </svg>
  );
};
