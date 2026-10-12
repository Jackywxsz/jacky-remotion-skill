// 生成 src/data/timeline.json：读 ../plan.json 和逐字时间，校验分段与 cue，把旁白 / 底片 / 配乐复制进 public/media/。
// 用法（工程目录）：npm run timeline
// 任何对不上的地方直接报错退出，不猜时间。
import fs from 'node:fs';
import path from 'node:path';
import {execFileSync, spawnSync} from 'node:child_process';

const root = path.resolve(import.meta.dirname, '..');
const project = path.resolve(root, '..');
const fail = (m) => { console.error(`✗ ${m}`); process.exit(1); };
const read = (rel) => {
  const p = path.resolve(project, rel);
  if (!fs.existsSync(p)) fail(`找不到 ${p}`);
  return JSON.parse(fs.readFileSync(p, 'utf8'));
};
const norm = (s) => [...s].filter((c) => /[\p{L}\p{N}]/u.test(c)).join('').toLowerCase();

const plan = read('plan.json');
const fps = plan.fps ?? 30;
const format = plan.format ?? 'h';
if (!['h', 'v'].includes(format)) fail('plan.format 只能是 h（1920×1080）或 v（1080×1440）');
const [width, height] = format === 'h' ? [1920, 1080] : [1080, 1440];
const audio = plan.audio ?? {};
const words = read(audio.words ?? 'voice/words.json');
const captionsSrc = read(audio.captions ?? 'voice/captions.json').captions;
const F = (sec) => Math.round(sec * fps);

// 复制媒体：大小和修改时间都没变就跳过。
const mediaDir = path.join(root, 'public', 'media');
fs.mkdirSync(mediaDir, {recursive: true});
const bring = (rel, name) => {
  const src = path.resolve(project, rel);
  if (!fs.existsSync(src)) fail(`找不到媒体 ${src}`);
  const dest = path.join(mediaDir, name + path.extname(src).toLowerCase());
  const a = fs.statSync(src), b = fs.existsSync(dest) && fs.statSync(dest);
  if (!b || a.size !== b.size || a.mtimeMs > b.mtimeMs) fs.copyFileSync(src, dest);
  return path.relative(path.join(root, 'public'), dest).split(path.sep).join('/');
};
const probe = (file) => {
  const j = JSON.parse(execFileSync('ffprobe', ['-v', 'error', '-show_streams', '-show_format', '-of', 'json', file]).toString());
  const v = j.streams.find((s) => s.codec_type === 'video');
  return {width: v?.width, height: v?.height, duration: Number(j.format.duration), hasAudio: j.streams.some((s) => s.codec_type === 'audio')};
};

// 时长：plan.duration 优先，否则用逐字时间的 end（TTS 已含片尾留白）。
const duration = plan.duration ?? words.end;
if (!(duration > 0)) fail('没有时长：plan.duration 或 words.end');
const durationInFrames = F(duration);

// 逐字开口时刻：words 里每个词按字均分。
const chars = [];
for (const w of words.words) {
  const cs = [...norm(w.w)];
  cs.forEach((c, k) => chars.push({c, t: w.s + ((w.e - w.s) * k) / cs.length}));
}
const flat = chars.map((c) => c.c).join('');

// 口播窗底片：plan.presenter.video 为单条底片；plan.presenter.clips 为多条，段里用 clip 指定用哪条。
let presenter = null;
const loadClip = (c, name) => {
  const src = bring(c.video, name);
  const info = probe(path.resolve(project, c.video));
  let crop = c.crop;
  if (!crop && c.circle) {
    // 底片只有圆内有人：取圆内最大的 340:440 圆角矩形（参考半径 r=259.5 时恰好不碰圆外黑底）。
    const k = c.circle.r / 259.5, w = 340 * k, h = 440 * k;
    crop = {x: c.circle.cx - w / 2, y: c.circle.cy - h / 2 - 6 * k, w, h};
  }
  if (!crop) { const h = info.height, w = (h * 340) / 440; crop = {x: (info.width - w) / 2, y: 0, w, h}; }
  return {src, srcFrames: F(info.duration), srcW: info.width, srcH: info.height, crop};
};
if (plan.presenter?.video || plan.presenter?.clips) {
  const p = plan.presenter;
  const clips = p.clips ? Object.fromEntries(Object.entries(p.clips).map(([id, c]) => [id, loadClip(c, `presenter-${id}`)])) : {main: loadClip(p, 'presenter')};
  presenter = {clips, defaultClip: Object.keys(clips)[0], name: p.name ?? '讲述人'};
}

// 旁白：TTS 音频，或底片原声。
let narration = null, presenterAudio = false;
if (audio.narration === 'presenter') {
  if (!presenter) fail('audio.narration = presenter，但没有 plan.presenter.video');
  presenterAudio = true;
} else if (audio.narration) narration = bring(audio.narration, 'narration');
// 音效电平：人声在上、配乐垫底，音效夹在中间。每个音效文件按瞬时最大响度（M max）校到“人声整体响度 − 14 LU”，
// 组件里 volume=1 就是这个档；次要动作给 0.5–0.7。配乐约在人声下 20–24 dB，音效比人声低 10–15 dB 是常用做法。
const loud = (file, filter) => spawnSync('ffmpeg', ['-hide_banner', '-nostats', '-i', file, '-af', filter, '-f', 'null', '-']).stderr.toString();
const voiceFile = narration ? path.join(root, 'public', narration) : presenterAudio ? path.join(root, 'public', presenter.clips[presenter.defaultClip].src) : null;
const voiceI = voiceFile ? Number(loud(voiceFile, 'ebur128').split('Summary').pop().match(/I:\s+(-?[\d.]+) LUFS/)?.[1] ?? -14) : -14;
const SFX_UNDER_VOICE = 14;
const sfx = {};
for (const f of fs.readdirSync(path.join(root, 'public', 'sfx')).filter((n) => n.endsWith('.wav'))) {
  const ms = [...loud(path.join(root, 'public', 'sfx', f), 'apad=pad_dur=0.5,ebur128=metadata=1,ametadata=print:key=lavfi.r128.M').matchAll(/M=(-?[\d.]+)/g)].map((m) => Number(m[1]));
  const top = ms.length ? Math.max(...ms) : -20;
  sfx[f.replace(/\.wav$/, '')] = +(voiceI - SFX_UNDER_VOICE - top).toFixed(1);
}

// 配乐增益：plan 写了 gain（dB）就照用；没写时把平均响度拉到 -38dB 左右（用户调好的铺底大约在这个位置，压在人声下面）。
let music = null;
if (audio.music?.file) {
  const src = bring(audio.music.file, 'music');
  let gain = audio.music.gain;
  if (gain === undefined) {
    const log = spawnSync('ffmpeg', ['-hide_banner', '-t', '60', '-i', path.resolve(project, audio.music.file), '-af', 'volumedetect', '-vn', '-f', 'null', '-']).stderr.toString();
    const m = log.match(/mean_volume: (-?[\d.]+) dB/);
    gain = m ? Math.min(6, -38 - Number(m[1])) : -16;
  }
  music = {src, db: +gain.toFixed(1)};
}

// 分段：首尾相接、覆盖全片。
const segs = plan.segments ?? [];
if (!segs.length) fail('plan.segments 为空');
const qa = new Set([0, durationInFrames - 1]);
const segments = segs.map((s, i) => {
  if (!/^[a-z0-9_-]+$/i.test(s.id)) fail(`段 id 只用字母数字：${s.id}`);
  if (!['aroll', 'broll', 'screen'].includes(s.type)) fail(`${s.id}.type 只能是 aroll / broll / screen`);
  const startFrame = F(s.start), endFrame = i === segs.length - 1 ? durationInFrames : F(s.end);
  if (i === 0 && startFrame !== 0) fail('第一段要从 0 开始');
  if (i > 0 && startFrame !== F(segs[i - 1].end)) fail(`${s.id} 没有接上上一段（${segs[i - 1].end} → ${s.start}）`);
  if (endFrame <= startFrame) fail(`${s.id} 时长为 0`);
  let pres = s.presenter ?? (s.type === 'aroll' ? 'window' : 'hidden');
  if (pres === 'window' && !presenter) { console.warn(`⚠ ${s.id} 要口播窗但没有底片，按 hidden 处理`); pres = 'hidden'; }
  const clip = presenter ? (s.clip ?? presenter.defaultClip) : null;
  if (clip && !presenter.clips[clip]) fail(`${s.id}.clip「${clip}」不在 plan.presenter.clips 里`);
  const cues = (s.cues ?? []).map((c) => {
    const key = norm(c.say);
    if (!key) fail(`${s.id} 有空 cue`);
    let pos = flat.indexOf(key), hit = null;
    while (pos >= 0) { const t = chars[pos].t; if (F(t) >= startFrame && F(t) < endFrame) { hit = t; break; } pos = flat.indexOf(key, pos + 1); }
    if (hit === null) fail(`${s.id} 的 cue「${c.say}」在本段口播里找不到；必须是逐字稿原词`);
    const frame = F(hit);
    qa.add(frame); qa.add(Math.min(endFrame - 1, frame + 8));
    return {say: c.say, action: c.action ?? '', frame, localFrame: frame - startFrame};
  });
  qa.add(startFrame); qa.add(endFrame - 1); qa.add(Math.floor((startFrame + endFrame) / 2));
  return {id: s.id, type: s.type, presenter: pres, clip, presenterDelay: F(s.presenterDelay ?? 0), tag: s.tag ?? '', narration: s.narration ?? '', intent: s.intent ?? '', startFrame, endFrame, cues, assets: s.assets ?? []};
});
const ids = segments.map((s) => s.id);
if (new Set(ids).size !== ids.length) fail('段 id 重复');

const captions = captionsSrc.map((c) => ({text: c.text, startFrame: F(c.start), endFrame: F(c.end)}));

// 字形：口播、字幕、贴纸文字，以及 src/ 里写死的中文，供手写字体按需加载。
const stripComments = (code) => code.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"`])\/\/.*$/gm, '$1');
const scan = (dir) => fs.readdirSync(dir, {withFileTypes: true}).flatMap((d) => d.isDirectory() ? scan(path.join(dir, d.name)) : /\.(tsx?|json)$/.test(d.name) && d.name !== 'timeline.json' && d.name !== 'yazai-traced.json' ? [stripComments(fs.readFileSync(path.join(dir, d.name), 'utf8'))] : []);
const pool = [plan.column ?? '', ...captions.map((c) => c.text), ...segments.flatMap((s) => [s.narration, s.tag, ...s.cues.map((c) => c.say)]), ...scan(path.join(root, 'src'))].join('');
const glyphs = [...new Set([...pool].filter((c) => c.charCodeAt(0) > 127 && /\S/.test(c)))].join('');
// 手写字体覆盖检查：小赖体 / Excalifont 没有的字会退回苹方，画面里一眼就是“宋体混进手写”。
// ①–⑨ ✓ ✗ → 只能放进 HandText / TagSticker（手画替代）；其他缺字改写成中文或手画。
const ranges = [...fs.readFileSync(path.join(root, 'public', 'fonts', 'fonts.css'), 'utf8').matchAll(/unicode-range:([^;]+);/g)]
  .flatMap((m) => m[1].split(',').map((r) => { const [a, b] = r.trim().replace('U+', '').split('-'); return [parseInt(a, 16), parseInt(b ?? a, 16)]; }));
const DRAWN = '①②③④⑤⑥⑦⑧⑨✓✗→';
const bad = [...glyphs].filter((c) => !DRAWN.includes(c)).filter((c) => !ranges.some(([a, b]) => c.codePointAt(0) >= a && c.codePointAt(0) <= b));
if (bad.length) console.warn(`⚠ 手写字体缺字：${bad.join(' ')}——会退回系统字体，改写成中文或手画（①–⑨ ✓ ✗ → 可用 HandText）。`);

const timeline = {
  format, width, height, fps, durationInFrames,
  column: plan.column ?? '我的栏目 / 知识讲解',
  keywords: plan.keywords ?? [],
  glyphs,
  audio: {narration, music, presenterAudio, sfx},
  presenter, segments, captions,
  chars: chars.map((c) => ({c: c.c, f: F(c.t)})),
};
fs.writeFileSync(path.join(root, 'src', 'data', 'timeline.json'), JSON.stringify(timeline, null, 1));
fs.mkdirSync(path.join(root, 'review'), {recursive: true});
fs.writeFileSync(path.join(root, 'review', 'frames.json'), JSON.stringify([...qa].filter((f) => f >= 0 && f < durationInFrames).sort((a, b) => a - b)));
console.log(`✓ timeline：${format} ${width}×${height} ${fps}fps ${durationInFrames} 帧（${duration.toFixed(2)}s），${segments.length} 段，${segments.reduce((n, s) => n + s.cues.length, 0)} 个 cue，${captions.length} 行字幕，${glyphs.length} 个字形`);
for (const s of segments) console.log(`  ${s.id} ${s.type.padEnd(6)} [${s.startFrame},${s.endFrame}) 口播窗 ${s.presenter}${s.presenter === 'window' ? `(${s.clip})` : ''}  ${s.cues.map((c) => `${c.say}@${c.localFrame}`).join(' ')}`);
