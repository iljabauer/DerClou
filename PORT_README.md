# Der Clou! TypeScript Port

## Overview

This is a TypeScript/Phaser port of the classic game "Der Clou!" (The Clue!), originally written in C with SDL2. The port maintains the original game logic while providing a modern web-based implementation.

## Key Features

✅ **Replay System**: Full support for deterministic replay files  
✅ **Visual Regression Testing**: Automated screenshot comparison  
✅ **Modern Architecture**: Clean, modular TypeScript codebase  
✅ **Cross-Platform**: Runs in browsers and as desktop app (NW.js)  
✅ **Deterministic**: Identical behavior to C version  

## Project Structure

```
src-js/
├── src/
│   ├── game/
│   │   ├── core/              # Core game systems
│   │   │   ├── Database.ts         # Object storage & relations
│   │   │   ├── GameState.ts        # Global game state
│   │   │   ├── SceneManager.ts     # Scene lifecycle
│   │   │   ├── Renderer.ts         # UI rendering
│   │   │   └── GameEngine.ts       # Main engine
│   │   ├── types/             # TypeScript definitions
│   │   │   ├── GameTypes.ts        # Game objects
│   │   │   └── SceneTypes.ts       # Scene types
│   │   ├── services/          # Utility services
│   │   │   ├── ReplayService.ts    # Replay file handling
│   │   │   ├── InputHandler.ts     # Input simulation
│   │   │   ├── Random.ts           # Deterministic RNG
│   │   │   └── ScreenshotService.ts
│   │   └── scenes/            # Game scenes
│   │       ├── GameScene.ts        # Main Phaser scene
│   │       ├── MainMenuScene.ts    # Main menu
│   │       ├── LondonScene.ts      # London hub
│   │       └── ReplayTestScene.ts  # Replay testing
│   └── main.ts                # Entry point
├── public/                    # Static assets
├── dist/                      # Build output
└── package.json
```

## Quick Start

### Installation

```bash
cd src-js
npm install
```

### Development

```bash
npm run dev
```

Opens development server at `http://localhost:5173/`

### Production Build

```bash
npm run build
```

Creates optimized build in `dist/`

### Run as Desktop App

```bash
npx nw .
```

### Run with Replay

```bash
npx nw . --replay-path=../gamedata/test_long.rec \
         --screenshot-path=./test_screenshots \
         --headless
```

## Architecture

### Core Systems

#### Database (`core/Database.ts`)

Manages game objects and their relationships:

```typescript
// Add object
const playerId = db.addObject(player);

// Add relation
db.addRelation(playerId, toolId, RelationType.Has);

// Query relations
const tools = db.getRelatedObjects(playerId, RelationType.Has);
```

#### Game State (`core/GameState.ts`)

Tracks global game state:

```typescript
// Set player
gameState.setPlayerId(playerId);

// Advance time
gameState.advanceTime(60); // 60 minutes

// Get time
const time = gameState.getTime();
console.log(`Day ${time.day}, ${time.hour}:${time.minute}`);
```

#### Scene Manager (`core/SceneManager.ts`)

Handles scene lifecycle:

```typescript
// Register scene
sceneManager.registerScene(myScene);

// Start scene
sceneManager.startScene(SceneId.London);

// Update current scene
sceneManager.update(delta);
```

#### Game Engine (`core/GameEngine.ts`)

Integrates all systems:

```typescript
const engine = new GameEngine(scene);

// Initialize with replay
await engine.init(replayPath, simulateToTick);

// Start game
engine.start(SceneId.MainMenu);

// Update (called every frame)
engine.update(delta);
```

### Replay System

The replay system ensures deterministic behavior:

1. **Recording**: C version records input events to `.rec` file
2. **Playback**: TypeScript version reads and simulates inputs
3. **Verification**: RNG checksums verify identical behavior
4. **Screenshots**: Captured at each input event for comparison

#### Replay File Format

```
Header (12 bytes):
  - Magic: "DREC" (4 bytes)
  - Version: 1 (4 bytes)
  - RNG Seed: uint32 (4 bytes)

Records (16 bytes each):
  - Tick: uint64 (8 bytes)
  - Action: int32 (4 bytes)
  - RNG Checksum: uint32 (4 bytes)
```

#### Deterministic RNG

```typescript
// Linear Congruential Generator (LCG)
// Matches C implementation exactly
function rndNext(): number {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    return seed;
}
```

### Scene System

Scenes are the main game states:

```typescript
export class MyScene implements GameScene {
    id = SceneId.MyScene;
    
    init(): void {
        // Setup scene
    }
    
    update(delta: number): SceneArgs {
        // Update logic
        return { returnValue: null };
    }
    
    done(): void {
        // Cleanup
    }
}
```

## Current Implementation Status

### ✅ Completed

- Core architecture (Database, GameState, SceneManager, Renderer, GameEngine)
- Replay system (loading, playback, verification)
- Screenshot capture and comparison
- Deterministic RNG
- Basic scenes (MainMenu, London)
- Visual regression testing infrastructure

### ⚠️ Partially Implemented

- Scene system (basic structure, needs more scenes)
- UI rendering (text and basic shapes, needs graphics)
- Input handling (replay only, needs interactive input)

### ❌ Not Implemented

- Graphics system (sprites, images, palettes)
- Animation system (frame-based animations)
- Text system (multi-language, text files)
- Dialog system (conversations, choices)
- Planning system (burglary planning)
- Burglary mechanics (actual gameplay)
- Story system (progression, conditions)
- Data loading (binary .dat files)
- Audio (excluded by design)

## Testing

### Unit Tests (Future)

```bash
npm test
```

### Visual Regression Tests

```bash
./tools/compare_screenshots.sh \
    ./gamedata/test_long.rec \
    ./test_screenshots \
    1000
```

See `TESTING_INSTRUCTIONS.md` for detailed testing guide.

## Development Guidelines

### Adding a New Scene

1. Create scene class in `src/game/scenes/`:

```typescript
import { GameScene, SceneArgs, SceneId } from '../types/SceneTypes';

export class MyScene implements GameScene {
    id = SceneId.MyScene;
    
    constructor(private scene: Scene, private engine: GameEngine) {}
    
    init(): void {
        const renderer = this.engine.getRenderer();
        renderer.clear();
        renderer.drawText(512, 100, 'My Scene', {
            fontSize: '32px',
            color: '#ffffff',
        });
    }
    
    update(delta: number): SceneArgs {
        // Handle replay input
        if (this.engine.isReplayMode()) {
            const action = this.engine.getInputHandler().getLastAction();
            if (action !== null) {
                this.handleReplayInput(action);
            }
        }
        
        return { returnValue: null };
    }
    
    done(): void {
        // Cleanup
    }
    
    private handleReplayInput(action: number): void {
        // Process replay input
    }
}
```

2. Add scene ID to `types/SceneTypes.ts`:

```typescript
export enum SceneId {
    // ...
    MyScene = 10,
}
```

3. Register scene in `GameScene.ts`:

```typescript
import { MyScene } from './MyScene';

private registerGameScenes(): void {
    // ...
    const myScene = new MyScene(this, this.engine);
    sceneManager.registerScene(myScene);
}
```

### Maintaining Determinism

**DO:**
- Use the provided RNG (`rndNext()`, `rndRange()`)
- Use game time from `gameState.getTime()`
- Process input from replay service

**DON'T:**
- Use `Math.random()`
- Use `Date.now()` or `new Date()`
- Use `setTimeout()` or `setInterval()`
- Access external APIs
- Use non-deterministic algorithms

### Code Style

- Use TypeScript strict mode
- Follow existing naming conventions
- Add JSDoc comments for public APIs
- Keep functions small and focused
- Prefer composition over inheritance

## Performance

### Target Performance

- **60 FPS** (16.67ms per frame)
- **Minimal memory usage** (object pooling where needed)
- **Fast startup** (\u003c 2 seconds)

### Profiling

Use browser DevTools:

1. Open DevTools (F12)
2. Performance tab
3. Record session
4. Analyze flame graph

### Optimization Tips

- Use object pooling for frequently created objects
- Batch rendering calls
- Lazy load assets
- Use Web Workers for heavy computation
- Minimize garbage collection

## Deployment

### Web Deployment

```bash
npm run build
# Deploy dist/ to any static host
```

Supports:
- GitHub Pages
- Netlify
- Vercel
- AWS S3
- Any static file server

### Desktop Deployment

```bash
# Build for current platform
npm run build
npx nw-builder --mode=build --version=latest --flavor=normal

# Output in build/
```

Supports:
- Windows (x64)
- macOS (x64, arm64)
- Linux (x64)

## Troubleshooting

### Build Errors

```bash
# Clear cache and rebuild
rm -rf node_modules dist
npm install
npm run build
```

### Runtime Errors

Check browser console for errors:
- Press F12 to open DevTools
- Check Console tab
- Look for red error messages

### Replay Divergence

If replay checksums don't match:

1. Check for non-deterministic code
2. Verify RNG implementation matches C version
3. Compare with C version behavior
4. Check for floating-point precision issues

### Visual Differences

If screenshots don't match:

1. Check font rendering
2. Verify image assets
3. Compare UI layout
4. Check color values

## Contributing

### Porting Workflow

1. Choose a C system to port (e.g., `src/dialog/dialog.c`)
2. Create TypeScript types for data structures
3. Implement core logic in `src/game/core/`
4. Create scene integration in `src/game/scenes/`
5. Test with replay files
6. Update documentation

### Testing Workflow

1. Make changes
2. Build: `npm run build`
3. Test manually: `npx nw .`
4. Test with replay: `npx nw . --replay-path=...`
5. Run visual regression: `./tools/compare_screenshots.sh ...`
6. Verify screenshots match

### Documentation

Update these files when making changes:
- `PORT_README.md` - This file
- `PORTING_STATUS.md` - Implementation status
- `TESTING_INSTRUCTIONS.md` - Testing procedures
- Code comments - Inline documentation

## Resources

### Documentation

- `docs/` - Generated documentation
- `PORT_SUMMARY.md` - Executive summary
- `PORTING_STATUS.md` - Detailed status
- `TESTING_INSTRUCTIONS.md` - Testing guide
- `CHECKLIST.md` - Development roadmap

### Source Code

- `src/` - Original C implementation
- `src-js/src/` - TypeScript port
- `tools/` - Build and test scripts

### Assets

- `gamedata/` - Game data files
- `screenshots/1/` - Baseline screenshots
- `public/` - Web assets

## License

See `PublicLicenceContract.txt` for license information.

## Credits

- **Original Game**: neo Software GmbH
- **C Port**: COSP (Clou Open Source Project)
- **TypeScript Port**: [Your name/team]

## Support

For questions or issues:
1. Check documentation in `docs/`
2. Review C source code for reference
3. Check console logs for errors
4. Compare with baseline screenshots
5. Open an issue on GitHub

## Roadmap

See `CHECKLIST.md` for detailed development roadmap.

### Short-term (1-2 weeks)
- [ ] Port data loading system
- [ ] Load game objects from .dat files
- [ ] Display basic game UI

### Medium-term (1-2 months)
- [ ] Port text and dialog systems
- [ ] Implement London hub scene
- [ ] Add character interactions

### Long-term (3-6 months)
- [ ] Port planning system
- [ ] Implement burglary mechanics
- [ ] Complete story progression
- [ ] Polish and optimize

## Acknowledgments

Thanks to:
- neo Software GmbH for the original game
- COSP team for the C port
- Phaser team for the game framework
- All contributors to this project
