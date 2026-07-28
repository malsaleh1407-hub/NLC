import React from 'react';
import {interpolate, useCurrentFrame} from 'remotion';
import {FONT, WHITE} from '../brand';
import {NLCLogo} from './NLCLogo';

// Outro lockup: the master logo revealed by a light wipe, with an optional
// supporting line beneath it.
//
// The logo itself is never restyled — no glow, no recolour, no re-typesetting,
// no opacity below 100%. Any supporting text is separate from the lockup and
// sits outside its clear space.
export const LogoLockup: React.FC<{
  height?: number;
  startAt?: number;
  showSubtitle?: boolean;
  subtitle?: string;
}> = ({height = 190, startAt = 0, showSubtitle = true, subtitle}) => {
  const frame = useCurrentFrame();
  const f = Math.max(0, frame - startAt);

  const subIn = interpolate(f, [30, 52], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
      <NLCLogo height={height} variant="reversed" revealAt={startAt} revealFrames={30} />
      {showSubtitle && subtitle ? (
        <div
          style={{
            fontFamily: FONT,
            fontWeight: 400,
            fontSize: height * 0.2,
            marginTop: height * 0.22,
            color: WHITE,
            opacity: subIn,
            transform: `translateY(${(1 - subIn) * 14}px)`,
            textAlign: 'center',
          }}
        >
          {subtitle}
        </div>
      ) : null}
    </div>
  );
};
