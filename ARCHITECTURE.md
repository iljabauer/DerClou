# Architecture Overview

## System Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                      Phaser Scene                           │
│                     (GameScene.ts)                          │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                     Game Engine                             │
│                   (GameEngine.ts)                           │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  • Integrates all systems                            │  │
│  │  • Manages game loop                                 │  │
│  │  • Handles replay playback                           │  │
│  │  • Screenshot capture                                │  │
│  └──────────────────────────────────────────────────────┘  │
└───┬─────────┬──────────┬──────────┬──────────┬─────────────┘
    │         │          │          │          │
    ▼         ▼          ▼          ▼          ▼
┌────────┐ ┌──────┐ ┌─────────┐ ┌────────┐ ┌─────────┐
│Database│ │State │ │ Scene   │ │Renderer│ │ Input   │
│        │ │      │ │ Manager │ │        │ │ Handler │
└────────┘ └──────┘ └─────────┘ └────────┘ └─────────┘
    │         │          │          │          │
    │         │          │          │          ▼
    │         │          │          │     ┌─────────┐
    │         │          │          │     │ Replay  │
    │         │          │          │     │ Service │
    │         │          │          │     └─────────┘
    │         │          │          │          │
    │         │          │          │          ▼
    │         │          │          │     ┌─────────┐
    │         │          │          │     │ Random  │
    │         │          │          │     │   RNG   │
    │         │          │          │     └─────────┘
    │         │          │          │
    ▼         ▼          ▼          ▼
┌─────────────────────────────────────────────────────────────┐
│                      Game Data                              │
│  • Objects (Person, Car, Building, Tool, etc.)             │
│  • Relations (Has, Knows, LivesIn, etc.)                   │
│  • State (Scene, Time, Flags, Variables)                   │
└─────────────────────────────────────────────────────────────┘
```

## Data Flow

### Normal Mode

```
User Input → Phaser Scene → Game Engine → Scene Manager → Current Scene
                                  ↓
                            Update State
                                  ↓
                            Update Database
                                  ↓
                            Render UI
```

### Replay Mode

```
Replay File → Replay Service → Input Handler → Game Engine
                                                    ↓
                                              Simulate Tick
                                                    ↓
                                              Scene Manager
                                                    ↓
                                              Current Scene
                                                    ↓
                                              Update State
                                                    ↓
                                              Screenshot
```

## Component Responsibilities

### GameEngine
- **Purpose**: Central coordinator
- **Responsibilities**:
  - Initialize all systems
  - Run game loop
  - Handle replay mode
  - Capture screenshots
  - Manage tick simulation

### Database
- **Purpose**: Object storage and relations
- **Responsibilities**:
  - Store game objects by ID
  - Manage relations between objects
  - Query objects by type
  - Type-safe access

### GameState
- **Purpose**: Global game state
- **Responsibilities**:
  - Track current scene
  - Manage game time
  - Store flags and variables
  - Serialize/deserialize state

### SceneManager
- **Purpose**: Scene lifecycle
- **Responsibilities**:
  - Register scenes
  - Handle scene transitions
  - Call init/update/done
  - Manage scene stack

### Renderer
- **Purpose**: UI rendering
- **Responsibilities**:
  - Draw text with styles
  - Draw shapes
  - Create buttons/menus
  - Display images

### InputHandler
- **Purpose**: Input simulation
- **Responsibilities**:
  - Simulate ticks
  - Get replay input
  - Track simulation time
  - Coordinate with RNG

### ReplayService
- **Purpose**: Replay file handling
- **Responsibilities**:
  - Load binary replay files
  - Parse header and records
  - Provide input at specific ticks
  - Verify RNG checksums

### Random
- **Purpose**: Deterministic RNG
- **Responsibilities**:
  - Generate random numbers
  - Maintain RNG state
  - Calculate checksums
  - Support fixed seeds

## Scene Lifecycle

```
┌──────────────────────────────────────────────────────────┐
│                    Scene Lifecycle                       │
└──────────────────────────────────────────────────────────┘

    Start Scene
         │
         ▼
    ┌─────────┐
    │  init() │  ← Setup scene, create UI
    └────┬────┘
         │
         ▼
    ┌──────────┐
    │ update() │  ← Called every frame
    └────┬─────┘
         │
         ├─→ Return null: Stay in scene
         │
         └─→ Return SceneId: Transition to new scene
                  │
                  ▼
             ┌─────────┐
             │ done()  │  ← Cleanup
             └─────────┘
                  │
                  ▼
             Start New Scene
```

## Object Relationships

```
┌──────────────────────────────────────────────────────────┐
│                   Object Relations                       │
└──────────────────────────────────────────────────────────┘

Person ──has──→ Tool
   │
   ├──has──→ Car
   │
   ├──knows──→ Person
   │
   ├──livesIn──→ Building
   │
   └──learned──→ Ability

Building ──has──→ Loot
    │
    └──has──→ LSObject (Lock, Alarm, etc.)
```

## Type Hierarchy

```
GameObject (base)
    │
    ├── Person
    │     └── Player (extends Person)
    │
    ├── Car
    │
    ├── Building
    │
    ├── Tool
    │
    ├── Loot
    │
    ├── Evidence
    │
    ├── Environment
    │
    └── Scene
```

## Replay System Flow

```
┌──────────────────────────────────────────────────────────┐
│                   Replay System                          │
└──────────────────────────────────────────────────────────┘

1. Load Replay File
   ├── Read header (magic, version, seed)
   └── Read records (tick, action, checksum)

2. Initialize RNG
   └── Seed with replay seed

3. For each tick:
   ├── Get input from replay
   ├── Verify RNG checksum
   ├── Simulate game logic
   ├── Update RNG state
   └── Capture screenshot (if action)

4. Complete
   └── Exit or continue
```

## Module Dependencies

```
GameScene (Main Phaser Scene)
    └── GameEngine
            ├── Database
            ├── GameState
            ├── SceneManager
            │       ├── MainMenuScene
            │       └── LondonScene
            ├── Renderer
            └── InputHandler
                    └── ReplayService
                            └── Random
```

## File Organization

```
src-js/src/game/
│
├── core/                    # Core systems (no external deps)
│   ├── Database.ts         # Object storage
│   ├── GameState.ts        # Global state
│   ├── SceneManager.ts     # Scene lifecycle
│   ├── Renderer.ts         # UI rendering (depends on Phaser)
│   ├── GameEngine.ts       # Main engine (depends on all)
│   └── index.ts            # Barrel export
│
├── types/                   # Type definitions (no deps)
│   ├── GameTypes.ts        # Game objects
│   ├── SceneTypes.ts       # Scene types
│   └── index.ts            # Barrel export
│
├── services/                # Utility services
│   ├── ReplayService.ts    # Replay file handling
│   ├── InputHandler.ts     # Input simulation
│   ├── Random.ts           # Deterministic RNG
│   └── ScreenshotService.ts
│
├── scenes/                  # Phaser scenes
│   ├── GameScene.ts        # Main Phaser scene
│   ├── MainMenuScene.ts    # Main menu
│   ├── LondonScene.ts      # London hub
│   └── ReplayTestScene.ts  # Original replay test
│
└── utils/                   # Helper functions
    └── Helpers.ts
```

## Design Patterns

### Singleton Pattern
- `db` (Database instance)
- `gameState` (GameState instance)
- `sceneManager` (SceneManager instance)

### Factory Pattern
- Scene creation and registration

### Observer Pattern
- Scene lifecycle callbacks (init, update, done)

### Strategy Pattern
- Different rendering strategies (text, shapes, images)

### State Pattern
- Scene management (current scene state)

## Performance Considerations

### Optimization Points
1. **Object Pooling**: Reuse objects instead of creating new ones
2. **Lazy Loading**: Load assets on demand
3. **Spatial Partitioning**: For collision detection (future)
4. **Caching**: Cache frequently accessed data

### Current Performance
- Target: 60 FPS (16.67ms per frame)
- Overhead: Minimal (mostly Phaser)
- Bottlenecks: None yet (no heavy computation)

## Testing Strategy

### Unit Tests (Future)
- Test individual components in isolation
- Mock dependencies
- Use Jest or similar

### Integration Tests
- Test component interactions
- Use replay files
- Verify state changes

### Visual Regression
- Compare screenshots
- Detect visual changes
- Automated with script

## Extension Points

### Adding New Object Types
1. Add to `ObjectType` enum
2. Create interface extending `GameObject`
3. Update Database queries if needed

### Adding New Relations
1. Add to `RelationType` enum
2. Use existing Database methods

### Adding New Scenes
1. Create scene object with `GameScene` interface
2. Register with `sceneManager`
3. Implement init/update/done

### Adding New Systems
1. Create class in `core/`
2. Integrate with `GameEngine`
3. Export from `core/index.ts`

## Migration Path from C

### Step 1: Understand C Code
- Read C implementation
- Identify data structures
- Understand algorithms

### Step 2: Define Types
- Create TypeScript interfaces
- Match C structs

### Step 3: Port Logic
- Translate C to TypeScript
- Maintain same behavior
- Keep deterministic

### Step 4: Test
- Use replay files
- Compare with C version
- Verify checksums

### Step 5: Integrate
- Add to GameEngine
- Update scenes
- Document changes
