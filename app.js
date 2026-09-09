'use strict';

// =====================================================================
// Reine Berechnung (DOM-frei, auch unter node testbar -> selftest.js)
// =====================================================================

const GRAVITY = 9.80665;
const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

/// Lineare Massendichte (kg/m) einer RUNDEN Speiche aus Durchmesser (mm) und Dichte.
function muFromDiameterMm(diameterMm, rhoKgM3 = 7850) {
  const r = diameterMm / 2000;
  return rhoKgM3 * Math.PI * r * r;
}

/// Lineare Massendichte (kg/m) einer FLACHEN/Aero-Speiche aus Breite × Dicke (mm).
/// Rechteck-Näherung A = w·t; gerundete Blattkanten überschätzen sie leicht
// ponytail: Rechteck-Näherung; bei Bedarf via Custom-g/m exakt kalibrieren.
function muFromBladeMm(widthMm, thicknessMm, rhoKgM3 = 7850) {
  return rhoKgM3 * (widthMm / 1000) * (thicknessMm / 1000);
}

/// Saitenspannung in Newton: T = 4 * mu * L^2 * f^2.
function tensionNewton(freqHz, lengthM, muKgM) {
  return 4 * muKgM * lengthM * lengthM * freqHz * freqHz;
}

function newtonToKgf(n) {
  return n / GRAVITY;
}

/// Umkehrung von tensionNewton: Frequenz (Hz), bei der die Speiche die Zielspannung hat.
function freqForTension(tN, lengthM, muKgM) {
  return Math.sqrt(tN / (4 * muKgM)) / lengthM;
}

/// Hz -> Notenname mit Oktave und Cent-Abweichung. null bei f<=0.
function hzToNote(freqHz) {
  if (!(freqHz > 0)) return null;
  const midi = 69 + 12 * Math.log2(freqHz / 440);
  const r = Math.round(midi);
  const name = NOTE_NAMES[((r % 12) + 12) % 12];
  const octave = Math.floor(r / 12) - 1;
  const cents = Math.round((midi - r) * 100) || 0; // -0 -> 0
  return { name, octave, cents, label: name + octave };
}

function median(values) {
  if (!values.length) return null;
  const s = [...values].sort((a, b) => a - b);
  const m = s.length >> 1;
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

/// Nötige Proben für eine gültige Messung – auch die Segment-Anzeige im UI.
const MIN_SAMPLES = 5;

/// „Statistisch sinnvolle“ Messung: genug Proben UND eng geclustert.
/// Liefert den Median-Hz, wenn der robuste Spread (MAD) <= relSpread*Median liegt, sonst null.
// ponytail: Defaults an echter Zupf-Aufnahme kalibriert (Ton kippt nach ~350 ms
// in den Nachbarmodus, 8 Proben à 70 ms kamen nie zusammen); bei Fehl-Locks hier drehen.
function stableReading(samples, minSamples = MIN_SAMPLES, relSpread = 0.02) {
  if (samples.length < minSamples) return null;
  const recent = samples.slice(-minSamples);
  const m = median(recent);
  if (!(m > 0)) return null;
  const mad = median(recent.map(v => Math.abs(v - m))); // robust gegen Einzelausreißer
  return (mad / m) <= relSpread ? m : null;
}

/// Kleine Radix-2-FFT (nächste Zweierpotenz, Hann-Fenster), nur Magnituden.
/// Für die Harmonischen-Bewertung in detectPitch; kein externes Paket nötig.
// ponytail: 4096er-FFT ~25x/s ist auf dem Handy unkritisch.
function fftMag(buf) {
  let n = 1;
  while (n < buf.length) n <<= 1;
  const re = new Float64Array(n), im = new Float64Array(n);
  for (let i = 0; i < buf.length; i++) {
    re[i] = buf[i] * (0.5 - 0.5 * Math.cos(2 * Math.PI * i / (buf.length - 1)));
  }
  // Bit-Reversal
  for (let i = 1, j = 0; i < n; i++) {
    let bit = n >> 1;
    for (; j & bit; bit >>= 1) j ^= bit;
    j ^= bit;
    if (i < j) { const t = re[i]; re[i] = re[j]; re[j] = t; }
  }
  for (let len = 2; len <= n; len <<= 1) {
    const ang = -2 * Math.PI / len;
    const wr = Math.cos(ang), wi = Math.sin(ang);
    for (let i = 0; i < n; i += len) {
      let cwr = 1, cwi = 0;
      for (let k = 0; k < len / 2; k++) {
        const ur = re[i + k], ui = im[i + k];
        const vr = re[i + k + len / 2] * cwr - im[i + k + len / 2] * cwi;
        const vi = re[i + k + len / 2] * cwi + im[i + k + len / 2] * cwr;
        re[i + k] = ur + vr; im[i + k] = ui + vi;
        re[i + k + len / 2] = ur - vr; im[i + k + len / 2] = ui - vi;
        const nwr = cwr * wr - cwi * wi;
        cwi = cwr * wi + cwi * wr; cwr = nwr;
      }
    }
  }
  const mag = new Float64Array(n / 2);
  for (let i = 0; i < n / 2; i++) mag[i] = Math.hypot(re[i], im[i]);
  return { mag, n };
}

/// Grundfrequenz via YIN (Differenzfunktion + kumulative Mittelwert-Normalisierung).
/// Robuster als rohe ACF für abklingende Zupftöne: die Amplituden-Dämpfung drückt
/// bei ACF die clarity weg, YIN normalisiert sie raus. Zusätzlich wird die
/// Anschlagsphase (breitbandiges Transient) vom Aufrufer übersprungen.
// ponytail: O(n^2) auf <=4096 Samples, ~25x/s. Bei Performance-Problemen FFT.
function detectPitch(buf, sampleRate) {
  const SIZE = buf.length;
  let rms = 0;
  for (let i = 0; i < SIZE; i++) rms += buf[i] * buf[i];
  rms = Math.sqrt(rms / SIZE);
  if (rms < 0.01) return { freq: -1, clarity: 0, rms };

  // Stille an den Rändern wegschneiden.
  let r1 = 0, r2 = SIZE - 1;
  const thres = 0.2;
  for (let i = 0; i < SIZE / 2; i++) {
    if (Math.abs(buf[i]) < thres) { r1 = i; break; }
  }
  for (let i = 1; i < SIZE / 2; i++) {
    if (Math.abs(buf[SIZE - i]) < thres) { r2 = SIZE - i; break; }
  }
  const b = buf.slice(r1, r2);
  const n = b.length;
  if (n < 8) return { freq: -1, clarity: 0, rms };

  const FMIN = 80, FMAX = 1500;
  const tMin = Math.max(2, Math.floor(sampleRate / FMAX));
  const tMax = Math.min(n - 2, Math.ceil(sampleRate / FMIN));

  // YIN Schritt 1+2: Differenzfunktion d(tau), dann CMND d'(tau).
  const d = new Float32Array(tMax + 2);
  for (let tau = 1; tau <= tMax + 1; tau++) {
    let sum = 0;
    for (let j = 0; j + tau < n; j++) {
      const v = b[j] - b[j + tau];
      sum += v * v;
    }
    d[tau] = sum;
  }
  const cmnd = new Float32Array(tMax + 2);
  cmnd[0] = 1;
  let run = 0;
  for (let tau = 1; tau <= tMax + 1; tau++) {
    run += d[tau];
    cmnd[tau] = run > 0 ? (d[tau] * tau) / run : 1;
  }

  // Schritt 3: lokale Minima unter Schwelle sammeln (Kandidaten).
  const THRESH = 0.35;
  const dips = []; // {tau, val}
  for (let t = tMin; t < tMax; t++) {
    if (cmnd[t] < THRESH && cmnd[t] <= cmnd[t - 1] && cmnd[t] < cmnd[t + 1]) {
      dips.push({ tau: t, val: cmnd[t] });
    }
  }
  if (!dips.length) {
    let mv = Infinity, bt = -1;
    for (let t = tMin; t < tMax; t++) if (cmnd[t] < mv) { mv = cmnd[t]; bt = t; }
    if (bt > 0) dips.push({ tau: bt, val: mv });
  }
  if (!dips.length) return { freq: -1, clarity: 0, rms };

  // Schritt 4: Subharmonischen-Auflösung via Spektrum des Fensters.
  // Bei steifen Drähten (Speichen!) fehlt der Grundton oft im Spektrum,
  // die Energie sitzt in f3/f4 — YIN kippt dann auf f/3. Bewertung:
  // gewichtete Harmonischen-Summe aus dem FFT-Spektrum.
  const spec = fftMag(b);
  const ampAt = (fc) => {
    const lo = Math.max(1, Math.floor(fc * 0.97 / sampleRate * spec.n)),
          hi = Math.min(spec.mag.length - 1, Math.ceil(fc * 1.03 / sampleRate * spec.n));
    let m = 0;
    for (let i = lo; i <= hi; i++) if (spec.mag[i] > m) m = spec.mag[i];
    return m;
  };
  let best = dips[0], bestScore = -1;
  let globalMax = 0;
  const loB = Math.floor(80 / sampleRate * spec.n), hiB = Math.min(spec.mag.length - 1, Math.ceil(3000 / sampleRate * spec.n));
  for (let i = loB; i <= hiB; i++) if (spec.mag[i] > globalMax) globalMax = spec.mag[i];
  for (const dp of dips) {
    const f = sampleRate / dp.tau;
    let sup = 0;
    for (let k = 1; k <= 8; k++) {
      if (f * k > 3000) break;
      sup += ampAt(f * k) / k;
    }
    // Grundton-Präsenz: YIN-Subharmonische (f/3, f/4) bekommen Pseudo-
    // Unterstützung, weil ihre "Obertöne" auf echte Spektral-Peaks fallen
    // (z. B. 140 Hz: 3f=421, 4f=548 sind echte Peaks, aber 140 selbst fehlt).
    // Wer spektral nicht existiert, wird hart bestraft.
    const relFund = globalMax > 0 ? ampAt(f) / globalMax : 0;
    const presence = relFund < 0.05 ? 0.02 : relFund < 0.1 ? 0.4 : relFund < 0.2 ? 0.7 : 1;
    const score = (1 - dp.val) * sup * presence;
    if (score > bestScore) { bestScore = score; best = dp; }
  }
  const tau = best.tau;

  // Phantom-Check: gewählter Kandidat hat keinen Spektral-Peak -> YIN-Artefakt
  // (Perioden-Kamm aus mehreren Modi). Besser unvoiced melden als eine
  // fiktive Subharmonische zu locken; die Ausklingframes liefern den echten Ton.
  const relBest = globalMax > 0 ? ampAt(sampleRate / tau) / globalMax : 1;
  if (relBest < 0.05) return { freq: -1, clarity: 0, rms };

  // Parabel-Interpolation für Sub-Sample-Genauigkeit.
  const x1 = cmnd[tau - 1] || cmnd[tau], x2 = cmnd[tau], x3 = cmnd[tau + 1] || cmnd[tau];
  const a = (x1 + x3 - 2 * x2) / 2;
  const bb = (x3 - x1) / 2;
  const tauF = a ? tau - bb / (2 * a) : tau;

  const freq = sampleRate / tauF;
  const clarity = 1 - cmnd[tau]; // 1 = perfekt periodisch
  return { freq, clarity, rms };
}

/// Gewichteter Median über Frames {f, c} (Gewicht = clarity²).
function weightedMedian(frames) {
  const pts = frames.slice().sort((a, b) => a.f - b.f);
  const total = pts.reduce((s, q) => s + q.c * q.c, 0);
  let acc = 0;
  for (const q of pts) {
    acc += q.c * q.c;
    if (acc >= total / 2) return q.f;
  }
  return pts[pts.length - 1].f;
}

/// Pluck-Voting: über alle Frames eines Zupfers clustern (3%-Bänder) und mit
/// clarity^2 gewichten. Der Anschlag (breitbandig, clarity ~0.5-0.65) und
/// Subharmonischen-Fehlgriffe (clarity ~0.65-0.72) verlieren so gegen die
/// Ausklingphase (clarity ~0.8-0.98). An echten Aufnahmen kalibriert:
/// weicher Zupfer -> beste Frames ab ~40 ms; harter Zupfer -> erst ab ~280 ms.
function pluckVote(frames) {
  if (frames.length < 3) return null;
  const pts = frames.slice().sort((a, b) => a.f - b.f);
  const clusters = [];
  for (const p of pts) {
    const last = clusters[clusters.length - 1];
    if (last && p.f / last.mean < 1.03) {
      last.items.push(p);
      last.mean = last.items.reduce((s, q) => s + q.f, 0) / last.items.length;
    } else {
      clusters.push({ items: [p], mean: p.f });
    }
  }
  for (const cl of clusters) {
    cl.weight = cl.items.reduce((s, q) => s + q.c * q.c, 0);
    cl.hz = cl.items.reduce((s, q) => s + q.c * q.c * q.f, 0) / cl.weight;
  }
  clusters.sort((a, b) => b.weight - a.weight);
  // Dual-Mode-Regel: Speichen schwingen in zwei Ebenen mit leicht verschiedenen
  // Frequenzen; je nach Zupfrichtung dominiert mal die obere, mal die untere.
  // Konsistent ist immer die UNTERE Mode (sie klingt laenger nach, siehe
  // Auskling-Sweeps in den Testaufnahmen). Nimm den tiefsten Cluster, der noch
  // >=30% des staerksten Gewichts hat.
  const maxW = clusters[0].weight;
  const candidates = clusters.filter(c => c.weight >= 0.3 * maxW);
  const best = candidates.reduce((a, b) => (a.hz < b.hz ? a : b));
  const second = clusters.find(c => c !== best);
  return {
    hz: best.hz,
    count: best.items.length,
    margin: second ? best.weight / second.weight : Infinity,
  };
}

/// Oktavfehler-Schutz: hat das Spektrum bei f/2 einen klaren Peak, war f
/// vermutlich die 2. Harmonische -> auf den Grundton falten.
/// spec = Byte-Spektrum (0..255). ACHTUNG dB-Skala: Byte = 255*(dB+100)/70
/// (Analyser-Defaults -100..-30 dB), d. h. Byte-DIFFERENZ = dB-Abstand.
// ponytail: konservative Heuristik – Sub-Peak muss laut (>= ~-65 dBFS) UND
// nah am Hauptpeak (<= ~8 dB darunter) sein. Falsches Falten wäre schlimmer
// (speichert 1/4-Spannung) als ein verpasster seltener ACF-Oktavfehler.
function correctOctave(freq, spec, binHz) {
  if (!(freq > 0) || !spec || !(binHz > 0)) return freq;
  const mag = (f) => {
    const i = Math.round(f / binHz);
    return i >= 1 && i + 1 < spec.length ? Math.max(spec[i - 1], spec[i], spec[i + 1]) : 0;
  };
  const half = freq / 2;
  return half >= 60 && mag(half) >= 128 && mag(half) >= mag(freq) - 30 ? half : freq;
}

/// Statistik einer Laufradseite (Port von Wheel.statsFor).
/// ref > 0 (Zielspannung): das ±band-Fenster zählt gegen das Ziel statt gegen
/// das Seitenmittel – konsistent zur Speichen-Färbung im Rad-SVG.
function sideStats(tensions, total, band = 0.10, ref = 0) {
  const measured = tensions.length;
  if (!measured) {
    return { total, measured: 0, avg: 0, min: 0, max: 0, std: 0, within: 0, pct: 0 };
  }
  let sum = 0, min = tensions[0], max = tensions[0];
  for (const t of tensions) {
    sum += t;
    if (t < min) min = t;
    if (t > max) max = t;
  }
  const avg = sum / measured;
  const base = ref > 0 ? ref : avg;
  let varSum = 0, within = 0;
  for (const t of tensions) {
    const dd = t - avg;
    varSum += dd * dd;
    if (Math.abs(t - base) <= base * band) within++;
  }
  return {
    total, measured, avg, min, max,
    std: Math.sqrt(varSum / measured),
    within, pct: within / measured * 100,
  };
}

// node-Export für selftest; im Browser ohne Wirkung.
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    muFromDiameterMm, muFromBladeMm, tensionNewton, newtonToKgf, freqForTension, hzToNote,
    median, detectPitch, correctOctave, sideStats, stableReading, pluckVote, weightedMedian, GRAVITY,
  };
}

// =====================================================================
// App-Zustand
// =====================================================================

const STORAGE_KEY = 'speichen_state_v1';
// Dichte (kg/m^3) je Werkstoff. Carbon (CFRP) ~1600 — Streuung via g/m-Anzeige
// bzw. Custom-Profil kalibrierbar.
const MATERIALS = { steel: 7850, stainless: 7900, aluminium: 2700, titanium: 4500, carbon: 1600 };
const MATERIAL_KEYS = ['steel', 'stainless', 'aluminium', 'titanium', 'carbon'];
const SHAPES = ['round', 'bladed', 'custom'];
// Standardprofil: 2,0 mm Rundstahl. Bladed-Maße + g/m als sinnvolle Vorgaben mitgeführt.
const DEFAULT_PROFILE = { shape: 'round', materialKey: 'steel', diameterMm: 2.0, widthMm: 2.3, thicknessMm: 0.9, gPerM: 50 };

/// Sorgt für ein vollständiges Profil (auch beim Laden alter, runder Profile).
function normalizeProfile(p) {
  const d = DEFAULT_PROFILE;
  return {
    shape: SHAPES.includes(p && p.shape) ? p.shape : 'round',
    materialKey: (p && MATERIALS[p.materialKey]) ? p.materialKey : 'steel',
    diameterMm: (p && +p.diameterMm) || d.diameterMm,
    widthMm: (p && +p.widthMm) || d.widthMm,
    thicknessMm: (p && +p.thicknessMm) || d.thicknessMm,
    gPerM: (p && +p.gPerM) || d.gPerM,
  };
}
const SPOKE_COLORS = {
  unmeasured: { fill: '#9aa0a6', text: '#1f1f1f' },
  in: { fill: '#16a34a', text: '#ffffff' },
  out: { fill: '#dc2626', text: '#ffffff' },
};

let state = { unit: 'N', wheel: null, selectedSpokeIndex: 0 };

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) state = Object.assign(state, JSON.parse(raw));
    if (state.unit === 'kp') state.unit = 'kgf'; // Alt-Code migrieren
    if (state.wheel && state.wheel.profile) state.wheel.profile = normalizeProfile(state.wheel.profile);
    if (state.wheel) { // Alt-Räder ohne Zielspannung migrieren
      state.wheel.targetLeftN = +state.wheel.targetLeftN || 0;
      state.wheel.targetRightN = +state.wheel.targetRightN || 0;
    }
  } catch { /* korrupte Daten ignorieren */ }
}
function save() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch { /* ignore */ }
}

function profileMu(p) {
  if (p.shape === 'custom') return (p.gPerM || 0) / 1000;       // direkte g/m-Vorgabe
  const rho = MATERIALS[p.materialKey] ?? 7850;
  if (p.shape === 'bladed') return muFromBladeMm(p.widthMm, p.thicknessMm, rho);
  return muFromDiameterMm(p.diameterMm, rho);                    // rund (Default)
}
function profileGperM(p) { return profileMu(p) * 1000; }
/// Lokalisierter Anzeigename, z. B. „2,0 mm Stahl“, „2,3×0,9 mm Carbon“, „16,3 g/m“.
function profileName(p) {
  const mat = t('material.' + (p.materialKey || 'steel'));
  if (p.shape === 'custom') return `${fmtNum(p.gPerM, 1)} g/m`;
  if (p.shape === 'bladed') return `${fmtNum(p.widthMm, 1)}×${fmtNum(p.thicknessMm, 1)} mm ${mat}`;
  return `${fmtNum(p.diameterMm, 1)} mm ${mat}`;
}

function createWheel(name, position, spokeCount) {
  const spokes = [];
  for (let i = 0; i < spokeCount; i++) {
    spokes.push({ index: i, side: i % 2 === 0 ? 'left' : 'right', reading: null });
  }
  return {
    name, position, profile: normalizeProfile(DEFAULT_PROFILE),
    leftLengthMm: 250, rightLengthMm: 250,
    targetLeftN: 0, targetRightN: 0, // 0 = kein Ziel gesetzt
    spokes,
  };
}

function lengthMmForSide(w, side) { return side === 'left' ? w.leftLengthMm : w.rightLengthMm; }
function targetForSide(w, side) { return (side === 'left' ? w.targetLeftN : w.targetRightN) || 0; }
/// Ziel-Frequenz der gewählten Speiche (null ohne Rad/Speiche/Ziel).
function targetFreqForSelected() {
  const w = state.wheel, s = selectedSpoke();
  if (!w || !s) return null;
  const tN = targetForSide(w, s.side);
  return tN > 0 ? freqForTension(tN, lengthMmForSide(w, s.side) / 1000, profileMu(w.profile)) : null;
}
function tensionForHzOnSide(w, hz, side) {
  return tensionNewton(hz, lengthMmForSide(w, side) / 1000, profileMu(w.profile));
}
function selectedSpoke() {
  const w = state.wheel;
  if (!w) return null;
  const i = state.selectedSpokeIndex;
  return i >= 0 && i < w.spokes.length ? w.spokes[i] : null;
}
function sideLabel(side) { return t(side === 'left' ? 'side.left' : 'side.right'); }
function positionLabel(pos) { return t(pos === 'front' ? 'pos.front' : 'pos.rear'); }

function formatTension(n, withUnit = true) {
  if (state.unit === 'kgf') {
    const s = fmtNum(newtonToKgf(n), 1);
    return withUnit ? s + ' ' + t('unit.kgf') : s;
  }
  const s = fmtNum(Math.round(n), 0);
  return withUnit ? s + ' ' + t('unit.N') : s;
}

/// Note + Cent als HTML-Schnipsel (für Anzeige neben Hz). „ct“ ist international.
function noteHtml(freqHz) {
  const note = hzToNote(freqHz);
  if (!note) return '<span class="muted">—</span>';
  const sign = note.cents >= 0 ? '+' : '−';
  const cls = Math.abs(note.cents) <= 10 ? 'note-cents ok' : 'note-cents';
  return `<span class="note-name">${note.label}</span>` +
    `<span class="${cls}">${sign}${Math.abs(note.cents)} ct</span>`;
}

// =====================================================================
// DOM-Wiring
// =====================================================================

function initDom() {
  load();

  // Sprachauswahl füllen + verdrahten.
  const sel = document.getElementById('lang-select');
  sel.innerHTML = LANGS.map(l => `<option value="${l}">${LANG_NAMES[l]}</option>`).join('');
  sel.value = LANG;
  sel.addEventListener('change', () => setLang(sel.value));
  document.addEventListener('langchange', onLangChange);

  // Tab-Navigation.
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', () => switchTab(btn.dataset.tab));
  });

  // Mess-Tab.
  document.getElementById('listen-btn').addEventListener('click', () => Measure.toggle());

  document.documentElement.lang = LANG;
  applyStaticI18n();
  renderGuide();
  render();
  updateButton();
  updateGauge(0, false);

  // Service Worker (offline / installierbar). Fehler still ignorieren.
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
  }
}

/// Sprachwechsel: statische Labels, Guide und alle dynamischen Ansichten neu.
function onLangChange() {
  document.documentElement.lang = LANG;
  const sel = document.getElementById('lang-select');
  if (sel) sel.value = LANG;
  applyStaticI18n();
  renderGuide();
  render();
  updateButton();
  if (Spectrum.el && !Spectrum.el.hidden) Spectrum.el.setAttribute('aria-label', t('aria.spectrum'));
  updateGauge(Measure.listening ? Measure.liveHz : (Measure.resultHz ?? 0), Measure.listening);
}

const TAB_ORDER = ['measure', 'wheel', 'guide'];
function switchTab(tab) {
  document.querySelectorAll('.tab').forEach(s => s.hidden = s.id !== 'tab-' + tab);
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.toggle('active', b.dataset.tab === tab));
  document.getElementById('tabnav').style.setProperty('--i', TAB_ORDER.indexOf(tab));
  if (tab === 'wheel') renderWheelTab();
}

/// Zustandsänderung -> alles neu zeichnen + speichern.
function render() {
  renderMeasureContext();
  renderApplySection();
  renderWheelTab();
}

// ----------------------- Mess-Tab -----------------------

const Pitch = {
  ctx: null, analyser: null, stream: null, raf: 0, buf: null, listening: false, onReading: null,
  freqData: null, binHz: 0, // Byte-Spektrum fürs Live-Display + Oktav-Check

  async start(onReading) {
    this.onReading = onReading;
    this.stream = await navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false },
    });
    this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    const src = this.ctx.createMediaStreamSource(this.stream);
    this.analyser = this.ctx.createAnalyser();
    this.analyser.fftSize = 4096;
    src.connect(this.analyser);
    this.buf = new Float32Array(this.analyser.fftSize);
    this.freqData = new Uint8Array(this.analyser.frequencyBinCount);
    this.binHz = this.ctx.sampleRate / this.analyser.fftSize;
    this.listening = true;

    let last = 0;
    const tick = (ts) => {
      if (!this.listening) return;
      this.analyser.getByteFrequencyData(this.freqData);
      Spectrum.draw(this.freqData, this.binHz); // jeden Frame: flüssige Anzeige
      if (ts - last >= 40) { // ~25 Analysen/s: der Zupfton trägt nur ~350 ms
        last = ts;
        this.analyser.getFloatTimeDomainData(this.buf);
        this.onReading(detectPitch(this.buf, this.ctx.sampleRate));
      }
      this.raf = requestAnimationFrame(tick);
    };
    this.raf = requestAnimationFrame(tick);
  },

  async stop() {
    this.listening = false;
    if (this.raf) { cancelAnimationFrame(this.raf); this.raf = 0; }
    if (this.stream) { this.stream.getTracks().forEach(t => t.stop()); this.stream = null; }
    if (this.ctx) { try { await this.ctx.close(); } catch { /* ignore */ } this.ctx = null; }
    this.analyser = null;
    this.freqData = null;
  },
};

// ----------------------- Live-Spektrum -----------------------

/// Stilisiertes Log-Frequenz-Spektrum (60–2000 Hz) des AnalyserNode.
/// Marker: erkannte Frequenz (Linie) + Ziel-Frequenz der Speiche (gestrichelt).
const Spectrum = {
  el: null, g: null, colors: null, FMIN: 60, FMAX: 2000, BARS: 72,

  x(f, w) { return w * Math.log(f / this.FMIN) / Math.log(this.FMAX / this.FMIN); },

  show(on) {
    if (!this.el) {
      this.el = document.getElementById('spectrum');
      this.g = this.el.getContext('2d');
    }
    this.el.hidden = !on;
    if (!on) return;
    this.el.setAttribute('aria-label', t('aria.spectrum'));
    const css = getComputedStyle(document.documentElement);
    this.colors = {
      bar: css.getPropertyValue('--primary').trim() || '#d97706',
      live: css.getPropertyValue('--on-surface').trim() || '#1c1917',
      target: css.getPropertyValue('--green').trim() || '#16a34a',
    };
  },

  draw(spec, binHz) {
    if (!this.el || this.el.hidden) return;
    // Backing-Store an CSS-Größe angleichen – heilt „Tab war beim Start
    // versteckt“ (clientWidth 0) und Rotation/Resize mid-session.
    const dpr = window.devicePixelRatio || 1;
    const want = Math.round(this.el.clientWidth * dpr);
    if (!want) return; // Mess-Tab gerade display:none
    if (this.el.width !== want) {
      this.el.width = want;
      this.el.height = Math.round(this.el.clientHeight * dpr);
    }
    const g = this.g, W = this.el.width, H = this.el.height;
    g.clearRect(0, 0, W, H);

    const bw = W / this.BARS, gap = Math.max(0.5, W * 0.002);
    for (let b = 0; b < this.BARS; b++) {
      const f0 = this.FMIN * Math.pow(this.FMAX / this.FMIN, b / this.BARS);
      const f1 = this.FMIN * Math.pow(this.FMAX / this.FMIN, (b + 1) / this.BARS);
      let m = 0;
      for (let i = Math.floor(f0 / binHz); i <= Math.ceil(f1 / binHz) && i < spec.length; i++) {
        if (spec[i] > m) m = spec[i];
      }
      const h = Math.max(H * 0.02, (m / 255) * (H - 4)); // Bodensatz, damit die Skala sichtbar bleibt
      g.globalAlpha = 0.25 + 0.75 * (m / 255);
      g.fillStyle = this.colors.bar;
      g.beginPath();
      if (g.roundRect) g.roundRect(b * bw + gap, H - h, bw - 2 * gap, h, bw * 0.3);
      else g.rect(b * bw + gap, H - h, bw - 2 * gap, h);
      g.fill();
    }
    g.globalAlpha = 1;

    if (Measure.liveHz >= this.FMIN && Measure.liveHz <= this.FMAX) {
      const x = this.x(Measure.liveHz, W);
      g.strokeStyle = this.colors.live;
      g.lineWidth = Math.max(1, W / 400);
      g.beginPath(); g.moveTo(x, 0); g.lineTo(x, H); g.stroke();
    }
    const tf = targetFreqForSelected();
    if (tf && tf >= this.FMIN && tf <= this.FMAX) {
      const x = this.x(tf, W);
      g.strokeStyle = this.colors.target;
      g.lineWidth = Math.max(1.5, W / 300);
      g.setLineDash([H * 0.07, H * 0.05]);
      g.beginPath(); g.moveTo(x, 0); g.lineTo(x, H); g.stroke();
      g.setLineDash([]);
    }
  },
};

const Measure = {
  listening: false,
  samples: [],
  recent: [],    // gleitendes Fenster für Auto-Erfassung
  armed: true,   // erst nach einer Tonpause (nächster Anzupfer) wieder erfassen
  auto: false,   // Auto-Weiterschalten – nur sinnvoll mit Laufrad
  starting: false,      // getUserMedia/Setup läuft noch
  captured: new Set(),  // Speichen-Indizes dieser Sitzung (Auto-Modus)
  resultHz: null,
  liveHz: 0,
  stopTimer: 0,
  IDLE_MS: 60000, // stoppt nach 60 s ohne erfasste Messung (Mikrofon nicht ewig offen)

  /// Inaktivitäts-Timeout neu aufziehen – jede erfasste Speiche verlängert.
  bumpIdle() {
    clearTimeout(this.stopTimer);
    this.stopTimer = setTimeout(() => this.finish(false), this.IDLE_MS);
  },

  progressHint() {
    return t('hint.autoProgress', {
      n: state.selectedSpokeIndex + 1, done: this.captured.size, total: state.wheel.spokes.length,
    });
  },

  async toggle() {
    if (this.starting) return; // Start läuft (Berechtigungsdialog) – Taps ignorieren
    if (this.listening) { await this.finish(true); return; }
    this.samples = [];
    this.recent = [];
    this.pluck = [];         // Frames {f, c} des aktuellen Zupfers
    this.pluckLocked = false;
    this.armed = true;
    this.captured = new Set(); // Indizes der in dieser Sitzung erfassten Speichen
    this.auto = !!(state.wheel && state.wheel.spokes.length);
    this.resultHz = null;
    this.liveHz = 0;
    setHint(this.auto ? this.progressHint() : t('hint.start'));
    this.listening = true;
    updateButton();
    this.starting = true;
    try {
      await Pitch.start(r => this.onReading(r));
    } catch {
      this.listening = false;
      updateButton();
      setHint(t('hint.micError'));
      return;
    } finally {
      this.starting = false;
    }
    if (!this.listening) { await Pitch.stop(); return; } // während des Starts gestoppt
    Spectrum.show(true);
    updatePips(0);
    document.getElementById('pips').hidden = false;
    this.bumpIdle();
  },

  onReading(r) {
    if (!this.listening) return;
    if (r.freq > 0) r.freq = correctOctave(r.freq, Pitch.freqData, Pitch.binHz);
    if (r.freq > 0) this.liveHz = r.freq;

    // Ein Zupfer = Folge von Frames mit Ton. Attack-Skip wurde durch das
    // clarity-gewichtete pluckVote ersetzt (siehe dort); fixe Zeitfenster
    // scheitern, weil weiche Zupfer sofort, harte erst nach ~280 ms sauber sind.
    const good = r.freq >= 80 && r.freq <= 1500 && r.clarity > 0.5 && r.rms >= 0.006;
    updateGauge(r.freq > 0 ? r.freq : 0, true);

    // Tonpause: Zupfer abschließen, scharfschalten für den nächsten.
    // Re-Arm erst nach ~10 leisen Frames (~400 ms): die Ausklingphase einer
    // Speiche dippt kurz unter den rms-Floor und darf nicht als Pause zählen,
    // sonst erzeugt ein Zupfer zwei Locks (der zweite landet auf der
    // falschen Speiche).
    if (!good) {
      this.silentFrames = (this.silentFrames || 0) + 1;
      if (this.silentFrames < 8) return;
      if (this.pluck.length) {
        const v = pluckVote(this.pluck);
        const totalW = this.pluck.reduce((s, q) => s + q.c * q.c, 0);
        const bestW = v ? this.pluck.filter(q => Math.abs(q.f / v.hz - 1) < 0.03).reduce((s, q) => s + q.c * q.c, 0) : 0;
        if (v && v.count >= 4 && bestW >= 0.35 * totalW) {
          this.commitPluck(v.hz);
        } else {
          // Fallback Dual-Mode-Sweep: Frames verteilen sich auf zwei Modi,
          // kein Cluster erreicht die Huerde. Stabile Frames (c>=0.75) sind
          // trotzdem verlaesslich -> gewichteter Median ueber sie.
          const strong = this.pluck.filter(q => q.c >= 0.75);
          if (strong.length >= 2) this.commitPluck(weightedMedian(strong));
        }
        this.pluck = [];
        this.pluckLocked = false;
        this.rmsFloor = 0;
      }
      this.armed = true;
      updatePips(0);
      return;
    }
    this.silentFrames = 0;

    // Onset-Segmentierung: neuer Anschlag mitten im Ausklingen des alten.
    // Sprung-Erkennung gegen den VORHERIGEN rms-Wert (Ausklingen ist glatt,
    // ~0.9x pro Frame; ein neuer Anschlag springt 3-10x). Erst 3
    // aufeinanderfolgende Sprung-Frames trennen — einzelne Dips nicht.
    const isLoud = r.rms > Math.max(0.025, 2.2 * (this._prevRms || 0));
    this._onsetRun = this.pluck.length && isLoud ? (this._onsetRun || 0) + 1 : 0;
    if (this.pluck.length && this._onsetRun === 3) {
      const onsetFrames = this.pluck.splice(-3); // gehoeren zum neuen Zupfer
      const v = pluckVote(this.pluck);
      if (v && v.count >= 4) this.commitPluck(v.hz);
      this.pluck = onsetFrames;
      this._onsetRun = 0;
      updatePips(this.pluck.length);
      return;
    }
    this._prevRms = r.rms;
    if (this.auto && !this.armed) return; // Ausklingen des erfassten Tons ignorieren
    this.samples.push(r.freq);
    this.pluck.push({ f: r.freq, c: r.clarity });
    if (this.pluck.length > 60) this.pluck.shift();
    updatePips(this.pluck.length);
    // Kein Frueh-Lock mehr: der Moden-Sweep im Ausklingen (obere Mode klingt
    // schneller ab) ist erst am Tonende sicher auswertbar. Lock bei Tonpause.
  },

  /// Zupfer-Ergebnis übernehmen (Fallback aus Tonpause oder manuellem Stopp).
  commitPluck(hz) {
    if (this.auto) this.lockReading(hz);
    else { this.resultHz = hz; this.finish(false); }
  },

  /// Stabile Messung übernehmen, zur nächsten Speiche schalten, weiter lauschen.
  /// Nach einer vollen Runde (alle Speichen erfasst) automatisch stoppen.
  lockReading(hz) {
    this.recent = [];
    this.armed = false; // bis zur nächsten Tonpause nicht erneut erfassen
    const spoke = selectedSpoke();
    if (!spoke) return;
    spoke.reading = {
      freqHz: hz,
      tensionN: tensionForHzOnSide(state.wheel, hz, spoke.side),
      timestamp: Date.now(),
    };
    save();
    this.captured.add(spoke.index);
    if (navigator.vibrate) navigator.vibrate(40);
    this.bumpIdle();
    updatePips(0);
    const done = spoke.index + 1;
    const count = state.wheel.spokes.length;
    const sub = `${fmtNum(hz, 1)} Hz · ${formatTension(spoke.reading.tensionN)}`;
    if (this.captured.size >= count) { // alle Speichen (distinkt) erfasst -> fertig
      render();
      captureFlash(t('toast.allDone', { total: count }), sub);
      toast(t('toast.allDone', { total: count }));
      if (navigator.vibrate) navigator.vibrate([60, 60, 60]);
      this.finish(false);
      return;
    }
    state.selectedSpokeIndex = (state.selectedSpokeIndex + 1) % count;
    render();
    setHint(this.progressHint());
    captureFlash(t('toast.applied', { n: done }), sub);
    toast(t('toast.applied', { n: done }));
  },

  async finish(aborted) {
    clearTimeout(this.stopTimer);
    this.stopTimer = 0;
    await Pitch.stop();
    this.listening = false;
    updateButton();
    Spectrum.show(false);
    document.getElementById('pips').hidden = true;

    if (this.auto) { // Werte wurden schon live übernommen
      setHint(t('hint.stopped'));
      updateGauge(0, false);
      return;
    }

    const result = this.resultHz ?? (pluckVote(this.pluck) || {}).hz ?? median(this.samples);
    if (result != null) {
      this.resultHz = result;
      if (navigator.vibrate) navigator.vibrate(40);
      setHint(aborted ? t('hint.stopped') : t('hint.captured'));
      if (!aborted) {
        const n = previewTensionN(result);
        captureFlash(t('hint.captured'), fmtNum(result, 1) + ' Hz' + (n != null ? ' · ' + formatTension(n) : ''));
      }
    } else {
      this.resultHz = null;
      setHint(aborted ? t('hint.aborted') : t('hint.noClear'));
    }
    updateGauge(this.resultHz ?? 0, false);
    renderApplySection();
  },

  apply() {
    const hz = this.resultHz;
    const spoke = selectedSpoke();
    if (hz == null || !spoke) return;
    spoke.reading = {
      freqHz: hz,
      tensionN: tensionForHzOnSide(state.wheel, hz, spoke.side),
      timestamp: Date.now(),
    };
    save();
    render();
    toast(t('toast.applied', { n: spoke.index + 1 }));
  },
};

function updateButton() {
  const btn = document.getElementById('listen-btn');
  btn.textContent = Measure.listening ? '■  ' + t('btn.stop') : '🎤  ' + t('btn.listen');
  btn.classList.toggle('listening', Measure.listening);
}
function setHint(text) { document.getElementById('gauge-hint').textContent = text; }

/// Sample-Fortschritt der aktuellen Speiche: n von MIN_SAMPLES Segmenten gefüllt.
function updatePips(n) {
  const el = document.getElementById('pips');
  if (el.childElementCount !== MIN_SAMPLES) el.innerHTML = '<span></span>'.repeat(MIN_SAMPLES);
  [...el.children].forEach((p, i) => p.classList.toggle('on', i < n));
}

/// Große Erfolgs-Einblendung über dem Gauge (Haken + Titel + Hz/Spannung).
let flashTimer = 0;
function captureFlash(title, sub) {
  const el = document.getElementById('capture-flash');
  el.querySelector('.flash-title').textContent = title;
  el.querySelector('.flash-sub').textContent = sub;
  el.hidden = false;
  el.classList.remove('show');
  void el.offsetWidth; // Reflow erzwingen, damit die Animation neu startet
  el.classList.add('show');
  clearTimeout(flashTimer);
  flashTimer = setTimeout(() => { el.hidden = true; el.classList.remove('show'); }, 1250);
}

function previewTensionN(hz) {
  const w = state.wheel, s = selectedSpoke();
  if (!w || !s || !(hz > 0)) return null;
  return tensionForHzOnSide(w, hz, s.side);
}

/// Gauge: große Hz-Zahl + Note + Cent-Tuner + berechnete Spannung + Ziel-Abweichung.
function updateGauge(hz, listening) {
  document.getElementById('gauge-freq').textContent = hz > 0 ? fmtNum(hz, 1) : '--';
  document.getElementById('gauge-note').innerHTML = hz > 0 ? noteHtml(hz) : '<span class="muted">—</span>';
  document.getElementById('gauge-label').textContent = listening ? t('gauge.listening') : t('gauge.freq');

  // Cent-Tuner: Nadel mittig = exakt auf der Note.
  const note = hzToNote(hz);
  const tuner = document.getElementById('tuner');
  if (note) {
    tuner.hidden = false;
    document.getElementById('tuner-dot').style.left = (note.cents + 50) + '%';
    tuner.classList.toggle('in-tune', Math.abs(note.cents) <= 5);
  } else {
    tuner.hidden = true;
  }

  const n = previewTensionN(hz);
  document.getElementById('gauge-tension').textContent =
    hz > 0 ? (n != null ? formatTension(n) : '—') : '--';

  // Zielspannung der Seite: live die Abweichung in %, sonst Ziel + Ziel-Frequenz.
  const tgtEl = document.getElementById('gauge-target');
  const w = state.wheel, s = selectedSpoke();
  const tgt = w && s ? targetForSide(w, s.side) : 0;
  if (tgt > 0 && n != null && hz > 0) {
    const dev = (n - tgt) / tgt * 100;
    const cls = Math.abs(dev) <= 5 ? 'ok' : Math.abs(dev) <= 10 ? 'near' : 'off';
    tgtEl.hidden = false;
    tgtEl.className = 'gauge-target ' + cls;
    tgtEl.textContent = `${t('gauge.target')} ${formatTension(tgt)} · ${dev >= 0 ? '+' : '−'}${Math.abs(dev).toFixed(0)} %`;
  } else if (tgt > 0) {
    tgtEl.hidden = false;
    tgtEl.className = 'gauge-target';
    tgtEl.textContent = `${t('gauge.target')} ${formatTension(tgt)} ≈ ${fmtNum(targetFreqForSelected(), 0)} Hz`;
  } else {
    tgtEl.hidden = true;
  }

  document.getElementById('gauge').classList.toggle('live', listening);
}

/// Kontextkarte: aktives Laufrad/Profil/Speiche + Einheit-Umschalter.
function renderMeasureContext() {
  const el = document.getElementById('measure-context');
  const w = state.wheel;
  const spoke = selectedSpoke();

  let body;
  if (!w) {
    body = `<p class="muted">${t('ctx.noWheel')}</p>`;
  } else {
    const rows = [
      [t('ctx.wheel'), `${escapeHtml(w.name)} (${positionLabel(w.position)})`],
      [t('ctx.profile'), `${escapeHtml(profileName(w.profile))} ~${fmtNum(Math.round(profileGperM(w.profile)), 0)} g/m`],
    ];
    if (spoke) {
      rows.push([t('ctx.spoke'), `${t('label.nr')} ${spoke.index + 1} · ${sideLabel(spoke.side)}`]);
      rows.push([t('ctx.freeLength'), `${fmtNum(Math.round(lengthMmForSide(w, spoke.side)), 0)} mm`]);
      const tgt = targetForSide(w, spoke.side);
      if (tgt > 0) rows.push([t('gauge.target'), `${formatTension(tgt)} ≈ ${fmtNum(targetFreqForSelected(), 0)} Hz`]);
    }
    body = `<h3>${t('ctx.activeWheel')}</h3>` +
      rows.map(([k, v]) => `<div class="info-row"><span>${k}</span><b>${v}</b></div>`).join('') +
      (spoke ? '' : `<p class="muted small">${t('ctx.noSpokeSelected')}</p>`) +
      `<p class="muted small">${t('ctx.editHint')}</p>`;
  }

  el.innerHTML = body + `
    <hr>
    <h3>${t('ctx.unit')}</h3>
    <div class="seg" id="unit-seg">
      <button data-unit="N" class="${state.unit === 'N' ? 'sel' : ''}">${t('unit.N')}</button>
      <button data-unit="kgf" class="${state.unit === 'kgf' ? 'sel' : ''}">${t('unit.kgf')}</button>
    </div>`;

  el.querySelectorAll('#unit-seg button').forEach(b => {
    b.addEventListener('click', () => {
      state.unit = b.dataset.unit;
      save();
      render();
      updateGauge(Measure.listening ? Measure.liveHz : (Measure.resultHz ?? 0), Measure.listening);
    });
  });
}

function renderApplySection() {
  const el = document.getElementById('apply-section');
  const spoke = selectedSpoke();
  if (Measure.resultHz != null && spoke) {
    el.innerHTML = `<button class="btn-outline" id="apply-btn">✓  ${t('btn.applyToSpoke', { n: spoke.index + 1 })}</button>`;
    el.querySelector('#apply-btn').addEventListener('click', () => Measure.apply());
  } else if (Measure.resultHz != null && !spoke) {
    el.innerHTML = `<div class="note-box">${t('apply.needWheel')}</div>`;
  } else {
    el.innerHTML = '';
  }
}

// ----------------------- Laufrad-Tab -----------------------

function renderWheelTab() {
  const el = document.getElementById('wheel-content');
  if (!state.wheel) { renderCreateForm(el); return; }
  renderWheelDetail(el, state.wheel);
}

function renderCreateForm(el) {
  const counts = [];
  for (let n = 16; n <= 40; n += 2) counts.push(n);
  el.innerHTML = `
    <h2>${t('create.title')}</h2>
    <label class="field">${t('create.name')}
      <input id="w-name" type="text" value="${escapeHtml(t('create.defaultName'))}">
    </label>
    <div class="field">${t('create.position')}
      <div class="seg" id="w-pos">
        <button data-pos="front" class="sel">${t('pos.front')}</button>
        <button data-pos="rear">${t('pos.rear')}</button>
      </div>
    </div>
    <label class="field">${t('create.spokeCount')}
      <select id="w-count">
        ${counts.map(n => `<option value="${n}" ${n === 32 ? 'selected' : ''}>${n} ${t('label.spokes')}</option>`).join('')}
      </select>
    </label>
    <button class="btn-filled" id="w-create">+  ${t('create.create')}</button>`;

  let pos = 'front';
  el.querySelectorAll('#w-pos button').forEach(b => b.addEventListener('click', () => {
    pos = b.dataset.pos;
    el.querySelectorAll('#w-pos button').forEach(x => x.classList.toggle('sel', x === b));
  }));
  el.querySelector('#w-create').addEventListener('click', () => {
    const name = el.querySelector('#w-name').value.trim() || t('create.fallbackName');
    const count = parseInt(el.querySelector('#w-count').value, 10);
    state.wheel = createWheel(name, pos, count);
    state.selectedSpokeIndex = 0;
    save();
    render();
  });
}

function renderWheelDetail(el, w) {
  // Referenz für Band-Farben: Zielspannung der Seite, sonst Seitenmittel.
  const avg = {
    left: sideStats(w.spokes.filter(s => s.side === 'left' && s.reading).map(s => s.reading.tensionN), 0).avg,
    right: sideStats(w.spokes.filter(s => s.side === 'right' && s.reading).map(s => s.reading.tensionN), 0).avg,
  };
  const ref = { left: w.targetLeftN || avg.left, right: w.targetRightN || avg.right };

  el.innerHTML = `
    <div class="row-between">
      <div>
        <h2>${escapeHtml(w.name)}</h2>
        <p class="muted">${positionLabel(w.position)} · ${w.spokes.length} ${t('label.spokes')}</p>
      </div>
      <button class="btn-outline small" id="w-new">↻ ${t('btn.newWheel')}</button>
    </div>

    <div class="card">
      <h3>${t('build.title')}</h3>
      <p class="muted small">${t('build.subtitle')}</p>
      ${profileEditorHtml(w)}
      ${lengthInput(t('build.freeLeft'), 'left', w.leftLengthMm)}
      ${lengthInput(t('build.freeRight'), 'right', w.rightLengthMm)}
      <p class="muted small">${t('build.note')}</p>
      ${targetInput(t('build.targetLeft'), 'left', w.targetLeftN)}
      ${targetInput(t('build.targetRight'), 'right', w.targetRightN)}
      <p class="muted small">${t('build.targetHint')}</p>
    </div>

    <div class="card wheel-card">
      ${wheelSvg(w, ref)}
      <div class="legend">
        <span><i style="background:${SPOKE_COLORS.unmeasured.fill}"></i>${t('legend.unmeasured')}</span>
        <span><i style="background:${SPOKE_COLORS.in.fill}"></i>${t('legend.inBand')}</span>
        <span><i style="background:${SPOKE_COLORS.out.fill}"></i>${t('legend.outBand')}</span>
      </div>
    </div>

    <div class="card" id="selected-spoke"></div>

    <div class="card" id="evenness"></div>`;

  el.querySelector('#w-new').addEventListener('click', () => {
    if (confirm(t('confirm.discardWheel'))) {
      state.wheel = null;
      state.selectedSpokeIndex = 0;
      save();
      render();
    }
  });
  el.querySelectorAll('#w-shape button').forEach(b => b.addEventListener('click', () => {
    w.profile.shape = b.dataset.shape;
    save();
    render();
  }));
  const matSel = el.querySelector('#w-material');
  if (matSel) matSel.addEventListener('change', () => {
    w.profile.materialKey = matSel.value;
    save();
    render();
  });
  el.querySelectorAll('.dim-input').forEach(inp => inp.addEventListener('change', () => {
    let v = parseFloat(inp.value);
    if (!Number.isFinite(v)) v = parseFloat(inp.min);
    v = Math.max(parseFloat(inp.min), Math.min(parseFloat(inp.max), v));
    inp.value = v;
    w.profile[inp.dataset.dim] = v;
    save();
    render();
  }));
  el.querySelectorAll('.len-input').forEach(inp => {
    inp.addEventListener('change', () => {
      let v = Math.round(parseFloat(inp.value));
      if (!Number.isFinite(v)) v = 250;
      v = Math.max(60, Math.min(400, v)); // sane physical bounds
      inp.value = v;
      if (inp.dataset.side === 'left') w.leftLengthMm = v; else w.rightLengthMm = v;
      save();
      render();
    });
  });
  el.querySelectorAll('.tgt-input').forEach(inp => {
    inp.addEventListener('change', () => {
      let v = Math.round(parseFloat(inp.value));
      if (!Number.isFinite(v) || v < 0) v = 0;
      v = Math.min(2500, v);
      inp.value = v;
      if (inp.dataset.side === 'left') w.targetLeftN = v; else w.targetRightN = v;
      save();
      render();
    });
  });
  el.querySelectorAll('.spoke-dot').forEach(dot => dot.addEventListener('click', () => {
    state.selectedSpokeIndex = parseInt(dot.dataset.index, 10);
    save();
    renderSelectedSpoke();
    renderWheelTab(); // Auswahl-Ring aktualisieren
    renderMeasureContext();
  }));

  renderSelectedSpoke();
  renderEvenness(w);
}

function lengthInput(label, side, value) {
  return `<div class="field"><span>${label}</span>
    <div class="num-wrap">
      <input class="len-input" data-side="${side}" type="number" inputmode="numeric"
             min="60" max="400" step="1" value="${Math.round(value)}">
      <span class="num-unit">mm</span>
    </div>
  </div>`;
}

function targetInput(label, side, value) {
  return `<div class="field"><span>${label}</span>
    <div class="num-wrap">
      <input class="tgt-input" data-side="${side}" type="number" inputmode="numeric"
             min="0" max="2500" step="10" value="${Math.round(value || 0)}">
      <span class="num-unit">N</span>
    </div>
  </div>`;
}

/// Speichenprofil-Editor: Material + Form (rund / flach / direkt g/m) + Maße,
/// mit Live-Anzeige der Masse pro Meter. Deckt runde UND flache (Carbon-)Speichen ab.
function profileEditorHtml(w) {
  const p = w.profile;
  let dims;
  if (p.shape === 'custom') {
    dims = dimRow(t('build.massPerM'), 'gPerM', p.gPerM, 1, 200, 0.1, 'g/m');
  } else if (p.shape === 'bladed') {
    dims = dimRow(t('build.width'), 'widthMm', p.widthMm, 0.5, 6, 0.1, 'mm') +
      dimRow(t('build.thickness'), 'thicknessMm', p.thicknessMm, 0.3, 4, 0.1, 'mm');
  } else {
    dims = dimRow(t('build.diameter'), 'diameterMm', p.diameterMm, 1, 5, 0.1, 'mm');
  }
  const material = p.shape === 'custom' ? '' : `
    <label class="field">${t('build.material')}
      <select id="w-material">
        ${MATERIAL_KEYS.map(m => `<option value="${m}" ${p.materialKey === m ? 'selected' : ''}>${t('material.' + m)}</option>`).join('')}
      </select>
    </label>`;
  return `
    <div class="field">${t('build.shape')}
      <div class="seg" id="w-shape">
        ${SHAPES.map(sh => `<button data-shape="${sh}" class="${p.shape === sh ? 'sel' : ''}">${sh === 'custom' ? 'g/m' : t('shape.' + sh)}</button>`).join('')}
      </div>
    </div>
    ${material}
    ${dims}
    <p class="muted small">≈ ${fmtNum(Math.round(profileGperM(p)), 0)} g/m</p>`;
}

function dimRow(label, key, value, min, max, step, unit) {
  return `<div class="field"><span>${label}</span>
    <div class="num-wrap">
      <input class="dim-input" data-dim="${key}" type="number" inputmode="decimal"
             min="${min}" max="${max}" step="${step}" value="${value}">
      <span class="num-unit">${unit}</span>
    </div>
  </div>`;
}

/// refForSide = Zielspannung der Seite oder (ohne Ziel) das Seitenmittel.
function spokeStateOf(spoke, refForSide) {
  if (!spoke.reading) return 'unmeasured';
  if (refForSide > 0 && Math.abs(spoke.reading.tensionN - refForSide) <= refForSide * 0.10) return 'in';
  return 'out';
}

function wheelSvg(w, ref) {
  const n = w.spokes.length;
  const cx = 160, cy = 160, R = 150;
  const spokeR = R * 0.78, hubR = R * 0.16;
  let out = `<svg viewBox="0 0 320 320" class="wheel-svg" role="img" aria-label="${escapeHtml(t('aria.wheel', { n }))}">
    <circle cx="${cx}" cy="${cy}" r="${R * 0.94}" fill="none" stroke="var(--outline)" stroke-width="4"/>
    <circle cx="${cx}" cy="${cy}" r="${hubR}" fill="var(--surface-2)" stroke="var(--outline)" stroke-width="1.5"/>`;

  for (let i = 0; i < n; i++) {
    const sp = w.spokes[i];
    const ang = i * (2 * Math.PI / n) - Math.PI / 2;
    const x = cx + Math.cos(ang) * spokeR, y = cy + Math.sin(ang) * spokeR;
    const hx = cx + Math.cos(ang) * hubR, hy = cy + Math.sin(ang) * hubR;
    const col = SPOKE_COLORS[spokeStateOf(sp, ref[sp.side])];
    const sel = i === state.selectedSpokeIndex;

    out += `<line x1="${hx.toFixed(1)}" y1="${hy.toFixed(1)}" x2="${x.toFixed(1)}" y2="${y.toFixed(1)}" stroke="${col.fill}" stroke-width="${sel ? 3 : 1.4}" opacity="${sel ? 1 : 0.5}"/>`;
    if (sel) out += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="12" fill="none" stroke="var(--primary)" stroke-width="3"/>`;
    out += `<circle class="spoke-dot" data-index="${i}" cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="8" fill="${col.fill}" stroke="var(--surface)" stroke-width="1"/>`;
    out += `<text x="${x.toFixed(1)}" y="${y.toFixed(1)}" text-anchor="middle" dominant-baseline="central" font-size="9" font-weight="bold" fill="${col.text}" pointer-events="none">${sp.side === 'left' ? 'L' : 'R'}</text>`;
    if (sp.reading) {
      const lx = cx + Math.cos(ang) * (spokeR + 22), ly = cy + Math.sin(ang) * (spokeR + 22);
      out += `<text x="${lx.toFixed(1)}" y="${ly.toFixed(1)}" text-anchor="middle" dominant-baseline="central" font-size="9" fill="var(--on-variant)" pointer-events="none">${Math.round(sp.reading.tensionN)}</text>`;
    }
  }
  return out + '</svg>';
}

function renderSelectedSpoke() {
  const el = document.getElementById('selected-spoke');
  if (!el) return;
  const spoke = selectedSpoke();
  if (!spoke) {
    el.innerHTML = `<p class="muted">${t('spoke.tapToSelect')}</p>`;
    return;
  }
  const r = spoke.reading;
  el.innerHTML = `
    <div class="row-between">
      <h3>${t('ctx.spoke')} ${spoke.index + 1}</h3>
      <span class="muted">${sideLabel(spoke.side)}</span>
    </div>
    <div class="field">${t('spoke.side')}
      <div class="seg" id="spoke-side">
        <button data-side="left" class="${spoke.side === 'left' ? 'sel' : ''}">${t('side.left')}</button>
        <button data-side="right" class="${spoke.side === 'right' ? 'sel' : ''}">${t('side.right')}</button>
      </div>
    </div>
    ${r ? `
      <div class="reading">
        <div class="reading-main">${formatTension(r.tensionN)}</div>
        <div class="muted">${fmtNum(r.freqHz, 1)} Hz · ${noteHtml(r.freqHz)}</div>
      </div>` : `<p class="muted">${t('spoke.notMeasured')}</p>`}`;

  el.querySelectorAll('#spoke-side button').forEach(b => b.addEventListener('click', () => {
    spoke.side = b.dataset.side;
    save();
    render();
  }));
}

function renderEvenness(w) {
  const el = document.getElementById('evenness');
  if (!el) return;
  const tFor = side => w.spokes.filter(s => s.side === side && s.reading).map(s => s.reading.tensionN);
  const stats = {
    left: sideStats(tFor('left'), w.spokes.filter(s => s.side === 'left').length, 0.10, w.targetLeftN),
    right: sideStats(tFor('right'), w.spokes.filter(s => s.side === 'right').length, 0.10, w.targetRightN),
  };
  el.innerHTML = `<h3>${t('even.title')}</h3>` +
    sideStatsHtml(t('side.left'), stats.left) + '<hr>' + sideStatsHtml(t('side.right'), stats.right) +
    `<p class="muted small">${t('even.footer')}</p>`;
}

function sideStatsHtml(label, s) {
  const head = `<div class="row-between"><b>${label}</b><span class="muted">${s.measured}/${s.total} ${t('even.measured')}</span></div>`;
  if (!s.measured) return head + `<p class="muted small">${t('even.noData')}</p>`;
  const chips = [
    [t('stat.mean'), formatTension(s.avg)], [t('stat.min'), formatTension(s.min)],
    [t('stat.max'), formatTension(s.max)], [t('stat.spread'), formatTension(s.std)],
  ].map(([k, v]) => `<span class="chip"><i>${k}</i> ${v}</span>`).join('');
  const col = s.pct >= 80 ? '#16a34a' : s.pct >= 50 ? '#ea580c' : '#dc2626';
  return head + `<div class="chips">${chips}</div>
    <div class="row-between small"><span>${t('even.band')}</span><b style="color:${col}">${s.within}/${s.measured} (${Math.round(s.pct)}%)</b></div>
    <div class="bar"><div style="width:${Math.min(100, s.pct).toFixed(0)}%;background:${col}"></div></div>`;
}

// ----------------------- Ratgeber-Tab -----------------------

/// Baut die aufklappbaren Ratgeber-Karten aus GUIDE[LANG].
function renderGuide() {
  const el = document.getElementById('guide-content');
  if (!el) return;
  el.innerHTML = guideCards().map(card => `
    <details class="guide">
      <summary>${escapeHtml(card.title)}</summary>
      <div class="guide-body"><ul>
        ${card.points.map(p => `<li>${escapeHtml(p)}</li>`).join('')}
        ${card.note ? `<li class="guide-note">${escapeHtml(card.note)}</li>` : ''}
      </ul></div>
    </details>`).join('');
}

// ----------------------- Helpers -----------------------

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

let toastTimer = 0;
function toast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 2200);
}

if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', initDom);
}
