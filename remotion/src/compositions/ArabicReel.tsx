import React from 'react';
import {AbsoluteFill, interpolate, Sequence, useCurrentFrame, useVideoConfig} from 'remotion';
import {ORANGE, ORANGE_GLOW, SITE, WHITE} from '../brand';
import {loadBrandFonts} from '../fonts';
import {CinematicOverlay, LightSweep, NavyBackdrop, NightBackdrop} from '../components/Atmosphere';
import {BulbDraw} from '../components/BulbDraw';
import {ParticleField} from '../components/ParticleField';
import {Skyline} from '../components/Skyline';
import {Spark} from '../components/Spark';
import {NLCLogo} from '../components/NLCLogo';
import {TypeReveal} from '../components/TypeReveal';

// النسخة العربية — vertical Arabic reel, RTL, Cairo typeface.
// Copy uses NLC's own Arabic naming from the website (شركة الإنارة الوطنية,
// اطلب عرض سعر) so the video matches the live site's voice.

const AR = "'Cairo', 'Outfit', sans-serif";

const Hook: React.FC = () => (
  <AbsoluteFill>
    <NightBackdrop />
    <ParticleField count={22} opacity={0.45} seed="ar1" />
    <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center'}}>
      <Spark x="50%" y="56%" size={26} igniteAt={26} steadyAt={62} />
    </AbsoluteFill>
    <AbsoluteFill style={{justifyContent: 'flex-start', alignItems: 'center', paddingTop: 330}}>
      <TypeReveal
        text="كل مدينة تبدأ في الظلام"
        startAt={8}
        fontSize={86}
        fontWeight={900}
        maxWidth="82%"
        rtl
        fontFamily={AR}
        glow
      />
    </AbsoluteFill>
    <AbsoluteFill style={{justifyContent: 'flex-end', alignItems: 'center', paddingBottom: 320}}>
      <TypeReveal
        text="ثم يأتي من يصنع النور"
        startAt={58}
        fontSize={68}
        fontWeight={400}
        maxWidth="82%"
        rtl
        fontFamily={AR}
      />
    </AbsoluteFill>
  </AbsoluteFill>
);

const Ignite: React.FC = () => (
  <AbsoluteFill>
    <NightBackdrop lift={0.5} />
    <ParticleField count={26} opacity={0.5} seed="ar2" />
    <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center'}}>
      <BulbDraw size={430} drawStart={0} drawEnd={46} igniteAt={56} />
    </AbsoluteFill>
    <AbsoluteFill style={{justifyContent: 'flex-end', alignItems: 'center', paddingBottom: 300}}>
      <TypeReveal
        text="منذ عام 1993"
        startAt={62}
        fontSize={72}
        fontWeight={700}
        rtl
        fontFamily={AR}
      />
    </AbsoluteFill>
  </AbsoluteFill>
);

const City: React.FC = () => {
  const {width, height} = useVideoConfig();
  return (
    <AbsoluteFill>
      <NightBackdrop lift={0.3} />
      <AbsoluteFill style={{justifyContent: 'flex-end'}}>
        <Skyline width={width} height={height * 0.5} igniteAt={10} waveDuration={70} seed="ar-city" />
      </AbsoluteFill>
      <AbsoluteFill style={{justifyContent: 'flex-start', alignItems: 'center', paddingTop: 300}}>
        <TypeReveal
          text="أكثر من 3,200 مشروع"
          startAt={12}
          fontSize={92}
          fontWeight={900}
          rtl
          fontFamily={AR}
          glow
        />
        <div style={{height: 26}} />
        <TypeReveal
          text="من نيوم إلى جسر الملك فهد"
          startAt={40}
          fontSize={46}
          fontWeight={400}
          color="rgba(255,255,255,0.85)"
          maxWidth="84%"
          rtl
          fontFamily={AR}
        />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

const Outro: React.FC = () => {
  const frame = useCurrentFrame();
  const pop = interpolate(frame, [4, 24], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const sweep = interpolate(frame, [14, 44], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const ctaIn = interpolate(frame, [50, 70], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});

  return (
    <AbsoluteFill>
      <NavyBackdrop />
      <ParticleField count={20} opacity={0.4} seed="ar4" />
      <CinematicOverlay vignette={0.5} />
      <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center', paddingBottom: 150}}>
        <NLCLogo height={180} variant="reversed" showDescriptor={false} revealAt={4} revealFrames={28} />
        <div
          style={{
            fontFamily: AR,
            fontWeight: 700,
            fontSize: 52,
            marginTop: 34,
            color: 'rgba(255,255,255,0.95)',
            direction: 'rtl',
            opacity: sweep,
          }}
        >
          شركة الإنارة الوطنية
        </div>
        <div
          style={{
            fontFamily: AR,
            fontWeight: 400,
            fontSize: 36,
            marginTop: 18,
            color: ORANGE_GLOW,
            direction: 'rtl',
            opacity: sweep,
            textAlign: 'center',
          }}
        >
          هندسة النور والطاقة والأنظمة
        </div>
      </AbsoluteFill>

      <AbsoluteFill style={{justifyContent: 'flex-end', alignItems: 'center', paddingBottom: 260}}>
        <div
          style={{
            fontFamily: AR,
            fontWeight: 400,
            fontSize: 30,
            color: 'rgba(255,255,255,0.6)',
            direction: 'rtl',
            opacity: ctaIn,
            marginBottom: 26,
          }}
        >
          صناعة سعودية · معتمدة عالمياً
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 22,
            opacity: ctaIn,
            transform: `scale(${0.88 + 0.12 * ctaIn})`,
          }}
        >
          <div
            style={{
              fontFamily: AR,
              fontWeight: 700,
              fontSize: 40,
              color: WHITE,
              background: `linear-gradient(90deg, ${ORANGE}, ${ORANGE_GLOW})`,
              padding: '18px 52px',
              borderRadius: 999,
              direction: 'rtl',
              boxShadow: '0 0 44px rgba(246,133,31,0.55)',
            }}
          >
            اطلب عرض سعر
          </div>
        </div>
        <div
          style={{
            fontFamily: "'Outfit', sans-serif",
            fontWeight: 600,
            fontSize: 32,
            marginTop: 26,
            color: 'rgba(255,255,255,0.75)',
            opacity: ctaIn,
          }}
        >
          {SITE}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

export const ArabicReel: React.FC = () => {
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
      <Sequence from={330} durationInFrames={140}>
        <Outro />
      </Sequence>
      {[100, 210, 330].map((at) => (
        <LightSweep key={at} at={at} />
      ))}
      <CinematicOverlay vignette={0.35} />
    </AbsoluteFill>
  );
};
