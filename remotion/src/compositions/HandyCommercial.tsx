import React from 'react';
import {AbsoluteFill, Easing, interpolate, Sequence, useCurrentFrame} from 'remotion';
import {FONT, ORANGE, ORANGE_GLOW, SITE, WHITE} from '../brand';
import {loadBrandFonts} from '../fonts';
import {CinematicOverlay, LightSweep, NavyBackdrop} from '../components/Atmosphere';
import {DobBoard, ExternalDriverRig, HandyProduct} from '../components/HandyVisuals';
import {NLCLogo} from '../components/NLCLogo';
import {ParticleField} from '../components/ParticleField';
import {TypeReveal} from '../components/TypeReveal';
import {HANDY, HANDY_ECO, HANDY_SHARED, HANDY_SIZES} from '../data/handy';

// HANDY SERIES — 35 s product commercial, 1920×1080.
// One housing, two drivers: HANDY ECO puts the driver on the LED board (DOB),
// HANDY uses an external driver. Every figure on screen comes from
// src/data/handy.ts, which is transcribed from the two datasheets.

const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const XFADE = 12;

const ease = (frame: number, from: number, to: number) =>
  interpolate(frame, [from, to], [0, 1], {...clamp, easing: Easing.out(Easing.cubic)});

// Scenes overlap by XFADE frames and dip through the navy backdrop: the
// outgoing scene is gone by the midpoint, then the next one fades up. This
// avoids a double exposure of two semi-transparent fixtures.
const Scene: React.FC<{dur: number; fadeIn?: boolean; fadeOut?: boolean; children: React.ReactNode}> = ({
  dur,
  fadeIn = true,
  fadeOut = true,
  children,
}) => {
  const f = useCurrentFrame();
  const o = Math.min(
    fadeIn ? interpolate(f, [XFADE / 2, XFADE], [0, 1], clamp) : 1,
    fadeOut ? interpolate(f, [dur - XFADE, dur - XFADE / 2], [1, 0], clamp) : 1,
  );
  return <AbsoluteFill style={{opacity: o}}>{children}</AbsoluteFill>;
};

const Eyebrow: React.FC<{text: string; at: number; align?: 'left' | 'center'}> = ({text, at, align = 'left'}) => {
  const p = ease(useCurrentFrame(), at, at + 14);
  return (
    <div
      style={{
        fontFamily: FONT,
        fontWeight: 600,
        fontSize: 26,
        letterSpacing: '0.34em',
        color: ORANGE_GLOW,
        textTransform: 'uppercase',
        textAlign: align,
        opacity: p,
        transform: `translateY(${(1 - p) * 12}px)`,
      }}
    >
      {text}
    </div>
  );
};

const Body: React.FC<{text: string; at: number; size?: number}> = ({text, at, size = 32}) => {
  const p = ease(useCurrentFrame(), at, at + 18);
  return (
    <div
      style={{
        fontFamily: FONT,
        fontWeight: 300,
        fontSize: size,
        lineHeight: 1.45,
        color: 'rgba(255,255,255,0.86)',
        opacity: p,
        transform: `translateY(${(1 - p) * 14}px)`,
      }}
    >
      {text}
    </div>
  );
};

// Big figure + unit + caption. `count` animates the number up from zero.
const Stat: React.FC<{
  at: number;
  value: string;
  count?: number;
  prefix?: string;
  unit?: string;
  label: string;
  size?: number;
}> = ({at, value, count, prefix, unit, label, size = 76}) => {
  const frame = useCurrentFrame();
  const p = ease(frame, at, at + 16);
  const shown =
    count === undefined
      ? value
      : Math.round(
          interpolate(frame, [at, at + 36], [0, count], {...clamp, easing: Easing.out(Easing.cubic)}),
        ).toLocaleString('en-US');
  return (
    <div style={{opacity: p, transform: `translateY(${(1 - p) * 24}px)`}}>
      <div style={{fontFamily: FONT, lineHeight: 1, color: WHITE, whiteSpace: 'nowrap'}}>
        {prefix ? (
          // A lone comparison sign (> / <) reads as part of the figure; words stay small.
          <span
            style={{
              fontWeight: prefix.length === 1 ? 700 : 400,
              fontSize: size * (prefix.length === 1 ? 0.62 : 0.34),
              color: 'rgba(255,255,255,0.75)',
              marginRight: 10,
            }}
          >
            {prefix}
          </span>
        ) : null}
        <span style={{fontWeight: 900, fontSize: size, fontVariantNumeric: 'tabular-nums', textShadow: '0 0 36px rgba(246,133,31,0.35)'}}>
          {shown}
        </span>
        {unit ? <span style={{fontWeight: 700, fontSize: size * 0.4, color: ORANGE, marginLeft: 8}}>{unit}</span> : null}
      </div>
      <div style={{width: 44, height: 4, borderRadius: 2, background: ORANGE, margin: '14px 0 10px'}} />
      <div
        style={{
          fontFamily: FONT,
          fontWeight: 600,
          fontSize: 19,
          letterSpacing: '0.2em',
          color: 'rgba(255,255,255,0.7)',
          textTransform: 'uppercase',
        }}
      >
        {label}
      </div>
    </div>
  );
};

// ————— 1 · The light comes on —————
const SceneIgnite: React.FC = () => {
  const f = useCurrentFrame();
  const glow = interpolate(f, [34, 40, 43, 50], [0, 0.85, 0.55, 1], clamp);
  const brightness = interpolate(f, [0, 30, 50], [0.18, 0.42, 1], clamp);
  const push = interpolate(f, [0, 130], [1, 1.05], {easing: Easing.inOut(Easing.quad)});
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{alignItems: 'center', paddingTop: 92}}>
        <Eyebrow text="NLC · Recessed LED Downlight" at={52} align="center" />
        <div style={{height: 18}} />
        <TypeReveal text="HANDY SERIES" startAt={60} fontSize={118} fontWeight={900} letterSpacing="0.04em" glow />
      </AbsoluteFill>
      <AbsoluteFill style={{alignItems: 'center', justifyContent: 'flex-end', paddingBottom: 40}}>
        <div style={{transform: `scale(${push})`}}>
          <HandyProduct width={1120} glow={glow} brightness={brightness} />
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ————— 2 · What both models share —————
const SceneShared: React.FC = () => {
  const f = useCurrentFrame();
  const slide = ease(f, 0, 26);
  const float = Math.sin(f / 22) * 6;
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{justifyContent: 'center', paddingLeft: 60}}>
        <div style={{transform: `translate(${(1 - slide) * 180}px, ${float}px)`}}>
          <HandyProduct width={900} glow={1} />
        </div>
      </AbsoluteFill>
      <AbsoluteFill style={{left: 1010, right: 90, width: 'auto', justifyContent: 'center'}}>
        <Eyebrow text="Two models · one look" at={10} />
        <div style={{height: 16}} />
        <TypeReveal text="One elegant face." startAt={16} fontSize={84} fontWeight={900} align="left" maxWidth="100%" />
        <div style={{height: 40}} />
        <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16}}>
          {HANDY_SHARED.map((s, i) => {
            const p = ease(f, 40 + i * 7, 56 + i * 7);
            return (
              <div
                key={s}
                style={{
                  fontFamily: FONT,
                  fontWeight: 600,
                  fontSize: 27,
                  color: WHITE,
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.16)',
                  borderLeft: `4px solid ${ORANGE}`,
                  borderRadius: 10,
                  padding: '16px 22px',
                  opacity: p,
                  transform: `translateX(${(1 - p) * 30}px)`,
                }}
              >
                {s}
              </div>
            );
          })}
        </div>
        <div style={{height: 28}} />
        <Body text={HANDY_SIZES} at={96} size={28} />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ————— 3 · Same face, two hearts —————
const SceneSplit: React.FC = () => {
  const f = useCurrentFrame();
  const split = interpolate(f, [8, 40], [0, 1], {...clamp, easing: Easing.inOut(Easing.cubic)});
  const labels = ease(f, 38, 54);
  const Col: React.FC<{dir: -1 | 1; name: string; driver: string}> = ({dir, name, driver}) => (
    <div
      style={{
        position: 'absolute',
        left: 960 - 360 + dir * 400 * split,
        top: 330,
        width: 720,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}
    >
      <HandyProduct width={720} glow={1} />
      <div style={{opacity: labels, transform: `translateY(${(1 - labels) * 16}px)`, textAlign: 'center', marginTop: 18}}>
        <div style={{fontFamily: FONT, fontWeight: 900, fontSize: 60, color: WHITE, letterSpacing: '0.03em'}}>{name}</div>
        <div
          style={{
            fontFamily: FONT,
            fontWeight: 600,
            fontSize: 26,
            letterSpacing: '0.24em',
            color: ORANGE_GLOW,
            textTransform: 'uppercase',
            marginTop: 6,
          }}
        >
          {driver}
        </div>
      </div>
    </div>
  );
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{alignItems: 'center', paddingTop: 96}}>
        <TypeReveal text="Same face. Two different hearts." startAt={4} fontSize={78} fontWeight={700} glow />
      </AbsoluteFill>
      <Col dir={-1} name={HANDY_ECO.name} driver={HANDY_ECO.driver} />
      <Col dir={1} name={HANDY.name} driver={HANDY.driver} />
      <div
        style={{
          position: 'absolute',
          left: 959,
          top: 360,
          width: 2,
          height: 560 * labels,
          background: 'linear-gradient(180deg, rgba(246,133,31,0), rgba(246,133,31,0.7), rgba(246,133,31,0))',
        }}
      />
    </AbsoluteFill>
  );
};

// ————— 4 · HANDY ECO: Driver on Board —————
const SceneEco: React.FC = () => (
  <AbsoluteFill>
    <AbsoluteFill style={{justifyContent: 'center', paddingLeft: 90}}>
      <DobBoard width={800} appearAt={0} />
    </AbsoluteFill>
    <AbsoluteFill style={{left: 1010, right: 90, width: 'auto', justifyContent: 'center'}}>
      <Eyebrow text={HANDY_ECO.name} at={8} />
      <div style={{height: 14}} />
      <TypeReveal text="Driver on Board." startAt={14} fontSize={90} fontWeight={900} align="left" maxWidth="100%" />
      <div style={{height: 26}} />
      <Body at={40} text="LEDs and driver share one board — no separate driver box. Fewer parts, faster installation, outstanding value." />
      <div style={{height: 54}} />
      <div style={{display: 'grid', gridTemplateColumns: 'auto auto', columnGap: 64, rowGap: 40, justifyContent: 'start'}}>
        <Stat at={96} value={String(HANDY_ECO.efficacy)} count={HANDY_ECO.efficacy} prefix="up to" unit="lm/W" label="Efficacy" size={66} />
        <Stat at={106} value={HANDY_ECO.maxLumen.toLocaleString('en-US')} count={HANDY_ECO.maxLumen} unit="lm" label="Max output" size={66} />
        <Stat at={116} value={HANDY_ECO.power} label="Power range" size={56} />
        <Stat at={126} value="All-in-one" label="LEDs + driver" size={50} />
      </div>
    </AbsoluteFill>
  </AbsoluteFill>
);

// ————— 5 · HANDY: External driver —————
const SceneHandy: React.FC = () => (
  <AbsoluteFill>
    <AbsoluteFill style={{left: 110, right: 1000, width: 'auto', justifyContent: 'center'}}>
      <Eyebrow text={HANDY.name} at={8} />
      <div style={{height: 14}} />
      <TypeReveal text="External Driver." startAt={14} fontSize={90} fontWeight={900} align="left" maxWidth="100%" />
      <div style={{height: 26}} />
      <Body at={40} text="A dedicated driver outside the luminaire — cleaner power, longer life and room for control." />
      <div style={{height: 50}} />
      <div style={{display: 'grid', gridTemplateColumns: 'auto auto', columnGap: 64, rowGap: 40, justifyContent: 'start'}}>
        <Stat at={96} value={HANDY.pf} prefix=">" label="Power factor" size={66} />
        <Stat at={106} value={HANDY.thd} prefix="<" unit="%" label="THD" size={66} />
        <Stat at={116} value={HANDY.lifetimeHours.toLocaleString('en-US')} count={HANDY.lifetimeHours} prefix=">" unit="h" label="Lifetime · L70B50" size={66} />
        <Stat at={126} value={HANDY.dimming} label="Dimming · emergency" size={50} />
      </div>
    </AbsoluteFill>
    <AbsoluteFill style={{left: 930, width: 'auto', justifyContent: 'center'}}>
      <ExternalDriverRig width={900} appearAt={0} />
    </AbsoluteFill>
  </AbsoluteFill>
);

// ————— 6 · Side by side —————
const ROWS: Array<{k: string; eco: string; handy: string; key?: boolean}> = [
  {k: 'Driver', eco: 'On board (DOB)', handy: 'External', key: true},
  {k: 'Efficacy', eco: `up to ${HANDY_ECO.efficacy} lm/W`, handy: `up to ${HANDY.efficacy} lm/W`},
  {k: 'Power', eco: HANDY_ECO.power, handy: HANDY.power},
  {k: 'Max output', eco: `${HANDY_ECO.maxLumen.toLocaleString('en-US')} lm`, handy: `${HANDY.maxLumen.toLocaleString('en-US')} lm`},
  {k: 'Lifetime · L70B50', eco: HANDY_ECO.lifetime, handy: HANDY.lifetime},
  {k: 'Dimming · emergency', eco: HANDY_ECO.dimming, handy: HANDY.dimming},
];

const SceneCompare: React.FC = () => {
  const f = useCurrentFrame();
  const head = ease(f, 14, 28);
  const close = ease(f, 104, 122);
  const cols = '420px 480px 480px';
  return (
    <AbsoluteFill style={{alignItems: 'center', paddingTop: 80}}>
      <TypeReveal text="Choose your HANDY." startAt={2} fontSize={74} fontWeight={900} glow />
      <div style={{height: 44}} />
      <div style={{width: 1380}}>
        <div style={{display: 'grid', gridTemplateColumns: cols, opacity: head, paddingBottom: 14, borderBottom: '2px solid rgba(255,255,255,0.18)'}}>
          <div />
          {[HANDY_ECO.name, HANDY.name].map((n) => (
            <div key={n} style={{fontFamily: FONT, fontWeight: 900, fontSize: 42, color: WHITE, textAlign: 'center', letterSpacing: '0.03em'}}>
              {n}
            </div>
          ))}
        </div>
        {ROWS.map((r, i) => {
          const p = ease(f, 26 + i * 9, 40 + i * 9);
          return (
            <div
              key={r.k}
              style={{
                display: 'grid',
                gridTemplateColumns: cols,
                alignItems: 'center',
                padding: '17px 0',
                borderBottom: '1px solid rgba(255,255,255,0.1)',
                background: r.key ? 'rgba(246,133,31,0.12)' : undefined,
                boxShadow: r.key ? `inset 4px 0 0 ${ORANGE}` : undefined,
                opacity: p,
                transform: `translateY(${(1 - p) * 14}px)`,
              }}
            >
              <div style={{fontFamily: FONT, fontWeight: 600, fontSize: 24, letterSpacing: '0.14em', color: 'rgba(255,255,255,0.62)', textTransform: 'uppercase', paddingLeft: 26}}>
                {r.k}
              </div>
              {[r.eco, r.handy].map((v, j) => (
                <div key={j} style={{fontFamily: FONT, fontWeight: r.key ? 900 : 600, fontSize: 32, color: r.key ? ORANGE_GLOW : WHITE, textAlign: 'center'}}>
                  {v}
                </div>
              ))}
            </div>
          );
        })}
      </div>
      <div style={{height: 46}} />
      <div style={{fontFamily: FONT, fontSize: 40, color: WHITE, opacity: close, transform: `translateY(${(1 - close) * 14}px)`}}>
        <span style={{fontWeight: 900, color: ORANGE}}>ECO</span>
        <span style={{fontWeight: 300}}> for value. </span>
        <span style={{fontWeight: 900, color: ORANGE}}>HANDY</span>
        <span style={{fontWeight: 300}}> for performance and control.</span>
      </div>
    </AbsoluteFill>
  );
};

// ————— 7 · End card —————
const SceneEnd: React.FC = () => {
  const f = useCurrentFrame();
  const site = ease(f, 44, 60);
  return (
    <AbsoluteFill style={{alignItems: 'center'}}>
      <div style={{marginTop: 70}}>
        <HandyProduct width={820} glow={1} />
      </div>
      <div style={{marginTop: -10, width: '100%', display: 'flex', justifyContent: 'center'}}>
        <TypeReveal text="HANDY SERIES" startAt={6} fontSize={96} fontWeight={900} letterSpacing="0.04em" glow />
      </div>
      <div style={{display: 'flex', alignItems: 'center', gap: 22, marginTop: 26}}>
        <NLCLogo height={96} variant="reversed" showDescriptor={false} revealAt={28} revealFrames={22} />
        <div style={{width: 2, height: 40, background: 'rgba(255,255,255,0.25)', opacity: site}} />
        <div style={{fontFamily: FONT, fontWeight: 600, fontSize: 36, color: ORANGE_GLOW, opacity: site}}>{SITE}</div>
      </div>
    </AbsoluteFill>
  );
};

// Scene timeline: [from, duration]. Each scene overlaps the next by XFADE.
const T = {
  ignite: [0, 130],
  shared: [118, 162],
  split: [268, 112],
  eco: [368, 222],
  handy: [578, 222],
  compare: [788, 162],
  end: [938, 112],
} as const;

export const HANDY_COMMERCIAL_FRAMES = T.end[0] + T.end[1];

export const HandyCommercial: React.FC = () => {
  loadBrandFonts();
  const f = useCurrentFrame();
  const fromBlack = interpolate(f, [0, 24], [1, 0], clamp);
  const seq = (k: keyof typeof T, node: React.ReactNode, opts: {fadeIn?: boolean; fadeOut?: boolean} = {}) => (
    <Sequence from={T[k][0]} durationInFrames={T[k][1]}>
      <Scene dur={T[k][1]} {...opts}>
        {node}
      </Scene>
    </Sequence>
  );
  return (
    <AbsoluteFill style={{backgroundColor: '#000'}}>
      <NavyBackdrop />
      <ParticleField count={22} opacity={0.28} seed="handy" />
      {seq('ignite', <SceneIgnite />, {fadeIn: false})}
      {seq('shared', <SceneShared />)}
      {seq('split', <SceneSplit />)}
      {seq('eco', <SceneEco />)}
      {seq('handy', <SceneHandy />)}
      {seq('compare', <SceneCompare />)}
      {seq('end', <SceneEnd />, {fadeOut: false})}
      <LightSweep at={T.eco[0] + XFADE / 2} />
      <LightSweep at={T.handy[0] + XFADE / 2} />
      <CinematicOverlay vignette={0.42} />
      <AbsoluteFill style={{backgroundColor: '#000', opacity: fromBlack}} />
    </AbsoluteFill>
  );
};
