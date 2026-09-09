// Offline-Replay: spiegelt App.onReading (Onset-Segmentierung + Tonende-Lock).
const fs = require('fs');
const { detectPitch, pluckVote, weightedMedian } = require('./app.js');

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
let pluck = [], silent = 0, prevRms = 0, onsetRun = 0;

function closePluck(t) {
  if (!pluck.length) return;
  const v = pluckVote(pluck);
  const totalW = pluck.reduce((s, q) => s + q.c * q.c, 0);
  const bestW = v ? pluck.filter(q => Math.abs(q.f / v.hz - 1) < 0.03).reduce((s, q) => s + q.c * q.c, 0) : 0;
  if (v && v.count >= 4 && bestW >= 0.35 * totalW) results.push({ t, hz: v.hz, frames: v.count });
  else {
    const strong = pluck.filter(q => q.c >= 0.75);
    if (strong.length >= 2) results.push({ t, hz: weightedMedian(strong), frames: strong.length, fb: true });
  }
  pluck = [];
}

for (let start = 0; start + WIN <= x.length; start += HOP) {
  const r = detectPitch(x.slice(start, start + WIN), sr);
  const good = r.freq >= 80 && r.freq <= 1500 && r.clarity > 0.5 && r.rms >= 0.006;
  if (!good) {
    silent++;
    if (silent < 8) continue;
    closePluck(start / sr);
    prevRms = 0;
    continue;
  }
  silent = 0;
  const isLoud = r.rms > Math.max(0.025, 2.2 * prevRms);
  onsetRun = pluck.length && isLoud ? onsetRun + 1 : 0;
  if (pluck.length && onsetRun === 3) {
    const onsetFrames = pluck.splice(-3);
    closePluck(start / sr);
    pluck = onsetFrames;
    onsetRun = 0;
  }
  prevRms = r.rms;
  pluck.push({ f: r.freq, c: r.clarity });
  if (pluck.length > 60) pluck.shift();
}
closePluck(x.length / sr);

console.log(`\n=== ${process.argv[2]} (${(x.length / sr).toFixed(1)}s) ===`);
for (const r of results) console.log(`  ${r.t.toFixed(2)}s -> ${r.hz.toFixed(1)} Hz  (${r.frames} Frames${r.fb ? ', Fallback' : ''})`);
console.log(`  -> ${results.length} Locks`);
