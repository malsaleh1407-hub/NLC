import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {FONT, NAVY, NAVY_DEEP, NIGHT, ORANGE, ORANGE_GLOW, WHITE} from '../brand';
import {loadBrandFonts} from '../fonts';
import {CinematicOverlay} from '../components/Atmosphere';
import {NLCLogo} from '../components/NLCLogo';

// 1:1 seamless loop — every animation is periodic in `duration` frames,
// so the post loops forever in the feed with no visible seam.
export const InstagramPost: React.FC = () => {
  loadBrandFonts();
  const frame = useCurrentFrame();
  const {durationInFrames, width} = useVideoConfig();
  const t = (frame / durationInFrames) * Math.PI * 2; // one full cycle per loop

  const pulse = 0.72 + 0.28 * Math.sin(t * 3); // 3 breaths per loop
  const raysAngle = (frame / durationInFrames) * 90; // 90° = symmetric for 12 rays
  const orbitCount = 10;

  return (
    <AbsoluteFill style={{background: `radial-gradient(circle at 50% 42%, ${NAVY} 0%, ${NAVY_DEEP} 55%, ${NIGHT} 100%)`}}>
      {/* Rotating rays — symmetric so rotation loops seamlessly */}
      <svg style={{position: 'absolute', inset: 0, opacity: 0.4}} viewBox="0 0 100 100" width="100%" height="100%">
        <g transform={`translate(50 42) rotate(${raysAngle})`}>
          {Array.from({length: 12}).map((_, i) => (
            <path
              key={i}
              d="M 0 0 L -2.5 -75 L 2.5 -75 Z"
              fill="rgba(246,133,31,0.14)"
              transform={`rotate(${i * 30})`}
            />
          ))}
        </g>
      </svg>

      {/* Central glow orb */}
      <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center', paddingBottom: 260}}>
        <div
          style={{
            width: 320,
            height: 320,
            borderRadius: '50%',
            background: `radial-gradient(circle, ${WHITE} 0%, ${ORANGE_GLOW} 32%, ${ORANGE} 62%, transparent 78%)`,
            opacity: pulse,
            boxShadow: `0 0 ${140 * pulse}px ${50 * pulse}px rgba(246,133,31,0.45)`,
          }}
        />
      </AbsoluteFill>

      {/* Orbiting light points — whole-number orbits per loop */}
      {Array.from({length: orbitCount}).map((_, i) => {
        const orbits = i % 2 === 0 ? 1 : 2;
        const angle = t * orbits + (i * Math.PI * 2) / orbitCount;
        const r = 260 + (i % 3) * 46;
        const x = width / 2 + Math.cos(angle) * r;
        const y = width / 2 - 260 + Math.sin(angle) * r * 0.6;
        const tw = 0.5 + 0.5 * Math.sin(t * 6 + i);
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: x,
              top: y,
              width: 7,
              height: 7,
              borderRadius: '50%',
              background: ORANGE_GLOW,
              opacity: 0.25 + 0.55 * tw,
              boxShadow: '0 0 14px 4px rgba(246,133,31,0.4)',
            }}
          />
        );
      })}

      {/* Wordmark + tagline */}
      <AbsoluteFill style={{justifyContent: 'flex-end', alignItems: 'center', paddingBottom: 128}}>
        <NLCLogo height={185} variant="reversed" />
        <div
          style={{
            fontFamily: FONT,
            fontWeight: 600,
            fontSize: 34,
            letterSpacing: '0.06em',
            marginTop: 26,
            color: 'rgba(255,255,255,0.92)',
            textAlign: 'center',
            maxWidth: '84%',
          }}
        >
          Engineering the Kingdom's{' '}
          <span style={{color: ORANGE_GLOW, fontWeight: 700}}>Light, Power &amp; Systems</span>
        </div>
        <div
          style={{
            fontFamily: FONT,
            fontWeight: 400,
            fontSize: 26,
            letterSpacing: '0.3em',
            paddingLeft: '0.3em',
            marginTop: 22,
            color: 'rgba(255,255,255,0.55)',
          }}
        >
          SINCE 1993 — nlc.com.sa
        </div>
      </AbsoluteFill>

      <CinematicOverlay vignette={0.45} />
    </AbsoluteFill>
  );
};
