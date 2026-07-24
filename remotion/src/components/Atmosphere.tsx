import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {NAVY, NAVY_DEEP, NIGHT, ORANGE_GLOW, WHITE} from '../brand';

// Deep night-navy backdrop with a soft radial lift.
export const NightBackdrop: React.FC<{lift?: number}> = ({lift = 0}) => (
  <AbsoluteFill
    style={{
      background: `radial-gradient(ellipse at 50% ${45 - lift * 10}%, ${NAVY_DEEP} ${lift * 24}%, ${NIGHT} 78%)`,
    }}
  />
);

export const NavyBackdrop: React.FC = () => (
  <AbsoluteFill
    style={{
      background: `radial-gradient(ellipse at 50% 30%, ${NAVY} 0%, ${NAVY_DEEP} 60%, ${NIGHT} 100%)`,
    }}
  />
);

// Cinematic vignette + subtle scanline grain (SVG turbulence-free, deterministic).
export const CinematicOverlay: React.FC<{vignette?: number}> = ({vignette = 0.55}) => (
  <AbsoluteFill style={{pointerEvents: 'none'}}>
    <AbsoluteFill
      style={{
        background: `radial-gradient(ellipse at center, transparent 52%, rgba(0,0,0,${vignette}) 100%)`,
      }}
    />
  </AbsoluteFill>
);

// A light-flash used as scene transition: quick warm flash that blooms and decays.
// Place at the cut point; `at` is the frame of the cut within the parent sequence.
export const LightSweep: React.FC<{at: number}> = ({at}) => {
  const frame = useCurrentFrame();
  const o = interpolate(frame, [at - 6, at, at + 14], [0, 0.92, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  if (o <= 0.01) return null;
  return (
    <AbsoluteFill
      style={{
        background: `radial-gradient(circle at 50% 50%, ${WHITE} 0%, ${ORANGE_GLOW} 30%, rgba(246,133,31,0.4) 60%, transparent 100%)`,
        opacity: o,
      }}
    />
  );
};
