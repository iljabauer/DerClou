# Der Clou! Port - TODO List

**Last Updated:** 2026-01-05 (Session 5)

## Current Sprint: Phase 2 - Dialog System

### High Priority 🔴 (Phase 2: Dialog System - Continued)

- [ ] Complete DynamicTalk() implementation
  - [ ] Person data structure integration
  - [ ] Knowledge tracking system
  - [ ] Dialog tree navigation
  - [ ] Question/answer system
  - [ ] Talk bits handling

- [ ] Character portrait display
  - [ ] Load character portraits
  - [ ] Display in dialog bubbles
  - [ ] Portrait positioning

- [ ] Dialog tree system
  - [ ] Parse dialog text with keywords
  - [ ] Handle conversation flow
  - [ ] Choice evaluation
  - [ ] State management

### Medium Priority 🟡 (Replay System Fix)

- [ ] Debug replay system screenshot generation
  - [ ] Check NW.js screenshot capture in headless mode
  - [ ] Verify ScreenshotService integration
  - [ ] Test with simple replay file
  - [ ] Fix visual regression testing

### Medium Priority 🟡 (Phase 2: Dialog System - Application Logic)

- [ ] Port dialog.c - Core dialog system
  - [ ] Say() - Display dialog with choices
  - [ ] Bubble() - Show bubble with text
  - [ ] SetBubbleType() - Set bubble style
  
- [ ] Port talkappl.c - Dialog application logic
  - [ ] Dialog tree navigation
  - [ ] Choice evaluation
  - [ ] State management

- [ ] Create DialogService.ts and ConversationService.ts
- [ ] Integration with TextService and UIService

### Low Priority 🟢 (Future Phases)

- [ ] Phase 3: Scene/Story System (src/story/, src/scenes/)
- [ ] Phase 4: Interaction System (src/present/interac.c)
- [ ] Phase 5: Landscape System (src/landscap/)
- [ ] Phase 6: Planning System (src/planing/)
- [ ] Phase 7: Gameplay Systems (src/gameplay/)
- [ ] Phase 8: Polish & Optimization

## Completed ✅

### Core Systems
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
- [x] Create DatFileParser with all 18 object types:
  - Person, Player, Car, Building, Tool
  - Loot, Evidence, Environment
  - Location, Ability, Item, London
  - CompleteLoot, LSLock, LSObject, LSRoom
  - Police, LSArea
- [x] Create RelFileParser for text-based relations
- [x] Create DataLoader service
- [x] Load TCMAIN.DAT and TCBUILD.DAT
- [x] Load all building-specific files (*ETA*.DAT, *ETA*.REL)
- [x] Create DataLoaderTestScene for testing

### Phase 1: Living/Location System (Complete)
- [x] Port living.c - Location and character management
- [x] Port bob.c functionality into LivingService
- [x] Create LivingService.ts - Character management
- [x] Create BackgroundService.ts - Location backgrounds
- [x] Load animation templates from TEMPLATE.LST
- [x] Load character data from LIVINGS.LST
- [x] Load ALLMAXI sprite sheet (Collection ID 137)
- [x] Implement frame-based animation with cropping
- [x] Create LivingTestScene for testing
- [x] Character positioning and visibility
- [x] Animation state management

### Phase 2: Dialog System (In Progress)
- [x] Port Say() function from dialog.c
- [x] Create DialogService.ts
- [x] Add text file ID constants (BUSINESS_TXT, TALK_0_TXT, TALK_1_TXT)
- [x] Implement bubble() and think() helpers
- [x] Add getTextLines() to TextService
- [x] Create DialogTestScene for testing
- [ ] Complete DynamicTalk() implementation
- [ ] Character portrait display
- [ ] Dialog tree navigation
- [ ] Knowledge tracking system

## Blocked ⛔

None currently.

## Notes

- Focus on data loading first - it's the foundation for everything else
- Keep replay system working at all times
- Commit after every file edit
- Test frequently with visual regression
