#!/usr/bin/env python3
"""新建讲解视频项目：建目录骨架，把起步模板复制成 <项目>/video/。

用法：python3 -I new_project.py <项目目录> [--format h|v] [--node-modules <已装好的 node_modules>]

- 项目目录已存在 video/ 时拒绝覆盖。
- 依赖：给了 --node-modules 时建软链接（版本与模板 package.json 一致）；
  否则提示在 video/ 里执行 npm install。只用标准库。
"""
from __future__ import annotations

import argparse
import json
import shutil
import sys
from pathlib import Path

SKILL = Path(__file__).resolve().parent.parent
TEMPLATE = SKILL / "template"
# 公开版只使用用户显式指定的共享依赖。

PLAN = {
    "schemaVersion": 2,
    "title": "片名",
    "format": "h",
    "fps": 30,
    "column": "我的栏目 / 知识讲解",
    "keywords": [],
    "audio": {
        "narration": "voice/narration.wav",
        "words": "voice/words.json",
        "captions": "voice/captions.json",
        "music": None,
    },
    "presenter": None,
    "segments": [],
}


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("project")
    ap.add_argument("--format", choices=["h", "v"], default="h")
    ap.add_argument("--node-modules")
    a = ap.parse_args()

    root = Path(a.project).resolve()
    video = root / "video"
    if video.exists():
        print(f"✗ {video} 已存在，不覆盖", file=sys.stderr)
        return 1
    for d in ("input", "voice", "asr"):
        (root / d).mkdir(parents=True, exist_ok=True)
    shutil.copytree(TEMPLATE, video, ignore=shutil.ignore_patterns("node_modules", "out", "review", ".DS_Store"))
    (video / "src/scenes/S01.tsx").unlink(missing_ok=True)
    (video / "src/scenes/index.ts").write_text('import type React from "react";\nexport const scenes:Record<string,React.FC>={};\n', encoding="utf-8")
    plan = root / "plan.json"
    if not plan.exists():
        plan.write_text(json.dumps({**PLAN, "format": a.format}, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    nm = Path(a.node_modules).resolve() if a.node_modules else None
    if nm is not None and nm.is_dir():
        (video / "node_modules").symlink_to(nm)
        print(f"✓ node_modules → {nm}")
    else:
        print(f"! 没有可共享的依赖，请在 {video} 执行 npm install")
    print(f"✓ 项目骨架：{root}\n  下一步：逐字稿写进 voice/script.txt（TTS）或把口播底片放进 input/（真人），再写 plan.json")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
