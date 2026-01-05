# Burglary Execution Implementation Plan

**Created:** 2026-01-05 (Session 23)
**Status:** Planning Phase

## Overview

Implement burglary execution system (plPlayer) to execute planned actions in real-time during burglaries. This is the final major gameplay system needed to make the game fully playable.

## Current State

### Completed ✅
- Planning system (90% complete)
  - Core system (PlanningSystemService)
  - Menu system (planner interface)
  - All 8 action implementations (walk, use, open, close, take, drop, wait, radio)
  - Team/car/driver selection (OrganisationService)
  - Save/load system (basic structure)
- Landscape system (85% complete)
  - Floor and object rendering
  - Scrolling and viewport
  - Guard patrol system (spots)
  - Object state management
- All supporting systems (Database, Text, UI, Dialog, Living, etc.)

### Not Started ⚠️
- Burglary execution (plPlayer) - ~1,612 lines in player.c
- Guard simulation (guards.c) - ~181 lines
- Sync system (sync.c) - ~835 lines
- Evidence system (evidence.c) - ~600 lines

## Implementation Strategy

### Phase 1: Core Execution Loop (HIGH PRIORITY)
**Goal:** Get basic burglary execution working with action playback

**Files to Port:**
1. `player.c` - Main execution (plPlayer function)
   - Player data structure (PD)
   - Main execution loop
   - Action execution handlers
   - Timer management
   - Person switching

**Key Functions:**
- `plPlayer()` - Main entry point (~350 lines)
- `plPlayerAction()` - Per-tick update (~500 lines)
- `CheckSurrounding()` - Watchdog detection
- `UnableToWork()` - Handle blocked actions
- `plGetMood()` - Team mood calculation
- `plPersonLearns()` - Skill improvement
- `plCarTooFull()` - Capacity checking

**Implementation Steps:**
1. Create PlayerData interface for PD structure
2. Port plPlayer() initialization
3. Port main execution loop
4. Port action execution switch statement
5. Implement basic timer and display
6. Add person switching menu
7. Add escape menu option

**Dependencies:**
- PlanningSystemService (existing)
- LandscapeService (existing)
- LivingService (existing)
- UIService (existing)

**Estimated Effort:** 2-3 sessions

### Phase 2: Alarm and Detection Systems (HIGH PRIORITY)
**Goal:** Add alarm triggers and detection mechanics

**Key Features:**
- Time clock alarms
- Loudness detection
- Patrol detection
- Microphone detection
- Guard detection
- Alarm response
- Police arrival

**Implementation Steps:**
1. Port alarm checking logic
2. Port loudness calculation
3. Port patrol system integration
4. Port guard detection
5. Port police response
6. Add alarm sound effects (stubs)

**Dependencies:**
- Phase 1 (execution loop)
- LandscapeService (spot system)
- GameplayService (detection functions - need to port)

**Estimated Effort:** 1-2 sessions

### Phase 3: Guard System (MEDIUM PRIORITY)
**Goal:** Implement guard AI and patrol behavior

**Files to Port:**
1. `guards.c` - Guard management (~181 lines)
   - Guard initialization
   - Guard movement
   - Guard patrol routes
   - Guard state management

**Key Functions:**
- `grdInit()` - Initialize guards
- `grdDo()` - Update guard behavior
- `grdAddToList()` - Add guards to person list
- `grdDraw()` - Draw guards (already in LandscapeService)
- `grdDone()` - Cleanup

**Implementation Steps:**
1. Create GuardService
2. Port guard initialization
3. Port guard movement logic
4. Integrate with execution loop
5. Add guard detection logic

**Dependencies:**
- Phase 1 (execution loop)
- LandscapeService (spot system)

**Estimated Effort:** 1 session

### Phase 4: Sync System (MEDIUM PRIORITY)
**Goal:** Implement animation synchronization

**Files to Port:**
1. `sync.c` - Animation sync (~835 lines)
   - Frame-by-frame animation
   - Time synchronization
   - Action timing

**Key Functions:**
- `plSync()` - Main sync function
- Animation timing helpers
- Frame calculation

**Implementation Steps:**
1. Create SyncService
2. Port plSync() function
3. Integrate with execution loop
4. Add animation timing
5. Test with various actions

**Dependencies:**
- Phase 1 (execution loop)
- LivingService (animation)

**Estimated Effort:** 1-2 sessions

### Phase 5: Gameplay Functions (MEDIUM PRIORITY)
**Goal:** Port gameplay calculation functions

**Files to Port:**
1. `gp.c` - Gameplay functions (~600 lines)
   - Detection calculations
   - Time calculations
   - Alarm triggers
   - Mood calculations

**Key Functions:**
- `tcWatchDogWarning()` - Watchdog detection
- `tcGuardDetectsGuy()` - Guard detection
- `tcAlarmByLoudness()` - Loudness alarm
- `tcAlarmByMicro()` - Microphone alarm
- `tcAlarmByRadio()` - Radio alarm
- `tcAlarmByPatrol()` - Patrol alarm
- `tcAlarmByTouch()` - Touch alarm
- `tcCheckTimeClocks()` - Time clock checking
- `tcGetTeamMood()` - Mood calculation
- `tcGuyUsesToolInPlayer()` - Tool usage time
- `tcGetToolLoudness()` - Tool loudness
- `tcGetWalkLoudness()` - Walk loudness
- `tcGetTotalLoudness()` - Total loudness
- `tcKillTheGuard()` - Guard combat
- `tcGetDanger()` - Danger calculation

**Implementation Steps:**
1. Create GameplayService
2. Port detection functions
3. Port alarm functions
4. Port calculation functions
5. Integrate with execution loop

**Dependencies:**
- Phase 1 (execution loop)
- Phase 2 (alarm systems)

**Estimated Effort:** 2 sessions

### Phase 6: Evidence System (LOW PRIORITY)
**Goal:** Implement evidence tracking and police investigation

**Files to Port:**
1. `evidence.c` - Evidence tracking (~600 lines)
   - Car recognition
   - Police investigation
   - Wanted level
   - Evidence cleanup

**Key Functions:**
- Evidence tracking
- Car recognition
- Police investigation
- Wanted level updates

**Implementation Steps:**
1. Create EvidenceService
2. Port evidence tracking
3. Port car recognition
4. Port police investigation
5. Integrate with execution loop

**Dependencies:**
- Phase 1 (execution loop)
- Phase 2 (alarm systems)

**Estimated Effort:** 1-2 sessions

### Phase 7: Polish and Testing (LOW PRIORITY)
**Goal:** Fix bugs, optimize, and test thoroughly

**Tasks:**
- Fix any bugs found during testing
- Optimize performance
- Add missing features
- Test with replay system
- Visual regression testing
- Balance gameplay

**Estimated Effort:** 2-3 sessions

## Priority Order

1. **Phase 1: Core Execution Loop** (CRITICAL)
   - Without this, nothing else works
   - Enables basic burglary playback

2. **Phase 2: Alarm and Detection** (CRITICAL)
   - Makes burglaries challenging
   - Core gameplay mechanic

3. **Phase 5: Gameplay Functions** (HIGH)
   - Needed for Phase 2 to work properly
   - Can be stubbed initially

4. **Phase 3: Guard System** (MEDIUM)
   - Enhances gameplay
   - Can be simplified initially

5. **Phase 4: Sync System** (MEDIUM)
   - Improves animation quality
   - Can be simplified initially

6. **Phase 6: Evidence System** (LOW)
   - Long-term consequences
   - Can be added later

7. **Phase 7: Polish** (LOW)
   - Continuous throughout

## Simplification Strategy

To get a working implementation faster:

1. **Start with simplified detection:**
   - Stub out complex calculations
   - Use simple probability checks
   - Add full implementation later

2. **Simplify guard AI:**
   - Basic patrol movement
   - Simple detection logic
   - Enhance later

3. **Simplify sync system:**
   - Basic animation timing
   - Full frame-by-frame sync later

4. **Defer evidence system:**
   - Not critical for basic gameplay
   - Add after core systems work

## Testing Strategy

1. **Unit Testing:**
   - Test each phase independently
   - Use test scenes for each system

2. **Integration Testing:**
   - Test with simple burglaries first
   - Gradually add complexity

3. **Replay Testing:**
   - Use existing replay system
   - Visual regression testing
   - Compare with C version

4. **Manual Testing:**
   - Play through burglaries
   - Test edge cases
   - Test all alarm types

## Success Criteria

### Minimum Viable Product (MVP)
- [ ] Can execute a planned burglary
- [ ] Actions play back correctly
- [ ] Timer advances properly
- [ ] Can switch between team members
- [ ] Can escape/abort burglary
- [ ] Basic alarm detection works
- [ ] Police arrival works
- [ ] Success/failure determined correctly

### Full Implementation
- [ ] All alarm types work
- [ ] Guard AI works properly
- [ ] Animation sync is smooth
- [ ] All gameplay calculations accurate
- [ ] Evidence system tracks properly
- [ ] Replay system works
- [ ] Visual regression tests pass

## Risk Assessment

### High Risk
- **Complexity:** player.c is very complex (~1,612 lines)
- **Dependencies:** Requires many other systems
- **Testing:** Hard to test without full game loop

### Mitigation
- Break into small phases
- Test each phase independently
- Use replay system for validation
- Start with simplified versions
- Add complexity gradually

## Timeline Estimate

- **Phase 1:** 2-3 sessions (Core execution)
- **Phase 2:** 1-2 sessions (Alarms)
- **Phase 3:** 1 session (Guards)
- **Phase 4:** 1-2 sessions (Sync)
- **Phase 5:** 2 sessions (Gameplay)
- **Phase 6:** 1-2 sessions (Evidence)
- **Phase 7:** 2-3 sessions (Polish)

**Total:** 10-15 sessions

**MVP:** 3-5 sessions (Phases 1-2 only)

## Next Steps

1. Start with Phase 1: Core Execution Loop
2. Port PlayerData structure
3. Port plPlayer() initialization
4. Port main execution loop
5. Test with simple burglary
6. Add action execution handlers
7. Test with replay system

## Notes

- Focus on getting MVP working first
- Don't try to port everything at once
- Test frequently with replay system
- Commit after every file edit
- Keep replay system working at all times
- Use simplified versions initially
- Add complexity gradually
- Prioritize playability over accuracy
