# Architecture: DerClou Core

## Executive Summary
**DerClou Core** is the primary game engine and logic implementation for the project. It is a legacy codebase written in **C** using **SDL2** for hardware abstraction (Graphics, Input, Audio). The architecture follows a classic **Procedural Game Loop** pattern with a custom Object-Oriented-like data system managed via C structures and binary serialization.

## Technology Stack
*   **Language:** C (Standard C99/C11 style)
*   **Core Library:** SDL2 (Windowing, Input, Graphics, Audio)
*   **Build System:** CMake (w/ Conan for dependency management)
*   **Target Platforms:** Desktop (Windows/Linux/macOS) and Web (via Emscripten)

## Architecture Pattern
**Game Loop with Scene Management**

The application is driven by a custom **Fixed Time Step** loop handling input and simulation, coupled with a high-level **Scene State Machine**.

### 1. The Game Loop (`inphdl.c`)
The inputs and timing are managed in `inphdl/inphdl.c`.
*   **Mechanism:** It uses `SDL_GetPerformanceCounter` to track time.
*   **Fixed Step:** Logic updates occur at a fixed frequency (60Hz default).
*   **Accumulator:** Uses an accumulator pattern to perform multiple simulation ticks (`inpSimulateOneTick()`) per frame if the rendering lags, ensuring deterministic logic speed.
*   **Input Pump:** `inpPumpEvents()` drains the SDL event queue and maps raw SDL events to internal game actions (e.g., `INP_LEFT`, `INP_LBUTTONP`).

### 2. Scene Management (`gameplay/gp.c`)
The high-level game flow is controlled by `PlayStory()` in `gp.c`.
*   **Structure:** The game consists of "Scenes" stored in the global `film` structure.
*   **Scenes:** Each scene has lifecycle function pointers:
    *   `Init()`: Setup visuals/state.
    *   `Done()`: Cleanup.
*   **Transition:** State transitions are determined by `SceneArgs.ReturnValue` (the next scene ID) and logic checks (`CheckConditions()`).
*   **Legacy Logic:** Much of the "Story" logic is data-driven, loaded from binary files (`DATA_DIRECTORY`), defining the graph of scenes.

## Data Architecture

The game uses a custom database system implemented in `data/database.c`.

### Object System
Game entities are strictly typed C structures defined in `data/tcdata.h`. They are loaded from binary files (`MAIN.DAT`, etc.). The system mimics OOP by using a generic `dbObject` header.

**Key Data Models:**
*   **Person:** NPCs and Player stats (Skills, Health, Mood).
*   **Car:** Vehicles with stats (Speed, Condition).
*   **Building:** Target locations for heists (Security level, Loot).
*   **Tool:** Equipment for burglary.
*   **Loot / Evidence:** Items generated during gameplay.
*   **Environment:** Global game state flags.

### Persistence
*   **Binary format:** Custom binary serialization (`dskRead`/`dskWrite`) handling endianness manually (`EndianW`, `EndianL`).
*   **Relations:** A relational system (`relation.c`) links objects (e.g., Person A owns Tool B).

## Subsystems

### Input Handling (`inphdl/`)
*   Supports Keyboard, Mouse, and Joystick.
*   Abstracts hardware events into bitmasks (`int32_t action`).
*   Includes built-in **Replay System** hooks (`Replay_RecordInput`, `Replay_GetInput`) to support deterministic playback for testing.

### Memory Management (`memory/`)
*   Wrappers around `malloc`/`free` (`MemAlloc`, `MemFree`) to track usage and detect leaks.

### Graphics & Animation
*   **Anim:** `src/anim/sysanim.c` handles frame-based animations.
*   **Gfx:** SDL2-based rendering. (Note: Codebase contains references to "Blit" and palette management, legacy from original Amiga/VGA roots, now emulated/wrapped on SDL surface).

## Development Workflow

1.  **Build:**
    *   Use `devbox shell` (recommended) or ensure Conan/CMake are installed.
    *   Run `./build-pc.sh` for native build.
    *   Run `./build-web.sh` for Emscripten build.
2.  **Run:**
    *   Executable output is placed in `gamedata/DerClou`.
    *   Run from the `gamedata/` directory to ensure assets are found.
