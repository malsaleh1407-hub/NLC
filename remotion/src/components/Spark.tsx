import React from 'react';
import {interpolate, useCurrentFrame} from 'remotion';
import {ORANGE, ORANGE_GLOW, WHITE} from '../brand';

// A single point of light that flickers to life, then burns steady.
// igniteAt/steadyAt are frames relative to the sequence this sits in.
export const Spark: React.FC<{
  x: number | string;
  y: number | string;
  size?: number;
  igniteAt?: number;
  steadyAt?: number;
  intensity?: number;
}> = ({x, y, size = 26, igniteAt = 0, steadyAt = 45, intensity = 1}) => {
  const frame = useCurrentFrame();

  // Flicker pattern while igniting — like a striking arc lamp
  const flickerPattern = [0, 0.9, 0.1, 0.7, 0.05, 1, 0.3, 0.85, 0.15, 1, 0.6, 1];
  const t = interpolate(frame, [igniteAt, steadyAt], [0, flickerPattern.length - 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const idx = Math.floor(t);
  const flicker =
    frame >= steadyAt
      ? 1 - 0.06 * Math.abs(Math.sin(frame / 9))
      : flickerPattern[Math.min(idx, flickerPattern.length - 1)];

  const glow = flicker * intensity;
  const halo = size * 6 * glow;

  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y,
        transform: 'translate(-50%, -50%)',
        width: size,
        height: size,
        borderRadius: '50%',
        background: `radial-gradient(circle, ${WHITE} 0%, ${ORANGE_GLOW} 35%, ${ORANGE} 70%, transparent 100%)`,
        opacity: glow,
        boxShadow: `0 0 ${halo}px ${halo / 3}px rgba(246,133,31,${0.55 * glow}), 0 0 ${halo * 2.4}px ${halo}px rgba(246,133,31,${0.22 * glow})`,
      }}
    />
  );
};
