import type {Lang} from './commercials';

// On-screen copy for ProductCommercial, per the brand voice (guidelines §01
// Voice & Tone): plain-spoken, calm, no exclamations, none of the avoided
// words. Each headline marks exactly ONE orange word (`hl`) — "Keep one orange
// word per headline" (§09 Do's & Don'ts). A '\n' forces a line break; a '|'
// breaks the line in 9:16 only (a space in 16:9) — both exist to avoid widows.
//
// Arabic is written, not translated (§08 RTL & Bilingual). The application
// lines in both languages are the guidelines' own approved EN/AR pair, quoted
// verbatim (no-break spaces keep المملكة العربية السعودية and the closing
// phrase together, so neither splits or strands a word); the
// Arabic tagline matches ArabicReel. Product names and values stay in Latin
// script in Arabic.
//
// Honesty rules the copy is built around:
//   - the CTA only promises a datasheet when one is confirmed (`hasDatasheet`);
//   - the typical-distribution fallback says, on screen, that it is NOT the
//     product's measured data.

export type Line = {text: string; hl?: string};

export type CommercialCopy = {
  hook: Line;
  revealSub: string;
  sheetEyebrow: string;
  sheetTitle: Line;
  typicalEyebrow: string;
  typicalTitle: Line;
  typicalNote: (name: string, category: string) => string;
  appEyebrow: string;
  appTitle: Line;
  appSub: string;
  cta: (name: string, hasDatasheet: boolean) => Line;
  tagline: string;
};

const NBSP = '\u00A0';

const EN: CommercialCopy = {
  hook: {text: 'A downlight is judged\nby where its light lands.', hl: 'lands.'},
  revealSub: 'National Lighting Company',
  sheetEyebrow: 'Specifications',
  sheetTitle: {text: 'Engineered,\nnot decorated.', hl: 'Engineered,'},
  typicalEyebrow: 'Typical distribution',
  typicalTitle: {text: 'Where the light goes.', hl: 'light'},
  typicalNote: (name, category) =>
    `A typical ${category.toLowerCase()} distribution, for illustration — not${NBSP}${name}’s measured data.`,
  appEyebrow: 'Since 1993',
  appTitle: {text: 'Lighting that holds its shape over time.', hl: 'holds'},
  appSub: 'Every NLC luminaire is engineered for Saudi conditions and tested before it leaves Dammam.',
  cta: (name, hasDatasheet) =>
    hasDatasheet ? {text: `Download the |${name} datasheet`, hl: name} : {text: `See ${name} |in the NLC catalogue`, hl: name},
  tagline: "Engineering the Kingdom's Light, Power & Systems",
};

const AR: CommercialCopy = {
  hook: {text: 'تُقاس الإنارة السقفية\nبالمكان الذي يسقط فيه ضوؤها.', hl: 'ضوؤها.'},
  revealSub: 'شركة الإنارة الوطنية',
  sheetEyebrow: 'المواصفات الفنية',
  sheetTitle: {text: 'هندسةٌ لا زخرفة.', hl: 'هندسةٌ'},
  typicalEyebrow: 'توزيع ضوئي نموذجي',
  typicalTitle: {text: 'حيث يسقط الضوء.', hl: 'الضوء.'},
  typicalNote: (name) => `توزيع نموذجي لهذه الفئة من وحدات الإنارة، للتوضيح فقط، وليس قياسات ${name} الفعلية.`,
  appEyebrow: 'منذ عام 1993',
  appTitle: {text: 'إنارة تحافظ على شكلها\nمع مرور الزمن.', hl: 'تحافظ'},
  appSub: `كل وحدة إنارة من NLC مصممة لظروف المملكة${NBSP}العربية${NBSP}السعودية ومُختبرة قبل أن تغادر${NBSP}مصنع${NBSP}الدمام.`,
  cta: (name, hasDatasheet) =>
    hasDatasheet ? {text: `حمّل نشرة ${name} الفنية`, hl: name} : {text: `اطّلع على ${name} |في كتالوج NLC`, hl: name},
  tagline: 'هندسة النور والطاقة والأنظمة',
};

export const copyFor = (lang: Lang): CommercialCopy => (lang === 'ar' ? AR : EN);
