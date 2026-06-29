// Runnable check for the pure math: `node selftest.js`
const assert = require('assert');
const {
  muFromDiameterMm, muFromBladeMm, tensionNewton, newtonToKgf, hzToNote, median, sideStats,
  stableReading, GRAVITY,
} = require('./app.js');

// Physik (Port der Flutter-Tests).
assert.ok(Math.abs(muFromDiameterMm(2.0) - 0.0247) < 0.0247 * 0.02, 'mu(2.0mm round steel)');
assert.ok(Math.abs(tensionNewton(422, 0.25, 0.0247) - 1100) < 1100 * 0.03, 'T(422Hz)');
assert.strictEqual(newtonToKgf(GRAVITY), 1.0, 'N->kgf');

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

// stableReading: erst genug Proben, dann nur bei engem Cluster ein Ergebnis.
assert.strictEqual(stableReading([420, 421, 420], 8), null, 'too few samples -> null');
assert.ok(Math.abs(stableReading(Array(10).fill(0).map((_, i) => 420 + (i % 2)), 8) - 420.5) < 1, 'tight cluster -> median');
assert.strictEqual(stableReading([420, 600, 421, 590, 419, 610, 422, 580, 421, 600], 8), null, 'noisy -> null');

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
// Platzhalter {n} muss in jeder Sprache erhalten bleiben.
for (const l of LANGS) {
  for (const k of ['btn.applyToSpoke', 'toast.applied', 'aria.wheel']) {
    assert.ok(MESSAGES[l][k].includes('{n}'), `placeholder {n} lost in ${l}.${k}`);
  }
}

console.log(`OK: all selftests passed (${LANGS.length} languages, ${Object.keys(MESSAGES.de).length} keys)`);
