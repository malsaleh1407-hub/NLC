import React from 'react';
import {Easing, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {FONT, ORANGE, ORANGE_GLOW, WHITE} from '../brand';

// Typographic NLC lockup: big wordmark, orange light-sweep underline,
// letterspaced company name below. `startAt` is relative to enclosing sequence.
export const LogoLockup: React.FC<{
  scale?: number;
  startAt?: number;
  showSubtitle?: boolean;
}> = ({scale = 1, startAt = 0, showSubtitle = true}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const f = Math.max(0, frame - startAt);

  const pop = spring({frame: f, fps, config: {damping: 14, stiffness: 120}});
  const sweep = interpolate(f, [8, 40], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  });
  const subIn = interpolate(f, [26, 48], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', transform: `scale(${scale})`}}>
      <div
        style={{
          fontFamily: FONT,
          fontWeight: 900,
          fontSize: 190,
          letterSpacing: '0.02em',
          color: WHITE,
          transform: `scale(${0.7 + 0.3 * pop})`,
          opacity: pop,
          textShadow: `0 0 60px rgba(246,133,31,${0.45 * sweep}), 0 0 140px rgba(246,133,31,${0.25 * sweep})`,
          lineHeight: 1,
        }}
      >
        N<span style={{color: ORANGE}}>L</span>C
      </div>
      <div
        style={{
          width: 460 * sweep,
          height: 8,
          marginTop: 26,
          borderRadius: 4,
          background: `linear-gradient(90deg, transparent, ${ORANGE_GLOW}, ${ORANGE}, ${ORANGE_GLOW}, transparent)`,
          boxShadow: `0 0 24px 4px rgba(246,133,31,${0.5 * sweep})`,
        }}
      />
      {showSubtitle ? (
        <div
          style={{
            fontFamily: FONT,
            fontWeight: 600,
            fontSize: 30,
            letterSpacing: '0.42em',
            marginTop: 30,
            paddingLeft: '0.42em',
            color: 'rgba(255,255,255,0.85)',
            opacity: subIn,
            transform: `translateY(${(1 - subIn) * 14}px)`,
          }}
        >
          NATIONAL LIGHTING COMPANY
        </div>
      ) : null}
    </div>
  );
};
