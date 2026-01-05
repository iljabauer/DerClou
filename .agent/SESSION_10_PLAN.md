# Session 10 Plan - Continue Story Handler Porting

**Date:** 2026-01-05
**Focus:** Port remaining story handlers and improve code quality

## Current Status

**Story Handlers:** 33 of 43 ported (77%)

### Remaining Handlers (10)

**Burglary Handlers (7):**
1. tcDone1stBurglary
2. tcDone2ndBurglary
3. tcDone3rdBurglary
4. tcDone4thBurglary
5. tcDone5thBurglary
6. tcDone6thBurglary
7. tcDone7thBurglary

**Complex Scenes (3):**
1. tcDoneBirthday - Complex person management and random placement
2. tcDoneSouthhampton - Menu-based scene with multiple actions
3. tcDoneKaserne - Final burglary setup and execution

## Session Goals

### Primary Goal: Port Remaining Story Handlers (80% time)

1. **Port Burglary Handlers (7 handlers)**
   - Add required constants (Person, Car, Tool, Building IDs)
   - Port handlers in order (1st through 7th)
   - Focus on structure, stub complex logic if needed

2. **Port Complex Scenes (3 handlers)**
   - tcDoneBirthday
   - tcDoneSouthhampton
   - tcDoneKaserne

### Secondary Goal: Testing and Quality (20% time)

1. **Test Story System**
   - Verify handlers compile
   - Check for missing constants
   - Test with replay system if possible

2. **Code Quality**
   - Add missing type annotations
   - Fix any TypeScript errors
   - Clean up stub implementations

## Approach

### Burglary Handlers Strategy

Burglary handlers follow a pattern:
- Team member management (persons)
- Vehicle assignment (cars)
- Tool distribution (tools)
- Building setup (targets)
- Scene transitions

**Steps:**
1. Examine C source for each handler
2. Extract all required IDs (persons, cars, tools, buildings)
3. Add constants to GameConstants.ts
4. Port handler logic
5. Commit after each handler

### Complex Scenes Strategy

Complex scenes require:
- Menu systems (already have UIService)
- State management (already have FilmService)
- Graphics integration (stub for now)

**Steps:**
1. Understand scene flow from C source
2. Port core logic
3. Stub graphics/animation calls
4. Add TODO comments for future work
5. Commit after each scene

## Time Allocation

- **Burglary Handlers:** 60% (6 handlers × 10% each)
- **Complex Scenes:** 20% (3 scenes × 7% each)
- **Testing:** 15%
- **Code Quality:** 5%

## Success Criteria

- ✅ All 43 story handlers ported (100%)
- ✅ No TypeScript compilation errors
- ✅ All required constants added
- ✅ Code committed after each file edit
- ✅ CURRENT_STATUS.md updated

## Notes

- Focus on getting handlers ported, not perfect
- Stub complex graphics/animation logic
- Add TODO comments for future work
- Keep replay system working
- Commit frequently
