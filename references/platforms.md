# 平台适配

skill 正文只写平台无关的步骤：读文件、跑命令、看图。各平台差异集中在这里。

## Claude Code

- 安装：`~/.claude/skills/jacky-remotion` 软链接到本 skill 源目录。
- 看静帧用读图工具逐张打开；长渲染可以放后台跑，完成后再看结果。

## Codex

- 安装：`~/.codex/skills/jacky-remotion`（以及 `~/.agents/skills/`）软链接到同一源目录；界面信息在 `agents/openai.yaml`。
- 渲染和 QA 会启动 Remotion 自带的 headless Chrome、监听本地端口，需要能访问本机进程和端口的权限模式；沙盒拦截时说明需要的权限，不要绕过。
- 看静帧用本地图片查看能力；没有时把路径交给用户看，并写明“未亲自看图”。

## WorkBuddy 等其他平台（待适配）

适配时按顺序检查：能否读本 skill 的相对路径文件；能否执行 shell、Node、Python、FFmpeg；能否启动 Chrome；能否查看本地图片。缺哪项就在这里写降级做法，不改正文流程。

## 共同约定

- 机器路径只写在 `engines.md`。
- 脚本只用 Python 标准库或引擎已有依赖。
- 命令都写成在指定目录执行的完整形式，不依赖某个平台的工作目录记忆。
