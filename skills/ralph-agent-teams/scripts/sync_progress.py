#!/usr/bin/env python3
"""
Synchronize progress.txt from multiple parallel agents.

Usage:
    python sync_progress.py <session_dir> [--agent-files <file1> <file2> ...]

Merges individual agent progress files into the main progress.txt.
"""

import sys
import re
from datetime import datetime
from pathlib import Path
from typing import Optional


def parse_agent_progress(content: str) -> dict:
    """Parse an agent's progress contribution."""
    result = {
        'substory_id': None,
        'title': None,
        'agent_id': None,
        'completed': None,
        'learnings': [],
        'files_modified': [],
        'patterns': []
    }

    # Extract sub-story ID and title
    match = re.search(r'Sub-Story\s+(US-[\w-]+):\s*(.+)', content)
    if match:
        result['substory_id'] = match.group(1)
        result['title'] = match.group(2).strip()

    # Extract agent ID
    match = re.search(r'Agent:\s*(\S+)', content)
    if match:
        result['agent_id'] = match.group(1)

    # Extract learnings
    learnings_section = re.search(r'Learnings?:?\s*\n((?:[-*]\s*.+\n?)+)', content)
    if learnings_section:
        learnings = re.findall(r'[-*]\s*(.+)', learnings_section.group(1))
        result['learnings'] = [l.strip() for l in learnings if l.strip()]

    # Extract files modified
    files_section = re.search(r'Files?\s*Modified:?\s*\n((?:[-*]\s*.+\n?)+)', content)
    if files_section:
        files = re.findall(r'[-*]\s*(.+)', files_section.group(1))
        result['files_modified'] = [f.strip() for f in files if f.strip()]

    # Extract patterns
    patterns_section = re.search(r'Patterns?:?\s*\n((?:[-*]\s*.+\n?)+)', content)
    if patterns_section:
        patterns = re.findall(r'[-*]\s*(.+)', patterns_section.group(1))
        result['patterns'] = [p.strip() for p in patterns if p.strip()]

    return result


def format_merged_entry(entry: dict, phase: int) -> str:
    """Format a merged progress entry."""
    timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S')

    lines = [
        f"## {entry['substory_id']}: {entry['title']} ✅",
        f"",
        f"**Phase:** {phase} (Parallel)",
        f"**Agent:** {entry['agent_id'] or 'unknown'}",
        f"**Completed:** {timestamp}",
    ]

    if entry['files_modified']:
        lines.append(f"**Files Modified:** {', '.join(entry['files_modified'])}")

    if entry['learnings']:
        lines.append("")
        lines.append("**Learnings:**")
        for learning in entry['learnings']:
            lines.append(f"- {learning}")

    if entry['patterns']:
        lines.append("")
        lines.append("**Patterns Discovered:**")
        for pattern in entry['patterns']:
            lines.append(f"- {pattern}")

    lines.append("")
    lines.append("---")
    lines.append("")

    return '\n'.join(lines)


def merge_progress_files(
    main_progress_path: Path,
    agent_files: list[Path],
    phase: int
) -> str:
    """Merge agent progress files into main progress.txt."""
    # Read existing progress
    existing_content = ""
    if main_progress_path.exists():
        existing_content = main_progress_path.read_text()

    # Parse and merge agent contributions
    new_entries = []
    for agent_file in agent_files:
        if agent_file.exists():
            content = agent_file.read_text()
            entry = parse_agent_progress(content)
            if entry['substory_id']:
                new_entries.append(entry)

    if not new_entries:
        return existing_content

    # Format new content
    new_content_parts = []
    for entry in new_entries:
        new_content_parts.append(format_merged_entry(entry, phase))

    new_content = '\n'.join(new_content_parts)

    # Merge: append new content to existing
    merged = existing_content.rstrip() + '\n\n' + new_content if existing_content.strip() else new_content

    return merged


def extract_codebase_patterns(progress_content: str) -> list[str]:
    """Extract accumulated codebase patterns from progress.txt."""
    patterns = []

    # Find patterns section
    patterns_match = re.search(
        r'## Codebase Patterns\s*\n((?:[-*]\s*.+\n?)+)',
        progress_content
    )
    if patterns_match:
        found = re.findall(r'[-*]\s*(.+)', patterns_match.group(1))
        patterns.extend([p.strip() for p in found if p.strip()])

    # Also collect patterns from individual entries
    entry_patterns = re.findall(r'\*\*Patterns? Discovered:\*\*\s*\n((?:[-*]\s*.+\n?)+)', progress_content)
    for match in entry_patterns:
        found = re.findall(r'[-*]\s*(.+)', match)
        patterns.extend([p.strip() for p in found if p.strip()])

    # Deduplicate while preserving order
    seen = set()
    unique = []
    for p in patterns:
        if p not in seen:
            seen.add(p)
            unique.append(p)

    return unique


def main():
    if len(sys.argv) < 2:
        print("Usage: python sync_progress.py <session_dir> [--agent-files <file1> <file2> ...] [--phase <n>]")
        sys.exit(1)

    session_dir = Path(sys.argv[1])
    agent_files = []
    phase = 1

    # Parse arguments
    i = 2
    while i < len(sys.argv):
        if sys.argv[i] == '--agent-files':
            i += 1
            while i < len(sys.argv) and not sys.argv[i].startswith('--'):
                agent_files.append(Path(sys.argv[i]))
                i += 1
        elif sys.argv[i] == '--phase':
            i += 1
            if i < len(sys.argv):
                phase = int(sys.argv[i])
                i += 1
        else:
            i += 1

    # If no agent files specified, look for progress_*.txt files
    if not agent_files:
        agent_files = list(session_dir.glob('progress_*.txt'))

    main_progress = session_dir / 'progress.txt'

    # Merge
    merged = merge_progress_files(main_progress, agent_files, phase)

    # Write merged content
    main_progress.write_text(merged)

    # Extract and display patterns
    patterns = extract_codebase_patterns(merged)

    print(f"✅ Merged {len(agent_files)} agent progress files")
    print(f"📝 Updated: {main_progress}")

    if patterns:
        print(f"\n📋 Accumulated Patterns ({len(patterns)}):")
        for p in patterns[:10]:  # Show first 10
            print(f"   - {p}")
        if len(patterns) > 10:
            print(f"   ... and {len(patterns) - 10} more")

    # Cleanup agent files
    for f in agent_files:
        if f.exists() and f != main_progress:
            f.unlink()
            print(f"🗑️  Cleaned up: {f.name}")


if __name__ == '__main__':
    main()
