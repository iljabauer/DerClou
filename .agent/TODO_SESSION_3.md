# Der Clou! Port - TODO List (Session 3 Update)

**Last Updated:** 2026-01-05 (Session 3)

## Current Sprint: Scene and Gameplay Systems

### High Priority 🔴

- [x] Port text system (src/text/) - COMPLETE
- [x] Port image system (src/gfx/) - COMPLETE
  - [x] Create ImageService.ts
  - [x] Load COLL.LST (collection list)
  - [x] Implement ILBM decoder (ILBMDecoder.ts)
  - [x] Direct loading of Amiga IFF images
  - [x] ImageTestScene for testing
- [x] Port presentation layer (src/present/) - COMPLETE
  - [x] PresentationService for object display
  - [x] Support for persons, buildings, tools, cars, loot
  - [x] Text, bar, and number display modes
  - [x] PresentationTestScene for testing
- [ ] Port scene/story system (src/scenes/, src/story/)
  - [ ] Basic scene management
  - [ ] Scene transitions
  - [ ] Story progression
  - [ ] Scene graph execution
- [ ] Port location/building system (src/organisa/)
  - [ ] Building navigation
  - [ ] Room/area management
  - [ ] Object interaction

### Medium Priority 🟡

- [ ] Port dialog system (src/dialog/)
  - [ ] Conversation trees
  - [ ] NPC interactions
  - [ ] Dynamic text insertion
  - [ ] Choice menus
- [ ] Port planning system (src/planing/)
  - [ ] Burglary planning interface
  - [ ] Team management
  - [ ] Equipment selection
  - [ ] Time planning
- [ ] Port gameplay mechanics (src/gameplay/)
  - [ ] Burglary execution
  - [ ] Guard AI
  - [ ] Evidence system
  - [ ] Police system

### Low Priority 🟢

- [ ] Port animation system (src/anim/)
- [ ] Save/load system
- [ ] UI polish and optimization
- [ ] Performance profiling
- [ ] Code cleanup and documentation

## Completed ✅

### Session 3 (2026-01-05)
- [x] ILBM decoder (ILBMDecoder.ts)
- [x] ImageService integration with ILBM
- [x] ImageTestScene
- [x] PresentationService
- [x] PresentationTestScene
- [x] Documentation updates

### Session 2 (Previous)
- [x] Data loading system (all 18 object types)
- [x] Text system with XOR decryption
- [x] UI system (menus and bubbles)
- [x] DataLoaderTestScene
- [x] TextTestScene
- [x] UITestScene

### Session 1 (Previous)
- [x] Core architecture
- [x] Replay system
- [x] Database system
- [x] GameState management
- [x] SceneManager
- [x] Basic renderer

## Statistics

- **Total TypeScript Files:** 37
- **Total Lines of Code:** ~6,700
- **C Source Files to Port:** 131
- **Completion:** ~25% (core systems)

## Next Session Goals

1. Port basic scene management
2. Implement location/building navigation
3. Create test scenes for navigation
4. Begin planning system port
5. Test with replay system

## Notes

- Image system is production-ready
- All 181 images can be loaded directly
- Presentation system provides UI foundation
- Ready for gameplay system integration
- Replay system remains functional
