# Der Clou! Port - TODO List

**Last Updated:** 2026-01-05

## Current Sprint: Image Conversion & Basic UI

### High Priority 🔴

- [x] Port text system (src/text/) - COMPLETE
  - [x] Create TextService.ts with XOR decryption
  - [x] Load TEXTS.LST (text file list)
  - [x] Load individual text files with language support
  - [x] Implement key-based text lookup
  - [x] Add text formatting support
- [x] Port image system structure (src/gfx/) - PARTIAL
  - [x] Create ImageService.ts
  - [x] Load COLL.LST (collection list)
  - [ ] Convert IFF ILBM images to PNG/WebP OR implement ILBM decoder
- [ ] Create image conversion tool/script
- [ ] Port basic UI system (src/present/interac.c)
  - [ ] Menu system
  - [ ] Bubble/dialog display
  - [ ] Choice handling

### Medium Priority 🟡

- [ ] Port text system (src/text/)
  - [ ] Load text files from gamedata/TEXTS/
  - [ ] Multi-language support
  - [ ] Text rendering with formatting
- [ ] Port graphics system (src/gfx/)
  - [ ] Load images from gamedata/PICTURES/
  - [ ] Convert to web formats
  - [ ] Sprite management
  - [ ] Background rendering
- [ ] Port dialog system (src/dialog/)
  - [ ] Conversation trees
  - [ ] NPC interactions
  - [ ] Choice menus

### Low Priority 🟢

- [ ] Port planning system (src/planing/)
- [ ] Port burglary mechanics (src/gameplay/)
- [ ] Port story system (src/story/)
- [ ] Save/load system
- [ ] UI polish and optimization

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
