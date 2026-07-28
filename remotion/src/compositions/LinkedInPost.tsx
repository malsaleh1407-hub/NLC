import React from 'react';
import {AbsoluteFill, interpolate, Sequence, useCurrentFrame} from 'remotion';
import {FONT, ORANGE, ORANGE_GLOW, SITE, TRUST, WHITE} from '../brand';
import {loadBrandFonts} from '../fonts';
import {CinematicOverlay, LightSweep, NavyBackdrop} from '../components/Atmosphere';
import {LightRays} from '../components/LightRays';
import {LogoLockup} from '../components/LogoLockup';
import {LuminaireCard} from '../components/LuminaireIcons';
import {StatCounter} from '../components/StatCounter';
import {TypeReveal} from '../components/TypeReveal';

// 16:9, 20s — the B2B cut: credibility first, portfolio second, partnership close.
const Headline: React.FC = () => {
  const frame = useCurrentFrame();
  const ruleW = interpolate(frame, [30, 60], [0, 220], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return (
    <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center', gap: 40}}>
      <TypeReveal
        text="Lighting Saudi Arabia's giga-projects since 1993."
        startAt={6}
        fontSize={76}
        fontWeight={700}
        maxWidth="74%"
      />
      <div
        style={{
          width: ruleW,
          height: 7,
          borderRadius: 4,
          background: `linear-gradient(90deg, ${ORANGE}, ${ORANGE_GLOW})`,
          boxShadow: '0 0 22px rgba(246,133,31,0.5)',
        }}
      />
      <TypeReveal
        text="LED lighting · Low-current systems · Power & control"
        startAt={48}
        fontSize={36}
        fontWeight={400}
        color="rgba(255,255,255,0.75)"
      />
    </AbsoluteFill>
  );
};

const Numbers: React.FC = () => (
  <AbsoluteFill>
    <AbsoluteFill style={{flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 170}}>
      <StatCounter value={33} label="Years" startAt={4} fontSize={100} />
      <StatCounter value={3200} suffix="+" label="Projects" startAt={12} fontSize={100} />
      <StatCounter value={142} label="Luminaires" startAt={20} fontSize={100} />
    </AbsoluteFill>
    <AbsoluteFill style={{justifyContent: 'flex-end', alignItems: 'center', paddingBottom: 120}}>
      <TypeReveal
        text="From NEOM to King Fahad Causeway — delivered, certified, maintained."
        startAt={44}
        fontSize={36}
        fontWeight={400}
        color="rgba(255,255,255,0.8)"
      />
    </AbsoluteFill>
  </AbsoluteFill>
);

const Portfolio: React.FC = () => (
  <AbsoluteFill>
    <AbsoluteFill style={{justifyContent: 'flex-start', alignItems: 'center', paddingTop: 100}}>
      <TypeReveal text="One partner. The full portfolio." startAt={4} fontSize={58} fontWeight={700} />
    </AbsoluteFill>
    <AbsoluteFill
      style={{flexDirection: 'row', justifyContent: 'center', alignItems: 'flex-end', gap: 84, paddingBottom: 110}}
    >
      <LuminaireCard kind="street" label="Street" badge="IP66" startAt={18} width={290} />
      <LuminaireCard kind="flood" label="Flood" badge="IK08" startAt={28} width={290} />
      <LuminaireCard kind="highbay" label="High Bay" badge="150 lm/W" startAt={38} width={290} />
      <LuminaireCard kind="linear" label="Linear" badge="CRI 80+" startAt={48} width={290} />
    </AbsoluteFill>
  </AbsoluteFill>
);

const Close: React.FC = () => {
  const frame = useCurrentFrame();
  const ctaIn = interpolate(frame, [50, 70], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return (
    <AbsoluteFill>
      <LightRays cx={50} cy={42} radius={85} opacity={0.35} speed={0.08} />
      <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center', paddingBottom: 140}}>
        <LogoLockup startAt={2} height={165} />
        <div
          style={{
            marginTop: 40,
            fontFamily: FONT,
            fontWeight: 400,
            fontSize: 38,
            color: 'rgba(255,255,255,0.9)',
            opacity: ctaIn,
          }}
        >
          Let's build what's next.
        </div>
      </AbsoluteFill>
      <AbsoluteFill style={{justifyContent: 'flex-end', alignItems: 'center', paddingBottom: 80}}>
        <div
          style={{
            fontFamily: FONT,
            fontWeight: 300,
            fontSize: 25,
            letterSpacing: '0.12em',
            color: 'rgba(255,255,255,0.55)',
            opacity: ctaIn,
            marginBottom: 22,
          }}
        >
          {TRUST}
        </div>
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
    </AbsoluteFill>
  );
};

export const LinkedInPost: React.FC = () => {
  loadBrandFonts();
  return (
    <AbsoluteFill style={{backgroundColor: '#000'}}>
      <NavyBackdrop />
      <Sequence from={0} durationInFrames={140}>
        <Headline />
      </Sequence>
      <Sequence from={140} durationInFrames={180}>
        <Numbers />
      </Sequence>
      <Sequence from={320} durationInFrames={150}>
        <Portfolio />
      </Sequence>
      <Sequence from={470} durationInFrames={130}>
        <Close />
      </Sequence>
      {[140, 320, 470].map((at) => (
        <LightSweep key={at} at={at} />
      ))}
      <CinematicOverlay vignette={0.4} />
    </AbsoluteFill>
  );
};
