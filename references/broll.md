# 芽仔 B-roll（公开版）

在当前 Remotion 工程中直接编写芽仔场景，不需要外部引擎或私有项目。

1. 在项目 plan 中定义 `type: "broll"`、`presenter: "hidden"`，cue 的 `say` 使用逐字稿原词。
2. `npm run timeline` 生成段落与 cue 帧；用 `cueFrame` 取段内帧。
3. 每段一个 `src/scenes/Sxx.tsx` 并登记；使用 `kit/Yazai.tsx` 让角色把比喻和因果演出来。
4. 实际代码参考 `references/examples/S02.tsx`、`S03.tsx`；它们是场景写法示例，接入时需匹配自己的 plan 与 cue，并非即插即用的完整片子。

比喻优先用角色与道具演出；仅需强调单词或对比时才用卡片。没有合适场景时在当前项目新写并验收，不用旧模板凑。

## 美术底线

- 芽仔是主演，约占画面高 30–35%，要做动作；表情与情绪词同时亮。
- 从第 0 帧起至少有芽仔加一个场景物件，任何时刻不能只剩纸底。
- 纸蓝 `#0138C4` 每段只给一个焦点；负面情绪不放彩纸。
- 毛边线条、马克笔填色、贴纸标签（白描边 + 轻投影），描线出现，弹出带回弹。

## 渲染与检查

工程内执行 `node scripts/render.mjs stills`，检查每个 cue 及其后 8 帧、每段首中末帧；用 `sheet` 拼联系表。需要成片时执行 `node scripts/render.mjs video`。最终帧数、尺寸和声音以当前 plan 为准。
