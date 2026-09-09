// Offline-Replay: echte Zupf-Aufnahmen durch die App-Erkennung (detectPitch
// + pluckVote, Lock bei Tonpause) schleifen und Paar-Konsistenz pruefen.
// Spiegelt App.onReading. Aufruf: node verify_recording.js file.wav
const fs = require('fs');
const { detectPitch, pluckVote } = require('./app.js');

function loadWav(path) {
  const b = fs.readFileSync(path);
  const sr = b.readUInt32LE(24);
  let off = 12;
  while (off < b.length) {
    const id = b.toString('ascii', off, off + 4);
    const sz = b.readUInt32LE(off + 4);
    if (id === 'data') {
      const n = sz / 2;
      const x = new Float32Array(n);
      for (let i = 0; i < n; i++) x[i] = b.readInt16LE(off + 8 + i * 2) / 32768;
      return { x, sr };
    }
    off += 8 + sz;
  }
  throw new Error('no data chunk');
}

const { x, sr } = loadWav(process.argv[2]);
const WIN = 4096, HOP = Math.round(sr * 0.04);
const results = [];
let pluck = [], silent = 0;

for (let start = 0; start + WIN <= x.length; start += HOP) {
  const r = detectPitch(x.slice(start, start + WIN), sr);
  const good = r.freq >= 80 && r.freq <= 1500 && r.clarity > 0.5 && r.rms >= 0.006;
  if (!good) {
    silent++;
    if (silent < 8) continue;
    if (pluck.length) {
      const v = pluckVote(pluck);
      const totalW = pluck.reduce((s, q) => s + q.c * q.c, 0);
      const bestW = v ? pluck.filter(q => Math.abs(q.f / v.hz - 1) < 0.03).reduce((s, q) => s + q.c * q.c, 0) : 0;
      if (v && v.count >= 4 && bestW >= 0.35 * totalW)
        results.push({ t: start / sr, hz: v.hz, frames: v.count });
      pluck = [];
    }
    continue;
  }
  silent = 0;
  pluck.push({ f: r.freq, c: r.clarity });
  if (pluck.length > 60) pluck.shift();
}

console.log(`\n=== ${process.argv[2]} (${(x.length / sr).toFixed(1)}s) ===`);
for (const r of results) console.log(`  ${r.t.toFixed(2)}s -> ${r.hz.toFixed(1)} Hz  (${r.frames} Frames)`);
let ok = 0, fail = 0;
for (let i = 1; i < results.length; i += 2) {
  const a = results[i - 1].hz, b = results[i].hz;
  const d = Math.abs(a - b) / ((a + b) / 2) * 100;
  const pass = d < 2;
  pass ? ok++ : fail++;
  console.log(`  Paar ${(i + 1) / 2}: ${d.toFixed(1)}% ${pass ? 'OK' : 'FAIL'}`);
}
console.log(`  -> ${ok} OK, ${fail} FAIL, ${results.length} Locks`);
