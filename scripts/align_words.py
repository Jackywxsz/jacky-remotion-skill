#!/usr/bin/env python3
"""把 whisper 逐词时间 + 人工校对后的原文，对齐成逐字时间轴和字幕。

输出：
- words.json：芽仔引擎（Opus）可读的 Voice 格式（words / chars / sentences / end）。
- captions.json：整片绝对时间的字幕行，Remotion 总装直接使用。

校对文本可以和 ASR 字数不同（漏字、错字、英文词）；用字符级 diff 对齐，
插入的字按前后已知时间插值。只用标准库。

用法：
  python3 align_words.py --asr whisper.json --text corrected.txt \
      --words out/words.json --captions out/captions.json [--max-line 16]
"""
from __future__ import annotations

import argparse
import difflib
import json
import re
from pathlib import Path

SENT_END = "。！？!?"
LINE_BREAK = "，,、；;：:|" + SENT_END  # | 是校对稿里的手动换行


def is_unit(c: str) -> bool:
    return bool(re.match(r"[\w]", c))  # 汉字、字母、数字


def asr_chars(asr: dict) -> list[tuple[str, float, float]]:
    """把 whisper 的词切成单字，词内时间均分。"""
    out = []
    for seg in asr["segments"]:
        for w in seg.get("words", []):
            cs = [c for c in w["word"] if is_unit(c)]
            if not cs:
                continue
            s, e = float(w["start"]), float(w["end"])
            step = (e - s) / len(cs)
            for i, c in enumerate(cs):
                out.append((c.lower(), s + i * step, s + (i + 1) * step))
    return out


def align(text: str, ref: list[tuple[str, float, float]]) -> list[dict]:
    units = [c for c in text if is_unit(c)]
    a = [c for c, _, _ in ref]
    b = [c.lower() for c in units]
    times: list[tuple[float, float] | None] = [None] * len(b)
    for tag, i1, i2, j1, j2 in difflib.SequenceMatcher(None, a, b, autojunk=False).get_opcodes():
        if tag == "equal" or (tag == "replace" and i2 - i1 == j2 - j1):
            # 相同或等长替换：逐字一一对应，保留停顿
            for k in range(j2 - j1):
                times[j1 + k] = (ref[i1 + k][1], ref[i1 + k][2])
        elif tag == "replace":
            # 不等长替换按比例映射到 ASR 时间段
            s, e = ref[i1][1], ref[i2 - 1][2]
            n = j2 - j1
            for k in range(n):
                times[j1 + k] = (s + (e - s) * k / n, s + (e - s) * (k + 1) / n)
    # 纯插入：在前后已知时间之间插值
    i = 0
    while i < len(b):
        if times[i] is not None:
            i += 1
            continue
        j = i
        while j < len(b) and times[j] is None:
            j += 1
        lo = times[i - 1][1] if i > 0 else (times[j][0] if j < len(b) else 0.0)
        hi = times[j][0] if j < len(b) else lo + 0.12 * (j - i)
        hi = max(hi, lo)
        for k in range(i, j):
            n = j - i
            times[k] = (lo + (hi - lo) * (k - i) / n, lo + (hi - lo) * (k - i + 1) / n)
        i = j
    return [{"w": units[k], "s": round(times[k][0], 3), "e": round(times[k][1], 3)} for k in range(len(b))]


def split_runs(text: str, breaks: str) -> list[str]:
    runs, cur = [], ""
    for c in text:
        cur += c
        if c in breaks:
            runs.append(cur.replace("|", "").strip())
            cur = ""
    if cur.strip():
        runs.append(cur.replace("|", "").strip())
    return [r for r in runs if any(is_unit(c) for c in r)]


def spans(runs: list[str], words: list[dict]) -> list[dict]:
    out, k = [], 0
    for r in runs:
        n = sum(1 for c in r if is_unit(c))
        if n == 0:
            continue
        seg = words[k : k + n]
        out.append({"text": r, "start": seg[0]["s"], "end": seg[-1]["e"], "from": k, "to": k + n})
        k += n
    return out


def wrap_line(run: str, max_len: int) -> list[str]:
    """超长字幕在中间附近切开，不切断英文单词；需要精确断句时在校对稿里写 |。"""
    units = sum(1 for c in run if is_unit(c))
    if units <= max_len:
        return [run]
    target, count, cut = units / 2, 0, None
    for idx, c in enumerate(run):
        if is_unit(c):
            count += 1
        if count >= target and (idx + 1 >= len(run) or not re.match(r"[A-Za-z0-9]", run[idx + 1]) or not re.match(r"[A-Za-z0-9]", c)):
            cut = idx + 1
            break
    if cut is None or cut >= len(run):
        return [run]
    return wrap_line(run[:cut], max_len) + wrap_line(run[cut:], max_len)


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--asr", required=True)
    ap.add_argument("--text", required=True)
    ap.add_argument("--words", required=True)
    ap.add_argument("--captions", required=True)
    ap.add_argument("--max-line", type=int, default=16)
    args = ap.parse_args()

    asr = json.loads(Path(args.asr).read_text(encoding="utf-8"))
    text = re.sub(r"\s+", " ", Path(args.text).read_text(encoding="utf-8")).strip()
    words = align(text, asr_chars(asr))
    if not words:
        raise SystemExit("校对文本为空")

    sentences = spans(split_runs(text, SENT_END), words)
    lines = []
    for run in split_runs(text, LINE_BREAK):
        lines.extend(wrap_line(run.rstrip("，,、；;：:"), args.max_line))
    captions = []
    for c in spans(lines, words):
        prev = captions[-1] if captions else None
        # 「第一」「第二」这类不到 0.5 秒的短行并进下一行，避免字幕闪一下
        if prev and prev["end"] - prev["start"] < 0.5:
            prev.update(text=f"{prev['text'].rstrip('，,')}，{c['text']}", end=c["end"])
            continue
        captions.append({"text": c["text"], "start": c["start"], "end": c["end"]})
    for c in captions:
        c["text"] = c["text"].rstrip("。")

    voice = {
        "source": "asr",
        "end": words[-1]["e"],
        "words": words,
        "chars": [{"c": w["w"], "t": w["s"]} for w in words],
        "sentences": sentences,
    }
    for p, data in ((args.words, voice), (args.captions, {"captions": captions})):
        Path(p).parent.mkdir(parents=True, exist_ok=True)
        Path(p).write_text(json.dumps(data, ensure_ascii=False, indent=1), encoding="utf-8")
    print(f"{len(words)} 字 / {len(sentences)} 句 / {len(captions)} 行字幕 → {args.words}, {args.captions}")


if __name__ == "__main__":
    main()
