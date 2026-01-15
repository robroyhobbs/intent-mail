#!/bin/bash
# Backup script for CLAUDE.md files
# Usage: ./backup-claude-files.sh [optional-backup-dir]

WORK_DIR="/Users/robroyhobbs/work"
BACKUP_BASE="${1:-$WORK_DIR/.claude-backups}"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_DIR="$BACKUP_BASE/$TIMESTAMP"

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Find and copy all CLAUDE.md files, preserving directory structure
echo "Backing up CLAUDE.md files to: $BACKUP_DIR"
echo "---"

cd "$WORK_DIR"
find . -name "CLAUDE.md" -type f | while read file; do
    # Create subdirectory structure
    dir=$(dirname "$file")
    mkdir -p "$BACKUP_DIR/$dir"

    # Copy file
    cp "$file" "$BACKUP_DIR/$file"
    echo "✓ $file"
done

# Create a manifest
echo ""
echo "Files backed up at $(date)" > "$BACKUP_DIR/MANIFEST.txt"
find "$BACKUP_DIR" -name "CLAUDE.md" -type f >> "$BACKUP_DIR/MANIFEST.txt"

echo "---"
echo "Backup complete: $BACKUP_DIR"
echo ""

# Show backup size
du -sh "$BACKUP_DIR"

# Optional: Keep only last 10 backups
BACKUP_COUNT=$(ls -d "$BACKUP_BASE"/*/ 2>/dev/null | wc -l)
if [ "$BACKUP_COUNT" -gt 10 ]; then
    echo ""
    echo "Cleaning old backups (keeping last 10)..."
    ls -dt "$BACKUP_BASE"/*/ | tail -n +11 | xargs rm -rf
fi
