import React from 'react';
import {Easing, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {FONT, ORANGE, ORANGE_GLOW, WHITE} from '../brand';

export const StatCounter: React.FC<{
  value: number;
  suffix?: string;
  label: string;
  startAt?: number;
  fontSize?: number;
}> = ({value, suffix = '', label, startAt = 0, fontSize = 110}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const f = Math.max(0, frame - startAt);

  const pop = spring({frame: f, fps, config: {damping: 13, stiffness: 110}});
  const n = Math.round(
    interpolate(f, [0, 55], [0, value], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
      easing: Easing.out(Easing.exp),
    }),
  );

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 12,
        opacity: pop,
        transform: `translateY(${(1 - pop) * 40}px)`,
      }}
    >
      <div
        style={{
          fontFamily: FONT,
          fontWeight: 900,
          fontSize,
          color: WHITE,
          lineHeight: 1,
          textShadow: '0 0 40px rgba(246,133,31,0.35)',
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {n.toLocaleString('en-US')}
        <span style={{color: ORANGE}}>{suffix}</span>
      </div>
      <div
        style={{
          width: 54,
          height: 5,
          borderRadius: 3,
          background: `linear-gradient(90deg, ${ORANGE}, ${ORANGE_GLOW})`,
        }}
      />
      <div
        style={{
          fontFamily: FONT,
          fontWeight: 600,
          fontSize: fontSize * 0.24,
          letterSpacing: '0.28em',
          paddingLeft: '0.28em',
          color: 'rgba(255,255,255,0.75)',
          textTransform: 'uppercase',
        }}
      >
        {label}
      </div>
    </div>
  );
};
