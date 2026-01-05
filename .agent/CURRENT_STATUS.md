# Der Clou! TypeScript Port - Current Status

**Last Updated:** 2026-01-05

## Overview

Porting Der Clou! from C to TypeScript/Phaser. The project has a working foundation with replay system, core architecture, and partial data loading.

## Current Phase: Data Loading & Core Systems

### What Works ✅

1. **Replay System** - Fully functional
   - Binary replay file loading
   - Deterministic RNG with checksums
   - Screenshot capture and comparison
   - Visual regression testing via `tools/compare_screenshots.sh`

2. **Core Architecture**
   - Type system (GameTypes.ts, SceneTypes.ts)
   - Database (object storage, relations)
   - Game state management
   - Scene manager
   - Basic renderer
   - Game engine integration

3. **Data Loading** (Partial)
   - BinaryReader with endianness support
   - DatFileParser (Person, Player, Car, Building, Tool)
   - RelFileParser (text-based relations)
   - DataLoader service
   - DataLoaderTestScene for testing

4. **Test Scenes**
   - ReplayTestScene (original)
   - DataLoaderTestScene (new)
   - GameScene, MainMenuScene, LondonScene

### What Needs Work 🚧

1. **Complete Data Loading**
   - Add parsers for remaining object types (Loot, Evidence, Environment, LSArea, LSObject, Ability, LSLock, LSPower, LSAlarm, Lso, CompleteLoot, Scene, Timer, Item, Location, London, Police, LSRoom)
   - Load object names from text files (OBJECTS.TXT)
   - Verify data integrity against C version
   - Load all building-specific .DAT/.REL files

2. **Text System**
   - Load text files from gamedata/TEXTS/
   - Multi-language support
   - Text rendering with formatting

3. **Graphics System**
   - Load images from gamedata/PICTURES/
   - Convert to web-compatible formats
   - Sprite management
   - Background rendering

4. **Dialog System**
   - Conversation trees
   - NPC interactions
   - Choice menus

5. **Gameplay Systems**
   - Planning mechanics
   - Burglary system
   - Character progression
   - Inventory management

## File Structure

```
src-js/src/game/
├── core/
│   ├── Database.ts          ✅ Object storage
│   ├── GameState.ts         ✅ State management
│   ├── SceneManager.ts      ✅ Scene lifecycle
│   ├── Renderer.ts          ✅ Basic rendering
│   └── GameEngine.ts        ✅ Main engine
├── types/
│   ├── GameTypes.ts         ✅ Core types
│   └── SceneTypes.ts        ✅ Scene types
├── services/
│   ├── ReplayService.ts     ✅ Replay handling
│   ├── InputHandler.ts      ✅ Input simulation
│   ├── Random.ts            ✅ Deterministic RNG
│   ├── ScreenshotService.ts ✅ Screenshots
│   ├── BinaryReader.ts      ✅ Binary file reading
│   ├── DatFileParser.ts     🚧 Partial (5 of ~20 types)
│   ├── RelFileParser.ts     ✅ Relation parsing
│   └── DataLoader.ts        🚧 Partial (TCMAIN/TCBUILD only)
└── scenes/
    ├── ReplayTestScene.ts   ✅ Replay testing
    ├── DataLoaderTestScene.ts ✅ Data loading test
    ├── GameScene.ts         ✅ Main scene
    ├── MainMenuScene.ts     ✅ Menu
    └── LondonScene.ts       ✅ Hub scene
```

## Next Steps (Priority Order)

### Immediate (This Session)
1. ✅ Organize documentation in .agent/
2. Test current data loading implementation
3. Add parsers for remaining object types
4. Load building-specific data files
5. Verify loaded data matches C version

### Short-term (Next Few Sessions)
1. Complete data loading system
2. Load text files and implement text system
3. Load and display images
4. Implement basic UI with real game data

### Medium-term
1. Port dialog system
2. Implement London hub navigation
3. Add character interactions
4. Port planning system

### Long-term
1. Complete burglary mechanics
2. Story progression
3. Save/load system
4. Polish and optimization

## Testing Strategy

### Replay Testing (Primary)
```bash
cd src-js
npm run build
npx nw . --replay-path=../gamedata/test_long.rec --screenshot-path=./test --headless
```

### Visual Regression
```bash
./tools/compare_screenshots.sh ./gamedata/test_long.rec ./test_screenshots 1000
```

### Manual Testing
```bash
cd src-js
npm run dev
# Opens in browser, DataLoaderTestScene starts automatically
```

## Key Constraints

1. **Replay System is Sacred** - Do not break it. All changes must maintain deterministic behavior.
2. **80/20 Rule** - 80% porting, 20% testing
3. **Commit After Every File Edit** - Keep git history clean
4. **No Audio** - Audio systems excluded by design
5. **Web Target** - Optimize for browsers, not native desktop

## Resources

- C source: `src/`
- Game data: `gamedata/DATA/`
- Screenshots: `screenshots/1/` (baseline)
- Documentation: `.agent/` and root docs
- TypeScript: `src-js/src/game/`

## Notes

- 27 TypeScript files, ~3070 lines of code
- 131 C source files to port
- TCMAIN.DAT and TCBUILD.DAT are main data files
- Building-specific files: *ETA0.DAT, *ETA1.DAT, etc.
- Relations in .REL files (text format)
