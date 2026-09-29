import React from 'react';
import {AbsoluteFill, Easing, interpolate, Sequence, useCurrentFrame, useVideoConfig} from 'remotion';
import {AR_FONT, BRAND_EASE, FONT, NIGHT, ORANGE, ORANGE_GLOW, SITE, WHITE} from '../brand';
import {loadBrandFonts} from '../fonts';
import {CinematicOverlay, LightSweep, NavyBackdrop, NightBackdrop} from '../components/Atmosphere';
import {SingleBeam, WallWash} from '../components/Downlight';
import {Eyebrow} from '../components/Eyebrow';
import {LightRays} from '../components/LightRays';
import {NLCLogo} from '../components/NLCLogo';
import {ParticleField} from '../components/ParticleField';
import {Photometric} from '../components/Photometric';
import {ProductHero} from '../components/ProductHero';
import {SpecSheet} from '../components/SpecSheet';
import {TypeReveal} from '../components/TypeReveal';
import type {CommercialProps} from '../data/commercials';
import {copyFor, type CommercialCopy} from '../data/commercialCopy';

// ProductCommercial — a 25-second datasheet commercial for one luminaire.
//
//   0.0s  Hook        one aperture switches on; the beam finds the floor
//   4.0s  Reveal      the product, wiped in by light; category · name
//   9.0s  Datasheet   the real spec rows — or, until they are supplied, a
//                     labelled *typical* distribution (never invented numbers)
//  16.0s  Application downlights along a wall switch on in a wave — scallops + pools
//  21.0s  CTA         master logo, "Download the {NAME} datasheet", nlc.com.sa
//
// One layout engine serves 16:9 and 9:16 (it reads the composition size) and
// English or Arabic (`lang`), so every format is cut from the same timeline.

export const COMMERCIAL_FPS = 30;
export const COMMERCIAL_FRAMES = 750;

const SCENES = {
  hook: [0, 120],
  reveal: [120, 270],
  sheet: [270, 480],
  app: [480, 630],
  cta: [630, 750],
} as const;

const ease = Easing.bezier(...BRAND_EASE);
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

type Ctx = CommercialProps & {
  copy: CommercialCopy;
  rtl: boolean;
  font: string;
  portrait: boolean;
  W: number;
  H: number;
};

const useFadeUp = (startAt: number, frames = 16) => {
  const frame = useCurrentFrame();
  return interpolate(frame, [startAt, startAt + frames], [0, 1], {...clamp, easing: ease});
};

const Sub: React.FC<{ctx: Ctx; text: string; startAt: number; fontSize: number; maxWidth: number; align: 'center' | 'start'}> = ({
  ctx,
  text,
  startAt,
  fontSize,
  maxWidth,
  align,
}) => {
  const p = useFadeUp(startAt);
  return (
    <div
      style={{
        fontFamily: ctx.font,
        fontWeight: 400,
        fontSize,
        lineHeight: ctx.rtl ? 1.8 : 1.5,
        color: 'rgba(255,255,255,0.78)',
        maxWidth,
        textAlign: align === 'center' ? 'center' : ctx.rtl ? 'right' : 'left',
        direction: ctx.rtl ? 'rtl' : 'ltr',
        opacity: p,
        transform: `translateY(${(1 - p) * 14}px)`,
      }}
    >
      {text}
    </div>
  );
};

// ————— 1 · Hook —————
const Hook: React.FC<{ctx: Ctx}> = ({ctx}) => {
  const hook = (ctx.rtl ? ctx.hookAr : ctx.hook) ?? ctx.copy.hook;
  const beamX = ctx.portrait ? 0.5 : ctx.rtl ? 0.3 : 0.7;
  return (
    <AbsoluteFill>
      <NightBackdrop />
      <ParticleField count={14} opacity={0.3} seed={`ch-${ctx.key}`} />
      <SingleBeam x={beamX} igniteAt={18} />
      {ctx.portrait ? (
        <AbsoluteFill style={{alignItems: 'center', justifyContent: 'flex-start', paddingTop: ctx.H * 0.58}}>
          <TypeReveal
            text={hook.text}
            highlight={hook.hl}
            startAt={40}
            wordStagger={4}
            fontSize={ctx.rtl ? 68 : 72}
            fontWeight={ctx.rtl ? 700 : 600}
            maxWidth={ctx.rtl ? '88%' : '80%'}
            rtl={ctx.rtl}
            fontFamily={ctx.font}
            lineHeight={ctx.rtl ? 1.5 : 1.18}
          />
        </AbsoluteFill>
      ) : (
        <AbsoluteFill
          style={{
            justifyContent: 'center',
            alignItems: ctx.rtl ? 'flex-end' : 'flex-start',
            paddingLeft: 150,
            paddingRight: 150,
          }}
        >
          <TypeReveal
            text={hook.text}
            highlight={hook.hl}
            startAt={40}
            wordStagger={4}
            fontSize={ctx.rtl ? 70 : 74}
            fontWeight={ctx.rtl ? 700 : 600}
            maxWidth={900}
            align="left"
            rtl={ctx.rtl}
            fontFamily={ctx.font}
            lineHeight={ctx.rtl ? 1.5 : 1.18}
          />
        </AbsoluteFill>
      )}
    </AbsoluteFill>
  );
};

// ————— 2 · Reveal —————
const NameBlock: React.FC<{ctx: Ctx; startAt: number; center: boolean; nameSize: number}> = ({ctx, startAt, center, nameSize}) => (
  <div
    style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: center ? 'center' : 'flex-start',
      direction: ctx.rtl ? 'rtl' : 'ltr',
      gap: 18,
    }}
  >
    <Eyebrow
      text={ctx.rtl ? ctx.categoryAr : ctx.category}
      startAt={startAt}
      fontSize={ctx.portrait ? 30 : 28}
      rtl={ctx.rtl}
      fontFamily={ctx.font}
    />
    {/* Product names are Latin in both languages, so always set LTR */}
    <TypeReveal
      text={ctx.name}
      startAt={startAt + 6}
      fontSize={nameSize}
      fontWeight={900}
      letterSpacing="0.02em"
      glow
      align={center ? 'center' : 'left'}
      maxWidth="100%"
      lineHeight={1.02}
    />
    <Sub
      ctx={ctx}
      text={ctx.copy.revealSub}
      startAt={startAt + 26}
      fontSize={ctx.portrait ? 34 : 32}
      maxWidth={ctx.portrait ? ctx.W * 0.8 : 700}
      align={center ? 'center' : 'start'}
    />
  </div>
);

const Reveal: React.FC<{ctx: Ctx}> = ({ctx}) => {
  const frames = SCENES.reveal[1] - SCENES.reveal[0];
  // Fit the name to its column on one line (Outfit Black caps ≈ 0.74em per glyph).
  const column = ctx.portrait ? ctx.W * 0.86 : 760;
  const nameSize = Math.min(ctx.portrait ? 190 : 176, column / (Math.max(4, ctx.name.length) * 0.74));
  return (
    <AbsoluteFill>
      <NavyBackdrop />
      <ParticleField count={16} opacity={0.28} seed={`cr-${ctx.key}`} />
      {ctx.portrait ? (
        <AbsoluteFill style={{alignItems: 'center', justifyContent: 'flex-start', paddingTop: 250}}>
          <ProductHero photo={ctx.photo} size={860} startAt={6} holdFrames={frames} rtl={ctx.rtl} alt={ctx.name} />
          <div style={{height: 40}} />
          <NameBlock ctx={ctx} startAt={30} center nameSize={nameSize} />
        </AbsoluteFill>
      ) : (
        <AbsoluteFill
          style={{
            flexDirection: ctx.rtl ? 'row-reverse' : 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 90,
          }}
        >
          <ProductHero photo={ctx.photo} size={760} startAt={6} holdFrames={frames} rtl={ctx.rtl} alt={ctx.name} />
          <div style={{width: 760}}>
            <NameBlock ctx={ctx} startAt={30} center={false} nameSize={nameSize} />
          </div>
        </AbsoluteFill>
      )}
    </AbsoluteFill>
  );
};

// ————— 3 · Datasheet —————
const Heading: React.FC<{ctx: Ctx; eyebrow: string; title: {text: string; hl?: string}; center: boolean; size: number}> = ({
  ctx,
  eyebrow,
  title,
  center,
  size,
}) => (
  <div style={{display: 'flex', flexDirection: 'column', alignItems: center ? 'center' : 'flex-start', gap: 16}}>
    <Eyebrow text={eyebrow} startAt={4} fontSize={ctx.portrait ? 28 : 26} rtl={ctx.rtl} fontFamily={ctx.font} />
    <TypeReveal
      text={title.text}
      highlight={title.hl}
      startAt={10}
      wordStagger={4}
      fontSize={size}
      fontWeight={ctx.rtl ? 700 : 800}
      align={center ? 'center' : 'left'}
      maxWidth="100%"
      rtl={ctx.rtl}
      fontFamily={ctx.font}
      lineHeight={ctx.rtl ? 1.45 : 1.15}
    />
  </div>
);

const Datasheet: React.FC<{ctx: Ctx}> = ({ctx}) => {
  const rows = ctx.specs.slice(0, 6).map((s) => ({label: ctx.rtl ? s.labelAr ?? s.label : s.label, value: s.value}));
  const hasSpecs = rows.length > 0;
  const heroPhoto = ctx.gallery[0] ?? ctx.photo;
  const title = hasSpecs ? ctx.copy.sheetTitle : ctx.copy.typicalTitle;
  const eyebrow = hasSpecs ? ctx.copy.sheetEyebrow : ctx.rtl ? ctx.categoryAr : ctx.category;

  const visual = hasSpecs ? (
    <ProductHero photo={heroPhoto} size={ctx.portrait ? 560 : 640} startAt={0} revealFrames={22} holdFrames={210} rtl={ctx.rtl} alt={ctx.name} />
  ) : (
    <Photometric profile={ctx.profile} size={ctx.portrait ? 820 : 640} startAt={14} drawFrames={60} showScan={false} />
  );

  const detail = hasSpecs ? (
    <SpecSheet
      rows={rows}
      width={ctx.portrait ? ctx.W * 0.82 : 820}
      startAt={34}
      stagger={9}
      fontSize={ctx.portrait ? 38 : 34}
      rtl={ctx.rtl}
      fontFamily={ctx.font}
    />
  ) : (
    <Sub
      ctx={ctx}
      text={ctx.copy.typicalNote(ctx.name)}
      startAt={96}
      fontSize={ctx.portrait ? 32 : 30}
      maxWidth={ctx.portrait ? ctx.W * 0.8 : 760}
      align={ctx.portrait ? 'center' : 'start'}
    />
  );

  return (
    <AbsoluteFill>
      <NavyBackdrop />
      {ctx.portrait ? (
        <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center', paddingBottom: 60, gap: hasSpecs ? 40 : 28}}>
          <Heading ctx={ctx} eyebrow={eyebrow} title={title} center size={ctx.rtl ? 66 : 70} />
          {visual}
          {detail}
        </AbsoluteFill>
      ) : (
        <AbsoluteFill
          style={{
            flexDirection: ctx.rtl ? 'row-reverse' : 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 110,
          }}
        >
          {visual}
          <div style={{width: 820, display: 'flex', flexDirection: 'column', gap: 44, direction: ctx.rtl ? 'rtl' : 'ltr'}}>
            <Heading ctx={ctx} eyebrow={eyebrow} title={title} center={false} size={ctx.rtl ? 64 : 68} />
            {detail}
          </div>
        </AbsoluteFill>
      )}
    </AbsoluteFill>
  );
};

// ————— 4 · Application —————
const Application: React.FC<{ctx: Ctx}> = ({ctx}) => {
  const copy = (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: ctx.portrait ? 'center' : 'flex-start',
        gap: 20,
        direction: ctx.rtl ? 'rtl' : 'ltr',
        width: ctx.portrait ? ctx.W * 0.84 : 720,
      }}
    >
      <Eyebrow text={ctx.copy.appEyebrow} startAt={34} fontSize={ctx.portrait ? 30 : 26} rtl={ctx.rtl} fontFamily={ctx.font} />
      <TypeReveal
        text={ctx.copy.appTitle.text}
        highlight={ctx.copy.appTitle.hl}
        startAt={40}
        wordStagger={4}
        fontSize={ctx.portrait ? (ctx.rtl ? 64 : 68) : ctx.rtl ? 60 : 64}
        fontWeight={ctx.rtl ? 700 : 800}
        align={ctx.portrait ? 'center' : 'left'}
        maxWidth="100%"
        rtl={ctx.rtl}
        fontFamily={ctx.font}
        lineHeight={ctx.rtl ? 1.45 : 1.15}
      />
      <Sub
        ctx={ctx}
        text={ctx.copy.appSub}
        startAt={78}
        fontSize={ctx.portrait ? 34 : 30}
        maxWidth={ctx.portrait ? ctx.W * 0.82 : 700}
        align={ctx.portrait ? 'center' : 'start'}
      />
    </div>
  );
  return (
    <AbsoluteFill>
      <NightBackdrop lift={0.4} />
      {ctx.portrait ? (
        <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center', gap: 56, paddingBottom: 60}}>
          <WallWash width={ctx.W} height={900} count={3} startAt={6} stagger={7} rtl={ctx.rtl} />
          {copy}
        </AbsoluteFill>
      ) : (
        <AbsoluteFill
          style={{
            flexDirection: ctx.rtl ? 'row' : 'row-reverse',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 70,
          }}
        >
          <WallWash width={960} height={860} count={4} startAt={6} stagger={6} rtl={ctx.rtl} />
          {copy}
        </AbsoluteFill>
      )}
    </AbsoluteFill>
  );
};

// ————— 5 · CTA —————
const Cta: React.FC<{ctx: Ctx}> = ({ctx}) => {
  const pill = useFadeUp(58, 18);
  const tag = useFadeUp(72, 18);
  // The name travels as one token (no-break spaces) so a multi-word Latin name
  // is revealed, highlighted and ordered as a unit inside an RTL line.
  const cta = ctx.copy.cta(ctx.name.replace(/ /g, '\u00A0'));
  return (
    <AbsoluteFill>
      <NavyBackdrop />
      <LightRays cx={50} cy={40} radius={90} opacity={0.3} speed={0.08} />
      <ParticleField count={18} opacity={0.3} seed={`cc-${ctx.key}`} />
      <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center', gap: ctx.portrait ? 46 : 36, paddingBottom: ctx.portrait ? 80 : 20}}>
        <NLCLogo height={ctx.portrait ? 230 : 160} variant="reversed" revealAt={6} revealFrames={30} />
        <TypeReveal
          text={cta.text}
          highlight={cta.hl}
          startAt={34}
          wordStagger={4}
          fontSize={ctx.portrait ? (ctx.rtl ? 72 : 70) : 58}
          fontWeight={700}
          maxWidth={ctx.portrait ? '84%' : 1400}
          rtl={ctx.rtl}
          fontFamily={ctx.font}
          lineHeight={ctx.rtl ? 1.45 : 1.15}
        />
        <div
          style={{
            fontFamily: FONT,
            fontWeight: 700,
            fontSize: ctx.portrait ? 40 : 36,
            color: WHITE,
            background: `linear-gradient(90deg, ${ORANGE}, ${ORANGE_GLOW})`,
            padding: ctx.portrait ? '18px 60px' : '16px 54px',
            borderRadius: 50,
            opacity: pill,
            transform: `scale(${0.9 + 0.1 * pill})`,
            boxShadow: '0 12px 40px rgba(15,18,53,0.55), 0 0 36px rgba(246,133,31,0.35)',
          }}
        >
          {SITE}
        </div>
        <div
          style={{
            fontFamily: ctx.font,
            fontWeight: 400,
            fontSize: ctx.portrait ? 30 : 28,
            letterSpacing: ctx.rtl ? 0 : '0.06em',
            color: 'rgba(255,255,255,0.62)',
            direction: ctx.rtl ? 'rtl' : 'ltr',
            opacity: tag,
            marginTop: 6,
          }}
        >
          {ctx.copy.tagline.text}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ————— Master timeline —————
export const ProductCommercial: React.FC<CommercialProps> = (props) => {
  loadBrandFonts();
  const {width: W, height: H} = useVideoConfig();
  const rtl = props.lang === 'ar';
  const ctx: Ctx = {
    ...props,
    copy: copyFor(props.lang),
    rtl,
    font: rtl ? AR_FONT : FONT,
    portrait: H > W,
    W,
    H,
  };
  const seq = (k: keyof typeof SCENES) => ({from: SCENES[k][0], durationInFrames: SCENES[k][1] - SCENES[k][0]});

  return (
    <AbsoluteFill style={{backgroundColor: NIGHT}}>
      <Sequence {...seq('hook')}>
        <Hook ctx={ctx} />
      </Sequence>
      <Sequence {...seq('reveal')}>
        <Reveal ctx={ctx} />
      </Sequence>
      <Sequence {...seq('sheet')}>
        <Datasheet ctx={ctx} />
      </Sequence>
      <Sequence {...seq('app')}>
        <Application ctx={ctx} />
      </Sequence>
      <Sequence {...seq('cta')}>
        <Cta ctx={ctx} />
      </Sequence>
      {/* Soft light-flash at each cut — quieter than the brand films: motion is a "quiet handshake" */}
      {[SCENES.reveal[0], SCENES.sheet[0], SCENES.app[0], SCENES.cta[0]].map((at) => (
        <LightSweep key={at} at={at} peak={0.45} />
      ))}
      <CinematicOverlay vignette={0.32} />
    </AbsoluteFill>
  );
};
