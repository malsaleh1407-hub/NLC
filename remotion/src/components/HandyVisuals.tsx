import React from 'react';
import {Easing, Img, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {FONT, ORANGE, ORANGE_GLOW} from '../brand';

const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

// ————— The real product photo, with a lit diffuser —————
// public/products/handy.png is the NLC catalogue shot (transparent background).
// HANDY and HANDY ECO share the same housing, so one photo serves both.
// The diffuser sits at ~50% / 66% of the frame, ~59% × 54% in size.
export const HandyProduct: React.FC<{
  width: number;
  glow: number;
  brightness?: number;
  style?: React.CSSProperties;
}> = ({width, glow, brightness = 1, style}) => {
  const height = width * 0.6; // 1600×960 source
  return (
    <div style={{position: 'relative', width, height, ...style}}>
      {/* Warm bloom spilling around the fixture */}
      <div
        style={{
          position: 'absolute',
          left: '50%',
          top: '64%',
          width: width * 1.25,
          height: width * 0.95,
          transform: 'translate(-50%, -50%)',
          borderRadius: '50%',
          background:
            'radial-gradient(ellipse at center, rgba(255,222,176,0.42) 0%, rgba(246,133,31,0.16) 38%, rgba(246,133,31,0) 68%)',
          opacity: glow,
        }}
      />
      <Img
        src={staticFile('products/handy.png')}
        style={{position: 'absolute', inset: 0, width: '100%', height: '100%', filter: `brightness(${brightness})`}}
      />
      {/* Lit diffuser */}
      <div
        style={{
          position: 'absolute',
          left: '50%',
          top: '63.5%',
          width: '59%',
          height: '57%',
          transform: 'translate(-50%, -50%)',
          borderRadius: '50%',
          background:
            'radial-gradient(ellipse at center, #FFFDF7 0%, #FFF6E6 52%, rgba(255,240,218,0.75) 78%, rgba(255,236,210,0) 100%)',
          mixBlendMode: 'screen',
          opacity: glow,
        }}
      />
    </div>
  );
};

// ————— SMD2835 LED ring layout shared by both boards —————
type Ring = {r: number; n: number};

const LedRings: React.FC<{
  cx: number;
  cy: number;
  rings: Ring[];
  litStart: number;
}> = ({cx, cy, rings, litStart}) => {
  const frame = useCurrentFrame();
  const leds: React.ReactNode[] = [];
  const glows: React.ReactNode[] = [];
  rings.forEach((ring, ri) => {
    for (let i = 0; i < ring.n; i++) {
      const a = (i / ring.n) * Math.PI * 2 + ri * 0.35;
      const x = cx + Math.cos(a) * ring.r;
      const y = cy + Math.sin(a) * ring.r;
      const deg = (a * 180) / Math.PI + 90;
      const t0 = litStart + ri * 7 + (i / ring.n) * 16;
      const lit = interpolate(frame, [t0, t0 + 8], [0, 1], clamp);
      leds.push(
        <g key={`l${ri}-${i}`} transform={`translate(${x} ${y}) rotate(${deg})`}>
          <rect x={-10} y={-12} width={20} height={24} rx={2.5} fill="#F4F4EF" stroke="#C9CDD4" strokeWidth={1} />
          <rect x={-7.5} y={-8.5} width={15} height={17} rx={1.5} fill={lit > 0.5 ? '#FFF9EA' : '#E7C35E'} />
        </g>,
      );
      glows.push(<circle key={`g${ri}-${i}`} cx={x} cy={y} r={20} fill="url(#ledGlow)" opacity={lit * 0.95} />);
    }
  });
  return (
    <>
      <g>{leds}</g>
      <g style={{mixBlendMode: 'screen'}}>{glows}</g>
    </>
  );
};

const LedGlowDef: React.FC = () => (
  <radialGradient id="ledGlow">
    <stop offset="0%" stopColor="#FFFFFF" stopOpacity={1} />
    <stop offset="35%" stopColor="#FFF1D6" stopOpacity={0.85} />
    <stop offset="100%" stopColor="#FFD9A0" stopOpacity={0} />
  </radialGradient>
);

const Callout: React.FC<{
  from: [number, number];
  to: [number, number];
  label: string;
  sub?: string;
  anchor?: 'start' | 'end' | 'middle';
  progress: number;
}> = ({from, to, label, sub, anchor = 'start', progress}) => {
  const [x1, y1] = from;
  const [x2, y2] = to;
  const dx = anchor === 'end' ? -10 : anchor === 'start' ? 10 : 0;
  // Beside the leader end for start/end anchors; above/below it when centred.
  const textY = anchor !== 'middle' ? y2 + 8 : y2 < y1 ? y2 - 14 - (sub ? 32 : 0) : y2 + 30;
  return (
    <g opacity={progress}>
      <circle cx={x1} cy={y1} r={6} fill={ORANGE} />
      <line
        x1={x1}
        y1={y1}
        x2={x1 + (x2 - x1) * progress}
        y2={y1 + (y2 - y1) * progress}
        stroke={ORANGE}
        strokeWidth={2.5}
      />
      <text
        x={x2 + dx}
        y={textY}
        textAnchor={anchor}
        fontFamily={FONT}
        fontWeight={700}
        fontSize={28}
        fill="#FFFFFF"
      >
        {label}
      </text>
      {sub ? (
        <text
          x={x2 + dx}
          y={textY + 32}
          textAnchor={anchor}
          fontFamily={FONT}
          fontWeight={400}
          fontSize={21}
          fill={ORANGE_GLOW}
        >
          {sub}
        </text>
      ) : null}
    </g>
  );
};

const Chip: React.FC<{x: number; y: number; w: number; h: number; glow: number}> = ({x, y, w, h, glow}) => {
  const pins = 4;
  const pitch = w / (pins + 1);
  return (
    <g>
      {Array.from({length: pins}).map((_, i) => (
        <React.Fragment key={i}>
          <rect x={x + pitch * (i + 1) - 2.5} y={y - 6} width={5} height={7} fill="#C7CCD3" />
          <rect x={x + pitch * (i + 1) - 2.5} y={y + h - 1} width={5} height={7} fill="#C7CCD3" />
        </React.Fragment>
      ))}
      <rect
        x={x}
        y={y}
        width={w}
        height={h}
        rx={3}
        fill="#1B1D22"
        stroke={glow > 0 ? ORANGE : '#1B1D22'}
        strokeWidth={2 * glow}
        style={{filter: glow > 0 ? `drop-shadow(0 0 ${10 * glow}px rgba(246,133,31,0.9))` : undefined}}
      />
      <circle cx={x + 7} cy={y + 7} r={2.5} fill="#4A4E57" />
    </g>
  );
};

// ————— HANDY ECO: Driver on Board —————
// Top-down view of the round aluminium LED board. The driver ICs sit in the
// middle of the same board as the LEDs, so there is no separate driver box.
export const DobBoard: React.FC<{width: number; appearAt?: number}> = ({width, appearAt = 0}) => {
  const frame = useCurrentFrame();
  const f = frame - appearAt;
  const cx = 400;
  const cy = 330;
  const R = 262;
  const appear = interpolate(f, [0, 22], [0, 1], {...clamp, easing: Easing.out(Easing.cubic)});
  const driverGlow = interpolate(f, [70, 84], [0, 1], clamp) * (0.75 + 0.25 * Math.sin(f / 5));
  const ring = interpolate(f, [70, 92], [0, 1], clamp);
  const callLed = interpolate(f, [52, 68], [0, 1], clamp);
  const callDrv = interpolate(f, [84, 100], [0, 1], clamp);

  return (
    <svg
      viewBox="0 0 800 700"
      width={width}
      height={(width * 700) / 800}
      style={{overflow: 'visible', opacity: appear, transform: `scale(${0.9 + 0.1 * appear})`}}
    >
      <defs>
        <LedGlowDef />
        <radialGradient id="dobBoard" cx="45%" cy="40%">
          <stop offset="0%" stopColor="#F3F5F8" />
          <stop offset="100%" stopColor="#CDD2DA" />
        </radialGradient>
      </defs>

      {/* Board */}
      <circle cx={cx} cy={cy} r={R + 8} fill="#9BA3AF" />
      <circle cx={cx} cy={cy} r={R} fill="url(#dobBoard)" />
      <circle cx={cx - R + 26} cy={cy} r={8} fill="#8A929E" />
      <circle cx={cx + R - 26} cy={cy} r={8} fill="#8A929E" />

      {/* Copper traces from the driver to the LED strings */}
      {[0, 1, 2, 3, 4, 5].map((i) => {
        const a = (i / 6) * Math.PI * 2 + 0.5;
        return (
          <line
            key={i}
            x1={cx + Math.cos(a) * 92}
            y1={cy + Math.sin(a) * 92}
            x2={cx + Math.cos(a) * 128}
            y2={cy + Math.sin(a) * 128}
            stroke="#C9A45C"
            strokeWidth={3}
            opacity={0.7}
          />
        );
      })}
      <circle cx={cx} cy={cy} r={236} fill="none" stroke="#C9A45C" strokeWidth={1.5} opacity={0.35} />
      <circle cx={cx} cy={cy} r={164} fill="none" stroke="#C9A45C" strokeWidth={1.5} opacity={0.35} />

      <LedRings cx={cx} cy={cy} rings={[{r: 222, n: 30}, {r: 180, n: 24}, {r: 138, n: 18}]} litStart={appearAt + 24} />

      {/* On-board driver: ICs, bridge rectifier, resistors, input pads */}
      <Chip x={cx - 62} y={cy - 52} w={50} h={30} glow={driverGlow} />
      <Chip x={cx + 12} y={cy - 52} w={50} h={30} glow={driverGlow} />
      <Chip x={cx - 25} y={cy + 2} w={50} h={30} glow={driverGlow} />
      <rect x={cx - 74} y={cy + 4} width={30} height={26} rx={3} fill="#24262C" />
      <rect x={cx + 42} y={cy + 6} width={20} height={9} rx={2} fill="#2B2B2B" stroke="#BFC4CC" strokeWidth={2} />
      <rect x={cx + 42} y={cy + 22} width={20} height={9} rx={2} fill="#2B2B2B" stroke="#BFC4CC" strokeWidth={2} />
      <circle cx={cx - 16} cy={cy + 62} r={9} fill="#C9A45C" />
      <circle cx={cx + 16} cy={cy + 62} r={9} fill="#C9A45C" />
      <text x={cx - 16} y={cy + 88} textAnchor="middle" fontFamily={FONT} fontWeight={700} fontSize={14} fill="#6B7280">
        L
      </text>
      <text x={cx + 16} y={cy + 88} textAnchor="middle" fontFamily={FONT} fontWeight={700} fontSize={14} fill="#6B7280">
        N
      </text>

      {/* Driver zone highlight */}
      <circle
        cx={cx}
        cy={cy}
        r={104}
        fill="none"
        stroke={ORANGE}
        strokeWidth={4}
        strokeDasharray="12 10"
        strokeDashoffset={-f * 1.2}
        opacity={ring}
      />

      <Callout from={[cx - 157, cy - 157]} to={[cx - 157, 64]} label="SMD2835 LEDs" anchor="middle" progress={callLed} />
      <Callout
        from={[cx + 74, cy + 74]}
        to={[640, 660]}
        label="Driver on the same board"
        sub="no separate driver box"
        anchor="middle"
        progress={callDrv}
      />
    </svg>
  );
};

// ————— HANDY: External driver —————
// LED board carries only LEDs; power comes from a dedicated driver outside
// the luminaire, connected by cable.
export const ExternalDriverRig: React.FC<{width: number; appearAt?: number}> = ({width, appearAt = 0}) => {
  const frame = useCurrentFrame();
  const f = frame - appearAt;
  const cx = 300;
  const cy = 300;
  const R = 232;
  const appear = interpolate(f, [0, 22], [0, 1], {...clamp, easing: Easing.out(Easing.cubic)});
  const cable = interpolate(f, [48, 74], [0, 1], {...clamp, easing: Easing.inOut(Easing.cubic)});
  const box = interpolate(f, [60, 82], [0, 1], {...clamp, easing: Easing.out(Easing.back(1.4))});
  const flow = interpolate(f, [80, 92], [0, 1], clamp);
  const callBoard = interpolate(f, [40, 56], [0, 1], clamp);
  const callDrv = interpolate(f, [86, 102], [0, 1], clamp);
  const cablePath = `M ${cx} ${cy} C ${cx + 150} ${cy + 10}, 560 ${cy + 170}, 640 540`;

  return (
    <svg
      viewBox="0 0 900 700"
      width={width}
      height={(width * 700) / 900}
      style={{overflow: 'visible', opacity: appear, transform: `scale(${0.9 + 0.1 * appear})`}}
    >
      <defs>
        <LedGlowDef />
        <radialGradient id="extBoard" cx="45%" cy="40%">
          <stop offset="0%" stopColor="#F3F5F8" />
          <stop offset="100%" stopColor="#CDD2DA" />
        </radialGradient>
        <linearGradient id="drvBox" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#3A3F4B" />
          <stop offset="100%" stopColor="#23262E" />
        </linearGradient>
      </defs>

      <circle cx={cx} cy={cy} r={R + 8} fill="#9BA3AF" />
      <circle cx={cx} cy={cy} r={R} fill="url(#extBoard)" />
      <circle cx={cx} cy={cy} r={206} fill="none" stroke="#C9A45C" strokeWidth={1.5} opacity={0.35} />
      <circle cx={cx} cy={cy} r={120} fill="none" stroke="#C9A45C" strokeWidth={1.5} opacity={0.35} />
      <LedRings
        cx={cx}
        cy={cy}
        rings={[{r: 196, n: 28}, {r: 154, n: 22}, {r: 112, n: 16}, {r: 70, n: 10}]}
        litStart={appearAt + 90}
      />
      {/* 2-pin input connector — the board has no driver components */}
      <rect x={cx - 20} y={cy - 13} width={40} height={26} rx={4} fill="#F7F7F4" stroke="#AEB4BD" strokeWidth={2} />

      {/* Cable to the external driver */}
      <path d={cablePath} fill="none" stroke="#15171C" strokeWidth={12} strokeLinecap="round" pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - cable} />
      <path d={cablePath} fill="none" stroke="#3A3F4B" strokeWidth={4} strokeLinecap="round" pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - cable} />
      <path
        d={cablePath}
        fill="none"
        stroke={ORANGE_GLOW}
        strokeWidth={5}
        strokeLinecap="round"
        strokeDasharray="10 34"
        strokeDashoffset={f * 2.6}
        opacity={flow}
        style={{filter: 'drop-shadow(0 0 6px rgba(246,133,31,0.9))'}}
      />

      {/* Driver box */}
      <g opacity={box} transform={`translate(${760} ${560}) scale(${0.8 + 0.2 * box}) translate(${-760} ${-560})`}>
        <rect x={604} y={508} width={20} height={40} rx={4} fill="#2B2F38" />
        <rect x={896} y={508} width={20} height={40} rx={4} fill="#2B2F38" />
        <rect x={620} y={492} width={280} height={136} rx={14} fill="url(#drvBox)" stroke="#4B5160" strokeWidth={2} />
        <text x={760} y={548} textAnchor="middle" fontFamily={FONT} fontWeight={700} fontSize={30} letterSpacing={3} fill="#FFFFFF">
          LED DRIVER
        </text>
        <text x={760} y={582} textAnchor="middle" fontFamily={FONT} fontWeight={400} fontSize={18} fill="rgba(255,255,255,0.6)">
          220–240 VAC · 50/60 Hz
        </text>
        <circle cx={876} cy={512} r={6} fill={ORANGE} opacity={flow} style={{filter: 'drop-shadow(0 0 6px rgba(246,133,31,1))'}} />
      </g>

      <Callout from={[cx - 150, cy - 150]} to={[cx - 150, 70]} label="LED board" sub="LEDs only" anchor="middle" progress={callBoard} />
      <Callout from={[760, 492]} to={[760, 420]} label="External driver" anchor="middle" progress={callDrv} />
    </svg>
  );
};
