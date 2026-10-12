# 环境与路径（公开版）

本 Skill 无需作者机器上的其他工程。安装目录包含 `template/`、`scripts/` 和 `references/`；`python3 -I scripts/new_project.py <项目目录>` 把模板复制到 `<项目>/video/`。

| 用途 | 通用路径与说明 |
| --- | --- |
| Remotion 工程 | `<项目>/video/`，进入后 `npm install`；有 lockfile 时也可 `npm ci` |
| 逐字稿与 TTS 产物 | `<项目>/voice/` |
| 真人原声对齐 | `<项目>/asr/`；输入素材在 `<项目>/input/` |
| 分镜 | `<项目>/plan.json`，工程内 `npm run timeline` 读取 |
| 芽仔组件 | `<项目>/video/src/kit/Yazai.tsx`；不需要外部芽仔引擎 |
| 凭证 | 进程环境变量优先，其次 `--env <文件>`、`VOLC_TTS_ENV_FILE` 指定文件、`<项目>/.env.local`，先设置的值不覆盖 |
| 共享依赖（可选） | 仅显式传 `--node-modules <目录>` 时使用；版本需与你的 package.json 一致 |

TTS 必须使用自己的账号和音色，模板不含个人克隆音色或密钥。`--dry-run` 不读取凭证、不联网。新手先运行 README 中的无声示例。
