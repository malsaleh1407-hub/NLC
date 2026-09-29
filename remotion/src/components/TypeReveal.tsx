import React from 'react';
import {Easing, interpolate, useCurrentFrame} from 'remotion';
import {FONT, ORANGE, WHITE} from '../brand';

// Word-by-word rise-and-glow text reveal.
// `highlight` sets one word in NLC Orange — one orange word per headline.
// A '\n' in `text` forces a line break (the stagger runs on across lines);
// `noWrap` stops a single word (e.g. a hyphenated product name) from breaking.
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
  highlight?: string;
  lineHeight?: number;
  noWrap?: boolean;
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
  highlight,
  lineHeight,
  noWrap = false,
}) => {
  const frame = useCurrentFrame();
  const lines = text.split('\n').map((l) => l.split(' '));

  const rowStyle: React.CSSProperties = {
    display: 'flex',
    flexWrap: 'wrap',
    direction: rtl ? 'rtl' : 'ltr',
    justifyContent: align === 'center' ? 'center' : 'flex-start',
    columnGap: '0.28em',
  };

  let index = 0;
  const renderWord = (word: string, key: string) => {
    const i = index++;
    const f0 = startAt + i * wordStagger;
    const p = interpolate(frame, [f0, f0 + 16], [0, 1], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
      easing: Easing.out(Easing.cubic),
    });
    return (
      <span
        key={key}
        style={{
          opacity: p,
          transform: `translateY(${(1 - p) * 0.5}em)`,
          textShadow: glow ? `0 0 ${30 * p}px rgba(246,133,31,0.45)` : undefined,
          display: 'inline-block',
          color: highlight !== undefined && word === highlight ? ORANGE : undefined,
          whiteSpace: noWrap ? 'nowrap' : undefined,
        }}
      >
        {word}
      </span>
    );
  };

  const base: React.CSSProperties = {
    fontFamily,
    fontSize,
    fontWeight,
    color,
    letterSpacing,
    textAlign: align,
    maxWidth,
    lineHeight: lineHeight ?? (rtl ? 1.45 : 1.22),
  };

  if (lines.length === 1) {
    return <div style={{...base, ...rowStyle}}>{lines[0].map((w, i) => renderWord(w, `${i}`))}</div>;
  }
  return (
    <div
      style={{
        ...base,
        display: 'flex',
        flexDirection: 'column',
        direction: rtl ? 'rtl' : 'ltr',
        alignItems: align === 'center' ? 'center' : 'flex-start',
      }}
    >
      {lines.map((words, li) => (
        <div key={li} style={rowStyle}>
          {words.map((w, wi) => renderWord(w, `${li}-${wi}`))}
        </div>
      ))}
    </div>
  );
};
