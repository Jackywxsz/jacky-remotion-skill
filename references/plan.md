# 项目与分镜表

## 项目目录

`python3 -I <skill>/scripts/new_project.py <项目> --format h|v` 生成：

```text
<项目>/
  input/            用户给的素材：口播底片、配乐、录屏截图、文章。只读，不改
  voice/            TTS：script.txt → narration.wav、words.json、captions.json
  asr/              真人原声：whisper.json、corrected.txt → words.json、captions.json
  plan.json         分镜（机器读，唯一真源）
  分镜表.md          分镜（人读，给用户确认）
  video/            Remotion 工程（模板复制而来）
    src/scenes/     每段一个 Sxx.tsx，在 index.ts 登记
    review/         静帧、联系表（render.mjs 生成）
    out/            成片
```

项目放在用户指定位置；没指定时先确认一个新的项目目录。`video/` 已存在时脚本拒绝覆盖。

## plan.json

```json
{
  "schemaVersion": 2,
  "title": "片名",
  "format": "h",
  "fps": 30,
  "column": "我的栏目 / 知识讲解",
  "keywords": ["判断力", "算力"],
  "audio": {
    "narration": "voice/narration.wav",
    "words": "voice/words.json",
    "captions": "voice/captions.json",
    "music": {"file": "input/music.mp3"}
  },
  "presenter": {"video": "input/口播.mp4", "circle": {"cx": 540, "cy": 980, "r": 259.5}, "name": "讲述人"},
  "segments": [
    {
      "id": "s01",
      "type": "aroll",
      "start": 0.0, "end": 4.4,
      "tag": "开场",
      "narration": "本段原话",
      "intent": "观众要记住什么（一句话）",
      "visual": "画面：主体、动作、实蓝焦点、芽仔表情",
      "cues": [{"say": "口播里的原词", "action": "这一刻发生什么"}],
      "presenterDelay": 0,
      "assets": []
    }
  ]
}
```

| 字段 | 说明 |
|---|---|
| `format` | `h` 横版 1920×1080；`v` 竖版 1080×1440 |
| `column` | 顶栏栏目名 |
| `keywords` | 字幕里亮薄荷色的词，整片 3–8 个，只放真正的关键词 |
| `duration` | 可选；不写时用逐字时间的 `end`（TTS 已含片尾留白） |
| `audio.narration` | TTS 音频路径；真人原声写 `"presenter"` |
| `audio.music` | `{file, gain?}`，`gain` 为 dB，不写时自动铺到约 -38dB |
| `presenter` | 口播窗底片；`circle` 或 `crop` 二选一，见 [配音与声音](voice.md) C 节。没有底片写 `null`，aroll 段就不显示口播窗 |
| `segments[].type` | `aroll` 口播图解 / `broll` 芽仔演示 / `screen` 录屏截图 |
| `segments[].presenter` | 可选，`window` 或 `hidden`；默认 aroll 为 `window`，其余 `hidden` |
| `segments[].tag` | 左上栏目贴纸；与上一段相同时不重复弹出 |
| `segments[].presenterDelay` | 口播窗晚几秒滑入，给上一段道具收场留时间 |
| `segments[].assets` | screen 段用的截图；放进 `video/public/screens/`，场景里用 `staticFile('screens/…')` |

规则：

- 段落首尾相接，第一段从 0 开始，最后一段自动延到片尾。边界放在句间停顿里，不切断词。
- `say` 必须是逐字稿原词，并且落在本段时间内；同一个词出现多次时取本段里第一次。
- `narration`、`intent`、`visual` 不进画面（只有 `tag` 进），是给自己和用户看的说明；`intent` 写不出来就是这段没想清楚。
- `npm run timeline` 会把以上全部校验一遍，并生成 `src/data/timeline.json` 和验收帧表 `review/frames.json`。报错就改 plan，不手改 timeline.json。

## 分镜表.md

给用户确认的是这份，不是 JSON：

| 段 | 时间 | 类型 | 口播 | 观众要记住 | 画面（cue → 动作） |
|---|---|---|---|---|---|

表下写：为什么这样分配 aroll / broll、芽仔在哪几段演什么、待用户确认的词（多音字、英文念法、口播与稿子不一致处）、配乐来源。用户改了分配就同步改 plan，不在制作中偷换。
