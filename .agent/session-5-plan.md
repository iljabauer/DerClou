# Session 5 Plan - Continue Porting

## Current Status
- Main menu: ✅ Working (2% pixel diff acceptable)
- Story scene: ✅ Basic implementation
- Graphics: ✅ ILBM loader, ImageCatalog, ImageService
- Text: ✅ TextService with XOR decoding
- Dialog: ✅ DialogService with speech bubbles
- Core: ✅ List, Database
- Tests: main-menu passing (2% diff), others need work

## Session Goals (80% porting, 20% testing)

### Priority 1: Get More Tests Passing
1. Run monologue test to see current state
2. Fix any issues preventing monologue from working
3. Verify replay system works across scenes

### Priority 2: Port Missing Core Systems
Based on C source analysis, we need:
1. **Data Loading** (src/data/)
   - Port database loading (TCMAIN.DAT, TCBUILD.DAT)
   - Port relation system
   - Port object types and structures
   
2. **Scene System** (src/scenes/)
   - Port scene management
   - Port scene transitions
   - Port scene data structures

3. **Dialog System Enhancements** (src/dialog/)
   - Port full dialog system
   - Port conversation trees
   - Port character interactions

### Priority 3: Game Flow
1. Ensure MainMenu → Story transition works
2. Implement basic game state management
3. Keep game playable at all times

## Work Plan

### Phase 1: Test & Fix (20%)
- [ ] Run monologue test
- [ ] Fix any blocking issues
- [ ] Document test results

### Phase 2: Port Core Data (40%)
- [ ] Review src/data/database.c
- [ ] Port database loading functions
- [ ] Port relation system
- [ ] Create TypeScript types for game objects
- [ ] Test data loading

### Phase 3: Port Scene System (40%)
- [ ] Review src/scenes/
- [ ] Port scene management
- [ ] Port scene data structures
- [ ] Integrate with existing scenes
- [ ] Test scene transitions

## Commit Strategy
- Commit after every file edit
- Run npm run build after each commit
- Test frequently
- Keep game playable

## Notes
- Focus on porting, not perfection
- Accept minor visual differences in tests
- Keep replay system working
- Document progress in progress-summary.md
