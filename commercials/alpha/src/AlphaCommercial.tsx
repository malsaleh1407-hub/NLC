import React from 'react';
import {
  AbsoluteFill,
  Easing,
  Img,
  Sequence,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import {BODY, DISPLAY, NAVY, NAVY_DEEP, NIGHT, ORANGE, ORANGE_SOFT, SITE, WHITE} from './brand';
import {loadBrandFonts} from './fonts';
import {NLCLogo} from './NLCLogo';

loadBrandFonts();

// ---------------------------------------------------------------------------
// Timeline: 6 Gemini stills x 4.5 s (0.5 s dissolves) + 6 s end card = 30 s.
// ---------------------------------------------------------------------------
export const FPS = 30;
export const SCENE = 135; // frames each still is on screen
export const XFADE = 15; // dissolve overlap
export const STEP = SCENE - XFADE;
export const END_CARD = 180;
export const SCENE_COUNT = 6;
export const END_START = STEP * SCENE_COUNT;
export const DURATION = END_START + END_CARD; // 900 frames = 30 s

export type Scene = {
  /** Still URL (Higgsfield CDN) or a path under public/. Missing = labelled placeholder. */
  src?: string;
  label: string;
  kicker: string;
  value: string;
  caption: string;
  /** Ken Burns: start/end scale, horizontal drift in px, transform origin in %. */
  zoom?: [number, number];
  drift?: [number, number];
  origin?: [number, number];
};

export type AlphaProps = {
  scenes: Scene[];
  /** Gemini still URLs, one per scene in order; overrides scenes[i].src. */
  stills?: string[];
  /** Real product cut-out (transparent PNG) for the end card. */
  productSrc?: string;
  /** Master logo file (e.g. brand/logo-white.svg). Falls back to the vector component. */
  logoSrc?: string;
  /** Brand honesty rule: AI stills of NLC products in client settings are captioned as concept. */
  conceptTag: boolean;
  endTagline: string;
  specs: string[];
  footnote: string;
};

const resolve = (src: string) => (/^https?:\/\//.test(src) ? src : staticFile(src));

const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

// --- Still with a slow, confident camera move -------------------------------
const KenBurns: React.FC<{scene: Scene; ignite?: boolean}> = ({scene, ignite}) => {
  const frame = useCurrentFrame();
  const {zoom = [1.04, 1.14], drift = [0, 0], origin = [50, 50]} = scene;
  const t = interpolate(frame, [0, SCENE], [0, 1], clamp);
  const scale = zoom[0] + (zoom[1] - zoom[0]) * t;
  const x = drift[0] + (drift[1] - drift[0]) * t;
  // Hero open: the fixture ignites out of black.
  const brightness = ignite ? interpolate(frame, [0, 42], [0.15, 1], {...clamp, easing: Easing.out(Easing.cubic)}) : 1;

  return (
    <AbsoluteFill style={{overflow: 'hidden', backgroundColor: NIGHT}}>
      <AbsoluteFill
        style={{
          transform: `translateX(${x}px) scale(${scale})`,
          transformOrigin: `${origin[0]}% ${origin[1]}%`,
          filter: `brightness(${brightness})`,
        }}
      >
        {scene.src ? (
          <Img src={resolve(scene.src)} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
        ) : (
          <Placeholder label={scene.label} />
        )}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// Local-preview stand-in until the Gemini stills exist.
const Placeholder: React.FC<{label: string}> = ({label}) => (
  <AbsoluteFill
    style={{
      background: `radial-gradient(ellipse at 62% 38%, #3a3f86 0%, ${NAVY} 35%, ${NAVY_DEEP} 75%)`,
      alignItems: 'center',
      justifyContent: 'center',
    }}
  >
    <div
      style={{
        position: 'absolute',
        left: '62%',
        top: '30%',
        width: 180,
        height: 180,
        marginLeft: -90,
        borderRadius: '50%',
        border: '26px solid #f2f2f2',
        background: 'radial-gradient(circle, #fff6d8 0%, #f3c46b 14%, #b9bcc4 22%, #6f737d 70%)',
        boxShadow: `0 0 120px 40px rgba(246,133,31,0.35)`,
      }}
    />
    <div style={{fontFamily: BODY, fontSize: 30, letterSpacing: 4, color: 'rgba(255,255,255,0.45)', marginTop: 420}}>
      {label.toUpperCase()} · GEMINI STILL PENDING
    </div>
  </AbsoluteFill>
);

// --- Legibility scrim + vignette --------------------------------------------
const Grade: React.FC = () => (
  <AbsoluteFill style={{pointerEvents: 'none'}}>
    <AbsoluteFill
      style={{
        background: `linear-gradient(90deg, rgba(10,12,38,0.78) 0%, rgba(10,12,38,0.35) 38%, rgba(10,12,38,0) 60%)`,
      }}
    />
    <AbsoluteFill
      style={{background: 'radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,0.55) 100%)'}}
    />
  </AbsoluteFill>
);

const ConceptTag: React.FC = () => (
  <div
    style={{
      position: 'absolute',
      right: 64,
      bottom: 48,
      fontFamily: BODY,
      fontWeight: 400,
      fontSize: 17,
      letterSpacing: 3,
      color: 'rgba(255,255,255,0.62)',
      textTransform: 'uppercase',
    }}
  >
    Concept visualisation
  </div>
);

// --- Animated lower-third super ----------------------------------------------
const useRise = (delay: number) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const s = spring({frame: frame - delay, fps, config: {damping: 200, mass: 0.9}});
  const out = interpolate(frame, [SCENE - 24, SCENE - 6], [1, 0], clamp);
  return {opacity: s * out, transform: `translateY(${(1 - s) * 28}px)`};
};

const Super: React.FC<{scene: Scene}> = ({scene}) => {
  const frame = useCurrentFrame();
  const rule = interpolate(frame, [14, 40], [0, 72], {...clamp, easing: Easing.out(Easing.cubic)});
  const ruleOut = interpolate(frame, [SCENE - 24, SCENE - 6], [1, 0], clamp);
  return (
    <div style={{position: 'absolute', left: 128, bottom: 150, color: WHITE}}>
      <div style={{width: rule, height: 4, background: ORANGE, marginBottom: 26, opacity: ruleOut}} />
      <div
        style={{
          ...useRise(16),
          fontFamily: BODY,
          fontWeight: 600,
          fontSize: 22,
          letterSpacing: 7,
          color: ORANGE,
          textTransform: 'uppercase',
        }}
      >
        {scene.kicker}
      </div>
      <div
        style={{
          ...useRise(22),
          fontFamily: DISPLAY,
          fontWeight: 900,
          fontSize: 112,
          lineHeight: 1.05,
          marginTop: 14,
          letterSpacing: 1,
        }}
      >
        {scene.value}
      </div>
      <div
        style={{
          ...useRise(30),
          fontFamily: BODY,
          fontWeight: 300,
          fontSize: 34,
          marginTop: 12,
          color: 'rgba(255,255,255,0.88)',
        }}
      >
        {scene.caption}
      </div>
    </div>
  );
};

// Opening title over the hero macro.
const HeroTitle: React.FC<{scene: Scene}> = ({scene}) => {
  const frame = useCurrentFrame();
  const track = interpolate(frame, [30, SCENE], [26, 16], clamp);
  return (
    <div style={{position: 'absolute', left: 128, top: 0, bottom: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center', color: WHITE}}>
      <div style={{...useRise(26), fontFamily: BODY, fontWeight: 600, fontSize: 24, letterSpacing: 8, color: ORANGE, textTransform: 'uppercase'}}>
        {scene.kicker}
      </div>
      <div style={{...useRise(34), fontFamily: DISPLAY, fontWeight: 900, fontSize: 196, lineHeight: 1, letterSpacing: track, marginTop: 10}}>
        {scene.value}
      </div>
      <div style={{...useRise(46), fontFamily: BODY, fontWeight: 300, fontSize: 40, marginTop: 18, color: 'rgba(255,255,255,0.9)'}}>
        {scene.caption}
      </div>
    </div>
  );
};

const SceneBlock: React.FC<{scene: Scene; index: number; conceptTag: boolean}> = ({scene, index, conceptTag}) => {
  const frame = useCurrentFrame();
  const fadeIn = index === 0 ? 1 : interpolate(frame, [0, XFADE], [0, 1], clamp);
  return (
    <AbsoluteFill style={{opacity: fadeIn}}>
      <KenBurns scene={scene} ignite={index === 0} />
      <Grade />
      {index === 0 ? <HeroTitle scene={scene} /> : <Super scene={scene} />}
      {conceptTag && index > 0 ? <ConceptTag /> : null}
    </AbsoluteFill>
  );
};

// --- Warm light sweep that carries us into the end card -------------------------
const LightSweep: React.FC = () => {
  const frame = useCurrentFrame();
  const o = interpolate(frame, [0, 8, 26], [0, 0.85, 0], clamp);
  if (o <= 0.01) return null;
  return (
    <AbsoluteFill
      style={{
        opacity: o,
        background: `radial-gradient(circle at 71% 47%, #FFF4E0 0%, ${ORANGE_SOFT} 24%, rgba(246,133,31,0.35) 52%, transparent 78%)`,
      }}
    />
  );
};

// --- End card: real product photo, specs, logo, CTA -------------------------------
const EndCard: React.FC<{productSrc?: string; logoSrc?: string; tagline: string; specs: string[]; footnote: string}> = ({
  productSrc,
  logoSrc,
  tagline,
  specs,
  footnote,
}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const bgIn = interpolate(frame, [0, XFADE], [0, 1], clamp);
  const prod = spring({frame: frame - 6, fps, config: {damping: 200, mass: 1.2}});
  const float = Math.sin(frame / 30) * 6;
  const glow = interpolate(frame, [0, 40], [0.2, 1], clamp);
  const logoWipe = interpolate(frame, [70, 100], [0, 100], {...clamp, easing: Easing.inOut(Easing.cubic)});

  const rise = (delay: number) => {
    const s = spring({frame: frame - delay, fps, config: {damping: 200}});
    return {opacity: s, transform: `translateY(${(1 - s) * 24}px)`};
  };

  return (
    <AbsoluteFill
      style={{
        opacity: bgIn,
        background: `radial-gradient(ellipse at 71% 46%, #2f357a 0%, ${NAVY} 30%, ${NAVY_DEEP} 68%, ${NIGHT} 100%)`,
      }}
    >
      {/* warm pool of light behind the fixture */}
      <div
        style={{
          position: 'absolute',
          left: '71%',
          top: '47%',
          width: 900,
          height: 900,
          marginLeft: -450,
          marginTop: -450,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(246,133,31,0.42) 0%, rgba(246,133,31,0.14) 38%, transparent 68%)',
          opacity: glow,
        }}
      />
      {/* product */}
      <div
        style={{
          position: 'absolute',
          left: '71%',
          top: '47%',
          width: 700,
          height: 620,
          marginLeft: -350,
          marginTop: -310,
          opacity: prod,
          transform: `translateY(${float + (1 - prod) * 40}px) scale(${0.94 + prod * 0.06})`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          filter: 'drop-shadow(0 30px 60px rgba(0,0,0,0.45))',
        }}
      >
        {productSrc ? (
          <Img src={resolve(productSrc)} style={{maxWidth: '100%', maxHeight: '100%', objectFit: 'contain'}} />
        ) : (
          <div style={{width: 420, height: 420, borderRadius: '50%', border: '48px solid #f4f4f4', background: 'radial-gradient(circle, #fff6d8 0%, #f3c46b 12%, #b9bcc4 20%, #6f737d 72%)'}} />
        )}
      </div>

      {/* copy */}
      <div style={{position: 'absolute', left: 128, top: 0, bottom: 0, width: 820, display: 'flex', flexDirection: 'column', justifyContent: 'center', color: WHITE}}>
        <div style={{...rise(14), fontFamily: BODY, fontWeight: 600, fontSize: 24, letterSpacing: 8, color: ORANGE, textTransform: 'uppercase'}}>
          Recessed COB Downlight
        </div>
        <div style={{...rise(20), fontFamily: DISPLAY, fontWeight: 900, fontSize: 160, lineHeight: 1, letterSpacing: 12, marginTop: 10}}>
          ALPHA
        </div>
        <div style={{...rise(28), fontFamily: BODY, fontWeight: 300, fontSize: 38, marginTop: 14, color: 'rgba(255,255,255,0.9)'}}>
          {tagline}
        </div>
        <div style={{...rise(40), display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: 44}}>
          {specs.map((s) => (
            <div
              key={s}
              style={{
                fontFamily: BODY,
                fontWeight: 600,
                fontSize: 24,
                padding: '8px 18px',
                border: `2px solid rgba(246,133,31,0.85)`,
                borderRadius: 999,
                color: WHITE,
              }}
            >
              {s}
            </div>
          ))}
        </div>
        <div style={{...rise(54), fontFamily: BODY, fontWeight: 400, fontSize: 30, marginTop: 46, color: ORANGE_SOFT}}>
          Datasheet at {SITE}
        </div>
      </div>

      {/* logo: light-wipe reveal, always full opacity (brand misuse rules) */}
      <div style={{position: 'absolute', left: 128, bottom: 70, clipPath: `inset(0 ${100 - logoWipe}% 0 0)`}}>
        {logoSrc ? (
          <Img src={resolve(logoSrc)} style={{height: 72, display: 'block'}} />
        ) : (
          <div style={{marginLeft: -14, marginBottom: -14}}>
            <NLCLogo height={72} variant="reversed" />
          </div>
        )}
      </div>

      <div
        style={{
          position: 'absolute',
          right: 64,
          bottom: 48,
          fontFamily: BODY,
          fontSize: 17,
          letterSpacing: 1,
          color: 'rgba(255,255,255,0.55)',
          ...rise(60),
        }}
      >
        {footnote}
      </div>
    </AbsoluteFill>
  );
};

export const AlphaCommercial: React.FC<AlphaProps> = ({scenes, stills, productSrc, logoSrc, conceptTag, endTagline, specs, footnote}) => {
  const cut = scenes.slice(0, SCENE_COUNT).map((scene, i) => ({...scene, src: stills?.[i] || scene.src}));
  return (
    <AbsoluteFill style={{backgroundColor: NIGHT}}>
      {cut.map((scene, i) => (
        <Sequence key={scene.label} from={i * STEP} durationInFrames={SCENE} name={scene.label}>
          <SceneBlock scene={scene} index={i} conceptTag={conceptTag} />
        </Sequence>
      ))}
      <Sequence from={END_START} durationInFrames={END_CARD} name="End card">
        <EndCard productSrc={productSrc} logoSrc={logoSrc} tagline={endTagline} specs={specs} footnote={footnote} />
      </Sequence>
      <Sequence from={END_START - 6} durationInFrames={30} name="Light sweep">
        <LightSweep />
      </Sequence>
    </AbsoluteFill>
  );
};
