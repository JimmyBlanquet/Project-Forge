#!/usr/bin/env python3
"""
extract-lessons.py — Extract learnings from a Claude Code session transcript.

Used by .claude/hooks/session-end-capture.sh.

Reads a Claude Code transcript JSONL file and applies 8 regex patterns to extract
candidate learnings (corrections, workarounds, markers, etc.). Appends matches to
.learnings/queue.jsonl for later curation by /forge-reflect.

Design notes:
- Treats transcript_path as opaque input (Claude Code provides it via stdin to the hook)
- Reads only assistant text content (filters out tool calls and user messages)
- Skips trivial sessions (transcript text < 500 chars)
- Idempotent via session_id + content hash deduplication
- Multi-instance safe via INSTANCE_ID parameter
- Exits 0 always (cannot block session)
"""
from __future__ import annotations

import argparse
import hashlib
import json
import os
import re
import sys
from datetime import datetime, timezone
from pathlib import Path

# 8 high-confidence patterns. Order matters for first-match-wins detection.
PATTERNS: list[tuple[str, re.Pattern[str], float]] = [
    (
        "correction",
        re.compile(
            r"\b(no,?\s+(use|try|it'?s)|actually,?\s|instead\s+of|don'?t\s+(use|do)|"
            r"was wrong|the (real|actual) (problem|issue|bug)|that'?s not right)\b",
            re.IGNORECASE,
        ),
        0.90,
    ),
    (
        "workaround",
        re.compile(
            r"\b(workaround|bug\s*#?\d+|github\s+(issue|#)\s*#?\d+|"
            r"known\s+(issue|bug|problem)|hack\s+to\s+fix)\b",
            re.IGNORECASE,
        ),
        0.85,
    ),
    (
        "marker",
        re.compile(
            r"\b(remember\s+(this|that)|note\s+for\s+(next|future)|"
            r"always\s+(use|do|check|run)|never\s+(use|do|skip|forget)|"
            r"lesson\s+(learned|noted)|important.{0,20}(always|never))\b",
            re.IGNORECASE,
        ),
        0.85,
    ),
    (
        "api-surprise",
        re.compile(
            r"\b(doesn'?t\s+support|not\s+supported|n'?est\s+pas\s+support|"
            r"unexpected(ly)?|the\s+API\s+(returns?|expects?|requires?)|"
            r"turns?\s+out|surprise|caveat)\b",
            re.IGNORECASE,
        ),
        0.75,
    ),
    (
        "hard-fix",
        re.compile(
            r"\b(after\s+\d+\s+(attempt|tries|failures)|finally\s+(work|fix|found)|"
            r"the\s+fix\s+(was|is)|root\s+cause|le\s+(vrai\s+)?probl[eè]me)\b",
            re.IGNORECASE,
        ),
        0.85,
    ),
    (
        "friction",
        re.compile(
            r"\b(took\s+\d+\s+(minutes?|hours?)|spent\s+too\s+long|wasted\s+time|"
            r"painful|frustrat|annoying)\b",
            re.IGNORECASE,
        ),
        0.65,
    ),
    (
        "decision",
        re.compile(
            r"(decided\s+to\s+.{1,60}?\s+because|we'?ll\s+go\s+with|"
            r"chose\s+\w+\s+over|going\s+with\s+\w+\s+instead|"
            r"team\s+decided|we\s+decided\s+to)",
            re.IGNORECASE,
        ),
        0.80,
    ),
    (
        "starter-feedback",
        re.compile(
            r"\b(starters?/saas|project-forge|starter\s+is\s+missing|"
            r"should\s+be\s+in\s+the\s+(starter|template))\b",
            re.IGNORECASE,
        ),
        0.80,
    ),
]

MIN_TRANSCRIPT_CHARS = 500
MAX_CONTEXT_CHARS = 300


def read_assistant_text(transcript_path: Path) -> str:
    """Read JSONL transcript and concatenate all assistant text content."""
    lines: list[str] = []
    try:
        with transcript_path.open("r", encoding="utf-8", errors="replace") as f:
            for raw in f:
                raw = raw.strip()
                if not raw:
                    continue
                try:
                    entry = json.loads(raw)
                except json.JSONDecodeError:
                    continue
                # Support both flat and nested message format
                role = entry.get("role") or entry.get("message", {}).get("role", "")
                if role != "assistant":
                    continue
                content = entry.get("content") or entry.get("message", {}).get("content", "")
                if isinstance(content, str):
                    lines.append(content)
                elif isinstance(content, list):
                    for block in content:
                        if isinstance(block, dict) and block.get("type") == "text":
                            text = block.get("text", "")
                            if text:
                                lines.append(text)
    except OSError:
        return ""
    return "\n".join(lines)


def existing_fingerprints(queue_path: Path) -> set[str]:
    """Load fingerprints of already-queued items to avoid duplicates."""
    fingerprints: set[str] = set()
    if not queue_path.exists():
        return fingerprints
    try:
        with queue_path.open("r", encoding="utf-8") as f:
            for raw in f:
                try:
                    item = json.loads(raw)
                except json.JSONDecodeError:
                    continue
                fp = item.get("fp")
                if fp:
                    fingerprints.add(fp)
    except OSError:
        pass
    return fingerprints


def fingerprint(category: str, context: str) -> str:
    """Stable hash of (category, normalized context) for dedup."""
    normalized = re.sub(r"\s+", " ", context.lower().strip())
    digest = hashlib.sha256(f"{category}::{normalized}".encode("utf-8")).hexdigest()
    return digest[:16]


def extract_match_context(text: str, match: re.Match[str]) -> str:
    """Extract a clean ~300 char context around the regex match."""
    start = max(0, match.start() - 80)
    end = min(len(text), match.end() + 220)
    snippet = text[start:end]
    snippet = snippet.replace("\n", " ").replace("\r", " ")
    snippet = re.sub(r"\s+", " ", snippet).strip()
    return snippet[:MAX_CONTEXT_CHARS]


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--transcript", required=True, help="Path to session transcript JSONL")
    parser.add_argument("--session-id", default="unknown", help="Claude session ID")
    parser.add_argument("--instance-id", default="default", help="Multi-instance ID")
    parser.add_argument("--output", required=True, help="Path to .learnings/queue.jsonl")
    args = parser.parse_args()

    transcript_path = Path(args.transcript)
    if not transcript_path.is_file():
        return 0  # Silent skip — never block session

    text = read_assistant_text(transcript_path)
    if len(text) < MIN_TRANSCRIPT_CHARS:
        return 0  # Trivial session, skip

    queue_path = Path(args.output)
    queue_path.parent.mkdir(parents=True, exist_ok=True)
    seen = existing_fingerprints(queue_path)

    timestamp = datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")
    new_items: list[dict[str, object]] = []

    for category, pattern, confidence in PATTERNS:
        for match in pattern.finditer(text):
            context = extract_match_context(text, match)
            fp = fingerprint(category, context)
            if fp in seen:
                continue
            seen.add(fp)
            new_items.append(
                {
                    "ts": timestamp,
                    "session": args.session_id,
                    "instance": args.instance_id,
                    "cat": category,
                    "ctx": context,
                    "fp": fp,
                    "confidence_raw": confidence,
                    "status": "pending",
                }
            )
            # Cap at 3 matches per pattern per session to avoid spam
            if sum(1 for it in new_items if it["cat"] == category) >= 3:
                break

    if not new_items:
        return 0

    try:
        with queue_path.open("a", encoding="utf-8") as f:
            for item in new_items:
                f.write(json.dumps(item, ensure_ascii=False) + "\n")
    except OSError:
        return 0  # Silent fail — never block

    return 0


if __name__ == "__main__":
    sys.exit(main())
