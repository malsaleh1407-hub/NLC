import React from 'react';
import {Easing, interpolate, useCurrentFrame} from 'remotion';

// THE NLC LOGO — reproduced from the master SVG in NLC-Brand-Guidelines-source.html.
//
// Brand rule (Section 02, Misuse): "The logo files are the source of truth.
// Never reconstruct, restyle, or recolor by hand - pull from the master SVG
// every time." The mark below is that exact path, untouched.
//
// The eight don'ts this component is built to respect:
//   rotate | stretch | recolor | low-contrast placement | busy patterns |
//   re-setting the wordmark in another typeface | shadows or effects |
//   fading below 100 percent opacity
//
// The entrance is therefore a CLIP WIPE, not a fade: the logo is always drawn
// at full opacity and full colour, and light reveals it.

// Master mark path - do not edit.
const MARK_PATH =
  'M37.6363 30.6709V35.1239L27.2574 25.0325C26.6924 24.4601 26.2386 23.802 25.9139 23.0764C25.5891 22.3553 25.3934 21.5981 25.3355 20.8273C25.3044 20.4983 25.2911 20.1558 25.2911 19.7862C25.2911 18.8397 25.3934 17.8797 25.5936 16.9287L25.687 16.496L25.2599 16.5952C24.0009 16.8791 22.7108 16.9648 21.4162 16.8566C20.5487 16.7935 19.7079 16.5501 18.9116 16.1354L18.8493 16.1084C18.271 15.7974 17.7416 15.3963 17.27 14.914L12.3319 9.85704V9.82549L10.5124 7.96406L2.67369 0.0135213H7.38045C7.5584 0.0135213 7.7319 0.085635 7.86092 0.216341L21.9412 14.5805L21.9278 0.0135213L25.3622 0V14.3867L37.5518 2.0282V6.81925C37.5518 7.00404 37.4806 7.17531 37.356 7.30602L27.8402 16.9512L37.5117 16.9377V20.5344H27.8268L37.4361 30.1841C37.5651 30.3148 37.6363 30.4906 37.6363 30.6709Z';

// Official variants (Section 02, Variations)
//   A. Primary   - light backgrounds
//   B. Reversed  - navy & photography
//   C. Mark only - favicons, avatars, badges
//   white        - all-white lockup, as used in the site footer
export type LogoVariant = 'primary' | 'reversed' | 'white' | 'mark';

const MARK_ORANGE = '#F4831F'; // as it appears in the master artwork
const NAVY = '#24285E';

const colorsFor = (v: LogoVariant) => {
  switch (v) {
    case 'primary':
      return {mark: MARK_ORANGE, text: NAVY};
    case 'reversed':
      return {mark: MARK_ORANGE, text: '#ffffff'};
    case 'white':
      return {mark: '#ffffff', text: '#ffffff'};
    case 'mark':
      return {mark: MARK_ORANGE, text: 'transparent'};
  }
};

// The wordmark is set in Bizmo. Drop the Bizmo .woff2 files into
// public/fonts/ (see public/fonts/README.md) for a pixel-exact lockup;
// without them the browser falls back and the wordmark is NOT final.
const WORDMARK_FONT = "'Bizmo', 'Outfit', sans-serif";

export const NLCLogo: React.FC<{
  /** Rendered height in px. Digital minimum is 36px for the lockup, 24px mark-only. */
  height: number;
  variant?: LogoVariant;
  /** Frame at which the light-wipe reveal begins. Omit for a static logo. */
  revealAt?: number;
  revealFrames?: number;
  showDescriptor?: boolean;
}> = ({height, variant = 'reversed', revealAt, revealFrames = 26, showDescriptor = true}) => {
  const frame = useCurrentFrame();
  const {mark, text} = colorsFor(variant);
  const markOnly = variant === 'mark';

  // Lockup artboard is 106x39; the mark alone occupies 0..38.
  const vbW = markOnly ? 38 : 106;
  const vbH = 39;
  const width = (height * vbW) / vbH;

  const wipe =
    revealAt === undefined
      ? 1
      : interpolate(frame, [revealAt, revealAt + revealFrames], [0, 1], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
          easing: Easing.inOut(Easing.cubic),
        });

  const clipId = `nlc-wipe-${variant}-${Math.round(height)}`;

  return (
    <svg
      viewBox={`0 0 ${vbW} ${vbH}`}
      width={width}
      height={height}
      xmlns="http://www.w3.org/2000/svg"
      // Clear space (Section 02): at minimum the height of the "N" stem on every side.
      style={{display: 'block', overflow: 'visible', padding: height * 0.22}}
    >
      <defs>
        <clipPath id={clipId}>
          {/* Extends past the artboard so a fully-revealed lockup is never
              clipped, while still wiping left-to-right. */}
          <rect x={-8} y={-8} width={(vbW + 52) * wipe} height={vbH + 16} />
        </clipPath>
      </defs>
      <g clipPath={`url(#${clipId})`}>
        <path d={MARK_PATH} fill={mark} />
        {markOnly ? null : (
          <>
            <text x={48} y={26} fontFamily={WORDMARK_FONT} fontWeight={900} fontSize={22} fill={text}>
              NLC
            </text>
            {showDescriptor ? (
              <text
                x={48}
                y={35}
                fontFamily={WORDMARK_FONT}
                fontWeight={500}
                fontSize={5}
                letterSpacing={0.5}
                fill={text}
              >
                NATIONAL LIGHTING CO.
              </text>
            ) : null}
          </>
        )}
      </g>
    </svg>
  );
};
