import React from 'react';
import {AbsoluteFill, Easing, Img, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {BRAND_EASE, NIGHT} from '../brand';

const ease = Easing.bezier(...BRAND_EASE);
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

// A generated still (scripts/generate-stills.mjs) played as a scene: full
// bleed, a slow push-in (the guidelines' 1.05× image bloom), and — with
// `igniteAt` — a brightness rise so the room reads as switching on. A navy
// scrim on the copy side keeps headlines on a calm field.
export const PhotoPlate: React.FC<{
  src: string;
  frames: number;
  igniteAt?: number;
  scrim: 'left' | 'right' | 'bottom';
}> = ({src, frames, igniteAt, scrim}) => {
  const frame = useCurrentFrame();
  const push = interpolate(frame, [0, frames], [1, 1.06], clamp);
  const light =
    igniteAt === undefined
      ? interpolate(frame, [0, 14], [0.6, 1], {...clamp, easing: ease})
      : interpolate(frame, [igniteAt, igniteAt + 20], [0.3, 1], {...clamp, easing: ease});
  const shade = 'rgba(15,18,53,';
  const gradient =
    scrim === 'bottom'
      ? `linear-gradient(0deg, ${shade}0.96) 0%, ${shade}0.8) 34%, ${shade}0) 62%)`
      : `linear-gradient(${scrim === 'left' ? 90 : 270}deg, ${shade}0.94) 0%, ${shade}0.72) 36%, ${shade}0) 64%)`;
  return (
    <AbsoluteFill style={{backgroundColor: NIGHT, overflow: 'hidden'}}>
      <Img
        src={staticFile(src)}
        style={{width: '100%', height: '100%', objectFit: 'cover', transform: `scale(${push})`, filter: `brightness(${light})`}}
      />
      <AbsoluteFill style={{background: gradient}} />
    </AbsoluteFill>
  );
};
