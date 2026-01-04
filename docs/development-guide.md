# Development Guide

## Prerequisites

### General
*   **Git**
*   **Devbox** (Recommended): The project includes a `devbox.json` which provides a consistent environment with `cmake`, `conan`, `nodejs`, etc.

### Core (Native)
*   **C Compiler:** GCC or Clang
*   **Build Tools:** CMake, Conan
*   **Libraries:** SDL2

### Web
*   **Node.js** (v18+)
*   **NPM**

## Setup

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/jochenjagers/DerClou.git
    cd DerClou
    ```

2.  **Initialize Environment (Devbox):**
    ```bash
    devbox shell
    ```

## Building & Running

### Part 1: DerClou Core

**Native Build (macOS/Linux):**
```bash
./build-pc.sh
```
*   Artifact location: `gamedata/DerClou`
*   **To Run:**
    ```bash
    cd gamedata
    ./DerClou
    ```

**Web Build (Emscripten):**
```bash
./build-web.sh
```
*   Artifact location: `build-emscripten/`

### Part 2: Web Client

**Install Dependencies:**
```bash
cd src-js
npm install
```

**Run Development Server:**
```bash
npm run dev
```
*   Access at: `http://localhost:5173`

**Production Build:**
```bash
npm run build
```
*   Artifact location: `src-js/dist/`

## Code Style
*   **C Core:** Follows `.clang-format`. Run `clang-format -i src/**/*.c` before committing.
*   **TypeScript:** Follows standard TypeScript conventions (enforced via VS Code settings or future ESLint).
