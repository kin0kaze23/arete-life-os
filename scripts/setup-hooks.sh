#!/bin/bash

# Setup git hooks for this repository
# Run once after cloning: ./scripts/setup-hooks.sh

HOOKS_DIR=".git/hooks"

echo "🔧 Setting up git hooks..."

# Create pre-push hook
cat > "$HOOKS_DIR/pre-push" << 'EOF'
#!/bin/sh

echo "🔍 Running pre-push checks..."

# Run doctor script
npm run doctor

if [ $? -ne 0 ]; then
  echo "❌ Pre-push checks failed. Push aborted."
  echo "Fix the issues above and try again."
  exit 1
fi

echo "✅ All checks passed. Pushing..."
EOF

chmod +x "$HOOKS_DIR/pre-push"

echo "✅ Git hooks installed successfully!"
echo ""
echo "Installed hooks:"
echo "  - pre-push: Runs 'npm run doctor' before each push"
