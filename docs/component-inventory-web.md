# Component Inventory: Web Client

## Overview
The Web Client is built using **Phaser 3**. In this architecture, "Components" primarily refer to **Scenes** and **Game Objects**.

## Components

### Scenes
State containers for different parts of the game (Menus, Gameplay, etc.).

| Component | Path | Description |
|-----------|------|-------------|
| **Game** | `src/game/scenes/Game.ts` | The main entry scene. Currently renders the logo and welcome text. |

### UI Elements
*(None implemented yet)*

## Asset Categories
Assets are loaded in `Game.preload()`:

*   **Images:**
    *   `background` (`assets/bg.png`)
    *   `logo` (`assets/logo.png`)
