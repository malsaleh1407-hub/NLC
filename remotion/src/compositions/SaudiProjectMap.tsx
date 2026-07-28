import React from 'react';
import {AbsoluteFill, interpolate, Sequence, useCurrentFrame, useVideoConfig} from 'remotion';
import {FONT, ORANGE, ORANGE_GLOW, SITE, WHITE} from '../brand';
import {loadBrandFonts} from '../fonts';
import {CinematicOverlay, LightSweep, NavyBackdrop} from '../components/Atmosphere';
import {LogoLockup} from '../components/LogoLockup';
import {ParticleField} from '../components/ParticleField';
import {SaudiMap} from '../components/SaudiMap';
import {StatCounter} from '../components/StatCounter';
import {TypeReveal} from '../components/TypeReveal';

// "We put the light on this map." — the geographic proof film.
// The Kingdom's outline draws itself, then every city where NLC has delivered
// ignites in sequence, west coast to east coast.

const MapScene: React.FC = () => {
  const frame = useCurrentFrame();
  const {height} = useVideoConfig();

  const titleOut = interpolate(frame, [0, 20], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const counterIn = interpolate(frame, [150, 170], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});

  return (
    <AbsoluteFill>
      <NavyBackdrop />
      <ParticleField count={22} opacity={0.3} seed="map" />

      <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center'}}>
        <SaudiMap size={height * 0.92} drawStart={6} drawFrames={58} igniteStart={56} />
      </AbsoluteFill>

      {/* Left rail: headline */}
      <AbsoluteFill style={{alignItems: 'flex-start', justifyContent: 'center', paddingLeft: 96}}>
        <div style={{maxWidth: 520, opacity: titleOut}}>
          <TypeReveal
            text="We put the light on this map."
            startAt={6}
            fontSize={68}
            fontWeight={900}
            align="left"
            maxWidth={520}
            glow
          />
          <div style={{height: 26}} />
          <TypeReveal
            text="Cities, causeways, giga-projects and industrial sites — lit by NLC since 1993."
            startAt={40}
            fontSize={30}
            fontWeight={400}
            align="left"
            maxWidth={500}
            color="rgba(255,255,255,0.72)"
          />
        </div>
      </AbsoluteFill>

      {/* Right rail: running project counter */}
      <AbsoluteFill style={{alignItems: 'flex-end', justifyContent: 'center', paddingRight: 110}}>
        <div style={{opacity: counterIn}}>
          <StatCounter value={3200} suffix="+" label="Projects delivered" startAt={152} fontSize={96} />
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

const MapOutro: React.FC = () => {
  const frame = useCurrentFrame();
  const ctaIn = interpolate(frame, [44, 64], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return (
    <AbsoluteFill>
      <NavyBackdrop />
      <ParticleField count={18} opacity={0.35} seed="mapout" />
      <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center', paddingBottom: 90}}>
        <LogoLockup startAt={2} height={170} />
        <div
          style={{
            marginTop: 42,
            fontFamily: FONT,
            fontWeight: 400,
            fontSize: 36,
            color: 'rgba(255,255,255,0.9)',
            opacity: ctaIn,
          }}
        >
          Wherever the Kingdom builds next — we'll light it.
        </div>
      </AbsoluteFill>
      <AbsoluteFill style={{alignItems: 'center', justifyContent: 'flex-end', paddingBottom: 90}}>
        <div
          style={{
            fontFamily: FONT,
            fontWeight: 700,
            fontSize: 32,
            color: WHITE,
            background: `linear-gradient(90deg, ${ORANGE}, ${ORANGE_GLOW})`,
            padding: '14px 48px',
            borderRadius: 999,
            opacity: ctaIn,
            boxShadow: '0 0 36px rgba(246,133,31,0.5)',
          }}
        >
          {SITE}
        </div>
      </AbsoluteFill>
      <CinematicOverlay vignette={0.45} />
    </AbsoluteFill>
  );
};

export const SaudiProjectMap: React.FC = () => {
  loadBrandFonts();
  return (
    <AbsoluteFill style={{backgroundColor: '#000'}}>
      <Sequence from={0} durationInFrames={420}>
        <MapScene />
      </Sequence>
      <Sequence from={420} durationInFrames={120}>
        <MapOutro />
      </Sequence>
      <LightSweep at={420} />
      <CinematicOverlay vignette={0.35} />
    </AbsoluteFill>
  );
};
