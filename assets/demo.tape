# Project-Forge demo (rendered via VHS - https://github.com/charmbracelet/vhs)
# Run: vhs assets/demo.tape -> produces assets/demo.gif

Output assets/demo.gif

Set Theme "Catppuccin Mocha"
Set FontSize 16
Set Width 1200
Set Height 700
Set Padding 20
Set TypingSpeed 60ms

# 1. Show the bootstrap command
Type "# Create a production-ready SaaS in 48h"
Sleep 1s
Enter
Type "./tools/bootstrap my-saas --starter saas --github --vercel"
Sleep 2s
Enter

# 2. Simulated bootstrap output
Type@30ms "✓ Cloning starter (saas - Next.js 15 + Drizzle + Supabase Auth + Stripe)"
Enter
Sleep 500ms
Type@30ms "✓ Initializing spec-kit (.specify/)"
Enter
Sleep 300ms
Type@30ms "✓ Installing 5 PF extensions (convert, testing, security, audit, implement)"
Enter
Sleep 300ms
Type@30ms "✓ Slash commands ready: /speckit.* + /speckit-* + /ralph-loop"
Enter
Sleep 300ms
Type@30ms "✓ Created GitHub repo + connected Vercel"
Enter
Sleep 1s

# 3. Show next steps
Enter
Type "# Now plan your first feature with spec-kit"
Sleep 800ms
Enter
Type "/speckit.specify Add a user dashboard with stats widgets"
Sleep 2s
Enter

Sleep 2s
