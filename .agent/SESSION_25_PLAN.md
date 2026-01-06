# Session 25 Plan - Burglary Execution Continuation

**Date:** 2026-01-06
**Focus:** Continue Phase 8 - Burglary Execution System

## Current Status

**Phase 8: Burglary Execution - 25% Complete**

### Completed in Previous Sessions ✅
- Phase 1 (Core Loop): 85% - PlayerData, plPlayer() initialization, main loop, action execution structure
- Phase 2 (Alarms): 60% - Alarm checking, loudness, patrol, radio, mood, exhaustion, GameplayService
- Phase 5 (Gameplay): 40% - GameplayService with alarm functions

### Remaining Work 🚧
- Phase 1: Test with simple burglary, fix bugs
- Phase 2: Guard detection, microphone alarm, touch alarm, power loss alarm, watchdog warning
- Phase 3: Guard System (0%) - GuardService, guard AI, movement, detection
- Phase 4: Sync System (0%) - SyncService, animation sync, timing
- Phase 5: Gameplay Functions (60% remaining) - Tool usage, loudness, danger, combat

## Session 25 Goals

### Priority 1: Fix TypeScript Errors (HIGH) 🔴
**Goal:** Get clean TypeScript compilation

**Tasks:**
1. Fix test scene errors (InteractionTestScene, OrganisationTestScene, etc.)
2. Fix unused variable warnings
3. Fix type mismatches
4. Run `npx tsc --noEmit` until clean
5. Run `npm run build` to verify

**Estimated Time:** 30-45 minutes

### Priority 2: Complete Phase 2 - Alarm Systems (HIGH) 🔴
**Goal:** Finish remaining alarm detection functions

**Files to Update:**
- `src-js/src/game/services/GameplayService.ts`

**Functions to Port:**
1. `tcGuardDetectsGuy()` - Guard detection logic
2. `tcAlarmByMicro()` - Microphone alarm
3. `tcAlarmByTouch()` - Touch alarm (doors/windows)
4. `tcAlarmByPowerLoss()` - Power loss alarm
5. `tcWatchDogWarning()` - Watchdog detection warning

**Source Files:**
- `src/gameplay/gp_app.c` (lines 1-600)

**Estimated Time:** 1-2 hours

### Priority 3: Complete Phase 5 - Gameplay Functions (MEDIUM) 🟡
**Goal:** Port remaining gameplay calculation functions

**Files to Update:**
- `src-js/src/game/services/GameplayService.ts`

**Functions to Port:**
1. `tcGuyUsesToolInPlayer()` - Tool usage time calculation
2. `tcGetToolLoudness()` - Tool loudness calculation
3. `tcGetWalkLoudness()` - Walk loudness calculation
4. `tcGetDanger()` - Danger level calculation
5. `tcKillTheGuard()` - Guard combat system

**Source Files:**
- `src/gameplay/gp_app.c` (lines 600-1200)

**Estimated Time:** 1-2 hours

### Priority 4: Start Phase 3 - Guard System (MEDIUM) 🟡
**Goal:** Begin guard AI implementation

**Files to Create:**
- `src-js/src/game/services/GuardService.ts`

**Functions to Port:**
1. `grdInit()` - Initialize guards for building
2. `grdDo()` - Update guard behavior per tick
3. `grdAddToList()` - Add guards to person list
4. `grdDone()` - Cleanup guards

**Source Files:**
- `src/gameplay/guards.c` (~181 lines)

**Estimated Time:** 1-2 hours

### Priority 5: Testing and Integration (ONGOING) 🟢
**Goal:** Test burglary execution with simple scenarios

**Tasks:**
1. Create simple test burglary plan
2. Execute plan and verify actions
3. Test alarm triggers
4. Test person switching
5. Test escape functionality
6. Fix bugs as found

**Estimated Time:** 30-60 minutes (ongoing)

## Implementation Order

1. **Fix TypeScript errors** (30-45 min)
   - Clean compilation required before continuing

2. **Complete alarm systems** (1-2 hours)
   - Guard detection
   - Microphone alarm
   - Touch alarm
   - Power loss alarm
   - Watchdog warning

3. **Complete gameplay functions** (1-2 hours)
   - Tool usage time
   - Loudness calculations
   - Danger calculation
   - Guard combat

4. **Start guard system** (1-2 hours)
   - GuardService creation
   - Basic guard AI
   - Guard movement
   - Integration with execution

5. **Test and debug** (ongoing)
   - Simple burglary test
   - Fix issues as found

## Success Criteria

### Minimum for Session 25
- [ ] TypeScript compiles without errors
- [ ] All alarm detection functions implemented
- [ ] All gameplay calculation functions implemented
- [ ] GuardService created with basic structure
- [ ] Guard initialization working
- [ ] All changes committed with proper messages

### Stretch Goals
- [ ] Guard movement implemented
- [ ] Guard detection integrated
- [ ] Simple burglary test passes
- [ ] Replay system test passes

## Testing Strategy

1. **After each file edit:**
   - Run `npx tsc --noEmit`
   - Run `npm run build`
   - Commit changes

2. **After major milestones:**
   - Test with PlanningTestScene
   - Test with simple burglary
   - Verify no regressions

3. **End of session:**
   - Full build test
   - Update status documents
   - Create session summary

## Notes

- Focus on getting alarm systems complete first
- Guard system can be simplified initially
- Test frequently to catch issues early
- Commit after every file edit
- Keep 80/20 rule: 80% porting, 20% testing
- Don't get stuck on perfect implementation
- Stub complex functions if needed

## Files to Reference

**C Source Files:**
- `src/gameplay/gp_app.c` - Gameplay functions
- `src/gameplay/guards.c` - Guard system
- `src/planing/player.c` - Execution loop (already partially ported)

**TypeScript Files:**
- `src-js/src/game/services/GameplayService.ts` - Gameplay functions
- `src-js/src/game/services/PlanningService.ts` - Execution loop
- `src-js/src/game/services/LandscapeService.ts` - Spot system
- `src-js/src/game/services/LivingService.ts` - Character management

## Estimated Session Time

- TypeScript fixes: 30-45 min
- Alarm systems: 1-2 hours
- Gameplay functions: 1-2 hours
- Guard system start: 1-2 hours
- Testing: 30-60 min

**Total:** 4-6 hours

## Next Session Preview

**Session 26 Goals:**
- Complete guard system (Phase 3)
- Start sync system (Phase 4)
- Test burglary execution end-to-end
- Fix any critical bugs
- Begin evidence system if time permits
