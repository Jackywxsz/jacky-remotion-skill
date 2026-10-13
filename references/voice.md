# 配音与声音

逐字时间只有一份，来自成片用的那条声音。产物都放在项目 `voice/`（TTS）或 `asr/`（真人），plan 的 `audio` 指向它们。

## A. TTS 配音（只有稿子）

1. 逐字稿写进 `voice/script.txt`：**一行就是一行字幕**（横版 ≤ 18 字、竖版 ≤ 14 字），在逗号、句号处断；文字和用户给的稿子一致，只调分行。数字、英文按想让它念的写法写（“5.5”还是“五点五”先和用户确认）。
   **原稿的段落用空行隔开**。脚本把各行拼回整句再合成，段尾没有标点时会在空行处补一个逗号留气口；不留空行，上下两段会连读成一句，听起来含糊。英文跨行会自动补空格（`learn in` + `public` 不会粘成 `inpublic`）。
2. 报字数和费用：
   ```sh
   node <skill>/scripts/voice.mjs <项目> --dry-run
   ```
   把句数、字数给用户，**确认后**再合成：
   ```sh
   node <skill>/scripts/voice.mjs <项目>
   ```
   输出 `voice/narration.wav`、`voice/words.json`、`voice/captions.json`。相邻几句拼成一次请求（≤ 110 字，`TTS_CHUNK` 可调），模型会把句间语气连起来；逐句合成再拼接，每句都重新起调，听着一顿一顿的。同一段再跑会用缓存，不重复收费；改了字只重合成那一段。`--force` 强制重配。
3. 听一遍：语速由环境变量 `VOLC_TTS_SPEED` 定（1 是原速，口播常用 1.1）；换语速要整片重新合成，先和用户确认费用。多音字、英文、数字念错时，改 `script.txt` 的写法（如“行(háng)业”改成“航业”不行，就换说法并和用户确认）。
   **听着卡、断句怪**，按这个顺序查：
   - 顿号和音译英文最容易卡（“从配音、字幕到”“格罗克 Bot”）。在 `voice/pronounce.json` 写 `{"原文": "念法"}`，只改送去合成的文字，字幕不变；换不掉的说法（专有名词）和用户商量换词。
   - 语气用 `VOLC_TTS_STYLE` 写一句具体的说话场景（例：“有感染力的知识博主口播：节奏明快，抑扬顿挫，自信笃定，一句接一句一气呵成”）。拿不准时先合成开头 20 秒的两三种语气给用户试听，选定再全片重配（试听稿和正片开头分块一致时会命中缓存）。
4. plan：`"audio": {"narration": "voice/narration.wav", "words": "voice/words.json", "captions": "voice/captions.json"}`。

音色、凭证来自用户自己的环境变量或项目 .env.local（见 [引擎与路径](engines.md)）。脚本只读凭证，不打印、不写进任何文件。

## B. 真人原声（有口播视频）

```sh
ffmpeg -i input/<底片>.mp4 -vn -ac 1 -ar 16000 asr/a.wav
mlx_whisper asr/a.wav --model mlx-community/whisper-large-v3-turbo --language zh \
  --word-timestamps True --output-format json --output-dir asr \
  --initial-prompt "以下是普通话的句子，使用简体中文。"
mv asr/a.json asr/whisper.json
# 把逐字稿中实际说到的部分写成 asr/corrected.txt（| 强制断字幕行）后：
python3 -I <skill>/scripts/align_words.py --asr asr/whisper.json --text asr/corrected.txt \
  --words asr/words.json --captions asr/captions.json
```

- whisper 只取时间，字以逐字稿为准；口播与稿子有出入时以实际说的为准，列给用户。
- plan：`"audio": {"narration": "presenter", "words": "asr/words.json", "captions": "asr/captions.json"}`，口播窗底片即声音来源，画面与声音同步。

## C. 口播小窗底片

- `plan.presenter.video` 指向底片。底片只有圆内有人（圆外黑底）时给 `circle: {cx, cy, r}`（源像素，实测），会自动取圆内最大的竖版圆角矩形；全画面人像给 `crop: {x, y, w, h}`（宽高比约 340:440）。
- TTS 配音时底片一律静音；比成片短就循环，不管口型。
- 正式片最好用原始未裁的口播素材，竖版窗能拿到更多画面。

## D. 配乐和音效

- 配乐：`"music": {"file": "input/music.mp3"}`。只用用户提供或确认过的音乐。默认把平均响度拉到约 -38dB 铺在人声下（用户以前调好的铺底就在这个位置），句间空档抬 3dB，首尾淡入淡出；要更响或更轻时写 `"gain": -3` 这类 dB 值覆盖。
- 科普解说的配乐方向：轻快、干净、节奏稳（木琴、拨弦、轻鼓），不要人声歌词、不要情绪过满的弦乐。
- 音效在场景里用 `<Sfx>` 点在主动作上（见 [组件库](kit.md)）。模板自带的 6 个音效是程序合成的原创音（`scripts/make-public-sfx.mjs`，零依赖 Node 生成器）。
- 电平分三层：人声最上；音效比人声低约 14 LU（常见做法是比对白低 10–15 dB）；配乐在人声下约 20–24 dB。`npm run timeline` 量人声整体响度和每个音效的瞬时最大响度，写进 `timeline.audio.sfx`，`<Sfx volume=1>` 就落在这一档。整体太吵改 `build-timeline.mjs` 里的 `SFX_UNDER_VOICE`，不要在场景里逐个调。
- 密度：一段 1–2 个，只给盖章、揭示、反转、转场。逐项出现、小弹出、位移不配；`.map(` 里不放音效。
- 成片响度：`render.mjs` 渲完做两遍 loudnorm，统一到 -12 LUFS、真峰值 -1 dBTP（抖音口播），画面直接拷贝不重编码。

## 交付前听

- 旁白开头不被吞字，结尾不截断；句间停顿自然。
- 配乐不盖人声：说话时几乎听不出来，停顿时能感觉到。
- 音效不吵、不和关键词抢；整片听下来音效是点缀，不是一直在响。
