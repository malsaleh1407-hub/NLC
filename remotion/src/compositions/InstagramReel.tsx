import React from 'react';
import {AbsoluteFill, interpolate, Sequence, useCurrentFrame, useVideoConfig} from 'remotion';
import {FONT, ORANGE, ORANGE_GLOW, SITE, WHITE} from '../brand';
import {loadBrandFonts} from '../fonts';
import {CinematicOverlay, LightSweep, NavyBackdrop, NightBackdrop} from '../components/Atmosphere';
import {BulbDraw} from '../components/BulbDraw';
import {LogoLockup} from '../components/LogoLockup';
import {ParticleField} from '../components/ParticleField';
import {Skyline} from '../components/Skyline';
import {Spark} from '../components/Spark';
import {TypeReveal} from '../components/TypeReveal';

// 9:16 vertical, 15s — hook fast, cut fast.
const Hook: React.FC = () => (
  <AbsoluteFill>
    <NightBackdrop />
    <ParticleField count={22} opacity={0.45} seed="r1" />
    <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center'}}>
      <Spark x="50%" y="56%" size={26} igniteAt={26} steadyAt={62} />
    </AbsoluteFill>
    <AbsoluteFill style={{justifyContent: 'flex-start', alignItems: 'center', paddingTop: 330}}>
      <TypeReveal text="The Kingdom runs on light." startAt={8} fontSize={92} fontWeight={900} maxWidth="80%" glow />
    </AbsoluteFill>
    <AbsoluteFill style={{justifyContent: 'flex-end', alignItems: 'center', paddingBottom: 320}}>
      <TypeReveal text="We build it." startAt={58} fontSize={72} fontWeight={300} />
    </AbsoluteFill>
  </AbsoluteFill>
);

const Ignite: React.FC = () => (
  <AbsoluteFill>
    <NightBackdrop lift={0.5} />
    <ParticleField count={26} opacity={0.5} seed="r2" />
    <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center'}}>
      <BulbDraw size={430} drawStart={0} drawEnd={46} igniteAt={56} />
    </AbsoluteFill>
    <AbsoluteFill style={{justifyContent: 'flex-end', alignItems: 'center', paddingBottom: 300}}>
      <TypeReveal text="Since 1993." startAt={62} fontSize={68} fontWeight={700} />
    </AbsoluteFill>
  </AbsoluteFill>
);

const City: React.FC = () => {
  const {width, height} = useVideoConfig();
  return (
    <AbsoluteFill>
      <NightBackdrop lift={0.3} />
      <AbsoluteFill style={{justifyContent: 'flex-end'}}>
        <Skyline width={width} height={height * 0.5} igniteAt={10} waveDuration={70} seed="reel-city" />
      </AbsoluteFill>
      <AbsoluteFill style={{justifyContent: 'flex-start', alignItems: 'center', paddingTop: 300}}>
        <TypeReveal text="3,200+ projects." startAt={12} fontSize={96} fontWeight={900} glow />
        <div style={{height: 18}} />
        <TypeReveal
          text="NEOM. King Fahad Causeway. Your city."
          startAt={40}
          fontSize={46}
          fontWeight={400}
          color="rgba(255,255,255,0.85)"
          maxWidth="82%"
        />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

const Outro: React.FC = () => {
  const frame = useCurrentFrame();
  const ctaIn = interpolate(frame, [46, 66], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return (
    <AbsoluteFill>
      <NavyBackdrop />
      <ParticleField count={20} opacity={0.4} seed="r4" />
      <CinematicOverlay vignette={0.5} />
      <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center', paddingBottom: 120}}>
        <LogoLockup startAt={2} scale={0.86} />
      </AbsoluteFill>
      <AbsoluteFill style={{justifyContent: 'flex-end', alignItems: 'center', paddingBottom: 280}}>
        <div
          style={{
            fontFamily: FONT,
            fontWeight: 700,
            fontSize: 44,
            color: WHITE,
            background: `linear-gradient(90deg, ${ORANGE}, ${ORANGE_GLOW})`,
            padding: '20px 66px',
            borderRadius: 999,
            opacity: ctaIn,
            transform: `scale(${0.85 + 0.15 * ctaIn})`,
            boxShadow: '0 0 44px rgba(246,133,31,0.55)',
          }}
        >
          {SITE}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

export const InstagramReel: React.FC = () => {
  loadBrandFonts();
  return (
    <AbsoluteFill style={{backgroundColor: '#000'}}>
      <Sequence from={0} durationInFrames={100}>
        <Hook />
      </Sequence>
      <Sequence from={100} durationInFrames={110}>
        <Ignite />
      </Sequence>
      <Sequence from={210} durationInFrames={120}>
        <City />
      </Sequence>
      <Sequence from={330} durationInFrames={120}>
        <Outro />
      </Sequence>
      {[100, 210, 330].map((at) => (
        <LightSweep key={at} at={at} />
      ))}
      <CinematicOverlay vignette={0.35} />
    </AbsoluteFill>
  );
};
