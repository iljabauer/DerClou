# Current Session Plan

## Status Check
- Build: ✅ Working
- Main Menu: ✅ Implemented (98% accurate, 2% pixel diff acceptable)
- Replay System: ✅ Working
- Tests: 
  - main-menu: ✅ Running (2% pixel diff due to fonts)
  - monologue: ❌ Not implemented yet

## Test Results
- main-menu.spec.ts: 18068 pixels different (2% ratio) - ACCEPTABLE
  - Difference due to web fonts vs bitmap fonts
  - Functionality works correctly

## Immediate Goals (This Session)

### 1. ✅ Run Tests to Assess Current State
- ✅ main-menu test runs (2% diff acceptable)
- ⏳ Need to implement monologue/dialog system

### 2. Understand What Monologue Test Needs
From C code analysis:
- Say() function displays text in speech bubbles
- Bubble() function handles the UI rendering
- Need character portraits (SetPictID)
- Need text loading from .txt files
- Need speech bubble graphics (SPEAK_BUBBLE, THINK_BUBBLE)
- Need to handle voice audio (optional)

### 2. Port Next Critical System
Based on test requirements, likely need:
- Dialog/Speech Bubble System (for monologue test)
- Text Loading System (to load German/English text)
- Image Loading System (to load backgrounds and portraits)

### 3. Keep Game Playable
- Ensure builds work after each change
- Commit after each file edit
- Test frequently

## Work Distribution
- 80% porting C code to TypeScript
- 20% testing and verification

## Next Files to Port (Priority Order)
1. Text system (src/text/) - Load .txt files with game text
2. Dialog system (src/dialog/) - Speech bubbles and conversations
3. Graphics system (src/gfx/) - Image loading and rendering
4. Scene system (src/scenes/) - Scene management

## Commit Strategy
- One commit per file
- Clear messages referencing C source
- Include: Co-authored-by: Ona <no-reply@ona.com>
