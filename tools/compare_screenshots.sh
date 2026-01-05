#!/bin/bash
set -e

# Usage: ./compare_screenshots.sh <replay-path> <screenshot-path> [simulate-to-tick]

REPLAY_PATH="$1"
SCREENSHOT_PATH="$2"
SIMULATE_TO_TICK="$3"

if [ -z "$REPLAY_PATH" ] || [ -z "$SCREENSHOT_PATH" ]; then
  echo "Usage: $0 <replay-path> <screenshot-path> [simulate-to-tick]"
  exit 1
fi

# Get absolute paths
# Handle Replay Path
if [[ "$REPLAY_PATH" = /* ]]; then
  ABS_REPLAY_PATH="$REPLAY_PATH"
else
  ABS_REPLAY_PATH="$(pwd)/$REPLAY_PATH"
fi

# Handle Screenshot Path (create if missing)
mkdir -p "$SCREENSHOT_PATH"
if [[ "$SCREENSHOT_PATH" = /* ]]; then
  ABS_SCREENSHOT_PATH="$SCREENSHOT_PATH"
else
  ABS_SCREENSHOT_PATH="$(pwd)/$SCREENSHOT_PATH"
fi

# Locate directories
TOOLS_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(dirname "$TOOLS_DIR")"
SRC_JS_DIR="$REPO_ROOT/src-js"
BASELINE_DIR="$REPO_ROOT/screenshots/1"

echo "Replay Path: $ABS_REPLAY_PATH"
echo "Screenshot Path: $ABS_SCREENSHOT_PATH"
echo "Repo Root: $REPO_ROOT"
if [ -n "$SIMULATE_TO_TICK" ]; then
  echo "Simulating to tick: $SIMULATE_TO_TICK"
fi

# 1. Build
echo "Building web client..."
cd "$SRC_JS_DIR"
npm run build

# 2. Run NW.js with replay
echo "Running Replay..."
# Note: we use 'nw .' so we must be in src-js
CMD_ARGS="--replay-path=\"$ABS_REPLAY_PATH\" --screenshot-path=\"$ABS_SCREENSHOT_PATH\" --headless"

if [ -n "$SIMULATE_TO_TICK" ]; then
  CMD_ARGS="$CMD_ARGS --simulate-to-tick=$SIMULATE_TO_TICK"
fi

# Use eval to handle quoted arguments correctly or just pass them if no spaces (paths might have spaces)
# For safety with spaces in paths, it's better to verify array handling or be careful.
# Simplest way given bash limitations with string appending vs arrays:
# Construct the command line.

if [ -n "$SIMULATE_TO_TICK" ]; then
  npx nw . --replay-path="$ABS_REPLAY_PATH" --screenshot-path="$ABS_SCREENSHOT_PATH" --headless --simulate-to-tick="$SIMULATE_TO_TICK"
else
  npx nw . --replay-path="$ABS_REPLAY_PATH" --screenshot-path="$ABS_SCREENSHOT_PATH" --headless
fi

# 3. Compare screenshots
echo "Comparing screenshots..."
# We can stay in src-js or move back. staying in src-js to use npx easily if needed, but npx works anywhere with -y.
# However, the user example showed `for f in <repo_root>/screenshots/1/*.png`.

count=0
for f in "$BASELINE_DIR"/*.png; do
  # Check if any files exist (in case glob fails)
  [ -e "$f" ] || continue
  
  BASENAME="$(basename "$f")"
  CANDIDATE="$ABS_SCREENSHOT_PATH/$BASENAME"
  DIFF_OUTPUT="diff_$BASENAME"
  
  if [ -f "$CANDIDATE" ]; then
    echo "Checking $BASENAME..."
    npx -y odiff-bin "$f" "$CANDIDATE" "$DIFF_OUTPUT"
    count=$((count + 1))
  else
    echo "WARNING: Candidate screenshot for $BASENAME not found at $CANDIDATE"
  fi
done

if [ "$count" -eq 0 ]; then
  echo "No baseline screenshots found in $BASELINE_DIR to compare."
fi

echo "Comparison finished."
