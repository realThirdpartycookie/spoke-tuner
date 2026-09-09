// Runnable check for the pure math: `node selftest.js`
const assert = require('assert');
const {
  muFromDiameterMm, muFromBladeMm, tensionNewton, newtonToKgf, freqForTension, hzToNote,
  median, correctOctave, sideStats, stableReading, GRAVITY,
  tensionDeltaPerTurnN, calculateTurnsAdvice, formatTurnsFraction,
  profileThreadDiaMm, profileModulusPa,
} = require('./app.js');

// Physik (Port der Flutter-Tests).
assert.ok(Math.abs(muFromDiameterMm(2.0) - 0.0247) < 0.0247 * 0.02, 'mu(2.0mm round steel)');
assert.ok(Math.abs(tensionNewton(422, 0.25, 0.0247) - 1100) < 1100 * 0.03, 'T(422Hz)');
assert.strictEqual(newtonToKgf(GRAVITY), 1.0, 'N->kgf');

// Turns-Berechnung & Speichen-Elastizität.
// Stahl 290 mm, d=2.0 mm, E=200 GPa:
// A = pi*1e-6 m^2, k = 2e11 * pi*1e-6 / 0.29 ~= 2.1666e6 N/m.
// deltaT = k * 0.00045357 * 0.40 ~= 393.1 N/Turn.
const deltaN = tensionDeltaPerTurnN(290, 2.0, 2.0e11);
assert.ok(Math.abs(deltaN - 393.1) < 2.0, 'tensionDeltaPerTurnN steel 290mm');
// Kalibrierter Override hat Vorrang
assert.strictEqual(tensionDeltaPerTurnN(290, 2.0, 2.0e11, 450), 450, 'calibrated deltaN override');

// Formatierung von Achteldrehungen
assert.strictEqual(formatTurnsFraction(0), '0', 'turns 0');
assert.strictEqual(formatTurnsFraction(0.125), '1/8', 'turns 1/8');
assert.strictEqual(formatTurnsFraction(0.25), '1/4', 'turns 1/4');
assert.strictEqual(formatTurnsFraction(0.5), '1/2', 'turns 1/2');
assert.strictEqual(formatTurnsFraction(0.75), '3/4', 'turns 3/4');
assert.strictEqual(formatTurnsFraction(1.0), '1', 'turns 1');
assert.strictEqual(formatTurnsFraction(1.25), '1 1/4', 'turns 1 1/4');
assert.strictEqual(formatTurnsFraction(2.0), '2', 'turns 2');

// Turns-Advice: TIGHTEN, LOOSEN, OK
const advTighten = calculateTurnsAdvice(1000, 1100, 400); // delta = +100 N -> raw 0.25 -> 1/4
assert.strictEqual(advTighten.direction, 'TIGHTEN');
assert.strictEqual(advTighten.turns, 0.25);
assert.strictEqual(advTighten.turnsLabel, '1/4');

const advLoosen = calculateTurnsAdvice(1200, 1100, 400); // delta = -100 N -> raw 0.25 -> 1/4
assert.strictEqual(advLoosen.direction, 'LOOSEN');
assert.strictEqual(advLoosen.turns, 0.25);
assert.strictEqual(advLoosen.turnsLabel, '1/4');

const advOk = calculateTurnsAdvice(1120, 1100, 400, 0.05); // innerhalb 5% Band
assert.strictEqual(advOk.direction, 'OK');
assert.strictEqual(advOk.turns, 0);

// Nicht-runde / Carbon-Speichen.
// Flache Stahlspeiche 2,3 x 0,9 mm: rho*w*t = 7850*0.0023*0.0009 ~= 0.01625 kg/m.
assert.ok(Math.abs(muFromBladeMm(2.3, 0.9) - 0.016249) < 1e-4, 'mu(bladed steel)');
// Carbon ist viel leichter: runde 2,0 mm Carbon (1600) << Stahl (7850).
assert.ok(muFromDiameterMm(2.0, 1600) < muFromDiameterMm(2.0, 7850) * 0.3, 'carbon lighter than steel');
// Flache Carbon-Speiche 2,3 x 0,9 mm: 1600*0.0023*0.0009 ~= 0.003312 kg/m.
assert.ok(Math.abs(muFromBladeMm(2.3, 0.9, 1600) - 0.0033120) < 1e-5, 'mu(bladed carbon)');

// Note (neues Feature).
let n = hzToNote(440);
assert.deepStrictEqual([n.label, n.cents], ['A4', 0], 'A4=440Hz');
n = hzToNote(261.63);
assert.deepStrictEqual([n.label, n.cents], ['C4', 0], 'C4=261.63Hz');
n = hzToNote(466.16);
assert.deepStrictEqual([n.label, n.cents], ['A#4', 0], 'A#4=466.16Hz');
assert.ok(hzToNote(452) .cents > 0 && hzToNote(452).label === 'A4', 'A4 sharp -> +cents');
assert.strictEqual(hzToNote(0), null, 'f<=0 -> null');

// Median.
assert.strictEqual(median([3, 1, 2]), 2, 'median odd');
assert.strictEqual(median([1, 2, 3, 4]), 2.5, 'median even');
assert.strictEqual(median([]), null, 'median empty');

// Seitenstatistik. avg=1100, Band=±110 -> 1400 ist Ausreißer.
const s = sideStats([1000, 1000, 1000, 1400], 5);
assert.strictEqual(s.measured, 4);
assert.strictEqual(s.total, 5);
assert.ok(Math.abs(s.avg - 1100) < 1e-9, 'avg');
assert.strictEqual(s.min, 1000);
assert.strictEqual(s.max, 1400);
assert.strictEqual(s.within, 3, '3 of 4 within +/-10% of mean');

// Mit Zielspannung zählt das Band gegen das Ziel statt gegen das Mittel.
const sRef = sideStats([1000, 1000, 1000, 1400], 5, 0.10, 1300);
assert.strictEqual(sRef.within, 1, 'only 1400 within +/-10% of target 1300');
assert.ok(Math.abs(sRef.avg - 1100) < 1e-9, 'avg unaffected by target ref');

// freqForTension ist die Umkehrung von tensionNewton.
const fInv = freqForTension(1100, 0.25, 0.0247);
assert.ok(Math.abs(tensionNewton(fInv, 0.25, 0.0247) - 1100) < 1e-6, 'freqForTension inverse');

// Oktavfehler: Byte-Spektrum ist dB-skaliert -> Byte-DIFFERENZ zählt.
// Falten nur bei lautem Sub-Peak (>=128) nahe am Hauptpeak (<=30 Bytes ~ 8 dB).
const binHz = 44100 / 4096;
const spec = new Uint8Array(2048);
const setPeak = (f, v) => { spec[Math.round(f / binHz)] = v; };
setPeak(420, 220);
assert.strictEqual(correctOctave(420, spec, binHz), 420, 'no sub-peak -> keep');
setPeak(210, 200); // ~5,5 dB unter dem Hauptpeak -> echter Grundton
assert.strictEqual(correctOctave(420, spec, binHz), 210, 'strong sub-peak -> fold octave');
setPeak(210, 180); // ~11 dB darunter -> vermutlich Rauschen/Thump, nicht falten
assert.strictEqual(correctOctave(420, spec, binHz), 420, 'sub-peak 11 dB below -> keep');
setPeak(210, 100); // unter absolutem Floor (128 ~ -65 dBFS)
assert.strictEqual(correctOctave(420, spec, binHz), 420, 'quiet sub-peak -> keep');
assert.strictEqual(correctOctave(100, spec, binHz), 100, 'half below 60 Hz -> keep');
assert.strictEqual(correctOctave(420, null, binHz), 420, 'no spectrum -> keep');

// stableReading: erst genug Proben (Default 5), dann nur bei engem Cluster ein Ergebnis.
assert.strictEqual(stableReading([420, 421, 420, 421]), null, 'too few samples -> null');
assert.ok(Math.abs(stableReading(Array(10).fill(0).map((_, i) => 420 + (i % 2))) - 420.5) < 1, 'tight cluster -> median');
assert.strictEqual(stableReading([420, 600, 421, 590, 419, 610, 422, 580, 421, 600]), null, 'noisy -> null');
assert.strictEqual(stableReading([420, 421, 420, 421, 420, 421], 8), null, 'explicit minSamples respected');

// i18n: jede Sprache hat exakt dieselben Schlüssel + gleiche Guide-Struktur wie DE.
const { LANGS, MESSAGES, GUIDE } = require('./i18n.js');
const baseKeys = Object.keys(MESSAGES.de).sort().join('|');
for (const l of LANGS) {
  assert.ok(MESSAGES[l], `messages missing for ${l}`);
  assert.strictEqual(Object.keys(MESSAGES[l]).sort().join('|'), baseKeys, `key mismatch: ${l}`);
  for (const k in MESSAGES[l]) assert.ok(MESSAGES[l][k].trim().length, `empty ${l}.${k}`);
  assert.strictEqual(GUIDE[l].length, GUIDE.de.length, `guide length: ${l}`);
  GUIDE[l].forEach((c, i) => {
    assert.strictEqual(c.points.length, GUIDE.de[i].points.length, `guide ${l}#${i} points`);
    assert.strictEqual(!!c.note, !!GUIDE.de[i].note, `guide ${l}#${i} note presence`);
  });
}
// Platzhalter müssen in jeder Sprache erhalten bleiben.
for (const l of LANGS) {
  for (const k of ['btn.applyToSpoke', 'toast.applied', 'aria.wheel']) {
    assert.ok(MESSAGES[l][k].includes('{n}'), `placeholder {n} lost in ${l}.${k}`);
  }
  for (const p of ['{n}', '{done}', '{total}']) {
    assert.ok(MESSAGES[l]['hint.autoProgress'].includes(p), `placeholder ${p} lost in ${l}.hint.autoProgress`);
  }
  assert.ok(MESSAGES[l]['toast.allDone'].includes('{total}'), `placeholder {total} lost in ${l}.toast.allDone`);
}

console.log(`OK: all selftests passed (${LANGS.length} languages, ${Object.keys(MESSAGES.de).length} keys)`);
