import React from 'react';
import {Composition} from 'remotion';
import {AlphaCommercial, AlphaProps, DURATION, FPS} from './AlphaCommercial';

// Copy and spec values come from nlc.com.sa/product/alpha.html (datasheet is the
// source of truth). Stills are filled in by props/alpha.json once generated.
export const alphaDefaults: AlphaProps = {
  scenes: [
    {
      label: 'Hero macro',
      kicker: 'Recessed COB Downlight',
      value: 'ALPHA',
      caption: 'Elegance Scaled to Perfection',
      zoom: [1.0, 1.1],
      origin: [66, 45],
    },
    {
      label: 'Gallery',
      kicker: 'Galleries & Museums',
      value: 'CRI >90',
      caption: 'True colour as standard · CRI >95 optional',
      zoom: [1.06, 1.14],
      drift: [30, -30],
      origin: [60, 40],
    },
    {
      label: 'Hotel lobby',
      kicker: 'Hospitality',
      value: '130 lm/W',
      caption: 'Peak efficacy · die-cast aluminium heat sink',
      zoom: [1.12, 1.04],
      origin: [55, 35],
    },
    {
      label: 'Meeting room',
      kicker: 'Offices & Meeting Rooms',
      value: '10–40 W',
      caption: '1,200 to 5,200 lm · four sizes, one design',
      zoom: [1.05, 1.12],
      drift: [-30, 30],
      origin: [55, 45],
    },
    {
      label: 'Retail',
      kicker: 'Retail & Malls',
      value: '27° / 93°',
      caption: 'Focused accent or wide general beam',
      zoom: [1.04, 1.13],
      origin: [62, 40],
    },
    {
      label: 'Majlis',
      kicker: 'Residential',
      value: '100,000 h',
      caption: 'IP65 · flicker-free · 3-year warranty, extendable to 5',
      zoom: [1.12, 1.03],
      origin: [50, 40],
    },
  ],
  conceptTag: true,
  endTagline: 'Four sizes · one unified design',
  specs: ['10–40 W', '130 lm/W', 'CRI >90', 'IP65', '2700–5000 K'],
  footnote: 'Values at 4000 K · ±10% tolerance · Application scenes are concept visualisations',
};

export const RemotionRoot: React.FC = () => (
  <Composition
    id="AlphaCommercial"
    component={AlphaCommercial}
    durationInFrames={DURATION}
    fps={FPS}
    width={1920}
    height={1080}
    defaultProps={alphaDefaults}
  />
);
