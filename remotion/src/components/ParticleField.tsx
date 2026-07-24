import React from 'react';
import {interpolate, random, useCurrentFrame, useVideoConfig} from 'remotion';
import {ORANGE_GLOW} from '../brand';

// Slowly rising embers / dust motes. Deterministic via seeded random.
export const ParticleField: React.FC<{
  count?: number;
  opacity?: number;
  seed?: string;
}> = ({count = 40, opacity = 1, seed = 'embers'}) => {
  const frame = useCurrentFrame();
  const {width, height, durationInFrames} = useVideoConfig();

  return (
    <div style={{position: 'absolute', inset: 0, overflow: 'hidden'}}>
      {Array.from({length: count}).map((_, i) => {
        const rx = random(`${seed}-x-${i}`);
        const ry = random(`${seed}-y-${i}`);
        const rs = random(`${seed}-s-${i}`);
        const rp = random(`${seed}-p-${i}`);
        const size = 2 + rs * 5;
        const speed = 0.15 + rp * 0.45;
        const y = ((ry * height + frame * -speed) % (height + 40) + height + 40) % (height + 40) - 20;
        const x = rx * width + Math.sin((frame + i * 37) / 55) * 22;
        const twinkle = 0.35 + 0.65 * Math.abs(Math.sin((frame + i * 91) / (28 + rs * 30)));
        const fade = interpolate(frame, [0, 40, durationInFrames - 30, durationInFrames], [0, 1, 1, 0], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
        });
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: x,
              top: y,
              width: size,
              height: size,
              borderRadius: '50%',
              background: ORANGE_GLOW,
              opacity: twinkle * opacity * fade * 0.7,
              boxShadow: `0 0 ${size * 3}px ${size}px rgba(246,133,31,0.35)`,
            }}
          />
        );
      })}
    </div>
  );
};
