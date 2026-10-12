// 渲染（工程目录）：
//   node scripts/render.mjs stills [帧,帧,…]   验收静帧 → review/stills/（不给帧号时用 review/frames.json：每段首中末帧、每个 cue 及其后 8 帧）
//   node scripts/render.mjs sheet              把 review/stills/ 拼成联系表 review/sheet.jpg
//   node scripts/render.mjs video              成片 → out/<plan.title>.mp4（H.264 CRF 18 + AAC）
// 每次先重跑 build-timeline，保证场景里新写的字也进了字体加载表。
import fs from 'node:fs';
import path from 'node:path';
import {execFileSync, spawnSync} from 'node:child_process';
import {bundle} from '@remotion/bundler';
import {openBrowser,renderMedia,renderStill,selectComposition} from '@remotion/renderer';

const root = path.resolve(import.meta.dirname, '..');
process.chdir(root);
const mode = process.argv[2] ?? 'stills';

if (mode === 'sheet') {
  const files = fs.readdirSync('review/stills').filter((f) => f.endsWith('.png')).sort();
  if (!files.length) throw new Error('review/stills/ 里没有静帧');
  const cols = 4, rows = Math.ceil(files.length / cols);
  const list = files.map((f) => `file '${path.join(root, 'review/stills', f)}'`).join('\n');
  fs.writeFileSync('review/stills/list.txt', list);
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', 'review/stills/list.txt', '-vf', `scale=640:-2,tile=${cols}x${rows}:padding=6:color=white`, '-frames:v', '1', 'review/sheet.jpg']);
  console.log(`✓ review/sheet.jpg（${files.length} 张，从左到右、从上到下依次是帧：${files.map((f) => f.replace(/\D/g, '').replace(/^0+(?=\d)/, '')).join(' ')}）`);
  process.exit(0);
}

execFileSync('node', ['scripts/build-timeline.mjs'], {stdio: 'inherit'});
const shell = path.resolve('node_modules/.remotion/chrome-headless-shell/mac-arm64/chrome-headless-shell-mac-arm64/chrome-headless-shell');
const browser = await openBrowser('chrome', fs.existsSync(shell) ? {browserExecutable: shell} : {});
try {
  const serveUrl = await bundle({entryPoint: path.join(root, 'src/index.ts'), outDir: path.join(root, 'review/bundle'), enableCaching: false, rspack: true});
  const composition = await selectComposition({serveUrl, id: 'Explainer', puppeteerInstance: browser});
  if (mode === 'stills') {
    const frames = process.argv[3] ? process.argv[3].split(',').map(Number) : JSON.parse(fs.readFileSync('review/frames.json', 'utf8'));
    fs.rmSync('review/stills', {recursive: true, force: true});
    fs.mkdirSync('review/stills', {recursive: true});
    for (const frame of frames) {
      await renderStill({serveUrl, composition, frame, output: path.join(root, `review/stills/f${String(frame).padStart(5, '0')}.png`), imageFormat: 'png', puppeteerInstance: browser, logLevel: 'error'});
    }
    console.log(`✓ ${frames.length} 张静帧 → review/stills/`);
  } else if (mode === 'video') {
    const plan = JSON.parse(fs.readFileSync(path.resolve(root, '..', 'plan.json'), 'utf8'));
    const out = path.join(root, 'out', `${(plan.title ?? 'explainer').replace(/[\\/:*?"<>|\s]+/g, '-')}.mp4`);
    let last = -1;
    const raw = out.replace(/\.mp4$/, '.raw.mp4');
    await renderMedia({serveUrl, composition, codec: 'h264', crf: 18, pixelFormat: 'yuv420p', colorSpace: 'bt709', imageFormat: 'jpeg', jpegQuality: 92, audioCodec: 'aac', outputLocation: raw, puppeteerInstance: browser, concurrency: 4,
      onProgress: (p) => { const pct = Math.floor(p.progress * 10) * 10; if (pct !== last) { last = pct; console.log(`render ${pct}%`); } }});
    // 响度：抖音口播按 -12 LUFS、真峰值 ≤ -1 dBTP 两遍 loudnorm，画面直接拷贝。
    const LOUD = 'I=-12:TP=-1:LRA=11';
    const pass1 = spawnSync('ffmpeg', ['-hide_banner', '-nostats', '-i', raw, '-af', `loudnorm=${LOUD}:print_format=json`, '-f', 'null', '-'], {encoding: 'utf8'}).stderr;
    const m = JSON.parse(pass1.slice(pass1.lastIndexOf('{'), pass1.lastIndexOf('}') + 1));
    execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', raw, '-c:v', 'copy', '-af', `loudnorm=${LOUD}:measured_I=${m.input_i}:measured_TP=${m.input_tp}:measured_LRA=${m.input_lra}:measured_thresh=${m.input_thresh}:offset=${m.target_offset}:linear=true`, '-ar', '48000', '-c:a', 'aac', '-b:a', '320k', '-movflags', '+faststart', out]);
    fs.rmSync(raw);
    console.log(`✓ ${out}（响度 ${m.input_i} → -12 LUFS）`);
  } else throw new Error(`未知模式 ${mode}`);
} finally {
  await browser.close({silent: true});
}
