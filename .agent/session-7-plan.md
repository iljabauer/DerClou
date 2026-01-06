# Session 7 Plan

## Goal
Continue porting Der Clou from C to Phaser/TypeScript. Focus on understanding and improving the "go" test which currently has 32% pixel difference.

## Current Status (from progress-summary.md)
- Main menu: ✅ Working (2% pixel diff)
- Monologue: ✅ Working (2% pixel diff)
- Go test: ⚠️ 32% pixel diff (needs investigation)
- Build system: ✅ Working
- Graphics: ✅ ILBM loader, ImageCatalog working
- Services: ✅ Text, Dialog, Image, Replay services implemented

## Session 7 Priorities

### 1. Analyze "go" Test Replay
- Decode test_go.rec to understand what actions it contains
- Identify which scenes/screens the test expects
- Compare with C implementation behavior
- Document expected flow

### 2. Identify Missing Functionality
- Determine what scene(s) the "go" test needs
- Check if it's navigation, location selection, or something else
- Review C source code for relevant systems
- Map C functions to TypeScript equivalents needed

### 3. Port Required Systems
Based on analysis, likely need:
- Location/navigation scene
- Location data structures
- Location service for data loading
- UI for location selection/navigation

### 4. Implement and Test
- Create necessary scenes/services
- Integrate with replay system
- Run build after each change
- Test manually and with Playwright
- Aim to reduce pixel diff from 32% to <10%

## Files to Study

### C Source
- src/landscap/landscap.c - Location/landscape system
- src/landscap/landscap.h - Location structures
- src/present/present.c - Presentation layer
- src/scenes/scenes.c - Scene management
- src/base/base.c - Base game loop

### Replay
- gamedata/test_go.rec - Decode and analyze

### TypeScript (to modify)
- src-js/src/game/scenes/RouterScene.ts - Update routing for go test
- src-js/src/game/scenes/ - Create new scene(s) as needed
- src-js/src/game/core/ - Add Location data structures
- src-js/src/game/services/ - Add LocationService if needed

## Success Criteria
- Understand what "go" test expects
- Implement required scene(s)
- "go" test pixel diff reduced from 32% to <10%
- Game remains playable
- All builds pass
- Commit after every file edit

## Notes
- Follow 80/20 rule: 80% porting, 20% testing
- Keep game playable at all times
- Focus on functionality over pixel-perfect rendering
- Document findings in .agent/ directory
