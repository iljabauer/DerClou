# Replay System Documentation

This document describes the implementation of the replay system used in *Der Clou!*, based on the `src/inphdl/inphdl.c` and `src/replay/replay.c` source files.

## Overview

The replay system provides deterministic recording and playback of game sessions. It achieves this by:
1.  **Recording** user input actions (keyboard, mouse) and the exact simulation tick they occurred.
2.  **Playing back** these actions at the exact same tick during a replay session.
3.  **Ensuring Determinism** by seeding the Random Number Generator (RNG) with a stored seed and verifying synchronization using RNG checksums.

## File Format

Replay files use the `.rec` extension and are binary files consisting of a **Header** followed by a sequence of **Records**.

### 1. Header (12 Bytes)

The header contains metadata to identify the file and initialize the RNG.

| Offset | Field | Type | Size | Description |
| :--- | :--- | :--- | :--- | :--- |
| 0x00 | `magic` | `char[4]` | 4 | Magic string identifier: `"DREC"` (Der Clou RECording). |
| 0x04 | `version` | `uint32_t`| 4 | Format version number. Current version is `1`. |
| 0x08 | `rngSeed` | `uint32_t`| 4 | Initial seed for the Random Number Generator. |

### 2. Records (16 Bytes each)

Following the header, the file contains a linear sequence of input records. Each record represents a single inputs event processing step.

| Offset | Field | Type | Size | Description |
| :--- | :--- | :--- | :--- | :--- |
| 0x00 | `tick` | `uint64_t`| 8 | The global simulation tick number when this action occurred. |
| 0x08 | `action` | `int32_t` | 4 | Bitmask of the input action (see Input Actions below). |
| 0x0C | `rngChecksum`| `uint32_t`| 4 | Checksum of the RNG state at this tick. Used to detect desynchronization during playback. |

## Input Actions & Key Mappings

Input actions are represented as a 32-bit integer bitmask. Multiple flags can be set simultaneously.

### Action Flags (`src/inphdl/inphdl.h`)

| Flag Name | Value (Hex) | Bit | Description |
| :--- | :--- | :--- | :--- |
| `INP_UP` | `0x0001` | 0 | Up direction |
| `INP_DOWN` | `0x0002` | 1 | Down direction |
| `INP_LEFT` | `0x0004` | 2 | Left direction |
| `INP_RIGHT` | `0x0008` | 3 | Right direction |
| `INP_ESC` | `0x0010` | 4 | Escape / Cancel |
| `INP_LBUTTONP`| `0x0020` | 5 | Left Mouse Button Pressed |
| `INP_LBUTTONR`| `0x0040` | 6 | Left Mouse Button Released |
| `INP_RBUTTONP`| `0x0080` | 7 | Right Mouse Button Pressed |
| `INP_RBUTTONR`| `0x0100` | 8 | Right Mouse Button Released |
| `INP_NO_ESC` | `0x0400` | 10 | (Internal) Inhibits ESC |
| `INP_TIME` | `0x0800` | 11 | Timeout / Timer event |
| `INP_KEYBOARD`| `0x1000` | 12 | Event originated from Keyboard |
| `INP_FUNCTION_KEY`| `0x2000` | 13 | F1-F11 keys |
| `INP_SPACE` | `0x4000` | 14 | Space bar |
| `INP_MOUSE` | `0x8000` | 15 | Event originated from Mouse movement |
| `INP_MOUSEWHEEL`| `0x10000`| 16 | Event originated from Mouse wheel |
| `INP_QUIT` | `0x20000`| 17 | Application Quit signal |

### Key to Action Mapping (`src/inphdl/inphdl.c`)

When a key is pressed, it maps to a combination of flags.

| Physical Key | Mapped Action Mask | Hex Value |
| :--- | :--- | :--- |
| **Arrow Left** | `INP_KEYBOARD` \| `INP_LEFT` | `0x1004` |
| **Arrow Right** | `INP_KEYBOARD` \| `INP_RIGHT`| `0x1008` |
| **Arrow Up** | `INP_KEYBOARD` \| `INP_UP` | `0x1001` |
| **Arrow Down** | `INP_KEYBOARD` \| `INP_DOWN` | `0x1002` |
| **Escape** | `INP_KEYBOARD` \| `INP_ESC` | `0x1010` |
| **Space** | `INP_KEYBOARD` \| `INP_LBUTTONP` | `0x1020` |
| **Return / Enter** | `INP_KEYBOARD` \| `INP_LBUTTONP` | `0x1020` |
| **F1** - **F11** | `INP_KEYBOARD` \| `INP_FUNCTION_KEY` | `0x3000` |

*Note: Mouse movements and clicks set the `INP_MOUSE` flag (0x8000) combined with the directional or button flags.*

## File Format Example

Below is an annotated hex dump of a hypothetical replay file.

**Scenario**:
1.  Game starts (Seed 12345).
2.  At tick 60, user presses **Right Arrow**.
3.  At tick 120, user presses **Space** (Select).

### Hex Dump

```text
00000000: 44 52 45 43 01 00 00 00 39 30 00 00 3C 00 00 00  DREC....90..<...
00000010: 00 00 00 00 08 10 00 00 A1 B2 C3 D4 78 00 00 00  ............x...
00000020: 00 00 00 00 20 10 00 00 E5 F6 07 18              .... .......
```

### Line-by-Line Explanation

**Line 1: Header & First Record Request**
```text
44 52 45 43 01 00 00 00 39 30 00 00 3C 00 00 00
|________/  |_________/ |_________/ |_________/
 Magic       Version     Seed        Tick (Start)
 "DREC"      0x00000001  0x00003039  0x0000003C
                         (12345)     (60)
```
*   `44 52 45 43`: **Magic** "DREC". Identifies the file.
*   `01 00 00 00`: **Version** 1 (Little Endian).
*   `39 30 00 00`: **RNG Seed** 12345. The game uses this to initialize `random/random.c`.
*   `3C 00 00 00`: **Tick** (part 1 of 8 bytes). 60 (0x3C). This is the start of the first input record.

**Line 2: First Record Data & Second Record Start**
```text
00 00 00 00 08 10 00 00 A1 B2 C3 D4 78 00 00 00
|_________/ |_________/ |_________/ |_________/
 Tick (End)  Action      Checksum    Tick (Start)
 High Bytes  0x00001008  0xD4C3B2A1  0x00000078
             (KEY|RIGHT) (Example)   (120)
```
*   `00 00 00 00`: **Tick** (part 2/2). Completes the 64-bit tick value `60`.
*   `08 10 00 00`: **Action**. `0x1008`.
    *   `0x1000` (`INP_KEYBOARD`) + `0x0008` (`INP_RIGHT`).
    *   User pressed **Right Arrow**.
*   `A1 B2 C3 D4`: **RNG Checksum**. Value `0xD4C3B2A1`. The game compares its current RNG state to this. If they differ, synchronization is lost.
*   `78 00 00 00`: **Tick** (part 1/2 of next record). 120 (0x78).

**Line 3: Second Record Data**
```text
00 00 00 00 20 10 00 00 E5 F6 07 18
|_________/ |_________/ |_________/
 Tick (End)  Action      Checksum
 High Bytes  0x00001020  0x1807F6E5
             (KEY|LBTNP) (Example)
```
*   `00 00 00 00`: **Tick** (part 2/2). Completes the 64-bit tick value `120`.
*   `20 10 00 00`: **Action**. `0x1020`.
    *   `0x1000` (`INP_KEYBOARD`) + `0x0020` (`INP_LBUTTONP`).
    *   User pressed **Space** (Mapped to Left Button Press).
*   `E5 F6 07 18`: **RNG Checksum**. Value `0x1807F6E5`.

## How It Works

1.  **Start**, `Replay_Init` reads the header and seeds `random.c` with `rngSeed`.
2.  **Every Frame**, `Replay_GetInput(currentTick)` is called.
3.  If `currentTick` matches the `tick` of the next loaded record:
    *   The recorded `action` is injected into the input system, making the game believe the user just pressed those keys.
    *   The recorded `rngChecksum` is compared against the live game's RNG state. A mismatch triggers a warning log ("RNG Drift").
    *   The next record is read from disk.
4.  If `currentTick` does not match, normal processing continues (usually implying "no input" for that tick in a replay context).

## TypeScript Implementation

The TypeScript port (`src-js`) replicates this system using a Phaser Plugin and Service architecture.

### 1. ReplayService (`src/game/services/ReplayService.ts`)
- **Responsibility**: Handles file I/O, binary parsing, and data management.
- **Functionality**:
    - Loads `.rec` files using `fetch` and parses them with a custom `BrowserBufferReader` (handling Little Endian binary data).
    - Provides `getInput(tick)` to retrieve actions for a specific simulation tick.
    - Manages the `ReplayData` structure (Header + Records).

### 2. InputPlugin (`src/game/plugins/InputPlugin.ts`)
- **Responsibility**: Acts as the central input manager and the "Game Loop" driver for deterministic replay.
- **Key Mechanics**:
    - **Fixed Time Step**: Implements an accumulator mechanism in the Phaser `update` loop to ensure game logic processes exactly 60 times per second of game time, adhering to the original C logic.
    - **Input Mapping**: Listeners map Phaser input events (Keyboard, Mouse) to the `INP_*` bitmasks defined in `ReplayService`.
    - **Playback**: In Replay Mode, it pulls input actions from `ReplayService` based on the current simulation tick instead of reading live device input.
    - **Wait For**: Exposes `waitFor(mask)`, an async Promise-based equivalent of the C `inpWaitFor`. This allows the game logic (e.g., in Scenes) to pause execution until specific input criteria are met, while the underlying input loop continues to process time and events.

### 3. Integration Example (`GameStartScene`)

Game scenes interact with the system via `this.inputSystem`.

```typescript
// Initializing Replay Mode
await this.inputSystem.loadReplay('path/to/replay.rec');

// Waiting for input (mirrors C inpWaitFor)
// Waits for ANY input validation pattern, effectively ticking the simulation 
// until an event matching the mask occurs.
const action = await this.inputSystem.waitFor(INP_LBUTTONP | INP_KEYBOARD);
```

### 4. Playwright Testing
Automated tests use `main-menu.spec.ts` (and others) to verify the replay system.
- The test loads the game with `?replay=...`.
- The `InputPlugin` automatically starts playback.
- As the replay progresses, `InputPlugin` triggers `captureEvent` calls (via `window.captureEvent`) for each input action processed.
- Playwright captures these events and takes screenshots to verify visual state against expected golden images.
