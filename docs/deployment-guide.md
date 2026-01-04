# Deployment Guide

## CI/CD Pipeline
The project uses **GitHub Actions** for Continuous Integration and Deployment.
**Configuration:** `.github/workflows/cmake.yml`

### Workflows

#### 1. Linux Build (`build_linux`)
*   **Trigger:** Push to `main` or Pull Request.
*   **Environment:** `ubuntu-latest`.
*   **Steps:**
    1.  Install `libsdl2-dev`.
    2.  Configure CMake (Release mode).
    3.  Build project.
    4.  **SonarCloud Analysis:** Runs static code analysis using `sonar-scanner`.

#### 2. Windows Build & Release (`build_windows`)
*   **Trigger:** Push to `main` or Pull Request.
*   **Environment:** `ubuntu-latest` (Cross-compilation).
*   **Steps:**
    1.  Install `mingw-w64`.
    2.  Cross-compile using `cmake/mingw.cmake`.
    3.  **Package:** Zips the build into `DerClou-latest-german.zip`.
    4.  **Release:**
        *   Updates the `latest` git tag.
        *   Creates a GitHub Release marked as "Pre-release".
        *   Uploads the zip artifact.

## Web Deployment
*(Currently manual)*

To deploy the **Web Client**:
1.  Run `npm run build` in `src-js/`.
2.  Deploy the `src-js/dist/` folder to any static hosting service (GitHub Pages, Netlify, Vercel).

To deploy the **Core (WASM)**:
1.  Run `./build-web.sh`.
2.  Host the output (HTML/WASM/JS) on a web server capable of serving WASM MIME types.
