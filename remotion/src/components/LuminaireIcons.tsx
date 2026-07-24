import React from 'react';
import {interpolate, useCurrentFrame} from 'remotion';
import {NAVY, ORANGE, ORANGE_GLOW, WHITE, FONT} from '../brand';

// Procedural luminaire silhouettes, each casting an animated light cone.
type Kind = 'street' | 'flood' | 'highbay' | 'linear';

const Fixture: React.FC<{kind: Kind; lit: number}> = ({kind, lit}) => {
  const stroke = WHITE;
  const cone = (
    <linearGradient id={`cone-${kind}`} x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stopColor={ORANGE_GLOW} stopOpacity={0.75 * lit} />
      <stop offset="100%" stopColor={ORANGE_GLOW} stopOpacity={0.02 * lit} />
    </linearGradient>
  );
  switch (kind) {
    case 'street':
      return (
        <svg viewBox="0 0 200 240" width="100%" height="100%">
          <defs>{cone}</defs>
          <line x1={40} y1={230} x2={40} y2={30} stroke={stroke} strokeWidth={8} strokeLinecap="round" />
          <path d="M 40 30 Q 40 14 60 14 L 128 14" stroke={stroke} strokeWidth={8} fill="none" strokeLinecap="round" />
          <rect x={118} y={6} width={52} height={18} rx={9} fill={lit ? ORANGE : NAVY} stroke={stroke} strokeWidth={5} />
          {lit > 0.05 ? <path d="M 144 26 L 92 230 L 196 230 Z" fill={`url(#cone-street)`} /> : null}
        </svg>
      );
    case 'flood':
      return (
        <svg viewBox="0 0 200 240" width="100%" height="100%">
          <defs>{cone}</defs>
          <rect x={55} y={30} width={90} height={64} rx={10} fill={lit ? ORANGE : NAVY} stroke={stroke} strokeWidth={6} transform="rotate(18 100 62)" />
          <line x1={100} y1={100} x2={100} y2={132} stroke={stroke} strokeWidth={7} />
          <line x1={70} y1={132} x2={130} y2={132} stroke={stroke} strokeWidth={7} strokeLinecap="round" />
          {lit > 0.05 ? <path d="M 78 96 L 30 230 L 190 230 Z" fill={`url(#cone-flood)`} transform="rotate(6 100 160)" /> : null}
        </svg>
      );
    case 'highbay':
      return (
        <svg viewBox="0 0 200 240" width="100%" height="100%">
          <defs>{cone}</defs>
          <line x1={100} y1={0} x2={100} y2={26} stroke={stroke} strokeWidth={6} />
          <path d="M 60 70 A 40 40 0 0 1 140 70 L 148 92 L 52 92 Z" fill={lit ? ORANGE : NAVY} stroke={stroke} strokeWidth={6} />
          <circle cx={100} cy={100} r={12} fill={lit ? ORANGE_GLOW : NAVY} stroke={stroke} strokeWidth={5} />
          {lit > 0.05 ? <path d="M 100 108 L 40 230 L 160 230 Z" fill={`url(#cone-highbay)`} /> : null}
        </svg>
      );
    case 'linear':
      return (
        <svg viewBox="0 0 200 240" width="100%" height="100%">
          <defs>{cone}</defs>
          <line x1={60} y1={0} x2={60} y2={34} stroke={stroke} strokeWidth={5} />
          <line x1={140} y1={0} x2={140} y2={34} stroke={stroke} strokeWidth={5} />
          <rect x={30} y={34} width={140} height={26} rx={8} fill={lit ? ORANGE : NAVY} stroke={stroke} strokeWidth={6} />
          {lit > 0.05 ? <path d="M 100 62 L 20 230 L 180 230 Z" fill={`url(#cone-linear)`} /> : null}
        </svg>
      );
  }
};

export const LuminaireCard: React.FC<{
  kind: Kind;
  label: string;
  badge: string;
  startAt?: number;
  width?: number;
}> = ({kind, label, badge, startAt = 0, width = 320}) => {
  const frame = useCurrentFrame();
  const f = Math.max(0, frame - startAt);
  const rise = interpolate(f, [0, 20], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const lit = interpolate(f, [14, 26], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const badgeIn = interpolate(f, [26, 40], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});

  return (
    <div
      style={{
        width,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 18,
        opacity: rise,
        transform: `translateY(${(1 - rise) * 60}px)`,
      }}
    >
      <div style={{width: width * 0.72, height: width * 0.86}}>
        <Fixture kind={kind} lit={lit} />
      </div>
      <div
        style={{
          fontFamily: FONT,
          fontWeight: 700,
          fontSize: width * 0.085,
          color: WHITE,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontFamily: FONT,
          fontWeight: 700,
          fontSize: width * 0.062,
          color: ORANGE_GLOW,
          border: `3px solid ${ORANGE}`,
          borderRadius: 999,
          padding: `${width * 0.02}px ${width * 0.06}px`,
          opacity: badgeIn,
          transform: `scale(${0.6 + 0.4 * badgeIn})`,
          boxShadow: `0 0 ${18 * badgeIn}px rgba(246,133,31,0.45)`,
        }}
      >
        {badge}
      </div>
    </div>
  );
};
