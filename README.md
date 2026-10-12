# Jacky Remotion · 讲解视频 Skill

把逐字稿做成一条可修改的 Remotion 讲解视频：纸蓝风格、手写图解、芽仔动作、字幕、配音与音效放在同一个工程里。支持横版 16:9（1920×1080）和竖版 3:4（1080×1440）。欢迎基于这个 Skill 迭代你自己的版本。

| 画面 | 用途 |
| --- | --- |
| `aroll` 口播图解 | 侧边真人小窗 + 手写图解，讲结构、数字、结论 |
| `broll` 芽仔演示 | 芽仔在整窗里推、搬、跳，用动作讲比喻与因果 |
| `screen` 录屏截图 | 真实界面与证据卡片，可配角色指点 |

代码采用 [MIT](LICENSE)，但芽仔和品牌素材**不在 MIT 范围内**，可以在非商业前提下使用、修改和 fork（芽仔可以原样带着），但不能商用，也不能当成你自己的 IP 或品牌。详见 [素材许可](ASSETS-LICENSE.md)。商用或建立自己的品牌前，请换成自有 IP、品牌图片、名称和已获许可的媒体。字体和 Remotion 各有独立许可，见 [第三方声明](THIRD-PARTY-NOTICES.md)。

## 环境

- Node.js **22+**、npm；Python **3.10+**（建项目、原声对齐脚本）。
- `ffmpeg`、`ffprobe` 在 PATH 中；macOS 可通过 `brew install ffmpeg` 安装。
- Remotion **4.0.533** 及 React、TypeScript 等已在 `template/package.json` 固定直接依赖版本，执行 `npm install` 安装。首次静帧渲染可能联网下载 Chrome Headless Shell。
- 可使用 macOS / Linux / Windows 支持的 Node/Remotion 环境；本版本实际验收平台为 macOS Apple Silicon。
- 真人原声识别另需 Whisper；文档中的 `mlx_whisper` 示例限 Apple Silicon，其他平台可使用能输出对应 word timestamps JSON 的 Whisper 实现。

**Remotion 不是本项目 MIT 许可的一部分。** 2026-10-12 核对的 [官方 license 页面](https://www.remotion.dev/license) 规定：个人、最多 3 名员工的营利组织、非营利组织，以及尚未用于商业用途的评估者可适用免费许可；不符合免费资格的主体需 Company License。官方另有限制 Remotion 衍生软件转售/再许可等条款，并提示 5.0 将调整规则。使用或升级前请以官方现行条款为准。

## 安装 Skill

仓库地址：<https://github.com/Jackywxsz/jacky-remotion-skill>。克隆到哪个工具的 Skill 目录，文件夹名都用 `jacky-remotion`。

Claude Code（个人 Skill）：

```sh
mkdir -p ~/.claude/skills
# 目标目录应不存在；已安装时先自行备份，不直接覆盖。
test ! -e ~/.claude/skills/jacky-remotion && git clone https://github.com/Jackywxsz/jacky-remotion-skill.git ~/.claude/skills/jacky-remotion
```

Codex（个人 Skill）：

```sh
mkdir -p ~/.codex/skills
# 目标目录应不存在；已安装时先自行备份，不直接覆盖。
test ! -e ~/.codex/skills/jacky-remotion && git clone https://github.com/Jackywxsz/jacky-remotion-skill.git ~/.codex/skills/jacky-remotion
```

以后更新：在安装目录里 `git pull`。也可以下载 ZIP 解压后，把含 `SKILL.md` 的目录复制成上面的路径。

建议安装干净的下载包，避免把验证时的 `node_modules`、`review` 一起复制。重开客户端会话，再说「用 jacky-remotion 把下面的逐字稿做成讲解视频」。Skill 是给 Agent 使用的说明和模板，不是自动发布工具；先确认分镜，再制作。

## 先跑一个不需要账号、配音和真人素材的示例

在公开版根目录执行：

```sh
cd template
npm install
npm run timeline
npm run lint
node scripts/render.mjs stills 60
# 打开 review/stills/f00060.png
npm run dev
```

示例使用根目录 `plan.json`、`voice/words.json`、`voice/captions.json` 和 `template/src/scenes/S01.tsx`。时间是为无声演示手工编排的，不是语音识别结果；没有旁白、真人视频、配乐或云端请求。六个音效是程序合成的，可在仓库根目录执行 `node scripts/make-public-sfx.mjs template/public/sfx` 重建。示例不调用音效，画面全程静音。

## 创建你的片子

在 Skill 根目录执行（替换项目路径）：

```sh
python3 -I scripts/new_project.py /path/to/my-video --format h
cd /path/to/my-video/video
npm install
```

项目根目录的 `plan.json` 才是你的分镜表；模板示例不会代替你的稿件和场景。分镜统一由 `npm run timeline` 校验，公开版不包含只支持旧 schema 的 `check_plan.py`。按 [SKILL.md](SKILL.md) 操作：收稿和素材 → 原声对齐或 TTS → 确认分镜 → `npm run timeline` → 编写 `src/scenes/` → 静帧验收 → `node scripts/render.mjs video`。`new_project.py` 不再默认寻找作者机器的共享依赖，仅在显式传入 `--node-modules` 时使用你自己的依赖目录。

## 配音：使用自己的账号和音色

不需要 AI 配音时，直接使用自己的真人原声，见 [配音与声音](references/voice.md)。不要为了跑示例填写任何凭证。

需要火山 TTS 时：将根目录 `.env.example` 复制到**视频项目根目录**的 `.env.local`，在本地填入自己的账号凭证和获授权的音色。`VOLC_TTS_SPEAKER` 没有默认值；本项目不提供作者的克隆音色、音色 ID 或凭证。

读取优先级（已设置的进程环境变量优先）：`--env <文件>` → `VOLC_TTS_ENV_FILE` 指定文件 → `<项目>/.env.local`。没有任何作者机器路径回退。配置文件是简单的 `KEY=value` 格式，不执行 shell、不展开变量。

```sh
node scripts/voice.mjs /path/to/my-video --dry-run
# 核对稿件、字数与服务商费用，并由你确认后，才执行：
node scripts/voice.mjs /path/to/my-video
```

`.env.local` 已被 Git 忽略；不要提交密钥、个人音色 ID、输入口播或输出音频。请求是否收费由服务商条款决定，`--dry-run` 不读取凭证、不联网。

## 把芽仔换成你自己的 IP

不需要新建配置系统，直接在生成的 `video/` 工程修改现有文件：

| 文件 | 要改什么 |
| --- | --- |
| `src/kit/Yazai.tsx` | 角色绘制、部件、颜色与表情；可以保留组件接口便于沿用场景动作，但要完全替换芽仔视觉。角色坐标原点是脚底中点，当前原始高度约 480，留意翻转、旋转轴和阴影。 |
| `src/kit/yazai-traced.json` | 芽仔描图路径、部件分组、面罩几何；换成自己的路径数据，或在新组件不再需要时删掉导入和文件。仅改颜色不等于换了 IP。 |
| `src/scenes/*.tsx`、`src/scenes/index.ts` | 更新角色 import、大小、脚底站位与动作；角色外形改变后重新检查遮挡和运动路径。 |
| `public/brand/frame-v.png`、`public/brand/paper-blue.png` | 替换为自己的竖版框和背景纹理，不能把原图当成 MIT 素材商用。 |
| `src/kit/brand.ts` | 修改 `V` 色板、`HAND` / `SANS` 字体及 `FORMATS` 画布安全区；换底图后同步白窗、顶栏、字幕区和口播窗坐标。 |
| `src/kit/Frame.tsx`、`Caption.tsx`、`Presenter.tsx` | 栏目样式、字幕关键词色、姓名贴纸；排查硬编码颜色和品牌细节。 |
| 项目 `plan.json` | 换 `column`、`presenter.name`、标题、稿件与所有媒体路径；公开版默认栏目和讲述人已通用化。 |
| `public/fonts/`、`fonts.css`、`src/kit/ink.tsx` | 若更换字体，更新字体加载名和覆盖范围，并保留新字体的许可声明。 |

如果要分发自己的 Skill，还要同步修改 `SKILL.md`、`README.md`、`agents/openai.yaml` 中的名称、角色说明和视觉规则，清除原有品牌素材，再更新你自己的许可。不要宣称获得 Jacky 官方背书。保留原代码 MIT 版权声明和第三方许可。

每次换 IP 或颜色后运行 `npm run timeline && npm run lint`，再渲染动作关键帧以及横/竖版各一张；检查字体、字幕安全区、角色比例、边界遮挡。技术检查通过不等于画面已经美观，需要自己看图。

## English

An editable Remotion explainer-video Skill for Claude Code and Codex: presenter + diagrams, Yazai character scenes, and screen evidence, with paper-blue art direction. Requires Node 22+, Python 3.10+, and FFmpeg. Install the folder under `~/.claude/skills/jacky-remotion` or `~/.codex/skills/jacky-remotion`; run the credential-free example in `template/` with `npm install`, `npm run timeline`, `npm run lint`, and `node scripts/render.mjs stills 60`.

Code is MIT. Yazai, brand images and Jacky's identity are excluded and reserved for non-commercial learning only; replace them with your own IP before commercial use. Fonts retain OFL 1.1; Remotion has its own license. Use your own TTS account/voice or your own recording. See the Chinese customization table above for the exact files to change.
