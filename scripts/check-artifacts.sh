#!/bin/bash
# EpiCareHub - Check for large files and potential bloat
set -e

echo "🔍 Checking repository for large files and artifacts..."
echo ""

# Check for large files (>5MB) outside .git
echo "📦 Large files (>5MB) in working directory:"
find . -type f -size +5M ! -path "./.git/*" ! -path "*/node_modules/*" -exec ls -lh {} \; | awk '{print $5 "\t" $9}' || echo "   None found"

echo ""
echo "🎯 Tracked large files in git history (top 20):"
git rev-list --objects --all | git cat-file --batch-check='%(objecttype) %(objectname) %(objectsize) %(rest)' | \
  awk '$1 == "blob" && $3 > 1048576' | sort -k3 -n | tail -20 | \
  awk '{size=$3/1024/1024; printf "%.2f MB\t%s\n", size, $4}' || echo "   None found"

echo ""
echo "🗂️  Current repository size:"
du -sh .
git count-objects -vH | grep -E "size-pack|count"

echo ""
echo "📁 Service directory sizes:"
du -sh Frontend Backend Localization-Algorithm 2>/dev/null || true

echo ""
echo "⚠️  Checking for files that should be ignored:"
echo ""

# Check for runtime artifacts
ARTIFACTS_FOUND=0

if [ -d "Localization-Algorithm/uploads" ] && [ "$(ls -A Localization-Algorithm/uploads)" ]; then
    echo "   ⚠️  Localization-Algorithm/uploads/ is not empty"
    ARTIFACTS_FOUND=1
fi

if [ -f "Localization-Algorithm/output.json" ] || [ -f "Localization-Algorithm/overlay.json" ]; then
    echo "   ⚠️  Runtime JSON outputs found in Localization-Algorithm/"
    ARTIFACTS_FOUND=1
fi

if [ -d "Frontend/dist" ] && [ "$(ls -A Frontend/dist)" ]; then
    echo "   ⚠️  Frontend/dist/ exists (build artifacts)"
    ARTIFACTS_FOUND=1
fi

# Check for tracked .pkl, .fif, .h5 files
TRACKED_BINARY=$(git ls-files | grep -E '\.(pkl|fif|h5)$' || true)
if [ -n "$TRACKED_BINARY" ]; then
    echo "   ⚠️  Binary data files tracked in git:"
    echo "$TRACKED_BINARY" | sed 's/^/      /'
    ARTIFACTS_FOUND=1
fi

if [ $ARTIFACTS_FOUND -eq 0 ]; then
    echo "   ✅ No problematic artifacts found"
fi

echo ""
echo "✅ Check complete"
