#!/usr/bin/env python3
"""
Check for file conflicts between sub-stories in a phase.

Usage:
    python check_conflicts.py <prd.json> --substories US-001-1 US-001-2 US-002-1

Returns exit code 0 if no conflicts, 1 if conflicts detected.
Outputs JSON with conflict details.
"""

import json
import sys
from pathlib import Path
from typing import Any


def load_prd(prd_path: str) -> dict[str, Any]:
    """Load and parse prd.json file."""
    with open(prd_path, 'r') as f:
        return json.load(f)


def get_story_files(prd: dict, story_id: str) -> set[str]:
    """Get files affected by a story."""
    for story in prd.get('userStories', []):
        if story['id'] == story_id:
            return set(story.get('filesAffected', []))
    return set()


def check_conflicts(prd: dict, story_ids: list[str]) -> dict[str, Any]:
    """Check for file conflicts between stories."""
    result = {
        'has_conflicts': False,
        'conflicts': [],
        'safe_parallel': [],
        'needs_sequential': []
    }

    files_by_story = {sid: get_story_files(prd, sid) for sid in story_ids}

    # Check each pair
    checked = set()
    for i, s1 in enumerate(story_ids):
        for s2 in story_ids[i+1:]:
            pair = tuple(sorted([s1, s2]))
            if pair in checked:
                continue
            checked.add(pair)

            overlap = files_by_story[s1] & files_by_story[s2]
            if overlap:
                result['has_conflicts'] = True
                result['conflicts'].append({
                    'stories': [s1, s2],
                    'files': sorted(list(overlap))
                })
                if s1 not in result['needs_sequential']:
                    result['needs_sequential'].append(s1)
                if s2 not in result['needs_sequential']:
                    result['needs_sequential'].append(s2)

    # Stories without conflicts can run in parallel
    for sid in story_ids:
        if sid not in result['needs_sequential']:
            result['safe_parallel'].append(sid)

    return result


def suggest_groups(prd: dict, story_ids: list[str]) -> list[list[str]]:
    """Suggest groupings that avoid conflicts."""
    files_by_story = {sid: get_story_files(prd, sid) for sid in story_ids}

    groups = []
    remaining = set(story_ids)

    while remaining:
        # Start a new group
        group = []
        group_files = set()

        for sid in sorted(remaining):  # Deterministic ordering
            story_files = files_by_story[sid]
            if not (group_files & story_files):
                group.append(sid)
                group_files |= story_files

        for sid in group:
            remaining.remove(sid)

        groups.append(group)

    return groups


def main():
    if len(sys.argv) < 2:
        print("Usage: python check_conflicts.py <prd.json> --substories US-001-1 US-001-2 ...")
        sys.exit(1)

    prd_path = sys.argv[1]
    story_ids = []

    # Parse --substories
    if '--substories' in sys.argv:
        idx = sys.argv.index('--substories')
        story_ids = [s for s in sys.argv[idx+1:] if not s.startswith('--')]

    if not story_ids:
        print("Error: No sub-stories specified", file=sys.stderr)
        sys.exit(1)

    # Load PRD
    try:
        prd = load_prd(prd_path)
    except FileNotFoundError:
        print(f"Error: PRD file not found: {prd_path}", file=sys.stderr)
        sys.exit(1)

    # Check conflicts
    result = check_conflicts(prd, story_ids)

    # Add suggested groupings if conflicts exist
    if result['has_conflicts']:
        result['suggested_groups'] = suggest_groups(prd, story_ids)

    # Output
    print(json.dumps(result, indent=2))

    # Summary to stderr
    if result['has_conflicts']:
        print(f"\n⚠️  Conflicts detected!", file=sys.stderr)
        for conflict in result['conflicts']:
            print(f"   {conflict['stories'][0]} ↔ {conflict['stories'][1]}: {', '.join(conflict['files'])}", file=sys.stderr)
        print(f"\n💡 Suggested groupings:", file=sys.stderr)
        for i, group in enumerate(result.get('suggested_groups', []), 1):
            print(f"   Group {i}: {', '.join(group)}", file=sys.stderr)
        sys.exit(1)
    else:
        print(f"\n✅ No conflicts! All {len(story_ids)} stories can run in parallel.", file=sys.stderr)
        sys.exit(0)


if __name__ == '__main__':
    main()
