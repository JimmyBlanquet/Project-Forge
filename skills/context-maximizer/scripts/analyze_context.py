#!/usr/bin/env python3
"""
Context Maximizer - Analyze and optimize context loading for 1M token window.

Usage:
    python analyze_context.py /path/to/project
    python analyze_context.py /path/to/project --feature "posts-crud"
    python analyze_context.py /path/to/project --spec specs/1-posts-crud/prd.json
    python analyze_context.py /path/to/project --report
    python analyze_context.py /path/to/project --output loading-plan.json
"""

import os
import sys
import json
import argparse
from pathlib import Path
from typing import Dict, List, Tuple, Optional
from dataclasses import dataclass, asdict
from collections import defaultdict

# Token estimation: 1 token ≈ 4 characters
CHARS_PER_TOKEN = 4
MAX_TOKENS = 1_000_000
WARNING_THRESHOLD = 0.95  # Warn at 95% capacity

# Exclusion patterns
EXCLUDE_DIRS = {
    'node_modules', '.git', 'dist', 'build', '.next', 'out',
    '__pycache__', '.pytest_cache', 'coverage', '.venv', 'venv',
    'vendor', 'third_party', '.cache'
}

EXCLUDE_FILES = {
    'package-lock.json', 'yarn.lock', 'pnpm-lock.yaml',
    'Pipfile.lock', 'poetry.lock', '.DS_Store'
}

EXCLUDE_EXTENSIONS = {
    '.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico', '.webp',
    '.pdf', '.zip', '.tar', '.gz', '.rar', '.7z',
    '.exe', '.dll', '.so', '.dylib',
    '.mp4', '.avi', '.mov', '.mkv', '.mp3', '.wav',
    '.woff', '.woff2', '.ttf', '.eot', '.otf'
}

# Priority categories
CRITICAL_PATTERNS = ['constitution', 'specs/', 'plan.json', 'prd.json']
HIGH_PATTERNS = ['skills/', 'SKILL.md', 'prompt.md']
MEDIUM_PATTERNS = ['.ts', '.tsx', '.js', '.jsx', '.py', '.sql']
LOW_PATTERNS = ['.md', 'README', 'docs/']

# Domain-specific patterns
DOMAIN_PATTERNS = {
    'database': ['schema/', 'migrations/', '.sql', 'db/', 'drizzle', 'prisma'],
    'api': ['api/', 'routes/', 'actions/', 'services/', 'endpoints/'],
    'auth': ['auth/', 'middleware/auth', 'lib/auth', 'authentication'],
    'frontend': ['components/', 'app/', 'pages/', 'ui/', 'views/'],
    'posts': ['posts', 'content', 'articles', 'blog'],
    'users': ['users', 'profiles', 'accounts'],
    'payments': ['payments', 'billing', 'stripe', 'checkout'],
    'emails': ['emails', 'mail', 'notifications', 'resend'],
    'files': ['upload', 'storage', 'files', 'media', 'assets'],
    'search': ['search', 'filter', 'query', 'elasticsearch'],
    'admin': ['admin', 'dashboard', 'analytics'],
    'tests': ['test', 'spec', '__tests__', 'e2e', 'integration']
}


@dataclass
class FileInfo:
    path: str
    size: int
    tokens: int
    priority: str
    category: str


@dataclass
class ContextReport:
    total_files: int
    total_tokens: int
    by_category: Dict[str, int]
    by_priority: Dict[str, int]
    within_limit: bool
    utilization: float
    warnings: List[str]
    suggestions: List[str]


@dataclass
class LoadingPlan:
    critical: List[str]
    high: List[str]
    medium: List[str]
    low: List[str]
    excluded: List[str]
    total_tokens: int


class ContextAnalyzer:
    def __init__(self, project_path: str, feature: Optional[str] = None):
        self.project_path = Path(project_path).resolve()
        self.feature = feature
        self.files: List[FileInfo] = []
        self.total_tokens = 0
        self.custom_config = self._load_custom_config()

    def _load_custom_config(self) -> Optional[Dict]:
        """Load custom .context-priority.json if exists."""
        config_path = self.project_path / '.context-priority.json'
        if config_path.exists():
            with open(config_path, 'r') as f:
                return json.load(f)
        return None

    def _should_exclude(self, path: Path) -> bool:
        """Check if path should be excluded."""
        # Check custom exclusions
        if self.custom_config and 'always_exclude' in self.custom_config:
            for pattern in self.custom_config['always_exclude']:
                if pattern in str(path):
                    return True

        # Check directory exclusions
        for part in path.parts:
            if part in EXCLUDE_DIRS:
                return True

        # Check file exclusions
        if path.name in EXCLUDE_FILES:
            return True

        # Check extension exclusions
        if path.suffix in EXCLUDE_EXTENSIONS:
            return True

        return False

    def _estimate_tokens(self, file_path: Path) -> int:
        """Estimate token count for a file."""
        try:
            size = file_path.stat().st_size
            # Simple estimation: size in bytes ≈ characters for text files
            return size // CHARS_PER_TOKEN
        except Exception:
            return 0

    def _categorize_file(self, file_path: Path) -> str:
        """Categorize file by its purpose."""
        path_str = str(file_path).lower()

        if any(p in path_str for p in ['constitution', 'constitution.yml']):
            return 'constitution'

        if 'specs/' in path_str or 'spec/' in path_str:
            return 'specs'

        if 'skills/' in path_str or 'skill.md' in path_str:
            return 'skills'

        if any(p in path_str for p in ['docs/', 'documentation/']):
            return 'docs'

        if any(ext in file_path.suffix for ext in ['.ts', '.tsx', '.js', '.jsx', '.py', '.go', '.rs']):
            return 'codebase'

        if file_path.suffix == '.md':
            return 'docs'

        return 'other'

    def _prioritize_file(self, file_path: Path) -> str:
        """Determine priority level for a file."""
        path_str = str(file_path).lower()
        rel_path = file_path.relative_to(self.project_path)

        # Check custom always_include
        if self.custom_config and 'always_include' in self.custom_config:
            for pattern in self.custom_config['always_include']:
                if pattern in str(rel_path):
                    return 'critical'

        # Critical files
        if any(p in path_str for p in CRITICAL_PATTERNS):
            return 'critical'

        # High priority
        if any(p in path_str for p in HIGH_PATTERNS):
            return 'high'

        # Feature-specific prioritization
        if self.feature:
            feature_lower = self.feature.lower()
            # Extract domain from feature name
            for domain, patterns in DOMAIN_PATTERNS.items():
                if domain in feature_lower or feature_lower in domain:
                    if any(p in path_str for p in patterns):
                        return 'high'

        # Medium priority - source code
        if any(ext in file_path.suffix for ext in ['.ts', '.tsx', '.js', '.jsx', '.py']):
            return 'medium'

        # Low priority - documentation
        return 'low'

    def scan_project(self):
        """Scan project and categorize all files."""
        print(f"Scanning project: {self.project_path}")

        for root, dirs, files in os.walk(self.project_path):
            # Filter out excluded directories in-place
            dirs[:] = [d for d in dirs if d not in EXCLUDE_DIRS]

            for filename in files:
                file_path = Path(root) / filename

                if self._should_exclude(file_path):
                    continue

                tokens = self._estimate_tokens(file_path)
                if tokens == 0:
                    continue

                category = self._categorize_file(file_path)
                priority = self._prioritize_file(file_path)

                file_info = FileInfo(
                    path=str(file_path.relative_to(self.project_path)),
                    size=file_path.stat().st_size,
                    tokens=tokens,
                    priority=priority,
                    category=category
                )

                self.files.append(file_info)
                self.total_tokens += tokens

        print(f"Found {len(self.files)} files, estimated {self.total_tokens:,} tokens")

    def generate_report(self) -> ContextReport:
        """Generate context usage report."""
        by_category = defaultdict(int)
        by_priority = defaultdict(int)
        warnings = []
        suggestions = []

        for file in self.files:
            by_category[file.category] += file.tokens
            by_priority[file.priority] += file.tokens

        utilization = self.total_tokens / MAX_TOKENS
        within_limit = self.total_tokens <= MAX_TOKENS

        # Generate warnings
        if utilization >= WARNING_THRESHOLD:
            warnings.append(
                f"Context usage at {utilization*100:.1f}% - approaching limit"
            )

        if not within_limit:
            warnings.append(
                f"Context exceeds limit by {self.total_tokens - MAX_TOKENS:,} tokens"
            )

        # Check for large files
        large_files = [f for f in self.files if f.tokens > 100_000]
        if large_files:
            warnings.append(
                f"Found {len(large_files)} files exceeding 100k tokens"
            )

        # Generate suggestions
        test_tokens = sum(f.tokens for f in self.files if 'test' in f.path.lower())
        if test_tokens > 50_000:
            suggestions.append(
                f"Consider excluding test files to save ~{test_tokens:,} tokens"
            )

        fixture_tokens = sum(f.tokens for f in self.files if 'fixture' in f.path.lower() or '__mocks__' in f.path)
        if fixture_tokens > 10_000:
            suggestions.append(
                f"Consider excluding test fixtures to save ~{fixture_tokens:,} tokens"
            )

        generated_tokens = sum(f.tokens for f in self.files if 'generated' in f.path.lower() or '.gen.' in f.path)
        if generated_tokens > 30_000:
            suggestions.append(
                f"Consider summarizing generated files to save ~{generated_tokens:,} tokens"
            )

        return ContextReport(
            total_files=len(self.files),
            total_tokens=self.total_tokens,
            by_category=dict(by_category),
            by_priority=dict(by_priority),
            within_limit=within_limit,
            utilization=utilization,
            warnings=warnings,
            suggestions=suggestions
        )

    def generate_loading_plan(self) -> LoadingPlan:
        """Generate prioritized loading plan."""
        plan = LoadingPlan(
            critical=[],
            high=[],
            medium=[],
            low=[],
            excluded=[],
            total_tokens=0
        )

        # Sort files by priority
        priority_order = {'critical': 0, 'high': 1, 'medium': 2, 'low': 3}
        sorted_files = sorted(self.files, key=lambda f: (priority_order[f.priority], -f.tokens))

        current_tokens = 0
        buffer_tokens = int(MAX_TOKENS * 0.05)  # 5% buffer
        available_tokens = MAX_TOKENS - buffer_tokens

        for file in sorted_files:
            if current_tokens + file.tokens <= available_tokens:
                # Add to appropriate priority list
                if file.priority == 'critical':
                    plan.critical.append(file.path)
                elif file.priority == 'high':
                    plan.high.append(file.path)
                elif file.priority == 'medium':
                    plan.medium.append(file.path)
                else:
                    plan.low.append(file.path)

                current_tokens += file.tokens
            else:
                plan.excluded.append(file.path)

        plan.total_tokens = current_tokens

        return plan


def main():
    parser = argparse.ArgumentParser(
        description='Analyze context usage and generate loading plans for 1M token window'
    )
    parser.add_argument('project_path', help='Path to project root')
    parser.add_argument('--feature', help='Feature name for domain-specific prioritization')
    parser.add_argument('--spec', help='Path to spec file (extracts feature from spec)')
    parser.add_argument('--report', action='store_true', help='Generate detailed report')
    parser.add_argument('--output', help='Output JSON file for loading plan')
    parser.add_argument('--format', choices=['json', 'text'], default='json', help='Output format')

    args = parser.parse_args()

    # Extract feature from spec if provided
    feature = args.feature
    if args.spec and not feature:
        # Try to extract feature name from spec path
        spec_path = Path(args.spec)
        if spec_path.exists():
            feature = spec_path.parent.name

    # Create analyzer
    analyzer = ContextAnalyzer(args.project_path, feature)

    # Scan project
    analyzer.scan_project()

    if args.report:
        # Generate and display report
        report = analyzer.generate_report()

        if args.format == 'json':
            print(json.dumps(asdict(report), indent=2))
        else:
            print("\n=== Context Analysis Report ===\n")
            print(f"Total Files: {report.total_files}")
            print(f"Total Tokens: {report.total_tokens:,} / {MAX_TOKENS:,}")
            print(f"Utilization: {report.utilization*100:.1f}%")
            print(f"Within Limit: {report.within_limit}")

            print("\n--- By Category ---")
            for cat, tokens in sorted(report.by_category.items()):
                pct = (tokens / report.total_tokens) * 100
                print(f"  {cat:15} {tokens:8,} tokens ({pct:5.1f}%)")

            print("\n--- By Priority ---")
            for pri, tokens in sorted(report.by_priority.items()):
                pct = (tokens / report.total_tokens) * 100
                print(f"  {pri:10} {tokens:8,} tokens ({pct:5.1f}%)")

            if report.warnings:
                print("\n--- Warnings ---")
                for warning in report.warnings:
                    print(f"  ⚠️  {warning}")

            if report.suggestions:
                print("\n--- Suggestions ---")
                for suggestion in report.suggestions:
                    print(f"  💡 {suggestion}")

    else:
        # Generate loading plan
        plan = analyzer.generate_loading_plan()

        output = {
            'total_tokens': plan.total_tokens,
            'utilization': f"{(plan.total_tokens / MAX_TOKENS)*100:.1f}%",
            'loading_plan': {
                'critical': plan.critical,
                'high': plan.high,
                'medium': plan.medium,
                'low': plan.low
            },
            'excluded_files': len(plan.excluded),
            'metadata': {
                'project_path': str(analyzer.project_path),
                'feature': feature,
                'max_tokens': MAX_TOKENS
            }
        }

        if args.output:
            output_path = Path(args.output)
            with open(output_path, 'w') as f:
                json.dump(output, f, indent=2)
            print(f"Loading plan saved to: {output_path}")
        else:
            print(json.dumps(output, indent=2))


if __name__ == '__main__':
    main()
