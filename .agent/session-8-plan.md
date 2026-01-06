# Session 8 Plan

## Current Status

### Test Results
- ✅ **go.spec.ts**: PASSING (test_go.rec)
- ❌ **main-menu.spec.ts**: FAILING (2% pixel diff - acceptable but needs investigation)
- ❌ **monologue.spec.ts**: FAILING (2% pixel diff)
- ❌ **from-start-to-finish-first-burglary.spec.ts**: FAILING

### What's Working
- Build system: ✅ Passing
- NavigationScene: ✅ Created and integrated
- RouterScene: ✅ Routing test_go correctly
- Main menu: ✅ Functional
- Graphics loading: ✅ ILBM loader working
- Replay system: ✅ Working for go test

### What Needs Work
The go.spec.ts test is passing, which shows:
1. Main menu → working
2. Location scene (Holland Street) → **NEEDS PORTING**
3. Action menu (Gehen, Reden, Warten, etc.) → **NEEDS PORTING**
4. Navigation between locations → partially working

## Analysis

Looking at screenshot-0005.png from go test:
- Shows "Holland Street 03.02.1953" location
- Character sprite visible on street
- Action menu at bottom: "Gehen, Reden, Warten, Umsehen, Taxi rufen, Nachdenken"
- This is a **LocationScene** that needs to be ported

The test passes because RouterScene is routing correctly, but the actual location rendering is missing.

## Priority Tasks for This Session

### 1. Port LocationScene (HIGH PRIORITY)
**Goal**: Render location scenes with backgrounds, characters, and action menus

**Components needed**:
- Load location background images
- Display location name and date
- Show character sprite
- Render action menu at bottom
- Handle action selection (keyboard/mouse)
- Integrate with replay system

**C Code Reference**:
- `src/scenes/scenes.c` - Scene rendering
- `src/present/present.c` - Presentation layer
- `src/gameplay/gp_app.c` - Action handling

### 2. Fix Main Menu Test (MEDIUM PRIORITY)
**Issue**: 2% pixel difference (was passing before)
**Action**: Investigate what changed, likely font or graphics rendering

### 3. Port MonologueScene (MEDIUM PRIORITY)
**Goal**: Get monologue.spec.ts passing
**Components**: Dialog system, speech bubbles, character portraits

### 4. Test Long Replay (LOW PRIORITY)
**Goal**: Run from-start-to-finish-first-burglary.spec.ts
**Action**: See how far it gets, identify missing components

## Detailed Plan

### Phase 1: LocationScene Foundation (2-3 hours)
1. Study C code for location rendering
2. Create LocationScene.ts (replace .bak file)
3. Load location backgrounds from image catalog
4. Display location name and date from game data
5. Render character sprite at correct position
6. Add to game config and router

### Phase 2: Action Menu System (1-2 hours)
1. Create action menu UI component
2. Load action text from text files
3. Handle keyboard navigation (UP/DOWN/LEFT/RIGHT)
4. Handle mouse selection
5. Integrate with replay system
6. Screenshot capture at each action

### Phase 3: Scene Integration (1 hour)
1. Connect LocationScene to NavigationScene
2. Handle scene transitions
3. Pass game state between scenes
4. Test with go.spec.ts replay

### Phase 4: Testing and Fixes (1 hour)
1. Run all tests
2. Fix main-menu.spec.ts pixel difference
3. Verify go.spec.ts still passes
4. Document progress

## Time Allocation (80/20 Rule)

- **80% Porting** (5-6 hours):
  - LocationScene implementation
  - Action menu system
  - Scene integration
  
- **20% Testing** (1-2 hours):
  - Run tests frequently
  - Fix issues
  - Verify replay system

## Success Criteria

### Minimum (Must Have)
- [ ] LocationScene.ts created and functional
- [ ] Location backgrounds rendering
- [ ] Action menu displaying
- [ ] go.spec.ts still passing
- [ ] Build passing
- [ ] Committed after each file edit

### Target (Should Have)
- [ ] Character sprites rendering
- [ ] Location name and date displaying
- [ ] Action menu fully interactive
- [ ] Scene transitions working
- [ ] main-menu.spec.ts passing

### Stretch (Nice to Have)
- [ ] monologue.spec.ts passing
- [ ] Multiple location scenes working
- [ ] Time system integrated
- [ ] Full game flow from menu to location

## Notes

- Keep game playable at all times
- Commit after every file edit
- Run `npm run build` frequently
- Test with playwright after major changes
- Use .agent/ for notes and analysis
- Focus on getting LocationScene working first
- Don't worry about pixel-perfect rendering yet (2% diff is acceptable)

## Next Session Handoff

After this session, document:
- What was completed
- What tests are passing
- What needs work next
- Any blockers or issues
- Updated progress summary
