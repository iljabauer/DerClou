# Source Tree Analysis

## Project Overview

**Root Path:** `/Users/ibauer/_ITS/DerClou`

The project is structured as a **multi-part** repository containing:
1.  **DerClou Core**: The main game engine and logic (C/SDL2).
2.  **Web Client**: A web-based frontend/port (TypeScript/Phaser).

## Directory Structure

### Part 1: DerClou Core (Game)
**Path:** `/` (Project Root)

The Core part contains the original game implementation in C, using SDL2 for the abstraction layer.

```bash
/Users/ibauer/_ITS/DerClou/
├── CMakeLists.txt           # [Build] CMake build configuration
├── src/
│   ├── base/                # [Core] Entry point and system initialization
│   │   ├── base.c           # ★ ENTRY POINT: tcStartGame(), main loop integration
│   │   └── fullenv.c        # Full environment setup (cheats/debug)
│   ├── gameplay/            # [Logic] High-level game flow and story management
│   │   ├── gp.c             # ★ Game Loop: PlayStory(), scene transition logic
│   │   └── gp_app.c         # Gameplay application state
│   ├── inphdl/              # [Input] Input handling and Timing
│   │   ├── inphdl.c         # ★ Fixed time step loop, SDL Event dispatching
│   │   └── inphdl.h         # Input definitions
│   ├── data/                # [Data] Database and Asset management
│   │   ├── database.c       # Object loading/saving (Serialize C structs)
│   │   ├── relation.c       # Entity relationship management
│   │   └── tcdata.h         # Data structures (Person, Car, Evidence, etc.)
│   ├── scenes/              # [Content] Scene-specific logic implementation
│   │   ├── scenes.c         # Standard scenes (Go, Look, Wait)
│   │   ├── cars.c           # Car dealer/theft scenes
│   │   └── evidence.c       # Evidence generation/handling
│   ├── anim/                # [Engine] Animation system
│   │   └── sysanim.c        # System animation handling
│   ├── dialog/              # [Engine] Dialog system
│   │   └── dialog.c         # NPC conversation logic
│   ├── intro/               # [Content] Intro sequence
│   │   └── intro.c          # Intro movie/animation logic
│   └── memory/              # [Core] Memory management wrappers
│       └── memory.c         # MemAlloc/MemFree custom allocators
└── docs/                    # [Docs] Generated documentation output
```

### Part 2: Web Client (Web)
**Path:** `/src-js`

The Web Client is a modern port/frontend using TypeScript, Vite, and Phaser.js.

```bash
/Users/ibauer/_ITS/DerClou/src-js/
├── package.json             # [Config] Dependencies (Phaser, TypeScript, Vite)
├── vite/                    # [Config] Vite build configurations
│   ├── config.dev.mjs       # Development build config
│   └── config.prod.mjs      # Production build config
├── src/
│   ├── main.ts              # ★ ENTRY POINT: DOM loaded listener, initializes game
│   ├── vite-env.d.ts        # Type definitions
│   └── game/                # [Logic] Phaser Game Instance
│       ├── main.ts          # Game Config (1024x768, Scale.FIT) & Initialization
│       ├── scenes/          # [Content] Phaser Scenes
│       │   ├── Game.ts      # Main game scene (menu/logo)
│       │   ├── ReplayTestScene.ts     # [Test] Replay system verification scene
│       │   └── ScreenshotTestScene.ts # [Test] Screenshot system verification scene
│       └── services/        # [Logic] Game Services
│           ├── InputHandler.ts        # Input management (Keyboard/Mouse)
│           ├── Random.ts              # Deterministic RNG (LCG)
│           ├── ReplayService.ts       # Replay recording/playback logic
│           └── ScreenshotService.ts   # Screenshot capture logic
```

## Critical Files & Entry Points

### Core (C/SDL2)
*   **Entry Point:** `src/base/base.c` -> `tcStartGame`
    *   Initializes subsystems (`tcInit`).
    *   Starts the main loop (`tcDo`).
*   **Game Loop:** `src/gameplay/gp.c` -> `PlayStory`
    *   Manages the sequence of scenes.
    *   `src/inphdl/inphdl.c` manages the low-level fixed time step and input pumping.
*   **Data Model:** `src/data/tcdata.h` & `src/data/database.c`
    *   Defines the binary file formats and in-memory structures for all game objects.

### Web Client (TypeScript)
*   **Entry Point:** `src-js/src/main.ts`
    *   Listens for `DOMContentLoaded` and calls `StartGame`.
*   **Game Configuration:** `src-js/src/game/main.ts`
    *   Sets up the `Phaser.Game` instance with resolution `1024x768`.

## Integration Points

Currently, the two parts appear to be **independent**:
1.  **Core** is a standalone C application compiling to a native executable (or potentially Emscripten, based on CMake presence).
2.  **Web Client** is a separate TypeScript codebase, seemingly a reimplementation or a web frontend.
3.  *Potential Integration:* The CMake file references Emscripten, suggesting the Core might be compiled to WASM and potentially embedded or used by a web layer, but `src-js` looks like a pure Phaser implementation. Further integration checks (Step 7) will confirm if they communicate.
