#!/usr/bin/env python3
"""
Analyze PRD for effort distribution and cost optimization.

Usage:
    python analyze_effort.py <prd.json>
    python analyze_effort.py --generate-frontmatter <skills-dir>

Output:
    JSON with effort categorization for each sub-story and estimated savings.
    With --generate-frontmatter: suggested effort levels for SKILL.md files.
"""

import argparse
import json
import re
import sys
from pathlib import Path
from typing import Any


# Category keywords for matching
CATEGORY_KEYWORDS = {
    "database.schema": ["schema", "table", "migration", "drizzle", "database"],
    "database.rls": ["rls", "policy", "row level", "security policy"],
    "database.indexes": ["index", "performance", "optimize"],
    "types": ["type definition", "typescript", "typedef", "types export"],
    "validation": ["zod", "validation", "schema validation"],
    "service": ["service", "business logic", "crud operations"],
    "api.routes": ["api route", "endpoint", "rest api", "get /", "post /"],
    "api.actions": ["server action", "action", "mutation", "revalidate"],
    "frontend.components": ["component", "shadcn", "ui component", "react component"],
    "frontend.forms": ["form", "react hook form", "input", "formdata"],
    "frontend.pages": ["page", "layout", "route", "/page.tsx"],
    "tests.unit": ["unit test", "test file", ".test.ts"],
    "tests.integration": ["integration test", "api test"],
    "tests.e2e": ["e2e", "playwright", "browser test", "manual test"]
}

# Effort levels per category
EFFORT_LEVELS = {
    "database.schema": "high",
    "database.rls": "high",
    "database.indexes": "medium",
    "types": "medium",
    "validation": "medium",
    "service": "medium",
    "api.routes": "low",
    "api.actions": "medium",
    "frontend.components": "medium",
    "frontend.forms": "medium",
    "frontend.pages": "low",
    "tests.unit": "low",
    "tests.integration": "medium",
    "tests.e2e": "low",
    "unknown": "medium"
}

# Relative cost per effort level (percentage of max)
EFFORT_COSTS = {
    "high": 100,
    "medium": 60,
    "low": 30
}


def categorize_text(text: str) -> str:
    """Categorize text based on keyword matching."""
    text_lower = text.lower()

    # Score each category
    scores = {}
    for category, keywords in CATEGORY_KEYWORDS.items():
        score = sum(1 for kw in keywords if kw in text_lower)
        if score > 0:
            scores[category] = score

    if not scores:
        return "unknown"

    # Return category with highest score
    return max(scores, key=scores.get)


def categorize_story(story: dict) -> str:
    """Categorize a sub-story based on its content."""
    # Combine title, description, and files affected
    text_parts = [
        story.get('title', ''),
        story.get('description', ''),
        ' '.join(story.get('filesAffected', [])),
        ' '.join(story.get('acceptanceCriteria', []))
    ]
    combined_text = ' '.join(text_parts)
    return categorize_text(combined_text)


def analyze_prd(prd: dict) -> dict[str, Any]:
    """Analyze PRD for effort distribution."""
    stories = prd.get('userStories', [])

    # Categorize each story
    categorized = []
    effort_counts = {"high": 0, "medium": 0, "low": 0}

    for story in stories:
        if story.get('passes', False):
            continue  # Skip completed stories

        category = categorize_story(story)
        effort = EFFORT_LEVELS.get(category, "medium")
        effort_counts[effort] += 1

        categorized.append({
            "id": story['id'],
            "title": story.get('title', ''),
            "category": category,
            "effort": effort
        })

    # Calculate cost savings
    total_stories = len(categorized)
    if total_stories == 0:
        return {
            "summary": effort_counts,
            "estimated_savings_pct": 0,
            "stories": []
        }

    # Cost without optimization (all high)
    baseline_cost = total_stories * EFFORT_COSTS["high"]

    # Cost with optimization
    optimized_cost = sum(
        EFFORT_COSTS[story["effort"]]
        for story in categorized
    )

    savings_pct = round((1 - optimized_cost / baseline_cost) * 100, 1)

    return {
        "project": prd.get('project', 'unknown'),
        "total_stories": total_stories,
        "summary": effort_counts,
        "baseline_cost_units": baseline_cost,
        "optimized_cost_units": optimized_cost,
        "estimated_savings_pct": savings_pct,
        "stories": categorized
    }


def parse_skill_frontmatter(skill_path: Path) -> dict | None:
    """Parse YAML frontmatter from a SKILL.md file."""
    try:
        content = skill_path.read_text()
    except (OSError, UnicodeDecodeError):
        return None

    # Match YAML frontmatter between --- delimiters
    match = re.match(r'^---\s*\n(.*?)\n---', content, re.DOTALL)
    if not match:
        return None

    # Simple YAML parsing (key: value) without requiring PyYAML
    frontmatter = {}
    for line in match.group(1).splitlines():
        line = line.strip()
        if ':' in line and not line.startswith('#'):
            key, _, value = line.partition(':')
            key = key.strip()
            value = value.strip().strip('"').strip("'")
            if value and not value.startswith('>'):
                frontmatter[key] = value

    return frontmatter


def suggest_effort_for_skill(name: str, description: str) -> str:
    """Suggest an effort level for a skill based on its name and description."""
    combined = f"{name} {description}".lower()

    # Use the same categorization logic as PRD analysis
    category = categorize_text(combined)

    # If we got a concrete category, use its effort level
    if category != "unknown":
        return EFFORT_LEVELS[category]

    # Heuristic fallback based on skill description keywords
    high_signals = ["security", "auth", "migration", "schema design", "architecture",
                    "threat", "audit", "review", "autonomous", "orchestrat"]
    low_signals = ["template", "boilerplate", "scaffold", "stub", "page", "simple",
                   "list", "crud endpoint"]

    if any(s in combined for s in high_signals):
        return "high"
    if any(s in combined for s in low_signals):
        return "low"

    return "medium"


def generate_frontmatter(skills_dir: str) -> dict:
    """Scan SKILL.md files and suggest effort frontmatter values."""
    skills_path = Path(skills_dir)

    if not skills_path.is_dir():
        print(f"Error: Not a directory: {skills_dir}", file=sys.stderr)
        sys.exit(1)

    # Find all SKILL.md files recursively
    skill_files = sorted(skills_path.rglob("SKILL.md"))

    if not skill_files:
        print(f"No SKILL.md files found in {skills_dir}", file=sys.stderr)
        sys.exit(1)

    results = []
    for sf in skill_files:
        fm = parse_skill_frontmatter(sf)
        if fm is None:
            continue

        name = fm.get("name", sf.parent.name)
        description = fm.get("description", "")
        current_effort = fm.get("effort", None)
        suggested_effort = suggest_effort_for_skill(name, description)

        entry = {
            "file": str(sf.relative_to(skills_path)),
            "name": name,
            "current_effort": current_effort,
            "suggested_effort": suggested_effort,
        }
        if current_effort and current_effort != suggested_effort:
            entry["mismatch"] = True
        results.append(entry)

    summary = {"high": 0, "medium": 0, "low": 0}
    mismatches = 0
    for r in results:
        summary[r["suggested_effort"]] += 1
        if r.get("mismatch"):
            mismatches += 1

    return {
        "skills_dir": str(skills_path),
        "total_skills": len(results),
        "suggested_distribution": summary,
        "mismatches": mismatches,
        "skills": results,
    }


def main():
    parser = argparse.ArgumentParser(
        description="Analyze PRD effort distribution or generate SKILL.md frontmatter suggestions."
    )
    parser.add_argument("path", help="Path to prd.json or skills directory (with --generate-frontmatter)")
    parser.add_argument(
        "--generate-frontmatter",
        action="store_true",
        help="Scan SKILL.md files in <path> and suggest effort frontmatter values"
    )
    args = parser.parse_args()

    if args.generate_frontmatter:
        result = generate_frontmatter(args.path)
        print(json.dumps(result, indent=2))

        # Summary to stderr
        print(f"\nFrontmatter Analysis: {result['total_skills']} skills scanned", file=sys.stderr)
        dist = result['suggested_distribution']
        print(f"   High: {dist['high']}  Medium: {dist['medium']}  Low: {dist['low']}", file=sys.stderr)
        if result['mismatches'] > 0:
            print(f"   {result['mismatches']} mismatch(es) between current and suggested effort", file=sys.stderr)
        return

    # PRD analysis mode
    prd_path = args.path

    # Load PRD
    try:
        with open(prd_path, 'r') as f:
            prd = json.load(f)
    except FileNotFoundError:
        print(f"Error: PRD file not found: {prd_path}", file=sys.stderr)
        sys.exit(1)

    # Analyze
    result = analyze_prd(prd)

    # Output
    print(json.dumps(result, indent=2))

    # Summary to stderr
    print(f"\nEffort Analysis:", file=sys.stderr)
    print(f"   High effort: {result['summary']['high']} stories", file=sys.stderr)
    print(f"   Medium effort: {result['summary']['medium']} stories", file=sys.stderr)
    print(f"   Low effort: {result['summary']['low']} stories", file=sys.stderr)
    print(f"\n   Estimated savings: {result['estimated_savings_pct']}%", file=sys.stderr)


if __name__ == '__main__':
    main()
