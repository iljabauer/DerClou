# Der Clou Porting Plan - C to Phaser/TypeScript

## Current Status
- Basic Phaser project structure exists in src-js/
- Replay system is partially implemented
- Main menu test exists but needs implementation
- Build system works (npm run build)

## Project Structure Analysis

### C Source (src/)
- **base/**: Core engine functionality
- **gfx/**: Graphics system
- **text/**: Text rendering and localization
- **dialog/**: Dialog system
- **scenes/**: Game scenes
- **gameplay/**: Game logic
- **planing/**: Planning phase
- **present/**: Presentation layer
- **inphdl/**: Input handling
- **replay/**: Replay system
- **sound/**: Audio system
- **data/**: Database and data management
- **disk/**: File I/O
- **story/**: Story/narrative system
- **living/**: Character/NPC system
- **organisa/**: Organization/management
- **landscap/**: Landscape/location system
- **anim/**: Animation system
- **intro/**: Intro sequences
- **list/**: List data structures
- **memory/**: Memory management
- **random/**: Random number generation
- **error/**: Error handling
- **port/**: Platform-specific code

### TypeScript Target (src-js/src/)
- **game/main.ts**: Game configuration
- **game/scenes/**: Phaser scenes
- **game/services/**: Core services (Replay, Input)

## Porting Strategy

### Phase 1: Core Systems (Foundation)
1. **Input System** ✓ (Partially done - ReplayService, InputHandler)
2. **Graphics System** - Port basic rendering
3. **Text System** - Port text rendering and localization
4. **Resource Loading** - Port asset loading

### Phase 2: Game Structure
5. **Scene Management** - Port scene system to Phaser scenes
6. **Main Menu** - Implement main menu (test exists)
7. **Dialog System** - Port dialog/conversation system
8. **UI Components** - Port UI elements

### Phase 3: Game Logic
9. **Data/Database** - Port game data structures
10. **Character System** - Port living/NPC system
11. **Location System** - Port landscape/location system
12. **Planning System** - Port planning phase
13. **Execution System** - Port burglary execution

### Phase 4: Advanced Features
14. **Story System** - Port narrative/story system
15. **Save/Load** - Port disk I/O for saves
16. **Sound System** - Port audio
17. **Animation System** - Port animations
18. **Intro Sequences** - Port intro

### Phase 5: Polish
19. **Testing** - Ensure all Playwright tests pass
20. **Bug Fixes** - Fix issues found during testing
21. **Code Quality** - Refactor and improve code
22. **Documentation** - Update docs

## Current Status Update
- Main menu scene created and functional
- All three menu items display correctly
- Replay system integrated
- Test shows 2% pixel difference due to:
  - Web font vs original bitmap font
  - Placeholder building graphics vs actual game assets
  
## Next Steps (Immediate)
1. ✅ Main menu structure complete
2. TODO: Port bitmap font system for pixel-perfect rendering
3. TODO: Load actual background images
4. Continue with other game systems
5. Keep game playable

## Testing Strategy
- Run `npm run build` after each change
- Run Playwright tests frequently
- Focus on main_menu test first
- Keep replay system working
- Test manually when possible

## Commit Strategy
- One commit per file edit
- Clear commit messages
- Reference C source file when porting
- Include Co-authored-by: Ona <no-reply@ona.com>
