# 组件库（template/src/kit）

坐标都是**画布绝对像素**（横版 1920×1080，竖版 1080×1440）。HTML 元素用 `position:absolute`，矢量道具放进 `<Stage>`（全画布 SVG）。场景组件只画自己那段；底、白窗、口播窗、字幕、旁白、配乐由总装 `Explainer.tsx` 负责，不在场景里重复。

## 场景骨架

```tsx
import {AbsoluteFill,Easing,useCurrentFrame} from 'remotion';
import {G,HAND,V} from '../kit/brand';
import {cueFrame,segment} from '../kit/timing';
import {HandWrite,Stage,TornBlue,lerp,usePop} from '../kit/ink';
import {Yazai,useFace} from '../kit/Yazai';
import {Sfx} from '../kit/Sound';

const seg=segment('s03');               // plan 里的段 id
export const S03=()=>{
 const f=useCurrentFrame();              // 段内帧
 const hit=cueFrame(seg,'算力');          // 口播原词的段内帧
 const {face,since}=useFace([[hit,'surprise',40]]);
 const a=G.art.withPresenter;            // 有口播窗时的可用区
 return <AbsoluteFill style={{fontFamily:HAND,color:V.ink}}>
  <div style={{position:'absolute',left:a.x,top:a.y+90,whiteSpace:'nowrap'}}><HandWrite text="看似惊艳的产出" at={4} size={96}/></div>
  <Yazai x={a.x+200} y={a.y+a.h-40} h={300} face={face} faceSince={since}/>
  <Sfx name="thud" at={hit}/>
 </AbsoluteFill>;
};
```

写完在 `scenes/index.ts` 登记：`s03:S03`。已验收的完整样例：`references/examples/S02.tsx`（芽仔演示：魔杖、扔纸团、机器秒出、掉坑）、`S03.tsx`（口播图解：跨段接戏、卡片吐出再摔落、标题逐字写出 + 撕纸蓝）。

## brand.ts

| 名称 | 用途 |
|---|---|
| `V` | 颜色：`blue` 实蓝焦点、`ink` 墨线、`sticker` 淡蓝贴纸、`mint` 薄荷点缀、`muted`/`faint` 辅助、`red` 判定 |
| `HAND` / `SANS` | 手写字体栈 / 无衬线（角标） |
| `G` | 当前画幅几何：`window` 白窗、`headerBottom` 顶栏下沿、`presenter` 口播窗、`caption` 字幕、`art.withPresenter` / `art.full` 图解可用区 |

## ink.tsx：手绘与动效

| 组件 / 函数 | 用法 |
|---|---|
| `Stage` | 全画布 SVG 容器，道具和墨线都放里面 |
| `InkLine pts at dur head dash` | 手绘描线，`head` 画箭头 |
| `InkCircle cx cy rx ry at` | 手绘圈注（默认实蓝） |
| `HandWrite text at size per` | 逐字擦出，标题正文默认用它。输出一串 `<span>`，放进 flex 容器时外面包一层 `<div>` |
| `HandDrop text at size` | 逐字落下，短促情绪词 |
| `TornBlue text at size inline` | 撕纸蓝重点，一屏一处 |
| `TagSticker text x y at` | 栏目小签（总装已按 plan.tag 自动放，场景里一般不用） |
| `Sticker x y w h at rot exitAt` | 淡蓝贴纸卡，拍上去带过冲，`exitAt` 淡出 |
| `Highlight at color` | 荧光笔刷在文字后 |
| `Stamp text x y at` | 盖章砸下（结论、✓、✗） |
| `CountUp to at dur suffix` | 数字滚动 |
| `Camera keys` | 推近 / 平移：`[[帧, 中心x, 中心y, 缩放], …]` |
| `usePop(at)` / `useRamp(at,dur)` / `lerp(f,a,b,from,to,easing)` | 弹出、线性、区间插值 |
| `useBoil()` / `roughPath` / `roughRect` / `roughRounded` | 自定义手绘形状：点加抖动、3 帧一换 |
| `rand(seed)` | 确定性随机（渲染必须确定，不要用 `Math.random`） |

## Yazai.tsx：芽仔

`<Yazai x y h face faceSince headRot sprout flip rot shadow seed/>`：`x/y` 是靴底中点，`h` 是身高像素。表情：`idle blink happy surprise star love awkward doubt loading`。
`useFace(cues, blinks)` 排表情；`useHop(from, period, air, amp)` 原地跳。芽仔不变形，也不要给 `Yazai.tsx` 加手臂、腿的旋转参数（描线没有按关节切开，转了会断臂）；靠位移、旋转、跳跃和面罩表演；需要“手里拿东西”时，手的位置约在 `(x+78*h/300, y-81*h/300)`。

## props.tsx：道具

`Machine`（AI 机器，可换屏幕字、抖动、忙碌）、`Sheet`（纸张）、`PaperBall`（纸团）、`Pit`（裂开的坑，分 back/front 两层夹住角色）、`Wand`（魔杖）、`Sparkle` / `Burst`（闪光）、`Cloud`、`Ground`、`Bubble`（思考气泡）、`Scenery`（户外场景底）。
新道具照同样写法加：墨线 `V.ink`、线宽 2.4–4、`useBoil` 抖动、填色用白或 `V.sticker`、实蓝只给焦点。

## Sound.tsx

`<Sfx name at volume/>`：`pop whoosh tick ding thud swish`，`at` 是段内帧。电平已按人声校准，`volume` 是相对档：1 标准、0.5–0.7 次要。一段 1–2 个，只给主动作。旁白和配乐总装已处理。

## HandText（ink.tsx）

`<HandText text="① 交付落文件"/>`：HTML 文字里的 ①–⑨ ✓ ✗ → 换成手画圈号、勾、叉、箭头，其余字照常。`TagSticker` 已内置。SVG 的 `<text>` 用不了，自己画圈或改成中文。

## 超出组件库时

可以直接写 SVG / CSS / Canvas，或加 Remotion 生态的包（`@remotion/lottie`、`@remotion/three`、`@remotion/paths`、`@remotion/shapes` 等，版本与 `remotion` 一致）。要求：画面由帧号决定（不用 `Math.random`、不用 CSS transition / animation）、风格仍是纸蓝手绘。做出好用的新件，验收后再搬进 `template/src/kit/`。
