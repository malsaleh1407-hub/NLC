import React from 'react';
import {AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {FONT, ORANGE, ORANGE_GLOW, SITE, WHITE} from '../brand';
import {loadBrandFonts} from '../fonts';
import {CinematicOverlay, NavyBackdrop} from '../components/Atmosphere';
import {Fixture, type Kind} from '../components/LuminaireIcons';
import {beamAngle, Photometric, type Profile} from '../components/Photometric';
import {ParticleField} from '../components/ParticleField';
import {TypeReveal} from '../components/TypeReveal';

// One 8-second spot per catalogue product, rendered from data.
// The hero visual is the product's light-distribution curve — the thing that
// actually differentiates a luminaire — rather than a stock beauty shot.
//
// `specs` is intentionally empty by default: real wattage/lumen figures must
// come from the product datasheet, never from this template.

export type ProductSpotProps = {
  label: string;
  catLabel: string;
  profile: Profile;
  icon: Kind;
  specs: Array<{k: string; v: string}>;
};

export const productSpotDefaults: ProductSpotProps = {
  label: 'COMET',
  catLabel: 'Street Light',
  profile: 'asymmetric',
  icon: 'street',
  specs: [],
};

export const ProductSpot: React.FC<ProductSpotProps> = ({label, catLabel, profile, icon, specs}) => {
  loadBrandFonts();
  const frame = useCurrentFrame();
  const {fps, width} = useVideoConfig();

  const catIn = interpolate(frame, [4, 18], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const iconLit = interpolate(frame, [22, 34], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const beam = beamAngle(profile);
  const badgePop = spring({frame: Math.max(0, frame - 118), fps, config: {damping: 12, stiffness: 120}});
  const ctaIn = interpolate(frame, [188, 206], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const footIn = interpolate(frame, [150, 172], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});

  return (
    <AbsoluteFill style={{backgroundColor: '#000'}}>
      <NavyBackdrop />
      <ParticleField count={16} opacity={0.3} seed={`ps-${label}`} />

      {/* Header: category + product name */}
      <AbsoluteFill style={{alignItems: 'center', paddingTop: 92}}>
        <div
          style={{
            fontFamily: FONT,
            fontWeight: 600,
            fontSize: 26,
            letterSpacing: '0.36em',
            paddingLeft: '0.36em',
            color: ORANGE_GLOW,
            textTransform: 'uppercase',
            opacity: catIn,
            transform: `translateY(${(1 - catIn) * 12}px)`,
          }}
        >
          {catLabel}
        </div>
        <div style={{height: 14}} />
        <TypeReveal text={label} startAt={12} fontSize={96} fontWeight={900} letterSpacing="0.01em" glow />
      </AbsoluteFill>

      {/* Fixture silhouette feeding the distribution below it */}
      <AbsoluteFill style={{alignItems: 'center', justifyContent: 'flex-start', paddingTop: 258}}>
        <div style={{width: 132, height: 148, opacity: interpolate(frame, [16, 30], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})}}>
          <Fixture kind={icon} lit={iconLit} />
        </div>
      </AbsoluteFill>

      {/* Photometric distribution — the hero */}
      <AbsoluteFill style={{alignItems: 'center', justifyContent: 'flex-start', paddingTop: 400}}>
        <Photometric profile={profile} size={width * 0.58} startAt={34} drawFrames={56} />
      </AbsoluteFill>

      {/* Derived beam-angle badge */}
      <AbsoluteFill style={{alignItems: 'center', justifyContent: 'flex-start', paddingTop: 1040}}>
        <div
          style={{
            display: 'flex',
            alignItems: 'baseline',
            gap: 14,
            border: `3px solid ${ORANGE}`,
            borderRadius: 999,
            padding: '14px 40px',
            opacity: badgePop,
            transform: `scale(${0.7 + 0.3 * badgePop})`,
            boxShadow: `0 0 ${26 * badgePop}px rgba(246,133,31,0.4)`,
          }}
        >
          <span style={{fontFamily: FONT, fontWeight: 900, fontSize: 46, color: WHITE}}>{beam}°</span>
          <span
            style={{
              fontFamily: FONT,
              fontWeight: 600,
              fontSize: 22,
              letterSpacing: '0.16em',
              color: ORANGE_GLOW,
              textTransform: 'uppercase',
            }}
          >
            Beam
          </span>
        </div>

        {specs.length > 0 ? (
          <div style={{display: 'flex', gap: 16, marginTop: 26, flexWrap: 'wrap', justifyContent: 'center'}}>
            {specs.map((s, i) => {
              const p = interpolate(frame, [130 + i * 8, 146 + i * 8], [0, 1], {
                extrapolateLeft: 'clamp',
                extrapolateRight: 'clamp',
              });
              return (
                <div
                  key={s.k}
                  style={{
                    fontFamily: FONT,
                    fontSize: 24,
                    color: 'rgba(255,255,255,0.9)',
                    background: 'rgba(255,255,255,0.07)',
                    border: '1px solid rgba(255,255,255,0.16)',
                    borderRadius: 12,
                    padding: '10px 20px',
                    opacity: p,
                    transform: `translateY(${(1 - p) * 14}px)`,
                  }}
                >
                  <span style={{fontWeight: 300, opacity: 0.7}}>{s.k} </span>
                  <span style={{fontWeight: 700}}>{s.v}</span>
                </div>
              );
            })}
          </div>
        ) : null}
      </AbsoluteFill>

      {/* Honest footnote + CTA to the real datasheet */}
      <AbsoluteFill style={{alignItems: 'center', justifyContent: 'flex-end', paddingBottom: 74}}>
        <div
          style={{
            fontFamily: FONT,
            fontWeight: 300,
            fontSize: 19,
            letterSpacing: '0.08em',
            color: 'rgba(255,255,255,0.45)',
            opacity: footIn,
            marginBottom: 22,
          }}
        >
          Typical distribution — full photometric data in the datasheet
        </div>
        <div style={{display: 'flex', alignItems: 'center', gap: 18, opacity: ctaIn}}>
          <div style={{fontFamily: FONT, fontWeight: 900, fontSize: 44, color: WHITE, lineHeight: 1}}>
            N<span style={{color: ORANGE}}>L</span>C
          </div>
          <div style={{width: 2, height: 34, background: 'rgba(255,255,255,0.25)'}} />
          <div style={{fontFamily: FONT, fontWeight: 600, fontSize: 30, color: ORANGE_GLOW}}>{SITE}</div>
        </div>
      </AbsoluteFill>

      <CinematicOverlay vignette={0.45} />
    </AbsoluteFill>
  );
};
