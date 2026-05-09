# Examples

This directory contains example projects and configurations that demonstrate Project-Forge capabilities.

## Using Examples

Examples show typical SpecKit + Ralph++ workflows:
- Constitution files defining project principles
- Feature specifications with sub-stories
- Agent Teams session logs for parallel implementation

To create your own project, use:

```bash
./tools/bootstrap my-project --starter supabase-stripe
```

Then follow the SpecKit workflow:
```bash
/speckit-constitution   # Define principles
/speckit-specify        # Define WHAT to build
/speckit-plan           # Define HOW to build
/speckit-tasks          # Generate tasks
/speckit-convert        # Convert to PRD for Ralph++
```
