// Word timings from a Whisper pass over the original audio; spellings from the
// creator's burned-in Hinglish captions. [word, start seconds, highlight?]
const WORDS = [
  ['Bachpan', 0.00], ['mein', 0.42], ['ek', 0.50], ['kahani', 0.60], ['suni', 0.88], ['hogi', 1.14],
  ['ki', 1.52], ['ek', 1.80], ['jana', 1.98], ['8', 2.22, 1], ['ghante', 2.52, 1], ['lekar', 2.86],
  ['kulhaadi', 3.18, 1], ['ped', 3.70], ['ko', 4.00], ['maarta', 4.16], ['rehta', 4.44], ['tha', 4.62],
  ['Uske', 5.00], ['bawjood', 5.50], ['bhi', 6.00], ['busy', 6.22, 1], ['dikhta', 6.50], ['tha', 6.80],
  ['ped', 7.04], ['kat-ta', 7.24], ['nahi', 7.62, 1], ['tha', 7.84],
  ['Doosra', 8.38], ['jana', 8.72], ['tha', 8.96], ['wo', 9.20], ['4', 9.34, 1], ['ghante', 9.62, 1],
  ['hi', 9.94], ['kaam', 10.02], ['karta', 10.22], ['tha', 10.44], ['aur', 10.58], ['ped', 10.76],
  ['kaat', 10.96, 1], ['leta', 11.24], ['tha', 11.42],
  ['Sabhi', 11.70], ['ne', 12.02], ['interview', 12.16, 1], ['liya', 12.44], ['bhai', 12.84],
  ['aisa', 13.04], ['kaise?', 13.30, 1],
  ['Tab', 14.20], ['bataya', 14.32], ['gaya', 14.64], ['ki', 14.84], ['main', 15.00], ['teen', 15.20, 1],
  ['ghante', 15.56, 1], ['apni', 16.08], ['kulhaadi', 16.56], ['ki', 17.50], ['dhaar', 17.66, 1],
  ['banaata', 18.00, 1], ['aur', 18.36], ['ek', 18.62, 1], ['ghanta', 18.88, 1], ['kaatta', 19.22],
  ['hoon', 19.50], ['ped', 19.76], ['kat', 19.92, 1], ['jaata', 20.06], ['hai', 20.24],
  ['Isi', 20.90], ['tarah', 21.18], ['bahut', 21.58], ['saare', 21.80], ['log', 22.06], ['apni', 22.26],
  ['skill', 22.62, 1], ['ko', 22.94], ['improve', 23.14, 1], ['nahi', 23.42], ['karte', 23.74],
  ['8-8', 24.46, 1], ['ghante', 24.90], ['10-10', 25.32, 1], ['ghante', 25.64], ['ki', 25.94],
  ['naukri', 26.02, 1], ['karte', 26.34], ['hain', 26.62], ['fir', 26.78], ['kehte', 26.88],
  ['hain', 27.12], ['tarakki', 27.40, 1], ['nahi', 27.72, 1], ['hoti', 27.92],
  ['Aur', 28.06], ['doosra', 28.62], ['wahin', 29.14], ['ek', 29.32], ['naya', 29.48, 1], ['jana', 29.72],
  ['aata', 30.00], ['hai', 30.22], ['jo', 30.38], ['apni', 30.46], ['skill', 30.62, 1], ['pe', 30.90],
  ['kaam', 31.04], ['karta', 31.32], ['hai', 31.56],
  ['Thodi', 32.10], ['mehnat', 32.70, 1], ['karta', 33.14], ['hai', 33.46], ['uski', 33.66],
  ['salary', 33.88, 1], ['uski', 34.48], ['kamai', 34.72, 1], ['dekho', 35.18], ['kahan', 35.38],
  ['se', 35.62], ['kahan', 35.76, 1], ['pahunch', 35.94], ['jaati', 36.22], ['hai', 36.46],
  ['Tarot', 36.98, 1], ['aapko', 37.50], ['har', 37.92], ['paristhiti', 38.08, 1], ['ko', 38.60],
  ['guide', 38.84, 1], ['dete', 39.54], ['hain', 39.94], ['apni', 40.10], ['life', 40.40, 1],
  ['ko', 40.68], ['improve', 40.86, 1], ['karne', 41.20], ['ke', 41.62], ['liye', 41.76],
];
const SPEECH_END = 42.3;

// Group words into short caption lines: break on pauses, long lines and sentence starts.
const CAPTION_LINES = (() => {
  const lines = []; let cur = [];
  const len = (ws) => ws.reduce((n, w) => n + w[0].length + 1, 0);
  WORDS.forEach((w, i) => {
    const prev = WORDS[i - 1];
    const gap = prev ? w[1] - prev[1] : 0;
    const startsSentence = /^[A-Z]/.test(w[0]) && i > 0;
    if (cur.length && (gap > 0.55 || startsSentence || len(cur) + w[0].length > 15 || cur.length >= 3)) { lines.push(cur); cur = []; }
    cur.push(w);
  });
  if (cur.length) lines.push(cur);
  return lines.map((ws, i) => {
    const next = lines[i + 1];
    const last = ws[ws.length - 1];
    const end = next ? Math.min(next[0][1], last[1] + 1.2) : Math.min(SPEECH_END, last[1] + 1.0);
    return { words: ws, t0: ws[0][1], t1: end };
  });
})();

// Scene cuts, aligned to phrase boundaries in the voice-over.
const SCENES = [
  { id: 'chop',      t0: 0.00,  t1: 4.86 },
  { id: 'busy',      t0: 4.86,  t1: 8.30 },
  { id: 'fell',      t0: 8.30,  t1: 11.64 },
  { id: 'interview', t0: 11.64, t1: 14.12 },
  { id: 'secret',    t0: 14.12, t1: 20.70 },
  { id: 'crowd',     t0: 20.70, t1: 24.36 },
  { id: 'grind',     t0: 24.36, t1: 28.00 },
  { id: 'newguy',    t0: 28.00, t1: 32.00 },
  { id: 'growth',    t0: 32.00, t1: 36.90 },
  { id: 'tarot',     t0: 36.90, t1: 42.40 },
  { id: 'outro',     t0: 42.40, t1: DURATION + 0.1 },
];
