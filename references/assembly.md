# 口播图解与总装（公开版）

Remotion 工程同时画三种场景并拼接成片。用 `scripts/new_project.py` 建工程，当前实现见 `template/src/Explainer.tsx`、`Root.tsx` 与 `kit/Sound.tsx`。

- 分段来自 `plan.json`，按 `round(秒 × fps)` 映射为左闭右开帧区间。
- 原声或旁白放在所有 Sequence 外；真人小窗视频静音，画面连续运行。
- 芽仔段占整窗，口播段避开真人和字幕安全区；字幕整片只绘制一次。
- 公开版不依赖外部 B-roll 引擎、媒体配置文件或私有参考工程；每段写 `src/scenes/Sxx.tsx` 并在 `index.ts` 登记。

```sh
# 工程目录
npm run timeline
npm run lint
node scripts/render.mjs stills
node scripts/render.mjs sheet
node scripts/render.mjs video
```

成片检查：ffprobe 核对 plan 的尺寸、fps、时长及音轨；看切换前后静帧，再实际播放听声音。当前渲染器会做两遍响度归一化，所以不把成片音频与原音频的字节哈希相同作为验收条件。无声示例仅验证时间轴与静帧；正式成片请准备自己的旁白或原声并确认许可。
