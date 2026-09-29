import React from 'react';
import {Easing, interpolate, useCurrentFrame} from 'remotion';
import {FONT, NAVY, ORANGE, ORANGE_GLOW, WHITE} from '../brand';

// Simplified Saudi Arabia outline in real lon/lat, projected to a 100×100 box.
const LON0 = 34.0;
const LON1 = 56.0;
const LAT0 = 32.8;
const LAT1 = 15.8;
const px = (lon: number) => ((lon - LON0) / (LON1 - LON0)) * 100;
const py = (lat: number) => ((LAT0 - lat) / (LAT0 - LAT1)) * 100;

const BORDER: Array<[number, number]> = [
  [34.85, 29.35], [36.7, 31.0], [37.5, 31.5], [38.8, 32.15], [40.4, 31.9],
  [42.1, 31.1], [44.7, 29.2], [46.4, 29.1], [47.7, 28.5], [48.45, 28.55],
  [48.8, 27.7], [49.6, 27.1], [50.2, 26.5], [50.15, 25.9], [50.8, 25.0],
  [51.6, 24.6], [52.6, 23.0], [55.2, 22.7], [55.6, 20.0], [52.0, 19.0],
  [49.0, 18.6], [47.0, 17.4], [45.0, 17.4], [43.4, 17.3], [43.2, 16.7],
  [42.8, 16.4], [41.9, 17.6], [41.0, 19.0], [40.0, 20.3], [39.1, 21.4],
  [38.4, 22.6], [37.5, 24.2], [36.6, 25.5], [35.8, 27.0], [35.1, 28.2],
];

type City = {name: string; lon: number; lat: number; label?: boolean; big?: boolean};

export const CITIES: City[] = [
  {name: 'NEOM', lon: 35.3, lat: 28.0, label: true, big: true},
  {name: 'Tabuk', lon: 36.57, lat: 28.38},
  {name: 'AlUla', lon: 37.92, lat: 26.61},
  {name: 'Hail', lon: 41.69, lat: 27.52},
  {name: 'Yanbu', lon: 38.06, lat: 24.09},
  {name: 'Madinah', lon: 39.61, lat: 24.47, label: true},
  {name: 'Qassim', lon: 43.98, lat: 26.36},
  {name: 'Jeddah', lon: 39.2, lat: 21.54, label: true, big: true},
  {name: 'Makkah', lon: 39.83, lat: 21.42},
  {name: 'Taif', lon: 40.42, lat: 21.27},
  {name: 'Riyadh', lon: 46.72, lat: 24.71, label: true, big: true},
  {name: 'Jubail', lon: 49.66, lat: 27.01},
  {name: 'Dammam', lon: 50.1, lat: 26.43, label: true, big: true},
  {name: 'Al Ahsa', lon: 49.59, lat: 25.38},
  {name: 'Abha', lon: 42.51, lat: 18.22},
  {name: 'Jazan', lon: 42.55, lat: 16.89},
  {name: 'Najran', lon: 44.22, lat: 17.49},
];

export const SaudiMap: React.FC<{
  size: number;
  drawStart?: number;
  drawFrames?: number;
  igniteStart?: number;
}> = ({size, drawStart = 0, drawFrames = 55, igniteStart = 46}) => {
  const frame = useCurrentFrame();

  const outline = `M ${BORDER.map(([lo, la]) => `${px(lo).toFixed(2)} ${py(la).toFixed(2)}`).join(' L ')} Z`;

  const draw = interpolate(frame, [drawStart, drawStart + drawFrames], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.inOut(Easing.cubic),
  });
  const fill = interpolate(frame, [drawStart + drawFrames - 12, drawStart + drawFrames + 16], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <svg viewBox="0 0 100 100" width={size} height={size} style={{overflow: 'visible'}}>
      <defs>
        <linearGradient id="ksaFill" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={NAVY} stopOpacity={0.85} />
          <stop offset="100%" stopColor="#0d1030" stopOpacity={0.95} />
        </linearGradient>
        <radialGradient id="cityGlow">
          <stop offset="0%" stopColor={ORANGE_GLOW} stopOpacity={0.75} />
          <stop offset="100%" stopColor={ORANGE} stopOpacity={0} />
        </radialGradient>
      </defs>

      <path d={outline} fill="url(#ksaFill)" opacity={fill} />
      <path
        d={outline}
        fill="none"
        stroke={ORANGE}
        strokeWidth={0.55}
        strokeLinejoin="round"
        pathLength={1000}
        strokeDasharray={1000}
        strokeDashoffset={1000 * (1 - draw)}
        style={{filter: 'drop-shadow(0 0 1.4px rgba(246,133,31,0.9))'}}
      />

      {CITIES.map((c, i) => {
        const x = px(c.lon);
        const y = py(c.lat);
        const at = igniteStart + i * 5;
        const on = interpolate(frame, [at, at + 12], [0, 1], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
          easing: Easing.out(Easing.cubic),
        });
        if (on <= 0.001) return null;
        // Expanding ping ring at the moment of ignition
        const ringT = interpolate(frame, [at, at + 34], [0, 1], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
        });
        const r = c.big ? 1.15 : 0.75;
        const twinkle = 0.82 + 0.18 * Math.sin((frame + i * 23) / 11);
        return (
          <g key={c.name}>
            <circle cx={x} cy={y} r={r * 7 * on} fill="url(#cityGlow)" opacity={0.5 * on} />
            {ringT < 1 ? (
              <circle
                cx={x}
                cy={y}
                r={r + ringT * 7}
                fill="none"
                stroke={ORANGE_GLOW}
                strokeWidth={0.35}
                opacity={(1 - ringT) * 0.85}
              />
            ) : null}
            <circle cx={x} cy={y} r={r * on} fill={WHITE} opacity={twinkle} />
            {c.label ? (
              <text
                x={x + r + 1.4}
                y={y + 0.7}
                fill={WHITE}
                fillOpacity={0.9 * on}
                fontSize={c.big ? 2.6 : 2.2}
                fontFamily={FONT}
                fontWeight={c.big ? 700 : 500}
              >
                {c.name}
              </text>
            ) : null}
          </g>
        );
      })}
    </svg>
  );
};
