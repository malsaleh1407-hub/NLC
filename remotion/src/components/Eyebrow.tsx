import React from 'react';
import {Easing, interpolate, useCurrentFrame} from 'remotion';
import {BRAND_EASE, ORANGE} from '../brand';

const ease = Easing.bezier(...BRAND_EASE);

// Section label per the type scale (guidelines §04): bold, uppercase,
// letter-spacing .32em, NLC Orange (--secondary, §06 section pattern). Arabic has no case and is never letter-spaced
// (tracking breaks the joins), so `rtl` drops both.
export const Eyebrow: React.FC<{
  text: string;
  startAt?: number;
  fontSize?: number;
  rtl?: boolean;
  fontFamily: string;
}> = ({text, startAt = 0, fontSize = 26, rtl = false, fontFamily}) => {
  const frame = useCurrentFrame();
  const p = interpolate(frame, [startAt, startAt + 14], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: ease,
  });
  return (
    <div
      style={{
        fontFamily,
        fontWeight: 700,
        fontSize: rtl ? fontSize * 1.25 : fontSize,
        color: ORANGE,
        letterSpacing: rtl ? 0 : '0.32em',
        // Compensate trailing tracking so centred labels stay optically centred.
        marginInlineEnd: rtl ? 0 : '-0.32em',
        textTransform: rtl ? 'none' : 'uppercase',
        direction: rtl ? 'rtl' : 'ltr',
        opacity: p,
        transform: `translateY(${(1 - p) * 12}px)`,
      }}
    >
      {text}
    </div>
  );
};
