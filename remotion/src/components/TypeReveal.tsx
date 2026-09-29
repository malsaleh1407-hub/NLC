import React from 'react';
import {Easing, interpolate, useCurrentFrame} from 'remotion';
import {FONT, WHITE} from '../brand';

// Word-by-word rise-and-glow text reveal.
export const TypeReveal: React.FC<{
  text: string;
  startAt?: number;
  fontSize?: number;
  fontWeight?: number;
  color?: string;
  wordStagger?: number;
  align?: 'center' | 'left';
  letterSpacing?: string;
  maxWidth?: number | string;
  glow?: boolean;
  rtl?: boolean;
  fontFamily?: string;
}> = ({
  text,
  startAt = 0,
  fontSize = 64,
  fontWeight = 700,
  color = WHITE,
  wordStagger = 5,
  align = 'center',
  letterSpacing = '0.01em',
  maxWidth = '86%',
  glow = false,
  rtl = false,
  fontFamily = FONT,
}) => {
  const frame = useCurrentFrame();
  const words = text.split(' ');

  return (
    <div
      style={{
        fontFamily,
        fontSize,
        fontWeight,
        color,
        letterSpacing,
        textAlign: align,
        maxWidth,
        lineHeight: rtl ? 1.45 : 1.22,
        display: 'flex',
        flexWrap: 'wrap',
        direction: rtl ? 'rtl' : 'ltr',
        justifyContent: align === 'center' ? 'center' : 'flex-start',
        columnGap: '0.28em',
      }}
    >
      {words.map((word, i) => {
        const f0 = startAt + i * wordStagger;
        const p = interpolate(frame, [f0, f0 + 16], [0, 1], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
          easing: Easing.out(Easing.cubic),
        });
        return (
          <span
            key={i}
            style={{
              opacity: p,
              transform: `translateY(${(1 - p) * 0.5}em)`,
              textShadow: glow ? `0 0 ${30 * p}px rgba(246,133,31,0.45)` : undefined,
              display: 'inline-block',
            }}
          >
            {word}
          </span>
        );
      })}
    </div>
  );
};
