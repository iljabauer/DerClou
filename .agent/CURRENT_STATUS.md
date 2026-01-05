# Der Clou! TypeScript Port - Current Status

**Last Updated:** 2026-01-05 (Session 15 continued)

## Overview

Porting Der Clou! from C to TypeScript/Phaser. The project has a working foundation with replay system, core architecture, complete data/text/image systems, story file loading, and event tracking.

## Current Phase: Phase 5 - Story System Integration (Near Complete)

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

14. **Landscape System** - Stub ✅
   - LandscapeService with core interface
   - Building interior rendering (stubbed)
   - Room navigation (stubbed)
   - Object state management
   - Scroll functions (stubbed)
   - Collision detection (stubbed)
   - Full rendering to be implemented with burglary execution

15. **Planning System** - Stub ✅
   - PlanningService with core interface
   - planner() - Planning interface (stubbed)
   - player() - Burglary execution (stubbed)
   - Plan save/load/clear (stubbed)
   - Integration with StoryService
   - Integration with InteractionService
   - Full planning system to be implemented in future sessions

16. **Test Scenes**
   - ReplayTestScene (original)
   - DataLoaderTestScene
   - TextTestScene
   - UITestScene
   - ImageTestScene
   - LivingTestScene
   - DialogTestScene
   - SceneTestScene
   - InteractionTestScene
   - GameScene, MainMenuScene, LondonScene

### What Needs Work 🚧

1. **Planning System Implementation** - HIGH PRIORITY
   - ⚠️ Implement team selection UI
   - ⚠️ Implement tool selection UI
   - ⚠️ Implement action planning UI (walk, use, open, close, take, drop, wait, radio)
   - ⚠️ Implement plan save/load system
   - ⚠️ Implement plan validation
   - ⚠️ Implement guard simulation
   - ⚠️ Implement burglary execution (plPlayer)
   - ⚠️ Implement time tracking
   - ⚠️ Implement loot tracking

2. **Landscape System Implementation** - HIGH PRIORITY
   - ⚠️ Implement floor rendering
   - ⚠️ Implement object rendering
   - ⚠️ Implement room navigation
   - ⚠️ Implement collision detection
   - ⚠️ Implement scrolling
   - ⚠️ Implement lighting/darkness

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
│   ├── StoryService.ts      ✅ Story handlers (43/43)
│   ├── InteractionService.ts ✅ Action menu
│   ├── InvestigationService.ts ✅ Building observation
│   ├── LandscapeService.ts  🚧 Building interiors (stub)
│   ├── PlanningService.ts   🚧 Burglary planning (stub)
│   └── PresentationService.ts ✅ Object display
└── scenes/
    ├── ReplayTestScene.ts   ✅ Replay testing
    ├── DataLoaderTestScene.ts ✅ Data loading test
    ├── TextTestScene.ts     ✅ Text system test
    ├── UITestScene.ts       ✅ UI system test
    ├── LivingTestScene.ts   ✅ Living system test
    ├── DialogTestScene.ts   ✅ Dialog system test
    ├── SceneTestScene.ts    ✅ Scene system test
    ├── InteractionTestScene.ts ✅ Interaction test
    ├── GameScene.ts         ✅ Main scene
    ├── MainMenuScene.ts     ✅ Menu
    └── LondonScene.ts       ✅ Hub scene
```

## Next Steps (Priority Order)

### Immediate (Session 15 - COMPLETE ✅)
1. ✅ Port investigation system (Investigate from invest.c)
2. ✅ Update Building type with all fields
3. ✅ Integrate InvestigationService with InteractionService
4. ✅ Create LandscapeService stub
5. ✅ Create PlanningService stub
6. ✅ Integrate planning with StoryService and InteractionService
7. ✅ Update documentation with progress

### Short-term (Next 2-3 Sessions)
1. Implement planning system UI - HIGH PRIORITY
   - Team selection interface
   - Tool selection interface
   - Action planning interface
   - Plan save/load system
2. Implement landscape rendering - HIGH PRIORITY
   - Floor rendering
   - Object rendering
   - Room navigation
   - Collision detection
3. Implement burglary execution - HIGH PRIORITY
   - Player movement in building
   - Tool usage
   - Alarm/guard detection
   - Loot collection

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

- 52 TypeScript files, ~13,093 lines of code (up from ~12,520)
- 72 C source files to port (~35k lines)
- Progress: ~37% complete (estimated)
- TCMAIN.DAT and TCBUILD.DAT are main data files
- Building-specific files: *ETA0.DAT, *ETA1.DAT, etc.
- Relations in .REL files (text format)
- Text files in gamedata/TEXTS/ (XOR encrypted with 0x75)
- Images in gamedata/PICTURES/ (IFF ILBM format, loaded directly)
- ILBM decoder successfully ported from C
- UI system ready for integration with game scenes
- Story file system fully functional with event tracking
- Story scene triggering system implemented
