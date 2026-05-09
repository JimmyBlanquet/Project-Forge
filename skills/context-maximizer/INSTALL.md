# Context Maximizer - Installation & Verification

## Installation

### Method 1: Use from Source

Already installed at:
```
./skills/context-maximizer/
```

To use:
```bash
python3 ./skills/context-maximizer/scripts/analyze_context.py --help
```

### Method 2: Extract from Package

If using the packaged version:
```bash
# Extract the .skill file
unzip context-maximizer.skill

# Use the tool
python3 context-maximizer/scripts/analyze_context.py /path/to/project --report
```

### Method 3: Add to PATH (Optional)

For easier access:
```bash
# Add to your .bashrc or .zshrc
export PATH="$PATH:./skills/context-maximizer/scripts"

# Make executable
chmod +x ./skills/context-maximizer/scripts/analyze_context.py

# Use directly
analyze_context.py . --report
```

## Requirements

- **Python**: 3.6+ (tested with 3.12)
- **Dependencies**: None (uses standard library only)
- **OS**: Linux, macOS, Windows

## Verification

### Test 1: Help Command

```bash
python3 scripts/analyze_context.py --help
```

Expected: Usage information displayed.

### Test 2: Basic Analysis

```bash
python3 scripts/analyze_context.py ./temp-saas-starter --report
```

Expected output:
```
Scanning project: ./temp-saas-starter
Found 76 files, estimated 423,491 tokens

=== Context Analysis Report ===

Total Files: 76
Total Tokens: 423,491 / 1,000,000
Utilization: 42.3%
Within Limit: True
```

### Test 3: Feature-Specific Loading

```bash
python3 scripts/analyze_context.py ./temp-saas-starter --feature "posts-crud"
```

Expected: JSON output with prioritized file lists, including posts-related files in "high" priority.

### Test 4: JSON Output

```bash
python3 scripts/analyze_context.py ./temp-saas-starter --feature "posts" --output /tmp/test-output.json
cat /tmp/test-output.json
```

Expected: Valid JSON file created with loading plan.

## Verification Results

Tested on: 2026-02-07

### Test Environment
- **OS**: Linux 6.14.0-37-generic
- **Python**: 3.12
- **Project**: temp-saas-starter (76 files, 423k tokens)

### Results

✓ **Test 1**: Help command works
✓ **Test 2**: Basic analysis successful
```
Total Files: 76
Total Tokens: 423,491 / 1,000,000
Utilization: 42.3%
Within Limit: True
```

✓ **Test 3**: Feature filtering works
```
High priority files include:
- app/actions/posts.ts
- components/posts/post-form.tsx
- app/(dashboard)/posts/page.tsx
(and 8 more posts-related files)
```

✓ **Test 4**: JSON output created successfully
```json
{
  "total_tokens": 423491,
  "utilization": "42.3%",
  "loading_plan": { ... }
}
```

## Common Issues

### Issue 1: "python: command not found"

**Solution**: Use `python3` instead:
```bash
python3 scripts/analyze_context.py . --report
```

### Issue 2: "Permission denied"

**Solution**: Make script executable:
```bash
chmod +x scripts/analyze_context.py
```

### Issue 3: Module import errors

**Solution**: The script uses only standard library. If you see import errors, ensure Python 3.6+ is installed:
```bash
python3 --version
```

### Issue 4: Incorrect token estimates

**Note**: Token estimation uses 1 token ≈ 4 characters approximation. Actual usage may vary by ±15%.

## File Locations

```
skills/context-maximizer/
├── INSTALL.md                    # This file
├── SKILL.md                      # Complete documentation
├── README.md                     # User guide
├── QUICK_START.md                # Quick reference
├── SUMMARY.md                    # Project summary
├── scripts/
│   └── analyze_context.py       # Main tool
├── references/
│   └── loading-strategies.md    # Detailed strategies
└── examples/
    └── posts-crud-example.md    # Real example
```

## Package Information

- **Version**: 1.0.0
- **Size**: 24KB (compressed), 92KB (uncompressed)
- **Files**: 7 documentation files + 1 Python script
- **License**: Project-Forge license

## Next Steps

1. ✓ Verify installation
2. ✓ Run basic test
3. Read `QUICK_START.md` for usage guide
4. Check `examples/posts-crud-example.md` for real-world example
5. Integrate with your SpecKit workflow

## Support

For issues or questions:
1. Check `README.md` for troubleshooting
2. Review `references/loading-strategies.md` for best practices
3. See `examples/` for working examples

## Updates

To update the skill:
1. Pull latest from repository
2. Or extract new `.skill` package
3. Verify with test commands above

---

**Installation verified**: 2026-02-07
**Status**: Ready for use
