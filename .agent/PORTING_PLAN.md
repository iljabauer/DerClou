# Der Clou! TypeScript Port - Detailed Porting Plan

**Created:** 2026-01-05
**Status:** Active Development

## Current Progress

**Lines of Code:**
- C Source: ~35,000 lines (72 files)
- TypeScript: ~6,000 lines (36 files)
- Progress: ~17% complete

**Completed Systems:** ✅
1. Core Architecture (Database, GameState, SceneManager, Renderer, GameEngine)
2. Replay System (deterministic, screenshot comparison)
3. Data Loading (all 18 object types from .DAT files)
4. Text System (XOR decryption, multi-language support)
5. Image System (ILBM decoder, direct Amiga image loading)
6. UI System (menus, bubbles, keyboard/mouse navigation)
7. Presentation System (object property display)

## Phase 1: Living/Location System (CURRENT)

**Priority:** CRITICAL
**Estimated Effort:** 3-5 sessions
**C Files:** `src/living/living.c`, `src/living/bob.c`

### Goals
- Render location backgrounds with characters
- Position characters (bobs) in scenes
- Handle character animations and states
- Integrate with existing ImageService

### Tasks
1. Port `living.c` - Location and character management
   - `livInit()` - Initialize living system
   - `livDone()` - Cleanup
   - `livRefreshAll()` - Redraw all characters
   - `livSetAllInvisible()` - Hide all characters
   - `livShowLocation()` - Display location background
   
2. Port `bob.c` - Character (bob) management
   - `bobInit()` - Initialize character system
   - `bobSet()` - Position character
   - `bobWait()` - Character idle animation
   - `bobAnimate()` - Play character animation

3. Create TypeScript services
   - `LivingService.ts` - Location and character management
   - `BobService.ts` - Character animation and positioning
   - `AnimationService.ts` - Frame-based animations

4. Integration
   - Update GameScene to use LivingService
   - Load location backgrounds via ImageService
   - Position characters in scenes
   - Test with replay system

### Success Criteria
- ✅ Location backgrounds display correctly
- ✅ Characters appear in correct positions
- ✅ Basic character animations work
- ✅ Replay system still functions
- ✅ Visual regression tests pass

## Phase 2: Dialog System

**Priority:** CRITICAL
**Estimated Effort:** 4-6 sessions
**C Files:** `src/dialog/dialog.c`, `src/dialog/talkappl.c`

### Goals
- Implement conversation system
- Handle dialog trees and choices
- Integrate with TextService and UIService
- Support NPC interactions

### Tasks
1. Port `dialog.c` - Core dialog system
   - `Say()` - Display dialog with choices
   - `Bubble()` - Show bubble with text
   - `SetBubbleType()` - Set bubble style (think/talk)
   
2. Port `talkappl.c` - Dialog application logic
   - Dialog tree navigation
   - Choice evaluation
   - State management

3. Create TypeScript services
   - `DialogService.ts` - Dialog management
   - `ConversationService.ts` - Conversation trees

4. Integration
   - Connect to TextService for text lookup
   - Use UIService for choice menus
   - Add character portraits
   - Test with story scenes

### Success Criteria
- ✅ Dialogs display with correct text
- ✅ Choices work with keyboard/mouse
- ✅ Character portraits show correctly
- ✅ Dialog state persists correctly
- ✅ Replay system handles dialogs

## Phase 3: Scene/Story System

**Priority:** CRITICAL
**Estimated Effort:** 5-7 sessions
**C Files:** `src/story/story.c`, `src/scenes/scenes.c`

### Goals
- Implement story progression
- Handle scene transitions
- Manage game events and triggers
- Support story-driven gameplay

### Tasks
1. Port `story.c` - Story management
   - Story scene handlers
   - Event triggers
   - Story state management
   
2. Port `scenes.c` - Scene system
   - `Go()` - Location navigation
   - `Information()` - Info menu
   - `Look()` - Examine objects
   - `Wait()` - Time progression

3. Create TypeScript services
   - `StoryService.ts` - Story progression
   - `SceneService.ts` - Scene management (extend existing)
   - `EventService.ts` - Event handling

4. Integration
   - Connect scenes to story system
   - Implement scene transitions
   - Add time progression
   - Test story flow

### Success Criteria
- ✅ Story progresses correctly
- ✅ Scene transitions work
- ✅ Time advances properly
- ✅ Events trigger correctly
- ✅ Replay matches original

## Phase 4: Interaction System

**Priority:** HIGH
**Estimated Effort:** 2-3 sessions
**C Files:** `src/present/interac.c`

### Goals
- Implement action menu (Go, Talk, Look, Wait, Think)
- Handle player interactions
- Connect to scene system

### Tasks
1. Port `interac.c` - Interaction handling
   - Action menu display
   - Input handling
   - Action execution
   
2. Create TypeScript services
   - `InteractionService.ts` - Player actions

3. Integration
   - Add action menu to GameScene
   - Connect to scene handlers
   - Test all actions

### Success Criteria
- ✅ Action menu displays
- ✅ All actions work correctly
- ✅ Keyboard shortcuts work
- ✅ Mouse interaction works

## Phase 5: Landscape System

**Priority:** HIGH
**Estimated Effort:** 4-5 sessions
**C Files:** `src/landscap/*.c`

### Goals
- Render building interiors
- Handle room navigation
- Display objects and characters in rooms
- Support planning view

### Tasks
1. Port landscape system
   - Room rendering
   - Object placement
   - Navigation
   
2. Create TypeScript services
   - `LandscapeService.ts` - Building interiors
   - `RoomService.ts` - Room management

3. Integration
   - Connect to LivingService
   - Add room navigation
   - Test with buildings

### Success Criteria
- ✅ Building interiors display
- ✅ Room navigation works
- ✅ Objects appear correctly
- ✅ Planning view functional

## Phase 6: Planning System

**Priority:** MEDIUM
**Estimated Effort:** 6-8 sessions
**C Files:** `src/planing/*.c`

### Goals
- Implement burglary planning interface
- Handle team management
- Support tool selection
- Time scheduling

### Tasks
1. Port planning system
   - Planning interface
   - Team management
   - Tool selection
   - Time scheduling
   
2. Create TypeScript services
   - `PlanningService.ts` - Planning logic
   - `TeamService.ts` - Team management

3. Integration
   - Add planning scenes
   - Connect to gameplay
   - Test planning flow

### Success Criteria
- ✅ Planning interface works
- ✅ Team management functional
- ✅ Tool selection works
- ✅ Time scheduling correct

## Phase 7: Gameplay Systems

**Priority:** MEDIUM
**Estimated Effort:** 8-10 sessions
**C Files:** `src/gameplay/*.c`, `src/planing/*.c`

### Goals
- Implement burglary execution
- Handle guards and alarms
- Support evidence system
- Implement success/failure conditions

### Tasks
1. Port gameplay systems
   - Burglary execution
   - Guard AI
   - Alarm system
   - Evidence tracking
   
2. Create TypeScript services
   - `BurglaryService.ts` - Burglary logic
   - `GuardService.ts` - Guard AI
   - `EvidenceService.ts` - Evidence tracking

3. Integration
   - Connect to planning
   - Add execution scenes
   - Test gameplay loop

### Success Criteria
- ✅ Burglary execution works
- ✅ Guards behave correctly
- ✅ Alarms trigger properly
- ✅ Evidence system functional

## Phase 8: Polish & Optimization

**Priority:** LOW
**Estimated Effort:** 3-5 sessions

### Goals
- Optimize performance
- Fix bugs
- Improve UI/UX
- Add missing features

### Tasks
1. Performance optimization
2. Bug fixes
3. UI polish
4. Code cleanup
5. Documentation

## Testing Strategy

### Continuous Testing
- Run replay after every major change
- Visual regression testing with screenshots
- Manual testing of new features

### Replay Testing
```bash
cd src-js
npm run build
npx nw . --replay-path=../gamedata/test_long.rec --screenshot-path=./test --headless
```

### Visual Regression
```bash
./tools/compare_screenshots.sh ./gamedata/test_long.rec ./test_screenshots 1000
```

### Manual Testing
```bash
cd src-js
npm run dev
```

## Commit Strategy

- Commit after every file edit
- Use descriptive commit messages
- Follow repository conventions
- Keep commits atomic and focused

## Risk Management

### High Risk Areas
1. **Replay System** - Must maintain determinism
2. **Animation System** - Complex timing and state
3. **Planning System** - Complex UI and logic
4. **Gameplay Systems** - Many interdependencies

### Mitigation
- Test replay frequently
- Keep changes small and focused
- Document complex logic
- Use TypeScript strict mode

## Success Metrics

### Code Coverage
- Target: 80% of C code ported
- Current: ~17%

### Functionality
- All story scenes playable
- Planning system functional
- Burglary execution works
- Save/load system works

### Quality
- No critical bugs
- Replay system works
- Visual regression tests pass
- Performance acceptable

## Timeline Estimate

**Total Estimated Sessions:** 35-50
**Current Session:** 4
**Estimated Completion:** 40-50 sessions

### Phase Breakdown
- Phase 1 (Living): Sessions 4-8
- Phase 2 (Dialog): Sessions 9-14
- Phase 3 (Story): Sessions 15-21
- Phase 4 (Interaction): Sessions 22-24
- Phase 5 (Landscape): Sessions 25-29
- Phase 6 (Planning): Sessions 30-37
- Phase 7 (Gameplay): Sessions 38-47
- Phase 8 (Polish): Sessions 48-50

## Notes

- Focus on 80/20 rule: 80% porting, 20% testing
- Maintain replay system at all costs
- Commit after every file edit
- Use .agent/ for planning and notes
- Test frequently with visual regression
- Keep code quality high
- Document complex systems

## Resources

- C Source: `src/`
- TypeScript: `src-js/src/game/`
- Game Data: `gamedata/`
- Screenshots: `screenshots/1/`
- Documentation: `.agent/`, `docs/`
- Tools: `tools/`
