# Der Clou! TypeScript Port - Current Status

**Last Updated:** 2026-01-05 (Session 7)

## Overview

Porting Der Clou! from C to TypeScript/Phaser. The project has a working foundation with replay system, core architecture, and complete data/text/image systems.

## Current Phase: Phase 3 - Scene and Story System (In Progress)

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

9. **Foundation Systems** - Complete ✅
   - Database relation queries (hasAll, knowsAll, livesIn)
   - FilmService for story state
   - GameConstants for key IDs
   - SceneService for scene management

10. **Scene System** - Complete ✅
   - SceneService with core functions
   - go() - Location navigation with menu
   - information() - Info menu for possessions
   - look() - Examine location and people
   - wait() - Time progression system
   - Taxi location management
   - SceneTestScene for testing

11. **Story System** - In Progress 🚧
   - StoryService with handler system
   - Scene constants (SCENE_*)
   - Player money management
   - Environment state management
   - Story handlers ported:
     - tcDoneArrival (game opening)
     - tcDoneHotelReception (hotel room)
     - tcDoneCredits (receive money)
     - tcDoneMamiCalls (phone call)
     - tcDoneGludoMoney (get money from Gludo)
     - tcDoneDanner (get money from Danner)
   - ⚠️ More story handlers needed
   - ⚠️ Environment needs database integration

12. **Test Scenes**
   - ReplayTestScene (original)
   - DataLoaderTestScene
   - TextTestScene
   - UITestScene
   - ImageTestScene
   - LivingTestScene
   - DialogTestScene
   - SceneTestScene
   - GameScene, MainMenuScene, LondonScene

### What Needs Work 🚧

1. **Replay System Integration** - NEEDS ATTENTION
   - ⚠️ Screenshot generation not working in headless mode
   - ⚠️ Visual regression testing blocked
   - ⚠️ Need to debug NW.js screenshot capture

2. **Story System** (src/story/) - IN PROGRESS
   - ✅ SceneService with core functions complete
   - ✅ StoryService with handler system
   - ✅ Scene constants (SCENE_*)
   - ✅ 6 story handlers ported
   - ⚠️ Need more story handlers (30+ remaining)
   - ⚠️ Environment needs database integration
   - See SCENE_STORY_ANALYSIS.md for details

3. **Story Handlers** (src/story/)
   - Port tcDone* functions (story scene handlers)
   - Scene constants (SCENE_*)
   - Story progression logic
   - Event triggers

4. **Interaction System** (src/present/interac.c)
   - Action menu (Go, Talk, Look, Wait, Think)
   - Player interactions
   - Scene integration

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
│   ├── DialogService.ts     ✅ Dialog system
│   ├── FilmService.ts       ✅ Story state
│   ├── SceneService.ts      ✅ Scene functions
│   ├── StoryService.ts      🚧 Story handlers
│   └── PresentationService.ts ✅ Object display
└── scenes/
    ├── ReplayTestScene.ts   ✅ Replay testing
    ├── DataLoaderTestScene.ts ✅ Data loading test
    ├── TextTestScene.ts     ✅ Text system test
    ├── UITestScene.ts       ✅ UI system test
    ├── LivingTestScene.ts   ✅ Living system test
    ├── DialogTestScene.ts   ✅ Dialog system test
    ├── SceneTestScene.ts    ✅ Scene system test
    ├── GameScene.ts         ✅ Main scene
    ├── MainMenuScene.ts     ✅ Menu
    └── LondonScene.ts       ✅ Hub scene
```

## Next Steps (Priority Order)

### Immediate (This Session)
1. ✅ Create comprehensive porting plan
2. ✅ Complete Phase 1: Living/Location System
3. ✅ Complete Phase 2: Dialog System
4. ✅ Start Phase 3: Scene/Story System
5. ✅ Port SceneService (Go, Information, Look, Wait)
6. ✅ Create SceneTestScene
7. ✅ Port StoryService with 6 story handlers
8. ✅ Add scene constants
9. ⚠️ Port more story handlers
10. ⚠️ Port interaction system
11. ⚠️ Fix replay system screenshot generation

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

- 43 TypeScript files, ~8900 lines of code
- 72 C source files to port (~35k lines)
- TCMAIN.DAT and TCBUILD.DAT are main data files
- Building-specific files: *ETA0.DAT, *ETA1.DAT, etc.
- Relations in .REL files (text format)
- Text files in gamedata/TEXTS/ (XOR encrypted with 0x75)
- Images in gamedata/PICTURES/ (IFF ILBM format, loaded directly)
- ILBM decoder successfully ported from C
- UI system ready for integration with game scenes
