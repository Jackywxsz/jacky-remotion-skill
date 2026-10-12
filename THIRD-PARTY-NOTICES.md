# 第三方声明

核对日期：2026-10-12。项目 MIT 只覆盖原创代码及文档，不能替代下列上游许可。

## 字体

- **小赖体 / Xiaolai**：SIL Open Font License 1.1。作者来源：[lxgw/kose-font](https://github.com/lxgw/kose-font)，[官方 OFL.txt](https://github.com/lxgw/kose-font/blob/master/OFL.txt)。保留 LXGW 和 Nozomi Seto 的版权声明，完整许可见 `licenses/Xiaolai-OFL.txt`。
- **Excalifont**：SIL Open Font License 1.1。Excalidraw 官方[字体源文件及元数据](https://github.com/excalidraw/excalidraw/blob/541653c7c9d587d463a47daacff9fb30e45a52e7/packages/excalidraw/fonts/Excalifont/index.ts)明确声明 OFL 1.1、Excalidraw 版权和商标，以及原设计/修改作者。上游该目录没有独立 OFL.txt，但 index.ts 内嵌完整许可；本项目原样提取其许可正文并补上同文件的版权与设计者说明：`licenses/Excalifont-OFL.txt`。原始元数据见 `licenses/Excalifont-METADATA.txt`。
- OFL 官方说明与正文：[openfontlicense.org](https://openfontlicense.org/open-font-license-official-text/)。字体可以依条款随软件再分发，需保留许可与版权声明，不能单独售卖字体；字体修改与命名需遵守 OFL。由字体排印出的文档不因此必须采用 OFL。
- 本包字体来自 Excalidraw 的分片：Xiaolai 209 个、Excalifont 7 个。全部 216 个文件与上游 commit `541653c7c9d587d463a47daacff9fb30e45a52e7` 的 Git blob SHA-1 完全一致，未做字形修改。逐文件记录见 `licenses/font-provenance.json`。字体元数据中的作者信息属于必须保留的公开署名。

## 音效

公开包不沿用来源未核实的 wav。六个文件 `pop`、`tick`、`ding`、`thud`、`whoosh`、`swish` 均由随附 `scripts/make-public-sfx.mjs` 使用正弦振荡器和固定种子的伪随机噪声重新合成，无采样、无联网、无外部音源。生成器和本次生成的音效采用 MIT。保留原文件名以兼容 `<Sfx>` 和响度校准，不改变设计规则或引用接口。根目录运行 `node scripts/make-public-sfx.mjs template/public/sfx` 可逐字节复现。

## Remotion 及其他软件

Remotion **4.0.533** 使用自己的 [Remotion License](https://www.remotion.dev/license)，不是 MIT。现行免费资格与公司许可要求见 README；官方提示 5.0 规则将调整。使用、部署或升级前重新核对，不把本 Skill 的 MIT 宣称为 Remotion 的授权。

React、TypeScript、ESLint 等由 npm 安装，各自许可随依赖包保留于 `node_modules`；本包不再分发该目录。FFmpeg、Chrome Headless Shell、可选 Whisper 等工具也各有独立许可，使用者负责遵守其条款。
