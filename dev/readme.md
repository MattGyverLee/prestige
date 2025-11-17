# Prestige Developer Guide

Prestige is an Electron application backed by React, Redux Toolkit, and Vite that lets researchers and community partners explore Basic Oral Language Documentation (BOLD) corpora. This guide captures the developer-facing details that used to sit in the user README so that the root document can stay focused on people who simply want to install and use the packaged app.

## Architecture & Stack

- React 18 + Vite drive the renderer process. State is coordinated with Redux Toolkit and React-Redux.
- Electron (with `electron-builder`) packages the desktop app, exposes file-system capabilities (chokidar, ffmpeg) through the secure `electronAPI`, and injects helper binaries from `bin/<os>/<arch>`.
- WaveSurfer powers the multi-track timeline visualization, while ffmpeg handles media merges and exports.
- The project originally launched on Create React App + CRACO. Historical constraints are documented in `MODERNIZATION_*.md`, `ELECTRON_DEV_SETUP.md`, and `MIGRATION_PROGRESS.md`.

## Prerequisites

- Node.js `^20.19.0 || >=22.12.0` and npm `>=10` (see `package.json` `engines`). `nvm` or `fnm` is recommended to juggle versions.
- Windows is the primary build/packaging target today; macOS packaging exists in `electron-builder` config but is largely untested.
- Yarn 1.22 is referenced in historical scripts. Using npm is the default, but `yarn install` still works if you prefer.
- Optional: Chrome React/Redux DevTools extensions for better debugging parity inside Electron.

## Installation

```bash
npm install
# or
yarn install
```

This installs renderer dependencies plus the native modules required by Electron/ffmpeg (`electron-builder install-app-deps` runs automatically through `postinstall`).

## Local Development

### Electron renderer + main process

1. Install the Chrome React and Redux DevTools extensions locally.
2. Run `npm run electron-dev` (or `yarn electron-dev`).  
   - Vite serves the renderer on port `5175`.
   - `wait-on` ensures the renderer is ready before `electron public/electron-dev.js` boots.
   - The script injects the DevTools extensions the first time it runs.
3. In VS Code select the `Electron All` debug configuration (see `.vscode/launch.json`) so breakpoints stick across preload/main/renderer contexts. Subsequent launches can be done with `F5`.

PowerShell users can also run `npm run electron-dev:ps` to execute the helper script in `start-dev.ps1`.

### Web-only development (PWA mode)

`npm run web-dev` serves the renderer with `.env.web` enabling PWA features:
- **File System Access API**: Open local folders directly from browser (Chrome 86+, Edge 86+, Safari 15.2+)
- **Web Audio API**: Lazy-loaded segment playback with caching
- **Service Worker**: Offline support after first visit
- **Environment detection**: `unifiedAPI` automatically uses browser APIs instead of Electron

Remember that Electron-only APIs (FFmpeg export, audio merging, file watching) are unavailable in PWA mode. The `isFeatureAvailable()` helper (see `src/utils/unifiedAPI.ts`) guards these features automatically.

**PWA Development Tips:**
- Use HTTPS or localhost (service workers require secure context)
- Test in Chrome/Edge with File System Access API support
- Check DevTools → Application → Service Workers for SW status
- Monitor DevTools → Application → Storage for IndexedDB handles

See **[PWA_GUIDE.md](../PWA_GUIDE.md)** for complete PWA documentation.

### Additional scripts

- `npm run electron-debug`: Run the Electron renderer without spawning the packaged Electron shell (useful for storybook-style debugging).
- `npm run web-prod`: Production web build for hosting static previews.
- `npm run electron-pack`: Builds the renderer assets using the Electron environment variables; invoked before packaging.

## Testing

- `npm run test` / `npm run test:watch`: Vitest in watch mode with the DOM environment described in `vitest.config.ts`.
- `npm run test:unit`, `npm run test:coverage`, `npm run test:ui`: Additional Vitest targets for CI or focused debugging.
- Cypress UI tests live in `cypress/` (see `HOW_TO_VIEW_TESTS.md`, `TESTING.md`, and `TESTING_QUICK_START.md` for workflows).
- `npm run generate:fixtures` produces synthetic media fixtures used across integration tests.

### Current coverage snapshot

- **Component smoke + snapshots** (`src/__tests__/App.test.tsx`, `src/components/__tests__/*.test.tsx`) ensure the App shell, AnnotationTable, FileList, and DeeJay renderer pieces mount with representative props, while snapshot files catch accidental UI regressions.
- **Redux reducers** (`src/store/*/__tests__/*.test.ts[x]`) cover the player, tree, annot, deeJay, and system slices so timeline merges, watcher events, and playback state transitions cannot regress silently.
- **Integration suites** (`src/test/integration/*.integration.test.ts`) exercise real workflows: folder loading and timeline creation, chokidar-driven file watching, DeeJay playback controls, and video export/FFmpeg orchestration.
- **Media/export helpers** are validated via `public/__tests__/video-export-lib.test.js`, which guards the clip-merging math that Electron calls when exporting.
- **Fixture generators** (`src/test/fixtures/__tests__/timeline-generator.test.ts`) guarantee our synthetic timelines stay realistic, keeping higher-level tests honest even as fixture requirements evolve.
- **End-to-end sanity** is covered by the Cypress spec in `cypress/integration/prestige-tests/PrestigeElec.test.js`, which boots the packaged Electron app and walks through the happy-path user flow.

## Building & Packaging

```bash
npm run electron-pack   # Build renderer assets into build/
npm run dist            # Package installers with electron-builder
```

Outputs:

- `dist/Prestige Setup <version>.exe` – Windows installer.
- `dist/win-unpacked/Prestige.exe` – Unpacked Windows binary (handy for portable testing).

Only Windows builds are regularly tested. macOS/Linux flows exist in `package.json` but require additional validation.

## Preparing for Production

- Security warnings are disabled for dev convenience in `public/electron-dev.js` and `public/electron-debug.js` (line 9). Enable them when testing production builds and resolve every [Electron security warning](https://github.com/electron/electron/blob/master/docs/tutorial/security.md#electron-security-warnings).
- Review `SECURITY_VULNERABILITIES_ANALYSIS.md`, `MODERNIZATION_AUDIT.md`, and `MODERNIZATION_COMPLETE.md` when touching dependencies.

## Debugging the Media Pipeline

- Folder ingestion happens in `SelectFolderZone` (`src/components/FolderSelection/FolderSelection.tsx`). The chokidar watcher notices `.eaf`, audio, and video files, generates metadata via `electronAPI`, and feeds them into Redux (`tree` and `annot` slices).
- Export flow uses `electronAPI.exportVideo` and custom ffmpeg wrappers in `public/video-export-lib.mjs`.
- Reference flow (historical notes):
  - Load → Click Load → `LoadLocal`  
  - @391 Folder Update → @401 Folder Update → @415 `onNewFolder`  
  - 417 start chokidar → 420 `readyPlayURL = ""` → @577 `LoadFileWS`

## Useful References

- `ELECTRON_DEV_SETUP.md` – Screenshots and environment setup walkthroughs.
- `VIDEO_EXPORT_TESTS_README.md` – Notes on validating the ffmpeg export pipeline.
- `TESTING*.md` – Detailed test strategy.
- `MIGRATION_PROGRESS.md`, `MODERNIZATION_AUDIT.md`, `MODERNIZATION_COMPLETE.md` – Architecture history.
- `mui.md`, `mui/` – UI component guidelines.

For questions, open an issue or reach out to Matthew Lee (`langtech_cameroon@sil.org`).
