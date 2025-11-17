# Architectural Recommendations: Modern Rewrite Considerations

## Overview

This document outlines what I'd change if building Prestige from scratch today (2025), based on modern best practices, current ecosystem maturity, and lessons learned from the existing codebase.

**TL;DR**: The current architecture is solid for 2019-2023, but a 2025 rewrite would benefit from React hooks, TypeScript-first design, modern state management, and better separation of concerns.

---

## 1. React Architecture

### Current State
- ✅ **Good**: Using Redux Toolkit (modern Redux)
- ✅ **Good**: TypeScript throughout
- ❌ **Outdated**: 100% Class Components (14 classes found)
- ❌ **Mixed**: Only 1 file uses React hooks

### Recommended Modern Approach

**Replace all Class Components with Function Components + Hooks**

```typescript
// ❌ Old (Current): FolderSelection.tsx
class SelectFolderZone extends Component<FolderProps> {
  private isChokReady = false;
  private currentFolder: string = "";

  componentDidMount() { /* ... */ }
  componentDidUpdate() { /* ... */ }
  componentWillUnmount() { /* ... */ }

  render() { /* ... */ }
}

// ✅ New (Recommended)
function FolderSelection() {
  const [isChokReady, setIsChokReady] = useState(false);
  const [currentFolder, setCurrentFolder] = useState("");
  const folderState = useAppSelector(selectFolderState);
  const dispatch = useAppDispatch();

  // Lifecycle hooks
  useEffect(() => {
    // componentDidMount logic
    return () => {
      // componentWillUnmount cleanup
    };
  }, []);

  useEffect(() => {
    // componentDidUpdate logic
  }, [folderState]);

  return <div>{/* JSX */}</div>;
}
```

**Benefits**:
- 🎯 **Simpler**: No `this`, no binding, no lifecycle confusion
- 🚀 **Performance**: Better with React 18+ concurrent features
- 🧪 **Testability**: Pure functions easier to test
- 📦 **Code reuse**: Custom hooks for shared logic
- 🔄 **Modern**: Aligns with React 18/19 direction

---

## 2. State Management

### Current State
- ✅ **Good**: Using Redux Toolkit (not legacy Redux)
- ❌ **Outdated**: Manual action creators & reducers
- ❌ **Verbose**: Lots of boilerplate

### Recommended Modern Approach

**Use RTK Query + Redux Toolkit Slices**

```typescript
// ❌ Old: Manual actions, reducers, types
// annot/types.tsx (100+ lines)
export const LOAD_ANNOT = "LOAD_ANNOT";
export const PUSH_TIMELINE = "PUSH_TIMELINE";
// ... 20 more constants

// annot/actions.tsx (200+ lines)
export const loadAnnot = (payload: AnnotationState) => ({
  type: LOAD_ANNOT,
  payload,
});

// annot/reducers.tsx (300+ lines)
export const annotationReducer = (state, action) => {
  switch (action.type) {
    case LOAD_ANNOT: /* ... */
    case PUSH_TIMELINE: /* ... */
    // ... 20 more cases
  }
};

// ✅ New: RTK Slice (50 lines total)
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

const annotSlice = createSlice({
  name: 'annot',
  initialState: annotCleanStore,
  reducers: {
    loadAnnot: (state, action: PayloadAction<AnnotationState>) => {
      return action.payload;
    },
    pushTimeline: (state, action: PayloadAction<Timeline>) => {
      state.timeline.push(action.payload);
    },
    // Automatically generates action creators & types!
  },
});

export const { loadAnnot, pushTimeline } = annotSlice.actions;
export default annotSlice.reducer;
```

**Benefits**:
- 📉 **70% less code**: Auto-generates actions/types
- 🛡️ **Type-safe**: Full TypeScript inference
- 🔧 **Immer integration**: Mutative updates that stay immutable
- 📖 **Readable**: One file instead of three

### For Async Operations: RTK Query

```typescript
// Current: Manual IPC calls scattered throughout components
await electronAPI.parseEAF(filePath);
await electronAPI.getMediaMetadata(filePath);

// Recommended: Centralized API layer
import { createApi } from '@reduxjs/toolkit/query';

const prestigeApi = createApi({
  baseQuery: electronBaseQuery, // Custom base query for Electron/PWA
  endpoints: (builder) => ({
    parseEAF: builder.query<EAFData, string>({
      query: (filePath) => ({ method: 'parseEAF', args: [filePath] }),
    }),
    getMediaMetadata: builder.query<MediaMetadata, string>({
      query: (filePath) => ({ method: 'getMediaMetadata', args: [filePath] }),
    }),
  }),
});

// In components:
const { data, isLoading, error } = useParseEAFQuery(filePath);
```

**Benefits**:
- 🔄 **Caching**: Automatic with invalidation
- ⏳ **Loading states**: Built-in
- ♻️ **Retry logic**: Configurable
- 🧩 **Normalization**: Optional entity adapter

---

## 3. Project Structure

### Current State
```
src/
├── components/          # UI components (mixed concerns)
├── store/              # Redux (good separation)
├── utils/              # Utilities
└── test/               # Tests
```

### Recommended Modern Approach

**Feature-based structure** (Domain-Driven Design)

```
src/
├── features/
│   ├── folder-selection/
│   │   ├── components/
│   │   │   ├── FolderPicker.tsx
│   │   │   └── FolderStatus.tsx
│   │   ├── hooks/
│   │   │   ├── useFolderWatcher.ts
│   │   │   └── useEAFParser.ts
│   │   ├── slices/
│   │   │   └── folderSlice.ts
│   │   ├── api/
│   │   │   └── folderApi.ts
│   │   ├── types.ts
│   │   └── index.ts
│   │
│   ├── video-player/
│   │   ├── components/
│   │   │   ├── VideoPlayer.tsx
│   │   │   ├── Timeline.tsx
│   │   │   └── Controls.tsx
│   │   ├── hooks/
│   │   │   ├── useVideoSync.ts
│   │   │   └── useWaveSurfer.ts
│   │   ├── slices/
│   │   │   └── playerSlice.ts
│   │   └── index.ts
│   │
│   ├── annotation-viewer/
│   ├── video-export/
│   └── deejay/
│
├── shared/
│   ├── components/      # Reusable UI
│   ├── hooks/          # Shared custom hooks
│   ├── utils/          # Pure functions
│   └── types/          # Global types
│
├── platform/           # Platform-specific code
│   ├── electron/
│   │   ├── ipc/
│   │   └── ffmpeg/
│   ├── web/
│   │   ├── file-system/
│   │   └── web-audio/
│   └── unified-api.ts
│
└── app/
    ├── store.ts
    ├── router.tsx
    └── App.tsx
```

**Benefits**:
- 🎯 **Cohesion**: Related code lives together
- 🔍 **Findability**: Feature-first navigation
- 🧪 **Testing**: Test entire features
- 🔧 **Refactoring**: Change one folder at a time
- 📦 **Code splitting**: Easy lazy loading

---

## 4. TypeScript Best Practices

### Current Issues

**1. Too many `any` types**
```typescript
// Current
interface LooseObject {
  [key: string]: any;  // ❌ Defeats TypeScript's purpose
}

// Better
interface AnnotMedia {
  blobURL: string;
  mimeType: string;
  name: string;
  path: string;
  duration?: number;
  // ... explicit properties
}

// For truly dynamic data
interface EAFContent {
  [key: string]: unknown;  // ✅ unknown forces type checking
}
```

**2. Missing strict mode**
```json
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,                      // ✅ Enable all strict checks
    "noUncheckedIndexedAccess": true,    // ✅ Array access safety
    "noImplicitOverride": true,          // ✅ Class safety
    "exactOptionalPropertyTypes": true   // ✅ Undefined vs missing
  }
}
```

**3. Runtime validation missing**
```typescript
// Current: Trust EAF file structure
const timeSlot = fileData.TIME_ORDER[0].TIME_SLOT; // ❌ Could crash

// Recommended: Zod validation
import { z } from 'zod';

const EAFSchema = z.object({
  ANNOTATION_DOCUMENT: z.object({
    TIME_ORDER: z.array(z.object({
      TIME_SLOT: z.array(z.object({
        TIME_SLOT_ID: z.string(),
        TIME_VALUE: z.number(),
      })),
    })),
  }),
});

const fileData = EAFSchema.parse(xmlData); // ✅ Type-safe + validated
```

---

## 5. FFmpeg Architecture

### Current State
- ✅ **Good**: Separate library (`video-export-lib.mjs`)
- ❌ **Fragile**: String concatenation for filter complex
- ❌ **Hard to test**: Embedded in IPC handlers

### Recommended Modern Approach

**Fluent FFmpeg Builder Pattern**

```typescript
// ❌ Current: String concat hell
let videoFilter = `[0:v]setpts=PTS/${V1Speed}[v]`;
if (A2) {
  videoFilter += `; complex audio filter string...`;
}

// ✅ New: Type-safe builder
class FFmpegClipBuilder {
  private video: VideoInput;
  private audioTracks: AudioInput[] = [];
  private subtitles?: SubtitleInput;

  addVideo(input: VideoInput) {
    this.video = input;
    return this;
  }

  addAudioTrack(input: AudioInput) {
    this.audioTracks.push(input);
    return this;
  }

  addSubtitles(text: string, options: SubtitleOptions) {
    this.subtitles = new SubtitleRenderer(text, options);
    return this;
  }

  build(): FFmpegCommand {
    return new FFmpegCommand({
      video: this.video.toFilter(),
      audio: new AudioMixer(this.audioTracks).toFilter(),
      subtitles: this.subtitles?.toFilter(),
    });
  }
}

// Usage
const clip = new FFmpegClipBuilder()
  .addVideo({ path: 'video.mp4', start: 0, stop: 10, speed: 1.5 })
  .addAudioTrack({ path: 'audio1.mp3', start: 0, stop: 10, volume: 0.9 })
  .addAudioTrack({ path: 'audio2.mp3', start: 0, stop: 8, volume: 0.3 })
  .addSubtitles('Hello world', { fontsize: 24, position: 'bottom' })
  .build();
```

**Benefits**:
- ✅ **Type-safe**: Catch errors at compile time
- ✅ **Testable**: Each class tested independently
- ✅ **Readable**: Self-documenting
- ✅ **Maintainable**: Change filter logic in one place

---

## 6. Testing Strategy

### Current State
- ✅ **Good**: Vitest setup
- ✅ **Good**: Integration tests exist
- ❌ **Coverage**: Many untested paths
- ❌ **Slow**: Tests import entire Redux store

### Recommended Modern Approach

**1. Test Structure**
```typescript
// Current: Minimal unit tests
describe('ExportVid', () => {
  it('exists', () => {
    expect(exportVideoClips).toBeDefined();
  });
});

// Recommended: Comprehensive test pyramid
describe('VideoExport', () => {
  describe('Unit: ClipBuilder', () => {
    it('calculates king output duration correctly', () => {
      const king = new AudioTrack({ duration: 10, speed: 1.5 });
      expect(king.outputDuration).toBe(6.67);
    });

    it('adjusts prince speed to match king', () => {
      const king = new AudioTrack({ duration: 10, speed: 1.5 });
      const prince = new AudioTrack({ duration: 8, speed: 1.0 });
      prince.syncToKing(king);
      expect(prince.speed).toBeCloseTo(1.2);
    });
  });

  describe('Integration: FFmpegBuilder', () => {
    it('generates correct filter complex', () => {
      const builder = new FFmpegClipBuilder()
        .addVideo({ /* ... */ })
        .addAudioTrack({ /* ... */ });

      const command = builder.build();
      expect(command.filterComplex).toMatchSnapshot();
    });
  });

  describe('E2E: Export Flow', () => {
    it('exports video with subtitles', async () => {
      const output = await exportVideo(mockClips, '/tmp/output.mp4');
      expect(output).toExist();
      expect(output).toHaveSubtitles();
    });
  });
});
```

**2. Mock Strategy**
```typescript
// Current: Import real electronAPI everywhere
import { electronAPI } from '../../utils/electronAPI';

// Recommended: Dependency injection
// features/video-export/VideoExporter.ts
export class VideoExporter {
  constructor(
    private ffmpeg: FFmpegService,
    private fileSystem: FileSystemAPI
  ) {}

  async export(clips: VideoClip[]) {
    // Use injected dependencies
    const output = await this.ffmpeg.process(clips);
    await this.fileSystem.writeFile(output);
  }
}

// In tests:
const mockFFmpeg = createMockFFmpegService();
const mockFS = createMockFileSystem();
const exporter = new VideoExporter(mockFFmpeg, mockFS);
```

---

## 7. PWA/Platform Abstraction

### Current State (After Our Work)
- ✅ **Good**: Unified API layer
- ✅ **Good**: Environment detection
- ❌ **Fragile**: Manual switching logic
- ❌ **Duplicated**: Similar code in electron/web APIs

### Recommended Modern Approach

**Adapter Pattern with Strategy**

```typescript
// Platform abstraction layer
interface PlatformAdapter {
  readonly name: string;
  readonly capabilities: Capabilities;

  fileSystem: FileSystemAPI;
  media: MediaAPI;
  export: ExportAPI;
}

// Concrete implementations
class ElectronAdapter implements PlatformAdapter {
  name = 'electron';
  capabilities = {
    videoExport: true,
    fileWatching: true,
    nativeDialogs: true,
  };

  fileSystem = new ElectronFileSystem();
  media = new ElectronMedia();
  export = new ElectronExport(this.media);
}

class WebAdapter implements PlatformAdapter {
  name = 'web';
  capabilities = {
    videoExport: false,
    fileWatching: false,
    nativeDialogs: false,
  };

  fileSystem = new FileSystemAccessAPI();
  media = new WebAudioMedia();
  export = new UnsupportedExport(); // Throws helpful errors
}

// Auto-detect platform
const platform = detectPlatform();
export const adapter: PlatformAdapter = platform === 'electron'
  ? new ElectronAdapter()
  : new WebAdapter();

// Usage in components
function FolderSelection() {
  const canExport = adapter.capabilities.videoExport;

  const handleOpen = async () => {
    const folder = await adapter.fileSystem.pickDirectory();
    // ...
  };

  return (
    <>
      <button onClick={handleOpen}>Open Folder</button>
      {canExport && <button onClick={exportVideo}>Export</button>}
      {!canExport && <Tooltip>Export requires desktop app</Tooltip>}
    </>
  );
}
```

---

## 8. Audio Processing

### Current State
- ✅ **Good**: King/prince algorithm works
- ❌ **Complex**: Hard to understand speed calculations
- ❌ **Rigid**: Embedded in export code

### Recommended Modern Approach

**Dedicated Audio Engine**

```typescript
// features/audio-engine/AudioEngine.ts
export class AudioEngine {
  /**
   * Calculate output duration after speed adjustment
   * Formula: outputDuration = inputDuration / speed
   */
  static calculateOutputDuration(
    inputDuration: number,
    speed: number
  ): number {
    if (speed <= 0) throw new Error('Speed must be positive');
    return inputDuration / speed;
  }

  /**
   * Calculate required speed for target to match reference duration
   */
  static calculateSyncSpeed(
    targetDuration: number,
    referenceDuration: number
  ): number {
    if (referenceDuration <= 0) throw new Error('Reference must be positive');
    return targetDuration / referenceDuration;
  }

  /**
   * Classify audio track based on volume threshold
   */
  static classifyTrack(volume: number): 'king' | 'prince' | 'silent' {
    const KING_THRESHOLD = 0.84; // Match DeeJay playback

    if (volume === 0) return 'silent';
    if (volume >= KING_THRESHOLD) return 'king';
    return 'prince';
  }
}

// Now the export code is simple:
const kingDuration = AudioEngine.calculateOutputDuration(
  king.inputDuration,
  king.speed
);

const princeSpeed = AudioEngine.calculateSyncSpeed(
  prince.inputDuration,
  kingDuration
);
```

**Benefits**:
- 📐 **Clear formulas**: Self-documenting
- 🧪 **Testable**: Pure functions
- 📚 **Reusable**: Use in export AND playback
- 🎯 **Single source of truth**: One place to fix bugs

---

## 9. Build & Tooling

### Current State
- ✅ **Good**: Vite (fast)
- ✅ **Good**: ESLint + Prettier
- ❌ **Missing**: Pre-commit hooks consistently run
- ❌ **Missing**: Bundle analysis

### Recommended Additions

**1. Pre-commit Enforcement**
```json
// package.json
{
  "husky": {
    "hooks": {
      "pre-commit": "lint-staged",
      "pre-push": "npm test"
    }
  },
  "lint-staged": {
    "*.{ts,tsx}": [
      "eslint --fix",
      "prettier --write",
      "vitest related --run" // Run related tests
    ]
  }
}
```

**2. Bundle Analysis**
```json
{
  "scripts": {
    "analyze": "vite-bundle-visualizer",
    "build:prod": "npm run analyze && vite build"
  }
}
```

**3. Dependency Management**
```bash
# Auto-update dependencies safely
npm install -g npm-check-updates
ncu -u --target minor  # Only minor/patch updates
npm install
npm test  # Verify nothing broke
```

---

## 10. Documentation

### Current State
- ✅ **Good**: Extensive markdown docs
- ❌ **Missing**: Code documentation (TSDoc)
- ❌ **Missing**: Architecture diagrams
- ❌ **Outdated**: Some docs reference old patterns

### Recommended Modern Approach

**1. Inline TSDoc**
```typescript
/**
 * Exports video clips with synchronized multilingual audio
 *
 * @param clips - Array of video clips with timing and audio data
 * @param outputPath - Destination file path for exported video
 * @param options - Optional export configuration
 * @returns Promise resolving to export result with metadata
 *
 * @throws {FFmpegError} If video processing fails
 * @throws {FileSystemError} If output path is invalid
 *
 * @example
 * ```typescript
 * const clips = buildClipsFromMilestones(milestones);
 * const result = await exportVideo(clips, '/tmp/output.mp4', {
 *   resolution: '1280x720',
 *   bitrate: '2000k'
 * });
 * console.log(`Exported ${result.clips.length} clips`);
 * ```
 */
export async function exportVideo(
  clips: VideoClip[],
  outputPath: string,
  options?: ExportOptions
): Promise<ExportResult> {
  // ...
}
```

**2. Architecture Decision Records (ADRs)**
```markdown
# ADR 001: Use Web Audio API for PWA Instead of FFmpeg

## Status
Accepted

## Context
Need to play audio segments in PWA mode without FFmpeg

## Decision
Use Web Audio API with lazy loading and LRU cache

## Consequences
✅ Fast playback from local disk
✅ No server uploads needed
✅ Browser-native performance
❌ Can't use for video export
❌ Requires modern browser
```

**3. Interactive Storybook**
```typescript
// features/video-player/VideoPlayer.stories.tsx
export default {
  title: 'VideoPlayer',
  component: VideoPlayer,
};

export const WithSubtitles = () => (
  <VideoPlayer
    src="/sample.mp4"
    subtitles={[
      { start: 0, end: 5, text: 'Hello world' },
    ]}
  />
);

export const MultiTrackAudio = () => (
  <VideoPlayer
    src="/sample.mp4"
    audioTracks={[
      { id: 'careful', label: 'Careful', enabled: true },
      { id: 'translation', label: 'Translation', enabled: false },
    ]}
  />
);
```

---

## 11. Performance Optimizations

### Current Issues
1. **No code splitting** - Entire app loads at once
2. **No memoization** - Expensive recalculations
3. **No virtualization** - Large annotation tables lag

### Recommended Solutions

**1. Code Splitting**
```typescript
// app/router.tsx
import { lazy, Suspense } from 'react';

const VideoExport = lazy(() => import('../features/video-export'));
const DeeJay = lazy(() => import('../features/deejay'));

function App() {
  return (
    <Suspense fallback={<Loading />}>
      <Routes>
        <Route path="/export" element={<VideoExport />} />
        <Route path="/deejay" element={<DeeJay />} />
      </Routes>
    </Suspense>
  );
}
```

**2. Memoization**
```typescript
// Current: Recalculates on every render
const clips = milestones.map(m => buildClip(m)); // ❌ Expensive

// Recommended: Memoize
const clips = useMemo(
  () => milestones.map(m => buildClip(m)),
  [milestones] // Only recalc when milestones change
);

// For Redux selectors
import { createSelector } from '@reduxjs/toolkit';

const selectMilestones = (state) => state.annot.timeline[0]?.milestones;
const selectClips = createSelector(
  [selectMilestones],
  (milestones) => milestones.map(m => buildClip(m))
  // Only recalculates when milestones change
);
```

**3. Virtualization**
```typescript
// Current: Renders all 1000 rows
<table>
  {annotations.map(a => <AnnotationRow key={a.id} {...a} />)}
</table>

// Recommended: Only render visible rows
import { useVirtualizer } from '@tanstack/react-virtual';

function AnnotationTable({ annotations }) {
  const virtualizer = useVirtualizer({
    count: annotations.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 50, // Row height
  });

  return (
    <div ref={parentRef} style={{ height: '400px', overflow: 'auto' }}>
      <div style={{ height: virtualizer.getTotalSize() }}>
        {virtualizer.getVirtualItems().map(virtualRow => (
          <AnnotationRow
            key={annotations[virtualRow.index].id}
            {...annotations[virtualRow.index]}
          />
        ))}
      </div>
    </div>
  );
}
```

---

## 12. Error Handling

### Current Issues
```typescript
// Generic error handling
try {
  await electronAPI.parseEAF(path);
} catch (err) {
  console.error('Error:', err); // ❌ Lost context
  toast.error('An error occurred'); // ❌ Vague
}
```

### Recommended Approach

**Custom Error Classes + Error Boundaries**

```typescript
// shared/errors/AppErrors.ts
export class PrestigeError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly userMessage: string,
    public readonly recoverable: boolean = true
  ) {
    super(message);
    this.name = this.constructor.name;
  }
}

export class EAFParseError extends PrestigeError {
  constructor(filePath: string, cause: unknown) {
    super(
      `Failed to parse EAF file: ${filePath}`,
      'EAF_PARSE_ERROR',
      'This annotation file appears to be corrupted. Please check the file in ELAN.',
      false
    );
    this.cause = cause;
  }
}

export class FFmpegError extends PrestigeError {
  constructor(command: string, exitCode: number, stderr: string) {
    super(
      `FFmpeg failed with exit code ${exitCode}`,
      'FFMPEG_ERROR',
      'Video export failed. Check that your media files are not corrupted.',
      true
    );
    this.cause = { command, exitCode, stderr };
  }
}

// In code:
try {
  await electronAPI.parseEAF(path);
} catch (err) {
  if (err instanceof SyntaxError) {
    throw new EAFParseError(path, err);
  }
  throw err;
}

// Error boundary catches and shows user-friendly message
<ErrorBoundary fallback={(error) => (
  <Alert severity="error">
    <strong>{error.userMessage}</strong>
    {error.recoverable && <Button onClick={retry}>Try Again</Button>}
  </Alert>
)}>
  <App />
</ErrorBoundary>
```

---

## Priority Ranking

If I could only change 5 things (highest impact):

### 1. ⭐⭐⭐⭐⭐ **Convert to Function Components + Hooks**
**Impact**: Massive code reduction, better performance, modern patterns
**Effort**: High (refactor all components)
**Risk**: Medium (extensive testing needed)

### 2. ⭐⭐⭐⭐⭐ **Use RTK Slices Instead of Manual Redux**
**Impact**: 70% less boilerplate, better TypeScript
**Effort**: Medium (refactor store layer)
**Risk**: Low (Redux Toolkit is stable)

### 3. ⭐⭐⭐⭐ **Feature-Based Project Structure**
**Impact**: Improved maintainability and developer experience
**Effort**: Medium (reorganize files)
**Risk**: Low (just moving files)

### 4. ⭐⭐⭐⭐ **FFmpeg Builder Pattern**
**Impact**: Testable, maintainable video export
**Effort**: Medium (refactor export logic)
**Risk**: Medium (core feature)

### 5. ⭐⭐⭐ **Add Comprehensive Tests**
**Impact**: Confidence in refactoring, fewer bugs
**Effort**: High (write lots of tests)
**Risk**: Low (just adds safety)

---

## Migration Strategy

If refactoring the existing codebase (not rewriting):

### Phase 1: Foundation (2 weeks)
1. ✅ Set up strict TypeScript
2. ✅ Convert store to RTK slices
3. ✅ Add comprehensive error types
4. ✅ Set up Storybook

### Phase 2: Components (4 weeks)
1. ✅ Convert one component to hooks (pilot)
2. ✅ Write migration guide
3. ✅ Convert all components in parallel
4. ✅ Add tests for each conversion

### Phase 3: Architecture (2 weeks)
1. ✅ Reorganize to feature-based structure
2. ✅ Extract FFmpeg builder
3. ✅ Add platform adapter layer
4. ✅ Document new patterns

### Phase 4: Polish (2 weeks)
1. ✅ Add code splitting
2. ✅ Add performance optimizations
3. ✅ Update all documentation
4. ✅ Comprehensive E2E tests

**Total: ~10 weeks for full modernization**

---

## Conclusion

The current Prestige architecture is **solid for a 2019-2023 project**. It uses Redux Toolkit (good!), TypeScript (good!), and has separated concerns reasonably well.

For a **2025 rebuild**, I'd focus on:
1. 🪝 **Hooks over classes** - Modern React patterns
2. 🎯 **Less boilerplate** - RTK slices, better abstractions
3. 📁 **Better organization** - Feature-based structure
4. 🧪 **More tests** - Confidence to refactor
5. 📚 **Better docs** - TSDoc, Storybook, ADRs

**But honestly?** The existing codebase is maintainable and working well. I'd only do a major refactor if:
- Adding substantial new features (mobile support, cloud sync)
- Onboarding new developers who know modern React
- Performance becomes a real issue

Otherwise, incremental improvements (convert one feature at a time to hooks) would be my approach.

---

**Your thoughts?** Want me to elaborate on any of these recommendations?
