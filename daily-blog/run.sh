#!/bin/bash
# Daily Blog Content Engine - Main Orchestrator
# Creates today's swarm task, then runs ALL ready tasks via swarm.
# This is the single entry point for everything: daily blogs + keyword refresh + future tasks.
#
# Usage:
#   ./run.sh              # Create today's task and run ALL ready tasks
#   ./run.sh 2026-02-07   # Create task for specific date and run all
#   ./run.sh --create     # Only create today's task (don't execute)

set -euo pipefail

PROJECT_DIR="/Users/robroyhobbs/work/daily-blog"
DATE="${1:-$(date +%Y-%m-%d)}"
CREATE_ONLY=false

# Handle --create flag
if [ "$DATE" = "--create" ]; then
  DATE=$(date +%Y-%m-%d)
  CREATE_ONLY=true
fi

TASK_DIR="$PROJECT_DIR/intent/$DATE"
DRAFTS_DIR="$PROJECT_DIR/drafts/$DATE"
LOCKFILE="$PROJECT_DIR/.lock"
LOG_DIR="$PROJECT_DIR/logs/failures"
TEMPLATE_DIR="$PROJECT_DIR/templates/daily-run"

# --- Lockfile: prevent concurrent runs ---
if [ -f "$LOCKFILE" ]; then
  LOCK_PID=$(cat "$LOCKFILE" 2>/dev/null || echo "")
  if [ -n "$LOCK_PID" ] && kill -0 "$LOCK_PID" 2>/dev/null; then
    echo "ERROR: Another instance is running (PID $LOCK_PID). Exiting."
    exit 1
  else
    echo "WARN: Stale lockfile found. Removing."
    rm -f "$LOCKFILE"
  fi
fi
echo $$ > "$LOCKFILE"
trap 'rm -f "$LOCKFILE"' EXIT

# --- Validate config ---
if [ ! -f "$PROJECT_DIR/config.yaml" ]; then
  echo "ERROR: config.yaml not found at $PROJECT_DIR/config.yaml"
  mkdir -p "$LOG_DIR"
  echo "$(date -u +%Y-%m-%dT%H:%M:%SZ) - config.yaml missing" >> "$LOG_DIR/$DATE.md"
  exit 1
fi

if [ ! -f "$PROJECT_DIR/CLAUDE.md" ]; then
  echo "ERROR: CLAUDE.md not found at $PROJECT_DIR/CLAUDE.md"
  mkdir -p "$LOG_DIR"
  echo "$(date -u +%Y-%m-%dT%H:%M:%SZ) - CLAUDE.md missing" >> "$LOG_DIR/$DATE.md"
  exit 1
fi

# --- Create today's directories ---
mkdir -p "$TASK_DIR" "$DRAFTS_DIR" "$LOG_DIR"

# --- Check if today's task already exists ---
if [ -f "$TASK_DIR/TASK.yaml" ]; then
  CURRENT_STATUS=$(grep "^status:" "$TASK_DIR/TASK.yaml" | head -1 | awk '{print $2}' || echo "unknown")
  if [ "$CURRENT_STATUS" = "done" ] || [ "$CURRENT_STATUS" = "review" ]; then
    echo "=== Daily Blog — $DATE ==="
    echo "Today's blog task: $CURRENT_STATUS (already completed)"
  else
    echo "=== Daily Blog — $DATE ==="
    echo "Today's blog task exists with status: $CURRENT_STATUS. Will resume."
  fi
else
  # --- Generate today's task from templates ---
  echo "=== Daily Blog — $DATE ==="
  echo "Creating today's blog task from templates..."

  # Generate INTENT.md from template
  sed "s/{{DATE}}/$DATE/g" "$TEMPLATE_DIR/INTENT.md" > "$TASK_DIR/INTENT.md"

  # Generate plan.md from template
  sed "s/{{DATE}}/$DATE/g" "$TEMPLATE_DIR/plan.md" > "$TASK_DIR/plan.md"

  # Create TASK.yaml
  cat > "$TASK_DIR/TASK.yaml" << EOF
status: ready
owner: null
assignee: null
phase: 0/3
updated: $(date -u +%Y-%m-%dT%H:%M:%SZ)
heartbeat: null
note: "Daily blog generation for $DATE"
EOF

  echo "Task created at: $TASK_DIR"
fi

# --- Show all pending tasks ---
echo ""
echo "=== Pending Tasks ==="
PENDING=0
for dir in "$PROJECT_DIR"/intent/*/; do
  task_file="$dir/TASK.yaml"
  if [ -f "$task_file" ]; then
    task_name=$(basename "$dir")
    task_status=$(grep "^status:" "$task_file" | head -1 | awk '{print $2}' || echo "unknown")
    if [ "$task_status" = "ready" ] || [ "$task_status" = "in_progress" ]; then
      task_phase=$(grep "^phase:" "$task_file" | head -1 | awk '{print $2}' || echo "?")
      echo "  - $task_name: $task_status (phase $task_phase)"
      PENDING=$((PENDING + 1))
    fi
  fi
done

if [ "$PENDING" -eq 0 ]; then
  echo "  (none — all tasks complete)"
  exit 0
fi

# --- If create-only mode, exit here ---
if [ "$CREATE_ONLY" = true ]; then
  echo ""
  echo "Tasks created. Run '/swarm run-all' or './run.sh' to execute."
  exit 0
fi

# --- Execute ALL ready tasks via Claude ---
echo ""
echo "Triggering execution of all $PENDING ready task(s)..."
echo ""

claude -p \
  --allowedTools "Bash,Read,Write,Edit,Glob,Grep,Skill,Task,WebSearch,WebFetch,mcp__plugin_claude-mem_mcp-search__search,mcp__plugin_claude-mem_mcp-search__timeline,mcp__plugin_claude-mem_mcp-search__get_observations" \
  "You are the Daily Blog Engine operator. Execute ALL ready tasks in $PROJECT_DIR.

Project directory: $PROJECT_DIR

STEP 1: Scan $PROJECT_DIR/intent/ for all TASK.yaml files with status: ready or in_progress.
STEP 2: For each ready task, execute it fully:

  For daily blog tasks (intent/{date}/):
    - Read $PROJECT_DIR/CLAUDE.md for complete engine instructions
    - Read the task's plan.md for phases
    - Execute Phase 0 (Planning), Phase 1 (Writing with parallel agents), Phase 2 (QA)
    - Update TASK.yaml and plan.md checkboxes after each phase
    - Complete all phases before moving to next task

  For keyword-refresh tasks (intent/keyword-refresh/):
    - Read the task's INTENT.md and plan.md
    - Run /keyword-research for each product
    - Save results to data/keyword-bank/{product}.json
    - Update checkboxes and TASK.yaml

STEP 3: After all tasks complete, report summary.

IMPORTANT: Execute ALL phases of each task. Do not stop after one phase or one task."

echo ""
echo "=== All tasks complete ==="
echo "Check drafts at: $DRAFTS_DIR"
