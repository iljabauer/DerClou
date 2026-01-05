# Der Clou! Port - TODO List

**Last Updated:** 2026-01-05 (Session 4)

## Current Sprint: Phase 1 - Living/Location System

### High Priority 🔴 (Phase 1: Living/Location System)

- [ ] Port living.c - Location and character management
  - [ ] livInit() - Initialize living system
  - [ ] livDone() - Cleanup
  - [ ] livRefreshAll() - Redraw all characters
  - [ ] livSetAllInvisible() - Hide all characters
  - [ ] livShowLocation() - Display location background
  
- [ ] Port bob.c - Character (bob) management
  - [ ] bobInit() - Initialize character system
  - [ ] bobSet() - Position character
  - [ ] bobWait() - Character idle animation
  - [ ] bobAnimate() - Play character animation

- [ ] Create TypeScript services
  - [ ] LivingService.ts - Location and character management
  - [ ] BobService.ts - Character animation and positioning
  - [ ] AnimationService.ts - Frame-based animations

- [ ] Integration and testing
  - [ ] Update GameScene to use LivingService
  - [ ] Load location backgrounds via ImageService
  - [ ] Position characters in scenes
  - [ ] Test with replay system
  - [ ] Visual regression testing

### Medium Priority 🟡 (Phase 2: Dialog System)

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

## Blocked ⛔

None currently.

## Notes

- Focus on data loading first - it's the foundation for everything else
- Keep replay system working at all times
- Commit after every file edit
- Test frequently with visual regression
