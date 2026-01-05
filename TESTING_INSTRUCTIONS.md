# Testing Instructions for Der Clou! TypeScript Port

## Overview

This document provides instructions for testing the TypeScript port of Der Clou!, including the replay system and visual regression testing.

## Prerequisites

### For Local Testing (Desktop)

1. **Node.js** (v18 or later)
2. **npm** (comes with Node.js)
3. **NW.js dependencies** (Linux only):
   ```bash
   # Ubuntu/Debian
   sudo apt-get install libnspr4 libnss3 libatk1.0-0 libatk-bridge2.0-0 \
        libcups2 libdrm2 libxkbcommon0 libxcomposite1 libxdamage1 \
        libxfixes3 libxrandr2 libgbm1 libasound2
   
   # Fedora/RHEL
   sudo dnf install nspr nss atk at-spi2-atk cups-libs libdrm \
        libxkbcommon libXcomposite libXdamage libXfixes libXrandr \
        mesa-libgbm alsa-lib
   ```

### For Web Testing

1. **Modern web browser** (Chrome, Firefox, Edge, Safari)
2. **Local web server** (Vite dev server or any HTTP server)

## Building the Project

```bash
cd src-js
npm install
npm run build
```

This creates a production build in `src-js/dist/`.

## Running the Game

### Normal Mode (Interactive)

```bash
cd src-js
npx nw .
```

This opens the game in a window where you can interact with it normally.

### Replay Mode (Automated)

```bash
cd src-js
npx nw . --replay-path=../gamedata/test_long.rec \
         --screenshot-path=./test_screenshots \
         --headless
```

**Parameters:**
- `--replay-path`: Path to the replay file (.rec)
- `--screenshot-path`: Directory to save screenshots
- `--headless`: Run without displaying the window (faster)
- `--simulate-to-tick`: Stop after N ticks (optional)

### Replay Mode with Tick Limit

```bash
cd src-js
npx nw . --replay-path=../gamedata/test_long.rec \
         --screenshot-path=./test_screenshots \
         --headless \
         --simulate-to-tick=1000
```

This runs the replay for 1000 ticks and then exits.

## Visual Regression Testing

The visual regression test compares screenshots from the TypeScript port against baseline screenshots from the C version.

### Running the Visual Regression Test

```bash
./tools/compare_screenshots.sh \
    ./gamedata/test_long.rec \
    ./test_screenshots \
    1000
```

**Parameters:**
1. Path to replay file
2. Output directory for new screenshots
3. Number of ticks to simulate (optional)

### What It Does

1. Builds the TypeScript version
2. Runs the game in headless mode with the replay file
3. Captures screenshots at each input event
4. Compares screenshots with baseline images in `screenshots/1/`
5. Generates diff images showing differences

### Interpreting Results

The script uses `odiff-bin` to compare images:
- **0 differences**: Images are identical ✅
- **Small differences**: Minor rendering differences (fonts, anti-aliasing)
- **Large differences**: Significant visual bugs ❌

Diff images are saved as `diff_screenshot_NNNN.png` in the current directory.

## Replay File Format

Replay files (`.rec`) contain:

### Header (12 bytes)
```
Offset | Size | Type   | Description
-------|------|--------|-------------
0      | 4    | char[] | Magic: "DREC"
4      | 4    | uint32 | Version: 1
8      | 4    | uint32 | RNG Seed
```

### Records (16 bytes each)
```
Offset | Size | Type   | Description
-------|------|--------|-------------
0      | 8    | uint64 | Tick number
8      | 4    | int32  | Action bitmask
12     | 4    | uint32 | RNG checksum
```

### Action Bitmask

```typescript
INP_UP          = 1 << 0   // Arrow up
INP_DOWN        = 1 << 1   // Arrow down
INP_LEFT        = 1 << 2   // Arrow left
INP_RIGHT       = 1 << 3   // Arrow right
INP_ESC         = 1 << 4   // Escape key
INP_LBUTTONP    = 1 << 5   // Left mouse button pressed
INP_LBUTTONR    = 1 << 6   // Left mouse button released
INP_RBUTTONP    = 1 << 7   // Right mouse button pressed
INP_RBUTTONR    = 1 << 8   // Right mouse button released
INP_TIME        = 1 << 11  // Time tick (no input)
INP_KEYBOARD    = 1 << 12  // Keyboard input
INP_SPACE       = 1 << 14  // Space key
INP_MOUSE       = 1 << 15  // Mouse movement
```

## Deterministic Random Number Generator

The replay system uses a deterministic RNG to ensure reproducibility:

```typescript
// Linear Congruential Generator (LCG)
// Same algorithm as C version
seed = (seed * 1103515245 + 12345) & 0x7fffffff;
```

### RNG Checksum Verification

At each input event, the RNG checksum is verified:
- If checksums match: Replay is valid ✅
- If checksums differ: Replay diverged ❌

This ensures the TypeScript port behaves identically to the C version.

## Development Mode

For development with hot reload:

```bash
cd src-js
npm run dev
```

This starts a Vite dev server at `http://localhost:5173/`.

## Debugging

### Enable Verbose Logging

The game logs replay events to the console:

```
[Replay] Tick 82: INP_TIME
[Replay] Tick 142: INP_LBUTTONP
[Replay] Tick 143: INP_LBUTTONR
```

### Check RNG Checksums

If replay diverges, check the console for checksum mismatches:

```
RNG checksum mismatch at tick 500: expected 12345, got 67890
```

### Screenshot Debugging

Screenshots are numbered sequentially:
- `screenshot_0001.png` - First input event
- `screenshot_0002.png` - Second input event
- etc.

Compare these with baseline screenshots to identify visual bugs.

## Common Issues

### NW.js Won't Start

**Problem:** Missing shared libraries on Linux

**Solution:** Install NW.js dependencies (see Prerequisites)

### Replay Diverges

**Problem:** RNG checksum mismatch

**Possible causes:**
1. Different RNG implementation
2. Non-deterministic code (Date.now(), Math.random(), etc.)
3. Floating-point precision differences

**Solution:** Review code for non-deterministic behavior

### Screenshots Don't Match

**Problem:** Visual differences between C and TypeScript versions

**Possible causes:**
1. Different fonts or font rendering
2. Different image formats or compression
3. Missing graphics assets
4. UI layout differences

**Solution:** Review rendering code and assets

### Headless Mode Doesn't Work

**Problem:** NW.js requires a display even in headless mode

**Solution:** Use Xvfb (virtual framebuffer):

```bash
xvfb-run -a npx nw . --replay-path=... --headless
```

## Performance

### Expected Performance

- **Normal mode**: 60 FPS (16.67ms per frame)
- **Replay mode**: Limited by disk I/O for screenshots
- **Headless mode**: Faster (no rendering overhead)

### Profiling

Use browser DevTools to profile performance:

1. Open DevTools (F12)
2. Go to Performance tab
3. Record a session
4. Look for slow functions

## Continuous Integration

### GitHub Actions Example

```yaml
name: Visual Regression Test

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      
      - name: Install dependencies
        run: |
          sudo apt-get update
          sudo apt-get install -y libnspr4 libnss3 xvfb
          cd src-js && npm install
      
      - name: Build
        run: cd src-js && npm run build
      
      - name: Run visual regression test
        run: |
          xvfb-run -a ./tools/compare_screenshots.sh \
            ./gamedata/test_long.rec \
            ./test_screenshots \
            1000
      
      - name: Upload screenshots
        uses: actions/upload-artifact@v2
        with:
          name: screenshots
          path: test_screenshots/
      
      - name: Upload diffs
        uses: actions/upload-artifact@v2
        with:
          name: diffs
          path: diff_*.png
```

## Next Steps

1. **Port more game systems**: Currently only basic scenes are implemented
2. **Add more replay files**: Test different game scenarios
3. **Improve visual fidelity**: Match C version rendering exactly
4. **Add unit tests**: Test individual systems in isolation
5. **Add integration tests**: Test system interactions

## Resources

- **C Source**: `src/` directory
- **TypeScript Source**: `src-js/src/` directory
- **Documentation**: `docs/` directory
- **Replay Files**: `gamedata/*.rec`
- **Baseline Screenshots**: `screenshots/1/`

## Support

For issues or questions:
1. Check the documentation in `docs/`
2. Review the C source code for reference
3. Check console logs for errors
4. Compare with baseline screenshots

## License

See `PublicLicenceContract.txt` for license information.
