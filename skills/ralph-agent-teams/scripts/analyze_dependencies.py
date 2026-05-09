#!/usr/bin/env python3
"""
Analyze Ralph++ PRD dependencies and generate parallel execution phases.

Usage:
    python analyze_dependencies.py <prd.json> [--output <parallel_phases.json>]

Output:
    JSON file with phases grouped for parallel/sequential execution.
"""

import json
import sys
from collections import defaultdict
from pathlib import Path
from typing import Any


def load_prd(prd_path: str) -> dict[str, Any]:
    """Load and parse prd.json file."""
    with open(prd_path, 'r') as f:
        return json.load(f)


def build_dependency_graph(user_stories: list[dict]) -> dict[str, set[str]]:
    """Build a graph of dependencies between sub-stories."""
    graph = {}
    for story in user_stories:
        story_id = story['id']
        deps = set(story.get('dependencies', []))
        graph[story_id] = deps
    return graph


def get_files_affected(user_stories: list[dict]) -> dict[str, set[str]]:
    """Map each sub-story to its affected files."""
    files_map = {}
    for story in user_stories:
        story_id = story['id']
        files = set(story.get('filesAffected', []))
        files_map[story_id] = files
    return files_map


def detect_file_conflicts(stories: list[str], files_map: dict[str, set[str]]) -> list[tuple[str, str, set[str]]]:
    """Detect file conflicts between stories in the same phase."""
    conflicts = []
    story_list = list(stories)
    for i, s1 in enumerate(story_list):
        for s2 in story_list[i+1:]:
            overlap = files_map.get(s1, set()) & files_map.get(s2, set())
            if overlap:
                conflicts.append((s1, s2, overlap))
    return conflicts


def topological_levels(graph: dict[str, set[str]], completed: set[str]) -> list[set[str]]:
    """
    Compute topological levels for parallel execution.
    Returns list of sets, where each set contains stories that can run in parallel.
    """
    remaining = {k for k, v in graph.items() if k not in completed}
    levels = []

    while remaining:
        # Find all stories whose dependencies are all completed
        ready = set()
        for story_id in remaining:
            deps = graph[story_id]
            if deps.issubset(completed):
                ready.add(story_id)

        if not ready:
            # Circular dependency or blocked
            print(f"Warning: Blocked stories detected: {remaining}", file=sys.stderr)
            break

        levels.append(ready)
        completed = completed | ready
        remaining = remaining - ready

    return levels


def group_by_file_conflicts(stories: set[str], files_map: dict[str, set[str]]) -> list[list[str]]:
    """
    Group stories to avoid file conflicts within each group.
    Returns list of groups that can run in parallel.
    """
    if not stories:
        return []

    stories_list = list(stories)
    if len(stories_list) == 1:
        return [stories_list]

    groups = []
    used = set()

    for story in stories_list:
        if story in used:
            continue

        # Start new group with this story
        group = [story]
        group_files = files_map.get(story, set()).copy()
        used.add(story)

        # Try to add more stories without conflicts
        for other in stories_list:
            if other in used:
                continue
            other_files = files_map.get(other, set())
            if not (group_files & other_files):
                group.append(other)
                group_files |= other_files
                used.add(other)

        groups.append(group)

    return groups


def analyze_prd(prd: dict, max_agents: int = 4) -> dict[str, Any]:
    """
    Analyze PRD and generate parallel execution phases.

    Args:
        prd: Parsed prd.json content
        max_agents: Maximum parallel agents per phase

    Returns:
        Dict with phases for execution
    """
    user_stories = prd.get('userStories', [])

    # Build dependency graph
    graph = build_dependency_graph(user_stories)
    files_map = get_files_affected(user_stories)

    # Get already completed stories
    completed = {s['id'] for s in user_stories if s.get('passes', False)}

    # Compute topological levels
    levels = topological_levels(graph, completed)

    # Build phases
    phases = []
    for level_idx, level_stories in enumerate(levels, 1):
        # Group by file conflicts
        conflict_groups = group_by_file_conflicts(level_stories, files_map)

        for group_idx, group in enumerate(conflict_groups):
            is_parallel = len(group) > 1
            effective_agents = min(len(group), max_agents)

            # Detect any remaining conflicts
            conflicts = detect_file_conflicts(group, files_map)

            phase = {
                "id": len(phases) + 1,
                "level": level_idx,
                "substories": group,
                "parallel": is_parallel and not conflicts,
                "max_agents": effective_agents if is_parallel else 1,
                "file_conflicts": [
                    {"stories": [c[0], c[1]], "files": list(c[2])}
                    for c in conflicts
                ] if conflicts else []
            }

            # Add reason for sequential phases
            if not is_parallel:
                phase["reason"] = "single_story"
            elif conflicts:
                phase["reason"] = "file_conflicts"
                phase["parallel"] = False
                phase["max_agents"] = 1

            phases.append(phase)

    # Calculate metrics
    total_stories = len([s for s in user_stories if not s.get('passes', False)])
    parallel_phases = sum(1 for p in phases if p.get('parallel', False))
    max_parallelism = max((p.get('max_agents', 1) for p in phases), default=1)

    # Estimate time savings
    sequential_units = total_stories
    parallel_units = sum(
        len(p['substories']) / p.get('max_agents', 1)
        for p in phases
    )
    time_saved_pct = round((1 - parallel_units / sequential_units) * 100, 1) if sequential_units > 0 else 0

    return {
        "project": prd.get('project', 'unknown'),
        "branch": prd.get('branchName', 'unknown'),
        "analysis": {
            "total_stories": total_stories,
            "completed_stories": len(completed),
            "remaining_stories": total_stories,
            "total_phases": len(phases),
            "parallel_phases": parallel_phases,
            "max_parallelism": max_parallelism,
            "estimated_time_saved_pct": time_saved_pct
        },
        "phases": phases
    }


def main():
    if len(sys.argv) < 2:
        print("Usage: python analyze_dependencies.py <prd.json> [--output <parallel_phases.json>]")
        sys.exit(1)

    prd_path = sys.argv[1]
    output_path = None

    # Parse --output flag
    if '--output' in sys.argv:
        idx = sys.argv.index('--output')
        if idx + 1 < len(sys.argv):
            output_path = sys.argv[idx + 1]

    # Load PRD
    try:
        prd = load_prd(prd_path)
    except FileNotFoundError:
        print(f"Error: PRD file not found: {prd_path}", file=sys.stderr)
        sys.exit(1)
    except json.JSONDecodeError as e:
        print(f"Error: Invalid JSON in PRD: {e}", file=sys.stderr)
        sys.exit(1)

    # Analyze
    result = analyze_prd(prd)

    # Output
    output_json = json.dumps(result, indent=2)

    if output_path:
        Path(output_path).write_text(output_json)
        print(f"Analysis written to: {output_path}")
    else:
        print(output_json)

    # Print summary to stderr
    print(f"\n📊 Analysis Summary:", file=sys.stderr)
    print(f"   Total phases: {result['analysis']['total_phases']}", file=sys.stderr)
    print(f"   Parallel phases: {result['analysis']['parallel_phases']}", file=sys.stderr)
    print(f"   Max parallelism: {result['analysis']['max_parallelism']} agents", file=sys.stderr)
    print(f"   Estimated time saved: {result['analysis']['estimated_time_saved_pct']}%", file=sys.stderr)


if __name__ == '__main__':
    main()
