import React from 'react';
import {AbsoluteFill, Easing, interpolate, Sequence, useCurrentFrame, useVideoConfig} from 'remotion';
import {FONT, ORANGE, ORANGE_GLOW, SITE, TAGLINE_BOTTOM, TAGLINE_TOP, TRUST, WHITE} from '../brand';
import {loadBrandFonts} from '../fonts';
import {CinematicOverlay, LightSweep, NavyBackdrop, NightBackdrop} from '../components/Atmosphere';
import {BulbDraw} from '../components/BulbDraw';
import {LightRays} from '../components/LightRays';
import {LogoLockup} from '../components/LogoLockup';
import {LuminaireCard} from '../components/LuminaireIcons';
import {ParticleField} from '../components/ParticleField';
import {Skyline} from '../components/Skyline';
import {Spark} from '../components/Spark';
import {StatCounter} from '../components/StatCounter';
import {TypeReveal} from '../components/TypeReveal';

// ————— Scene 1: darkness, then a single spark —————
const SceneSpark: React.FC = () => {
  const frame = useCurrentFrame();
  const dim = interpolate(frame, [0, 30], [0, 1], {extrapolateRight: 'clamp'});
  return (
    <AbsoluteFill>
      <NightBackdrop />
      <ParticleField count={26} opacity={0.4 * dim} seed="s1" />
      <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center'}}>
        <Spark x="50%" y="52%" size={30} igniteAt={55} steadyAt={100} />
      </AbsoluteFill>
      <AbsoluteFill style={{justifyContent: 'flex-start', alignItems: 'center', paddingTop: 200}}>
        <TypeReveal text="Every city begins in the dark." startAt={14} fontSize={72} fontWeight={300} />
      </AbsoluteFill>
      <AbsoluteFill style={{justifyContent: 'flex-end', alignItems: 'center', paddingBottom: 190}}>
        <TypeReveal text="Then someone builds the light." startAt={100} fontSize={72} fontWeight={700} glow />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ————— Scene 2: the bulb draws itself and ignites —————
const SceneBulb: React.FC = () => {
  const frame = useCurrentFrame();
  const zoom = interpolate(frame, [0, 150], [1, 1.06], {easing: Easing.inOut(Easing.quad)});
  return (
    <AbsoluteFill>
      <NightBackdrop lift={0.5} />
      <ParticleField count={30} opacity={0.5} seed="s2" />
      <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center', transform: `scale(${zoom})`}}>
        <BulbDraw size={420} drawStart={0} drawEnd={62} igniteAt={74} />
      </AbsoluteFill>
      <AbsoluteFill style={{justifyContent: 'flex-end', alignItems: 'center', paddingBottom: 130}}>
        <TypeReveal text="Since 1993, that has been us." startAt={84} fontSize={64} fontWeight={600} />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ————— Scene 3: the portfolio, each fixture casting real light —————
const SceneProducts: React.FC = () => {
  return (
    <AbsoluteFill>
      <NavyBackdrop />
      <CinematicOverlay vignette={0.4} />
      <AbsoluteFill style={{justifyContent: 'flex-start', alignItems: 'center', paddingTop: 110}}>
        <TypeReveal
          text="142 luminaires. Engineered for the Kingdom's climate."
          startAt={4}
          fontSize={58}
          fontWeight={700}
        />
      </AbsoluteFill>
      <AbsoluteFill
        style={{
          flexDirection: 'row',
          justifyContent: 'center',
          alignItems: 'flex-end',
          gap: 90,
          paddingBottom: 120,
        }}
      >
        <LuminaireCard kind="street" label="Street" badge="IP66" startAt={26} />
        <LuminaireCard kind="flood" label="Flood" badge="IK08" startAt={40} />
        <LuminaireCard kind="highbay" label="High Bay" badge="150 lm/W" startAt={54} />
        <LuminaireCard kind="linear" label="Linear" badge="CRI 80+" startAt={68} />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ————— Scene 4: the Kingdom lights up —————
const SceneSkyline: React.FC = () => {
  const {width, height} = useVideoConfig();
  const frame = useCurrentFrame();
  const rise = interpolate(frame, [0, 25], [60, 0], {extrapolateRight: 'clamp'});
  return (
    <AbsoluteFill>
      <NightBackdrop lift={0.3} />
      <ParticleField count={20} opacity={0.35} seed="s4" />
      <AbsoluteFill style={{justifyContent: 'flex-end', transform: `translateY(${rise}px)`}}>
        <Skyline width={width} height={height * 0.72} igniteAt={22} waveDuration={95} />
      </AbsoluteFill>
      <AbsoluteFill style={{justifyContent: 'flex-start', alignItems: 'center', paddingTop: 120}}>
        <TypeReveal text="3,200+ projects across Saudi Arabia." startAt={30} fontSize={62} fontWeight={700} glow />
        <div style={{height: 22}} />
        <TypeReveal
          text="From NEOM to King Fahad Causeway."
          startAt={70}
          fontSize={40}
          fontWeight={400}
          color="rgba(255,255,255,0.8)"
        />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ————— Scene 5: the numbers —————
const SceneStats: React.FC = () => (
  <AbsoluteFill>
    <NavyBackdrop />
    <LightRays cx={50} cy={50} radius={80} opacity={0.5} speed={0.1} />
    <CinematicOverlay vignette={0.45} />
    <AbsoluteFill
      style={{flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 190}}
    >
      <StatCounter value={33} label="Years" startAt={6} />
      <StatCounter value={3200} suffix="+" label="Projects" startAt={16} />
      <StatCounter value={142} label="Luminaires" startAt={26} />
    </AbsoluteFill>
  </AbsoluteFill>
);

// ————— Scene 6: logo finale —————
const SceneFinale: React.FC = () => {
  const frame = useCurrentFrame();
  const ctaIn = interpolate(frame, [62, 82], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const trustIn = interpolate(frame, [76, 96], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return (
    <AbsoluteFill>
      <NavyBackdrop />
      <LightRays cx={50} cy={44} radius={90} opacity={0.4} speed={0.08} />
      <ParticleField count={24} opacity={0.4} seed="s6" />
      <CinematicOverlay vignette={0.5} />
      <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center', paddingBottom: 150}}>
        <LogoLockup startAt={4} height={200} />
        <div
          style={{
            marginTop: 46,
            fontFamily: FONT,
            fontWeight: 400,
            fontSize: 40,
            color: 'rgba(255,255,255,0.9)',
            opacity: ctaIn,
            transform: `translateY(${(1 - ctaIn) * 16}px)`,
            textAlign: 'center',
          }}
        >
          {TAGLINE_TOP} <span style={{color: ORANGE_GLOW, fontWeight: 700}}>{TAGLINE_BOTTOM}</span>
        </div>
      </AbsoluteFill>
      <AbsoluteFill style={{justifyContent: 'flex-end', alignItems: 'center', paddingBottom: 96}}>
        <div
          style={{
            fontFamily: FONT,
            fontWeight: 300,
            fontSize: 28,
            letterSpacing: '0.14em',
            color: 'rgba(255,255,255,0.6)',
            opacity: trustIn,
            marginBottom: 26,
          }}
        >
          {TRUST}
        </div>
        <div
          style={{
            fontFamily: FONT,
            fontWeight: 700,
            fontSize: 36,
            color: WHITE,
            background: `linear-gradient(90deg, ${ORANGE}, ${ORANGE_GLOW})`,
            padding: '16px 54px',
            borderRadius: 999,
            opacity: trustIn,
            transform: `scale(${0.85 + 0.15 * trustIn})`,
            boxShadow: '0 0 40px rgba(246,133,31,0.5)',
          }}
        >
          {SITE}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ————— Master timeline —————
export const YouTubeCommercial: React.FC = () => {
  loadBrandFonts();
  return (
    <AbsoluteFill style={{backgroundColor: '#000'}}>
      <Sequence from={0} durationInFrames={150}>
        <SceneSpark />
      </Sequence>
      <Sequence from={150} durationInFrames={150}>
        <SceneBulb />
      </Sequence>
      <Sequence from={300} durationInFrames={180}>
        <SceneProducts />
      </Sequence>
      <Sequence from={480} durationInFrames={180}>
        <SceneSkyline />
      </Sequence>
      <Sequence from={660} durationInFrames={120}>
        <SceneStats />
      </Sequence>
      <Sequence from={780} durationInFrames={120}>
        <SceneFinale />
      </Sequence>
      {/* Warm light-flash transitions at every cut */}
      {[150, 300, 480, 660, 780].map((at) => (
        <LightSweep key={at} at={at} />
      ))}
      <CinematicOverlay vignette={0.35} />
    </AbsoluteFill>
  );
};
