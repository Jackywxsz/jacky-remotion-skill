#!/usr/bin/env node
// MIT: deterministic oscillator/noise synthesis, no samples or external inputs.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

export function makeSfx() {
  const rate = 48000;
  const durations = {pop: 0.16, tick: 0.08, ding: 1.2, thud: 0.35, whoosh: 0.45, swish: 0.22};
  return Object.fromEntries(Object.entries(durations).map(([name, duration], index) => {
    let seed = 7919 + index, phase = 0, smooth = 0;
    const samples = new Float64Array(Math.round(rate * duration));
    for (let i = 0; i < samples.length; i++) {
      const t = i / rate, progress = i / samples.length;
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
      const noise = seed / 2147483648 - 1;
      const env = Math.min(1, t / 0.003) * Math.exp(-t / (duration / 4)) * Math.min(1, (duration - t) / 0.008);
      if (name === 'whoosh' || name === 'swish') {
        smooth += (noise - smooth) * (0.07 + 0.3 * Math.sin(Math.PI * progress));
        samples[i] = smooth * Math.sin(Math.PI * progress) ** 2;
      } else if (name === 'ding') {
        samples[i] = (Math.sin(2 * Math.PI * 1318.5 * t) + 0.25 * Math.sin(2 * Math.PI * 3620 * t)) * env;
      } else if (name === 'tick') {
        samples[i] = (Math.sin(2 * Math.PI * 2400 * t) + 0.3 * noise) * env;
      } else {
        const frequency = name === 'pop' ? 520 + 900 * Math.exp(-t / 0.02) : 70 + 120 * Math.exp(-t / 0.03);
        phase += 2 * Math.PI * frequency / rate;
        samples[i] = (Math.sin(phase) + (name === 'thud' ? 0.15 * noise * Math.exp(-t / 0.015) : 0)) * env;
      }
    }
    const peak = samples.reduce((m, x) => Math.max(m, Math.abs(x)), 0);
    const data = Buffer.alloc(44 + samples.length * 2);
    data.write('RIFF'); data.writeUInt32LE(data.length - 8, 4); data.write('WAVE', 8);
    data.write('fmt ', 12); data.writeUInt32LE(16, 16); data.writeUInt16LE(1, 20); data.writeUInt16LE(1, 22);
    data.writeUInt32LE(rate, 24); data.writeUInt32LE(rate * 2, 28); data.writeUInt16LE(2, 32); data.writeUInt16LE(16, 34);
    data.write('data', 36); data.writeUInt32LE(samples.length * 2, 40);
    samples.forEach((value, i) => data.writeInt16LE(Math.round(value / peak * 0.5 * 32767), 44 + i * 2));
    return [name + '.wav', data];
  }));
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  if (!process.argv[2]) throw new Error('用法：node scripts/make-public-sfx.mjs <输出目录>');
  fs.mkdirSync(process.argv[2], {recursive: true});
  for (const [name, data] of Object.entries(makeSfx())) fs.writeFileSync(path.join(process.argv[2], name), data);
  console.log('已生成 6 个程序合成音效（48kHz / mono / PCM16，固定种子）');
}
