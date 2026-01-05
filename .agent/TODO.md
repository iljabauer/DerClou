# Der Clou! Port - TODO List

**Last Updated:** 2026-01-05

## Current Sprint: Complete Data Loading System

### High Priority 🔴

- [x] Test current data loading with TCMAIN.DAT and TCBUILD.DAT
- [x] Add parsers for remaining object types in DatFileParser.ts:
  - [x] Loot
  - [x] Evidence
  - [x] Environment
  - [x] LSObject
  - [x] Ability
  - [x] LSLock
  - [x] CompleteLoot
  - [x] Item
  - [x] Location
  - [x] London
  - [x] LSRoom
- [ ] Load building-specific data files (*ETA0.DAT, *ETA1.DAT, etc.)
- [ ] Verify object counts match C version
- [ ] Load object names from text files
- [ ] Add Building type parser (currently missing)

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
- [x] Create BinaryReader
- [x] Create DatFileParser with all object types
- [x] Create RelFileParser
- [x] Create DataLoader service
- [x] Create DataLoaderTestScene
- [x] Add all object type interfaces (Location, Ability, Item, London, CompleteLoot, LSLock, LSObject, LSRoom)
- [x] Implement parsers for all object types

## Blocked ⛔

None currently.

## Notes

- Focus on data loading first - it's the foundation for everything else
- Keep replay system working at all times
- Commit after every file edit
- Test frequently with visual regression
