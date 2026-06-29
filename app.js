'use strict';

// =====================================================================
// Reine Berechnung (DOM-frei, auch unter node testbar -> selftest.js)
// =====================================================================

const GRAVITY = 9.80665;
const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

/// Lineare Massendichte (kg/m) einer Speiche aus Durchmesser (mm) und Dichte.
function muFromDiameterMm(diameterMm, rhoKgM3 = 7850) {
  const r = diameterMm / 2000;
  return rhoKgM3 * Math.PI * r * r;
}

/// Saitenspannung in Newton: T = 4 * mu * L^2 * f^2.
function tensionNewton(freqHz, lengthM, muKgM) {
  return 4 * muKgM * lengthM * lengthM * freqHz * freqHz;
}

function newtonToKgf(n) {
  return n / GRAVITY;
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

/// Autokorrelation -> Grundfrequenz. clarity 0..1 = Periodizität, rms = Pegel.
/// Port des klassischen Web-Audio-Pitchdetektors (ACF + Parabel-Interpolation).
// ponytail: O(n^2)-ACF auf <=4096 Samples, gedrosselt aufgerufen; bei
// Performance-Problemen auf FFT-basiert umstellen.
function detectPitch(buf, sampleRate) {
  const SIZE = buf.length;
  let rms = 0;
  for (let i = 0; i < SIZE; i++) {
    const v = buf[i];
    rms += v * v;
  }
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

  const c = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    let sum = 0;
    for (let j = 0; j < n - i; j++) sum += b[j] * b[j + i];
    c[i] = sum;
  }

  // Erstes Tal überspringen, dann höchstes Maximum suchen.
  let d = 0;
  while (d < n - 1 && c[d] > c[d + 1]) d++;
  let maxval = -1, maxpos = -1;
  for (let i = d; i < n; i++) {
    if (c[i] > maxval) { maxval = c[i]; maxpos = i; }
  }
  if (maxpos <= 0) return { freq: -1, clarity: 0, rms };

  // Parabel-Interpolation um das Maximum für Sub-Sample-Genauigkeit.
  let T0 = maxpos;
  const x1 = c[T0 - 1] || 0, x2 = c[T0], x3 = c[T0 + 1] || 0;
  const a = (x1 + x3 - 2 * x2) / 2;
  const bb = (x3 - x1) / 2;
  if (a) T0 = T0 - bb / (2 * a);

  const freq = sampleRate / T0;
  const clarity = c[0] ? maxval / c[0] : 0;
  return { freq, clarity, rms };
}

/// Statistik einer Laufradseite (Port von Wheel.statsFor).
function sideStats(tensions, total, band = 0.10) {
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
  let varSum = 0, within = 0;
  for (const t of tensions) {
    const dd = t - avg;
    varSum += dd * dd;
    if (Math.abs(dd) <= avg * band) within++;
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
    muFromDiameterMm, tensionNewton, newtonToKgf, hzToNote, median,
    detectPitch, sideStats, GRAVITY,
  };
}

// =====================================================================
// App-Zustand
// =====================================================================

const STORAGE_KEY = 'speichen_state_v1';
// Dichte (kg/m^3) je Werkstoff-Key. Aktuell nur Stahl genutzt.
const MATERIALS = { steel: 7850, stainless: 7900, aluminium: 2700, titanium: 4500 };
const PROFILES = [
  { diameterMm: 2.0, materialKey: 'steel' },
  { diameterMm: 1.8, materialKey: 'steel' },
  { diameterMm: 1.5, materialKey: 'steel' },
];
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
  } catch { /* korrupte Daten ignorieren */ }
}
function save() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch { /* ignore */ }
}

function profileMu(p) { return muFromDiameterMm(p.diameterMm, MATERIALS[p.materialKey] ?? 7850); }
function profileGperM(p) { return profileMu(p) * 1000; }
/// Lokalisierter Anzeigename eines Profils, z. B. „2,0 mm Stahl“ / „2.0 mm Steel“.
function profileName(p) { return `${fmtNum(p.diameterMm, 1)} mm ${t('material.' + (p.materialKey || 'steel'))}`; }

function createWheel(name, position, spokeCount) {
  const spokes = [];
  for (let i = 0; i < spokeCount; i++) {
    spokes.push({ index: i, side: i % 2 === 0 ? 'left' : 'right', reading: null });
  }
  return { name, position, profile: { ...PROFILES[0] }, leftLengthMm: 250, rightLengthMm: 250, spokes };
}

function lengthMmForSide(w, side) { return side === 'left' ? w.leftLengthMm : w.rightLengthMm; }
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
  updateGauge(0, 0, false);

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
  updateGauge(
    Measure.listening ? Measure.liveHz : (Measure.resultHz ?? 0),
    0, Measure.listening,
  );
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
    this.listening = true;

    let last = 0;
    const tick = (ts) => {
      if (!this.listening) return;
      if (ts - last >= 70) { // ~14 Analysen/s reichen, sparen CPU
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
  },
};

const Measure = {
  listening: false,
  samples: [],
  resultHz: null,
  liveHz: 0,
  stopTimer: 0,
  MAX_LISTEN_MS: 60000, // Sicherheits-Cap, damit das Mikrofon nicht ewig läuft

  async toggle() {
    if (this.listening) { await this.finish(true); return; }
    this.samples = [];
    this.resultHz = null;
    this.liveHz = 0;
    setHint(t('hint.start'));
    this.listening = true;
    updateButton();
    try {
      await Pitch.start(r => this.onReading(r));
    } catch {
      this.listening = false;
      updateButton();
      setHint(t('hint.micError'));
      return;
    }
    // Kein kurzes Auto-Stopp mehr: läuft bis „Stoppen“ (oder Sicherheits-Cap).
    this.stopTimer = setTimeout(() => this.finish(false), this.MAX_LISTEN_MS);
  },

  onReading(r) {
    if (!this.listening) return;
    if (r.freq > 0) this.liveHz = r.freq;
    const level = Math.min(1, r.rms * 4);
    if (r.freq >= 80 && r.freq <= 1500 && r.clarity > 0.9) this.samples.push(r.freq);
    updateGauge(r.freq > 0 ? r.freq : 0, level, true);
  },

  async finish(aborted) {
    clearTimeout(this.stopTimer);
    this.stopTimer = 0;
    await Pitch.stop();
    this.listening = false;
    updateButton();

    const result = median(this.samples);
    if (result != null) {
      this.resultHz = result;
      setHint(aborted ? t('hint.stopped') : t('hint.detected'));
    } else {
      this.resultHz = null;
      setHint(aborted ? t('hint.aborted') : t('hint.noClear'));
    }
    updateGauge(this.resultHz ?? 0, 0, false);
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

function previewTensionN(hz) {
  const w = state.wheel, s = selectedSpoke();
  if (!w || !s || !(hz > 0)) return null;
  return tensionForHzOnSide(w, hz, s.side);
}

/// Gauge: große Hz-Zahl + Note + Cent-Tuner + berechnete Spannung + Pegel.
function updateGauge(hz, level, listening) {
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

  const bar = document.getElementById('level-bar');
  bar.parentElement.hidden = !listening;
  bar.style.width = Math.round(Math.min(1, level) * 100) + '%';

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
      updateGauge(Measure.listening ? Measure.liveHz : (Measure.resultHz ?? 0), 0, Measure.listening);
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
  // Seitenmittel für Band-Farben.
  const avg = {
    left: sideStats(w.spokes.filter(s => s.side === 'left' && s.reading).map(s => s.reading.tensionN), 0).avg,
    right: sideStats(w.spokes.filter(s => s.side === 'right' && s.reading).map(s => s.reading.tensionN), 0).avg,
  };

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
      <label class="field">${t('build.profile')}
        <select id="w-profile">
          ${PROFILES.map((p, i) => `<option value="${i}" ${p.diameterMm === w.profile.diameterMm ? 'selected' : ''}>${profileName(p)} · ~${fmtNum(Math.round(profileGperM(p)), 0)} g/m</option>`).join('')}
        </select>
      </label>
      ${lengthInput(t('build.freeLeft'), 'left', w.leftLengthMm)}
      ${lengthInput(t('build.freeRight'), 'right', w.rightLengthMm)}
      <p class="muted small">${t('build.note')}</p>
    </div>

    <div class="card wheel-card">
      ${wheelSvg(w, avg)}
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
  el.querySelector('#w-profile').addEventListener('change', e => {
    w.profile = { ...PROFILES[parseInt(e.target.value, 10)] };
    save();
    render();
  });
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

function spokeStateOf(spoke, avgForSide) {
  if (!spoke.reading) return 'unmeasured';
  if (avgForSide > 0 && Math.abs(spoke.reading.tensionN - avgForSide) <= avgForSide * 0.10) return 'in';
  return 'out';
}

function wheelSvg(w, avg) {
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
    const col = SPOKE_COLORS[spokeStateOf(sp, avg[sp.side])];
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
    left: sideStats(tFor('left'), w.spokes.filter(s => s.side === 'left').length),
    right: sideStats(tFor('right'), w.spokes.filter(s => s.side === 'right').length),
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
