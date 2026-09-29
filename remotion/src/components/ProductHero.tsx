import React from 'react';
import {Easing, Img, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {BRAND_EASE, ORANGE_GLOW, WHITE} from '../brand';
import {DownlightIcon} from './Downlight';

const ease = Easing.bezier(...BRAND_EASE);
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

// The product, revealed by a travelling bar of light (a clip wipe, the same
// language as the logo reveal) and then held with a slow push-in — the
// guidelines' "image bloom" of 1.05×.
//
// With a photo: the site's transparent PNG, centred, with a soft navy-tinted
// shadow only (guidelines §07 Product photography; §09 shadows are navy).
// Without one: the line-art DownlightIcon, never a fake render.
export const ProductHero: React.FC<{
  photo: string | null;
  size: number;
  startAt?: number;
  revealFrames?: number;
  holdFrames?: number;
  rtl?: boolean;
  alt?: string;
}> = ({photo, size, startAt = 0, revealFrames = 30, holdFrames = 150, rtl = false, alt = ''}) => {
  const frame = useCurrentFrame();
  const f = frame - startAt;

  const wipe = interpolate(f, [0, revealFrames], [0, 1], {...clamp, easing: ease});
  const push = interpolate(f, [0, holdFrames], [1, 1.05], clamp);
  const halo = interpolate(f, [-8, revealFrames], [0, 1], {...clamp, easing: ease});
  const bar = wipe > 0.001 && wipe < 0.999;
  const lit = interpolate(f, [revealFrames * 0.6, revealFrames + 10], [0, 1], clamp);

  // Wipe direction follows reading direction.
  const clip = rtl ? `inset(0 0 0 ${(1 - wipe) * 100}%)` : `inset(0 ${(1 - wipe) * 100}% 0 0)`;
  const barX = rtl ? size * (1 - wipe) : size * wipe;

  return (
    <div style={{position: 'relative', width: size, height: size}}>
      {/* Warm halo behind the product */}
      <div
        style={{
          position: 'absolute',
          inset: -size * 0.18,
          borderRadius: '50%',
          background: `radial-gradient(circle at 50% 46%, rgba(253,176,116,${0.26 * halo}) 0%, rgba(246,133,31,${0.1 * halo}) 34%, transparent 66%)`,
        }}
      />
      <div style={{position: 'absolute', inset: 0, clipPath: clip, transform: `scale(${push})`}}>
        {photo ? (
          <Img
            src={staticFile(photo)}
            alt={alt}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'contain',
              // 14px breathing room at 200px ≈ 7% (guidelines §09)
              padding: size * 0.07,
              filter: `drop-shadow(0 ${size * 0.035}px ${size * 0.045}px rgba(15,18,53,0.7))`,
            }}
          />
        ) : (
          <div style={{display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%'}}>
            <DownlightIcon size={size * 0.86} lit={lit} />
          </div>
        )}
      </div>
      {/* The light bar that performs the wipe */}
      {bar ? (
        <div
          style={{
            position: 'absolute',
            top: -size * 0.04,
            bottom: -size * 0.04,
            left: barX - 3,
            width: 6,
            background: `linear-gradient(180deg, transparent, ${WHITE} 30%, ${ORANGE_GLOW} 70%, transparent)`,
            boxShadow: `0 0 24px 6px rgba(246,133,31,0.55)`,
            borderRadius: 3,
          }}
        />
      ) : null}
    </div>
  );
};
