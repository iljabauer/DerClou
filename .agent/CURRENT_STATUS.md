# Der Clou! TypeScript Port - Current Status

**Last Updated:** 2026-01-05 (Session 20)

## Overview

Porting Der Clou! from C to TypeScript/Phaser. The project has a working foundation with replay system, core architecture, complete data/text/image systems, story file loading, event tracking, and landscape rendering.

## Current Phase: Phase 6 - Landscape System (In Progress)

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

11. **Story System** - Complete ✅
   - StoryService with handler system
   - Scene constants (SCENE_*)
   - Player money management
   - Environment state management
   - Story handlers ported (43 of 43 - 100%):
     - tcDoneArrival (game opening)
     - tcDoneHotelReception (hotel room)
     - tcDoneCredits (receive money)
     - tcDoneMamiCalls (phone call)
     - tcDoneGludoMoney (get money from Gludo)
     - tcDoneDanner (get money from Danner)
     - tcDoneMeetBriggs (meet Briggs, job offer)
     - tcDoneFreeTicket (meet Dan Stanford)
     - tcDoneCallFromPooly (Pooly calls about ring)
     - tcDoneGludoAsSailor (meet Gludo as sailor)
     - tcDoneCallFromBriggs (Briggs calls)
     - tcDonePrison (prison ending)
     - tcDoneBeautifullMorning (Matt wakes up)
     - tcDoneVisitingSabien (Matt visits Sabien)
     - tcDoneADream (Matt has a dream)
     - tcDoneMissedDate (Matt missed date)
     - tcDoneAfterMeetingBriggs (reflection)
     - tcDoneDealerIsAfraid (dealer scene)
     - tcDoneRaidInWalrus (police raid)
     - tcDoneMattIsArrested (arrest scene)
     - tcDoneGludoBurnsOffice (evidence burning)
     - tcDoneDartJager (prison encounter)
     - tcDoneSabienCall (phone call)
     - tcDoneMeetingAgain (reunion)
     - tcDoneAgent (money offer)
     - tcDoneGoAndFetchJaguar (car fetch)
     - tcDoneThinkOfSabien (thinking)
     - tcDoneSouthhamptonWithoutSabien (Southampton)
     - tcDoneSouthhamptonSabienUnknown (Southampton alt)
     - tcDoneTerror (car explosion)
     - tcDoneConfessingSabien (confession scene)
     - tcDone8thBurglary (8th burglary)
     - tcDone9thBurglary (9th burglary, endgame)
     - tcDone1stBurglary (1st burglary)
     - tcDone2ndBurglary (2nd burglary)
     - tcDone3rdBurglary (3rd burglary)
     - tcDone4thBurglary (4th burglary)
     - tcDone5thBurglary (5th burglary)
     - tcDone6thBurglary (6th burglary)
     - tcDone7thBurglary (7th burglary)
     - tcDoneBirthday (birthday party)
     - tcDoneSouthhampton (Southampton menu scene - stubbed)
     - tcDoneKaserne (Kaserne menu scene - stubbed)
   - Helper methods: time progression, location changes, graphics/animation stubs, moveAPerson, calcRandomNr
   - Database enhancements: removeAllRelationsOfType, addRelationType
   - FilmService enhancements: enabledChoices, setEnabledChoices
   - Action/choice constants: GO, WAIT, BUSINESS_TALK, etc.
   - Person/Car/Tool/Building/Ability constants (100+ IDs)
   - ⚠️ Southampton and Kaserne menu systems need full UI integration
   - ⚠️ Tower burglary initialization and execution need implementation

12. **Interaction System** - Complete ✅
   - InteractionService for main action menu
   - Port of StdDone() and StdHandle() from gp_app.c
   - Action menu with 9 actions:
     - GO: Navigate to other locations ✅ (uses real scene successors)
     - WAIT: Wait and advance time ✅ (implemented via SceneService)
     - BUSINESS_TALK: Talk to people ✅ (implemented via DialogService)
     - LOOK: Examine location ✅ (implemented via SceneService)
     - INVESTIGATE: Building observation ✅ (implemented via InvestigationService)
     - PLAN: Plan burglaries (stubbed - requires planning system)
     - CALL_TAXI: Call a taxi ✅ (implemented)
     - MAKE_CALL: Make phone calls ✅ (tcTelefon implemented)
     - INFO: View information menu ✅ (implemented via SceneService)
   - Integration with UIService, SceneService, DialogService, InvestigationService
   - InteractionTestScene for testing
   - SceneService.go() made async with proper menu integration
   - DialogService.talk() implemented with person selection
   - tcPersonIsHere() implemented for person detection
   - tcTelefon() implemented for phone calls
   - Location opening hours checking
   - Scene successor system integrated ✅
   - ⚠️ PLAN needs planning system (tcOrganisation, tcBurglary)

13. **Story File System** - Complete ✅
   - StoryFileParser for loading TCStory.pc
   - Binary story file format fully implemented
   - StoryHeader parsing (story name, counts, start conditions)
   - Scene loading with all properties
   - Scene conditions (location, events, forbidden events)
   - Standard successors for navigation
   - FilmService integration
   - Scene lookup by event number or location
   - GO action uses real scene successors
   - ✅ InitLocations() implemented (loads location names from LOCATION.LST)
   - ✅ PatchStory() implemented (game-specific scene patches)
   - ✅ Event tracking system implemented (getEventCount, eventDidHappen, checkConditions)
   - ⚠️ LinkScenes() needs implementation (additional scene linking)

13. **Investigation System** - Complete ✅
   - InvestigationService for building observation
   - Port of Investigate() from invest.c
   - 24-hour observation simulation
   - Patrol event display based on guard rate
   - Scheduled event loading from text files
   - Knowledge gain (exactlyness) tracking
   - Suspicion (strike) tracking
   - Time progression during observation
   - Integration with InteractionService
   - Building type updated with all fields from C struct

14. **Landscape System** - Partial ✅
   - LandscapeService with core rendering (NEW in Session 20)
   - Initialization and setup (init.c ported)
     - initLandscape() - Full initialization with graphics layers
     - initObjects() - Load and organize objects for all areas
     - initFloorSquares() - Load floor data
     - initActivArea() - Set up specific area for display
     - doneLandscape() - Clean up
   - Core rendering (landscap.c ported)
     - buildScrollWindow() - Render floor and objects
     - refreshObjectList() - Create sorted object list
     - patchObjects() - Fix incorrect status bits
     - Object type checking (wall, door, addon, standard, special)
     - State management (old/new state tracking)
   - Scrolling and viewport (scroll.c ported)
     - initScrollLandscape() - Calculate scroll deltas
     - scrollLandscape() - Perform scrolling
     - scrollCorrectData() - Update window position
   - Spot management (spot.c ported)
     - Guard patrol system
     - Waypoint-based movement (ping-pong pattern)
     - Spot visibility and status
     - guyInsideSpot() - Detect if person in patrol area
   - Utility functions
     - getRoomsOfArea() - Get rooms in area
     - getObjectsByList() - Get objects in rectangle
     - getLoudness() - Microphone detection
     - calcExactSize() - Object bounding box
     - isInside() - Rectangle intersection
   - Phaser integration
     - Graphics layers (floor, object, character)
     - Floor tile rendering (placeholder)
     - Object rendering (placeholder)
   - LandscapeTestScene for testing
   - ⚠️ Collision detection needs implementation
   - ⚠️ Floor/object image loading needs implementation
   - ⚠️ Full rendering with textures needs implementation

15. **Planning System** - Partial ✅
   - PlanningSystemService - Core system (COMPLETE)
     - System/Handler/Action/Signal management
     - Action types: GO, WAIT, SIGNAL, WAIT_SIGNAL, USE, TAKE, DROP, OPEN, CLOSE, CONTROL
     - Handler management (create, find, set active, clear, close)
     - Action navigation (first, last, next, prev)
     - Signal communication between handlers
     - Save/load functionality
     - Timer management
   - PlanningService - Main interface (PARTIAL)
     - planner() - Planning interface with menu system ✅
     - Main planning loop ✅
     - Notebook menu (target, team, car, tools, loots) ✅
     - Look menu (view plan, change person) ✅
     - Action menu (walk, use, open, close, take, drop, wait, radio) ✅
     - Save/load plan ✅
     - Prepare/unprepare system and graphics ✅
     - Timer and info display ✅
     - player() - Burglary execution (stubbed)
     - Action implementations (stubbed)
   - PlanningSupportService - Support functions (PARTIAL)
     - prepareData() - Initialize planning data ✅
     - getNextLoot() - Loot slot management ✅
     - livingsPosAtCar() - Check if at car ✅
     - allInCar() - Check if all in car ✅
     - isStair() - Check if object is stairs ✅
     - correctOpened() - Update object state (stubbed)
     - ignoreLock() - Check lock state ✅
     - move() - Move person (stubbed)
     - work() - Work animation (stubbed)
     - insertGuard() - Add guard to list (stubbed)
     - objectInReach() - Check reach (stubbed)
   - PlanningTestScene for testing ✅
   - Integration with StoryService ✅
   - Integration with InteractionService ✅
   - ⚠️ Action implementations need full porting (walk, use, open, close, take, drop, wait, radio)
   - ⚠️ Burglary execution needs implementation

16. **Organisation System** - Complete ✅
   - OrganisationService for team/car/driver selection
   - Port of src/organisa/organisa.c
   - tcOrganisation() - Main organisation menu
   - Team member selection (add/remove)
   - Car selection with capacity checking
   - Driver selection with ability checking
   - Building selection
   - Integration with InteractionService (PLAN action)
   - OrganisationTestScene for testing
   - ⚠️ Display functions not yet implemented (graphics)
   - ⚠️ Tool distribution not yet implemented

17. **Loot System** - Complete ✅
   - LootService for loot management
   - Port of tcMakeLootList from src/scenes/dealer.c
   - Loot collection and tracking
   - Value calculation by category
   - Weight and volume tracking
   - Loot transfer between containers
   - CompleteLoot type fixed (added vase, totalWeight, totalVolume)
   - Summary formatting

18. **Commerce Systems** - Complete ✅
   - ToolsService for tool buying/selling
   - CarsService for car buying/selling/maintenance
   - DealerService for selling stolen loot
   - Integration with Mary Bolton (tools)
   - Integration with Marc Smith (cars)
   - Integration with fences (Maloya, Pooly, Parker)

19. **Test Scenes**
   - ReplayTestScene (original)
   - DataLoaderTestScene
   - TextTestScene
   - UITestScene
   - ImageTestScene
   - LivingTestScene
   - DialogTestScene
   - SceneTestScene
   - InteractionTestScene
   - OrganisationTestScene
   - PlanningTestScene
   - LandscapeTestScene (NEW in Session 20)
   - GameScene, MainMenuScene, LondonScene

### What Needs Work 🚧

1. **Landscape System Completion** - HIGH PRIORITY (NEW)
   - ✅ Core initialization and setup
   - ✅ Object management and sorting
   - ✅ Scrolling and viewport
   - ✅ Spot (guard patrol) system
   - ⚠️ Collision detection implementation
   - ⚠️ Floor tile image loading and rendering
   - ⚠️ Object image loading and rendering
   - ⚠️ Lighting/darkness rendering
   - ⚠️ Door refresh system
   - ⚠️ Integration with LivingService for character display

2. **Planning System Implementation** - HIGH PRIORITY
   - ✅ Core system (PlanningSystemService)
   - ✅ Menu system (planner interface)
   - ✅ Team selection UI (via OrganisationService)
   - ✅ Save/load system (basic structure)
   - ✅ Support functions (PlanningSupportService)
   - ⚠️ Action implementations (walk, use, open, close, take, drop, wait, radio)
   - ⚠️ Landscape integration for action planning (NOW POSSIBLE)
   - ⚠️ Guard simulation
   - ⚠️ Burglary execution (plPlayer)
   - ⚠️ Time tracking during execution
   - ⚠️ Loot tracking during execution

3. **Menu System Integration** - MEDIUM PRIORITY
   - ⚠️ Southampton scene menu (walk, wait, fish, plan, info, execute)
   - ⚠️ Kaserne scene menu (go inside, info, plan, execute)
   - ⚠️ Tower burglary initialization (team setup, tools, abilities)

4. **Story Scene System** - LOW PRIORITY
   - ⚠️ Story scene triggering based on conditions
   - ⚠️ Probability-based scene selection
   - ⚠️ Scene interruption system
   - ⚠️ LinkScenes() implementation

5. **Replay System Integration** - LOW PRIORITY
   - ⚠️ Screenshot generation not working in headless mode
   - ⚠️ Visual regression testing blocked
   - ⚠️ Need to debug NW.js screenshot capture

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
│   ├── GameTypes.ts         ✅ Core types (updated Building)
│   ├── SceneTypes.ts        ✅ Scene types
│   └── GameConstants.ts     ✅ Game constants
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
│   ├── StoryService.ts      ✅ Story handlers (43/43)
│   ├── InteractionService.ts ✅ Action menu
│   ├── InvestigationService.ts ✅ Building observation
│   ├── LandscapeService.ts  🚧 Building interiors (partial - Session 20)
│   ├── PlanningSystemService.ts ✅ Planning core (system/handler/action/signal)
│   ├── PlanningSupportService.ts ✅ Planning support functions
│   ├── PlanningService.ts   🚧 Burglary planning (partial)
│   ├── OrganisationService.ts ✅ Team/car/driver selection
│   ├── LootService.ts       ✅ Loot management
│   ├── PresentationService.ts ✅ Object display
│   ├── ToolsService.ts      ✅ Tool buying/selling
│   ├── CarsService.ts       ✅ Car buying/selling/maintenance
│   └── DealerService.ts     ✅ Loot fencing
└── scenes/
    ├── ReplayTestScene.ts   ✅ Replay testing
    ├── DataLoaderTestScene.ts ✅ Data loading test
    ├── TextTestScene.ts     ✅ Text system test
    ├── UITestScene.ts       ✅ UI system test
    ├── LivingTestScene.ts   ✅ Living system test
    ├── DialogTestScene.ts   ✅ Dialog system test
    ├── SceneTestScene.ts    ✅ Scene system test
    ├── InteractionTestScene.ts ✅ Interaction test
    ├── OrganisationTestScene.ts ✅ Organisation test
    ├── PlanningTestScene.ts ✅ Planning system test
    ├── LandscapeTestScene.ts ✅ Landscape test (NEW Session 20)
    ├── GameScene.ts         ✅ Main scene
    ├── MainMenuScene.ts     ✅ Menu
    └── LondonScene.ts       ✅ Hub scene
```

## Next Steps (Priority Order)

### Immediate (Session 20 - COMPLETED ✅)
1. ✅ Port landscape initialization (init.c)
2. ✅ Port core rendering (landscap.c)
3. ✅ Port scrolling system (scroll.c)
4. ✅ Port spot management (spot.c)
5. ✅ Create LandscapeTestScene
6. ✅ Update documentation

### Short-term (Next 2-3 Sessions)
1. Complete landscape rendering - HIGH PRIORITY
   - Floor tile image loading and rendering
   - Object image loading and rendering
   - Collision detection implementation
   - Lighting/darkness rendering
   - Door refresh system
   - Integration with LivingService
2. Implement planning action handlers - HIGH PRIORITY
   - Walk action with landscape integration (NOW POSSIBLE)
   - Use action (tools on objects)
   - Open/close actions (doors, windows, safes)
   - Take/drop actions (loot management)
   - Wait action (time progression)
   - Radio action (signal communication)
3. Implement burglary execution - HIGH PRIORITY
   - Player movement in building (landscape ready)
   - Tool usage
   - Alarm/guard detection
   - Loot collection
   - Time tracking

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

- 62 TypeScript files, ~18,742 lines of code (up from ~17,045 in Session 19)
- 72 C source files to port (~35k lines)
- Progress: ~48% complete (estimated, up from ~46%)
- TCMAIN.DAT and TCBUILD.DAT are main data files
- Building-specific files: *ETA0.DAT, *ETA1.DAT, etc.
- Relations in .REL files (text format)
- Text files in gamedata/TEXTS/ (XOR encrypted with 0x75)
- Images in gamedata/PICTURES/ (IFF ILBM format, loaded directly)
- ILBM decoder successfully ported from C
- UI system ready for integration with game scenes
- Story file system fully functional with event tracking
- Story scene triggering system implemented
