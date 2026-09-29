import type {Lang} from './commercials';

// On-screen copy for ProductCommercial, per the brand voice (guidelines §01
// Voice & Tone): plain-spoken, calm, no exclamations, none of the avoided
// words. Each headline marks exactly ONE orange word (`hl`) — "Keep one orange
// word per headline" (§09 Do's & Don'ts).
//
// Arabic is written, not translated (§08 RTL & Bilingual). The application
// lines in both languages are the guidelines' own approved EN/AR pair, quoted
// verbatim; the Arabic tagline matches ArabicReel. Product names and values
// stay in Latin script in Arabic.

export type Line = {text: string; hl?: string};

export type CommercialCopy = {
  hook: Line;
  revealSub: string;
  sheetEyebrow: string;
  sheetTitle: Line;
  typicalTitle: Line;
  typicalNote: (name: string) => string;
  appEyebrow: string;
  appTitle: Line;
  appSub: string;
  cta: (name: string) => Line;
  tagline: Line;
};

const EN: CommercialCopy = {
  hook: {text: 'A downlight is judged by where its light lands.', hl: 'lands.'},
  revealSub: 'Indoor luminaire · National Lighting Company',
  sheetEyebrow: 'From the datasheet',
  sheetTitle: {text: 'Engineered, not decorated.', hl: 'Engineered,'},
  typicalTitle: {text: 'Where the light goes.', hl: 'light'},
  typicalNote: (name) => `Typical downlight distribution — measured photometry is in the ${name} datasheet`,
  appEyebrow: 'Since 1993',
  appTitle: {text: 'Lighting that holds its shape over time.', hl: 'holds'},
  appSub: 'Every NLC luminaire is engineered for Saudi conditions and tested before it leaves Dammam.',
  cta: (name) => ({text: `Download the ${name} datasheet`, hl: name}),
  tagline: {text: "Engineering the Kingdom's Light, Power & Systems", hl: 'Light,'},
};

const AR: CommercialCopy = {
  hook: {text: 'تُقاس الإنارة السقفية بالمكان الذي يسقط فيه ضوؤها.', hl: 'ضوؤها.'},
  revealSub: 'وحدة إنارة داخلية · شركة الإنارة الوطنية',
  sheetEyebrow: 'من النشرة الفنية',
  sheetTitle: {text: 'هندسةٌ لا زخرفة.', hl: 'هندسةٌ'},
  typicalTitle: {text: 'أين يذهب الضوء.', hl: 'الضوء.'},
  typicalNote: (name) => `توزيع ضوئي نموذجي لوحدات الداون لايت — القياسات الفعلية في النشرة الفنية لـ ${name}`,
  appEyebrow: 'منذ عام 1993',
  appTitle: {text: 'إنارة تحافظ على شكلها مع مرور الزمن.', hl: 'تحافظ'},
  appSub: 'كل وحدة إنارة من NLC مصممة لظروف المملكة العربية السعودية ومُختبرة قبل أن تغادر مصنع الدمام.',
  cta: (name) => ({text: `حمّل النشرة الفنية لـ ${name}`, hl: name}),
  tagline: {text: 'هندسة النور والطاقة والأنظمة', hl: 'النور'},
};

export const copyFor = (lang: Lang): CommercialCopy => (lang === 'ar' ? AR : EN);
