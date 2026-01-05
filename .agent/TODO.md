# Der Clou! Port - TODO List

**Last Updated:** 2026-01-05 (Session 23)

## Current Sprint: Phase 8 - Burglary Execution

### High Priority 🔴 (Phase 8: Burglary Execution - In Progress)

**See BURGLARY_EXECUTION_PLAN.md for detailed implementation plan**

#### Phase 1: Core Execution Loop (CRITICAL - NEXT)
- [ ] Create PlayerData interface for PD structure
- [ ] Port plPlayer() initialization from player.c
- [ ] Port main execution loop
- [ ] Port action execution switch statement
- [ ] Implement basic timer and display
- [ ] Add person switching menu
- [ ] Add escape menu option
- [ ] Test with simple burglary

#### Phase 2: Alarm and Detection Systems (CRITICAL)
- [ ] Port alarm checking logic
- [ ] Port loudness calculation
- [ ] Port patrol system integration
- [ ] Port guard detection
- [ ] Port police response
- [ ] Add alarm sound effects (stubs)

#### Phase 3: Guard System (MEDIUM)
- [ ] Create GuardService
- [ ] Port guard initialization from guards.c
- [ ] Port guard movement logic
- [ ] Integrate with execution loop
- [ ] Add guard detection logic

#### Phase 4: Sync System (MEDIUM)
- [ ] Create SyncService
- [ ] Port plSync() from sync.c
- [ ] Integrate with execution loop
- [ ] Add animation timing
- [ ] Test with various actions

#### Phase 5: Gameplay Functions (MEDIUM)
- [ ] Create GameplayService
- [ ] Port detection functions from gp.c
- [ ] Port alarm functions
- [ ] Port calculation functions
- [ ] Integrate with execution loop

### Medium Priority 🟡 (Polish and Optimization)

#### Phase 6: Evidence System (LOW)
- [ ] Create EvidenceService
- [ ] Port evidence tracking from evidence.c
- [ ] Port car recognition
- [ ] Port police investigation
- [ ] Integrate with execution loop

#### Phase 7: Polish and Testing (LOW)
- [ ] Fix bugs found during testing
- [ ] Optimize performance
- [ ] Add missing features
- [ ] Test with replay system
- [ ] Visual regression testing
- [ ] Balance gameplay

### Low Priority 🟢 (Future Enhancements)

- [ ] Debug replay system screenshot generation
  - [ ] Check NW.js screenshot capture in headless mode
  - [ ] Verify ScreenshotService integration
  - [ ] Test with simple replay file
  - [ ] Fix visual regression testing

- [ ] Story scene system enhancements
  - [ ] Story scene triggering based on conditions
  - [ ] Probability-based scene selection
  - [ ] Scene interruption system
  - [ ] LinkScenes() implementation

- [ ] Menu system integration
  - [ ] Southampton scene menu polish
  - [ ] Kaserne scene menu polish
  - [ ] Tower burglary initialization

- [ ] Landscape system polish
  - [ ] Collision detection implementation
  - [ ] Lighting/darkness rendering
  - [ ] Door refresh system
  - [ ] Integration with LivingService for character display

## Completed ✅

### Core Systems (Complete)
- [x] Move documentation to .agent/
- [x] Create current status document
- [x] Create TODO tracking
- [x] Set up replay system
- [x] Create core architecture
- [x] Implement Database system
- [x] Implement GameState
- [x] Implement SceneManager
- [x] Create basic Renderer
- [x] Integrate GameEngine

### Data Loading (Complete)
- [x] Create BinaryReader with endianness support
- [x] Create DatFileParser with all 18 object types
- [x] Create RelFileParser for text-based relations
- [x] Create DataLoader service
- [x] Load TCMAIN.DAT and TCBUILD.DAT
- [x] Load all building-specific files (*ETA*.DAT, *ETA*.REL)
- [x] Create DataLoaderTestScene for testing

### Phase 1: Living/Location System (Complete)
- [x] Port living.c - Location and character management
- [x] Create LivingService.ts - Character management
- [x] Create BackgroundService.ts - Location backgrounds
- [x] Load animation templates and character data
- [x] Load ALLMAXI sprite sheet
- [x] Implement frame-based animation with cropping
- [x] Create LivingTestScene for testing

### Phase 2: Dialog System (Complete)
- [x] Port Say() function from dialog.c
- [x] Create DialogService.ts
- [x] Implement bubble() and think() helpers
- [x] Complete DynamicTalk() implementation
- [x] Port ParseTalkText() for keyword extraction
- [x] Port PrepareQuestions() for question generation
- [x] Knowledge tracking system
- [x] Dialog tree navigation
- [x] Standard question handlers
- [x] Create DialogTestScene for testing

### Phase 3: Scene System (Complete)
- [x] Port SceneService.ts
- [x] Port Go() - Location navigation
- [x] Port Information() - Info menu
- [x] Port Look() - Examine location
- [x] Port Wait() - Time progression
- [x] Taxi location management
- [x] Create SceneTestScene for testing

### Phase 4: Story System (Complete)
- [x] Create StoryService.ts
- [x] Port all 43 story handlers
- [x] Story state management
- [x] Event tracking system
- [x] Story file loading (StoryFileParser)
- [x] Scene condition checking

### Phase 5: Interaction System (Complete)
- [x] Create InteractionService
- [x] Port StdDone() and StdHandle()
- [x] Implement all 9 actions (GO, WAIT, BUSINESS_TALK, LOOK, INVESTIGATE, PLAN, CALL_TAXI, MAKE_CALL, INFO)
- [x] Integration with UIService, SceneService, DialogService
- [x] Create InteractionTestScene for testing

### Phase 6: Investigation System (Complete)
- [x] Create InvestigationService
- [x] Port Investigate() from invest.c
- [x] 24-hour observation simulation
- [x] Patrol event display
- [x] Knowledge gain tracking
- [x] Suspicion tracking

### Phase 7: Planning System (90% Complete)
- [x] Create PlanningSystemService (core system)
- [x] Create PlanningSupportService (support functions)
- [x] Create PlanningService (main interface)
- [x] Port planner() - Planning interface with menu system
- [x] Port all 8 action implementations (walk, use, open, close, take, drop, wait, radio)
- [x] Create OrganisationService (team/car/driver selection)
- [x] Create LootService (loot management)
- [x] Save/load system (basic structure)
- [x] Create PlanningTestScene for testing
- [ ] Port player() - Burglary execution (IN PROGRESS)

### Supporting Systems (Complete)
- [x] Text system (TextService)
- [x] Image system (ImageService, ILBMDecoder)
- [x] UI system (UIService)
- [x] Landscape system (LandscapeService) - 85% complete
- [x] Commerce systems (ToolsService, CarsService, DealerService)
- [x] Presentation system (PresentationService)

## Blocked ⛔

None currently.

## Progress Summary

**Overall Port:** ~55% complete
- Core systems: ✅ 100%
- Data/Text/Image: ✅ 100%
- UI/Dialog/Living: ✅ 100%
- Story/Scene: ✅ 100%
- Interaction: ✅ 100%
- Investigation: ✅ 100%
- Organisation: ✅ 100%
- Commerce: ✅ 100%
- Planning: 🚧 90% (actions done, execution pending)
- Landscape: 🚧 85%
- Burglary execution: ⚠️ 0% (NEXT PRIORITY)

**Estimated Remaining Work:**
- Burglary execution: 10-15 sessions
- MVP (core execution + alarms): 3-5 sessions
- Full implementation: 10-15 sessions

## Notes

- **Current Focus:** Burglary execution (player.c)
- **Strategy:** Start with MVP (core execution loop + basic alarms)
- **Testing:** Use replay system for validation
- Keep replay system working at all times
- Commit after every file edit
- Test frequently with visual regression
- See BURGLARY_EXECUTION_PLAN.md for detailed implementation plan
