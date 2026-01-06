# Current Session Plan

## Session 2 Summary - COMPLETED ✅

### Achievements
1. ✅ Created TextService - XOR decoding, text loading from TEXTS directory
2. ✅ Created DialogService - Speech/think bubbles, basic rendering
3. ✅ Created ImageService - Image catalog system (placeholder graphics)
4. ✅ Updated MainMenuScene - Now loads text from MENUD.TXT dynamically
5. ✅ Created MonologueScene - Basic structure for dialog sequences
6. ✅ All builds passing
7. ✅ Main menu test still passing (2% pixel diff acceptable)

### Core Services Implemented
- **TextService**: Load and decode game text files (XOR 0x75)
- **DialogService**: Display speech bubbles with text
- **ImageService**: Manage game images by ID (placeholders for now)

### Infrastructure
- Symlink to TEXTS directory in public folder
- Text files loading correctly
- Build system working perfectly

### What's Next
The monologue test requires:
1. Full game flow implementation (main menu → new game → story)
2. Scene transition system
3. Story system integration
4. Character portrait loading
5. Actual game graphics (IFF/ILBM conversion)

This is a larger task that requires understanding the full game architecture.
For now, focus on continuing to port core systems.

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
