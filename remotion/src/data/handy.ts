// HANDY series specs — transcribed from the NLC datasheets
// ("Handy Datasheet.pdf" / "HandyEco Datasheet.pdf"). Values are as printed
// (calculated at 4000K, ±10% tolerance). Do not add a figure that is not on
// the datasheet.

// Shared by both models: same housing, optic and sizes.
export const HANDY_SHARED = [
  '110° beam',
  'UGR < 21',
  '3000K · 4000K · 6500K',
  'CRI > 80 · > 90 optional',
  'Die-cast aluminium',
  'Only 34 mm deep',
];

export const HANDY_SIZES = 'Ø105 · Ø120 · Ø170 · Ø230 mm';

export const HANDY_ECO = {
  name: 'HANDY ECO',
  driver: 'Driver on Board (DOB)',
  efficacy: 125, // lm/W, top of range
  power: '6.5 – 30 W',
  maxLumen: 3750,
  lifetime: '> 30,000 h',
  dimming: '—', // datasheet: dimming N/A, emergency backup N/A
};

export const HANDY = {
  name: 'HANDY',
  driver: 'External driver',
  efficacy: 117, // lm/W, top of range
  power: '7 – 28 W',
  maxLumen: 3276,
  lifetime: '> 50,000 h',
  lifetimeHours: 50000, // L70B50
  pf: '0.95', // shown as "> 0.95"
  thd: '15', // shown as "< 15%"
  dimming: 'Optional', // dimming and emergency backup both optional
};
