# Component Inventory: Web Client

## Overview
The Web Client is built using **Phaser 3**. In this architecture, "Components" primarily refer to **Scenes** and **Game Objects**.

## Components

### Scenes
State containers for different parts of the game (Menus, Gameplay, etc.).

| Component | Path | Description |
|-----------|------|-------------|
| **Game** | `src/game/scenes/Game.ts` | The main entry scene. Currently renders the logo and welcome text. |
| **ReplayTestScene** | `src/game/scenes/ReplayTestScene.ts` | Test scene for recording and playing back input sequences. |
| **ScreenshotTestScene** | `src/game/scenes/ScreenshotTestScene.ts` | Test scene for automated screenshot capture. |

### Services
Reusable logic modules managed by the game or scenes.

| Component | Path | Description |
|-----------|------|-------------|
| **InputHandler** | `src/game/services/InputHandler.ts` | Abstraction for input management to support replay injection. |
| **Random** | `src/game/services/Random.ts` | Deterministic random number generator. |
| **ReplayService** | `src/game/services/ReplayService.ts` | Manages recording and playback state. |
| **ScreenshotService** | `src/game/services/ScreenshotService.ts` | Manages screenshot capture and saving. |

### UI Elements
*(None implemented yet)*

## Asset Categories
Assets are loaded in `Game.preload()`:

*   **Images:**
    *   `background` (`assets/bg.png`)
    *   `logo` (`assets/logo.png`)
