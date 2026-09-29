import React from 'react';
import {AbsoluteFill, Easing, interpolate, Sequence, useCurrentFrame, useVideoConfig} from 'remotion';
import {AR_FONT, BRAND_EASE, DISPLAY_FONT, NAVY_LIGHT, NIGHT, ORANGE, SITE, WHITE} from '../brand';
import {loadBrandFonts} from '../fonts';
import {CinematicOverlay, NavyBackdrop, NavyDip, NightBackdrop} from '../components/Atmosphere';
import {SingleBeam, WallWash} from '../components/Downlight';
import {Eyebrow} from '../components/Eyebrow';
import {NLCLogo} from '../components/NLCLogo';
import {ParticleField} from '../components/ParticleField';
import {Photometric} from '../components/Photometric';
import {ProductHero} from '../components/ProductHero';
import {SpecSheet} from '../components/SpecSheet';
import {TypeReveal} from '../components/TypeReveal';
import type {CommercialProps} from '../data/commercials';
import {copyFor, type CommercialCopy, type Line} from '../data/commercialCopy';

// ProductCommercial — a 25-second datasheet commercial for one luminaire.
//
//   0.0s  Hook        one aperture switches on; the beam finds the floor
//   4.0s  Reveal      the product, wiped in by light; category · name
//   8.3s  Datasheet   the real spec rows — or, until they are supplied, a
//                     distribution labelled on screen as typical, not measured
//  15.0s  Application downlights along a wall switch on in a wave — scallops + pools
//  20.5s  CTA         master logo · datasheet (if confirmed) or catalogue · nlc.com.sa
//
// One layout engine serves 16:9 and 9:16 (it reads the composition size) and
// English or Arabic (`lang`), so every format is cut from the same timeline.
// In 9:16 all copy stays inside x 150–930 and above y ≈ 1480, clear of the
// Reels / TikTok action rail and caption band.

export const COMMERCIAL_FPS = 30;
export const COMMERCIAL_FRAMES = 750;

const SCENES = {
  hook: [0, 120],
  reveal: [120, 250],
  sheet: [250, 450],
  app: [450, 615],
  cta: [615, 750],
} as const;

// Headline weights (§04): Display 900 for the product name, Section Title 800
// for every other headline, the same in both languages (§08 "what stays").
const TITLE_WEIGHT = 800;
// Portrait text column — the 9:16 safe width.
const SAFE_W = 780;

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

const Sub: React.FC<{
  ctx: Ctx;
  text: string;
  startAt: number;
  fontSize: number;
  maxWidth: number;
  align: 'center' | 'start';
  strength?: number;
}> = ({ctx, text, startAt, fontSize, maxWidth, align, strength = 0.78}) => {
  const p = useFadeUp(startAt);
  return (
    <div
      style={{
        fontFamily: ctx.font,
        fontWeight: 400,
        fontSize,
        lineHeight: ctx.rtl ? 1.8 : 1.5,
        color: `rgba(255,255,255,${strength})`,
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

const Headline: React.FC<{
  ctx: Ctx;
  line: Line;
  startAt: number;
  size: number;
  center: boolean;
  stagger?: number;
  maxWidth?: number | string;
}> = ({ctx, line, startAt, size, center, stagger = 4, maxWidth = '100%'}) => (
  <TypeReveal
    // '|' is a soft break: a line break in 9:16, a plain space in 16:9.
    text={line.text.replace(/ ?\| ?/g, ctx.portrait ? '\n' : ' ')}
    highlight={line.hl}
    startAt={startAt}
    wordStagger={stagger}
    fontSize={size}
    fontWeight={TITLE_WEIGHT}
    align={center ? 'center' : 'left'}
    maxWidth={maxWidth}
    rtl={ctx.rtl}
    fontFamily={ctx.font}
    lineHeight={ctx.rtl ? 1.45 : 1.15}
  />
);

// ————— 1 · Hook —————
const Hook: React.FC<{ctx: Ctx}> = ({ctx}) => {
  const hook = (ctx.rtl ? ctx.hookAr : ctx.hook) ?? ctx.copy.hook;
  const beamX = ctx.portrait ? 0.5 : ctx.rtl ? 0.3 : 0.7;
  return (
    <AbsoluteFill>
      <NightBackdrop />
      <ParticleField count={14} opacity={0.3} seed={`ch-${ctx.key}`} />
      <SingleBeam x={beamX} igniteAt={10} />
      {ctx.portrait ? (
        <AbsoluteFill style={{alignItems: 'center', justifyContent: 'flex-start', paddingTop: ctx.H * 0.52}}>
          <Headline ctx={ctx} line={hook} startAt={22} stagger={3} size={ctx.rtl ? 58 : 62} center maxWidth={SAFE_W} />
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
          <Headline ctx={ctx} line={hook} startAt={22} stagger={3} size={ctx.rtl ? 68 : 72} center={false} maxWidth={900} />
        </AbsoluteFill>
      )}
    </AbsoluteFill>
  );
};

// ————— 2 · Reveal —————
const NameBlock: React.FC<{ctx: Ctx; startAt: number; center: boolean; nameSize: number}> = ({ctx, startAt, center, nameSize}) => {
  const sub = (ctx.rtl ? ctx.revealSubAr : ctx.revealSub) ?? ctx.copy.revealSub;
  return (
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
      {/* Product names are Latin in both languages: always LTR, never broken */}
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
        fontFamily={DISPLAY_FONT}
        noWrap
      />
      <Sub
        ctx={ctx}
        text={sub}
        startAt={startAt + 26}
        fontSize={ctx.portrait ? 34 : 32}
        maxWidth={ctx.portrait ? SAFE_W : 700}
        align={center ? 'center' : 'start'}
      />
    </div>
  );
};

const Reveal: React.FC<{ctx: Ctx}> = ({ctx}) => {
  const frames = SCENES.reveal[1] - SCENES.reveal[0];
  const photo = ctx.photo ?? ctx.gallery[0] ?? null;
  // Fit the name to its column on one line (Outfit Black caps + 0.02em tracking ≈ 0.82em per glyph).
  const column = ctx.portrait ? SAFE_W : 760;
  const nameSize = Math.min(ctx.portrait ? 190 : 176, column / (Math.max(4, ctx.name.length) * 0.82));
  return (
    <AbsoluteFill>
      <NavyBackdrop />
      <ParticleField count={16} opacity={0.28} seed={`cr-${ctx.key}`} />
      {ctx.portrait ? (
        <AbsoluteFill style={{alignItems: 'center', justifyContent: 'flex-start', paddingTop: 250}}>
          <ProductHero photo={photo} size={820} startAt={6} holdFrames={frames} rtl={ctx.rtl} alt={ctx.name} />
          <div style={{height: 36}} />
          <NameBlock ctx={ctx} startAt={26} center nameSize={nameSize} />
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
          <ProductHero photo={photo} size={760} startAt={6} holdFrames={frames} rtl={ctx.rtl} alt={ctx.name} />
          <div style={{width: 760}}>
            <NameBlock ctx={ctx} startAt={26} center={false} nameSize={nameSize} />
          </div>
        </AbsoluteFill>
      )}
    </AbsoluteFill>
  );
};

// ————— 3 · Datasheet —————
const Heading: React.FC<{ctx: Ctx; eyebrow: string; title: Line; center: boolean; size: number}> = ({ctx, eyebrow, title, center, size}) => (
  <div
    style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: center ? 'center' : 'flex-start',
      gap: 16,
      maxWidth: ctx.portrait ? SAFE_W : undefined,
    }}
  >
    {/* The eyebrow lands first — in the typical fallback it IS the "typical" label, on screen before the curve */}
    <Eyebrow text={eyebrow} startAt={2} fontSize={ctx.portrait ? 28 : 26} rtl={ctx.rtl} fontFamily={ctx.font} />
    <Headline ctx={ctx} line={title} startAt={10} size={size} center={center} />
  </div>
);

const Datasheet: React.FC<{ctx: Ctx}> = ({ctx}) => {
  const rows = ctx.specs.slice(0, 6).map((s) => ({
    label: ctx.rtl ? s.labelAr ?? s.label : s.label,
    value: ctx.rtl ? s.valueAr ?? s.value : s.value,
  }));
  const hasSpecs = rows.length > 0;
  const heroPhoto = ctx.gallery[0] ?? ctx.photo;
  const title = hasSpecs ? ctx.copy.sheetTitle : ctx.copy.typicalTitle;
  const eyebrow = hasSpecs ? ctx.copy.sheetEyebrow : ctx.copy.typicalEyebrow;

  const visual = hasSpecs ? (
    <ProductHero photo={heroPhoto} size={ctx.portrait ? 480 : 640} startAt={0} revealFrames={22} holdFrames={200} rtl={ctx.rtl} alt={ctx.name} />
  ) : (
    <Photometric
      profile={ctx.profile}
      size={ctx.portrait ? 760 : 640}
      startAt={14}
      drawFrames={60}
      showScan={false}
      fontFamily={ctx.font}
      labelSize={7.5}
      labelOpacity={0.6}
    />
  );

  const detail = hasSpecs ? (
    <SpecSheet
      rows={rows}
      width={ctx.portrait ? 760 : 820}
      startAt={30}
      stagger={9}
      fontSize={ctx.portrait ? 38 : 34}
      rowScale={ctx.portrait ? 1.8 : 2.05}
      rtl={ctx.rtl}
      fontFamily={ctx.font}
    />
  ) : (
    <Sub
      ctx={ctx}
      text={ctx.copy.typicalNote(ctx.name, ctx.category)}
      startAt={30}
      fontSize={32}
      maxWidth={760}
      align={ctx.portrait ? 'center' : 'start'}
      strength={0.9}
    />
  );

  return (
    <AbsoluteFill>
      <NavyBackdrop />
      {ctx.portrait ? (
        <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center', paddingBottom: 140, gap: hasSpecs ? 36 : 24}}>
          <Heading ctx={ctx} eyebrow={eyebrow} title={title} center size={ctx.rtl ? 64 : 66} />
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
          <div style={{width: 820, display: 'flex', flexDirection: 'column', gap: 40, direction: ctx.rtl ? 'rtl' : 'ltr'}}>
            <Heading ctx={ctx} eyebrow={eyebrow} title={title} center={false} size={ctx.rtl ? 64 : 66} />
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
        width: ctx.portrait ? SAFE_W : 700,
      }}
    >
      <Eyebrow text={ctx.copy.appEyebrow} startAt={12} fontSize={ctx.portrait ? 30 : 26} rtl={ctx.rtl} fontFamily={ctx.font} />
      <Headline
        ctx={ctx}
        line={ctx.copy.appTitle}
        startAt={18}
        size={ctx.portrait ? (ctx.rtl ? 62 : 66) : ctx.rtl ? 60 : 62}
        center={ctx.portrait}
      />
      <Sub
        ctx={ctx}
        text={ctx.copy.appSub}
        startAt={50}
        fontSize={ctx.portrait ? 34 : 30}
        maxWidth={ctx.portrait ? SAFE_W : 700}
        align={ctx.portrait ? 'center' : 'start'}
      />
    </div>
  );
  return (
    <AbsoluteFill>
      <NightBackdrop lift={0.4} />
      {ctx.portrait ? (
        <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center', gap: 48, paddingBottom: 200}}>
          <WallWash width={ctx.W} height={760} count={3} startAt={4} stagger={7} rtl={ctx.rtl} />
          {copy}
        </AbsoluteFill>
      ) : (
        <AbsoluteFill
          style={{
            flexDirection: ctx.rtl ? 'row' : 'row-reverse',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 40,
          }}
        >
          <WallWash width={880} height={860} count={4} startAt={4} stagger={6} rtl={ctx.rtl} />
          {copy}
        </AbsoluteFill>
      )}
    </AbsoluteFill>
  );
};

// ————— 5 · CTA —————
// A slow orb glow (§07 Treatments: radial, low opacity, drifting), kept clear
// of the logo's clear space — no rays or patterns behind the lockup (§02).
const Orbs: React.FC = () => {
  const frame = useCurrentFrame();
  const d = Math.sin(frame / 45);
  return (
    <AbsoluteFill style={{overflow: 'hidden'}}>
      <div
        style={{
          position: 'absolute',
          width: '70%',
          aspectRatio: '1',
          left: '48%',
          top: '58%',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(246,133,31,0.22) 0%, rgba(246,133,31,0.08) 40%, transparent 70%)',
          transform: `translate(${d * 24}px, ${d * -16}px)`,
        }}
      />
      <div
        style={{
          position: 'absolute',
          width: '80%',
          aspectRatio: '1',
          left: '-30%',
          top: '-35%',
          borderRadius: '50%',
          background: `radial-gradient(circle, ${NAVY_LIGHT} 0%, rgba(46,52,120,0.25) 45%, transparent 70%)`,
          opacity: 0.55,
          transform: `translate(${d * -20}px, ${d * 14}px)`,
        }}
      />
    </AbsoluteFill>
  );
};

const Cta: React.FC<{ctx: Ctx}> = ({ctx}) => {
  const pill = useFadeUp(34, 16);
  const tag = useFadeUp(44, 16);
  // The name travels as one token (no-break spaces) so a multi-word Latin name
  // is revealed, highlighted and ordered as a unit inside an RTL line.
  const cta = ctx.copy.cta(ctx.name.replace(/ /g, '\u00A0'), ctx.hasDatasheet);
  return (
    <AbsoluteFill>
      <NavyBackdrop />
      <Orbs />
      <ParticleField count={16} opacity={0.26} seed={`cc-${ctx.key}`} />
      <AbsoluteFill
        style={{alignItems: 'center', justifyContent: 'center', gap: ctx.portrait ? 40 : 30, paddingBottom: ctx.portrait ? 140 : 10}}
      >
        <NLCLogo height={ctx.portrait ? 170 : 130} variant="reversed" revealAt={4} revealFrames={26} clearSpace="outside" />
        <Headline
          ctx={ctx}
          line={cta}
          startAt={18}
          size={ctx.portrait ? (ctx.rtl ? 66 : 64) : 58}
          center
          maxWidth={ctx.portrait ? SAFE_W : 1400}
        />
        <div
          style={{
            // Primary button (§06): solid --secondary, SemiBold, orange .35 shadow, pill radius
            fontFamily: DISPLAY_FONT,
            fontWeight: 600,
            fontSize: ctx.portrait ? 42 : 36,
            color: WHITE,
            background: ORANGE,
            padding: ctx.portrait ? '18px 60px' : '16px 54px',
            borderRadius: 50,
            opacity: pill,
            transform: `scale(${0.94 + 0.06 * pill})`,
            boxShadow: '0 8px 30px rgba(246,133,31,0.35)',
            marginTop: 8,
          }}
        >
          {SITE}
        </div>
        <div
          style={{
            fontFamily: ctx.font,
            fontWeight: 400,
            fontSize: ctx.portrait ? 30 : 28,
            letterSpacing: ctx.rtl ? 0 : '0.03em',
            color: 'rgba(255,255,255,0.7)',
            direction: ctx.rtl ? 'rtl' : 'ltr',
            textAlign: 'center',
            maxWidth: ctx.portrait ? SAFE_W : undefined,
            opacity: tag,
            marginTop: 4,
          }}
        >
          {ctx.copy.tagline}
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
    // Bizmo first for English (§04); falls back to Outfit until the licensed files are present.
    font: rtl ? AR_FONT : DISPLAY_FONT,
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
      {/* Quiet cuts: a short dip through night navy — motion is a "quiet handshake" (§08) */}
      {[SCENES.reveal[0], SCENES.sheet[0], SCENES.app[0], SCENES.cta[0]].map((at) => (
        <NavyDip key={at} at={at} />
      ))}
      <CinematicOverlay vignette={0.32} />
    </AbsoluteFill>
  );
};
