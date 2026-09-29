// NLC HARMONY — every figure below is transcribed from the product datasheet
// ("Harmony Datasheet.pdf", 3 pages). The commercial reads only from here, so
// no on-screen claim can drift from the datasheet. Change a value here, re-render.

export const HARMONY = {
  name: 'HARMONY',
  tagline: ['Light that Lasts,', 'Performance you Trust'],
  efficacy: 148, // lm/W, "UP TO 148 LM/W"
  models: [
    {power: 20, lumen: 2960, diameter: 300},
    {power: 40, lumen: 5920, diameter: 400},
  ],
  optics: [
    {key: 'opal', label: 'OPAL', model: 'NLC-HO', line: 'Soft, uniform glow'},
    {key: 'prismatic', label: 'MICROPRISMATIC', model: 'NLC-HP', line: 'Glare held below UGR 19'},
  ],
  beamAngle: 110,
  cri: {standard: 90, optional: 95},
  sdcm: 3,
  led: 'Lumileds SMD2835',
  cct: [2700, 3000, 4000, 5000, 5700, 6500],
  ip: 'IP44 / 54',
  electricalClass: 'Class II',
  surge: '1 kV / 2 kV',
  lifetime: '50,000 h',
  lifetimeRating: 'L70B50',
  switching: '25,000',
  workingTemp: '–20 to +45 °C',
  mounting: ['Surface mounted', 'Suspended'],
  colours: [
    {label: 'Matt White', hex: '#F1F0EC'},
    {label: 'Matt Black', hex: '#1C1C1F'},
  ],
  optional: ['Dimming', 'Emergency backup'],
  applications: ['Homes', 'Hotels', 'Lobbies', 'Offices', 'Museums', 'Hospitals'],
  warrantyYears: 5,
  certificates: ['SASO', 'CB', 'IECEE', 'RoHS', 'CE'],
} as const;

// Voice-over script, written in the same voice and cadence as the MINI and
// CENTURY spots (Higgsfield text2speech_v2 · ElevenLabs · preset voice "Fraser").
// One paragraph per scene, in scene order.
export const HARMONY_VO = [
  'Some spaces just need light. Done right.',
  'This is the N L C Harmony. Light that lasts, performance you trust.',
  'Two optics, one design. Soft opal, or microprismatic, with glare held below U G R nineteen.',
  'Twenty or forty watts. Up to a hundred and forty-eight lumens per watt.',
  'Lumileds LEDs. A hundred-and-ten-degree beam. C R I above ninety.',
  'Flicker-free, from warm to cool white.',
  'I P forty-four to fifty-four, Class Two, rated beyond fifty thousand hours.',
  'Surface-mounted or suspended, in matt white or black.',
  'For homes, hotels, offices, museums, and hospitals.',
  'Five-year warranty. N L C Harmony. Light that lasts.',
];

// Optional generated media. Drop files into public/harmony/ and set the paths
// (relative to public/) to layer them in; null keeps the fully rendered version.
//  - voiceover: the HARMONY_VO read as one file (mp3/wav)
//  - music:     a bed, mixed under the voice-over
//  - lifestyle: Kling 3.0 clips for the applications scene (see HARMONY-SHOTLIST.md)
export const HARMONY_MEDIA: {
  voiceover: string | null;
  music: string | null;
  lifestyle: string[];
} = {
  voiceover: null,
  music: null,
  lifestyle: [],
};
