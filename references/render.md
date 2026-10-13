# 渲染与验收

命令都在项目的 `video/` 目录执行。

```sh
npm run timeline                         # 改了 plan、逐字时间或场景里的中文后先跑
npm run lint                             # eslint + tsc
node scripts/render.mjs stills           # 按 review/frames.json 出静帧 → review/stills/
node scripts/render.mjs stills 120,368   # 只出指定帧（全片帧号）
node scripts/render.mjs sheet            # 拼成联系表 review/sheet.jpg，打印每格对应的帧号
node scripts/render.mjs video            # 成片 → out/<title>.mp4（H.264 CRF 18 + AAC）
npm run dev                              # Studio 预览，拖时间轴调动画
```

`frames.json` 由 timeline 生成：全片首末帧、每段首中末帧、每个 cue 及其后 8 帧。静帧和成片都会先重跑 timeline。

## 静帧清单（逐张看图，不只看联系表）

每段：

- [ ] 一眼能看出这段的重点；实蓝只有一处。
- [ ] 画面里的东西口播都已经说到（cue 之前没有提前露出）。
- [ ] 标题字够大（横版 ~96px、竖版 ~72px），字与字、元素与元素不叠、不贴边。
- [ ] 不压字幕区、不压口播窗、不压顶栏和栏目贴纸；没有横线穿过左上标签和右上层级图标。
- [ ] 芽仔在做事（推、扔、跳、举牌……），表情和当时的情绪词对得上；没有一直换脸、一直小跳。
- [ ] cue 帧和 cue+8 帧之间看得出“这一刻发生了什么”。
- [ ] 所有文字都是小赖体，没有混进苹方；`npm run timeline` 没有 ⚠ 缺字；圈号、勾叉、箭头用 `HandText` 或手画。
- [ ] 卡片是淡蓝贴纸，没有米色胶带、粗黑框、装饰星星。

## 动作检查（连续帧）

单张静帧只能看摆位，看不出动作顺不顺。每个芽仔演示段的主动作，以及任何“推、搬、跳、砸、飞出”的地方，按 3–4 帧一步连出 6–8 帧看一遍：

```sh
node scripts/render.mjs stills 5961,5965,5969,5973,5977,5981,5985   # 全片帧号
node scripts/render.mjs sheet
```

- [ ] 芽仔四肢完整，没有脱离身体或被盖住。
- [ ] 道具跟着手走；推的东西在被碰到之后才动，落点和下一帧对得上。
- [ ] 没有瞬移：相邻两帧之间位置、大小不突变（硬切的除外）。
- [ ] 起步和落地有缓急，不是匀速平移。

场景代码也看一眼：

```sh
wc -l src/scenes/S*.tsx | sort -n | head
```

正常一段 30–70 行，开头有注释说明每个 cue 发生什么。排在最前面只有几行的段，多半是套了通用模板，回去按 [版式与动画](direction.md) 的“每段的底线”重写。

段与段之间：

- [ ] 类型切换处有淡蓝撕纸扫过；同类相接靠元素接戏，不突兀跳变。
- [ ] 口播窗滑入时不撞上一段还没收场的道具。
- [ ] 字幕整片连续：句间短空档保留上一句，没有空字幕条。

## 成片核对

```sh
ffprobe -v error -show_entries stream=codec_type,width,height,r_frame_rate,nb_frames -show_entries format=duration -of compact out/<title>.mp4
```

- [ ] 分辨率、30fps、帧数等于 timeline 的 `durationInFrames`，有音轨。
- [ ] 1 倍速完整看一遍、听一遍：旁白开头不吞字结尾不截断，配乐不盖人声，音效不吵。
- [ ] 音效每段 1–2 个，只在主动作上：`grep -c '<Sfx' src/scenes/*.tsx`，并且 `.map(` 里不放音效。
- [ ] 响度：`ffmpeg -i out/<title>.mp4 -af ebur128=peak=true -f null -` 显示约 -12 LUFS、Peak ≤ -1 dBFS。
- [ ] 真人原声：画面口型与声音同步。

交付时写：成片路径、分镜表路径、按上面清单的验收结论、学了参考片哪几点改在哪、未确认的词、已知问题，然后问用户哪一秒不对。
