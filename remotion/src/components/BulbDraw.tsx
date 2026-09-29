import React from 'react';
import {Easing, interpolate, useCurrentFrame} from 'remotion';
import {ORANGE, ORANGE_GLOW, WHITE} from '../brand';

// An LED bulb whose outline draws itself in light, then ignites.
// drawStart..drawEnd: outline stroke animation. igniteAt: flash + steady glow.
export const BulbDraw: React.FC<{
  size: number;
  drawStart?: number;
  drawEnd?: number;
  igniteAt?: number;
}> = ({size, drawStart = 0, drawEnd = 70, igniteAt = 80}) => {
  const frame = useCurrentFrame();

  const OUTLINE = 900; // generous path-length budget for dash animation
  const progress = interpolate(frame, [drawStart, drawEnd], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.inOut(Easing.cubic),
  });

  const flash = interpolate(frame, [igniteAt, igniteAt + 5, igniteAt + 22], [0, 1, 0.55], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const lit = frame >= igniteAt;
  const breath = lit ? 0.55 + flash * 0.45 + 0.05 * Math.sin(frame / 7) : 0;

  return (
    <div style={{position: 'relative', width: size, height: size * 1.35}}>
      {lit ? (
        <div
          style={{
            position: 'absolute',
            left: '50%',
            top: '38%',
            transform: 'translate(-50%, -50%)',
            width: size * 0.9,
            height: size * 0.9,
            borderRadius: '50%',
            background: `radial-gradient(circle, rgba(255,255,255,${0.9 * breath}) 0%, rgba(255,177,92,${0.7 * breath}) 40%, rgba(246,133,31,${0.32 * breath}) 68%, transparent 100%)`,
            filter: `blur(${size * 0.02}px)`,
          }}
        />
      ) : null}
      <svg viewBox="0 0 200 270" width={size} height={size * 1.35} style={{position: 'relative'}}>
        {/* Glass globe + neck */}
        <path
          d="M 100 18
             C 148 18 182 52 182 100
             C 182 132 164 152 148 172
             C 138 185 132 196 130 210
             L 70 210
             C 68 196 62 185 52 172
             C 36 152 18 132 18 100
             C 18 52 52 18 100 18 Z"
          fill={lit ? `rgba(246,133,31,${0.10 + 0.12 * breath})` : 'none'}
          stroke={lit ? ORANGE_GLOW : ORANGE}
          strokeWidth={5}
          strokeLinecap="round"
          strokeDasharray={OUTLINE}
          strokeDashoffset={OUTLINE * (1 - progress)}
          style={lit ? {filter: `drop-shadow(0 0 ${size * 0.06}px ${ORANGE})`} : undefined}
        />
        {/* Base threads */}
        {[222, 236, 250].map((y, i) => (
          <line
            key={y}
            x1={74 - i * 2}
            x2={126 + i * 2}
            y1={y}
            y2={y}
            stroke={ORANGE}
            strokeWidth={6}
            strokeLinecap="round"
            opacity={interpolate(frame, [drawEnd - 18 + i * 6, drawEnd - 6 + i * 6], [0, 1], {
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
            })}
          />
        ))}
        {/* LED filament — an N traced inside the globe (N for NLC) */}
        <path
          d="M 66 150 L 66 84 L 134 150 L 134 84"
          fill="none"
          stroke={lit ? WHITE : ORANGE_GLOW}
          strokeWidth={7}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray={320}
          strokeDashoffset={320 * (1 - interpolate(frame, [drawEnd - 24, igniteAt], [0, 1], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
            easing: Easing.out(Easing.cubic),
          }))}
          style={lit ? {filter: `drop-shadow(0 0 ${size * 0.05}px ${WHITE})`} : undefined}
        />
      </svg>
    </div>
  );
};
