import React from 'react';
import {AbsoluteFill, Easing, Img, interpolate, Sequence, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {DISPLAY_FONT, FONT, ORANGE, ORANGE_GLOW, SITE, WHITE} from '../brand';
import {loadBrandFonts} from '../fonts';
import {CinematicOverlay, LightSweep, NavyBackdrop, NightBackdrop} from '../components/Atmosphere';
import {Corridor} from '../components/Corridor';
import {NLCLogo} from '../components/NLCLogo';
import {ParticleField} from '../components/ParticleField';
import {Photometric} from '../components/Photometric';
import {TypeReveal} from '../components/TypeReveal';

// A 20-second product commercial for a linear luminaire. Renders at any size:
// 1920x1080 for the master, 1080x1920 for the vertical cut.
//
// Honesty rules, carried over from ProductSpot:
//   · `specs` is empty unless filled from the product datasheet. The template
//     never invents a wattage, lumen, CRI or IP figure.
//   · `photo` is the real catalogue photograph (public/products/<key>.png).
//     Without it the hero shows a line of light, never a made-up housing.

export type LinearCommercialProps = {
  label: string;
  catLabel: string;
  /** Path under public/, e.g. "products/alligator.png". null → light-only hero. */
  photo: string | null;
  specs: Array<{k: string; v: string}>;
  hook: string;
  line2: string;
  productUrl: string;
};

export const LINEAR_COMMERCIAL_FRAMES = 600;

// Scene boundaries (30 fps)
const S1 = 0; // a line of light
const S2 = 96; // the corridor comes up
const S3 = 246; // hero: name + product
const S4 = 396; // light distribution + specs
const S5 = 504; // end card

const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

const useUnit = () => {
  const {width, height} = useVideoConfig();
  return {W: width, H: height, u: Math.min(width, height) / 1080, portrait: height > width};
};

// ————— Scene 1: one line of light is drawn across the dark —————
const SceneLine: React.FC<{hook: string}> = ({hook}) => {
  const frame = useCurrentFrame();
  const {W, H, u} = useUnit();
  const x0 = W * 0.12;
  const x1 = W * 0.88;
  const y = H * 0.44;
  const draw = interpolate(frame, [8, 50], [0, 1], {...clamp, easing: Easing.inOut(Easing.cubic)});
  const ignite = interpolate(frame, [50, 62], [0, 1], clamp);
  const headX = x0 + (x1 - x0) * draw;
  const coneIn = interpolate(frame, [54, 80], [0, 1], clamp);

  return (
    <AbsoluteFill>
      <NightBackdrop />
      <ParticleField count={18} opacity={0.3} seed="lc-1" />
      <svg width={W} height={H} style={{position: 'absolute', inset: 0}}>
        <defs>
          <radialGradient id="lcPool" cx="50%" cy="0%" r="100%">
            <stop offset="0%" stopColor={ORANGE_GLOW} stopOpacity={0.3} />
            <stop offset="45%" stopColor={ORANGE} stopOpacity={0.08} />
            <stop offset="100%" stopColor={ORANGE} stopOpacity={0} />
          </radialGradient>
          {/* userSpaceOnUse: an object-bbox filter collapses on a zero-height line */}
          <filter id="lcBlur" filterUnits="userSpaceOnUse" x={0} y={0} width={W} height={H}>
            <feGaussianBlur stdDeviation={12 * u} />
          </filter>
          <filter id="lcSoft" filterUnits="userSpaceOnUse" x={0} y={0} width={W} height={H}>
            <feGaussianBlur stdDeviation={40 * u} />
          </filter>
          <clipPath id="lcBelow">
            <rect x={0} y={y} width={W} height={H - y} />
          </clipPath>
        </defs>
        {/* light thrown downward once the line is lit */}
        <g clipPath="url(#lcBelow)">
          <ellipse cx={W / 2} cy={y} rx={(x1 - x0) * 0.62} ry={H * 0.5} fill="url(#lcPool)" opacity={coneIn} filter="url(#lcSoft)" />
        </g>
        <line x1={x0} y1={y} x2={headX} y2={y} stroke={ORANGE_GLOW} strokeWidth={(10 + 22 * ignite) * u} opacity={0.75} filter="url(#lcBlur)" />
        <line x1={x0} y1={y} x2={headX} y2={y} stroke="#FFF1DC" strokeWidth={(2.5 + 3.5 * ignite) * u} strokeLinecap="round" />
        {draw < 1 ? (
          <circle cx={headX} cy={y} r={7 * u} fill={WHITE} style={{filter: `drop-shadow(0 0 ${14 * u}px ${ORANGE})`}} />
        ) : null}
      </svg>
      <AbsoluteFill style={{justifyContent: 'flex-start', alignItems: 'center', paddingTop: H * 0.56}}>
        <TypeReveal text={hook} startAt={58} fontSize={68 * u} fontWeight={300} />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ————— Scene 2: a corridor ignites, luminaire by luminaire —————
const SceneCorridor: React.FC<{line2: string}> = ({line2}) => {
  const {H, u} = useUnit();
  return (
    <AbsoluteFill style={{backgroundColor: '#000'}}>
      <Corridor durationInFrames={S3 - S2} igniteAt={6} igniteStagger={6} />
      <AbsoluteFill style={{justifyContent: 'flex-end', alignItems: 'center', paddingBottom: H * 0.12}}>
        <TypeReveal text={line2} startAt={62} fontSize={76 * u} fontWeight={700} glow />
      </AbsoluteFill>
      <CinematicOverlay vignette={0.5} />
    </AbsoluteFill>
  );
};

// A line-of-light stand-in used when no catalogue photo is supplied.
const LightBar: React.FC<{width: number; u: number; on: number}> = ({width, u, on}) => (
  <div style={{position: 'relative', width, height: 260 * u}}>
    <div
      style={{
        position: 'absolute',
        left: '-6%',
        right: '-6%',
        top: 38 * u,
        height: 240 * u,
        background: `radial-gradient(ellipse 50% 100% at 50% 0%, rgba(253,176,116,${0.34 * on}) 0%, rgba(246,133,31,${0.1 * on}) 45%, rgba(246,133,31,0) 100%)`,
        filter: `blur(${14 * u}px)`,
      }}
    />
    <div
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        top: 34 * u,
        height: 10 * u,
        borderRadius: 999,
        background: '#FFF1DC',
        boxShadow: `0 0 ${24 * u * on}px ${8 * u * on}px rgba(246,133,31,0.7), 0 0 ${70 * u * on}px ${20 * u * on}px rgba(253,176,116,0.35)`,
      }}
    />
  </div>
);

// ————— Scene 3: the hero — product name and the product itself —————
const SceneHero: React.FC<{label: string; catLabel: string; photo: string | null}> = ({label, catLabel, photo}) => {
  const frame = useCurrentFrame();
  const {W, H, u, portrait} = useUnit();
  const catIn = interpolate(frame, [4, 20], [0, 1], clamp);
  const prodIn = interpolate(frame, [18, 44], [0, 1], {...clamp, easing: Easing.out(Easing.cubic)});
  const push = interpolate(frame, [0, S4 - S3], [1, 1.06], {easing: Easing.inOut(Easing.quad)});
  const sweep = interpolate(frame, [52, 104], [-20, 120], {...clamp, easing: Easing.inOut(Easing.quad)});

  const boxW = portrait ? W * 0.9 : W * 0.62;
  const boxH = portrait ? H * 0.34 : H * 0.5;

  return (
    <AbsoluteFill>
      <NavyBackdrop />
      <ParticleField count={16} opacity={0.28} seed="lc-3" />
      <AbsoluteFill style={{alignItems: 'center', paddingTop: portrait ? H * 0.14 : H * 0.08}}>
        <div
          style={{
            fontFamily: FONT,
            fontWeight: 600,
            fontSize: 28 * u,
            letterSpacing: '0.4em',
            paddingLeft: '0.4em',
            color: ORANGE_GLOW,
            textTransform: 'uppercase',
            opacity: catIn,
            transform: `translateY(${(1 - catIn) * 12 * u}px)`,
          }}
        >
          {catLabel}
        </div>
        <div style={{height: 10 * u}} />
        <TypeReveal
          text={label}
          startAt={10}
          fontSize={(portrait ? 150 : 132) * u}
          fontWeight={900}
          letterSpacing="0.06em"
          fontFamily={DISPLAY_FONT}
          glow
        />
      </AbsoluteFill>

      <AbsoluteFill
        style={{
          alignItems: 'center',
          justifyContent: portrait ? 'center' : 'flex-end',
          paddingBottom: portrait ? 0 : H * 0.08,
          paddingTop: portrait ? H * 0.16 : 0,
        }}
      >
        <div
          style={{
            width: boxW,
            height: boxH,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: prodIn,
            transform: `translateY(${(1 - prodIn) * 40 * u}px) scale(${push})`,
          }}
        >
          {photo ? (
            <div style={{position: 'relative', width: boxW, height: boxH}}>
              <Img
                src={staticFile(photo)}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'contain',
                  filter: `drop-shadow(0 ${24 * u}px ${48 * u}px rgba(0,0,0,0.55)) drop-shadow(0 0 ${36 * u}px rgba(246,133,31,0.28))`,
                }}
              />
              {/* specular sweep, masked to the product's own silhouette */}
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: `linear-gradient(105deg, transparent ${sweep - 12}%, rgba(255,241,220,0.55) ${sweep}%, transparent ${sweep + 12}%)`,
                  WebkitMaskImage: `url(${staticFile(photo)})`,
                  WebkitMaskSize: 'contain',
                  WebkitMaskRepeat: 'no-repeat',
                  WebkitMaskPosition: 'center',
                  mixBlendMode: 'screen',
                }}
              />
            </div>
          ) : (
            <LightBar width={boxW * 0.92} u={u} on={interpolate(frame, [30, 48], [0, 1], clamp)} />
          )}
        </div>
      </AbsoluteFill>
      <CinematicOverlay vignette={0.42} />
    </AbsoluteFill>
  );
};

// ————— Scene 4: how the light lands — distribution and datasheet specs —————
const SceneLight: React.FC<{specs: Array<{k: string; v: string}>}> = ({specs}) => {
  const frame = useCurrentFrame();
  const {H, u, portrait} = useUnit();
  const titleIn = interpolate(frame, [2, 16], [0, 1], clamp);
  const footIn = interpolate(frame, [60, 80], [0, 1], clamp);
  const size = (portrait ? 820 : 640) * u;

  const chips = (
    <div
      style={{
        display: 'flex',
        flexDirection: portrait ? 'row' : 'column',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: 16 * u,
        maxWidth: portrait ? '90%' : 520 * u,
      }}
    >
      {specs.map((s, i) => {
        const p = interpolate(frame, [30 + i * 7, 44 + i * 7], [0, 1], clamp);
        return (
          <div
            key={s.k}
            style={{
              fontFamily: FONT,
              fontSize: 30 * u,
              color: 'rgba(255,255,255,0.92)',
              background: 'rgba(255,255,255,0.07)',
              border: '1px solid rgba(255,255,255,0.16)',
              borderRadius: 14 * u,
              padding: `${12 * u}px ${24 * u}px`,
              opacity: p,
              transform: `translateX(${(1 - p) * 24 * u}px)`,
            }}
          >
            <span style={{fontWeight: 300, opacity: 0.7}}>{s.k} </span>
            <span style={{fontWeight: 700}}>{s.v}</span>
          </div>
        );
      })}
    </div>
  );

  return (
    <AbsoluteFill>
      <NavyBackdrop />
      <AbsoluteFill style={{alignItems: 'center', paddingTop: portrait ? H * 0.12 : H * 0.07}}>
        <div
          style={{
            fontFamily: FONT,
            fontWeight: 600,
            fontSize: 28 * u,
            letterSpacing: '0.34em',
            paddingLeft: '0.34em',
            color: ORANGE_GLOW,
            textTransform: 'uppercase',
            opacity: titleIn,
          }}
        >
          Light distribution
        </div>
      </AbsoluteFill>
      <AbsoluteFill
        style={{
          flexDirection: portrait ? 'column' : 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 80 * u,
          paddingTop: portrait ? 0 : H * 0.06,
        }}
      >
        <Photometric profile="linear" size={size} startAt={4} drawFrames={40} showReadout={false} />
        {specs.length > 0 ? chips : null}
      </AbsoluteFill>
      <AbsoluteFill style={{alignItems: 'center', justifyContent: 'flex-end', paddingBottom: H * 0.06}}>
        <div
          style={{
            fontFamily: FONT,
            fontWeight: 300,
            fontSize: 22 * u,
            letterSpacing: '0.08em',
            color: 'rgba(255,255,255,0.5)',
            opacity: footIn,
          }}
        >
          Illustrative distribution · full photometrics in the datasheet
        </div>
      </AbsoluteFill>
      <CinematicOverlay vignette={0.45} />
    </AbsoluteFill>
  );
};

// ————— Scene 5: end card —————
const SceneEnd: React.FC<{label: string; catLabel: string; productUrl: string}> = ({label, catLabel, productUrl}) => {
  const frame = useCurrentFrame();
  const {u, portrait} = useUnit();
  const nameIn = interpolate(frame, [30, 46], [0, 1], clamp);
  const ctaIn = interpolate(frame, [44, 62], [0, 1], clamp);
  const rule = interpolate(frame, [26, 52], [0, 1], {...clamp, easing: Easing.inOut(Easing.cubic)});

  return (
    <AbsoluteFill>
      <NightBackdrop lift={0.6} />
      <ParticleField count={14} opacity={0.25} seed="lc-5" />
      <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center', gap: 28 * u}}>
        <NLCLogo height={(portrait ? 200 : 180) * u} variant="reversed" revealAt={4} revealFrames={24} />
        <div style={{width: 520 * u * rule, height: 2 * u, background: `linear-gradient(90deg, transparent, ${ORANGE}, transparent)`}} />
        <div
          style={{
            fontFamily: FONT,
            fontWeight: 600,
            fontSize: 40 * u,
            letterSpacing: '0.14em',
            color: WHITE,
            opacity: nameIn,
            transform: `translateY(${(1 - nameIn) * 10 * u}px)`,
          }}
        >
          {label} <span style={{color: ORANGE_GLOW, fontWeight: 300}}>·</span> {catLabel}
        </div>
        <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 * u, opacity: ctaIn}}>
          <div style={{fontFamily: FONT, fontWeight: 300, fontSize: 28 * u, letterSpacing: '0.1em', color: 'rgba(255,255,255,0.75)'}}>
            Download the datasheet
          </div>
          <div style={{fontFamily: FONT, fontWeight: 700, fontSize: 38 * u, color: ORANGE_GLOW}}>{productUrl || SITE}</div>
        </div>
      </AbsoluteFill>
      <CinematicOverlay vignette={0.5} />
    </AbsoluteFill>
  );
};

export const LinearCommercial: React.FC<LinearCommercialProps> = ({label, catLabel, photo, specs, hook, line2, productUrl}) => {
  loadBrandFonts();
  return (
    <AbsoluteFill style={{backgroundColor: '#000'}}>
      <Sequence from={S1} durationInFrames={S2 - S1}>
        <SceneLine hook={hook} />
      </Sequence>
      <Sequence from={S2} durationInFrames={S3 - S2}>
        <SceneCorridor line2={line2} />
      </Sequence>
      <Sequence from={S3} durationInFrames={S4 - S3}>
        <SceneHero label={label} catLabel={catLabel} photo={photo} />
      </Sequence>
      <Sequence from={S4} durationInFrames={S5 - S4}>
        <SceneLight specs={specs} />
      </Sequence>
      <Sequence from={S5} durationInFrames={LINEAR_COMMERCIAL_FRAMES - S5}>
        <SceneEnd label={label} catLabel={catLabel} productUrl={productUrl} />
      </Sequence>
      <LightSweep at={S2} />
      <LightSweep at={S3} />
      <LightSweep at={S5} />
    </AbsoluteFill>
  );
};
