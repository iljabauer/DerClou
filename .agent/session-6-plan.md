# Session 6 Plan

## Goal
Continue porting Der Clou from C to Phaser/TypeScript. Focus on navigation/location system to improve "go" test results.

## Current Status
- Main menu: ✅ Working (2% pixel diff)
- Monologue: ✅ Working (2% pixel diff)
- Go test: ⚠️ 32% pixel diff (needs navigation scene)
- Build system: ✅ Working

## Session 6 Priorities

### 1. Analyze "go" Test Requirements
- Examine test_go.rec replay file
- Understand what the test expects to see
- Identify missing scenes/functionality

### 2. Port Location/Navigation System
- Study src/landscap/ C code
- Create LocationScene or NavigationScene
- Implement basic location display
- Add navigation UI elements

### 3. Port Location Data Loading
- Study how locations are loaded in C
- Create Location data structures
- Load location data from game files
- Display locations in navigation scene

### 4. Test and Verify
- Run npm run build after each change
- Test "go" replay manually
- Run Playwright tests
- Aim to reduce 32% pixel diff

## Files to Study
- src/landscap/landscap.c - Location system
- src/landscap/landscap.h - Location structures
- src/present/present.c - Presentation layer
- src/scenes/scenes.c - Scene management
- gamedata/REPLAYS/test_go.rec - Test replay

## Files to Create/Modify
- src-js/src/game/scenes/LocationScene.ts (new)
- src-js/src/game/scenes/NavigationScene.ts (new)
- src-js/src/game/core/Location.ts (new)
- src-js/src/game/services/LocationService.ts (new)
- src-js/src/game/scenes/RouterScene.ts (update routing)

## Success Criteria
- "go" test pixel diff reduced from 32% to <10%
- Navigation scene displays locations
- User can see location information
- Game remains playable
- All builds pass

## Notes
- Follow 80/20 rule: 80% porting, 20% testing
- Commit after every file edit
- Keep game playable
- Focus on functionality over pixel-perfect rendering
