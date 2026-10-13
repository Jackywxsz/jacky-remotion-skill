#!/usr/bin/env node
// 火山引擎豆包语音合成（V3 单向流式，带逐字时间戳）。
// 用法：node voice.mjs <项目目录> [--dry-run] [--force] [--env <凭证文件>]
//   读 <项目>/voice/script.txt：逐字稿，一行就是一行字幕（建议横版 ≤ 18 字、竖版 ≤ 14 字）；空行是原稿段落边界。
//   按 。！？ 切句、整句合成（语气自然），句间留 gap，开头留 lead，结尾留 tail。
//   输出 voice/narration.wav、voice/words.json（逐字时间）、voice/captions.json（字幕行），格式与 align_words.py 一致。
//   --dry-run 只打印切句和字数，不读凭证、不请求。合成收费：先 dry-run 给用户看字数，确认后再正式跑。
// 凭证：环境变量 VOLC_TTS_API_KEY（或 VOLC_TTS_APP_ID + VOLC_TTS_ACCESS_KEY）、VOLC_TTS_SPEAKER；
//   没有时读 --env 指定的文件，再读 VOLC_TTS_ENV_FILE，最后读项目目录下的 .env.local。只读不打印。
// 需要 Node 22+、ffmpeg、ffprobe。
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {createHash, randomUUID} from 'node:crypto';
import {execFileSync} from 'node:child_process';

const ENDPOINT = 'https://openspeech.bytedance.com/api/v3/tts/unidirectional';
const args = process.argv.slice(2);
const fail = (m) => { console.error(`✗ ${m}`); process.exit(1); };
const flag = (k) => args.includes(k);
const opt = (k) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : undefined; };
const dir = args.find((a, i) => !a.startsWith('--') && args[i - 1] !== '--env');
if (!dir) fail('用法：node voice.mjs <项目目录> [--dry-run] [--force] [--env <凭证文件>]');
const vdir = path.resolve(dir, 'voice');
const scriptFile = path.join(vdir, 'script.txt');
if (!fs.existsSync(scriptFile)) fail(`找不到 ${scriptFile}`);

const LEAD = 0.5, GAP = 0.36, TAIL = 1.6;
const rawLines = fs.readFileSync(scriptFile, 'utf8').split('\n').map((l) => l.trim());
const lines = rawLines.filter(Boolean);
const norm = (s) => [...s].filter((c) => /[\p{L}\p{N}]/u.test(c)).join('').toLowerCase();
// 拼回整句再切：空行是段落边界，段尾没标点就补逗号留气口（否则上下两段会连读成一句）；
// 英文/数字跨行补空格，避免 learn in + public 粘成 inpublic。
let speech = '';
for (const l of rawLines) {
  if (!l) { if (speech && !/[。！？!?，,：:；;、」』）)…]$/.test(speech)) speech += '，'; continue; }
  if (/[A-Za-z0-9.]$/.test(speech) && /^[A-Za-z0-9]/.test(l)) speech += ' ';
  speech += l;
}
const sentences = speech.split(/(?<=[。！？!?])/).map((t) => t.trim()).filter((t) => norm(t));
const total = norm(lines.join('')).length;
console.log(`逐字稿 ${lines.length} 行，${sentences.length} 句，${total} 个字（不含标点）。`);
// 只改送去合成的文字，字幕和对齐仍用逐字稿：voice/pronounce.json 写 {"原文": "念法"}，
// 例如 {"Opus 5.5": "Opus 五点五", "从配音、字幕到": "从配音字幕到"}（顿号、音译英文最容易念出卡顿）。
const pronFile = path.join(vdir, 'pronounce.json');
const pron = fs.existsSync(pronFile) ? Object.entries(JSON.parse(fs.readFileSync(pronFile, 'utf8'))) : [];
const pronounce = (s) => pron.reduce((t, [a, b]) => t.replaceAll(a, b), s);
// 相邻句子合成一次请求（≤ TTS_CHUNK 字），句间语气由模型连起来；逐句合成再拼接会让每句都重新起调，听着断。
const MAX_CHUNK = Number(process.env.TTS_CHUNK ?? 110);
const chunks = [];
for (const s of sentences) { const last = chunks.at(-1); if (last && [...(last + s)].length <= MAX_CHUNK) chunks[chunks.length - 1] = last + s; else chunks.push(s); }
const requests = chunks.map(pronounce);
if (flag('--dry-run')) { requests.forEach((s, i) => console.log(`  ${i + 1}. ${s}`)); console.log(`请求 ${requests.length} 次，共 ${requests.reduce((n, s) => n + [...s].length, 0)} 字符`); process.exit(0); }

for (const file of [opt('--env'), process.env.VOLC_TTS_ENV_FILE, path.resolve(dir, '.env.local')].filter(Boolean)) {
  if (!fs.existsSync(file)) continue;
  for (const line of fs.readFileSync(file, 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (m && !(m[1] in process.env)) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
}
const speaker = process.env.VOLC_TTS_SPEAKER;
const resource = process.env.VOLC_TTS_RESOURCE_ID ?? 'seed-tts-2.0';
const speechRate = Math.max(-50, Math.min(100, Math.round((Number(process.env.VOLC_TTS_SPEED ?? 1) - 1) * 100)));
const style = process.env.VOLC_TTS_STYLE ?? '';
const v2 = /-2\.0/.test(resource);
const headers = {'Content-Type': 'application/json', 'X-Api-Resource-Id': resource};
if (process.env.VOLC_TTS_API_KEY) headers['X-Api-Key'] = process.env.VOLC_TTS_API_KEY;
else if (process.env.VOLC_TTS_APP_ID && process.env.VOLC_TTS_ACCESS_KEY) { headers['X-Api-App-Id'] = process.env.VOLC_TTS_APP_ID; headers['X-Api-Access-Key'] = process.env.VOLC_TTS_ACCESS_KEY; }
else fail('没有找到火山引擎凭证（VOLC_TTS_API_KEY）');
if (!speaker) fail('没有指定音色 VOLC_TTS_SPEAKER');

async function volc(text, sectionId) {
  const additions = {};
  if (v2) additions.section_id = sectionId;
  if (style && v2) additions.context_texts = [style];
  const body = {user: {uid: 'jacky-remotion'}, req_params: {text, speaker, audio_params: {format: 'mp3', sample_rate: 48000, bit_rate: 160000, speech_rate: speechRate, enable_timestamp: true, enable_subtitle: true}, additions: JSON.stringify(additions)}};
  const res = await fetch(ENDPOINT, {method: 'POST', headers, body: JSON.stringify(body)});
  const logid = res.headers.get('x-tt-logid') ?? '';
  const raw = await res.text();
  if (!res.ok) fail(`HTTP ${res.status}：${raw.slice(0, 300)}（logid ${logid}）`);
  const audio = [], words = [];
  for (const line of raw.split('\n')) {
    if (!line.trim()) continue;
    let msg; try { msg = JSON.parse(line.replace(/^data:\s*/, '')); } catch { continue; }
    if (msg.code && msg.code !== 20000000) fail(`火山引擎返回 ${msg.code}：${msg.message}（logid ${logid}）`);
    if (typeof msg.data === 'string' && msg.data) audio.push(Buffer.from(msg.data, 'base64'));
    for (const w of msg.sentence?.words ?? []) words.push({w: w.word, s: w.startTime, e: w.endTime});
  }
  if (!audio.length) fail(`没有收到音频（logid ${logid}）`);
  return {audio: Buffer.concat(audio), words};
}

const cacheDir = path.join(vdir, '.cache');
fs.mkdirSync(cacheDir, {recursive: true});
async function synth(text, sectionId) {
  const key = createHash('sha256').update(JSON.stringify({v: 2, text, speaker, resource, speechRate, style})).digest('hex').slice(0, 24);
  const mp3 = path.join(cacheDir, `${key}.mp3`), meta = path.join(cacheDir, `${key}.json`);
  if (!flag('--force') && fs.existsSync(mp3) && fs.existsSync(meta)) return {file: mp3, words: JSON.parse(fs.readFileSync(meta, 'utf8')), cached: true};
  const need = norm(text).length;
  for (let tries = 1; ; tries++) {
    const r = await volc(text, sectionId);
    const got = r.words.reduce((n, w) => n + norm(w.w).length, 0);
    if (!r.words.length || got >= need * 0.85 || tries >= 3) {
      fs.writeFileSync(mp3, r.audio); fs.writeFileSync(meta, JSON.stringify(r.words));
      return {file: mp3, words: r.words, cached: false};
    }
    console.warn(`  … 只返回 ${got}/${need} 字，重配第 ${tries + 1} 次`);
  }
}
const probe = (f) => Number(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', f]).toString().trim());
/** 真实发声范围：10ms 窗口 RMS 超过 -40dB 的首尾（火山逐字时间在句首句尾常偏 0.1–0.4s，按它裁会吞字）。 */
function speechBounds(file) {
  const raw = execFileSync('ffmpeg', ['-loglevel', 'error', '-i', file, '-ac', '1', '-ar', '16000', '-f', 's16le', '-'], {maxBuffer: 1 << 28});
  const pcm = new Int16Array(raw.buffer, raw.byteOffset, raw.length >> 1);
  let first = -1, last = -1;
  for (let i = 0; i + 160 <= pcm.length; i += 160) {
    let e = 0; for (let j = i; j < i + 160; j++) e += (pcm[j] / 32768) ** 2;
    if (10 * Math.log10(e / 160 + 1e-12) > -40) { if (first < 0) first = i; last = i + 160; }
  }
  return first < 0 ? [0, pcm.length / 16000] : [first / 16000, last / 16000];
}

const sectionId = randomUUID();
const pieces = [], allWords = [];
let cursor = LEAD - GAP;
for (const [i, text] of requests.entries()) {
  const {file, words, cached} = await synth(text, sectionId);
  const dur = probe(file);
  const [on, off] = speechBounds(file);
  const lead = Math.max(0, Math.min(on - 0.06, words[0]?.s ?? on));
  const tail = Math.min(dur, Math.max(off + 0.18, (words.at(-1)?.e ?? 0) + 0.12));
  const at = cursor + GAP;
  pieces.push({file, from: lead, to: tail, at});
  for (const w of words) allWords.push({w: w.w, s: +(at + w.s - lead).toFixed(3), e: +(at + w.e - lead).toFixed(3)});
  cursor = at + tail - lead;
  console.log(`  ${cached ? '缓存' : '合成'} ${i + 1}/${requests.length}（${(tail - lead).toFixed(2)}s）：${text}`);
}

// 混成一条 48k 双声道 WAV：按“开口时刻 × 采样率”精确写进缓冲区（不用 adelay，它会丢掉开头空白导致整体提前）。
const SR = 48000, end = +(cursor + TAIL).toFixed(3);
const mix = new Float32Array(Math.ceil(end * SR));
for (const p of pieces) {
  const len = p.to - p.from;
  const raw = execFileSync('ffmpeg', ['-loglevel', 'error', '-i', p.file, '-af', `atrim=start=${p.from.toFixed(3)}:end=${p.to.toFixed(3)},asetpts=PTS-STARTPTS,afade=t=in:d=0.01,afade=t=out:st=${(len - 0.03).toFixed(3)}:d=0.03`, '-ac', '1', '-ar', String(SR), '-f', 's16le', '-'], {maxBuffer: 1 << 28});
  const pcm = new Int16Array(raw.buffer, raw.byteOffset, raw.length >> 1);
  const at = Math.round(p.at * SR);
  for (let i = 0; i < pcm.length && at + i < mix.length; i++) mix[at + i] += pcm[i] / 32768;
}
{
  const n = mix.length, buf = Buffer.alloc(44 + n * 4);
  buf.write('RIFF', 0); buf.writeUInt32LE(36 + n * 4, 4); buf.write('WAVE', 8);
  buf.write('fmt ', 12); buf.writeUInt32LE(16, 16); buf.writeUInt16LE(1, 20); buf.writeUInt16LE(2, 22);
  buf.writeUInt32LE(SR, 24); buf.writeUInt32LE(SR * 4, 28); buf.writeUInt16LE(4, 32); buf.writeUInt16LE(16, 34);
  buf.write('data', 36); buf.writeUInt32LE(n * 4, 40);
  for (let i = 0; i < n; i++) { const v = Math.max(-1, Math.min(1, mix[i])) * 32767; buf.writeInt16LE(v | 0, 44 + i * 4); buf.writeInt16LE(v | 0, 46 + i * 4); }
  fs.writeFileSync(path.join(vdir, 'narration.wav'), buf);
}

// 逐字稿的字与 TTS 逐字做最长公共子序列对齐；对不上的字（数字、英文念法不同）按前后插值。
const want = [...norm(lines.join(''))];
const got = [];
for (const w of allWords) { const cs = [...norm(w.w)]; cs.forEach((c, k) => got.push({c, t: w.s + ((w.e - w.s) * k) / cs.length, e: w.s + ((w.e - w.s) * (k + 1)) / cs.length})); }
const n = want.length, m = got.length;
const dp = Array.from({length: n + 1}, () => new Uint16Array(m + 1));
for (let i = n - 1; i >= 0; i--) for (let j = m - 1; j >= 0; j--) dp[i][j] = want[i] === got[j].c ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
const ts = new Array(n).fill(null), te = new Array(n).fill(null);
for (let i = 0, j = 0; i < n && j < m;) {
  if (want[i] === got[j].c) { ts[i] = got[j].t; te[i] = got[j].e; i++; j++; } else if (dp[i + 1][j] >= dp[i][j + 1]) i++; else j++;
}
for (let i = 0; i < n; i++) if (ts[i] === null) {
  let a = i - 1; while (a >= 0 && ts[a] === null) a--;
  let b = i + 1; while (b < n && ts[b] === null) b++;
  const ta = a >= 0 ? ts[a] : ts[b] - 0.2, tb = b < n ? ts[b] : ta + 0.2;
  ts[i] = ta + ((tb - ta) * (i - a)) / (b - a); te[i] = ts[i] + 0.12;
}
const miss = n - dp[0][0];
if (miss > 0) console.log(`  逐字对齐：${n - miss}/${n} 字精确对上，其余 ${miss} 字按前后插值（检查数字、英文的字幕时间）`);
const charWords = want.map((c, i) => ({w: c, s: +ts[i].toFixed(3), e: +Math.max(ts[i], te[i]).toFixed(3)}));
let off = 0;
const captions = lines.map((l) => {
  const len = [...norm(l)].length; const a = charWords[off], b = charWords[off + len - 1]; off += len;
  return {text: l.replace(/[，。！？、；：,.!?;:]+$/u, '').replace(/[，、；：]/gu, ' ').trim(), start: a.s, end: +(b.e + 0.15).toFixed(3)};
});
fs.writeFileSync(path.join(vdir, 'words.json'), JSON.stringify({source: 'tts', resource, end, words: charWords}, null, 1));
fs.writeFileSync(path.join(vdir, 'captions.json'), JSON.stringify({captions}, null, 1));
console.log(`✓ voice/narration.wav（${end}s）、words.json（${charWords.length} 字）、captions.json（${captions.length} 行）`);
