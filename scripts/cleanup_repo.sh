#!/usr/bin/env bash
set -e

echo "=== EpiCareHub Repo Cleanup ==="
echo "This will:"
echo "  - Remove tracked virtualenv and pycache artifacts from git"
echo "  - Delete local venv, __pycache__, and .DS_Store files"
echo "  - Leave source code and configs intact"
echo
read -p "Continue? (y/N) " answer
if [[ "$answer" != "y" && "$answer" != "Y" ]]; then
  echo "Aborting."
  exit 0
fi

echo
echo "--- Removing tracked junk from git index (but not source files) ---"

# 1) Remove Automation/venv from git tracking (if present)
if git ls-files --error-unmatch "Automation/venv" >/dev/null 2>&1; then
  echo "Removing Automation/venv from git index..."
  git rm -r --cached Automation/venv || true
else
  echo "Automation/venv is not tracked in git."
fi

# 2) Remove any tracked __pycache__ directories
echo "Removing tracked __pycache__ directories from git index..."
if git ls-files | grep -q "__pycache__"; then
  git ls-files | grep "__pycache__" | xargs -r git rm --cached -r
  echo "Removed tracked __pycache__ files."
else
  echo "No tracked __pycache__ files found."
fi

# 3) Remove tracked .DS_Store files
echo "Removing tracked .DS_Store files from git index..."
if git ls-files | grep -q ".DS_Store"; then
  git ls-files | grep ".DS_Store" | xargs -r git rm --cached
  echo "Removed tracked .DS_Store files."
else
  echo "No tracked .DS_Store files found."
fi

echo
echo "--- Deleting local junk (files will be recreated as needed) ---"

echo "Deleting Automation/venv (local virtualenv, safe to remove)..."
rm -rf Automation/venv

echo "Deleting all __pycache__ directories..."
find . -name "__pycache__" -type d -exec rm -rf {} + 2>/dev/null || true

echo "Deleting all .DS_Store files..."
find . -name ".DS_Store" -type f -delete 2>/dev/null || true

echo
echo "Done."
echo "Next steps:"
echo "  1) Run: git status   # review removed files"
echo "  2) If everything looks good: git add ."
echo "  3) Commit with a message like: 'chore: cleanup venv, pycache, and DS_Store'"
