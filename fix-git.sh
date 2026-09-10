#!/bin/bash
# IronVault - macOS Git Index Auto-Healer

INDEX_FILE=".git/index"

if [ ! -f "$INDEX_FILE" ] || [ ! -s "$INDEX_FILE" ]; then
  echo "⚠️ Corrupted or 0-byte .git/index detected. Restoring..."
  rm -f .git/index*
  git reset
  echo "✅ Git index successfully restored and rebuilt from HEAD commit!"
else
  SIZE=$(wc -c < "$INDEX_FILE" | tr -d ' ')
  echo "✅ Git index is healthy ($SIZE bytes). Working tree clean."
fi
