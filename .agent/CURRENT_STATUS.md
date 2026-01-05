# Der Clou! TypeScript Port - Current Status

**Last Updated:** 2026-01-05 (Session 5)

## Overview

Porting Der Clou! from C to TypeScript/Phaser. The project has a working foundation with replay system, core architecture, and complete data/text/image systems.

## Current Phase: Dialog System Complete - Moving to Phase 3

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

3. **Data Loading** - Complete ✅
   - BinaryReader with endianness support
   - DatFileParser with ALL object types:
     - Person, Player, Car, Building, Tool
     - Loot, Evidence, Environment
     - Location, Ability, Item, London
     - CompleteLoot, LSLock, LSObject, LSRoom
     - Police, LSArea
   - RelFileParser (text-based relations)
   - DataLoader service
   - Loads TCMAIN.DAT, TCBUILD.DAT
   - Loads all building-specific files (*ETA*.DAT)
   - DataLoaderTestScene for testing

4. **Text System** - Complete ✅
   - TextService with XOR decryption (0x75)
   - Multi-language support (English, German, French, Spanish)
   - Key-based text lookup
   - Line extraction and formatting
   - Parameter substitution (sprintf-like)
   - TextTestScene for testing

5. **Image System** - Complete ✅
   - ImageService structure
   - Collection list loading (COLL.LST)
   - ILBM decoder (ILBMDecoder.ts)
   - Direct loading of Amiga IFF ILBM images
   - Canvas drawing support
   - ImageTestScene for testing

6. **UI System** - Complete ✅
   - UIService with menu and bubble support
   - Keyboard navigation (arrow keys, Enter, Escape)
   - Mouse navigation (hover, click)
   - Selection highlighting
   - Timeout support
   - Disabled item handling
   - UITestScene for testing

7. **Living/Location System** - Complete ✅
   - LivingService for character management
   - Character positioning and animation
   - Visibility and area tracking
   - BackgroundService for location backgrounds
   - Background display and management
   - Animation template loading from TEMPLATE.LST
   - Character data loading from LIVINGS.LST
   - ALLMAXI sprite sheet loading and rendering
   - Frame-based animation with proper cropping
   - LivingTestScene for testing

8. **Dialog System** - Complete ✅
   - DialogService for conversations
   - Say() function for dialog display
   - Bubble() and Think() helpers
   - Text file integration (BUSINESS_TXT, TALK_0_TXT, TALK_1_TXT)
   - DynamicTalk() with full conversation system
   - ParseTalkText() for keyword extraction
   - PrepareQuestions() for question generation
   - Knowledge tracking (knows/knowsSet)
   - Dialog tree navigation
   - Standard question handlers (job, prison, ability)
   - DialogTestScene for testing
   - ⚠️ Talk() requires location system
   - ⚠️ Character portrait display (future)

9. **Test Scenes**
   - ReplayTestScene (original)
   - DataLoaderTestScene
   - TextTestScene
   - UITestScene
   - ImageTestScene
   - LivingTestScene
   - DialogTestScene (new)
   - GameScene, MainMenuScene, LondonScene

### What Needs Work 🚧

1. **Replay System Integration** - NEEDS ATTENTION
   - ⚠️ Screenshot generation not working in headless mode
   - ⚠️ Visual regression testing blocked
   - ⚠️ Need to debug NW.js screenshot capture

2. **Location System** (src/present/) - NEXT PRIORITY
   - ⚠️ GetLocation() - Get current location
   - ⚠️ hasAll() - Get all persons at location
   - ⚠️ PersonWorksHere() - Check if person works at location
   - ⚠️ Required for Talk() function completion

3. **Data Verification**
   - Load object names from text files (OBJECTS.TXT)
   - Verify data integrity against C version

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
│   ├── DatFileParser.ts     ✅ All 18 object types
│   ├── RelFileParser.ts     ✅ Relation parsing
│   ├── DataLoader.ts        ✅ All data files
│   ├── TextService.ts       ✅ Text loading & lookup
│   ├── ImageService.ts      ✅ Image loading (ILBM)
│   ├── UIService.ts         ✅ Menus & bubbles
│   ├── LivingService.ts     ✅ Character management
│   ├── BackgroundService.ts ✅ Background display
│   └── DialogService.ts     🚧 Dialog system
└── scenes/
    ├── ReplayTestScene.ts   ✅ Replay testing
    ├── DataLoaderTestScene.ts ✅ Data loading test
    ├── TextTestScene.ts     ✅ Text system test
    ├── UITestScene.ts       ✅ UI system test
    ├── LivingTestScene.ts   ✅ Living system test
    ├── DialogTestScene.ts   ✅ Dialog system test
    ├── GameScene.ts         ✅ Main scene
    ├── MainMenuScene.ts     ✅ Menu
    └── LondonScene.ts       ✅ Hub scene
```

## Next Steps (Priority Order)

### Immediate (This Session)
1. ✅ Create comprehensive porting plan
2. ✅ Complete Phase 1: Living/Location System
3. ✅ Port LivingService (character management)
4. ✅ Port BackgroundService (location backgrounds)
5. ✅ Create LivingTestScene
6. ✅ Load animation templates from TEMPLATE.LST
7. ✅ Load character sprites from ALLMAXI
8. ✅ Implement frame-based animation system
9. ✅ Start Phase 2: Dialog System
10. ✅ Port Say() function
11. ✅ Create DialogService
12. ✅ Create DialogTestScene
13. ⚠️ Fix replay system screenshot generation
14. ⚠️ Complete DynamicTalk() implementation

### Short-term (Next 2-3 Sessions)
1. Complete Living/Location System
2. Port Dialog System (conversations, NPCs)
3. Port Scene/Story System (game flow)
4. Port Interaction System (action menu)

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

- 40 TypeScript files, ~7400 lines of code
- 72 C source files to port (~35k lines)
- TCMAIN.DAT and TCBUILD.DAT are main data files
- Building-specific files: *ETA0.DAT, *ETA1.DAT, etc.
- Relations in .REL files (text format)
- Text files in gamedata/TEXTS/ (XOR encrypted with 0x75)
- Images in gamedata/PICTURES/ (IFF ILBM format, loaded directly)
- ILBM decoder successfully ported from C
- UI system ready for integration with game scenes
