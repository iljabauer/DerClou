# Session 9 Plan - Fix Scene Rendering Issues

## Current Status

### Test Results (go.spec.ts)
- Test runs and captures 9 screenshots
- All screenshots failing with high pixel differences:
  - Screenshot 1: 8% diff (96,290 pixels) - Main Menu
  - Screenshot 2: 61% diff (740,780 pixels) - Story Scene
  - Screenshots 3-9: 93-96% diff (1.1M+ pixels) - Various scenes

### Issues Identified
1. **Main Menu (8% diff)** - Minor differences, likely font/scaling
2. **Story Scene (61% diff)** - Major rendering issues
3. **Later scenes (93-96% diff)** - Almost completely different

## Root Cause Analysis

### Likely Issues
1. **Image Loading**: Collections and pictures may not be loading correctly
2. **Async Loading**: Images loaded async but not awaited properly
3. **Scene Clearing**: `this.children.removeAll()` may be clearing too much
4. **Scaling/Positioning**: Images may not be scaled/positioned correctly
5. **Text Rendering**: Font differences causing layout issues

## Session 9 Goals

### Priority 1: Fix StoryScene Rendering
1. Debug image loading in StoryScene
2. Ensure backgrounds load before rendering
3. Ensure portraits load before rendering
4. Fix text bubble rendering
5. Verify scene layout matches C code

### Priority 2: Fix Scene Transitions
1. Verify MainMenuScene → StoryScene transition
2. Verify StoryScene → LocationScene transition
3. Ensure replay state persists across transitions

### Priority 3: Test and Verify
1. Run go.spec.ts and check improvements
2. Compare actual vs expected screenshots
3. Iterate on fixes

## Technical Approach

### StoryScene Fixes
1. Add proper async/await for image loading
2. Add loading indicators/logs
3. Verify ImageCatalog is working correctly
4. Check collection and picture IDs
5. Ensure proper z-ordering of elements

### Testing Strategy
1. Run tests frequently
2. Check actual screenshots in test-results/
3. Compare with expected screenshots
4. Use lower threshold temporarily to see progress
5. Focus on getting structure right first, then details

## Files to Modify
- `src-js/src/game/scenes/StoryScene.ts` - Fix rendering
- `src-js/src/game/services/ImageCatalog.ts` - Verify loading
- Possibly other scene files if issues found

## Success Criteria
- Screenshot 2 (Story Scene) diff < 10%
- Later screenshots show correct scene progression
- Test completes without timeout
- Replay system working across all scenes
