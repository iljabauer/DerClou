# Der Clou! TypeScript Port - Status

## Overview
This document tracks the progress of porting Der Clou! from C to TypeScript.

## Current Status: Phase 1 (Data Loading) In Progress 🚧

### Completed Components

#### Phase 1: Data Loading (Partial) 🚧
- ✅ **Binary File Reader** (`src-js/src/game/services/BinaryReader.ts`)
  - Read binary files with endianness support
  - Matches C implementation (dskRead/EndianW/EndianL)
  
- ✅ **DAT File Parser** (`src-js/src/game/services/DatFileParser.ts`)
  - Parse .dat files (game object database)
  - Support for Person, Player, Car, Building, Tool objects
  - Extensible for additional object types
  
- ✅ **REL File Parser** (`src-js/src/game/services/RelFileParser.ts`)
  - Parse .rel files (object relations)
  - Text-based format (RELF/RTAB markers)
  
- ✅ **Data Loader Service** (`src-js/src/game/services/DataLoader.ts`)
  - Load TCMAIN.DAT and TCBUILD.DAT
  - Load TCMAIN.REL and TCBUILD.REL
  - Populate database with objects and relations
  
- ✅ **Data Loader Test Scene** (`src-js/src/game/scenes/DataLoaderTestScene.ts`)
  - Interactive testing of data loading
  - Display statistics and sample objects

#### Core Systems
- ✅ **Type System** (`src-js/src/game/types/`)
  - GameTypes.ts: Core game object types (Person, Player, Car, Building, Tool, etc.)
  - SceneTypes.ts: Scene management types
  
- ✅ **Database System** (`src-js/src/game/core/Database.ts`)
  - Object storage and retrieval
  - Relation management (has, knows, livesIn, etc.)
  - Type-based queries
  
- ✅ **Game State** (`src-js/src/game/core/GameState.ts`)
  - Global state management
  - Time tracking (day/hour/minute)
  - Flags and variables
  - Serialization support
  
- ✅ **Scene Manager** (`src-js/src/game/core/SceneManager.ts`)
  - Scene registration and lifecycle
  - Scene transitions
  - Based on C's PlayStory() logic
  
- ✅ **Renderer** (`src-js/src/game/core/Renderer.ts`)
  - Text rendering
  - Basic shapes (rectangles, outlines)
  - Button/menu system
  - Image support
  
- ✅ **Game Engine** (`src-js/src/game/core/GameEngine.ts`)
  - Integrates all systems
  - Replay support
  - Screenshot capture
  - Tick-based simulation

#### Replay System
- ✅ **ReplayService** - Binary replay file loading
- ✅ **InputHandler** - Deterministic input simulation
- ✅ **Random** - Deterministic RNG with checksum
- ✅ **ScreenshotService** - Screenshot capture and comparison
- ✅ **Integration** - Full replay support in game engine

#### Game Scenes
- ✅ **GameScene** - Main Phaser scene integrating all systems
- ✅ **MainMenuScene** - Main menu with game options
- ✅ **LondonScene** - London hub with navigation menu
- ✅ **ReplayTestScene** - Original replay testing scene (preserved)

#### Test Infrastructure
- ✅ **Visual Regression Testing** - compare_screenshots.sh script
- ✅ **Screenshot Comparison** - Automated baseline comparison
- ✅ **Headless Mode** - CI/CD support

### Architecture

```
src-js/src/game/
├── core/
│   ├── Database.ts       # Object and relation storage
│   ├── GameState.ts      # Global game state
│   ├── SceneManager.ts   # Scene lifecycle management
│   ├── Renderer.ts       # UI rendering
│   └── GameEngine.ts     # Main engine integration
├── types/
│   ├── GameTypes.ts      # Core data types
│   └── SceneTypes.ts     # Scene types
├── services/
│   ├── ReplayService.ts  # Replay file handling
│   ├── InputHandler.ts   # Input simulation
│   ├── Random.ts         # Deterministic RNG
│   └── ScreenshotService.ts
└── scenes/
    ├── GameScene.ts      # Main Phaser scene
    ├── MainMenuScene.ts  # Main menu
    ├── LondonScene.ts    # London hub
    └── ReplayTestScene.ts # Original replay test
```

## What's NOT Ported Yet

### Phase 1: Data Loading (Remaining)
- ⚠️ **Object Name Loading** - Need to load object names from text files
- ⚠️ **Additional Object Types** - Need parsers for remaining object types:
  - Loot, Evidence, Environment, LSArea, LSObject, Ability
  - LSLock, LSPower, LSAlarm, Lso, CompleteLoot
  - Scene, Timer, Item, Location, London, Police, LSRoom
- ⚠️ **Data Validation** - Verify loaded data matches C version

### Major Systems
- ❌ **Graphics System** (gfx.c, display.c)
  - Sprite/image management
  - Palette handling
  - Background rendering
  
- ❌ **Animation System** (anim/sysanim.c)
  - Frame-based animations
  - IFF ANIM decoder
  
- ❌ **Text System** (text/text.c)
  - Multi-language support
  - Text file loading
  - Text rendering with formatting
  
- ❌ **Dialog System** (dialog/dialog.c, talkappl.c)
  - Conversation trees
  - NPC interactions
  - Choice menus
  
- ❌ **Gameplay Systems**
  - Planning system (plan/)
  - Burglary mechanics (planing/)
  - Car system (cars.c)
  - Evidence/guards (evidence.c, guards.c)
  - Dealer/business (dealer.c)
  
- ❌ **Story System** (story/)
  - Story progression
  - Scene graph
  - Conditions and triggers
  
- ❌ **Data Loading**
  - Binary .dat file parsing
  - Relation file loading
  - Asset loading
  
- ❌ **Audio** (excluded by design)
  - Sound effects
  - Music
  - Voice

### File Formats
- ❌ Binary data files (.dat)
- ❌ Relation files (.rel)
- ❌ Location files (.loc)
- ❌ Text files (multi-language)
- ❌ Image files (need conversion to web formats)

## Next Steps

### Phase 1: Data Loading (High Priority)
1. Create data file parsers for .dat files
2. Load game objects from binary format
3. Load relations
4. Load text files
5. Convert/load images

### Phase 2: Core Gameplay (High Priority)
1. Port text rendering system
2. Port dialog system
3. Implement London hub scene
4. Implement basic navigation

### Phase 3: Game Mechanics (Medium Priority)
1. Planning system
2. Burglary mechanics
3. Character interactions
4. Inventory management

### Phase 4: Story & Polish (Lower Priority)
1. Story progression system
2. Scene transitions
3. Save/load system
4. UI polish

## Testing

### Running Tests
```bash
cd src-js
npm run build
npx nw . --replay-path=../gamedata/test_long.rec --screenshot-path=./test_screenshots --headless
```

### Visual Regression
```bash
./tools/compare_screenshots.sh ./gamedata/test_long.rec ./test_screenshots 1000
```

## Notes

- **No Audio**: Audio systems are intentionally excluded from the port
- **No Animations**: Animation systems are excluded for now
- **Replay First**: The replay system is fully functional and should be maintained
- **Incremental**: This is designed for incremental development
- **Web Target**: Optimized for web browsers, not native desktop

## Contributing

When porting new systems:
1. Create types in `types/` first
2. Implement core logic in `core/`
3. Add scene integration in `scenes/`
4. Test with replay system
5. Update this document

## References

- Original C code: `src/`
- Documentation: `docs/`
- Screenshots: `screenshots/1/` (baseline for visual regression)
