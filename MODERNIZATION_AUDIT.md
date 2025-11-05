# Prestige Modernization Audit

## Executive Summary

Prestige is currently running on:
- **Electron 5.0.4** (Released 2019, **CRITICAL** security vulnerabilities)
- **React 16.8.6** (Old, current is 18.x)
- **Node.js insecure configuration** (`nodeIntegration: true`, `webSecurity: false`)

**Security Risk Level: CRITICAL**

The application has extensive Node.js operations running in the renderer process, which is a **major security vulnerability** that allows potential remote code execution if any malicious content is loaded.

## Current Security Violations

### 1. Electron Configuration Issues (public/electron.js:23)

```javascript
webPreferences: {
  webSecurity: false,        // ❌ CRITICAL: Disables web security
  nodeIntegration: true      // ❌ CRITICAL: Allows Node.js in renderer
}
```

**Missing Security Features:**
- ❌ No `contextIsolation: true`
- ❌ No `nodeIntegration: false`
- ❌ No preload script
- ❌ No Content Security Policy
- ❌ Uses deprecated `remote` module

### 2. Renderer Process Backend Operations

The following Node.js modules are being used **directly in the React frontend**:

#### File System Operations
- **FolderSelection.tsx** (Lines 307, 488, 779, 932):
  - `require('fs')` - Direct filesystem access
  - `require('fs-extra')` - Extended filesystem operations
  - `fs.readdirSync()` - Directory listing
  - `fs.readFileSync()` - Reading EAF/XML files
  - `fs.writeFile()` - Writing JSON export files
  - `fs.existsSync()` - File existence checks
  - `fs.unlinkSync()` - File deletion

- **testFs.tsx** (Line 4):
  - `require('fs-extra')`
  - `fs.readdirSync('.')` - Directory operations in renderer

#### File Watching
- **FolderSelection.tsx** (Line 89):
  - `require('chokidar')` - **ENTIRE FILE WATCHER IN RENDERER!**
  - Monitors file system changes
  - Triggers media processing on file changes

#### FFmpeg Video/Audio Processing
- **FolderSelection.tsx** (Lines 121, 512-516, 719-738):
  - `require('ffmpeg')` - Video conversion
  - `require('fluent-ffmpeg')` - FFmpeg operations
  - `require('ffmpeg-static-electron')` - Binary paths
  - `require('ffprobe-static-electron')` - Probe binary paths
  - Audio normalization, merging, MP3 conversion
  - Video format conversion

#### Path Manipulation
- **globalFunctions.tsx** (Line 45):
  - `require('path-parse')` - Path parsing
- **FolderSelection.tsx** (Multiple lines):
  - `require('path')` - Path operations

#### Other Operations
- **FolderSelection.tsx** (Line 114):
  - `require('mime')` - MIME type detection
- **FolderSelection.tsx** (Line 104, 242, etc.):
  - `require('file-url')` - File URL conversion
- **FolderSelection.tsx** (Line 778):
  - `require('xml2js')` - XML parsing for EAF files
- **FolderSelection.tsx** (Line 490):
  - `require('electron').remote.app` - **Deprecated remote module!**

## Migration Strategy - Phased Approach

### Phase 1: Infrastructure Setup
**Goal:** Create secure IPC communication layer

1. Create `preload.js` with Context Bridge API
2. Create IPC handlers in main process
3. Keep existing functionality working via compatibility layer

**Files to Create:**
- `/public/preload.js` - Context bridge
- `/public/ipc-handlers.js` - Main process handlers

### Phase 2: File System Operations
**Goal:** Move all fs operations to main process

**Migrate:**
- Directory reading/listing
- File reading (EAF/XML files)
- File writing (JSON exports)
- File existence checks
- Chrome cache deletion

**Files to Modify:**
- `src/components/testFs.tsx`
- `src/components/FolderSelection/FolderSelection.tsx` (dirSnapshot, hasLocal, setLocal, exportSession, deleteChromeCache)

### Phase 3: Chokidar File Watching
**Goal:** Move file watching to main process

**Strategy:**
- Create file watcher service in main process
- Send events to renderer via IPC
- Maintain same event structure for compatibility

**Files to Modify:**
- `src/components/FolderSelection/FolderSelection.tsx` (startWatcher method)

### Phase 4: FFmpeg Operations
**Goal:** Move all media processing to main process

**Migrate:**
- Video/audio conversion
- Audio normalization
- MP3 conversion
- Audio merging
- FFprobe metadata extraction

**Files to Modify:**
- `src/components/FolderSelection/FolderSelection.tsx` (loadAnnot, convertToMP3, chokFileDescribe)

### Phase 5: Path & Utility Operations
**Goal:** Move path operations to secure context

**Migrate:**
- Path parsing (path-parse)
- MIME type detection
- File URL generation

**Files to Modify:**
- `src/components/globalFunctions.tsx` (safeParse function)
- `src/components/FolderSelection/FolderSelection.tsx` (multiple locations)

### Phase 6: Enable Security Settings
**Goal:** Lock down Electron security

**Changes to `public/electron.js`:**
```javascript
webPreferences: {
  contextIsolation: true,      // ✅ Isolate context
  nodeIntegration: false,       // ✅ Disable node in renderer
  enableRemoteModule: false,    // ✅ Disable remote
  preload: path.join(__dirname, 'preload.js'), // ✅ Use preload
  webSecurity: true,           // ✅ Enable web security
  sandbox: true                // ✅ Enable sandbox
}
```

### Phase 7: Testing
- Test file loading
- Test file watching
- Test FFmpeg conversions
- Test EAF parsing
- Test all user workflows

### Phase 8: Upgrade Electron
**Target:** Electron 33+ (latest LTS)

**Major changes:**
- Remove deprecated APIs
- Update to new security defaults
- Test with modern APIs

### Phase 9: Upgrade React
**Target:** React 18.x

**Changes needed:**
- Update ReactDOM.render to createRoot
- Update testing library
- Update Material-UI to MUI v5
- Address deprecated lifecycle methods

## Vulnerabilities Found (GitHub Security Alert)

From the repository scan: **106 vulnerabilities**
- 15 Critical
- 44 High
- 40 Moderate
- 7 Low

These will be significantly reduced by upgrading dependencies.

## Implementation Notes

### Build Requirements
- Current build requires `NODE_OPTIONS=--openssl-legacy-provider` due to old webpack
- Using `--ignore-scripts` for npm install due to fibers/node-sass incompatibility with Node 22
- Tests have some failures (not blocking for security work)

### Compatibility Considerations
- Must maintain localStorage caching mechanism
- Preserve EAF file format compatibility
- Keep existing Redux state structure
- Maintain file naming conventions for annotations

## Success Criteria

1. ✅ No `require()` calls in renderer process code
2. ✅ `nodeIntegration: false` enabled
3. ✅ `contextIsolation: true` enabled
4. ✅ All file operations via IPC
5. ✅ All FFmpeg operations in main process
6. ✅ Modern Electron version (20+)
7. ✅ Modern React version (18+)
8. ✅ All existing functionality preserved
9. ✅ Vulnerability count reduced to <20

## Timeline Estimate

- **Phase 1-2:** 2-3 hours (Infrastructure + FS ops)
- **Phase 3:** 1-2 hours (Chokidar)
- **Phase 4:** 2-3 hours (FFmpeg)
- **Phase 5:** 1 hour (Path/utils)
- **Phase 6:** 30 minutes (Security settings)
- **Phase 7:** 2-3 hours (Testing)
- **Phase 8:** 2-3 hours (Electron upgrade)
- **Phase 9:** 3-4 hours (React upgrade)

**Total: ~15-20 hours of work**
