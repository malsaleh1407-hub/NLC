import React from 'react';
import {useCurrentFrame} from 'remotion';

// Rotating volumetric light rays radiating from a point.
export const LightRays: React.FC<{
  cx: number;
  cy: number;
  radius: number;
  rays?: number;
  color?: string;
  opacity?: number;
  speed?: number;
}> = ({cx, cy, radius, rays = 12, color = 'rgba(246,133,31,0.16)', opacity = 1, speed = 0.15}) => {
  const frame = useCurrentFrame();
  const rotation = frame * speed;

  return (
    <svg
      style={{position: 'absolute', inset: 0, opacity}}
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      width="100%"
      height="100%"
    >
      <g transform={`translate(${cx} ${cy}) rotate(${rotation})`}>
        {Array.from({length: rays}).map((_, i) => {
          const angle = (i * 360) / rays;
          const w = 3 + (i % 3) * 2;
          return (
            <path
              key={i}
              d={`M 0 0 L ${-w / 2} ${-radius} L ${w / 2} ${-radius} Z`}
              fill={color}
              transform={`rotate(${angle})`}
            />
          );
        })}
      </g>
    </svg>
  );
};
