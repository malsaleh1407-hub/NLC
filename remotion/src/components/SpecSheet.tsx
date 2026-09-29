import React from 'react';
import {Easing, interpolate, useCurrentFrame} from 'remotion';
import {BRAND_EASE, ORANGE, WHITE} from '../brand';

const ease = Easing.bezier(...BRAND_EASE);
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

export type SheetRow = {label: string; value: string};

// A datasheet table that writes itself: each row's rule draws across in the
// reading direction, then the label and value rise in. Values are always set
// LTR (Latin figures and units) even inside an Arabic layout.
export const SpecSheet: React.FC<{
  rows: SheetRow[];
  width: number;
  startAt?: number;
  stagger?: number;
  fontSize?: number;
  rtl?: boolean;
  fontFamily: string;
}> = ({rows, width, startAt = 0, stagger = 8, fontSize = 34, rtl = false, fontFamily}) => {
  const frame = useCurrentFrame();
  const rowH = fontSize * 2.05;

  return (
    <div style={{width, direction: rtl ? 'rtl' : 'ltr'}}>
      {rows.map((r, i) => {
        const f0 = startAt + i * stagger;
        const rule = interpolate(frame, [f0, f0 + 14], [0, 1], {...clamp, easing: ease});
        const text = interpolate(frame, [f0 + 6, f0 + 18], [0, 1], {...clamp, easing: ease});
        return (
          <div key={`${r.label}-${i}`} style={{position: 'relative', height: rowH}}>
            <div
              style={{
                position: 'absolute',
                left: 0,
                right: 0,
                bottom: 0,
                height: 2,
                background: i === 0 ? ORANGE : 'rgba(255,255,255,0.16)',
                transform: `scaleX(${rule})`,
                transformOrigin: rtl ? 'right center' : 'left center',
              }}
            />
            <div
              style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: fontSize,
                opacity: text,
                transform: `translateY(${(1 - text) * fontSize * 0.4}px)`,
              }}
            >
              <span style={{fontFamily, fontWeight: 400, fontSize, color: 'rgba(255,255,255,0.68)'}}>{r.label}</span>
              <span
                style={{
                  fontFamily,
                  fontWeight: 700,
                  fontSize,
                  color: WHITE,
                  direction: 'ltr',
                  unicodeBidi: 'isolate',
                  whiteSpace: 'nowrap',
                }}
              >
                {r.value}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
};
