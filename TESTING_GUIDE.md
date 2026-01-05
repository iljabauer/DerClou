# Testing Guide for TypeScript Port

## Prerequisites

Ensure you have Node.js and npm installed:
```bash
node --version  # Should be v18 or higher
npm --version
```

## Building the Project

```bash
cd src-js
npm install  # Install dependencies (first time only)
npm run build
```

## Running in Development Mode

```bash
cd src-js
npm run dev
```

Then open your browser to the URL shown (typically http://localhost:5173)

## Testing with Replay

### Using NW.js (Headless Mode)

```bash
cd src-js
npm run build

# Run with replay
npx nw . \
  --replay-path=../gamedata/test_long.rec \
  --screenshot-path=./test_screenshots \
  --headless
```

### Visual Regression Testing

The project includes a script for automated visual regression testing:

```bash
# From repository root
./tools/compare_screenshots.sh \
  ./gamedata/test_long.rec \
  ./test_screenshots \
  1000
```

This will:
1. Build the web client
2. Run the replay in headless mode
3. Capture screenshots at each input event
4. Compare them with baseline screenshots in `screenshots/1/`
5. Generate diff images for any mismatches

### Simulate to Specific Tick

To test up to a specific tick number:

```bash
npx nw . \
  --replay-path=../gamedata/test_long.rec \
  --screenshot-path=./test_screenshots \
  --simulate-to-tick=500 \
  --headless
```

## Testing the New Game Engine

### Test Scene

The `TestGameScene` demonstrates the new architecture:

1. **Replay Mode**: Automatically loads and plays replay files
2. **Normal Mode**: Interactive menu system
3. **Scene Transitions**: Switch between MainMenu and London scenes
4. **State Management**: Displays current tick, time, and game state

### Manual Testing

1. Build the project: `npm run build`
2. Run with NW.js: `npx nw .`
3. Without replay arguments, it will start in normal mode
4. Click menu items to test scene transitions

### Replay Testing

1. Build the project
2. Run with replay file:
   ```bash
   npx nw . --replay-path=../gamedata/test_long.rec
   ```
3. The game will automatically play through the replay
4. Press Play/Pause to control playback (in ReplayTestScene)

## Debugging

### Console Logs

The game engine logs important events:
- Scene transitions
- Replay actions
- RNG checksum mismatches
- Screenshot captures

Open the browser/NW.js console to see these logs.

### TypeScript Compilation Errors

If you encounter TypeScript errors:

```bash
cd src-js
npx tsc --noEmit
```

This will show all type errors without building.

## Current Limitations

### What Works
- ✅ Replay system (loading, playback, RNG verification)
- ✅ Screenshot capture
- ✅ Scene management
- ✅ Basic rendering (text, shapes, buttons)
- ✅ Game state management
- ✅ Database system (objects and relations)

### What Doesn't Work Yet
- ❌ Actual game content (no data files loaded)
- ❌ Graphics/sprites (no image loading)
- ❌ Dialogs (not ported)
- ❌ Planning/burglary mechanics (not ported)
- ❌ Story progression (not ported)

## Expected Test Results

### With Replay File

When running with a replay file, you should see:
1. Console logs showing tick progression
2. Action descriptions (e.g., "LBTN_P", "MOUSE", "ESC")
3. RNG checksum verification
4. Screenshot captures at each action
5. Automatic exit when replay completes

### Visual Regression

The visual regression test will likely show differences because:
1. The C version renders actual game graphics
2. The TypeScript version currently shows placeholder UI
3. This is expected until game content is ported

To establish new baselines:
```bash
# Capture new screenshots
npx nw . --replay-path=../gamedata/test_long.rec \
  --screenshot-path=./new_baseline --headless

# Replace old baseline
rm -rf screenshots/1/*
cp ./new_baseline/* screenshots/1/
```

## Troubleshooting

### "Failed to load replay"
- Check that the replay path is correct
- Ensure the .rec file exists
- Verify file permissions

### "Screenshot path not provided"
- Add `--screenshot-path=./screenshots` argument
- Ensure the directory exists or can be created

### NW.js not found
```bash
cd src-js
npm install  # This installs nw as a dev dependency
```

### Build fails
```bash
cd src-js
rm -rf node_modules package-lock.json
npm install
npm run build
```

## Next Steps for Testing

As more game systems are ported:

1. **Add Test Scenes**: Create scenes for each major system
2. **Create Test Data**: Generate test objects in the database
3. **Record New Replays**: Use the C version to record test scenarios
4. **Update Baselines**: Capture new screenshot baselines as features are added

## Performance Testing

To measure performance:

```javascript
// In TestGameScene.update()
const start = performance.now();
this.engine.update(delta);
const elapsed = performance.now() - start;
if (elapsed > 16) {
  console.warn(`Slow frame: ${elapsed.toFixed(2)}ms`);
}
```

Target: 60 FPS (16.67ms per frame)
